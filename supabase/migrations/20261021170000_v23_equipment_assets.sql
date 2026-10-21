-- v23: Equipment & Assets
--
-- Replaces the browser-side equipment list with a real asset register:
--   * full asset records (tag, model, supplier, purchase, warranty, depreciation inputs, location, custodian, intervals)
--   * every change goes through a checked database function; there are no client writes on equipment
--   * service, calibration, inspection and repair are recorded with who did them, the outcome and the certificate,
--     and they set the next due dates
--   * decommissioning replaces delete (reason and method required); history stays
--   * an append-only event history (equipment_events); the old equipment_logs table becomes read-only
-- Depreciation is not stored: it is calculated from the cost, purchase date, useful life and salvage value.

-- 1. Settings -----------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS equipment_settings (
  id BOOLEAN PRIMARY KEY DEFAULT true CHECK (id),
  due_soon_days INTEGER NOT NULL DEFAULT 30 CHECK (due_soon_days >= 0),
  updated_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
INSERT INTO equipment_settings (id) VALUES (true) ON CONFLICT (id) DO NOTHING;

-- 2. Asset register columns ----------------------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS equipment_tag_seq;

ALTER TABLE equipment
  ADD COLUMN IF NOT EXISTS asset_tag TEXT,
  ADD COLUMN IF NOT EXISTS model TEXT,
  ADD COLUMN IF NOT EXISTS manufacturer TEXT,
  ADD COLUMN IF NOT EXISTS supplier TEXT,
  ADD COLUMN IF NOT EXISTS purchase_date DATE,
  ADD COLUMN IF NOT EXISTS cost_price NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS warranty_expiry DATE,
  ADD COLUMN IF NOT EXISTS useful_life_years INTEGER,
  ADD COLUMN IF NOT EXISTS salvage_value NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS location TEXT,
  ADD COLUMN IF NOT EXISTS custodian TEXT,
  ADD COLUMN IF NOT EXISTS risk_class TEXT,
  ADD COLUMN IF NOT EXISTS service_interval_months INTEGER,
  ADD COLUMN IF NOT EXISTS calibration_required BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS calibration_interval_months INTEGER,
  ADD COLUMN IF NOT EXISTS last_service_date DATE,
  ADD COLUMN IF NOT EXISTS last_calibration_date DATE,
  ADD COLUMN IF NOT EXISTS next_calibration_due DATE,
  ADD COLUMN IF NOT EXISTS safety_cert_ref TEXT,
  ADD COLUMN IF NOT EXISTS safety_cert_expiry DATE,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS retired_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS retired_by UUID,
  ADD COLUMN IF NOT EXISTS retire_reason TEXT,
  ADD COLUMN IF NOT EXISTS retire_method TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Existing rows get a tag in the order they were created.
DO $tags$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT id FROM equipment WHERE asset_tag IS NULL ORDER BY created_at, id LOOP
    UPDATE equipment SET asset_tag = 'EQ-' || lpad(nextval('equipment_tag_seq')::text, 4, '0') WHERE id = r.id;
  END LOOP;
END $tags$;

ALTER TABLE equipment ALTER COLUMN asset_tag SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS equipment_asset_tag_key ON equipment (asset_tag);
CREATE UNIQUE INDEX IF NOT EXISTS equipment_serial_key ON equipment (lower(serial_number)) WHERE serial_number IS NOT NULL AND serial_number <> '';

ALTER TABLE equipment DROP CONSTRAINT IF EXISTS equipment_status_check;
ALTER TABLE equipment ADD CONSTRAINT equipment_status_check CHECK (status IN ('Operational', 'Maintenance', 'Out of service', 'Decommissioned'));
ALTER TABLE equipment DROP CONSTRAINT IF EXISTS equipment_risk_check;
ALTER TABLE equipment ADD CONSTRAINT equipment_risk_check CHECK (risk_class IS NULL OR risk_class IN ('low', 'medium', 'high'));
ALTER TABLE equipment DROP CONSTRAINT IF EXISTS equipment_amounts_check;
ALTER TABLE equipment ADD CONSTRAINT equipment_amounts_check CHECK (
  (cost_price IS NULL OR cost_price >= 0) AND salvage_value >= 0
  AND (useful_life_years IS NULL OR useful_life_years > 0)
  AND (service_interval_months IS NULL OR service_interval_months > 0)
  AND (calibration_interval_months IS NULL OR calibration_interval_months > 0));
ALTER TABLE equipment DROP CONSTRAINT IF EXISTS equipment_retired_check;
ALTER TABLE equipment ADD CONSTRAINT equipment_retired_check CHECK (
  status <> 'Decommissioned' OR (retired_at IS NOT NULL AND btrim(COALESCE(retire_reason, '')) <> '' AND retire_method IS NOT NULL));

-- 3. Append-only history ---------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS equipment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seq BIGINT GENERATED ALWAYS AS IDENTITY,
  equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE RESTRICT,
  kind TEXT NOT NULL CHECK (kind IN ('registered', 'edited', 'service', 'calibration', 'inspection', 'repair',
                                      'fault_reported', 'status_changed', 'moved', 'decommissioned', 'restored')),
  performed_on DATE NOT NULL DEFAULT current_date,
  performed_by TEXT,
  outcome TEXT CHECK (outcome IS NULL OR outcome IN ('pass', 'conditional', 'fail')),
  findings TEXT,
  cost NUMERIC(12,2) CHECK (cost IS NULL OR cost >= 0),
  certificate_ref TEXT,
  next_due DATE,
  detail JSONB,
  actor UUID,
  actor_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS equipment_events_item_idx ON equipment_events (equipment_id, seq DESC);

CREATE OR REPLACE FUNCTION public.guard_equipment_history() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION '% is a permanent record: rows cannot be added, changed or removed here.', TG_TABLE_NAME USING ERRCODE = '42501';
END;
$$ LANGUAGE plpgsql SET search_path = public, pg_temp;
REVOKE ALL ON FUNCTION public.guard_equipment_history() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.guard_equipment_events() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'equipment_events is append-only: rows cannot be changed or removed.' USING ERRCODE = '42501';
END;
$$ LANGUAGE plpgsql SET search_path = public, pg_temp;
REVOKE ALL ON FUNCTION public.guard_equipment_events() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.guard_equipment_delete() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'Equipment is never deleted. Decommission it instead so its history stays.' USING ERRCODE = '42501';
END;
$$ LANGUAGE plpgsql SET search_path = public, pg_temp;
REVOKE ALL ON FUNCTION public.guard_equipment_delete() FROM PUBLIC, anon, authenticated;

-- Carry the old log rows over before the old table is frozen.
INSERT INTO equipment_events (equipment_id, kind, performed_on, findings, detail, created_at, actor_name)
SELECT l.equipment_id,
       CASE WHEN l.action ILIKE 'deploy%' OR l.action ILIKE 'regist%' THEN 'registered'
            WHEN l.action ILIKE 'decommission%' THEN 'decommissioned'
            ELSE 'service' END,
       l.date::date, l.notes, jsonb_build_object('legacy_action', l.action), l.date, 'Imported from the old log'
  FROM equipment_logs l
 WHERE l.equipment_id IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM equipment_events);

