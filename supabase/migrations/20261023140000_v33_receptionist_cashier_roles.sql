-- v33: Receptionist and Cashier roles, and several roles per person
--
-- The front desk used to be one role (clinic-assistant) that registered patients, took triage readings, ran
-- appointments and handled billing. The work is now split along the visit flow:
--
--   receptionist      registers patients (with details) and runs appointments; the visit starts at Awaiting Triage
--   clinic-assistant  takes the clinical readings (triage); finishing triage moves the visit to the doctor's queue
--   cashier           takes payment for visits that finished at the pharmacy
--
-- A small clinic can give one person more than one of these (or any other combination); they then have the union
-- of the roles' rights. `profiles.role` stays as the person's primary role; `profiles.roles` lists every role held.
--
-- Nobody loses access: existing clinic-assistant accounts are given {clinic-assistant, receptionist, cashier},
-- which is exactly what that role could do before. An administrator can narrow them afterwards.
--
-- What changes:
--   1. profiles.roles and staff.system_roles; the two role CHECK constraints list the seven roles;
--   2. get_user_roles() and has_any_role(); require_role() and inv_require() use them, so every RPC that already
--      names a role now honours all of a person's roles;
--   3. every row-level-security policy that compared get_user_role() is rewritten to has_any_role();
--   4. the front-desk rules: patients and visits are inserted by receptionists (not assistants); receptionists may
--      write the intake note of a visit that is still Awaiting Triage; billing and e-invoice belong to the cashier;
--   5. guard_visit_update() works from the union of a person's roles: receptionist may only cancel a visit that
--      is still Awaiting Triage, cashier makes no status moves (payment goes through billing_settle_visit);
--   6. the staff access-columns guard also protects staff.system_roles.

-- ---------------------------------------------------------------------------------------------------------------
-- 1. Columns, constraints, normalising trigger, backfill
-- ---------------------------------------------------------------------------------------------------------------
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS roles TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE staff ADD COLUMN IF NOT EXISTS system_roles TEXT[];

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role = ANY (ARRAY['doctor', 'pharmacist', 'receptionist', 'clinic-assistant', 'cashier', 'admin', 'hr']));
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_roles_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_roles_check
  CHECK (roles <@ ARRAY['doctor', 'pharmacist', 'receptionist', 'clinic-assistant', 'cashier', 'admin', 'hr']::text[]);

ALTER TABLE staff DROP CONSTRAINT IF EXISTS staff_system_role_check;
ALTER TABLE staff ADD CONSTRAINT staff_system_role_check
  CHECK (system_role IS NULL OR system_role = ANY (ARRAY['doctor', 'pharmacist', 'receptionist', 'clinic-assistant', 'cashier', 'admin', 'hr']));
ALTER TABLE staff DROP CONSTRAINT IF EXISTS staff_system_roles_check;
ALTER TABLE staff ADD CONSTRAINT staff_system_roles_check
  CHECK (system_roles IS NULL OR system_roles <@ ARRAY['doctor', 'pharmacist', 'receptionist', 'clinic-assistant', 'cashier', 'admin', 'hr']::text[]);

-- The primary role is always one of the roles held, and an empty list means "just the primary role".
CREATE OR REPLACE FUNCTION public.normalize_profile_roles()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  IF NEW.roles IS NULL OR cardinality(NEW.roles) = 0 THEN
    NEW.roles := ARRAY[NEW.role];
  ELSIF NOT (NEW.role = ANY (NEW.roles)) THEN
    NEW.roles := ARRAY[NEW.role] || NEW.roles;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_normalize_roles ON profiles;
CREATE TRIGGER profiles_normalize_roles
  BEFORE INSERT OR UPDATE OF role, roles ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.normalize_profile_roles();

-- Keep today's access: a clinic-assistant did all of this before the split.
UPDATE profiles SET roles = ARRAY['clinic-assistant', 'receptionist', 'cashier'] WHERE role = 'clinic-assistant' AND cardinality(roles) = 0;
UPDATE profiles SET roles = ARRAY[role] WHERE cardinality(roles) = 0;

-- The staff access-columns guard now also covers system_roles (it must be replaced before staff is backfilled).
CREATE OR REPLACE FUNCTION public.guard_staff_access_columns()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  IF COALESCE(auth.role(), '') IN ('authenticated', 'anon') THEN
    IF TG_OP = 'INSERT' THEN
      IF NEW.auth_id IS NOT NULL OR NEW.system_role IS NOT NULL OR NEW.system_roles IS NOT NULL OR NEW.invited_at IS NOT NULL THEN
        RAISE EXCEPTION 'Access columns can only be set by granting access through the staff onboarding flow' USING ERRCODE = '42501';
      END IF;
    ELSIF NEW.auth_id IS DISTINCT FROM OLD.auth_id
       OR NEW.system_role IS DISTINCT FROM OLD.system_role
       OR NEW.system_roles IS DISTINCT FROM OLD.system_roles
       OR NEW.invited_at IS DISTINCT FROM OLD.invited_at THEN
      RAISE EXCEPTION 'Access columns can only be changed through the staff onboarding flow' USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

