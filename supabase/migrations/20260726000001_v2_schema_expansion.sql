-- V2 Schema Expansion: Financials, Settings, and Advanced Inventory

-- 1. Financial Transactions
CREATE TABLE transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
  visit_id UUID REFERENCES visits(id) ON DELETE SET NULL,
  date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  payment_method TEXT,
  paid_amount NUMERIC DEFAULT 0,
  panel_claimed NUMERIC DEFAULT 0,
  gl_number TEXT,
  status TEXT NOT NULL
);

-- 2. Clinic Settings (Single-Row Config Table)
CREATE TABLE clinic_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  tax_rate NUMERIC DEFAULT 6.00,
  consultation_fee NUMERIC DEFAULT 35.00,
  procedure_fee NUMERIC DEFAULT 15.00,
  active_modules JSONB DEFAULT '{"staff": true, "medicine": true, "equipment": true, "billing": true, "reports": true}'::jsonb,
  hardware_config JSONB DEFAULT '{"mykadScanner": true, "receiptPrinter": true, "barcodeScanner": false}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Insert default settings row
INSERT INTO clinic_settings (id) VALUES (1) ON CONFLICT DO NOTHING;

-- 3. Expand Inventory Table
ALTER TABLE inventory 
  ADD COLUMN min_threshold INTEGER DEFAULT 100,
  ADD COLUMN drug_type TEXT,
  ADD COLUMN manufacturer TEXT,
  ADD COLUMN generic_name TEXT,
  ADD COLUMN is_controlled_drug BOOLEAN DEFAULT false,
  ADD COLUMN indications TEXT,
  ADD COLUMN side_effects TEXT,
  ADD COLUMN suggested_dosage JSONB;

-- 4. Drug Batches for FIFO Tracking
CREATE TABLE drug_batches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  inventory_id UUID REFERENCES inventory(id) ON DELETE CASCADE,
  batch_number TEXT NOT NULL,
  stock_level INTEGER NOT NULL,
  expiry_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 5. Inventory Logs (Audit Trail)
CREATE TABLE inventory_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  inventory_id UUID REFERENCES inventory(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  amount INTEGER NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinic_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE drug_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_logs ENABLE ROW LEVEL SECURITY;

-- Apply Permissive Policies (assuming role-based controls in a future iteration)
CREATE POLICY "Allow authenticated full access" ON transactions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated full access" ON clinic_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated full access" ON drug_batches FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated full access" ON inventory_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);
