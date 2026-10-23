-- v32: Queue ticket numbers
--
-- Every visit gets a short ticket number that restarts each day (clinic time, Asia/Kuala_Lumpur): #001, #002, ...
-- The doctor's queue, the call message and the patient bar show it, so staff and patients can name a visit
-- without reading out a full name. The number is given by the database when the visit is created, under the
-- counter row's lock, so two visits registered at the same moment cannot get the same number. Nobody can change
-- it afterwards (the update guard refuses). Visits created before this migration have no ticket.

ALTER TABLE visits
  ADD COLUMN IF NOT EXISTS ticket_no INTEGER,
  ADD COLUMN IF NOT EXISTS ticket_day DATE;

CREATE UNIQUE INDEX IF NOT EXISTS visits_ticket_per_day ON visits (ticket_day, ticket_no) WHERE ticket_no IS NOT NULL;

-- One counter row per day. Only the trigger below touches it.
CREATE TABLE IF NOT EXISTS ticket_counters (
  day DATE PRIMARY KEY,
  last_no INTEGER NOT NULL DEFAULT 0
);
ALTER TABLE ticket_counters ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.assign_visit_ticket()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_day DATE := (now() AT TIME ZONE 'Asia/Kuala_Lumpur')::date;
  v_no INTEGER;
BEGIN
  IF NEW.ticket_no IS NOT NULL THEN
    RETURN NEW;
  END IF;
  INSERT INTO ticket_counters AS c (day, last_no) VALUES (v_day, 1)
  ON CONFLICT (day) DO UPDATE SET last_no = c.last_no + 1
  RETURNING last_no INTO v_no;
  NEW.ticket_no := v_no;
  NEW.ticket_day := v_day;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS visits_assign_ticket ON visits;
CREATE TRIGGER visits_assign_ticket
  BEFORE INSERT ON visits
  FOR EACH ROW EXECUTE FUNCTION public.assign_visit_ticket();

-- The update guard again (as in v31), now also refusing any change to the ticket.
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

  IF NEW.ticket_no IS DISTINCT FROM OLD.ticket_no OR NEW.ticket_day IS DISTINCT FROM OLD.ticket_day THEN
    RAISE EXCEPTION 'A visit''s ticket number cannot be changed.' USING ERRCODE = '42501';
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