DROP TRIGGER IF EXISTS equipment_events_guard ON equipment_events;
CREATE TRIGGER equipment_events_guard BEFORE UPDATE OR DELETE ON equipment_events FOR EACH ROW EXECUTE FUNCTION public.guard_equipment_events();
DROP TRIGGER IF EXISTS equipment_logs_guard ON equipment_logs;
CREATE TRIGGER equipment_logs_guard BEFORE INSERT OR UPDATE OR DELETE ON equipment_logs FOR EACH ROW EXECUTE FUNCTION public.guard_equipment_history();
DROP TRIGGER IF EXISTS equipment_no_delete ON equipment;
CREATE TRIGGER equipment_no_delete BEFORE DELETE ON equipment FOR EACH ROW EXECUTE FUNCTION public.guard_equipment_delete();

-- 4. Internal helpers (not callable by clients) ----------------------------------------------------------
CREATE OR REPLACE FUNCTION public.eq_event(
  p_id UUID, p_kind TEXT, p_on DATE, p_by TEXT, p_outcome TEXT, p_findings TEXT, p_cost NUMERIC, p_cert TEXT, p_next DATE, p_detail JSONB
) RETURNS VOID AS $$
  INSERT INTO equipment_events (equipment_id, kind, performed_on, performed_by, outcome, findings, cost, certificate_ref, next_due, detail, actor, actor_name)
  VALUES (p_id, p_kind, COALESCE(p_on, current_date), p_by, p_outcome, p_findings, p_cost, p_cert, p_next, p_detail, auth.uid(), public.inv_name(auth.uid()));
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public, pg_temp;
REVOKE ALL ON FUNCTION public.eq_event(UUID, TEXT, DATE, TEXT, TEXT, TEXT, NUMERIC, TEXT, DATE, JSONB) FROM PUBLIC, anon, authenticated;

