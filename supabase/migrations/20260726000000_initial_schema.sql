-- Initial Schema for Mediclinic Enterprise

-- Patients Table
CREATE TABLE patients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  ic_number TEXT UNIQUE NOT NULL,
  gender TEXT,
  dob DATE,
  address TEXT,
  phone TEXT,
  panel_employer TEXT,
  drug_allergies TEXT[],
  registered_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Visits Table
CREATE TABLE visits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  status TEXT NOT NULL,
  total_bill NUMERIC DEFAULT 0,
  panel_claimed NUMERIC DEFAULT 0,
  paid_amount NUMERIC DEFAULT 0,
  payment_method TEXT,
  gl_number TEXT,
  mc_issued BOOLEAN DEFAULT false,
  registered_time BIGINT
);

-- SOAP Notes Table
CREATE TABLE soap_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  visit_id UUID REFERENCES visits(id) ON DELETE CASCADE UNIQUE NOT NULL,
  subjective TEXT,
  bp_systolic INTEGER,
  bp_diastolic INTEGER,
  heart_rate INTEGER,
  temperature NUMERIC,
  respiratory_rate INTEGER,
  icd_code TEXT,
  description TEXT,
  clinical_notes TEXT,
  follow_up_weeks INTEGER DEFAULT 0,
  mc_days INTEGER DEFAULT 0,
  requires_referral BOOLEAN DEFAULT false,
  pharmacy_memo TEXT
);

-- Prescriptions Table
CREATE TABLE prescriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  visit_id UUID REFERENCES visits(id) ON DELETE CASCADE NOT NULL,
  drug_name TEXT NOT NULL,
  dosage TEXT,
  dosage_bm TEXT,
  frequency TEXT,
  quantity INTEGER NOT NULL,
  price_per_unit NUMERIC NOT NULL,
  expiry_date DATE,
  pill_color TEXT,
  capsule_style TEXT
);

-- Inventory (Medicines) Table
CREATE TABLE inventory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  drug_name TEXT UNIQUE NOT NULL,
  stock_level INTEGER DEFAULT 0,
  price NUMERIC NOT NULL,
  expiry_date DATE,
  low_stock_threshold INTEGER DEFAULT 50,
  category TEXT
);

-- Profiles Table (Extends Supabase Auth)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  role TEXT CHECK (role IN ('doctor', 'pharmacist', 'clerk', 'admin', 'hr')) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE soap_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Permissive policies for Authenticated Users (for initial development)
CREATE POLICY "Allow authenticated full access" ON patients FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated full access" ON visits FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated full access" ON soap_notes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated full access" ON prescriptions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated full access" ON inventory FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated full access" ON profiles FOR ALL TO authenticated USING (true) WITH CHECK (true);
