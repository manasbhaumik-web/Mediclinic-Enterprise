-- v35: online self-booking, synchronised with the appointment calendar and the registration queue.
--
-- Patients are not signed in, so the public site never touches the tables. It calls four narrow functions:
--   public_booking_doctors()   the active doctors a patient can choose
--   public_booking_slots()     the free 30-minute slots for one doctor on one day
--   public_book_appointment()  books a slot; a booking holds the slot at once (auto-confirmed)
--   public_cancel_booking()    cancels with the booking reference and the phone number used
-- Staff use appointment_check_in() when the patient arrives: it finds or registers the patient, starts a visit at
-- Awaiting Triage (with its queue ticket) and marks the booking Completed.

ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'staff',
  ADD COLUMN IF NOT EXISTS booking_ref text,
  ADD COLUMN IF NOT EXISTS patient_ic text,
  ADD COLUMN IF NOT EXISTS visit_id uuid REFERENCES public.visits(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS checked_in_at timestamptz;

ALTER TABLE public.appointments
  ADD CONSTRAINT appointments_source_check CHECK (source IN ('staff', 'online'));

CREATE UNIQUE INDEX IF NOT EXISTS appointments_booking_ref_uq ON public.appointments (booking_ref) WHERE booking_ref IS NOT NULL;
-- One live booking per doctor and start time: the database, not the page, prevents a double booking.
CREATE UNIQUE INDEX IF NOT EXISTS appointments_doctor_slot_uq ON public.appointments (doctor_id, appointment_time)
  WHERE status = 'Scheduled' AND doctor_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS appointments_patient_ic_idx ON public.appointments (patient_ic) WHERE patient_ic IS NOT NULL;
CREATE INDEX IF NOT EXISTS appointments_time_idx ON public.appointments (appointment_time);

-- The calendar listens for changes, so a new online booking appears without a refresh.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'appointments') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
  END IF;
END $$;