-- 5. Client functions -------------------------------------------------------------------------------------
-- Create or edit an asset. Status is not set here; it changes through service records, status changes and decommissioning.
CREATE OR REPLACE FUNCTION public.eq_save(p_id UUID, p JSONB) RETURNS UUID AS $$
DECLARE
  v_name TEXT := btrim(COALESCE(p->>'name', ''));
  v_serial TEXT := NULLIF(btrim(COALESCE(p->>'serial_number', '')), '');
  v_tag TEXT := NULLIF(btrim(COALESCE(p->>'asset_tag', '')), '');
  v_purchase DATE := NULLIF(p->>'purchase_date', '')::date;
  v_warranty DATE := NULLIF(p->>'warranty_expiry', '')::date;
  v_cost NUMERIC := NULLIF(p->>'cost_price', '')::numeric;
  v_salvage NUMERIC := COALESCE(NULLIF(p->>'salvage_value', '')::numeric, 0);
  v_life INTEGER := NULLIF(p->>'useful_life_years', '')::integer;
  v_svc_int INTEGER := NULLIF(p->>'service_interval_months', '')::integer;
  v_cal_req BOOLEAN := COALESCE((p->>'calibration_required')::boolean, false);
  v_cal_int INTEGER := NULLIF(p->>'calibration_interval_months', '')::integer;
  v_risk TEXT := NULLIF(p->>'risk_class', '');
  v_next_svc DATE := NULLIF(p->>'next_service_due', '')::date;
  v_next_cal DATE := NULLIF(p->>'next_calibration_due', '')::date;
  v_cert_exp DATE := NULLIF(p->>'safety_cert_expiry', '')::date;
  v_row equipment%ROWTYPE;
  v_id UUID;
