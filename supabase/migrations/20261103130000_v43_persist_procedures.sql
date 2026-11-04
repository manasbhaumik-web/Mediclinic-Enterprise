-- v43: treatment-room procedures are saved, and sign-off sends the patient to the treatment room first.
--
-- Procedures a doctor ordered lived only in the browser: nothing stored them, sign-off always went to the pharmacy,
-- and a nurse's completion details were lost on reload.
--
--   1. soap_notes.procedures keeps the ordered procedures and their completion details.
--   2. signoff_consultation stores them and moves the visit to 'Awaiting Procedure' when any is still pending,
--      otherwise to 'Awaiting Dispensation' as before.
--   3. guard_visit_update lets the doctor make that move (only through sign-off). The nurse's step from
--      'Awaiting Procedure' to 'Awaiting Dispensation' already existed (v39).

ALTER TABLE public.soap_notes ADD COLUMN IF NOT EXISTS procedures jsonb NOT NULL DEFAULT '[]'::jsonb;

CREATE OR REPLACE FUNCTION public.guard_visit_update()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_roles TEXT[];
  v_move TEXT;
  v_early TEXT[] := ARRAY['Awaiting Triage', 'Triaging', 'Awaiting Consult', 'Consulting'];
  v_allowed TEXT[] := ARRAY[]::TEXT[];
  v_clinical BOOLEAN;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.ticket_no IS DISTINCT FROM OLD.ticket_no OR NEW.ticket_day IS DISTINCT FROM OLD.ticket_day THEN
    RAISE EXCEPTION 'A visit''s ticket number cannot be changed.' USING ERRCODE = '42501';
  END IF;

  IF NEW.id IS DISTINCT FROM OLD.id OR NEW.patient_id IS DISTINCT FROM OLD.patient_id OR NEW.visit_date IS DISTINCT FROM OLD.visit_date THEN
    RAISE EXCEPTION 'A visit''s patient and date cannot be changed.' USING ERRCODE = '42501';
  END IF;

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

  v_roles := coalesce(public.get_user_roles(), ARRAY[]::TEXT[]);
  v_clinical := v_roles && ARRAY['doctor', 'receptionist', 'clinic-assistant', 'pharmacist'];

  IF 'admin' = ANY (v_roles) AND NOT v_clinical THEN
    IF NEW.status = 'Cancelled' AND OLD.status = ANY (v_early) THEN
      RETURN NEW;
    END IF;
    RAISE EXCEPTION 'Administrators can only cancel a visit that has not been consulted yet.' USING ERRCODE = '42501';
  END IF;

  IF NOT v_clinical THEN
    RAISE EXCEPTION 'Your role cannot change visits.' USING ERRCODE = '42501';
  END IF;

  IF NEW.mc_issued IS DISTINCT FROM OLD.mc_issued AND NOT ('doctor' = ANY (v_roles)) THEN
    RAISE EXCEPTION 'Only a doctor can issue a medical certificate.' USING ERRCODE = '42501';
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    v_move := OLD.status || '>' || NEW.status;

    IF NEW.status = 'Cancelled' THEN
      IF NOT (
        (OLD.status = ANY (v_early) AND v_roles && ARRAY['doctor', 'clinic-assistant', 'admin'])
        OR (OLD.status = 'Awaiting Triage' AND 'receptionist' = ANY (v_roles))
      ) THEN
        RAISE EXCEPTION 'This visit can no longer be cancelled.' USING ERRCODE = '42501';
      END IF;
      RETURN NEW;
    END IF;

    IF 'clinic-assistant' = ANY (v_roles) THEN
      v_allowed := v_allowed || ARRAY[
        'Awaiting Triage>Triaging', 'Awaiting Triage>Awaiting Consult', 'Triaging>Awaiting Consult',
        'Holding for Results>Awaiting Consult', 'Awaiting Procedure>Awaiting Dispensation'
      ];
    END IF;
    IF 'doctor' = ANY (v_roles) THEN
      v_allowed := v_allowed || ARRAY[
        'Awaiting Consult>Consulting', 'Consulting>Awaiting Consult', 'Awaiting Consult>Awaiting Dispensation', 'Consulting>Awaiting Dispensation',
        'Consulting>Holding for Results', 'Holding for Results>Awaiting Consult', 'Holding for Results>Awaiting Dispensation',
        'Awaiting Consult>Awaiting Procedure', 'Consulting>Awaiting Procedure', 'Holding for Results>Awaiting Procedure'
      ];
    END IF;
    IF 'pharmacist' = ANY (v_roles) THEN
      v_allowed := v_allowed || ARRAY['Awaiting Dispensation>Dispensing', 'Awaiting Dispensation>Awaiting Billing', 'Dispensing>Awaiting Billing'];
    END IF;

    IF NOT (v_move = ANY (v_allowed)) THEN
      RAISE EXCEPTION 'Your role cannot move a visit from % to %.', OLD.status, NEW.status USING ERRCODE = '42501';
    END IF;

    IF v_move = 'Consulting>Awaiting Consult' AND OLD.called_by IS DISTINCT FROM auth.uid() THEN
      RAISE EXCEPTION 'Only the doctor who called this patient can return them to the queue.' USING ERRCODE = '42501';
    END IF;

    IF NEW.status = 'Awaiting Procedure' AND coalesce(current_setting('mediclinic.in_signoff', true), 'off') <> 'on' THEN
      RAISE EXCEPTION 'A consultation is finished by signing it off.' USING ERRCODE = '42501';
    END IF;

    IF NEW.status = 'Awaiting Dispensation' AND coalesce(current_setting('mediclinic.in_signoff', true), 'off') <> 'on' AND OLD.status <> 'Awaiting Procedure' THEN
      RAISE EXCEPTION 'A consultation is finished by signing it off.' USING ERRCODE = '42501';
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

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
