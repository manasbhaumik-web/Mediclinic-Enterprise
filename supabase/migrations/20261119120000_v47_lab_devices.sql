-- v47: connect lab analyzers, imaging gateways and point-of-care devices.
--
-- A device (or the vendor's middleware, or a small bridge on a clinic PC) posts its result messages to the
-- lab-device-ingest function with its own key. Nothing a device sends reaches a patient's chart on its own:
--
--   lab_devices        one row per connected device, with its protocol and where it sits.
--   lab_device_keys    the SHA-256 of each device's key (the key itself is shown once and never stored).
--                      Row security is on with no policies, so only the database's own functions can read it.
--   lab_device_codes   maps a device's own test code (for example HGB) to the clinic's test name (Full Blood Count).
--   device_results     the inbox. Each result waits as Pending, matched to the patient (by IC number) and to an open
--                      order when it can be. A clinic assistant or doctor accepts it, which records it on the order,
--                      or rejects it with a reason.
--
-- Functions:
--   device_results_ingest   service role only: stores a parsed message and matches it (used by the edge function)
--   device_results_import   clinic-assistant, doctor, admin: the same, for a result file loaded on screen
--   device_result_accept    clinic-assistant, doctor: records the result on the order
--   device_result_reject    clinic-assistant, doctor
--   lab_device_save / lab_device_set_key / lab_device_clear_key / lab_device_code_save / lab_device_code_delete   admin

CREATE TABLE IF NOT EXISTS public.lab_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (length(btrim(name)) > 0),
  kind text NOT NULL DEFAULT 'analyzer' CHECK (kind IN ('analyzer', 'imaging', 'point_of_care', 'other')),
  protocol text NOT NULL DEFAULT 'hl7v2' CHECK (protocol IN ('hl7v2', 'fhir', 'json')),
  location text,
  active boolean NOT NULL DEFAULT true,
  key_hint text,
  last_seen_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.lab_device_keys (
  device_id uuid PRIMARY KEY REFERENCES public.lab_devices(id) ON DELETE CASCADE,
  key_hash text NOT NULL UNIQUE CHECK (key_hash ~ '^[0-9a-f]{64}$'),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.lab_device_codes (
  device_id uuid NOT NULL REFERENCES public.lab_devices(id) ON DELETE CASCADE,
  device_code text NOT NULL CHECK (length(btrim(device_code)) > 0),
  test_name text NOT NULL CHECK (length(btrim(test_name)) > 0),
  PRIMARY KEY (device_id, device_code)
);

CREATE TABLE IF NOT EXISTS public.device_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id uuid NOT NULL REFERENCES public.lab_devices(id) ON DELETE CASCADE,
  message_id text NOT NULL,
  device_code text NOT NULL,
  patient_ref text NOT NULL DEFAULT '',
  patient_id uuid REFERENCES public.patients(id),
  test_name text,
  investigation_id uuid REFERENCES public.investigations(id),
  result_value text,
  result_unit text,
  reference_range text,
  abnormal boolean NOT NULL DEFAULT false,
  notes text,
  observed_at timestamptz,
  received_at timestamptz NOT NULL DEFAULT now(),
  raw_format text,
  status text NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Accepted', 'Rejected')),
  reviewed_by uuid,
  reviewed_at timestamptz,
  reject_reason text,
  UNIQUE (device_id, message_id, device_code)
);

CREATE INDEX IF NOT EXISTS device_results_status_idx ON public.device_results (status, received_at DESC);

ALTER TABLE public.lab_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_device_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_device_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Clinical staff and admins can read devices" ON public.lab_devices;
CREATE POLICY "Clinical staff and admins can read devices"
  ON public.lab_devices FOR SELECT
  USING (public.has_any_role(ARRAY['doctor', 'clinic-assistant', 'admin']));

DROP POLICY IF EXISTS "Clinical staff and admins can read device codes" ON public.lab_device_codes;
CREATE POLICY "Clinical staff and admins can read device codes"
  ON public.lab_device_codes FOR SELECT
  USING (public.has_any_role(ARRAY['doctor', 'clinic-assistant', 'admin']));

DROP POLICY IF EXISTS "Clinical staff can read device results" ON public.device_results;
CREATE POLICY "Clinical staff can read device results"
  ON public.device_results FOR SELECT
  USING (public.has_any_role(ARRAY['doctor', 'clinic-assistant']));

-- ---- storing a message ---------------------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.device_results_ingest(p_device_id uuid, p_items jsonb, p_format text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_item jsonb;
  v_ref text;
  v_norm text;
  v_code text;
  v_msg text;
  v_patient uuid;
  v_matches int;
  v_test text;
  v_inv uuid;
  v_rows int;
  v_new int := 0;
  v_dup int := 0;
  v_skipped int := 0;
  v_unmatched int := 0;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM lab_devices WHERE id = p_device_id AND active) THEN
    RAISE EXCEPTION 'This device is not registered or has been switched off.' USING ERRCODE = '42501';
  END IF;
  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'The message has no results.' USING ERRCODE = '22023';
  END IF;
  IF jsonb_array_length(p_items) > 200 THEN
    RAISE EXCEPTION 'Too many results in one message.' USING ERRCODE = '22023';
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_code := btrim(coalesce(v_item->>'device_code', ''));
    v_msg := btrim(coalesce(v_item->>'message_id', ''));
    v_ref := left(btrim(coalesce(v_item->>'patient_ref', '')), 60);
    IF v_code = '' OR v_msg = '' THEN
      v_skipped := v_skipped + 1;
      CONTINUE;
    END IF;

    v_patient := NULL;
    v_norm := regexp_replace(upper(v_ref), '[^0-9A-Z]', '', 'g');
    IF v_norm <> '' THEN
      SELECT count(*) INTO v_matches FROM patients WHERE regexp_replace(upper(ic_number), '[^0-9A-Z]', '', 'g') = v_norm;
      -- An identifier that fits more than one patient is left unmatched for a person to decide.
      IF v_matches = 1 THEN
        SELECT id INTO v_patient FROM patients WHERE regexp_replace(upper(ic_number), '[^0-9A-Z]', '', 'g') = v_norm;
      END IF;
    END IF;

    SELECT test_name INTO v_test FROM lab_device_codes WHERE device_id = p_device_id AND device_code = v_code;

    v_inv := NULL;
    IF v_patient IS NOT NULL AND v_test IS NOT NULL THEN
      SELECT id INTO v_inv FROM investigations
      WHERE patient_id = v_patient AND name = v_test AND status IN ('Ordered', 'Collected')
      ORDER BY ordered_at DESC LIMIT 1;
    END IF;

    INSERT INTO device_results (
      device_id, message_id, device_code, patient_ref, patient_id, test_name, investigation_id,
      result_value, result_unit, reference_range, abnormal, notes, observed_at, raw_format
    )
    VALUES (
      p_device_id, left(v_msg, 200), left(v_code, 100), v_ref, v_patient, v_test, v_inv,
      NULLIF(left(btrim(coalesce(v_item->>'value', '')), 500), ''),
      NULLIF(left(btrim(coalesce(v_item->>'unit', '')), 50), ''),
      NULLIF(left(btrim(coalesce(v_item->>'range', '')), 100), ''),
      coalesce((v_item->>'abnormal')::boolean, false),
      NULLIF(left(btrim(coalesce(v_item->>'notes', '')), 2000), ''),
      CASE WHEN v_item->>'observed_at' ~ '^\d{4}-\d{2}-\d{2}' THEN (v_item->>'observed_at')::timestamptz ELSE NULL END,
      left(coalesce(p_format, ''), 20)
    )
    ON CONFLICT (device_id, message_id, device_code) DO NOTHING;
    GET DIAGNOSTICS v_rows = ROW_COUNT;

    IF v_rows = 0 THEN
      v_dup := v_dup + 1;
    ELSE
      v_new := v_new + 1;
      IF v_inv IS NULL THEN v_unmatched := v_unmatched + 1; END IF;
    END IF;
  END LOOP;

  UPDATE lab_devices SET last_seen_at = now() WHERE id = p_device_id;
  RETURN jsonb_build_object('received', v_new, 'duplicates', v_dup, 'skipped', v_skipped, 'unmatched', v_unmatched);
END;
$function$;

-- The edge function calls this with the service role. Signed-in staff use device_results_import instead.
REVOKE EXECUTE ON FUNCTION public.device_results_ingest(uuid, jsonb, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.device_results_ingest(uuid, jsonb, text) TO service_role;

CREATE OR REPLACE FUNCTION public.device_results_import(p_device_id uuid, p_items jsonb, p_format text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  PERFORM public.require_role(ARRAY['clinic-assistant', 'doctor', 'admin']);
  RETURN public.device_results_ingest(p_device_id, p_items, p_format);
END;
$function$;

-- ---- working the inbox ---------------------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.device_result_accept(p_id uuid, p_investigation_id uuid DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_r device_results%ROWTYPE;
  v_target uuid;
  v_inv_status text;
  v_inv_patient uuid;
BEGIN
  PERFORM public.require_role(ARRAY['clinic-assistant', 'doctor']);
  SELECT * INTO v_r FROM device_results WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Result not found' USING ERRCODE = 'P0002';
  END IF;
  IF v_r.status <> 'Pending' THEN
    RAISE EXCEPTION 'This result has already been %.', lower(v_r.status) USING ERRCODE = '42501';
  END IF;

  v_target := coalesce(p_investigation_id, v_r.investigation_id);
  IF v_target IS NULL THEN
    RAISE EXCEPTION 'Choose the order this result belongs to.' USING ERRCODE = '22023';
  END IF;
  SELECT status, patient_id INTO v_inv_status, v_inv_patient FROM investigations WHERE id = v_target FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found' USING ERRCODE = 'P0002';
  END IF;
  IF v_inv_status NOT IN ('Ordered', 'Collected') THEN
    RAISE EXCEPTION 'That order is already %, so a result cannot be recorded.', lower(v_inv_status) USING ERRCODE = '42501';
  END IF;
  -- A result the device tied to one patient can only go on that patient's order.
  IF v_r.patient_id IS NOT NULL AND v_r.patient_id <> v_inv_patient THEN
    RAISE EXCEPTION 'This result belongs to a different patient than that order.' USING ERRCODE = '42501';
  END IF;
  IF v_r.result_value IS NULL AND v_r.notes IS NULL THEN
    RAISE EXCEPTION 'This result has no value or report to record.' USING ERRCODE = '22023';
  END IF;

  UPDATE investigations SET
    status = 'Resulted',
    result_value = v_r.result_value,
    result_unit = v_r.result_unit,
    reference_range = v_r.reference_range,
    abnormal = v_r.abnormal,
    result_notes = v_r.notes,
    resulted_by = auth.uid(),
    resulted_at = now(),
    collected_by = coalesce(collected_by, auth.uid()),
    collected_at = coalesce(collected_at, now())
  WHERE id = v_target;

  UPDATE device_results SET status = 'Accepted', investigation_id = v_target, reviewed_by = auth.uid(), reviewed_at = now() WHERE id = p_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.device_result_reject(p_id uuid, p_reason text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_status text;
BEGIN
  PERFORM public.require_role(ARRAY['clinic-assistant', 'doctor']);
  SELECT status INTO v_status FROM device_results WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Result not found' USING ERRCODE = 'P0002';
  END IF;
  IF v_status <> 'Pending' THEN
    RAISE EXCEPTION 'This result has already been %.', lower(v_status) USING ERRCODE = '42501';
  END IF;
  UPDATE device_results SET
    status = 'Rejected', reject_reason = NULLIF(left(btrim(coalesce(p_reason, '')), 300), ''),
    reviewed_by = auth.uid(), reviewed_at = now()
  WHERE id = p_id;
END;
$function$;

-- ---- administering devices -----------------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.lab_device_save(p_id uuid, p jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_id uuid;
BEGIN
  PERFORM public.require_role(ARRAY['admin']);
  IF p_id IS NULL THEN
    INSERT INTO lab_devices (name, kind, protocol, location, active)
    VALUES (
      left(btrim(coalesce(p->>'name', '')), 100),
      coalesce(p->>'kind', 'analyzer'), coalesce(p->>'protocol', 'hl7v2'),
      NULLIF(left(btrim(coalesce(p->>'location', '')), 100), ''), coalesce((p->>'active')::boolean, true)
    )
    RETURNING id INTO v_id;
  ELSE
    UPDATE lab_devices SET
      name = left(btrim(coalesce(p->>'name', name)), 100),
      kind = coalesce(p->>'kind', kind),
      protocol = coalesce(p->>'protocol', protocol),
      location = NULLIF(left(btrim(coalesce(p->>'location', coalesce(location, ''))), 100), ''),
      active = coalesce((p->>'active')::boolean, active),
      updated_at = now()
    WHERE id = p_id
    RETURNING id INTO v_id;
    IF v_id IS NULL THEN
      RAISE EXCEPTION 'Device not found' USING ERRCODE = 'P0002';
    END IF;
  END IF;
  RETURN v_id;
END;
$function$;

-- The caller makes the key and sends only its SHA-256, so the key itself never reaches the database.
CREATE OR REPLACE FUNCTION public.lab_device_set_key(p_id uuid, p_hash text, p_hint text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  PERFORM public.require_role(ARRAY['admin']);
  IF p_hash IS NULL OR p_hash !~ '^[0-9a-f]{64}$' THEN
    RAISE EXCEPTION 'The key fingerprint is not valid.' USING ERRCODE = '22023';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM lab_devices WHERE id = p_id) THEN
    RAISE EXCEPTION 'Device not found' USING ERRCODE = 'P0002';
  END IF;
  INSERT INTO lab_device_keys (device_id, key_hash) VALUES (p_id, p_hash)
  ON CONFLICT (device_id) DO UPDATE SET key_hash = EXCLUDED.key_hash, created_at = now();
  UPDATE lab_devices SET key_hint = left(coalesce(p_hint, ''), 8), updated_at = now() WHERE id = p_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.lab_device_clear_key(p_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  PERFORM public.require_role(ARRAY['admin']);
  DELETE FROM lab_device_keys WHERE device_id = p_id;
  UPDATE lab_devices SET key_hint = NULL, updated_at = now() WHERE id = p_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.lab_device_code_save(p_device_id uuid, p_code text, p_test_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  PERFORM public.require_role(ARRAY['admin']);
  IF btrim(coalesce(p_code, '')) = '' OR btrim(coalesce(p_test_name, '')) = '' THEN
    RAISE EXCEPTION 'Enter both the device code and the test it stands for.' USING ERRCODE = '22023';
  END IF;
  INSERT INTO lab_device_codes (device_id, device_code, test_name)
  VALUES (p_device_id, left(btrim(p_code), 100), left(btrim(p_test_name), 200))
  ON CONFLICT (device_id, device_code) DO UPDATE SET test_name = EXCLUDED.test_name;
END;
$function$;

CREATE OR REPLACE FUNCTION public.lab_device_code_delete(p_device_id uuid, p_code text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  PERFORM public.require_role(ARRAY['admin']);
  DELETE FROM lab_device_codes WHERE device_id = p_device_id AND device_code = p_code;
END;
$function$;

-- Signed-in staff only; the role check inside each function decides who may do what.
REVOKE EXECUTE ON FUNCTION public.device_results_import(uuid, jsonb, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.device_result_accept(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.device_result_reject(uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.lab_device_save(uuid, jsonb) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.lab_device_set_key(uuid, text, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.lab_device_clear_key(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.lab_device_code_save(uuid, text, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.lab_device_code_delete(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.device_results_import(uuid, jsonb, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.device_result_accept(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.device_result_reject(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.lab_device_save(uuid, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.lab_device_set_key(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.lab_device_clear_key(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.lab_device_code_save(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.lab_device_code_delete(uuid, text) TO authenticated;

ALTER PUBLICATION supabase_realtime ADD TABLE public.device_results;
ALTER PUBLICATION supabase_realtime ADD TABLE public.lab_devices;
