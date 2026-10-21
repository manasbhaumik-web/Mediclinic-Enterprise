-- v18: Staff directory fixes and system access (login) for staff.
--
-- Background: the live `staff` table came from the initial schema (full_name, role limited to the five
-- access roles) while the application treats `role` as a free-text job title and also stores HR/payroll
-- fields. This migration reconciles the two:
--   * `role`          stays the job title (the access-role check is dropped)
--   * `system_role`   is the application access role (RBAC) granted to the person's login, if any
--   * `auth_id`       links the staff record to their Supabase login (already present)
-- Access columns can only be changed by the staff-onboard edge function (service role), so HR cannot
-- grant themselves or anyone else a role by editing the table directly.

-- 1. Job title is free text.
ALTER TABLE staff DROP CONSTRAINT IF EXISTS staff_role_check;

-- 2. The app calls the column `name`.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'staff' AND column_name = 'full_name')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'staff' AND column_name = 'name') THEN
    ALTER TABLE staff RENAME COLUMN full_name TO name;
  END IF;
END $$;

-- 3. HR / payroll / tracking columns the application reads and writes.
ALTER TABLE staff
  ADD COLUMN IF NOT EXISTS gender TEXT,
  ADD COLUMN IF NOT EXISTS dob DATE,
  ADD COLUMN IF NOT EXISTS ic_number TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS salary_base NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'Pending',
  ADD COLUMN IF NOT EXISTS attendance_rate INTEGER NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS leave_balance INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS leaves_taken INTEGER NOT NULL DEFAULT 0;

-- 4. System access.
ALTER TABLE staff
  ADD COLUMN IF NOT EXISTS system_role TEXT,
  ADD COLUMN IF NOT EXISTS invited_at TIMESTAMPTZ;

ALTER TABLE staff DROP CONSTRAINT IF EXISTS staff_system_role_check;
ALTER TABLE staff ADD CONSTRAINT staff_system_role_check
  CHECK (system_role IS NULL OR system_role IN ('doctor', 'pharmacist', 'clinic-assistant', 'admin', 'hr'));

-- One login per staff record, and one record per login.
CREATE UNIQUE INDEX IF NOT EXISTS staff_auth_id_unique ON staff (auth_id) WHERE auth_id IS NOT NULL;

-- 5. Only the service role (the staff-onboard function) may touch the access columns.
CREATE OR REPLACE FUNCTION public.guard_staff_access_columns() RETURNS trigger AS $$
BEGIN
  -- Direct SQL (postgres) and the service role are trusted; API callers are signed-in or anonymous users.
  IF COALESCE(auth.role(), '') IN ('authenticated', 'anon') THEN
    IF TG_OP = 'INSERT' THEN
      IF NEW.auth_id IS NOT NULL OR NEW.system_role IS NOT NULL OR NEW.invited_at IS NOT NULL THEN
        RAISE EXCEPTION 'Access columns can only be set by granting access through the staff onboarding flow' USING ERRCODE = '42501';
      END IF;
    ELSIF NEW.auth_id IS DISTINCT FROM OLD.auth_id
       OR NEW.system_role IS DISTINCT FROM OLD.system_role
       OR NEW.invited_at IS DISTINCT FROM OLD.invited_at THEN
      RAISE EXCEPTION 'Access columns can only be changed through the staff onboarding flow' USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS staff_guard_access_columns ON staff;
CREATE TRIGGER staff_guard_access_columns BEFORE INSERT OR UPDATE ON staff
  FOR EACH ROW EXECUTE FUNCTION public.guard_staff_access_columns();
