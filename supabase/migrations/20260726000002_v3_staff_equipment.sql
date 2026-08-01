-- V3 Schema Expansion: Staff & Equipment

-- 1. Staff Table
CREATE TABLE staff (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  department TEXT,
  role TEXT,
  status TEXT DEFAULT 'Active',
  email TEXT,
  
  -- HR / Personal
  gender TEXT,
  dob DATE,
  ic_number TEXT,
  phone TEXT,
  
  -- Payroll & Tracking
  salary_base NUMERIC DEFAULT 0,
  payment_status TEXT DEFAULT 'Pending',
  attendance_rate INTEGER DEFAULT 100,
  leave_balance INTEGER DEFAULT 0,
  leaves_taken INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Equipment Table
CREATE TABLE equipment (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT,
  status TEXT DEFAULT 'Operational',
  serial_number TEXT,
  next_maintenance DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Equipment Logs Table
CREATE TABLE equipment_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  equipment_id UUID REFERENCES equipment(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  notes TEXT,
  date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_logs ENABLE ROW LEVEL SECURITY;

-- Apply Permissive Policies for now
CREATE POLICY "Allow authenticated full access" ON staff FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated full access" ON equipment FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated full access" ON equipment_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);
