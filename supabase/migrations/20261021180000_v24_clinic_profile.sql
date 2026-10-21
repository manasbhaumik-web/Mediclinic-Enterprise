-- v24: Clinic profile
--
-- The header's clinic details (name, branch, address, phone, licence) were typed into the page.
-- They now live in clinic_settings, so an administrator edits them under Settings and every screen shows the same values.
-- Existing RLS already lets all staff read clinic_settings and only administrators change it.

ALTER TABLE clinic_settings
  ADD COLUMN IF NOT EXISTS clinic_name TEXT,
  ADD COLUMN IF NOT EXISTS branch_name TEXT,
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS emergency_phone TEXT,
  ADD COLUMN IF NOT EXISTS license_no TEXT;

-- Keep what the header showed until an administrator changes it.
UPDATE clinic_settings SET
  clinic_name = COALESCE(clinic_name, 'MEDICLINIC ENTERPRISE'),
  branch_name = COALESCE(branch_name, 'Shah Alam Main Branch'),
  address = COALESCE(address, 'Level 2, Menara Medical Suite, Persiaran Central, 40000 Shah Alam, Selangor'),
  phone = COALESCE(phone, '+60 3-5510 8899'),
  emergency_phone = COALESCE(emergency_phone, '+60 3-5510 8899'),
  license_no = COALESCE(license_no, 'KKM-2026-SL-8902')
WHERE id = 1;
