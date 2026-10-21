-- v11: Phase 0 hardening - make the clinical workflow persistable under real auth

-- 1. Visit statuses: the app starts visits at 'Awaiting Triage' and soft-cancels
--    with 'Cancelled', neither of which the original check allowed.
ALTER TABLE visits DROP CONSTRAINT IF EXISTS visits_status_check;
ALTER TABLE visits ADD CONSTRAINT visits_status_check CHECK (status IN (
  'Awaiting Triage', 'Triaging', 'Awaiting Consult', 'Consulting',
  'Awaiting Dispensation', 'Dispensing', 'Awaiting Billing', 'Paid', 'Cancelled'
));

-- 2. Remove legacy blanket policies that v6/v7 did not drop. Permissive policies
--    are OR-ed, so while these existed the role-based policies had no effect.
DROP POLICY IF EXISTS "Allow authenticated full access to patients" ON patients;
DROP POLICY IF EXISTS "Allow authenticated full access to visits" ON visits;
DROP POLICY IF EXISTS "Allow authenticated read access to staff" ON staff;

-- 3. SOAP notes: clinic assistants record the chief complaint and vitals at
--    registration/triage; pharmacists need the plan and pharmacy memo to dispense.
CREATE POLICY "Assistants can read SOAP notes" ON soap_notes
  FOR SELECT USING (public.get_user_role() IN ('clinic-assistant', 'pharmacist'));
CREATE POLICY "Assistants can insert triage SOAP notes" ON soap_notes
  FOR INSERT WITH CHECK (public.get_user_role() = 'clinic-assistant');
CREATE POLICY "Assistants can update triage SOAP notes" ON soap_notes
  FOR UPDATE USING (public.get_user_role() = 'clinic-assistant')
  WITH CHECK (public.get_user_role() = 'clinic-assistant');

-- 4. Prescriptions: sign-off replaces a visit's prescriptions, which needs DELETE.
--    Without this policy the delete matched no rows and re-inserts duplicated them.
CREATE POLICY "Doctors can delete prescriptions" ON prescriptions
  FOR DELETE USING (public.get_user_role() = 'doctor');
