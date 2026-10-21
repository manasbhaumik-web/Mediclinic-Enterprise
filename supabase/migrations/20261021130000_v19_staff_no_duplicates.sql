-- v19: No duplicate staff records.
--
-- The database is the final guarantee; the app checks earlier to give friendly messages.
--   * Email is unique ignoring capitals and surrounding spaces (the old staff_email_key was case-sensitive,
--     so "A@x.my" and "a@x.my" could both be saved).
--   * ID number (NRIC or passport) is unique ignoring dashes, spaces and capitals, when one is recorded.
-- Existing rows were checked before this migration was written: no duplicates, and no ID numbers recorded yet.

-- Store emails tidy, and treat an empty ID number as "none".
CREATE OR REPLACE FUNCTION public.normalize_staff_identity() RETURNS trigger AS $$
BEGIN
  NEW.email := lower(btrim(NEW.email));
  NEW.ic_number := NULLIF(btrim(COALESCE(NEW.ic_number, '')), '');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS staff_normalize_identity ON staff;
CREATE TRIGGER staff_normalize_identity BEFORE INSERT OR UPDATE ON staff
  FOR EACH ROW EXECUTE FUNCTION public.normalize_staff_identity();

-- Tidy any existing values so the unique indexes see consistent data.
UPDATE staff SET email = lower(btrim(email)), ic_number = NULLIF(btrim(COALESCE(ic_number, '')), '');

CREATE UNIQUE INDEX IF NOT EXISTS staff_email_unique_ci ON staff (lower(btrim(email)));

CREATE UNIQUE INDEX IF NOT EXISTS staff_id_number_unique
  ON staff (upper(regexp_replace(ic_number, '[^0-9A-Za-z]', '', 'g')))
  WHERE ic_number IS NOT NULL AND btrim(ic_number) <> '';
