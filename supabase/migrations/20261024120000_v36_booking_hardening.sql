-- v36: online booking hardening.
--
--   1. Abuse limits: a device may make a few online bookings a day and the whole page a limited number an hour, so one
--      script cannot fill a doctor's diary. (A CAPTCHA on the page is the next layer; it needs a site key.)
--   2. Real opening times: open days and hours come from clinic_settings, and public holidays and the doctor's approved
--      leave remove their slots.
--   3. The MyKad number must carry a real birth date, checked in the database, so check-in cannot fail on it later.
--   4. Check-in keeps the doctor the patient chose on the visit (visits.doctor_id).
-- appointment_check_in is also closed to the anon role explicitly.

-- ---- opening times -----------------------------------------------------------------------------------------------------
-- booking_open_days uses Postgres weekday numbers: 0 = Sunday ... 6 = Saturday. The default is Monday to Saturday.
ALTER TABLE public.clinic_settings
  ADD COLUMN IF NOT EXISTS booking_open_days integer[] NOT NULL DEFAULT ARRAY[1,2,3,4,5,6],
  ADD COLUMN IF NOT EXISTS booking_start time NOT NULL DEFAULT time '09:00',
  ADD COLUMN IF NOT EXISTS booking_end time NOT NULL DEFAULT time '17:30';
ALTER TABLE public.clinic_settings
  ADD CONSTRAINT clinic_settings_booking_hours_check CHECK (booking_end > booking_start),
  ADD CONSTRAINT clinic_settings_booking_days_check CHECK (booking_open_days <@ ARRAY[0,1,2,3,4,5,6]);

