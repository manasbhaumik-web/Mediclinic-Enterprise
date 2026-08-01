-- V4 Schema Expansion: Auxiliary Catalogs (TPA & ICD-10)

-- 1. TPA Config Table
CREATE TABLE tpa_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  coverage_limit NUMERIC NOT NULL,
  co_pay_required BOOLEAN DEFAULT false,
  co_pay_percentage INTEGER DEFAULT 0
);

-- Seed TPA Config
INSERT INTO tpa_config (name, coverage_limit, co_pay_required, co_pay_percentage) VALUES
  ('Self-Pay', 999999, false, 0),
  ('MiCare TPA', 150, true, 10),
  ('Medkad Sdn Bhd', 200, false, 0),
  ('HealthMetrics Malaysia', 300, true, 15),
  ('PMCare Corporate', 250, false, 0),
  ('Petronas Panel', 500, false, 0);

-- 2. ICD-10 Catalog Table
CREATE TABLE icd10_catalog (
  code TEXT PRIMARY KEY,
  description TEXT NOT NULL,
  category TEXT
);

-- Seed ICD-10 Catalog
INSERT INTO icd10_catalog (code, description, category) VALUES
  ('J06.9', 'Acute upper respiratory infection, unspecified (Common Cold / URTI)', 'Infectious / Respiratory'),
  ('I10', 'Essential (primary) hypertension', 'Cardiovascular'),
  ('E11.9', 'Type 2 diabetes mellitus without complications', 'Endocrine / Metabolic'),
  ('K30', 'Dyspepsia / Gastritis', 'Gastrointestinal'),
  ('A09.9', 'Gastroenteritis and colitis of infectious origin (Diarrhea)', 'Infectious'),
  ('M79.1', 'Myalgia (General muscle pain)', 'Musculoskeletal'),
  ('L20.9', 'Atopic dermatitis, unspecified (Eczema / Skin Allergy)', 'Dermatological'),
  ('Z02.7', 'Issue of medical certificate (General Health Screening & MC)', 'Administrative');
