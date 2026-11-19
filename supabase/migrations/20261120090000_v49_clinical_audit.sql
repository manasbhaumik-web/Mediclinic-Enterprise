-- v49: an audit trail for patient and clinical data, and two reference tables closed to visitors.
--
-- Until now nothing recorded who opened or changed a patient's record. This adds:
--
--   clinical_audit       append-only. One row per create, update or delete of a patient, visit, consultation note,
--                        prescription, lab or imaging order, or device result, and one row when a person opens a
--                        patient's record. It stores WHO, WHEN, WHAT KIND, WHICH ROW and WHICH FIELDS changed,
--                        never the values themselves, so the log is not a second copy of the patient data.
--   Nobody can edit or delete it: not an administrator, not a doctor. Only administrators can read it.
--
--   audit_clinical_change  trigger that writes the rows for changes (it runs for every change, whichever screen or
--                          function made it).
--   audit_record_view      called by the screens when a patient's record is opened (one row per person, patient and
--                          screen every ten minutes).
--   audit_summary          counts for the administrator's page.
--
-- Also: clinical_embeddings and diseases could be read by a visitor who is not signed in. They are now signed-in only.

CREATE TABLE IF NOT EXISTS public.clinical_audit (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  at timestamptz NOT NULL DEFAULT now(),
  actor uuid,
  actor_roles text[] NOT NULL DEFAULT '{}',
  action text NOT NULL CHECK (action IN ('create', 'update', 'delete', 'view')),
  entity text NOT NULL,
  entity_id text NOT NULL,
  patient_id uuid,
  visit_id uuid,
  fields text[] NOT NULL DEFAULT '{}',
  context text
);

CREATE INDEX IF NOT EXISTS clinical_audit_patient_idx ON public.clinical_audit (patient_id, at DESC);
CREATE INDEX IF NOT EXISTS clinical_audit_actor_idx ON public.clinical_audit (actor, at DESC);
CREATE INDEX IF NOT EXISTS clinical_audit_at_idx ON public.clinical_audit (at DESC);

ALTER TABLE public.clinical_audit ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Administrators can read the clinical audit" ON public.clinical_audit;
CREATE POLICY "Administrators can read the clinical audit" ON public.clinical_audit FOR SELECT USING (public.has_any_role(ARRAY['admin']));

REVOKE ALL ON public.clinical_audit FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.clinical_audit TO authenticated;

-- Append-only: refuse any change or removal, whoever asks.
CREATE OR REPLACE FUNCTION public.audit_protect()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  RAISE EXCEPTION 'The audit trail cannot be changed or removed.' USING ERRCODE = '42501';
END;
$function$;

DROP TRIGGER IF EXISTS clinical_audit_no_change ON public.clinical_audit;
CREATE TRIGGER clinical_audit_no_change BEFORE UPDATE OR DELETE ON public.clinical_audit FOR EACH ROW EXECUTE FUNCTION public.audit_protect();
DROP TRIGGER IF EXISTS clinical_audit_no_truncate ON public.clinical_audit;
CREATE TRIGGER clinical_audit_no_truncate BEFORE TRUNCATE ON public.clinical_audit FOR EACH STATEMENT EXECUTE FUNCTION public.audit_protect();

-- ---- recording changes ---------------------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.audit_clinical_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_action text;
  v_row jsonb;
  v_old jsonb;
  v_new jsonb;
  v_fields text[] := '{}';
  v_patient uuid;
  v_visit uuid;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_action := 'create';
    v_row := to_jsonb(NEW);
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'update';
    v_old := to_jsonb(OLD);
    v_new := to_jsonb(NEW);
    v_row := v_new;
    SELECT coalesce(array_agg(k ORDER BY k), '{}') INTO v_fields
    FROM jsonb_object_keys(v_new) AS k
    WHERE k <> 'updated_at' AND (v_new -> k) IS DISTINCT FROM (v_old -> k);
    -- Only a timestamp moved: nothing worth recording.
    IF v_fields = '{}' THEN
      RETURN NEW;
    END IF;
  ELSE
    v_action := 'delete';
    v_row := to_jsonb(OLD);
  END IF;

  IF TG_TABLE_NAME = 'patients' THEN
    v_patient := NULLIF(v_row ->> 'id', '')::uuid;
  ELSIF TG_TABLE_NAME = 'visits' THEN
    v_patient := NULLIF(v_row ->> 'patient_id', '')::uuid;
    v_visit := NULLIF(v_row ->> 'id', '')::uuid;
  ELSIF TG_TABLE_NAME IN ('soap_notes', 'prescriptions') THEN
    v_visit := NULLIF(v_row ->> 'visit_id', '')::uuid;
    SELECT patient_id INTO v_patient FROM visits WHERE id = v_visit;
  ELSE
    v_patient := NULLIF(v_row ->> 'patient_id', '')::uuid;
    v_visit := NULLIF(v_row ->> 'visit_id', '')::uuid;
  END IF;

  INSERT INTO clinical_audit (actor, actor_roles, action, entity, entity_id, patient_id, visit_id, fields)
  VALUES (auth.uid(), coalesce(public.get_user_roles(), '{}'), v_action, TG_TABLE_NAME, coalesce(v_row ->> 'id', ''), v_patient, v_visit, v_fields);

  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$function$;

