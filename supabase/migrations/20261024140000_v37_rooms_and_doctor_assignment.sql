-- v37: consultation rooms, doctor assignment, and service-to-specialty matching.
--
--   1. consultation_rooms: the clinic's list of rooms. call_patient now needs a listed room and refuses a room that
--      another patient is already in, so two doctors cannot share a room.
--   2. Doctor assignment: visits.doctor_id (set at registration, by the booking, or by assign_visit_doctor) names the
--      doctor a patient should see. Another doctor can still call that patient, but only after confirming.
--   3. booking_services: each online service can be limited to doctors of one department (specialty). staff.department
--      is the doctor's specialty. The booking page then offers, and the database then accepts, only matching doctors.
--   4. clinic_doctors(): the active doctors for staff screens (names, departments, and the login each one uses).

-- ---- 1. rooms ---------------------------------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.consultation_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(btrim(name)) BETWEEN 1 AND 60),
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS consultation_rooms_name_uq ON public.consultation_rooms (lower(btrim(name)));
ALTER TABLE public.consultation_rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed-in read rooms" ON public.consultation_rooms FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin manage rooms" ON public.consultation_rooms FOR ALL TO authenticated
  USING (public.has_any_role(ARRAY['admin'])) WITH CHECK (public.has_any_role(ARRAY['admin']));
INSERT INTO public.consultation_rooms (name, sort_order) VALUES
  ('Consultation Room 1', 1), ('Consultation Room 2', 2), ('Consultation Room 3', 3)
ON CONFLICT DO NOTHING;

-- ---- 3. services and their specialty ---------------------------------------------------------------------------------------------
-- department NULL means any doctor may see that service.
CREATE TABLE IF NOT EXISTS public.booking_services (
  service text PRIMARY KEY,
  department text,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0
);
ALTER TABLE public.booking_services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed-in read booking services" ON public.booking_services FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin manage booking services" ON public.booking_services FOR ALL TO authenticated
  USING (public.has_any_role(ARRAY['admin'])) WITH CHECK (public.has_any_role(ARRAY['admin']));
INSERT INTO public.booking_services (service, department, sort_order) VALUES
  ('General Outpatient Consultation', NULL, 1),
  ('Pediatrics & Child Vaccination', 'Pediatrics', 2),
  ('Executive Health Screening', NULL, 3),
  ('Corporate Panel TPA Visit', NULL, 4)
ON CONFLICT DO NOTHING;

