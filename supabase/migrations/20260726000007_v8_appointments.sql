-- Create appointments table
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  patient_name TEXT NOT NULL,
  patient_phone TEXT NOT NULL,
  appointment_time TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  purpose TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Scheduled', 'Completed', 'Cancelled', 'No-Show')),
  doctor_id UUID REFERENCES staff(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- RLS policies
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read appointments" 
  ON appointments FOR SELECT 
  TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to insert appointments" 
  ON appointments FOR INSERT 
  TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update appointments" 
  ON appointments FOR UPDATE 
  TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to delete appointments" 
  ON appointments FOR DELETE 
  TO authenticated USING (true);
