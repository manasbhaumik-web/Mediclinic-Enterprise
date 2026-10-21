-- v20: Payroll: monthly runs with a permanent record, configurable statutory rate tables, pay items.
--
-- Access model
--   * admin and hr can READ everything here. Only the payroll edge function (service role) writes runs,
--     payslips and events, so every change goes through the maker-checker rules in that function.
--   * Rate tables: admin writes (hr reads). Changing a rate resets its "verified" flag; a run cannot be
--     approved while any rate it used is unverified.
--   * Approved, paid and cancelled runs are immutable, enforced by triggers that apply to everyone,
--     including the service role. Nothing in payroll can ever be deleted except draft payslips.

-- 1. Pay details on the staff record (visible to admin and hr through the existing staff policy).
ALTER TABLE staff
  ADD COLUMN IF NOT EXISTS epf_number TEXT,
  ADD COLUMN IF NOT EXISTS socso_number TEXT,
  ADD COLUMN IF NOT EXISTS tax_ref TEXT,
  ADD COLUMN IF NOT EXISTS citizenship TEXT NOT NULL DEFAULT 'citizen',
  ADD COLUMN IF NOT EXISTS bank_name TEXT,
  ADD COLUMN IF NOT EXISTS bank_account_holder TEXT,
  ADD COLUMN IF NOT EXISTS bank_account_number TEXT;

ALTER TABLE staff DROP CONSTRAINT IF EXISTS staff_citizenship_check;
ALTER TABLE staff ADD CONSTRAINT staff_citizenship_check CHECK (citizenship IN ('citizen', 'pr', 'foreign'));

-- 2. Recurring allowances and deductions per person (applied to every run until deactivated).
CREATE TABLE IF NOT EXISTS staff_pay_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('allowance', 'deduction')),
  label TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
  contributory BOOLEAN NOT NULL DEFAULT true,     -- allowances only: counts towards EPF/SOCSO/EIS wages
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS staff_pay_items_staff_idx ON staff_pay_items (staff_id);

-- 3. Statutory rate tables. `config` shapes (see supabase/functions/_shared/payrollCalc.ts):
--    {"type":"percent","rate":0.11,"ceiling":6000,"roundUpToRinggit":true,"includeOvertime":false}
--    {"type":"tiered","tiers":[{"upTo":5000,"rate":0.13},{"upTo":null,"rate":0.12}]}
--    {"type":"bands","bands":[{"from":0,"to":30,"amount":0.10}]}
--    eligibility: {"minAge":0,"maxAge":59,"citizenships":["citizen","pr"]}
CREATE TABLE IF NOT EXISTS payroll_rates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  scheme TEXT NOT NULL CHECK (scheme IN ('epf_employee', 'epf_employer', 'socso_employee', 'socso_employer', 'eis_employee', 'eis_employer', 'pcb')),
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

CREATE OR REPLACE FUNCTION public.payroll_rate_verification() RETURNS trigger AS $$
BEGIN
  -- Changing what a rate means always clears its verification: it must be checked again, as a separate step.
  IF TG_OP = 'UPDATE' AND (NEW.config IS DISTINCT FROM OLD.config OR NEW.eligibility IS DISTINCT FROM OLD.eligibility
      OR NEW.effective_from IS DISTINCT FROM OLD.effective_from OR NEW.scheme IS DISTINCT FROM OLD.scheme) THEN
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

DROP TRIGGER IF EXISTS payroll_rates_verification ON payroll_rates;
CREATE TRIGGER payroll_rates_verification BEFORE INSERT OR UPDATE ON payroll_rates
  FOR EACH ROW EXECUTE FUNCTION public.payroll_rate_verification();

-- 4. Runs, payslips, events.
CREATE TABLE IF NOT EXISTS payroll_runs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  period_month DATE NOT NULL CHECK (EXTRACT(DAY FROM period_month) = 1),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'reviewed', 'approved', 'paid', 'cancelled')),
  working_days INTEGER NOT NULL DEFAULT 26 CHECK (working_days BETWEEN 1 AND 31),
  hours_per_day NUMERIC(4, 2) NOT NULL DEFAULT 8 CHECK (hours_per_day > 0 AND hours_per_day <= 24),
  notes TEXT,
  rate_snapshot JSONB NOT NULL DEFAULT '[]'::jsonb,   -- the exact rate rows used, kept with the run
  totals JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID, created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_by UUID, reviewed_at TIMESTAMPTZ,
  approved_by UUID, approved_at TIMESTAMPTZ,
  paid_by UUID, paid_at TIMESTAMPTZ, paid_on DATE,
  cancelled_by UUID, cancelled_at TIMESTAMPTZ, cancel_reason TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS payroll_runs_one_per_month ON payroll_runs (period_month) WHERE status <> 'cancelled';

