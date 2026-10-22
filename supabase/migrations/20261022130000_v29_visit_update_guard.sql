-- v29: Who may change a visit, and how
--
-- The "Staff can update visits" policy let every signed-in role (HR and pharmacy included) update any column of
-- any visit, so a visit could be set to Paid at RM 0.00 straight from the API, skipping billing_settle_visit.
-- This migration:
--   1. limits UPDATE on visits to the roles that work on visits (doctor, clinic-assistant, pharmacist, admin);
--   2. adds a trigger that enforces which role may move a visit between which statuses, keeps payment details
--      writable only by billing_settle_visit, keeps patient/date fixed, and makes Paid and Cancelled final;
--   3. rewrites signoff_consultation so it no longer trusts the caller's status or billing figures, only works on
--      a visit that is waiting for consultation, refuses once any prescription has been dispensed or skipped,
--      records the signing doctor and keeps each prescription's inventory link;
--   4. makes billing_settle_visit mark its own update so the trigger lets it through.
-- Sessions with no signed-in user (migrations, the SQL editor, server-side jobs) are not restricted by the trigger.
--
-- Status moves allowed by role:
--   clinic-assistant  Awaiting Triage > Triaging | Awaiting Consult ; Triaging > Awaiting Consult
--   doctor            Awaiting Consult > Consulting ; Awaiting Consult | Consulting > Awaiting Dispensation (only via signoff_consultation)
--   pharmacist        Awaiting Dispensation > Dispensing | Awaiting Billing ; Dispensing > Awaiting Billing
--   billing_settle_visit  Awaiting Billing > Paid (nobody else)
--   clinic-assistant, doctor, admin  any early stage (Awaiting Triage .. Consulting) > Cancelled
--   admin             may only cancel an early-stage visit

DROP POLICY IF EXISTS "Staff can update visits" ON visits;
CREATE POLICY "Clinical staff can update visits" ON visits
  FOR UPDATE
  USING (get_user_role() = ANY (ARRAY['doctor', 'clinic-assistant', 'pharmacist', 'admin']))
  WITH CHECK (get_user_role() = ANY (ARRAY['doctor', 'clinic-assistant', 'pharmacist', 'admin']));

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
      WHEN 'doctor' THEN ARRAY['Awaiting Consult>Consulting', 'Awaiting Consult>Awaiting Dispensation', 'Consulting>Awaiting Dispensation']
      WHEN 'pharmacist' THEN ARRAY['Awaiting Dispensation>Dispensing', 'Awaiting Dispensation>Awaiting Billing', 'Dispensing>Awaiting Billing']
    END;

    IF NOT (v_move = ANY (v_allowed)) THEN
      RAISE EXCEPTION 'A % cannot move a visit from % to %.', v_role, OLD.status, NEW.status USING ERRCODE = '42501';
    END IF;

    -- Finishing a consultation goes through signoff_consultation so the signing doctor is recorded.
    IF NEW.status = 'Awaiting Dispensation' AND coalesce(current_setting('mediclinic.in_signoff', true), 'off') <> 'on' THEN
      RAISE EXCEPTION 'A consultation is finished by signing it off.' USING ERRCODE = '42501';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS visits_transition_guard ON visits;
CREATE TRIGGER visits_transition_guard
  BEFORE UPDATE ON visits
  FOR EACH ROW EXECUTE FUNCTION public.guard_visit_update();

