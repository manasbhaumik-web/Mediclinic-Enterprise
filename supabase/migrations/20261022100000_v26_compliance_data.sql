-- v26: Data the MOH compliance page needs
--
-- 1. The consultation's diagnosis picker reads icd10_catalog, which held only 8 codes while the diseases table
--    (v9) held 50. Copy the rest across so doctors can code what they diagnose. Codes already in the catalog
--    are left exactly as they are.
-- 2. Record when the clinic's licence expires so the compliance page can warn before it does.
--    Existing RLS already lets all staff read clinic_settings and only administrators change it.

INSERT INTO icd10_catalog (code, description, category)
SELECT code, description, category FROM diseases
ON CONFLICT (code) DO NOTHING;

ALTER TABLE clinic_settings
  ADD COLUMN IF NOT EXISTS license_expiry DATE;
