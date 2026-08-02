-- V7 Schema Update: Complete RLS and RPC Patch

-- 1. Enable RLS on auxiliary tables that were missed
ALTER TABLE tpa_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE icd10_catalog ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing overly permissive policies
DROP POLICY IF EXISTS "Allow authenticated full access" ON staff;
DROP POLICY IF EXISTS "Allow authenticated full access" ON equipment;
DROP POLICY IF EXISTS "Allow authenticated full access" ON equipment_logs;
DROP POLICY IF EXISTS "Allow authenticated full access" ON transactions;
DROP POLICY IF EXISTS "Allow authenticated full access" ON clinic_settings;
DROP POLICY IF EXISTS "Allow authenticated full access" ON drug_batches;
DROP POLICY IF EXISTS "Allow authenticated full access" ON inventory_logs;

-- 3. Create Strict RBAC Policies

-- Staff (HR Data): Only Admin and HR can read/write full details. Others can only read basic info if needed? 
-- Actually, the app only shows the Staff Management module to admin/hr.
CREATE POLICY "Admin and HR can manage staff" ON staff
  FOR ALL USING (public.get_user_role() IN ('admin', 'hr')) WITH CHECK (public.get_user_role() IN ('admin', 'hr'));

-- Transactions (Financial Data): Admin and Clinic Assistants (Cashier)
CREATE POLICY "Cashier and Admin can manage transactions" ON transactions
  FOR ALL USING (public.get_user_role() IN ('admin', 'clinic-assistant')) WITH CHECK (public.get_user_role() IN ('admin', 'clinic-assistant'));

-- Equipment: Admin reads/writes, Doctors/Staff can read
CREATE POLICY "All staff can read equipment" ON equipment
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admin can manage equipment" ON equipment
  FOR ALL USING (public.get_user_role() = 'admin') WITH CHECK (public.get_user_role() = 'admin');

-- Equipment Logs: Admin reads/writes, Staff can read
CREATE POLICY "All staff can read equipment logs" ON equipment_logs
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admin can manage equipment logs" ON equipment_logs
  FOR ALL USING (public.get_user_role() = 'admin') WITH CHECK (public.get_user_role() = 'admin');

-- Clinic Settings: All can read, only Admin can write
CREATE POLICY "All staff can read settings" ON clinic_settings
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admin can update settings" ON clinic_settings
  FOR UPDATE USING (public.get_user_role() = 'admin') WITH CHECK (public.get_user_role() = 'admin');

-- Drug Batches & Inventory Logs: Pharmacists and Admins
CREATE POLICY "Pharmacist and Admin can manage drug batches" ON drug_batches
  FOR ALL USING (public.get_user_role() IN ('pharmacist', 'admin')) WITH CHECK (public.get_user_role() IN ('pharmacist', 'admin'));
CREATE POLICY "All staff can read drug batches" ON drug_batches
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Pharmacist and Admin can manage inventory logs" ON inventory_logs
  FOR ALL USING (public.get_user_role() IN ('pharmacist', 'admin')) WITH CHECK (public.get_user_role() IN ('pharmacist', 'admin'));
CREATE POLICY "All staff can read inventory logs" ON inventory_logs
  FOR SELECT USING (auth.role() = 'authenticated');

-- TPA Config & ICD10 Catalog: All can read, Admin can write
CREATE POLICY "All staff can read tpa_config" ON tpa_config
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admin can manage tpa_config" ON tpa_config
  FOR ALL USING (public.get_user_role() = 'admin') WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "All staff can read icd10" ON icd10_catalog
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admin can manage icd10" ON icd10_catalog
  FOR ALL USING (public.get_user_role() = 'admin') WITH CHECK (public.get_user_role() = 'admin');


-- 4. Patch RPC to prevent Privilege Escalation
-- Dropping the SECURITY DEFINER function and recreating it as SECURITY INVOKER
DROP FUNCTION IF EXISTS signoff_consultation;

CREATE OR REPLACE FUNCTION signoff_consultation(
  visit_payload JSON,
  soap_payload JSON,
  rx_payload JSON
)
RETURNS void
LANGUAGE plpgsql
-- SECURITY INVOKER ensures that the function runs with the privileges of the calling user,
-- effectively enforcing RLS policies inside the function.
SECURITY INVOKER
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