-- ---- 4. doctors for staff screens ----------------------------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.clinic_doctors()
RETURNS TABLE (id uuid, auth_id uuid, name text, department text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT s.id, s.auth_id, s.name, s.department
  FROM staff s
  WHERE auth.uid() IS NOT NULL AND s.status = 'Active'
    AND (s.role = 'doctor' OR 'doctor' = ANY (coalesce(s.system_roles, ARRAY[]::text[])))
  ORDER BY s.name
$$;
REVOKE ALL ON FUNCTION public.clinic_doctors() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.clinic_doctors() TO authenticated;

-- ---- 2. assign a doctor to a waiting patient ----------------------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.assign_visit_doctor(p_visit_id uuid, p_doctor uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  PERFORM public.require_role(ARRAY['receptionist', 'clinic-assistant', 'doctor', 'admin']);
  IF p_doctor IS NOT NULL AND NOT EXISTS (
       SELECT 1 FROM staff s WHERE s.id = p_doctor AND s.status = 'Active'
         AND (s.role = 'doctor' OR 'doctor' = ANY (coalesce(s.system_roles, ARRAY[]::text[])))) THEN
    RAISE EXCEPTION 'Please choose an active doctor.' USING ERRCODE = 'P0001';
  END IF;
  UPDATE visits SET doctor_id = p_doctor
  WHERE id = p_visit_id AND status IN ('Awaiting Triage', 'Triaging', 'Awaiting Consult');
  IF NOT FOUND THEN
    RAISE EXCEPTION 'This patient can no longer be assigned to a doctor.' USING ERRCODE = 'P0001';
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.assign_visit_doctor(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.assign_visit_doctor(uuid, uuid) TO authenticated;

-- ---- calling a patient: room rules and the assigned doctor ------------------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.call_patient(uuid, text);
CREATE OR REPLACE FUNCTION public.call_patient(p_visit_id uuid, p_room text, p_override boolean DEFAULT false)
RETURNS json
LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
DECLARE
  v_status TEXT;
  v_called_by UUID;
  v_called_name TEXT;
  v_assigned UUID;
  v_room TEXT := nullif(left(trim(coalesce(p_room, '')), 60), '');
  v_me TEXT;
  v_my_staff UUID;
  v_assigned_name TEXT;
  v_room_name TEXT;
  v_room_user TEXT;
BEGIN
  PERFORM public.require_role(ARRAY['doctor']);

  SELECT status, called_by, called_by_name, doctor_id INTO v_status, v_called_by, v_called_name, v_assigned
  FROM visits WHERE id = p_visit_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Visit % not found or not accessible', p_visit_id USING ERRCODE = 'P0002';
  END IF;

  IF v_status = 'Consulting' AND v_called_by IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'This patient was already called by %.', coalesce(v_called_name, 'another doctor') USING ERRCODE = '42501';
  END IF;
  IF v_status NOT IN ('Awaiting Consult', 'Consulting') THEN
    RAISE EXCEPTION 'This visit is not waiting for a consultation.' USING ERRCODE = '42501';
  END IF;

  -- The patient was assigned to a different doctor: calling them anyway is allowed once the caller has confirmed.
  -- Doctors cannot read the staff table directly, so the lookups go through clinic_doctors().
  SELECT d.id INTO v_my_staff FROM clinic_doctors() d WHERE d.auth_id = auth.uid() LIMIT 1;
  IF v_status = 'Awaiting Consult' AND v_assigned IS NOT NULL AND v_assigned IS DISTINCT FROM v_my_staff AND NOT coalesce(p_override, false) THEN
    SELECT d.name INTO v_assigned_name FROM clinic_doctors() d WHERE d.id = v_assigned;
    RAISE EXCEPTION 'This patient is assigned to %.', coalesce(v_assigned_name, 'another doctor')
      USING ERRCODE = 'P0001', HINT = 'assigned_elsewhere';
  END IF;

  -- Rooms: once the clinic has a list, the room must be one of them and must be free.
  IF EXISTS (SELECT 1 FROM consultation_rooms WHERE active) THEN
    IF v_room IS NULL THEN
      RAISE EXCEPTION 'Please choose a consultation room.' USING ERRCODE = 'P0001';
    END IF;
    SELECT r.name INTO v_room_name FROM consultation_rooms r WHERE r.active AND lower(btrim(r.name)) = lower(btrim(v_room));
    IF v_room_name IS NULL THEN
      RAISE EXCEPTION 'That room is not available. Please choose a listed room.' USING ERRCODE = 'P0001';
    END IF;
    v_room := v_room_name;
    SELECT coalesce(called_by_name, 'another doctor') INTO v_room_user FROM visits
    WHERE status = 'Consulting' AND id <> p_visit_id AND lower(btrim(consult_room)) = lower(btrim(v_room)) LIMIT 1;
    IF FOUND THEN
      RAISE EXCEPTION '% is in use by %.', v_room, v_room_user USING ERRCODE = 'P0001', HINT = 'room_busy';
    END IF;
  END IF;

  SELECT full_name INTO v_me FROM profiles WHERE id = auth.uid();

  UPDATE visits
  SET status = 'Consulting',
      consult_room = v_room,
      called_by = auth.uid(),
      called_by_name = coalesce(v_me, 'Doctor'),
      called_at = now()
  WHERE id = p_visit_id;

  RETURN json_build_object('ok', true, 'room', v_room, 'called_by_name', coalesce(v_me, 'Doctor'), 'called_at', now());
END;
$$;
REVOKE ALL ON FUNCTION public.call_patient(uuid, text, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.call_patient(uuid, text, boolean) TO authenticated;

-- ---- booking: doctors for a service ---------------------------------------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.public_booking_doctors();
CREATE OR REPLACE FUNCTION public.public_booking_doctors(p_service text DEFAULT NULL)
RETURNS TABLE (id uuid, name text, department text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT s.id, s.name, s.department
  FROM staff s
  WHERE s.status = 'Active' AND (s.role = 'doctor' OR 'doctor' = ANY (coalesce(s.system_roles, ARRAY[]::text[])))
    AND (p_service IS NULL
         OR NOT EXISTS (SELECT 1 FROM booking_services b WHERE b.service = p_service AND b.department IS NOT NULL)
         OR EXISTS (SELECT 1 FROM booking_services b WHERE b.service = p_service AND lower(btrim(b.department)) = lower(btrim(s.department))))
  ORDER BY s.name
$$;
REVOKE ALL ON FUNCTION public.public_booking_doctors(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_booking_doctors(text) TO anon, authenticated;

-- ---- booking: the service must be offered and the doctor must see it ---------------------------------------------------------------------------
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
  v_doctor_dept text;
  v_service_dept text;
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
  IF NOT EXISTS (SELECT 1 FROM booking_services b WHERE b.service = p_service AND b.active) THEN
    RAISE EXCEPTION 'Please choose a service.' USING ERRCODE = 'P0001';
  END IF;
  IF v_notes IS NOT NULL AND char_length(v_notes) > 300 THEN
    RAISE EXCEPTION 'Please keep the note under 300 characters.' USING ERRCODE = 'P0001';
  END IF;

  SELECT s.name, s.department INTO v_doctor_name, v_doctor_dept FROM staff s WHERE s.id = p_doctor AND s.status = 'Active'
    AND (s.role = 'doctor' OR 'doctor' = ANY (coalesce(s.system_roles, ARRAY[]::text[])));
  IF v_doctor_name IS NULL THEN
    RAISE EXCEPTION 'Please choose a doctor.' USING ERRCODE = 'P0001';
  END IF;
  SELECT b.department INTO v_service_dept FROM booking_services b WHERE b.service = p_service;
  IF v_service_dept IS NOT NULL AND lower(btrim(v_service_dept)) IS DISTINCT FROM lower(btrim(coalesce(v_doctor_dept, ''))) THEN
    RAISE EXCEPTION 'That doctor does not see this service. Please choose another doctor.' USING ERRCODE = 'P0001';
  END IF;

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