BEGIN
  PERFORM public.inv_require(ARRAY['admin']);
  IF v_name = '' THEN RAISE EXCEPTION 'Enter the equipment name.'; END IF;
  IF btrim(COALESCE(p->>'type', '')) = '' THEN RAISE EXCEPTION 'Choose a category.'; END IF;
  IF v_cost IS NOT NULL AND v_cost < 0 THEN RAISE EXCEPTION 'The cost cannot be negative.'; END IF;
  IF v_salvage < 0 THEN RAISE EXCEPTION 'The salvage value cannot be negative.'; END IF;
  IF v_cost IS NOT NULL AND v_salvage > v_cost THEN RAISE EXCEPTION 'The salvage value cannot be more than the cost.'; END IF;
  IF v_life IS NOT NULL AND v_life <= 0 THEN RAISE EXCEPTION 'The useful life must be at least one year.'; END IF;
  IF v_svc_int IS NOT NULL AND v_svc_int <= 0 THEN RAISE EXCEPTION 'The service interval must be at least one month.'; END IF;
  IF v_cal_req AND v_cal_int IS NULL THEN RAISE EXCEPTION 'Enter how often this equipment is calibrated (months).'; END IF;
  IF NOT v_cal_req THEN v_cal_int := NULL; v_next_cal := NULL; END IF;
  IF v_cal_int IS NOT NULL AND v_cal_int <= 0 THEN RAISE EXCEPTION 'The calibration interval must be at least one month.'; END IF;
  IF v_risk IS NOT NULL AND v_risk NOT IN ('low', 'medium', 'high') THEN RAISE EXCEPTION 'Risk class must be low, medium or high.'; END IF;
  IF v_purchase IS NOT NULL AND v_purchase > current_date THEN RAISE EXCEPTION 'The purchase date cannot be in the future.'; END IF;
  IF v_purchase IS NOT NULL AND v_warranty IS NOT NULL AND v_warranty < v_purchase THEN RAISE EXCEPTION 'The warranty cannot end before the purchase date.'; END IF;

  IF p_id IS NULL THEN
    IF v_tag IS NULL THEN v_tag := 'EQ-' || lpad(nextval('equipment_tag_seq')::text, 4, '0'); END IF;
    BEGIN
      INSERT INTO equipment (name, type, status, serial_number, asset_tag, model, manufacturer, supplier, purchase_date, cost_price, warranty_expiry,
                             useful_life_years, salvage_value, location, custodian, risk_class, service_interval_months, calibration_required,
                             calibration_interval_months, last_service_date, last_calibration_date, next_maintenance, next_calibration_due,
                             safety_cert_ref, safety_cert_expiry, notes)
      VALUES (v_name, btrim(p->>'type'), 'Operational', v_serial, v_tag, NULLIF(p->>'model', ''), NULLIF(p->>'manufacturer', ''), NULLIF(p->>'supplier', ''),
              v_purchase, v_cost, v_warranty, v_life, v_salvage, NULLIF(p->>'location', ''), NULLIF(p->>'custodian', ''), v_risk, v_svc_int, v_cal_req,
              v_cal_int, NULLIF(p->>'last_service_date', '')::date, NULLIF(p->>'last_calibration_date', '')::date,
              COALESCE(v_next_svc, CASE WHEN v_svc_int IS NOT NULL AND NULLIF(p->>'last_service_date', '') IS NOT NULL
                                        THEN (NULLIF(p->>'last_service_date', '')::date + make_interval(months => v_svc_int))::date END),
              COALESCE(v_next_cal, CASE WHEN v_cal_int IS NOT NULL AND NULLIF(p->>'last_calibration_date', '') IS NOT NULL
                                        THEN (NULLIF(p->>'last_calibration_date', '')::date + make_interval(months => v_cal_int))::date END),
              NULLIF(p->>'safety_cert_ref', ''), v_cert_exp, NULLIF(p->>'notes', ''))
      RETURNING id INTO v_id;
    EXCEPTION WHEN unique_violation THEN
      RAISE EXCEPTION 'That asset tag or serial number is already registered.';
    END;
    PERFORM public.eq_event(v_id, 'registered', current_date, NULL, NULL, 'Registered in the asset register.', NULL, NULL, NULL, to_jsonb(p));
    RETURN v_id;
  END IF;

  SELECT * INTO v_row FROM equipment WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Equipment not found.'; END IF;
  IF v_row.status = 'Decommissioned' THEN RAISE EXCEPTION 'This equipment is decommissioned. Restore it before editing.'; END IF;
  IF v_tag IS NULL THEN v_tag := v_row.asset_tag; END IF;

  BEGIN
    UPDATE equipment SET
      name = v_name, type = btrim(p->>'type'), serial_number = v_serial, asset_tag = v_tag, model = NULLIF(p->>'model', ''),
      manufacturer = NULLIF(p->>'manufacturer', ''), supplier = NULLIF(p->>'supplier', ''), purchase_date = v_purchase, cost_price = v_cost,
      warranty_expiry = v_warranty, useful_life_years = v_life, salvage_value = v_salvage, risk_class = v_risk,
      service_interval_months = v_svc_int, calibration_required = v_cal_req, calibration_interval_months = v_cal_int,
      next_maintenance = COALESCE(v_next_svc, next_maintenance),
      next_calibration_due = CASE WHEN v_cal_req THEN COALESCE(v_next_cal, next_calibration_due) ELSE NULL END,
      safety_cert_ref = NULLIF(p->>'safety_cert_ref', ''), safety_cert_expiry = v_cert_exp, notes = NULLIF(p->>'notes', ''), updated_at = now()
    WHERE id = p_id;
  EXCEPTION WHEN unique_violation THEN
    RAISE EXCEPTION 'That asset tag or serial number is already registered.';
  END;
  PERFORM public.eq_event(p_id, 'edited', current_date, NULL, NULL, NULL, NULL, NULL, NULL, jsonb_build_object('before', to_jsonb(v_row), 'after', to_jsonb(p)));
  RETURN p_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Record a service, calibration, inspection or repair. This is the only way the "last done" and "next due" dates move.