-- Signing off a consultation. The caller supplies the clinical content; the status, billing figures and signer are
-- decided here.
CREATE OR REPLACE FUNCTION public.signoff_consultation(
  visit_payload JSON,
  soap_payload JSON,
  rx_payload JSON
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_visit_id UUID;
  v_status TEXT;
  v_rx JSON;
BEGIN
  PERFORM public.require_role(ARRAY['doctor']);

  v_visit_id := (visit_payload->>'id')::UUID;

  SELECT status INTO v_status FROM visits WHERE id = v_visit_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Visit % not found or not accessible', v_visit_id USING ERRCODE = 'P0002';
  END IF;
  IF v_status NOT IN ('Awaiting Consult', 'Consulting') THEN
    RAISE EXCEPTION 'This visit is not waiting for a consultation.' USING ERRCODE = '42501';
  END IF;
  IF EXISTS (SELECT 1 FROM prescriptions WHERE visit_id = v_visit_id AND (dispensed_at IS NOT NULL OR skipped)) THEN
    RAISE EXCEPTION 'Prescriptions for this visit have already been dispensed or skipped.' USING ERRCODE = '42501';
  END IF;

  PERFORM set_config('mediclinic.in_signoff', 'on', true);
  UPDATE visits
  SET
    status = 'Awaiting Dispensation',
    mc_issued = coalesce((visit_payload->>'mc_issued')::BOOLEAN, false),
    signed_off_by = auth.uid(),
    signed_off_at = now()
  WHERE id = v_visit_id;
  PERFORM set_config('mediclinic.in_signoff', 'off', true);

  INSERT INTO soap_notes (
    visit_id, subjective, bp_systolic, bp_diastolic, heart_rate,
    temperature, respiratory_rate, icd_code, description, clinical_notes,
    follow_up_weeks, mc_days, requires_referral, pharmacy_memo
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
    soap_payload->>'pharmacy_memo'
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
    pharmacy_memo = EXCLUDED.pharmacy_memo;

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
$$;

-- billing_settle_visit again, now marking its own update so the trigger above lets it through.
CREATE OR REPLACE FUNCTION billing_settle_visit(
  p_visit_id UUID,
  p_payment_method TEXT,
  p_paid_amount NUMERIC,
  p_panel_claimed NUMERIC,
  p_total_bill NUMERIC,
  p_gl_number TEXT DEFAULT NULL,
  p_payment_reference TEXT DEFAULT NULL,
  p_bill JSONB DEFAULT NULL,
  p_panel_name TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_status TEXT;
  v_patient UUID;
  v_name TEXT;
  v_trx UUID;
  v_year INTEGER := extract(year FROM (now() AT TIME ZONE 'Asia/Kuala_Lumpur'))::int;
  v_n INTEGER;
  v_receipt TEXT;
BEGIN
  IF get_user_role() IS NULL OR get_user_role() NOT IN ('admin', 'clinic-assistant') THEN
    RAISE EXCEPTION 'You are not allowed to take payments.' USING ERRCODE = '42501';
  END IF;

  IF p_payment_method NOT IN ('Cash', 'Credit Card', 'e-Wallet', 'Panel') THEN
    RAISE EXCEPTION 'Unknown payment method.';
  END IF;
  IF p_paid_amount IS NULL OR p_panel_claimed IS NULL OR p_total_bill IS NULL
     OR p_paid_amount < 0 OR p_panel_claimed < 0 OR p_total_bill < 0 THEN
    RAISE EXCEPTION 'Amounts must be zero or more.';
  END IF;
  IF abs((p_paid_amount + p_panel_claimed) - p_total_bill) > 0.01 THEN
    RAISE EXCEPTION 'The amounts do not add up to the bill total.';
  END IF;
  IF p_panel_claimed > 0 AND coalesce(btrim(p_gl_number), '') = '' THEN
    RAISE EXCEPTION 'A panel claim needs a guarantee letter reference.';
  END IF;
  IF p_payment_method = 'Panel' AND p_panel_claimed <= 0 THEN
    RAISE EXCEPTION 'A panel payment needs a claimed amount.';
  END IF;
  IF p_payment_method IN ('Credit Card', 'e-Wallet') AND coalesce(btrim(p_payment_reference), '') = '' THEN
    RAISE EXCEPTION 'A card or e-wallet payment needs a payment reference.';
  END IF;
  IF p_bill IS NOT NULL THEN
    IF jsonb_typeof(p_bill) <> 'object' OR jsonb_typeof(p_bill->'lines') <> 'array'
       OR abs(coalesce((p_bill->>'grandTotal')::numeric, -1) - p_total_bill) > 0.01 THEN
      RAISE EXCEPTION 'The itemised bill does not match the total.';
    END IF;
  END IF;

  SELECT v.status, v.patient_id INTO v_status, v_patient FROM visits v WHERE v.id = p_visit_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Visit not found.';
  END IF;
  IF v_status = 'Paid' THEN
    RAISE EXCEPTION 'This visit has already been paid.';
  END IF;
  IF v_status <> 'Awaiting Billing' THEN
    RAISE EXCEPTION 'This visit is not ready for billing.';
  END IF;

  SELECT full_name INTO v_name FROM patients WHERE id = v_patient;

  -- The row lock on the counter serialises concurrent payments; a rollback also undoes the increment.
  INSERT INTO receipt_counters (year, last_no) VALUES (v_year, 1)
  ON CONFLICT (year) DO UPDATE SET last_no = receipt_counters.last_no + 1
  RETURNING last_no INTO v_n;
  v_receipt := 'RC-' || v_year || '-' || lpad(v_n::text, 6, '0');

  PERFORM set_config('mediclinic.in_billing', 'on', true);
  UPDATE visits SET
    status = 'Paid',
    payment_method = p_payment_method,
    paid_amount = p_paid_amount,
    panel_claimed = p_panel_claimed,
    total_bill = p_total_bill,
    gl_number = CASE WHEN p_panel_claimed > 0 THEN btrim(p_gl_number) ELSE NULL END,
    updated_at = now()
  WHERE id = p_visit_id;
  PERFORM set_config('mediclinic.in_billing', 'off', true);

  INSERT INTO transactions (patient_id, visit_id, payment_method, paid_amount, panel_claimed, gl_number, status,
                            payment_reference, receipt_no, patient_name, panel_name, bill)
  VALUES (
    v_patient, p_visit_id, p_payment_method, p_paid_amount, p_panel_claimed,
    CASE WHEN p_panel_claimed > 0 THEN btrim(p_gl_number) ELSE NULL END,
    CASE WHEN p_panel_claimed > 0 THEN 'Pending Claim' ELSE 'Completed' END,
    nullif(btrim(p_payment_reference), ''), v_receipt, v_name,
    CASE WHEN p_panel_claimed > 0 THEN nullif(btrim(p_panel_name), '') ELSE NULL END,
    p_bill
  )
  RETURNING id INTO v_trx;

  RETURN jsonb_build_object('transaction_id', v_trx, 'receipt_no', v_receipt);
END;
$$;

REVOKE ALL ON FUNCTION billing_settle_visit(UUID, TEXT, NUMERIC, NUMERIC, NUMERIC, TEXT, TEXT, JSONB, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION billing_settle_visit(UUID, TEXT, NUMERIC, NUMERIC, NUMERIC, TEXT, TEXT, JSONB, TEXT) TO authenticated;
