-- V5 Schema Update: RPC Functions and Performance Indexing

-- Create RPC for atomic consultation sign-off
CREATE OR REPLACE FUNCTION signoff_consultation(
  visit_payload JSON,
  soap_payload JSON,
  rx_payload JSON
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_visit_id UUID;
  v_rx JSON;
BEGIN
  -- Extract visit ID
  v_visit_id := (visit_payload->>'id')::UUID;

  -- 1. Update the visits table
  UPDATE visits
  SET
    status = visit_payload->>'status',
    total_bill = (visit_payload->>'total_bill')::NUMERIC,
    panel_claimed = (visit_payload->>'panel_claimed')::NUMERIC,
    paid_amount = (visit_payload->>'paid_amount')::NUMERIC,
    payment_method = visit_payload->>'payment_method',
    mc_issued = (visit_payload->>'mc_issued')::BOOLEAN
  WHERE id = v_visit_id;

  -- 2. Upsert the soap_notes
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

  -- 3. Replace prescriptions
  -- Delete existing prescriptions for this visit
  DELETE FROM prescriptions WHERE visit_id = v_visit_id;
  
  -- Insert new prescriptions
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

-- Add indexes for better performance on large tables
CREATE INDEX IF NOT EXISTS idx_patients_ic_number ON patients(ic_number);
CREATE INDEX IF NOT EXISTS idx_visits_patient_id ON visits(patient_id);
CREATE INDEX IF NOT EXISTS idx_visits_status ON visits(status);
