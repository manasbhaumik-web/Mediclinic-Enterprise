-- v46: laboratory and imaging orders and results.
--
-- Until now a doctor could tick lab tests in the consultation, but they were only a list of names on the note: nothing
-- tracked who collected a sample, what the result was, or whether the doctor had seen it.
--
--   investigations  one row per ordered test or scan, with its status and result.
--                   Ordered > Collected > Resulted > Reviewed (or Cancelled).
--   Nobody writes the table directly. Five functions make the moves, each limited to the right role:
--     investigation_order          doctor              orders tests or imaging for a visit that is open
--     investigation_collect        clinic-assistant    sample taken / patient sent for the scan (doctor may too)
--     investigation_record_result  clinic-assistant    enters the result (doctor may too)
--     investigation_review         doctor              confirms the result has been read
--     investigation_cancel         doctor, assistant   withdraws an order that has no result yet
--   signoff_consultation also turns the lab tests the doctor selected into orders.

CREATE TABLE IF NOT EXISTS public.investigations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id uuid NOT NULL REFERENCES public.visits(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES public.patients(id),
  kind text NOT NULL CHECK (kind IN ('lab', 'imaging')),
  name text NOT NULL CHECK (length(btrim(name)) > 0),
  urgency text NOT NULL DEFAULT 'routine' CHECK (urgency IN ('routine', 'urgent')),
  clinical_info text,
  status text NOT NULL DEFAULT 'Ordered' CHECK (status IN ('Ordered', 'Collected', 'Resulted', 'Reviewed', 'Cancelled')),
  ordered_by uuid DEFAULT auth.uid(),
  ordered_at timestamptz NOT NULL DEFAULT now(),
  collected_by uuid,
  collected_at timestamptz,
  result_value text,
  result_unit text,
  reference_range text,
  abnormal boolean NOT NULL DEFAULT false,
  result_notes text,
  resulted_by uuid,
  resulted_at timestamptz,
  reviewed_by uuid,
  reviewed_at timestamptz,
  cancel_reason text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS investigations_one_open_per_visit_test
  ON public.investigations (visit_id, name) WHERE status <> 'Cancelled';
CREATE INDEX IF NOT EXISTS investigations_status_idx ON public.investigations (status, ordered_at);
CREATE INDEX IF NOT EXISTS investigations_patient_idx ON public.investigations (patient_id, ordered_at DESC);

DROP TRIGGER IF EXISTS investigations_touch_updated_at ON public.investigations;
CREATE TRIGGER investigations_touch_updated_at
  BEFORE UPDATE ON public.investigations
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.investigations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Clinical staff can read investigations" ON public.investigations;
CREATE POLICY "Clinical staff can read investigations"
  ON public.investigations FOR SELECT
  USING (public.has_any_role(ARRAY['doctor', 'clinic-assistant']));

CREATE OR REPLACE FUNCTION public.investigation_order(p_visit_id uuid, p_items jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_patient uuid;
  v_status text;
  v_item jsonb;
  v_kind text;
  v_name text;
BEGIN
  PERFORM public.require_role(ARRAY['doctor']);
  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Choose at least one test or scan to order.' USING ERRCODE = '22023';
  END IF;

  SELECT patient_id, status INTO v_patient, v_status FROM visits WHERE id = p_visit_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Visit % not found or not accessible', p_visit_id USING ERRCODE = 'P0002';
  END IF;
  IF v_status IN ('Paid', 'Cancelled') THEN
    RAISE EXCEPTION 'This visit is closed, so nothing can be ordered for it.' USING ERRCODE = '42501';
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_kind := v_item->>'kind';
    v_name := btrim(coalesce(v_item->>'name', ''));
    IF v_kind NOT IN ('lab', 'imaging') OR v_name = '' THEN
      RAISE EXCEPTION 'Each order needs a type (lab or imaging) and a name.' USING ERRCODE = '22023';
    END IF;
    INSERT INTO investigations (visit_id, patient_id, kind, name, urgency, clinical_info)
    VALUES (
      p_visit_id, v_patient, v_kind, left(v_name, 200),
      CASE WHEN v_item->>'urgency' = 'urgent' THEN 'urgent' ELSE 'routine' END,
      NULLIF(left(btrim(coalesce(v_item->>'clinical_info', '')), 500), '')
    )
    ON CONFLICT DO NOTHING;
  END LOOP;
END;
$function$;

CREATE OR REPLACE FUNCTION public.investigation_collect(p_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_status text;
BEGIN
  PERFORM public.require_role(ARRAY['clinic-assistant', 'doctor']);
  SELECT status INTO v_status FROM investigations WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found' USING ERRCODE = 'P0002';
  END IF;
  IF v_status <> 'Ordered' THEN
    RAISE EXCEPTION 'This order is already % and cannot be marked as collected.', lower(v_status) USING ERRCODE = '42501';
  END IF;
  UPDATE investigations SET status = 'Collected', collected_by = auth.uid(), collected_at = now() WHERE id = p_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.investigation_record_result(
  p_id uuid, p_value text, p_unit text, p_range text, p_abnormal boolean, p_notes text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_status text;
  v_value text := NULLIF(left(btrim(coalesce(p_value, '')), 500), '');
  v_notes text := NULLIF(left(btrim(coalesce(p_notes, '')), 2000), '');
BEGIN
  PERFORM public.require_role(ARRAY['clinic-assistant', 'doctor']);
  IF v_value IS NULL AND v_notes IS NULL THEN
    RAISE EXCEPTION 'Enter a result value or a report before saving.' USING ERRCODE = '22023';
  END IF;
  SELECT status INTO v_status FROM investigations WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found' USING ERRCODE = 'P0002';
  END IF;
  IF v_status NOT IN ('Ordered', 'Collected') THEN
    RAISE EXCEPTION 'This order is already % and a result cannot be entered.', lower(v_status) USING ERRCODE = '42501';
  END IF;
  UPDATE investigations SET
    status = 'Resulted',
    result_value = v_value,
    result_unit = NULLIF(left(btrim(coalesce(p_unit, '')), 50), ''),
    reference_range = NULLIF(left(btrim(coalesce(p_range, '')), 100), ''),
    abnormal = coalesce(p_abnormal, false),
    result_notes = v_notes,
    resulted_by = auth.uid(),
    resulted_at = now(),
    collected_by = coalesce(collected_by, auth.uid()),
    collected_at = coalesce(collected_at, now())
  WHERE id = p_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.investigation_review(p_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_status text;
BEGIN
  PERFORM public.require_role(ARRAY['doctor']);
  SELECT status INTO v_status FROM investigations WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found' USING ERRCODE = 'P0002';
  END IF;
  IF v_status <> 'Resulted' THEN
    RAISE EXCEPTION 'Only a result that has been entered can be marked as reviewed.' USING ERRCODE = '42501';
  END IF;
  UPDATE investigations SET status = 'Reviewed', reviewed_by = auth.uid(), reviewed_at = now() WHERE id = p_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.investigation_cancel(p_id uuid, p_reason text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_status text;
BEGIN
  PERFORM public.require_role(ARRAY['clinic-assistant', 'doctor']);
  SELECT status INTO v_status FROM investigations WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found' USING ERRCODE = 'P0002';
  END IF;
  IF v_status NOT IN ('Ordered', 'Collected') THEN
    RAISE EXCEPTION 'This order is already % and cannot be cancelled.', lower(v_status) USING ERRCODE = '42501';
  END IF;
  UPDATE investigations SET status = 'Cancelled', cancel_reason = NULLIF(left(btrim(coalesce(p_reason, '')), 300), '') WHERE id = p_id;
END;
$function$;

-- Only signed-in staff call these; the role check inside each one decides who may do what.
REVOKE EXECUTE ON FUNCTION public.investigation_order(uuid, jsonb) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.investigation_collect(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.investigation_record_result(uuid, text, text, text, boolean, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.investigation_review(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.investigation_cancel(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.investigation_order(uuid, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.investigation_collect(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.investigation_record_result(uuid, text, text, text, boolean, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.investigation_review(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.investigation_cancel(uuid, text) TO authenticated;

ALTER PUBLICATION supabase_realtime ADD TABLE public.investigations;

CREATE OR REPLACE FUNCTION public.signoff_consultation(visit_payload json, soap_payload json, rx_payload json)
RETURNS void
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_visit_id UUID;
  v_status TEXT;
  v_rx JSON;
  v_procs JSONB := CASE WHEN json_typeof(soap_payload->'procedures') = 'array' THEN (soap_payload->'procedures')::jsonb ELSE '[]'::jsonb END;
  v_next TEXT;
BEGIN
  PERFORM public.require_role(ARRAY['doctor']);

  v_visit_id := (visit_payload->>'id')::UUID;

  SELECT status INTO v_status FROM visits WHERE id = v_visit_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Visit % not found or not accessible', v_visit_id USING ERRCODE = 'P0002';
  END IF;
  IF v_status NOT IN ('Awaiting Consult', 'Consulting', 'Holding for Results') THEN
    RAISE EXCEPTION 'This visit is not waiting for a consultation.' USING ERRCODE = '42501';
  END IF;
  IF EXISTS (SELECT 1 FROM prescriptions WHERE visit_id = v_visit_id AND (dispensed_at IS NOT NULL OR skipped)) THEN
    RAISE EXCEPTION 'Prescriptions for this visit have already been dispensed or skipped.' USING ERRCODE = '42501';
  END IF;

  -- Procedures still to be done send the patient to the treatment room first; otherwise straight to the pharmacy.
  v_next := CASE WHEN EXISTS (SELECT 1 FROM jsonb_array_elements(v_procs) p WHERE p->>'status' IN ('Pending', 'In Progress'))
    THEN 'Awaiting Procedure' ELSE 'Awaiting Dispensation' END;

  PERFORM set_config('mediclinic.in_signoff', 'on', true);
  UPDATE visits
  SET
    status = v_next,
    mc_issued = coalesce((visit_payload->>'mc_issued')::BOOLEAN, false),
    signed_off_by = auth.uid(),
    signed_off_at = now()
  WHERE id = v_visit_id;
  PERFORM set_config('mediclinic.in_signoff', 'off', true);

  INSERT INTO soap_notes (
    visit_id, subjective, bp_systolic, bp_diastolic, heart_rate,
    temperature, respiratory_rate, icd_code, description, clinical_notes,
    follow_up_weeks, mc_days, requires_referral, pharmacy_memo,
    mc_reason, referral_hospital, referral_department, referral_reason, lab_orders, lab_reason, procedures
  )
  VALUES (
    v_visit_id,
    soap_payload->>'subjective',
    (soap_payload->>'bp_systolic')::INTEGER,
    (soap_payload->>'bp_diastolic')::INTEGER,
    (soap_payload->>'heart_rate')::INTEGER,
    (soap_payload->>'temperature')::NUMERIC,
    (soap_payload->>'respiratory_rate')::INTEGER,
    soap_payload->>'icd_code',
    soap_payload->>'description',
    soap_payload->>'clinical_notes',
    (soap_payload->>'follow_up_weeks')::INTEGER,
    (soap_payload->>'mc_days')::INTEGER,
    (soap_payload->>'requires_referral')::BOOLEAN,
    soap_payload->>'pharmacy_memo',
    NULLIF(soap_payload->>'mc_reason', ''),
    NULLIF(soap_payload->>'referral_hospital', ''),
    NULLIF(soap_payload->>'referral_department', ''),
    NULLIF(soap_payload->>'referral_reason', ''),
    CASE WHEN json_typeof(soap_payload->'lab_orders') = 'array'
      THEN ARRAY(SELECT json_array_elements_text(soap_payload->'lab_orders'))
      ELSE '{}'::text[] END,
    NULLIF(soap_payload->>'lab_reason', ''),
    v_procs
  )
  ON CONFLICT (visit_id)
  DO UPDATE SET
    subjective = EXCLUDED.subjective,
    bp_systolic = EXCLUDED.bp_systolic,
    bp_diastolic = EXCLUDED.bp_diastolic,
    heart_rate = EXCLUDED.heart_rate,
    temperature = EXCLUDED.temperature,
    respiratory_rate = EXCLUDED.respiratory_rate,
    icd_code = EXCLUDED.icd_code,
    description = EXCLUDED.description,
    clinical_notes = EXCLUDED.clinical_notes,
    follow_up_weeks = EXCLUDED.follow_up_weeks,
    mc_days = EXCLUDED.mc_days,
    requires_referral = EXCLUDED.requires_referral,
    pharmacy_memo = EXCLUDED.pharmacy_memo,
    mc_reason = EXCLUDED.mc_reason,
    referral_hospital = EXCLUDED.referral_hospital,
    referral_department = EXCLUDED.referral_department,
    referral_reason = EXCLUDED.referral_reason,
    lab_orders = EXCLUDED.lab_orders,
    lab_reason = EXCLUDED.lab_reason,
    procedures = EXCLUDED.procedures;

  -- Lab tests the doctor selected become orders the clinic assistant can work from. Re-signing never duplicates one.
  IF json_typeof(soap_payload->'lab_orders') = 'array'
     AND EXISTS (SELECT 1 FROM json_array_elements_text(soap_payload->'lab_orders') x WHERE btrim(x) <> '') THEN
    PERFORM public.investigation_order(
      v_visit_id,
      (SELECT jsonb_agg(jsonb_build_object('kind', CASE WHEN t.name ~* '(x-ray|xray|ultrasound|\mct\M|\mmri\M|mammogra|ecg|electrocardiogram)' THEN 'imaging' ELSE 'lab' END, 'name', t.name, 'clinical_info', coalesce(soap_payload->>'lab_reason', '')))
         FROM (SELECT DISTINCT btrim(x) AS name FROM json_array_elements_text(soap_payload->'lab_orders') x) t
        WHERE t.name <> '')
    );
  END IF;

  DELETE FROM prescriptions WHERE visit_id = v_visit_id;

  IF rx_payload IS NOT NULL AND json_array_length(rx_payload) > 0 THEN
    FOR v_rx IN SELECT * FROM json_array_elements(rx_payload)
    LOOP
      INSERT INTO prescriptions (
        visit_id, drug_name, dosage, dosage_bm, frequency,
        quantity, price_per_unit, expiry_date, pill_color, capsule_style, inventory_id
      )
      VALUES (
        v_visit_id,
        v_rx->>'drug_name',
        v_rx->>'dosage',
        v_rx->>'dosage_bm',
        v_rx->>'frequency',
        (v_rx->>'quantity')::INTEGER,
        (v_rx->>'price_per_unit')::NUMERIC,
        NULLIF(v_rx->>'expiry_date', '')::DATE,
        v_rx->>'pill_color',
        v_rx->>'capsule_style',
        NULLIF(v_rx->>'inventory_id', '')::UUID
      );
    END LOOP;
  END IF;
END;
$function$;