CREATE TABLE IF NOT EXISTS payslips (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  run_id UUID NOT NULL REFERENCES payroll_runs(id) ON DELETE RESTRICT,
  staff_id UUID REFERENCES staff(id) ON DELETE SET NULL,
  employee JSONB NOT NULL,                              -- identity and pay details as they were for this run
  inputs JSONB NOT NULL DEFAULT '{}'::jsonb,            -- allowances, deductions, overtime, unpaid leave, PCB override
  lines JSONB NOT NULL DEFAULT '[]'::jsonb,
  gross NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total_deductions NUMERIC(12, 2) NOT NULL DEFAULT 0,
  net_pay NUMERIC(12, 2) NOT NULL DEFAULT 0,
  employer_contributions NUMERIC(12, 2) NOT NULL DEFAULT 0,
  warnings JSONB NOT NULL DEFAULT '[]'::jsonb,
  UNIQUE (run_id, staff_id)
);
CREATE INDEX IF NOT EXISTS payslips_run_idx ON payslips (run_id);

CREATE TABLE IF NOT EXISTS payroll_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  run_id UUID REFERENCES payroll_runs(id) ON DELETE RESTRICT,
  action TEXT NOT NULL,
  actor UUID,
  detail TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS payroll_events_run_idx ON payroll_events (run_id, created_at DESC);

-- 5. Permanence: who may change what, in which status.
CREATE OR REPLACE FUNCTION public.guard_payroll_run() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'Payroll runs are permanent records and cannot be deleted. Cancel the run instead.' USING ERRCODE = '42501';
  END IF;

  IF OLD.status IN ('paid', 'cancelled') THEN
    RAISE EXCEPTION 'A % payroll run cannot be changed.', OLD.status USING ERRCODE = '42501';
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status AND NOT (
       (OLD.status = 'draft'    AND NEW.status IN ('reviewed', 'cancelled')) OR
       (OLD.status = 'reviewed' AND NEW.status IN ('draft', 'approved', 'cancelled')) OR
       (OLD.status = 'approved' AND NEW.status IN ('paid', 'cancelled'))
     ) THEN
    RAISE EXCEPTION 'Payroll run cannot move from % to %.', OLD.status, NEW.status USING ERRCODE = '42501';
  END IF;

  IF NEW.period_month IS DISTINCT FROM OLD.period_month THEN
    RAISE EXCEPTION 'The pay month of a run cannot be changed.' USING ERRCODE = '42501';
  END IF;

  -- Once approved the numbers are frozen; only the status progression and its stamps may change.
  IF OLD.status = 'approved' AND (
       NEW.rate_snapshot IS DISTINCT FROM OLD.rate_snapshot OR NEW.totals IS DISTINCT FROM OLD.totals OR
       NEW.working_days IS DISTINCT FROM OLD.working_days OR NEW.hours_per_day IS DISTINCT FROM OLD.hours_per_day) THEN
    RAISE EXCEPTION 'An approved payroll run is frozen.' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS payroll_runs_guard ON payroll_runs;
CREATE TRIGGER payroll_runs_guard BEFORE UPDATE OR DELETE ON payroll_runs
  FOR EACH ROW EXECUTE FUNCTION public.guard_payroll_run();

CREATE OR REPLACE FUNCTION public.guard_payslip() RETURNS trigger AS $$
DECLARE
  run_status TEXT;
  target_run UUID := CASE WHEN TG_OP = 'INSERT' THEN NEW.run_id ELSE OLD.run_id END;
BEGIN
  SELECT status INTO run_status FROM payroll_runs WHERE id = target_run;
  IF run_status IS DISTINCT FROM 'draft' THEN
    RAISE EXCEPTION 'Payslips can only be changed while the payroll run is a draft (it is %).', COALESCE(run_status, 'missing') USING ERRCODE = '42501';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS payslips_guard ON payslips;
CREATE TRIGGER payslips_guard BEFORE INSERT OR UPDATE OR DELETE ON payslips
  FOR EACH ROW EXECUTE FUNCTION public.guard_payslip();