UPDATE staff SET system_roles = ARRAY['clinic-assistant', 'receptionist', 'cashier'] WHERE system_role = 'clinic-assistant' AND system_roles IS NULL;
UPDATE staff SET system_roles = ARRAY[system_role] WHERE system_role IS NOT NULL AND system_roles IS NULL;

-- ---------------------------------------------------------------------------------------------------------------
-- 2. Role helpers; the two generic gates use them
-- ---------------------------------------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_user_roles()
RETURNS TEXT[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
  SELECT CASE WHEN cardinality(roles) > 0 THEN roles ELSE ARRAY[role] END FROM profiles WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.has_any_role(allowed TEXT[])
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
  SELECT coalesce(public.get_user_roles() && allowed, false)
$$;

REVOKE ALL ON FUNCTION public.get_user_roles() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.has_any_role(TEXT[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_roles() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_any_role(TEXT[]) TO authenticated, service_role;

-- Replace a piece of an existing function's text. Refuses if the text is not found, so a changed function is
-- noticed instead of silently left on the old rule.
CREATE OR REPLACE FUNCTION public._patch_function(p_sig REGPROCEDURE, p_old TEXT, p_new TEXT)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE d TEXT := pg_get_functiondef(p_sig);
BEGIN
  IF position(p_old IN d) = 0 THEN
    RAISE EXCEPTION 'Cannot patch %: expected text not found: %', p_sig, p_old;
  END IF;
  EXECUTE replace(d, p_old, p_new);
END;
$$;

SELECT public._patch_function('public.require_role(text[])'::regprocedure,
  'IF public.get_user_role() IS NULL OR NOT (public.get_user_role() = ANY (allowed)) THEN',
  'IF NOT public.has_any_role(allowed) THEN');

SELECT public._patch_function('public.inv_require(text[])'::regprocedure,
  'NOT (v_role = ANY (p_roles))',
  'NOT public.has_any_role(p_roles)');

SELECT public._patch_function('public.inv_save_drug(uuid,jsonb)'::regprocedure,
  'v_role <> ''admin''',
  'NOT public.has_any_role(ARRAY[''admin''])');

-- Billing and e-invoice belong to the cashier (and the administrator).
SELECT public._patch_function('public.billing_mark_claim_paid(uuid,text,date)'::regprocedure,
  'get_user_role() IS NULL OR get_user_role() NOT IN (''admin'', ''clinic-assistant'')',
  'NOT public.has_any_role(ARRAY[''admin'', ''cashier''])');

SELECT public._patch_function('public.billing_settle_visit(uuid,text,numeric,numeric,numeric,text,text,jsonb,text)'::regprocedure,
  'get_user_role() IS NULL OR get_user_role() NOT IN (''admin'', ''clinic-assistant'')',
  'NOT public.has_any_role(ARRAY[''admin'', ''cashier''])');

SELECT public._patch_function('public.record_einvoice(uuid,jsonb,jsonb)'::regprocedure,
  'public.get_user_role() NOT IN (''clinic-assistant'', ''admin'')',
  'NOT public.has_any_role(ARRAY[''cashier'', ''admin''])');

DROP FUNCTION public._patch_function(REGPROCEDURE, TEXT, TEXT);

-- ---------------------------------------------------------------------------------------------------------------
-- 3. Every policy that compared get_user_role() now asks has_any_role()
-- ---------------------------------------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public._roles_expr(e TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE r TEXT := e;
BEGIN
  IF r IS NULL THEN RETURN NULL; END IF;
  r := regexp_replace(r, '(public\.)?get_user_role\(\) = ANY \(ARRAY\[([^\]]*)\]\)', 'public.has_any_role(ARRAY[\2])', 'g');
  r := regexp_replace(r, '(public\.)?get_user_role\(\) = ''([a-z-]+)''::text', 'public.has_any_role(ARRAY[''\2''::text])', 'g');
  IF r ~ 'get_user_role' THEN
    RAISE EXCEPTION 'Policy expression not understood: %', r;
  END IF;
  RETURN r;
END;
$$;

DO $$
DECLARE
  r RECORD;
  stmt TEXT;
  u TEXT;
  c TEXT;
BEGIN
  FOR r IN
    SELECT pol.polname, pol.polrelid::regclass AS tbl,
           pg_get_expr(pol.polqual, pol.polrelid) AS q, pg_get_expr(pol.polwithcheck, pol.polrelid) AS w
    FROM pg_policy pol
    WHERE pg_get_expr(pol.polqual, pol.polrelid) ~ 'get_user_role' OR pg_get_expr(pol.polwithcheck, pol.polrelid) ~ 'get_user_role'
  LOOP
    u := public._roles_expr(r.q);
    c := public._roles_expr(r.w);
    stmt := format('ALTER POLICY %I ON %s', r.polname, r.tbl);
    IF u IS NOT NULL THEN stmt := stmt || ' USING (' || u || ')'; END IF;
    IF c IS NOT NULL THEN stmt := stmt || ' WITH CHECK (' || c || ')'; END IF;
    EXECUTE stmt;
  END LOOP;
END;
$$;

DROP FUNCTION public._roles_expr(TEXT);

-- ---------------------------------------------------------------------------------------------------------------
-- 4. Front-desk rules
-- ---------------------------------------------------------------------------------------------------------------
ALTER POLICY "Doctors and Assistants can insert patients" ON patients RENAME TO "Doctors and receptionists can insert patients";
ALTER POLICY "Doctors and receptionists can insert patients" ON patients
  WITH CHECK (public.has_any_role(ARRAY['doctor', 'receptionist', 'admin']));

ALTER POLICY "Assistants and Doctors can insert visits" ON visits RENAME TO "Receptionists and doctors can insert visits";
ALTER POLICY "Receptionists and doctors can insert visits" ON visits
  WITH CHECK (public.has_any_role(ARRAY['doctor', 'receptionist', 'admin']));

-- Receptionists may only update a visit to cancel it while it is Awaiting Triage (the guard enforces that).
ALTER POLICY "Clinical staff can update visits" ON visits
  USING (public.has_any_role(ARRAY['doctor', 'receptionist', 'clinic-assistant', 'pharmacist', 'admin']))
  WITH CHECK (public.has_any_role(ARRAY['doctor', 'receptionist', 'clinic-assistant', 'pharmacist', 'admin']));

-- The cashier reads visit notes for the bill, as the assistant did when billing was part of that role.
ALTER POLICY "Assistants can read SOAP notes" ON soap_notes
  USING (public.has_any_role(ARRAY['clinic-assistant', 'pharmacist', 'cashier']));

-- Registration writes the intake note (chief complaint) when it creates the visit.
CREATE POLICY "Receptionists can insert intake SOAP notes" ON soap_notes
  FOR INSERT
  WITH CHECK (
    public.has_any_role(ARRAY['receptionist'])
    AND EXISTS (SELECT 1 FROM visits v WHERE v.id = soap_notes.visit_id AND v.status = 'Awaiting Triage')
  );
CREATE POLICY "Receptionists can read intake SOAP notes" ON soap_notes
  FOR SELECT
  USING (
    public.has_any_role(ARRAY['receptionist'])
    AND EXISTS (SELECT 1 FROM visits v WHERE v.id = soap_notes.visit_id AND v.status = 'Awaiting Triage')
  );

ALTER POLICY "Cashier and Admin can manage transactions" ON transactions
  USING (public.has_any_role(ARRAY['admin', 'cashier']))
  WITH CHECK (public.has_any_role(ARRAY['admin', 'cashier']));

-- ---------------------------------------------------------------------------------------------------------------
-- 5. The visit transition guard, from the union of a person's roles (v32 body, extended)
-- ---------------------------------------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.guard_visit_update()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_roles TEXT[];
  v_move TEXT;
  v_early TEXT[] := ARRAY['Awaiting Triage', 'Triaging', 'Awaiting Consult', 'Consulting'];
  v_allowed TEXT[] := ARRAY[]::TEXT[];
  v_clinical BOOLEAN;
BEGIN
  -- No signed-in user: a migration, the SQL editor or a server-side job.
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.ticket_no IS DISTINCT FROM OLD.ticket_no OR NEW.ticket_day IS DISTINCT FROM OLD.ticket_day THEN
    RAISE EXCEPTION 'A visit''s ticket number cannot be changed.' USING ERRCODE = '42501';
  END IF;

  IF NEW.id IS DISTINCT FROM OLD.id OR NEW.patient_id IS DISTINCT FROM OLD.patient_id OR NEW.visit_date IS DISTINCT FROM OLD.visit_date THEN
    RAISE EXCEPTION 'A visit''s patient and date cannot be changed.' USING ERRCODE = '42501';
  END IF;

  -- billing_settle_visit marks its own update; it may only settle a visit that is waiting for billing.
  IF coalesce(current_setting('mediclinic.in_billing', true), 'off') = 'on' THEN
    IF OLD.status = 'Awaiting Billing' AND NEW.status = 'Paid' THEN
      RETURN NEW;
    END IF;
    RAISE EXCEPTION 'Only a visit that is awaiting billing can be settled.' USING ERRCODE = '42501';
  END IF;

  IF OLD.status IN ('Paid', 'Cancelled') THEN
    RAISE EXCEPTION 'A % visit cannot be changed.', lower(OLD.status) USING ERRCODE = '42501';
  END IF;

  IF NEW.total_bill IS DISTINCT FROM OLD.total_bill
     OR NEW.paid_amount IS DISTINCT FROM OLD.paid_amount
     OR NEW.panel_claimed IS DISTINCT FROM OLD.panel_claimed
     OR NEW.payment_method IS DISTINCT FROM OLD.payment_method
     OR NEW.gl_number IS DISTINCT FROM OLD.gl_number THEN
    RAISE EXCEPTION 'Payment details can only be recorded at the cashier desk.' USING ERRCODE = '42501';
  END IF;

  v_roles := coalesce(public.get_user_roles(), ARRAY[]::TEXT[]);
  v_clinical := v_roles && ARRAY['doctor', 'receptionist', 'clinic-assistant', 'pharmacist'];

  -- An administrator with no clinical role may only cancel a visit that has not been consulted yet.
  IF 'admin' = ANY (v_roles) AND NOT v_clinical THEN
    IF NEW.status = 'Cancelled' AND OLD.status = ANY (v_early) THEN
      RETURN NEW;
    END IF;
    RAISE EXCEPTION 'Administrators can only cancel a visit that has not been consulted yet.' USING ERRCODE = '42501';
  END IF;

  IF NOT v_clinical THEN
    RAISE EXCEPTION 'Your role cannot change visits.' USING ERRCODE = '42501';
  END IF;

  IF NEW.mc_issued IS DISTINCT FROM OLD.mc_issued AND NOT ('doctor' = ANY (v_roles)) THEN
    RAISE EXCEPTION 'Only a doctor can issue a medical certificate.' USING ERRCODE = '42501';
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    v_move := OLD.status || '>' || NEW.status;

    IF NEW.status = 'Cancelled' THEN
      -- Doctors, assistants and administrators cancel any early visit; a receptionist only one still waiting for triage.
      IF NOT (
        (OLD.status = ANY (v_early) AND v_roles && ARRAY['doctor', 'clinic-assistant', 'admin'])
        OR (OLD.status = 'Awaiting Triage' AND 'receptionist' = ANY (v_roles))
      ) THEN
        RAISE EXCEPTION 'This visit can no longer be cancelled.' USING ERRCODE = '42501';
      END IF;
      RETURN NEW;
    END IF;

    IF 'clinic-assistant' = ANY (v_roles) THEN
      v_allowed := v_allowed || ARRAY['Awaiting Triage>Triaging', 'Awaiting Triage>Awaiting Consult', 'Triaging>Awaiting Consult'];
    END IF;
    IF 'doctor' = ANY (v_roles) THEN
      v_allowed := v_allowed || ARRAY['Awaiting Consult>Consulting', 'Consulting>Awaiting Consult', 'Awaiting Consult>Awaiting Dispensation', 'Consulting>Awaiting Dispensation'];
    END IF;
    IF 'pharmacist' = ANY (v_roles) THEN
      v_allowed := v_allowed || ARRAY['Awaiting Dispensation>Dispensing', 'Awaiting Dispensation>Awaiting Billing', 'Dispensing>Awaiting Billing'];
    END IF;
    -- A receptionist makes no status moves of their own (registering creates the visit; cancelling is handled above).

    IF NOT (v_move = ANY (v_allowed)) THEN
      RAISE EXCEPTION 'Your role cannot move a visit from % to %.', OLD.status, NEW.status USING ERRCODE = '42501';
    END IF;

    -- A patient goes back to the queue only by the doctor who called them.
    IF v_move = 'Consulting>Awaiting Consult' AND OLD.called_by IS DISTINCT FROM auth.uid() THEN
      RAISE EXCEPTION 'Only the doctor who called this patient can return them to the queue.' USING ERRCODE = '42501';
    END IF;

    -- Finishing a consultation goes through signoff_consultation so the signing doctor is recorded.
    IF NEW.status = 'Awaiting Dispensation' AND coalesce(current_setting('mediclinic.in_signoff', true), 'off') <> 'on' THEN
      RAISE EXCEPTION 'A consultation is finished by signing it off.' USING ERRCODE = '42501';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