-- ---- attempt log for rate limits (no policies: only the booking function touches it) --------------------------------------
CREATE TABLE IF NOT EXISTS public.booking_attempts (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  client_hash text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS booking_attempts_client_idx ON public.booking_attempts (client_hash, created_at);
CREATE INDEX IF NOT EXISTS booking_attempts_time_idx ON public.booking_attempts (created_at);
ALTER TABLE public.booking_attempts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.booking_attempts FROM anon, authenticated;

-- ---- birth date from a MyKad number; null when the number is not a real one ---------------------------------------------------
CREATE OR REPLACE FUNCTION public.ic_birth_date(p_ic text)
RETURNS date
LANGUAGE plpgsql STABLE SET search_path = public, pg_temp AS $$
DECLARE
  yy int; mm int; dd int; yr int; d date;
  today date := (now() AT TIME ZONE 'Asia/Kuala_Lumpur')::date;
BEGIN
  IF p_ic IS NULL OR p_ic !~ '^\d{6}-\d{2}-\d{4}$' THEN
    RETURN NULL;
  END IF;
  yy := substr(p_ic, 1, 2)::int; mm := substr(p_ic, 3, 2)::int; dd := substr(p_ic, 5, 2)::int;
  yr := (CASE WHEN yy > (extract(year FROM today)::int % 100) THEN 1900 ELSE 2000 END) + yy;
  BEGIN
    d := make_date(yr, mm, dd);
  EXCEPTION WHEN others THEN
    RETURN NULL;
  END;
  IF d > today THEN
    RETURN NULL;
  END IF;
  RETURN d;
END;
$$;

-- ---- free slots ------------------------------------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.public_booking_slots(p_doctor uuid, p_day date)
RETURNS TABLE (slot timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  WITH cfg AS (
    SELECT coalesce((SELECT c.booking_open_days FROM clinic_settings c ORDER BY c.id LIMIT 1), ARRAY[1,2,3,4,5,6]) AS open_days,
           coalesce((SELECT c.booking_start FROM clinic_settings c ORDER BY c.id LIMIT 1), time '09:00') AS t_start,
           coalesce((SELECT c.booking_end FROM clinic_settings c ORDER BY c.id LIMIT 1), time '17:30') AS t_end
  )
  SELECT s
  FROM cfg,
       generate_series(
         (p_day::timestamp + cfg.t_start) AT TIME ZONE 'Asia/Kuala_Lumpur',
         (p_day::timestamp + cfg.t_end) AT TIME ZONE 'Asia/Kuala_Lumpur',
         interval '30 minutes') AS s
  WHERE p_day BETWEEN (now() AT TIME ZONE 'Asia/Kuala_Lumpur')::date AND (now() AT TIME ZONE 'Asia/Kuala_Lumpur')::date + 30
    AND extract(dow FROM p_day)::int = ANY (cfg.open_days)
    AND NOT EXISTS (SELECT 1 FROM public_holidays h WHERE h.holiday_date = p_day)
    AND s > now() + interval '30 minutes'
    AND EXISTS (SELECT 1 FROM staff d WHERE d.id = p_doctor AND d.status = 'Active'
                AND (d.role = 'doctor' OR 'doctor' = ANY (coalesce(d.system_roles, ARRAY[]::text[]))))
    -- approved leave: a full day removes the day, a half day removes the morning or the afternoon
    AND NOT EXISTS (
      SELECT 1 FROM leave_days l JOIN leave_requests r ON r.id = l.request_id
      WHERE l.staff_id = p_doctor AND l.leave_date = p_day AND r.status = 'approved'
        AND (l.fraction = 1 OR r.half_day IS NULL
             OR (r.half_day = 'am' AND extract(hour FROM s AT TIME ZONE 'Asia/Kuala_Lumpur') < 12)
             OR (r.half_day = 'pm' AND extract(hour FROM s AT TIME ZONE 'Asia/Kuala_Lumpur') >= 12)))
    AND NOT EXISTS (SELECT 1 FROM appointments a WHERE a.doctor_id = p_doctor AND a.appointment_time = s AND a.status = 'Scheduled')
  ORDER BY s
$$;

-- ---- book --------------------------------------------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.public_book_appointment(
  p_name text, p_ic text, p_phone text, p_service text, p_doctor uuid, p_slot timestamptz, p_notes text DEFAULT NULL
) RETURNS json
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_name text := btrim(coalesce(p_name, ''));
  v_ic text := btrim(coalesce(p_ic, ''));
  v_digits text := regexp_replace(coalesce(p_phone, ''), '\D', '', 'g');
  v_notes text := nullif(btrim(coalesce(p_notes, '')), '');
  v_patient uuid;
  v_doctor_name text;
  v_ref text;
  v_alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  v_id uuid;
  v_headers json := coalesce(nullif(current_setting('request.headers', true), ''), '{}')::json;
  v_ip text;
  v_client text;
BEGIN
  IF char_length(v_name) < 2 OR char_length(v_name) > 100 THEN
    RAISE EXCEPTION 'Please enter the patient''s full name.' USING ERRCODE = 'P0001';
  END IF;
  IF public.ic_birth_date(v_ic) IS NULL THEN
    RAISE EXCEPTION 'Please enter a valid MyKad number, for example 900101-14-5555.' USING ERRCODE = 'P0001';
  END IF;
  IF char_length(v_digits) < 9 OR char_length(v_digits) > 13 THEN
    RAISE EXCEPTION 'Please enter a valid phone number.' USING ERRCODE = 'P0001';
  END IF;
  IF p_service NOT IN ('General Outpatient Consultation', 'Pediatrics & Child Vaccination', 'Executive Health Screening', 'Corporate Panel TPA Visit') THEN
    RAISE EXCEPTION 'Please choose a service.' USING ERRCODE = 'P0001';
  END IF;
  IF v_notes IS NOT NULL AND char_length(v_notes) > 300 THEN
    RAISE EXCEPTION 'Please keep the note under 300 characters.' USING ERRCODE = 'P0001';
  END IF;

  SELECT s.name INTO v_doctor_name FROM staff s WHERE s.id = p_doctor AND s.status = 'Active'
    AND (s.role = 'doctor' OR 'doctor' = ANY (coalesce(s.system_roles, ARRAY[]::text[])));
  IF v_doctor_name IS NULL THEN
    RAISE EXCEPTION 'Please choose a doctor.' USING ERRCODE = 'P0001';
  END IF;

  -- The caller's address as the gateway reports it (Cloudflare's header cannot be set by the caller), kept only as a hash.
  v_ip := coalesce(nullif(btrim(v_headers ->> 'cf-connecting-ip'), ''),
                   nullif(btrim(v_headers ->> 'x-real-ip'), ''),
                   nullif(btrim(regexp_replace(coalesce(v_headers ->> 'x-forwarded-for', ''), '^.*,', '')), ''));
  v_client := CASE WHEN v_ip IS NULL THEN NULL ELSE md5('mediclinic-booking:' || v_ip) END;

  DELETE FROM booking_attempts WHERE created_at < now() - interval '7 days';
  IF v_client IS NOT NULL AND (SELECT count(*) FROM booking_attempts b WHERE b.client_hash = v_client AND b.created_at > now() - interval '24 hours') >= 6 THEN
    RAISE EXCEPTION 'Too many bookings were made from this device today. Please call the clinic to book.' USING ERRCODE = 'P0001';
  END IF;
  IF (SELECT count(*) FROM booking_attempts b WHERE b.created_at > now() - interval '1 hour') >= 60 THEN
    RAISE EXCEPTION 'Online booking is very busy right now. Please try again later or call the clinic.' USING ERRCODE = 'P0001';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public_booking_slots(p_doctor, (p_slot AT TIME ZONE 'Asia/Kuala_Lumpur')::date) s WHERE s.slot = p_slot) THEN
    RAISE EXCEPTION 'That time is no longer available. Please pick another slot.' USING ERRCODE = 'P0001';
  END IF;

  -- A person may hold at most two upcoming bookings. The lock makes two simultaneous requests count each other.
  PERFORM pg_advisory_xact_lock(hashtext('booking:' || v_ic));
  PERFORM pg_advisory_xact_lock(hashtext('booking:' || v_digits));
  IF (SELECT count(*) FROM appointments a
      WHERE a.status = 'Scheduled' AND a.appointment_time > now()
        AND (a.patient_ic = v_ic OR regexp_replace(a.patient_phone, '\D', '', 'g') = v_digits)) >= 2 THEN
    RAISE EXCEPTION 'You already have two upcoming bookings. Please cancel one or call the clinic.' USING ERRCODE = 'P0001';
  END IF;

  SELECT p.id INTO v_patient FROM patients p WHERE p.ic_number = v_ic LIMIT 1;

  FOR i IN 1..8 LOOP
    v_ref := 'MC-' || (SELECT string_agg(substr(v_alphabet, 1 + floor(random() * 31)::int, 1), '') FROM generate_series(1, 6));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM appointments a WHERE a.booking_ref = v_ref);
  END LOOP;

  BEGIN
    INSERT INTO appointments (patient_id, patient_name, patient_phone, patient_ic, appointment_time, duration_minutes,
                              purpose, status, doctor_id, notes, source, booking_ref)
    VALUES (v_patient, v_name, btrim(p_phone), v_ic, p_slot, 30, p_service, 'Scheduled', p_doctor, v_notes, 'online', v_ref)
    RETURNING id INTO v_id;
  EXCEPTION WHEN unique_violation THEN
    RAISE EXCEPTION 'That time has just been taken. Please pick another slot.' USING ERRCODE = 'P0001';
  END;

  INSERT INTO booking_attempts (client_hash) VALUES (v_client);

  RETURN json_build_object('reference', v_ref, 'appointment_time', p_slot, 'doctor', v_doctor_name, 'service', p_service);
