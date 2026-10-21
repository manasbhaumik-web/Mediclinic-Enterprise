-- v21: Leave requests, configurable entitlement rules, daily attendance and an append-only HR history.
--
-- Access model
--   * Employees (anyone whose login is linked to a staff record) can READ their own leave and attendance.
--   * admin and hr can read everything.
--   * Every change to requests, leave days and attendance goes through the `leave` edge function (service
--     role), which applies the approval rules. There are no client write policies on those tables.
--   * Configuration (types, entitlement rules, public holidays, settings) is written by admin directly under
--     RLS (hr may manage public holidays); every change is logged to hr_events by a trigger.
--   * Decided leave requests are immutable except approved -> cancelled, and the history is append-only.
--     Both are enforced by triggers that apply to the service role too.

-- 1. Hire date drives service-based entitlement tiers.
ALTER TABLE staff ADD COLUMN IF NOT EXISTS hire_date DATE;

-- 2. Settings (a single row).
CREATE TABLE IF NOT EXISTS leave_settings (
  id BOOLEAN PRIMARY KEY DEFAULT true CHECK (id),
  work_days INTEGER[] NOT NULL DEFAULT '{1,2,3,4,5,6}',      -- ISO weekdays that count as working days (1 = Monday)
  work_start TIME NOT NULL DEFAULT '09:00',
  late_grace_minutes INTEGER NOT NULL DEFAULT 15 CHECK (late_grace_minutes >= 0),
  timezone TEXT NOT NULL DEFAULT 'Asia/Kuala_Lumpur',
  backdate_days INTEGER NOT NULL DEFAULT 30 CHECK (backdate_days >= 0),   -- how far back an employee may file
  updated_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
INSERT INTO leave_settings (id) VALUES (true) ON CONFLICT (id) DO NOTHING;

-- 3. Leave types.
CREATE TABLE IF NOT EXISTS leave_types (
  code TEXT PRIMARY KEY CHECK (code ~ '^[a-z][a-z0-9_]{1,30}$'),
  name TEXT NOT NULL,
  paid BOOLEAN NOT NULL DEFAULT true,                 -- unpaid types are deducted from pay by the payroll run
  balance_limited BOOLEAN NOT NULL DEFAULT true,      -- true: needs an entitlement rule and cannot exceed it
  active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- 4. Public holidays (not working days). Dates change every year, so none are seeded: an administrator or HR enters them.
CREATE TABLE IF NOT EXISTS public_holidays (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  holiday_date DATE NOT NULL UNIQUE,
  name TEXT NOT NULL,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Entitlement rules. `config` shapes (see supabase/functions/_shared/leaveCalc.ts):
--    {"type":"fixed","days":60}
--    {"type":"service_tiers","tiers":[{"minYears":0,"days":8},{"minYears":2,"days":12},{"minYears":5,"days":16}],"prorate":false}
--    {"type":"unlimited"}
--    eligibility: {"genders":["female"],"minServiceMonths":12}
CREATE TABLE IF NOT EXISTS leave_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  leave_type TEXT NOT NULL REFERENCES leave_types(code) ON DELETE RESTRICT,
  label TEXT NOT NULL,
  effective_from DATE NOT NULL,
  priority INTEGER NOT NULL DEFAULT 0,
  eligibility JSONB NOT NULL DEFAULT '{}'::jsonb,
  config JSONB NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  verified BOOLEAN NOT NULL DEFAULT false,
  verified_by UUID,
  verified_at TIMESTAMPTZ,
  note TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.leave_rule_verification() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND (NEW.config IS DISTINCT FROM OLD.config OR NEW.eligibility IS DISTINCT FROM OLD.eligibility
      OR NEW.effective_from IS DISTINCT FROM OLD.effective_from OR NEW.leave_type IS DISTINCT FROM OLD.leave_type) THEN
    NEW.verified := false;
  END IF;
  IF NEW.verified THEN
    IF TG_OP = 'INSERT' OR NOT OLD.verified THEN
      NEW.verified_by := auth.uid();
      NEW.verified_at := now();
    ELSE
      NEW.verified_by := OLD.verified_by;
      NEW.verified_at := OLD.verified_at;
    END IF;
  ELSE
    NEW.verified_by := NULL;
    NEW.verified_at := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS leave_rules_verification ON leave_rules;
CREATE TRIGGER leave_rules_verification BEFORE INSERT OR UPDATE ON leave_rules
  FOR EACH ROW EXECUTE FUNCTION public.leave_rule_verification();

-- 6. Requests and the days they cover.
CREATE TABLE IF NOT EXISTS leave_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id UUID REFERENCES staff(id) ON DELETE SET NULL,
  staff_name TEXT NOT NULL,                               -- kept even if the staff record is later removed
  staff_auth_id UUID,                                     -- the employee's login, so they can read their own rows
  leave_type TEXT NOT NULL REFERENCES leave_types(code) ON DELETE RESTRICT,
  unpaid BOOLEAN NOT NULL,                                -- copied from the type at filing time
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  half_day TEXT CHECK (half_day IN ('am', 'pm')),
  days NUMERIC(5, 1) NOT NULL CHECK (days > 0),
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  requested_by UUID,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  decided_by UUID, decided_at TIMESTAMPTZ, decision_note TEXT,
  cancelled_by UUID, cancelled_at TIMESTAMPTZ, cancel_reason TEXT,
  CHECK (end_date >= start_date)
);
CREATE INDEX IF NOT EXISTS leave_requests_staff_idx ON leave_requests (staff_id, start_date);
CREATE INDEX IF NOT EXISTS leave_requests_status_idx ON leave_requests (status);

CREATE TABLE IF NOT EXISTS leave_days (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES leave_requests(id) ON DELETE RESTRICT,
  staff_id UUID REFERENCES staff(id) ON DELETE SET NULL,
  leave_date DATE NOT NULL,
  fraction NUMERIC(2, 1) NOT NULL CHECK (fraction IN (0.5, 1)),
  UNIQUE (request_id, leave_date)
);
CREATE INDEX IF NOT EXISTS leave_days_staff_idx ON leave_days (staff_id, leave_date);

-- 7. Daily attendance.
CREATE TABLE IF NOT EXISTS attendance_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  staff_auth_id UUID,
  work_date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('present', 'late', 'half_day', 'absent')),
  clock_in TIMESTAMPTZ,
  clock_out TIMESTAMPTZ,
  source TEXT NOT NULL CHECK (source IN ('clock', 'manual')),
  note TEXT,
  recorded_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (staff_id, work_date)
);
CREATE INDEX IF NOT EXISTS attendance_date_idx ON attendance_records (work_date);

