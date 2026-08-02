-- v6: Implement strict RLS and actual Authentication

-- 1. Fix the profiles constraint to match frontend roles
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('doctor', 'pharmacist', 'clinic-assistant', 'admin', 'hr'));

-- 2. Drop existing overly permissive policies
DROP POLICY IF EXISTS "Allow authenticated full access" ON patients;
DROP POLICY IF EXISTS "Allow authenticated full access" ON visits;
DROP POLICY IF EXISTS "Allow authenticated full access" ON soap_notes;
DROP POLICY IF EXISTS "Allow authenticated full access" ON prescriptions;
DROP POLICY IF EXISTS "Allow authenticated full access" ON inventory;
DROP POLICY IF EXISTS "Allow authenticated full access" ON profiles;

-- 3. Create a helper function to get the current user's role securely
CREATE OR REPLACE FUNCTION public.get_user_role() 
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role FROM public.profiles WHERE id = auth.uid();
  RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Recreate Role-Based Access Control (RBAC) Policies

-- Profiles: Users can read their own profile
CREATE POLICY "Users can read own profile" ON profiles 
  FOR SELECT USING (auth.uid() = id);

-- Patients: All authenticated users can read. Doctors and Assistants can insert.
CREATE POLICY "All staff can read patients" ON patients 
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Doctors and Assistants can insert patients" ON patients 
  FOR INSERT WITH CHECK (public.get_user_role() IN ('doctor', 'clinic-assistant', 'admin'));

-- Visits: All authenticated users can read.
CREATE POLICY "All staff can read visits" ON visits 
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Staff can update visits" ON visits 
  FOR UPDATE USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Assistants and Doctors can insert visits" ON visits 
  FOR INSERT WITH CHECK (public.get_user_role() IN ('doctor', 'clinic-assistant', 'admin'));

-- SOAP Notes: STRICT (Only Doctors can Read/Write)
CREATE POLICY "Only doctors can read SOAP notes" ON soap_notes 
  FOR SELECT USING (public.get_user_role() = 'doctor');
CREATE POLICY "Only doctors can insert SOAP notes" ON soap_notes 
  FOR INSERT WITH CHECK (public.get_user_role() = 'doctor');
CREATE POLICY "Only doctors can update SOAP notes" ON soap_notes 
  FOR UPDATE USING (public.get_user_role() = 'doctor') WITH CHECK (public.get_user_role() = 'doctor');

-- Prescriptions: Doctors and Pharmacists
CREATE POLICY "Docs and Pharm can read prescriptions" ON prescriptions 
  FOR SELECT USING (public.get_user_role() IN ('doctor', 'pharmacist'));
CREATE POLICY "Only doctors can insert prescriptions" ON prescriptions 
  FOR INSERT WITH CHECK (public.get_user_role() = 'doctor');
CREATE POLICY "Pharmacists can update prescriptions" ON prescriptions 
  FOR UPDATE USING (public.get_user_role() IN ('doctor', 'pharmacist')) WITH CHECK (public.get_user_role() IN ('doctor', 'pharmacist'));

-- Inventory: All staff can read, Pharmacists can update
CREATE POLICY "All staff can read inventory" ON inventory 
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Pharmacists can update inventory" ON inventory 
  FOR UPDATE USING (public.get_user_role() IN ('pharmacist', 'admin')) WITH CHECK (public.get_user_role() IN ('pharmacist', 'admin'));

-- 5. Seed Test Users (Using pgcrypto to hash the password 'password123')
-- We use a DO block to seed users if they do not exist
DO $$
DECLARE
  doctor_uid UUID := '11111111-1111-1111-1111-111111111111';
  pharmacist_uid UUID := '22222222-2222-2222-2222-222222222222';
  assistant_uid UUID := '33333333-3333-3333-3333-333333333333';
  hashed_pwd TEXT;
BEGIN
  -- We assume 'password123' encrypts to this standard bcrypt hash for Supabase
  hashed_pwd := crypt('password123', gen_salt('bf'));

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'doctor@mediclinic.local') THEN
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, confirmation_token, email_change, email_change_token_new, recovery_token)
    VALUES (doctor_uid, '00000000-0000-0000-0000-000000000000', 'doctor@mediclinic.local', hashed_pwd, now(), '{"provider": "email", "providers": ["email"]}', '{}', now(), now(), 'authenticated', '', '', '', '');
    
    INSERT INTO public.profiles (id, full_name, role) VALUES (doctor_uid, 'Dr. Sarah Jenkins', 'doctor');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'pharmacist@mediclinic.local') THEN
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, confirmation_token, email_change, email_change_token_new, recovery_token)
    VALUES (pharmacist_uid, '00000000-0000-0000-0000-000000000000', 'pharmacist@mediclinic.local', hashed_pwd, now(), '{"provider": "email", "providers": ["email"]}', '{}', now(), now(), 'authenticated', '', '', '', '');
    
    INSERT INTO public.profiles (id, full_name, role) VALUES (pharmacist_uid, 'David Chen', 'pharmacist');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'assistant@mediclinic.local') THEN
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, confirmation_token, email_change, email_change_token_new, recovery_token)
    VALUES (assistant_uid, '00000000-0000-0000-0000-000000000000', 'assistant@mediclinic.local', hashed_pwd, now(), '{"provider": "email", "providers": ["email"]}', '{}', now(), now(), 'authenticated', '', '', '', '');
    
    INSERT INTO public.profiles (id, full_name, role) VALUES (assistant_uid, 'Nurul Amin', 'clinic-assistant');
  END IF;
END $$;