-- ---- doctors a patient can choose -------------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.public_booking_doctors()
RETURNS TABLE (id uuid, name text, department text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT s.id, s.name, s.department
  FROM staff s
  WHERE s.status = 'Active' AND (s.role = 'doctor' OR 'doctor' = ANY (coalesce(s.system_roles, ARRAY[]::text[])))
  ORDER BY s.name
$$;

-- ---- free slots: 09:00 to 17:30 clinic time, every 30 minutes, within the next 30 days ----------------------------------
CREATE OR REPLACE FUNCTION public.public_booking_slots(p_doctor uuid, p_day date)
RETURNS TABLE (slot timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT s
  FROM generate_series(
         (p_day::timestamp + time '09:00') AT TIME ZONE 'Asia/Kuala_Lumpur',
         (p_day::timestamp + time '17:30') AT TIME ZONE 'Asia/Kuala_Lumpur',
         interval '30 minutes') AS s
  WHERE p_day BETWEEN (now() AT TIME ZONE 'Asia/Kuala_Lumpur')::date AND (now() AT TIME ZONE 'Asia/Kuala_Lumpur')::date + 30
    AND s > now() + interval '30 minutes'
    AND EXISTS (SELECT 1 FROM staff d WHERE d.id = p_doctor AND d.status = 'Active'
                AND (d.role = 'doctor' OR 'doctor' = ANY (coalesce(d.system_roles, ARRAY[]::text[]))))
    AND NOT EXISTS (SELECT 1 FROM appointments a WHERE a.doctor_id = p_doctor AND a.appointment_time = s AND a.status = 'Scheduled')
  ORDER BY s
$$;

-- ---- book --------------------------------------------------------------------------------------------------------------
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
BEGIN
  IF char_length(v_name) < 2 OR char_length(v_name) > 100 THEN
    RAISE EXCEPTION 'Please enter the patient''s full name.' USING ERRCODE = 'P0001';
  END IF;
  IF v_ic !~ '^\d{6}-\d{2}-\d{4}$' THEN
    RAISE EXCEPTION 'Please enter the MyKad number as 900101-14-5555.' USING ERRCODE = 'P0001';
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

  IF NOT EXISTS (SELECT 1 FROM public_booking_slots(p_doctor, (p_slot AT TIME ZONE 'Asia/Kuala_Lumpur')::date) s WHERE s.slot = p_slot) THEN
    RAISE EXCEPTION 'That time is no longer available. Please pick another slot.' USING ERRCODE = 'P0001';
  END IF;

  -- A person may hold at most two upcoming bookings, so the page cannot be used to block the diary.
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

  RETURN json_build_object('reference', v_ref, 'appointment_time', p_slot, 'doctor', v_doctor_name, 'service', p_service);
END;
$$;

-- ---- cancel (booking reference + the phone number used) ------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.public_cancel_booking(p_reference text, p_phone text)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_id uuid;
BEGIN
  SELECT a.id INTO v_id FROM appointments a
  WHERE a.booking_ref = upper(btrim(coalesce(p_reference, '')))
    AND regexp_replace(a.patient_phone, '\D', '', 'g') = regexp_replace(coalesce(p_phone, ''), '\D', '', 'g')
    AND a.status = 'Scheduled' AND a.appointment_time > now()
  FOR UPDATE;
  IF v_id IS NULL THEN
    RETURN false;
  END IF;
  UPDATE appointments SET status = 'Cancelled', notes = concat_ws(' | ', notes, 'Cancelled online by the patient') WHERE id = v_id;
  RETURN true;
END;
$$;

-- ---- staff: check the patient in ------------------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.appointment_check_in(p_appointment_id uuid)
RETURNS uuid
LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, pg_temp AS $$
DECLARE
  a appointments%ROWTYPE;
  v_patient uuid;
  v_visit uuid;
  v_ic text;
  v_yy int; v_mm int; v_dd int; v_year int;
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
    IF v_ic IS NULL OR v_ic !~ '^\d{6}-\d{2}-\d{4}$' THEN
      RAISE EXCEPTION 'Register this patient first: the booking has no MyKad number.' USING ERRCODE = 'P0001';
    END IF;
    v_yy := substr(v_ic, 1, 2)::int; v_mm := substr(v_ic, 3, 2)::int; v_dd := substr(v_ic, 5, 2)::int;
    v_year := (CASE WHEN v_yy > (extract(year FROM now())::int % 100) THEN 1900 ELSE 2000 END) + v_yy;
    BEGIN
      v_dob := make_date(v_year, v_mm, v_dd);
    EXCEPTION WHEN others THEN
      RAISE EXCEPTION 'The MyKad number on this booking is not valid. Register the patient manually.' USING ERRCODE = 'P0001';
    END;
    v_gender := CASE WHEN substr(v_ic, 12, 1)::int % 2 = 1 THEN 'Male' ELSE 'Female' END;
    INSERT INTO patients (full_name, ic_number, gender, dob, phone)
    VALUES (a.patient_name, v_ic, v_gender, v_dob, a.patient_phone)
    RETURNING id INTO v_patient;
  END IF;

  IF EXISTS (SELECT 1 FROM visits WHERE patient_id = v_patient AND status NOT IN ('Paid', 'Cancelled')) THEN
    RAISE EXCEPTION 'This patient already has an open visit in the queue.' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO visits (patient_id, status) VALUES (v_patient, 'Awaiting Triage') RETURNING id INTO v_visit;
  INSERT INTO soap_notes (visit_id, subjective) VALUES (v_visit, 'Booked: ' || a.purpose);

  UPDATE appointments
  SET status = 'Completed', patient_id = v_patient, visit_id = v_visit, checked_in_at = now()
  WHERE id = a.id;

  RETURN v_visit;
END;
$$;

REVOKE ALL ON FUNCTION public.public_booking_doctors() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.public_booking_slots(uuid, date) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.public_book_appointment(text, text, text, text, uuid, timestamptz, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.public_cancel_booking(text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.appointment_check_in(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_booking_doctors() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.public_booking_slots(uuid, date) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.public_book_appointment(text, text, text, text, uuid, timestamptz, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.public_cancel_booking(text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.appointment_check_in(uuid) TO authenticated;