DROP TRIGGER IF EXISTS audit_patients ON public.patients;
CREATE TRIGGER audit_patients AFTER INSERT OR UPDATE OR DELETE ON public.patients FOR EACH ROW EXECUTE FUNCTION public.audit_clinical_change();
DROP TRIGGER IF EXISTS audit_visits ON public.visits;
CREATE TRIGGER audit_visits AFTER INSERT OR UPDATE OR DELETE ON public.visits FOR EACH ROW EXECUTE FUNCTION public.audit_clinical_change();
DROP TRIGGER IF EXISTS audit_soap_notes ON public.soap_notes;
CREATE TRIGGER audit_soap_notes AFTER INSERT OR UPDATE OR DELETE ON public.soap_notes FOR EACH ROW EXECUTE FUNCTION public.audit_clinical_change();
DROP TRIGGER IF EXISTS audit_prescriptions ON public.prescriptions;
CREATE TRIGGER audit_prescriptions AFTER INSERT OR UPDATE OR DELETE ON public.prescriptions FOR EACH ROW EXECUTE FUNCTION public.audit_clinical_change();
DROP TRIGGER IF EXISTS audit_investigations ON public.investigations;
CREATE TRIGGER audit_investigations AFTER INSERT OR UPDATE OR DELETE ON public.investigations FOR EACH ROW EXECUTE FUNCTION public.audit_clinical_change();
DROP TRIGGER IF EXISTS audit_device_results ON public.device_results;
CREATE TRIGGER audit_device_results AFTER INSERT OR UPDATE OR DELETE ON public.device_results FOR EACH ROW EXECUTE FUNCTION public.audit_clinical_change();

-- ---- recording that a record was opened ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.audit_record_view(p_patient_id uuid, p_context text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_context text := left(btrim(coalesce(p_context, '')), 60);
BEGIN
  PERFORM public.require_role(ARRAY['doctor', 'clinic-assistant', 'receptionist', 'pharmacist', 'cashier', 'admin']);
  IF p_patient_id IS NULL OR NOT EXISTS (SELECT 1 FROM patients WHERE id = p_patient_id) THEN
    RETURN;
  END IF;
  -- Opening the same record on the same screen again within ten minutes is one entry, not many.
  IF EXISTS (
    SELECT 1 FROM clinical_audit
    WHERE actor = v_uid AND action = 'view' AND patient_id = p_patient_id AND context = v_context AND at > now() - interval '10 minutes'
  ) THEN
    RETURN;
  END IF;
  INSERT INTO clinical_audit (actor, actor_roles, action, entity, entity_id, patient_id, context)
  VALUES (v_uid, coalesce(public.get_user_roles(), '{}'), 'view', 'patients', p_patient_id::text, p_patient_id, v_context);
END;
$function$;

CREATE OR REPLACE FUNCTION public.audit_summary()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  PERFORM public.require_role(ARRAY['admin']);
  RETURN (
    SELECT jsonb_build_object(
      'events', count(*),
      'views', count(*) FILTER (WHERE action = 'view'),
      'changes', count(*) FILTER (WHERE action <> 'view'),
      'staff', count(DISTINCT actor)
    )
    FROM clinical_audit WHERE at > now() - interval '24 hours'
  );
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.audit_clinical_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.audit_record_view(uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.audit_summary() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.audit_record_view(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.audit_summary() TO authenticated;

-- ---- reference tables: signed-in only ---------------------------------------------------------------------------------

DROP POLICY IF EXISTS "Allow authenticated read clinical_embeddings" ON public.clinical_embeddings;
CREATE POLICY "Allow authenticated read clinical_embeddings" ON public.clinical_embeddings FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow authenticated read diseases" ON public.diseases;
CREATE POLICY "Allow authenticated read diseases" ON public.diseases FOR SELECT TO authenticated USING (true);
