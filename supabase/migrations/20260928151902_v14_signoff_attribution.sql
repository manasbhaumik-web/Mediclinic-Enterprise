ALTER TABLE visits
  ADD COLUMN IF NOT EXISTS signed_off_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS signed_off_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_visits_signed_off_by ON visits (signed_off_by);

CREATE OR REPLACE FUNCTION public.guard_signoff_attribution()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  IF coalesce(current_setting('mediclinic.in_signoff', true), 'off') = 'on' THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'INSERT' THEN
    IF NEW.signed_off_by IS NOT NULL OR NEW.signed_off_at IS NOT NULL THEN
      RAISE EXCEPTION 'Sign-off attribution can only be set by signing off a consultation' USING ERRCODE = '42501';
    END IF;
  ELSIF NEW.signed_off_by IS DISTINCT FROM OLD.signed_off_by
     OR NEW.signed_off_at IS DISTINCT FROM OLD.signed_off_at THEN
    RAISE EXCEPTION 'Sign-off attribution can only be set by signing off a consultation' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_signoff_attribution ON visits;
CREATE TRIGGER trg_guard_signoff_attribution
  BEFORE INSERT OR UPDATE ON visits
  FOR EACH ROW EXECUTE FUNCTION public.guard_signoff_attribution();

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
  v_rx JSON;
BEGIN
  PERFORM public.require_role(ARRAY['doctor']);

  v_visit_id := (visit_payload->>'id')::UUID;

  PERFORM set_config('mediclinic.in_signoff', 'on', true);
  UPDATE visits
  SET
    status = visit_payload->>'status',
    total_bill = (visit_payload->>'total_bill')::NUMERIC,
    panel_claimed = (visit_payload->>'panel_claimed')::NUMERIC,
    paid_amount = (visit_payload->>'paid_amount')::NUMERIC,
    payment_method = visit_payload->>'payment_method',
    mc_issued = (visit_payload->>'mc_issued')::BOOLEAN,
    signed_off_by = auth.uid(),
    signed_off_at = now()
  WHERE id = v_visit_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Visit % not found or not accessible', v_visit_id USING ERRCODE = 'P0002';
  END IF;
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

  IF json_array_length(rx_payload) > 0 THEN
    FOR v_rx IN SELECT * FROM json_array_elements(rx_payload)
    LOOP
      INSERT INTO prescriptions (
        visit_id, drug_name, dosage, dosage_bm, frequency,
        quantity, price_per_unit, expiry_date, pill_color, capsule_style
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
        v_rx->>'capsule_style'
      );
    END LOOP;
  END IF;
END;
$$;

DROP FUNCTION IF EXISTS public.admin_patient_encounters(uuid);
CREATE FUNCTION public.admin_patient_encounters(p_patient_id uuid)
RETURNS TABLE (
  visit_id uuid,
  visit_date timestamptz,
  status text,
  icd_code text,
  diagnosis text,
  total_bill numeric,
  panel_claimed numeric,
  paid_amount numeric,
  payment_method text,
  gl_number text,
  mc_issued boolean,
  mc_days integer,
  requires_referral boolean,
  prescription_items integer,
  doctor_name text,
  signed_off_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  PERFORM public.require_role(ARRAY['admin']);
  RETURN QUERY
  SELECT v.id, coalesce(v.visit_date, v.created_at), v.status,
         nullif(s.icd_code, 'N/A'), nullif(s.description, 'N/A'),
         v.total_bill, v.panel_claimed, v.paid_amount, v.payment_method, v.gl_number,
         v.mc_issued, s.mc_days, s.requires_referral,
         (SELECT count(*)::int FROM prescriptions p WHERE p.visit_id = v.id),
         d.full_name, v.signed_off_at
  FROM visits v
  LEFT JOIN soap_notes s ON s.visit_id = v.id
  LEFT JOIN profiles d ON d.id = v.signed_off_by
  WHERE v.patient_id = p_patient_id
  ORDER BY coalesce(v.visit_date, v.created_at) DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.report_visits_by_doctor(p_from date, p_to date)
RETURNS TABLE (doctor_name text, consultations integer, patients integer, with_mc integer, referrals integer)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  PERFORM public.require_role(ARRAY['admin']);
  RETURN QUERY
  SELECT coalesce(d.full_name, 'Not recorded'),
         count(*)::int,
         count(DISTINCT v.patient_id)::int,
         count(*) FILTER (WHERE v.mc_issued)::int,
         count(*) FILTER (WHERE s.requires_referral)::int
  FROM visits v
  LEFT JOIN soap_notes s ON s.visit_id = v.id
  LEFT JOIN profiles d ON d.id = v.signed_off_by
  WHERE public.visit_local_date(v) BETWEEN p_from AND p_to
    AND v.status IN ('Awaiting Dispensation', 'Dispensing', 'Awaiting Billing', 'Paid')
  GROUP BY 1
  ORDER BY count(*) DESC, 1;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_patient_encounters(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.report_visits_by_doctor(date, date) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.signoff_consultation(json, json, json) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_patient_encounters(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.report_visits_by_doctor(date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.signoff_consultation(json, json, json) TO authenticated;