CREATE OR REPLACE FUNCTION public.guard_payroll_event() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'The payroll audit trail is append-only.' USING ERRCODE = '42501';
END;
$$ LANGUAGE plpgsql SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS payroll_events_guard ON payroll_events;
CREATE TRIGGER payroll_events_guard BEFORE UPDATE OR DELETE ON payroll_events
  FOR EACH ROW EXECUTE FUNCTION public.guard_payroll_event();

-- 6. Row level security.
ALTER TABLE staff_pay_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payslips ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin and HR manage pay items" ON staff_pay_items
  FOR ALL TO authenticated
  USING (public.get_user_role() IN ('admin', 'hr')) WITH CHECK (public.get_user_role() IN ('admin', 'hr'));

CREATE POLICY "Admin and HR read rates" ON payroll_rates
  FOR SELECT TO authenticated USING (public.get_user_role() IN ('admin', 'hr'));
CREATE POLICY "Admin adds rates" ON payroll_rates
  FOR INSERT TO authenticated WITH CHECK (public.get_user_role() = 'admin');
CREATE POLICY "Admin edits rates" ON payroll_rates
  FOR UPDATE TO authenticated USING (public.get_user_role() = 'admin') WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "Admin and HR read payroll runs" ON payroll_runs
  FOR SELECT TO authenticated USING (public.get_user_role() IN ('admin', 'hr'));
CREATE POLICY "Admin and HR read payslips" ON payslips
  FOR SELECT TO authenticated USING (public.get_user_role() IN ('admin', 'hr'));
CREATE POLICY "Admin and HR read payroll events" ON payroll_events
  FOR SELECT TO authenticated USING (public.get_user_role() IN ('admin', 'hr'));

-- 7. Starting rates for Malaysian citizens and permanent residents under 60. They are SEEDED DEFAULTS, marked
--    unverified: an administrator must check them against the current KWSP, PERKESO and LHDN schedules and
--    verify them before any payroll run can be approved. Foreign workers and the 60+ rules are left out on
--    purpose (no rows means a warning, not a guess). PCB has no default: enter it per payslip or add a table.
INSERT INTO payroll_rates (scheme, label, effective_from, priority, eligibility, config, note)
SELECT * FROM (VALUES
  ('epf_employee',   'EPF employee 11%',              DATE '2025-01-01', 0, '{"maxAge":59,"citizenships":["citizen","pr"]}'::jsonb,
     '{"type":"percent","rate":0.11,"roundUpToRinggit":true,"includeOvertime":false}'::jsonb, 'Seeded default. KWSP uses a wage-band schedule; a straight percentage can differ by a few sen.'),
  ('epf_employer',   'EPF employer 13% / 12%',        DATE '2025-01-01', 0, '{"maxAge":59,"citizenships":["citizen","pr"]}'::jsonb,
     '{"type":"tiered","tiers":[{"upTo":5000,"rate":0.13},{"upTo":null,"rate":0.12}],"roundUpToRinggit":true,"includeOvertime":false}'::jsonb, 'Seeded default: 13% up to RM5,000 wages, 12% above.'),
  ('socso_employee', 'SOCSO employee 0.5%',           DATE '2025-01-01', 0, '{"maxAge":59,"citizenships":["citizen","pr"]}'::jsonb,
     '{"type":"percent","rate":0.005,"ceiling":6000,"includeOvertime":true}'::jsonb, 'Seeded default. PERKESO publishes a banded schedule; replace with a bands row for exact amounts.'),
  ('socso_employer', 'SOCSO employer 1.75%',          DATE '2025-01-01', 0, '{"maxAge":59,"citizenships":["citizen","pr"]}'::jsonb,
     '{"type":"percent","rate":0.0175,"ceiling":6000,"includeOvertime":true}'::jsonb, 'Seeded default. PERKESO publishes a banded schedule; replace with a bands row for exact amounts.'),
  ('eis_employee',   'EIS employee 0.2%',             DATE '2025-01-01', 0, '{"maxAge":59,"citizenships":["citizen","pr"]}'::jsonb,
     '{"type":"percent","rate":0.002,"ceiling":6000,"includeOvertime":true}'::jsonb, 'Seeded default. PERKESO publishes a banded schedule.'),
  ('eis_employer',   'EIS employer 0.2%',             DATE '2025-01-01', 0, '{"maxAge":59,"citizenships":["citizen","pr"]}'::jsonb,
     '{"type":"percent","rate":0.002,"ceiling":6000,"includeOvertime":true}'::jsonb, 'Seeded default. PERKESO publishes a banded schedule.')
) AS v(scheme, label, effective_from, priority, eligibility, config, note)
WHERE NOT EXISTS (SELECT 1 FROM payroll_rates);