CREATE OR REPLACE FUNCTION public.eq_record_service(p_id UUID, p JSONB) RETURNS VOID AS $$
DECLARE
  v_row equipment%ROWTYPE;
  v_kind TEXT := COALESCE(p->>'kind', '');
  v_on DATE := NULLIF(p->>'performed_on', '')::date;
  v_by TEXT := btrim(COALESCE(p->>'performed_by', ''));
  v_outcome TEXT := COALESCE(p->>'outcome', '');
  v_findings TEXT := NULLIF(btrim(COALESCE(p->>'findings', '')), '');
  v_cost NUMERIC := NULLIF(p->>'cost', '')::numeric;
  v_cert TEXT := NULLIF(btrim(COALESCE(p->>'certificate_ref', '')), '');
  v_next DATE := NULLIF(p->>'next_due', '')::date;
  v_cert_exp DATE := NULLIF(p->>'safety_cert_expiry', '')::date;
  v_status TEXT;
  v_next_svc DATE;
  v_next_cal DATE;
BEGIN
  PERFORM public.inv_require(ARRAY['admin']);
  IF v_kind NOT IN ('service', 'calibration', 'inspection', 'repair') THEN RAISE EXCEPTION 'Choose service, calibration, inspection or repair.'; END IF;
  IF v_on IS NULL THEN RAISE EXCEPTION 'Enter the date the work was done.'; END IF;
  IF v_on > current_date THEN RAISE EXCEPTION 'The work date cannot be in the future.'; END IF;
  IF v_by = '' THEN RAISE EXCEPTION 'Enter who did the work (technician or vendor).'; END IF;
  IF v_outcome NOT IN ('pass', 'conditional', 'fail') THEN RAISE EXCEPTION 'Choose the outcome: pass, conditional or fail.'; END IF;
  IF v_outcome <> 'pass' AND v_findings IS NULL THEN RAISE EXCEPTION 'Describe what was found when the result is not a clean pass.'; END IF;
  IF v_kind = 'calibration' AND v_outcome <> 'fail' AND v_cert IS NULL THEN RAISE EXCEPTION 'Enter the calibration certificate number.'; END IF;
  IF v_cost IS NOT NULL AND v_cost < 0 THEN RAISE EXCEPTION 'The cost cannot be negative.'; END IF;

  SELECT * INTO v_row FROM equipment WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Equipment not found.'; END IF;
  IF v_row.status = 'Decommissioned' THEN RAISE EXCEPTION 'This equipment is decommissioned.'; END IF;
  IF v_row.purchase_date IS NOT NULL AND v_on < v_row.purchase_date THEN RAISE EXCEPTION 'The work date is before the purchase date.'; END IF;
  IF v_next IS NOT NULL AND v_next <= v_on THEN RAISE EXCEPTION 'The next due date must be after the work date.'; END IF;
  IF v_kind = 'calibration' AND NOT v_row.calibration_required THEN
    RAISE EXCEPTION 'This equipment is not set up for calibration. Edit it and turn calibration on first.';
  END IF;

  v_status := v_row.status;
  IF v_outcome = 'fail' THEN
    v_status := 'Out of service';
  ELSIF v_outcome = 'pass' AND v_kind IN ('service', 'repair', 'calibration') AND v_row.status IN ('Maintenance', 'Out of service') THEN
    v_status := 'Operational';
  END IF;

  v_next_svc := v_row.next_maintenance;
  v_next_cal := v_row.next_calibration_due;
  IF v_outcome <> 'fail' THEN
    IF v_kind IN ('service', 'repair') THEN
      v_next_svc := COALESCE(v_next, CASE WHEN v_row.service_interval_months IS NOT NULL THEN (v_on + make_interval(months => v_row.service_interval_months))::date END, v_row.next_maintenance);
    ELSIF v_kind = 'calibration' THEN
      v_next_cal := COALESCE(v_next, CASE WHEN v_row.calibration_interval_months IS NOT NULL THEN (v_on + make_interval(months => v_row.calibration_interval_months))::date END, v_row.next_calibration_due);
    END IF;
  END IF;

  UPDATE equipment SET
    status = v_status,
    last_service_date = CASE WHEN v_kind IN ('service', 'repair') AND v_outcome <> 'fail' THEN GREATEST(COALESCE(last_service_date, v_on), v_on) ELSE last_service_date END,
    last_calibration_date = CASE WHEN v_kind = 'calibration' AND v_outcome <> 'fail' THEN GREATEST(COALESCE(last_calibration_date, v_on), v_on) ELSE last_calibration_date END,
    next_maintenance = v_next_svc,
    next_calibration_due = v_next_cal,
    safety_cert_ref = CASE WHEN v_kind = 'inspection' AND v_cert IS NOT NULL THEN v_cert ELSE safety_cert_ref END,
    safety_cert_expiry = CASE WHEN v_kind = 'inspection' AND v_cert_exp IS NOT NULL THEN v_cert_exp ELSE safety_cert_expiry END,
    updated_at = now()
  WHERE id = p_id;

  PERFORM public.eq_event(p_id, v_kind, v_on, v_by, v_outcome, v_findings, v_cost, v_cert,
                          CASE WHEN v_kind = 'calibration' THEN v_next_cal ELSE v_next_svc END,
                          jsonb_build_object('status_before', v_row.status, 'status_after', v_status));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Any signed-in staff member can report a fault. It flags the equipment for attention; it does not take it out of service.