-- 8. Append-only history.
CREATE TABLE IF NOT EXISTS hr_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entity TEXT NOT NULL,           -- leave_request, attendance, leave_rules, leave_types, public_holidays, leave_settings
  entity_id TEXT,
  staff_id UUID,
  action TEXT NOT NULL,
  actor UUID,
  detail JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS hr_events_entity_idx ON hr_events (entity, entity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS hr_events_staff_idx ON hr_events (staff_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.guard_hr_event() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'The HR audit trail is append-only.' USING ERRCODE = '42501';
END;
$$ LANGUAGE plpgsql SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS hr_events_guard ON hr_events;
CREATE TRIGGER hr_events_guard BEFORE UPDATE OR DELETE ON hr_events
  FOR EACH ROW EXECUTE FUNCTION public.guard_hr_event();

-- Configuration changes made directly by an administrator are logged here. It runs as the table owner so the
-- caller needs no write access to hr_events; nobody can call it directly.
CREATE OR REPLACE FUNCTION public.log_hr_config_change() RETURNS trigger AS $$
BEGIN
  INSERT INTO hr_events (entity, entity_id, action, actor, detail)
  VALUES (
    TG_TABLE_NAME,
    COALESCE((to_jsonb(NEW)->>'id'), (to_jsonb(NEW)->>'code'), (to_jsonb(OLD)->>'id'), (to_jsonb(OLD)->>'code')),
    lower(TG_OP),
    auth.uid(),
    jsonb_build_object('before', CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE to_jsonb(OLD) END,
                       'after',  CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE to_jsonb(NEW) END)
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;
REVOKE ALL ON FUNCTION public.log_hr_config_change() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS leave_rules_log ON leave_rules;
CREATE TRIGGER leave_rules_log AFTER INSERT OR UPDATE OR DELETE ON leave_rules FOR EACH ROW EXECUTE FUNCTION public.log_hr_config_change();
DROP TRIGGER IF EXISTS leave_types_log ON leave_types;
CREATE TRIGGER leave_types_log AFTER INSERT OR UPDATE OR DELETE ON leave_types FOR EACH ROW EXECUTE FUNCTION public.log_hr_config_change();
DROP TRIGGER IF EXISTS public_holidays_log ON public_holidays;
CREATE TRIGGER public_holidays_log AFTER INSERT OR UPDATE OR DELETE ON public_holidays FOR EACH ROW EXECUTE FUNCTION public.log_hr_config_change();
DROP TRIGGER IF EXISTS leave_settings_log ON leave_settings;
CREATE TRIGGER leave_settings_log AFTER UPDATE ON leave_settings FOR EACH ROW EXECUTE FUNCTION public.log_hr_config_change();

-- 9. Permanence rules.
CREATE OR REPLACE FUNCTION public.guard_leave_request() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'Leave requests are permanent records and cannot be deleted. Cancel the request instead.' USING ERRCODE = '42501';
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF EXISTS (
      SELECT 1 FROM leave_requests r
      WHERE r.staff_id IS NOT DISTINCT FROM NEW.staff_id AND NEW.staff_id IS NOT NULL
        AND r.status IN ('pending', 'approved')
        AND r.start_date <= NEW.end_date AND r.end_date >= NEW.start_date
    ) THEN
      RAISE EXCEPTION 'This person already has a leave request covering some of these dates.' USING ERRCODE = '23505';
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.staff_id IS DISTINCT FROM OLD.staff_id OR NEW.leave_type IS DISTINCT FROM OLD.leave_type OR NEW.unpaid IS DISTINCT FROM OLD.unpaid
     OR NEW.start_date IS DISTINCT FROM OLD.start_date OR NEW.end_date IS DISTINCT FROM OLD.end_date OR NEW.half_day IS DISTINCT FROM OLD.half_day
     OR NEW.days IS DISTINCT FROM OLD.days OR NEW.requested_by IS DISTINCT FROM OLD.requested_by OR NEW.requested_at IS DISTINCT FROM OLD.requested_at THEN
    RAISE EXCEPTION 'The dates, type and person of a leave request cannot be changed. Cancel it and file a new one.' USING ERRCODE = '42501';
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status AND NOT (
       (OLD.status = 'pending'  AND NEW.status IN ('approved', 'rejected', 'cancelled')) OR
       (OLD.status = 'approved' AND NEW.status = 'cancelled')
     ) THEN
    RAISE EXCEPTION 'A % leave request cannot become %.', OLD.status, NEW.status USING ERRCODE = '42501';
  END IF;

  IF OLD.status IN ('rejected', 'cancelled') AND NEW IS DISTINCT FROM OLD THEN
    RAISE EXCEPTION 'A % leave request cannot be changed.', OLD.status USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS leave_requests_guard ON leave_requests;
CREATE TRIGGER leave_requests_guard BEFORE INSERT OR UPDATE OR DELETE ON leave_requests
  FOR EACH ROW EXECUTE FUNCTION public.guard_leave_request();

CREATE OR REPLACE FUNCTION public.guard_leave_day() RETURNS trigger AS $$
DECLARE
  req_status TEXT;
BEGIN
  IF TG_OP <> 'INSERT' THEN
    RAISE EXCEPTION 'Leave days cannot be changed or removed. Cancel the request instead.' USING ERRCODE = '42501';
  END IF;
  SELECT status INTO req_status FROM leave_requests WHERE id = NEW.request_id;
  IF req_status IS DISTINCT FROM 'pending' THEN
    RAISE EXCEPTION 'Days can only be added to a pending request.' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS leave_days_guard ON leave_days;
CREATE TRIGGER leave_days_guard BEFORE INSERT OR UPDATE OR DELETE ON leave_days
  FOR EACH ROW EXECUTE FUNCTION public.guard_leave_day();

-- 10. Row level security.
ALTER TABLE leave_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public_holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_events ENABLE ROW LEVEL SECURITY;

-- Reference data: any signed-in user can read it (it drives what they see); only administrators change it.
CREATE POLICY "Signed-in read leave settings" ON leave_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin edits leave settings" ON leave_settings FOR UPDATE TO authenticated
  USING (public.get_user_role() = 'admin') WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "Signed-in read leave types" ON leave_types FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin manages leave types" ON leave_types FOR ALL TO authenticated
  USING (public.get_user_role() = 'admin') WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "Signed-in read public holidays" ON public_holidays FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin and HR manage public holidays" ON public_holidays FOR ALL TO authenticated
  USING (public.get_user_role() IN ('admin', 'hr')) WITH CHECK (public.get_user_role() IN ('admin', 'hr'));

CREATE POLICY "Signed-in read leave rules" ON leave_rules FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin adds leave rules" ON leave_rules FOR INSERT TO authenticated WITH CHECK (public.get_user_role() = 'admin');
CREATE POLICY "Admin edits leave rules" ON leave_rules FOR UPDATE TO authenticated
  USING (public.get_user_role() = 'admin') WITH CHECK (public.get_user_role() = 'admin');

-- Personal records: the person themselves, or admin and HR. No client writes.
CREATE POLICY "Read own or all leave requests" ON leave_requests FOR SELECT TO authenticated
  USING (staff_auth_id = auth.uid() OR public.get_user_role() IN ('admin', 'hr'));
CREATE POLICY "Admin and HR read leave days" ON leave_days FOR SELECT TO authenticated
  USING (public.get_user_role() IN ('admin', 'hr'));
CREATE POLICY "Read own or all attendance" ON attendance_records FOR SELECT TO authenticated
  USING (staff_auth_id = auth.uid() OR public.get_user_role() IN ('admin', 'hr'));
CREATE POLICY "Admin and HR read HR history" ON hr_events FOR SELECT TO authenticated
  USING (public.get_user_role() IN ('admin', 'hr'));

-- 11. Payroll takes unpaid leave days from approved requests; this records how many came from leave.
ALTER TABLE payslips ADD COLUMN IF NOT EXISTS leave_unpaid_days NUMERIC(5, 1) NOT NULL DEFAULT 0;

-- 12. Starting data. The entitlement rules are SEEDED DEFAULTS, marked unverified: an administrator must check
--     them against the Employment Act 1955 (as amended 2023) and the company's own policy and mark them verified.
INSERT INTO leave_types (code, name, paid, balance_limited, sort_order) VALUES
  ('annual',          'Annual leave',        true,  true,  1),
  ('sick',            'Sick leave',          true,  true,  2),
  ('hospitalisation', 'Hospitalisation',     true,  true,  3),
  ('maternity',       'Maternity leave',     true,  true,  4),
  ('paternity',       'Paternity leave',     true,  true,  5),
  ('unpaid',          'Unpaid leave',        false, false, 6)
ON CONFLICT (code) DO NOTHING;

INSERT INTO leave_rules (leave_type, label, effective_from, priority, eligibility, config, note)
SELECT * FROM (VALUES
  ('annual', 'Annual leave 8 / 12 / 16 days', DATE '2023-01-01', 0, '{}'::jsonb,
     '{"type":"service_tiers","tiers":[{"minYears":0,"days":8},{"minYears":2,"days":12},{"minYears":5,"days":16}],"prorate":false}'::jsonb,
     'Seeded default: Employment Act 1955 minimum (8 days under 2 years of service, 12 days for 2 to 5, 16 days above 5). Service is measured at 1 January of the leave year.'),
  ('sick', 'Sick leave 14 / 18 / 22 days', DATE '2023-01-01', 0, '{}'::jsonb,
     '{"type":"service_tiers","tiers":[{"minYears":0,"days":14},{"minYears":2,"days":18},{"minYears":5,"days":22}],"prorate":false}'::jsonb,
     'Seeded default: Employment Act 1955 minimum for sick leave without hospitalisation.'),
  ('hospitalisation', 'Hospitalisation 60 days', DATE '2023-01-01', 0, '{}'::jsonb,
     '{"type":"fixed","days":60}'::jsonb,
     'Seeded default: Employment Act 1955 minimum, counted separately from ordinary sick leave.'),
  ('maternity', 'Maternity leave 98 days', DATE '2023-01-01', 0, '{"genders":["female"]}'::jsonb,
     '{"type":"fixed","days":98}'::jsonb,
     'Seeded default: 98 consecutive days per confinement (Employment Act 1955 as amended 2023). Counted per leave year here; eligibility conditions are not checked.'),
  ('paternity', 'Paternity leave 7 days', DATE '2023-01-01', 0, '{"genders":["male"],"minServiceMonths":12}'::jsonb,
     '{"type":"fixed","days":7}'::jsonb,
     'Seeded default: 7 consecutive days for a married male employee with at least 12 months of service, up to 5 confinements. Marital status and the confinement count are not checked.')
) AS v(leave_type, label, effective_from, priority, eligibility, config, note)
WHERE NOT EXISTS (SELECT 1 FROM leave_rules);