END;
$$;

-- ---- staff: check the patient in ------------------------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.appointment_check_in(p_appointment_id uuid)
RETURNS uuid
LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, pg_temp AS $$
DECLARE
  a appointments%ROWTYPE;
  v_patient uuid;
  v_visit uuid;
  v_ic text;
  v_dob date;
  v_gender text;
BEGIN
  PERFORM public.require_role(ARRAY['receptionist', 'admin', 'doctor']);

  SELECT * INTO a FROM appointments WHERE id = p_appointment_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found.' USING ERRCODE = 'P0002';
  END IF;
  IF a.status <> 'Scheduled' THEN
    RAISE EXCEPTION 'This booking is already %.', lower(a.status) USING ERRCODE = 'P0001';
  END IF;

  v_patient := a.patient_id;
  v_ic := a.patient_ic;
  IF v_patient IS NULL AND v_ic IS NOT NULL THEN
    SELECT id INTO v_patient FROM patients WHERE ic_number = v_ic LIMIT 1;
  END IF;

  IF v_patient IS NULL THEN
    IF v_ic IS NULL THEN
      RAISE EXCEPTION 'Register this patient first: the booking has no MyKad number.' USING ERRCODE = 'P0001';
    END IF;
    v_dob := public.ic_birth_date(v_ic);
    IF v_dob IS NULL THEN
      RAISE EXCEPTION 'The MyKad number on this booking is not valid. Register the patient manually.' USING ERRCODE = 'P0001';
    END IF;
    v_gender := CASE WHEN substr(v_ic, 12, 1)::int % 2 = 1 THEN 'Male' ELSE 'Female' END;
    INSERT INTO patients (full_name, ic_number, gender, dob, phone)
    VALUES (a.patient_name, v_ic, v_gender, v_dob, a.patient_phone)
    RETURNING id INTO v_patient;
  END IF;

  IF EXISTS (SELECT 1 FROM visits WHERE patient_id = v_patient AND status NOT IN ('Paid', 'Cancelled')) THEN
    RAISE EXCEPTION 'This patient already has an open visit in the queue.' USING ERRCODE = 'P0001';
  END IF;

  -- The doctor the patient booked stays on the visit.
  INSERT INTO visits (patient_id, doctor_id, status) VALUES (v_patient, a.doctor_id, 'Awaiting Triage') RETURNING id INTO v_visit;
  INSERT INTO soap_notes (visit_id, subjective) VALUES (v_visit, 'Booked: ' || a.purpose);

  UPDATE appointments
  SET status = 'Completed', patient_id = v_patient, visit_id = v_visit, checked_in_at = now()
  WHERE id = a.id;

  RETURN v_visit;
END;
$$;

-- ---- who may call what -------------------------------------------------------------------------------------------------------------
-- Supabase also grants new functions to anon by name, so the revoke names it.
REVOKE ALL ON FUNCTION public.ic_birth_date(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ic_birth_date(text) TO authenticated;
REVOKE ALL ON FUNCTION public.appointment_check_in(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.appointment_check_in(uuid) TO authenticated;