CREATE OR REPLACE FUNCTION public.eq_report_fault(p_id UUID, p_description TEXT) RETURNS VOID AS $$
DECLARE v_row equipment%ROWTYPE; v_role TEXT := public.get_user_role();
BEGIN
  IF auth.uid() IS NULL OR v_role IS NULL THEN RAISE EXCEPTION 'You do not have permission to do this.' USING ERRCODE = '42501'; END IF;
  IF btrim(COALESCE(p_description, '')) = '' THEN RAISE EXCEPTION 'Describe the fault.'; END IF;
  SELECT * INTO v_row FROM equipment WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Equipment not found.'; END IF;
  IF v_row.status = 'Decommissioned' THEN RAISE EXCEPTION 'This equipment is decommissioned.'; END IF;
  IF v_row.status = 'Operational' THEN UPDATE equipment SET status = 'Maintenance', updated_at = now() WHERE id = p_id; END IF;
  PERFORM public.eq_event(p_id, 'fault_reported', current_date, public.inv_name(auth.uid()), NULL, btrim(p_description), NULL, NULL, NULL,
                          jsonb_build_object('status_before', v_row.status));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Change status between Operational, Maintenance and Out of service (decommissioning has its own function).
CREATE OR REPLACE FUNCTION public.eq_set_status(p_id UUID, p_status TEXT, p_reason TEXT) RETURNS VOID AS $$
DECLARE v_row equipment%ROWTYPE;
BEGIN
  PERFORM public.inv_require(ARRAY['admin']);
  IF p_status NOT IN ('Operational', 'Maintenance', 'Out of service') THEN RAISE EXCEPTION 'Choose Operational, Maintenance or Out of service.'; END IF;
  IF btrim(COALESCE(p_reason, '')) = '' THEN RAISE EXCEPTION 'Give a reason for the change.'; END IF;
  SELECT * INTO v_row FROM equipment WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Equipment not found.'; END IF;
  IF v_row.status = 'Decommissioned' THEN RAISE EXCEPTION 'This equipment is decommissioned. Restore it first.'; END IF;
  IF v_row.status = p_status THEN RAISE EXCEPTION 'It is already %.', p_status; END IF;
  UPDATE equipment SET status = p_status, updated_at = now() WHERE id = p_id;
  PERFORM public.eq_event(p_id, 'status_changed', current_date, NULL, NULL, btrim(p_reason), NULL, NULL, NULL,
                          jsonb_build_object('from', v_row.status, 'to', p_status));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Move equipment to another room or hand it to another custodian.
CREATE OR REPLACE FUNCTION public.eq_move(p_id UUID, p_location TEXT, p_custodian TEXT, p_reason TEXT) RETURNS VOID AS $$
DECLARE v_row equipment%ROWTYPE; v_loc TEXT := NULLIF(btrim(COALESCE(p_location, '')), ''); v_cus TEXT := NULLIF(btrim(COALESCE(p_custodian, '')), '');
BEGIN
  PERFORM public.inv_require(ARRAY['admin']);
  IF v_loc IS NULL AND v_cus IS NULL THEN RAISE EXCEPTION 'Enter a new location or custodian.'; END IF;
  SELECT * INTO v_row FROM equipment WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Equipment not found.'; END IF;
  IF v_row.status = 'Decommissioned' THEN RAISE EXCEPTION 'This equipment is decommissioned.'; END IF;
  IF v_loc IS NOT DISTINCT FROM v_row.location AND v_cus IS NOT DISTINCT FROM v_row.custodian THEN RAISE EXCEPTION 'Nothing has changed.'; END IF;
  UPDATE equipment SET location = COALESCE(v_loc, location), custodian = COALESCE(v_cus, custodian), updated_at = now() WHERE id = p_id;
  PERFORM public.eq_event(p_id, 'moved', current_date, NULL, NULL, NULLIF(btrim(COALESCE(p_reason, '')), ''), NULL, NULL, NULL,
                          jsonb_build_object('from_location', v_row.location, 'to_location', COALESCE(v_loc, v_row.location),
                                             'from_custodian', v_row.custodian, 'to_custodian', COALESCE(v_cus, v_row.custodian)));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION public.eq_decommission(p_id UUID, p_reason TEXT, p_method TEXT) RETURNS VOID AS $$
