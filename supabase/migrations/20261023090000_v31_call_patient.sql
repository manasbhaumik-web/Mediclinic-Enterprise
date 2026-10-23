-- v31: Calling a patient is a saved, shared status
--
-- "Call patient" used to be a chime and a toast in the doctor's browser: nothing was saved, other screens could not
-- see it and two doctors could call the same patient. Now:
--   1. visits records who called the patient, from which room and when (consult_room, called_by, called_by_name,
--      called_at);
--   2. call_patient(visit, room) moves Awaiting Consult > Consulting under a row lock, so only one doctor can take a
--      patient; the same doctor may call again (to change the room), another doctor is told who has the patient;
--   3. release_patient(visit) puts the patient back in the queue (the patient did not arrive, called by mistake).
--      Only the doctor who called can release, and only before the consultation is signed off;
--   4. the transition guard allows the doctor's Consulting > Awaiting Consult move, for the calling doctor only.
-- Visits are already published to realtime, so every signed-in screen sees the change straight away.

ALTER TABLE visits
  ADD COLUMN IF NOT EXISTS consult_room TEXT,
  ADD COLUMN IF NOT EXISTS called_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS called_by_name TEXT,
  ADD COLUMN IF NOT EXISTS called_at TIMESTAMPTZ;

CREATE OR REPLACE FUNCTION public.guard_visit_update()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_role TEXT;
  v_move TEXT;
  v_early TEXT[] := ARRAY['Awaiting Triage', 'Triaging', 'Awaiting Consult', 'Consulting'];
  v_allowed TEXT[];
BEGIN
  -- No signed-in user: a migration, the SQL editor or a server-side job.
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.id IS DISTINCT FROM OLD.id OR NEW.patient_id IS DISTINCT FROM OLD.patient_id OR NEW.visit_date IS DISTINCT FROM OLD.visit_date THEN
    RAISE EXCEPTION 'A visit''s patient and date cannot be changed.' USING ERRCODE = '42501';
  END IF;

  -- billing_settle_visit marks its own update; it may only settle a visit that is waiting for billing.
  IF coalesce(current_setting('mediclinic.in_billing', true), 'off') = 'on' THEN
    IF OLD.status = 'Awaiting Billing' AND NEW.status = 'Paid' THEN
      RETURN NEW;
    END IF;
    RAISE EXCEPTION 'Only a visit that is awaiting billing can be settled.' USING ERRCODE = '42501';
  END IF;

  IF OLD.status IN ('Paid', 'Cancelled') THEN
    RAISE EXCEPTION 'A % visit cannot be changed.', lower(OLD.status) USING ERRCODE = '42501';
  END IF;

  IF NEW.total_bill IS DISTINCT FROM OLD.total_bill
     OR NEW.paid_amount IS DISTINCT FROM OLD.paid_amount
     OR NEW.panel_claimed IS DISTINCT FROM OLD.panel_claimed
     OR NEW.payment_method IS DISTINCT FROM OLD.payment_method
     OR NEW.gl_number IS DISTINCT FROM OLD.gl_number THEN
    RAISE EXCEPTION 'Payment details can only be recorded at the cashier desk.' USING ERRCODE = '42501';
  END IF;

  v_role := get_user_role();

  IF v_role = 'admin' THEN
    IF NEW.status = 'Cancelled' AND OLD.status = ANY (v_early) THEN
      RETURN NEW;
    END IF;
    RAISE EXCEPTION 'Administrators can only cancel a visit that has not been consulted yet.' USING ERRCODE = '42501';
  END IF;

  IF v_role IS NULL OR v_role NOT IN ('doctor', 'clinic-assistant', 'pharmacist') THEN
    RAISE EXCEPTION 'Your role cannot change visits.' USING ERRCODE = '42501';
  END IF;

  IF NEW.mc_issued IS DISTINCT FROM OLD.mc_issued AND v_role <> 'doctor' THEN
    RAISE EXCEPTION 'Only a doctor can issue a medical certificate.' USING ERRCODE = '42501';
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    v_move := OLD.status || '>' || NEW.status;

    IF NEW.status = 'Cancelled' THEN
      IF v_role = 'pharmacist' OR NOT (OLD.status = ANY (v_early)) THEN
        RAISE EXCEPTION 'This visit can no longer be cancelled.' USING ERRCODE = '42501';
      END IF;
      RETURN NEW;
    END IF;

    v_allowed := CASE v_role
      WHEN 'clinic-assistant' THEN ARRAY['Awaiting Triage>Triaging', 'Awaiting Triage>Awaiting Consult', 'Triaging>Awaiting Consult']
      WHEN 'doctor' THEN ARRAY['Awaiting Consult>Consulting', 'Consulting>Awaiting Consult', 'Awaiting Consult>Awaiting Dispensation', 'Consulting>Awaiting Dispensation']
      WHEN 'pharmacist' THEN ARRAY['Awaiting Dispensation>Dispensing', 'Awaiting Dispensation>Awaiting Billing', 'Dispensing>Awaiting Billing']
    END;

    IF NOT (v_move = ANY (v_allowed)) THEN
      RAISE EXCEPTION 'A % cannot move a visit from % to %.', v_role, OLD.status, NEW.status USING ERRCODE = '42501';
    END IF;

    -- A patient goes back to the queue only by the doctor who called them.
    IF v_move = 'Consulting>Awaiting Consult' AND OLD.called_by IS DISTINCT FROM auth.uid() THEN
      RAISE EXCEPTION 'Only the doctor who called this patient can return them to the queue.' USING ERRCODE = '42501';
    END IF;

    -- Finishing a consultation goes through signoff_consultation so the signing doctor is recorded.
    IF NEW.status = 'Awaiting Dispensation' AND coalesce(current_setting('mediclinic.in_signoff', true), 'off') <> 'on' THEN
      RAISE EXCEPTION 'A consultation is finished by signing it off.' USING ERRCODE = '42501';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Take a patient into a consultation room.
CREATE OR REPLACE FUNCTION public.call_patient(p_visit_id UUID, p_room TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_status TEXT;
  v_called_by UUID;
  v_called_name TEXT;
  v_room TEXT := nullif(left(trim(coalesce(p_room, '')), 60), '');
  v_me TEXT;
BEGIN
  PERFORM public.require_role(ARRAY['doctor']);

  SELECT status, called_by, called_by_name INTO v_status, v_called_by, v_called_name
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

-- Put a called patient back in the queue (did not arrive, or called by mistake).
CREATE OR REPLACE FUNCTION public.release_patient(p_visit_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_status TEXT;
  v_called_by UUID;
BEGIN
  PERFORM public.require_role(ARRAY['doctor']);

  SELECT status, called_by INTO v_status, v_called_by FROM visits WHERE id = p_visit_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Visit % not found or not accessible', p_visit_id USING ERRCODE = 'P0002';
  END IF;
  IF v_status <> 'Consulting' THEN
    RAISE EXCEPTION 'This patient is not in a consultation.' USING ERRCODE = '42501';
  END IF;
  IF v_called_by IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Only the doctor who called this patient can return them to the queue.' USING ERRCODE = '42501';
  END IF;

  UPDATE visits
  SET status = 'Awaiting Consult', consult_room = NULL, called_by = NULL, called_by_name = NULL, called_at = NULL
  WHERE id = p_visit_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.call_patient(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.release_patient(UUID) TO authenticated;

-- Realtime: the app listens for changes to visits, but no table was published, so screens only saw a call after a
-- manual refresh. Publish visits (row-level security still decides who receives each change).
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'visits') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.visits;
  END IF;
END
$$;