DECLARE v_row equipment%ROWTYPE;
BEGIN
  PERFORM public.inv_require(ARRAY['admin']);
  IF btrim(COALESCE(p_reason, '')) = '' THEN RAISE EXCEPTION 'Give a reason for decommissioning.'; END IF;
  IF p_method NOT IN ('disposed', 'sold', 'donated', 'scrapped', 'returned_to_vendor', 'lost') THEN
    RAISE EXCEPTION 'Choose how it left service: disposed, sold, donated, scrapped, returned to vendor or lost.';
  END IF;
  SELECT * INTO v_row FROM equipment WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Equipment not found.'; END IF;
  IF v_row.status = 'Decommissioned' THEN RAISE EXCEPTION 'Already decommissioned.'; END IF;
  UPDATE equipment SET status = 'Decommissioned', retired_at = now(), retired_by = auth.uid(), retire_reason = btrim(p_reason), retire_method = p_method, updated_at = now() WHERE id = p_id;
  PERFORM public.eq_event(p_id, 'decommissioned', current_date, NULL, NULL, btrim(p_reason), NULL, NULL, NULL,
                          jsonb_build_object('method', p_method, 'status_before', v_row.status));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Bring decommissioned equipment back. It returns as Out of service: it must be serviced before it is used.
CREATE OR REPLACE FUNCTION public.eq_restore(p_id UUID, p_reason TEXT) RETURNS VOID AS $$
BEGIN
  PERFORM public.inv_require(ARRAY['admin']);
  IF btrim(COALESCE(p_reason, '')) = '' THEN RAISE EXCEPTION 'Give a reason for restoring this equipment.'; END IF;
  UPDATE equipment SET status = 'Out of service', retired_at = NULL, retired_by = NULL, retire_reason = NULL, retire_method = NULL, updated_at = now()
   WHERE id = p_id AND status = 'Decommissioned';
  IF NOT FOUND THEN RAISE EXCEPTION 'Equipment not found or not decommissioned.'; END IF;
  PERFORM public.eq_event(p_id, 'restored', current_date, NULL, NULL, btrim(p_reason), NULL, NULL, NULL, NULL);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION
  public.eq_save(UUID, JSONB), public.eq_record_service(UUID, JSONB), public.eq_report_fault(UUID, TEXT), public.eq_set_status(UUID, TEXT, TEXT),
  public.eq_move(UUID, TEXT, TEXT, TEXT), public.eq_decommission(UUID, TEXT, TEXT), public.eq_restore(UUID, TEXT)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION
  public.eq_save(UUID, JSONB), public.eq_record_service(UUID, JSONB), public.eq_report_fault(UUID, TEXT), public.eq_set_status(UUID, TEXT, TEXT),
  public.eq_move(UUID, TEXT, TEXT, TEXT), public.eq_decommission(UUID, TEXT, TEXT), public.eq_restore(UUID, TEXT)
  TO authenticated;

-- 6. Row level security: read-only from the client ---------------------------------------------------------
ALTER TABLE equipment_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin can manage equipment" ON equipment;
DROP POLICY IF EXISTS "Admin can manage equipment logs" ON equipment_logs;
DROP POLICY IF EXISTS "Signed-in read equipment settings" ON equipment_settings;
DROP POLICY IF EXISTS "Admin edits equipment settings" ON equipment_settings;
DROP POLICY IF EXISTS "Signed-in read equipment events" ON equipment_events;

CREATE POLICY "Signed-in read equipment settings" ON equipment_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin edits equipment settings" ON equipment_settings FOR UPDATE TO authenticated
  USING (public.get_user_role() = 'admin') WITH CHECK (public.get_user_role() = 'admin');
CREATE POLICY "Signed-in read equipment events" ON equipment_events FOR SELECT TO authenticated USING (true);
