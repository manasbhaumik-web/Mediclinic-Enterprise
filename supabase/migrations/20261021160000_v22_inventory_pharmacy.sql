-- v22: Inventory & Pharmacy: atomic dispensing, batch-level stock, suppliers and purchase orders,
--      a controlled-drug register with a second signature, and an append-only ledger.
--
-- Access model
--   * Everyone signed in can READ the drug catalogue, batches and the stock ledger (it drives prescribing and dashboards).
--   * NOBODY can write stock from the client. Stock only changes through the inv_* functions below, which check
--     the caller's role, lock the rows they touch and write the ledger in the same transaction.
--   * Suppliers and settings are written by pharmacist/admin directly under RLS (settings: admin); changes are logged.
--   * The ledger (stock_movements), the controlled register, its signatures and the event log are append-only,
--     enforced by triggers that apply to the service role too.
--   * Dispensed (or skipped) prescription lines are immutable, and a visit cannot leave the pharmacy while a
--     prescription is undecided or a controlled-drug entry is waiting for its second signature.

-- 1. Settings -----------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inventory_settings (
  id BOOLEAN PRIMARY KEY DEFAULT true CHECK (id),
  near_expiry_days INTEGER NOT NULL DEFAULT 60 CHECK (near_expiry_days >= 0),
  updated_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
INSERT INTO inventory_settings (id) VALUES (true) ON CONFLICT (id) DO NOTHING;

-- 2. Catalogue: retire instead of delete, controlled-drug register flag, reorder data --------------------
ALTER TABLE inventory
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS retired_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS retired_by UUID,
  ADD COLUMN IF NOT EXISTS retire_reason TEXT,
  ADD COLUMN IF NOT EXISTS unit TEXT NOT NULL DEFAULT 'unit',
  ADD COLUMN IF NOT EXISTS reorder_quantity INTEGER,
  ADD COLUMN IF NOT EXISTS cost_price NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS register_required BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS control_class TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

ALTER TABLE inventory DROP CONSTRAINT IF EXISTS inventory_status_check;
ALTER TABLE inventory ADD CONSTRAINT inventory_status_check CHECK (status IN ('active', 'retired'));
ALTER TABLE inventory DROP CONSTRAINT IF EXISTS inventory_reorder_check;
ALTER TABLE inventory ADD CONSTRAINT inventory_reorder_check CHECK (reorder_quantity IS NULL OR reorder_quantity > 0);
ALTER TABLE inventory DROP CONSTRAINT IF EXISTS inventory_control_class_check;
ALTER TABLE inventory ADD CONSTRAINT inventory_control_class_check
  CHECK (control_class IS NULL OR control_class IN ('poison_group_b', 'poison_group_c', 'dangerous_drug', 'psychotropic', 'other_controlled'));
ALTER TABLE inventory DROP CONSTRAINT IF EXISTS inventory_register_class_check;
ALTER TABLE inventory ADD CONSTRAINT inventory_register_class_check CHECK (NOT register_required OR control_class IS NOT NULL);
ALTER TABLE inventory DROP CONSTRAINT IF EXISTS inventory_stock_nonneg;
ALTER TABLE inventory ADD CONSTRAINT inventory_stock_nonneg CHECK (stock_level >= 0);
ALTER TABLE inventory DROP CONSTRAINT IF EXISTS inventory_price_nonneg;
ALTER TABLE inventory ADD CONSTRAINT inventory_price_nonneg CHECK (price >= 0);

-- 3. Suppliers and purchase orders -----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  contact_name TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  notes TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE SEQUENCE IF NOT EXISTS po_number_seq;

CREATE TABLE IF NOT EXISTS purchase_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  po_number TEXT NOT NULL UNIQUE,
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'ordered', 'partially_received', 'received', 'cancelled')),
  expected_date DATE,
  notes TEXT,
  created_by UUID, created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ordered_by UUID, ordered_at TIMESTAMPTZ,
  cancelled_by UUID, cancelled_at TIMESTAMPTZ, cancel_reason TEXT
);
CREATE INDEX IF NOT EXISTS purchase_orders_status_idx ON purchase_orders (status);

CREATE TABLE IF NOT EXISTS purchase_order_lines (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  po_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE RESTRICT,
  inventory_id UUID NOT NULL REFERENCES inventory(id) ON DELETE RESTRICT,
  quantity_ordered INTEGER NOT NULL CHECK (quantity_ordered > 0),
  quantity_received INTEGER NOT NULL DEFAULT 0 CHECK (quantity_received >= 0),
  unit_cost NUMERIC(12, 2) CHECK (unit_cost IS NULL OR unit_cost >= 0),
  UNIQUE (po_id, inventory_id)
);

-- 4. Batches: stock lives here; inventory.stock_level becomes the sum of its batches -----------------------
ALTER TABLE drug_batches ALTER COLUMN expiry_date DROP NOT NULL;
ALTER TABLE drug_batches ALTER COLUMN inventory_id SET NOT NULL;
ALTER TABLE drug_batches DROP CONSTRAINT IF EXISTS drug_batches_inventory_id_fkey;
ALTER TABLE drug_batches ADD CONSTRAINT drug_batches_inventory_id_fkey FOREIGN KEY (inventory_id) REFERENCES inventory(id) ON DELETE RESTRICT;
ALTER TABLE drug_batches
  ADD COLUMN IF NOT EXISTS received_qty INTEGER,
  ADD COLUMN IF NOT EXISTS unit_cost NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES suppliers(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS po_id UUID REFERENCES purchase_orders(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS received_by UUID;
ALTER TABLE drug_batches DROP CONSTRAINT IF EXISTS drug_batches_stock_nonneg;
ALTER TABLE drug_batches ADD CONSTRAINT drug_batches_stock_nonneg CHECK (stock_level >= 0);
CREATE UNIQUE INDEX IF NOT EXISTS drug_batches_inventory_batch_uq ON drug_batches (inventory_id, batch_number);
CREATE INDEX IF NOT EXISTS drug_batches_fefo_idx ON drug_batches (inventory_id, expiry_date NULLS LAST);

CREATE OR REPLACE FUNCTION public.sync_inventory_stock() RETURNS trigger AS $$
DECLARE v_id UUID := COALESCE(NEW.inventory_id, OLD.inventory_id);
BEGIN
  UPDATE inventory SET stock_level = COALESCE((SELECT SUM(stock_level) FROM drug_batches WHERE inventory_id = v_id), 0), updated_at = now()
  WHERE id = v_id;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;
REVOKE ALL ON FUNCTION public.sync_inventory_stock() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS drug_batches_sync ON drug_batches;
CREATE TRIGGER drug_batches_sync AFTER INSERT OR UPDATE OF stock_level OR DELETE ON drug_batches
  FOR EACH ROW EXECUTE FUNCTION public.sync_inventory_stock();

-- 5. Ledger, controlled register, signatures, events (all append-only) -------------------------------------
CREATE TABLE IF NOT EXISTS stock_movements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seq BIGSERIAL,
  inventory_id UUID NOT NULL REFERENCES inventory(id) ON DELETE RESTRICT,
  batch_id UUID REFERENCES drug_batches(id) ON DELETE RESTRICT,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('opening', 'receive', 'dispense', 'dispose', 'internal_use', 'decrease', 'increase')),
  quantity INTEGER NOT NULL CHECK (quantity <> 0),          -- signed: negative takes stock out
  balance_after INTEGER NOT NULL,                           -- the drug's total stock after this movement
  reason TEXT,
  prescription_id UUID,
  visit_id UUID,
  po_id UUID,
  actor UUID,
  actor_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS stock_movements_inv_idx ON stock_movements (inventory_id, seq DESC);
CREATE INDEX IF NOT EXISTS stock_movements_visit_idx ON stock_movements (visit_id);

CREATE TABLE IF NOT EXISTS controlled_register (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seq BIGSERIAL,
  inventory_id UUID NOT NULL REFERENCES inventory(id) ON DELETE RESTRICT,
  batch_id UUID REFERENCES drug_batches(id) ON DELETE RESTRICT,
  entry_type TEXT NOT NULL CHECK (entry_type IN ('opening', 'receipt', 'dispense', 'disposal', 'internal_use', 'adjustment')),
  quantity INTEGER NOT NULL,                                -- signed
  balance_after INTEGER NOT NULL CHECK (balance_after >= 0),
  patient_id UUID,
  patient_name TEXT,                                        -- snapshots: the register must survive record changes
  patient_ic TEXT,
  prescriber_id UUID,
  prescriber_name TEXT,
  prescription_id UUID,
  visit_id UUID,
  reference TEXT,                                           -- batch number or purchase order
  reason TEXT,
  performed_by UUID NOT NULL,
  performed_by_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (entry_type <> 'dispense' OR (patient_id IS NOT NULL AND prescriber_name IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS controlled_register_inv_idx ON controlled_register (inventory_id, seq DESC);
CREATE INDEX IF NOT EXISTS controlled_register_visit_idx ON controlled_register (visit_id);

CREATE TABLE IF NOT EXISTS controlled_register_signatures (
  entry_id UUID PRIMARY KEY REFERENCES controlled_register(id) ON DELETE RESTRICT,
  signed_by UUID NOT NULL,
  signed_by_name TEXT,
  note TEXT,
  signed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS inventory_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entity TEXT NOT NULL,
  entity_id TEXT,
  action TEXT NOT NULL,
  actor UUID,
  detail JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS inventory_events_entity_idx ON inventory_events (entity, entity_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.guard_append_only() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION '% is append-only: rows cannot be changed or removed.', TG_TABLE_NAME USING ERRCODE = '42501';
END;
$$ LANGUAGE plpgsql SET search_path = public, pg_temp;
REVOKE ALL ON FUNCTION public.guard_append_only() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS stock_movements_guard ON stock_movements;
CREATE TRIGGER stock_movements_guard BEFORE UPDATE OR DELETE ON stock_movements FOR EACH ROW EXECUTE FUNCTION public.guard_append_only();
DROP TRIGGER IF EXISTS controlled_register_guard ON controlled_register;
CREATE TRIGGER controlled_register_guard BEFORE UPDATE OR DELETE ON controlled_register FOR EACH ROW EXECUTE FUNCTION public.guard_append_only();
DROP TRIGGER IF EXISTS controlled_signatures_guard ON controlled_register_signatures;
CREATE TRIGGER controlled_signatures_guard BEFORE UPDATE OR DELETE ON controlled_register_signatures FOR EACH ROW EXECUTE FUNCTION public.guard_append_only();
DROP TRIGGER IF EXISTS inventory_events_guard ON inventory_events;
CREATE TRIGGER inventory_events_guard BEFORE UPDATE OR DELETE ON inventory_events FOR EACH ROW EXECUTE FUNCTION public.guard_append_only();
-- The legacy log stays readable but can no longer change.
DROP TRIGGER IF EXISTS inventory_logs_guard ON inventory_logs;
CREATE TRIGGER inventory_logs_guard BEFORE INSERT OR UPDATE OR DELETE ON inventory_logs FOR EACH ROW EXECUTE FUNCTION public.guard_append_only();
ALTER TABLE inventory_logs DROP CONSTRAINT IF EXISTS inventory_logs_inventory_id_fkey;
ALTER TABLE inventory_logs ADD CONSTRAINT inventory_logs_inventory_id_fkey FOREIGN KEY (inventory_id) REFERENCES inventory(id) ON DELETE RESTRICT;

-- Supplier and settings changes made directly are logged here (runs as the owner; nobody can call it).
CREATE OR REPLACE FUNCTION public.log_inventory_config_change() RETURNS trigger AS $$
BEGIN
  INSERT INTO inventory_events (entity, entity_id, action, actor, detail)
  VALUES (TG_TABLE_NAME, COALESCE(to_jsonb(NEW)->>'id', to_jsonb(OLD)->>'id'), lower(TG_OP), auth.uid(),
          jsonb_build_object('before', CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE to_jsonb(OLD) END,
                             'after', CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE to_jsonb(NEW) END));
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;
REVOKE ALL ON FUNCTION public.log_inventory_config_change() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS suppliers_log ON suppliers;
CREATE TRIGGER suppliers_log AFTER INSERT OR UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION public.log_inventory_config_change();
DROP TRIGGER IF EXISTS inventory_settings_log ON inventory_settings;
CREATE TRIGGER inventory_settings_log AFTER UPDATE ON inventory_settings FOR EACH ROW EXECUTE FUNCTION public.log_inventory_config_change();

-- 6. Prescriptions link to stock by id and become immutable once decided --------------------------------
ALTER TABLE prescriptions
  ADD COLUMN IF NOT EXISTS inventory_id UUID REFERENCES inventory(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS dispensed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS dispensed_by UUID,
  ADD COLUMN IF NOT EXISTS dispensed_quantity INTEGER,
  ADD COLUMN IF NOT EXISTS skipped BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS skip_reason TEXT;
CREATE INDEX IF NOT EXISTS prescriptions_inventory_idx ON prescriptions (inventory_id);

UPDATE prescriptions p SET inventory_id = i.id
FROM inventory i
WHERE p.inventory_id IS NULL AND lower(btrim(p.drug_name)) = lower(btrim(i.drug_name));

-- 7. Opening balances: any stock not held in a batch becomes an OPENING batch, so batches are the truth --------
DO $$
DECLARE r RECORD; v_diff INTEGER; v_batch UUID;
BEGIN
  FOR r IN SELECT i.id, i.stock_level, i.expiry_date, COALESCE((SELECT SUM(b.stock_level) FROM drug_batches b WHERE b.inventory_id = i.id), 0) AS in_batches
           FROM inventory i LOOP
    v_diff := r.stock_level - r.in_batches;
    IF v_diff > 0 THEN
      INSERT INTO drug_batches (inventory_id, batch_number, stock_level, received_qty, expiry_date)
      VALUES (r.id, 'OPENING', v_diff, v_diff, r.expiry_date) RETURNING id INTO v_batch;
      INSERT INTO stock_movements (inventory_id, batch_id, movement_type, quantity, balance_after, reason)
      VALUES (r.id, v_batch, 'opening', v_diff, r.stock_level, 'Opening balance carried over when batch tracking started');
    END IF;
  END LOOP;
  -- Re-sync totals (batches are now the source of truth).
  UPDATE inventory i SET stock_level = COALESCE((SELECT SUM(b.stock_level) FROM drug_batches b WHERE b.inventory_id = i.id), 0);
END $$;

-- 8. Internal helpers (not callable by clients) ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.inv_require(p_roles TEXT[]) RETURNS UUID AS $$
DECLARE v_role TEXT := public.get_user_role();
BEGIN
  IF auth.uid() IS NULL OR v_role IS NULL OR NOT (v_role = ANY (p_roles)) THEN
    RAISE EXCEPTION 'You do not have permission to do this.' USING ERRCODE = '42501';
  END IF;
  RETURN auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION public.inv_name(p_uid UUID) RETURNS TEXT AS $$
  SELECT COALESCE((SELECT full_name FROM profiles WHERE id = p_uid), 'Unknown');
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION public.inv_event(p_entity TEXT, p_entity_id TEXT, p_action TEXT, p_detail JSONB) RETURNS VOID AS $$
  INSERT INTO inventory_events (entity, entity_id, action, actor, detail) VALUES (p_entity, p_entity_id, p_action, auth.uid(), p_detail);
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public, pg_temp;

-- Writes the ledger line for a batch change that has already been applied to drug_batches.
CREATE OR REPLACE FUNCTION public.inv_move(p_inv UUID, p_batch UUID, p_type TEXT, p_qty INTEGER, p_reason TEXT, p_rx UUID, p_visit UUID, p_po UUID) RETURNS VOID AS $$
  INSERT INTO stock_movements (inventory_id, batch_id, movement_type, quantity, balance_after, reason, prescription_id, visit_id, po_id, actor, actor_name)
  VALUES (p_inv, p_batch, p_type, p_qty,
          COALESCE((SELECT SUM(stock_level) FROM drug_batches WHERE inventory_id = p_inv), 0),
          p_reason, p_rx, p_visit, p_po, auth.uid(), public.inv_name(auth.uid()));
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public, pg_temp;

-- Writes a controlled-register entry with the running balance. The caller must already hold the inventory row lock.
CREATE OR REPLACE FUNCTION public.inv_register(
  p_inv UUID, p_batch UUID, p_type TEXT, p_qty INTEGER, p_ref TEXT, p_reason TEXT,
  p_patient UUID, p_rx UUID, p_visit UUID, p_prescriber UUID
) RETURNS UUID AS $$
DECLARE v_prev INTEGER; v_id UUID; v_pat_name TEXT; v_pat_ic TEXT; v_presc_name TEXT;
BEGIN
  SELECT COALESCE((SELECT balance_after FROM controlled_register WHERE inventory_id = p_inv ORDER BY seq DESC LIMIT 1), 0) INTO v_prev;
  IF p_patient IS NOT NULL THEN SELECT full_name, ic_number INTO v_pat_name, v_pat_ic FROM patients WHERE id = p_patient; END IF;
  IF p_prescriber IS NOT NULL THEN v_presc_name := public.inv_name(p_prescriber); END IF;
  INSERT INTO controlled_register (inventory_id, batch_id, entry_type, quantity, balance_after, patient_id, patient_name, patient_ic,
                                   prescriber_id, prescriber_name, prescription_id, visit_id, reference, reason, performed_by, performed_by_name)
  VALUES (p_inv, p_batch, p_type, p_qty, v_prev + p_qty, p_patient, v_pat_name, v_pat_ic,
          p_prescriber, v_presc_name, p_rx, p_visit, p_ref, p_reason, auth.uid(), public.inv_name(auth.uid()))
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Takes stock out of the soonest-expiring unexpired batches. Fails, changing nothing, if there is not enough.
CREATE OR REPLACE FUNCTION public.inv_take_stock(
  p_inv UUID, p_qty INTEGER, p_reason TEXT, p_rx UUID, p_visit UUID, p_patient UUID, p_prescriber UUID
) RETURNS JSONB AS $$
DECLARE v_inv inventory%ROWTYPE; v_avail INTEGER; v_left INTEGER := p_qty; v_take INTEGER; b RECORD; v_used JSONB := '[]'::jsonb;
BEGIN
  SELECT * INTO v_inv FROM inventory WHERE id = p_inv FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Stock item not found.'; END IF;
  IF v_inv.status <> 'active' THEN RAISE EXCEPTION '% is retired and cannot be dispensed.', v_inv.drug_name; END IF;
  IF p_qty IS NULL OR p_qty <= 0 THEN RAISE EXCEPTION 'Quantity must be above zero.'; END IF;

  SELECT COALESCE(SUM(stock_level), 0) INTO v_avail FROM drug_batches
   WHERE inventory_id = p_inv AND stock_level > 0 AND (expiry_date IS NULL OR expiry_date >= CURRENT_DATE);
  IF v_avail < p_qty THEN
    RAISE EXCEPTION 'Not enough % in stock: % available in date, % needed (expired batches are not used).', v_inv.drug_name, v_avail, p_qty USING ERRCODE = 'P0001';
  END IF;

  FOR b IN SELECT * FROM drug_batches
            WHERE inventory_id = p_inv AND stock_level > 0 AND (expiry_date IS NULL OR expiry_date >= CURRENT_DATE)
            ORDER BY expiry_date NULLS LAST, received_at, id FOR UPDATE LOOP
    EXIT WHEN v_left <= 0;
    v_take := LEAST(b.stock_level, v_left);
    UPDATE drug_batches SET stock_level = stock_level - v_take WHERE id = b.id;
    PERFORM public.inv_move(p_inv, b.id, 'dispense', -v_take, p_reason, p_rx, p_visit, NULL);
    v_used := v_used || jsonb_build_object('batch_id', b.id, 'batch_number', b.batch_number, 'quantity', v_take, 'expiry_date', b.expiry_date);
    v_left := v_left - v_take;
  END LOOP;

  IF v_inv.register_required THEN
    PERFORM public.inv_register(p_inv, NULL, 'dispense', -p_qty, NULL, p_reason, p_patient, p_rx, p_visit, p_prescriber);
  END IF;
  RETURN v_used;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Adds stock as a batch (new, or onto an existing batch with the same number and expiry).
CREATE OR REPLACE FUNCTION public.inv_add_batch(
  p_inv UUID, p_qty INTEGER, p_batch_no TEXT, p_expiry DATE, p_supplier UUID, p_cost NUMERIC, p_po UUID, p_reason TEXT
) RETURNS UUID AS $$
DECLARE v_inv inventory%ROWTYPE; v_batch drug_batches%ROWTYPE; v_id UUID; v_no TEXT := btrim(COALESCE(p_batch_no, ''));
BEGIN
  SELECT * INTO v_inv FROM inventory WHERE id = p_inv FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Stock item not found.'; END IF;
  IF v_inv.status <> 'active' THEN RAISE EXCEPTION '% is retired. Restore it before receiving stock.', v_inv.drug_name; END IF;
  IF p_qty IS NULL OR p_qty <= 0 THEN RAISE EXCEPTION 'Quantity received must be above zero.'; END IF;
  IF v_no = '' THEN RAISE EXCEPTION 'Enter the batch number from the pack.'; END IF;
  IF p_expiry IS NULL THEN RAISE EXCEPTION 'Enter the expiry date from the pack.'; END IF;
  IF p_expiry < CURRENT_DATE THEN RAISE EXCEPTION 'This batch has already expired (%).', p_expiry; END IF;

  SELECT * INTO v_batch FROM drug_batches WHERE inventory_id = p_inv AND batch_number = v_no FOR UPDATE;
  IF FOUND THEN
    IF v_batch.expiry_date IS DISTINCT FROM p_expiry THEN
      RAISE EXCEPTION 'Batch % already exists with a different expiry date (%).', v_no, v_batch.expiry_date;
    END IF;
    UPDATE drug_batches SET stock_level = stock_level + p_qty, received_qty = COALESCE(received_qty, 0) + p_qty WHERE id = v_batch.id;
    v_id := v_batch.id;
  ELSE
    INSERT INTO drug_batches (inventory_id, batch_number, stock_level, received_qty, expiry_date, supplier_id, po_id, unit_cost, received_by)
    VALUES (p_inv, v_no, p_qty, p_qty, p_expiry, p_supplier, p_po, p_cost, auth.uid()) RETURNING id INTO v_id;
  END IF;
  PERFORM public.inv_move(p_inv, v_id, 'receive', p_qty, p_reason, NULL, NULL, p_po);
  IF v_inv.register_required THEN
    PERFORM public.inv_register(p_inv, v_id, 'receipt', p_qty, v_no, p_reason, NULL, NULL, NULL, NULL);
  END IF;
  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION public.inv_require(TEXT[]), public.inv_name(UUID), public.inv_event(TEXT, TEXT, TEXT, JSONB),
  public.inv_move(UUID, UUID, TEXT, INTEGER, TEXT, UUID, UUID, UUID),
  public.inv_register(UUID, UUID, TEXT, INTEGER, TEXT, TEXT, UUID, UUID, UUID, UUID),
  public.inv_take_stock(UUID, INTEGER, TEXT, UUID, UUID, UUID, UUID),
  public.inv_add_batch(UUID, INTEGER, TEXT, DATE, UUID, NUMERIC, UUID, TEXT)
  FROM PUBLIC, anon, authenticated;

-- 9. Client-callable functions -------------------------------------------------------------------------------

-- Create (p_id null) or edit a drug. Stock is never set here: receive it.
CREATE OR REPLACE FUNCTION public.inv_save_drug(p_id UUID, p JSONB) RETURNS UUID AS $$
DECLARE
  v_uid UUID; v_role TEXT; v_row inventory%ROWTYPE; v_id UUID;
  v_name TEXT := btrim(COALESCE(p->>'name', ''));
  v_price NUMERIC := COALESCE(NULLIF(p->>'price', '')::numeric, 0);
  v_cost NUMERIC := NULLIF(p->>'cost_price', '')::numeric;
  v_min INTEGER := COALESCE(NULLIF(p->>'min_threshold', '')::integer, 0);
  v_reorder INTEGER := NULLIF(p->>'reorder_quantity', '')::integer;
  v_reg BOOLEAN := COALESCE((p->>'register_required')::boolean, false);
  v_class TEXT := NULLIF(p->>'control_class', '');
  v_balance INTEGER;
BEGIN
  v_uid := public.inv_require(ARRAY['pharmacist', 'admin']);
  v_role := public.get_user_role();
  IF v_name = '' THEN RAISE EXCEPTION 'Enter the drug name.'; END IF;
  IF v_price < 0 OR (v_cost IS NOT NULL AND v_cost < 0) THEN RAISE EXCEPTION 'Prices cannot be negative.'; END IF;
  IF v_min < 0 THEN RAISE EXCEPTION 'The reorder level cannot be negative.'; END IF;
  IF v_reorder IS NOT NULL AND v_reorder <= 0 THEN RAISE EXCEPTION 'The reorder quantity must be above zero.'; END IF;
  IF v_reg AND v_class IS NULL THEN RAISE EXCEPTION 'Choose a control class for a drug kept in the controlled register.'; END IF;
  IF NOT v_reg THEN v_class := NULL; END IF;

  IF p_id IS NULL THEN
    IF v_reg AND v_role <> 'admin' THEN RAISE EXCEPTION 'Only an administrator can put a drug in the controlled register.' USING ERRCODE = '42501'; END IF;
    BEGIN
      INSERT INTO inventory (drug_name, category, price, cost_price, min_threshold, reorder_quantity, unit, drug_type, manufacturer, generic_name,
                             indications, side_effects, suggested_dosage, register_required, control_class, is_controlled_drug, stock_level)
      VALUES (v_name, COALESCE(NULLIF(p->>'category', ''), 'General'), v_price, v_cost, v_min, v_reorder, COALESCE(NULLIF(p->>'unit', ''), 'unit'),
              NULLIF(p->>'drug_type', ''), NULLIF(p->>'manufacturer', ''), NULLIF(p->>'generic_name', ''),
              NULLIF(p->>'indications', ''), NULLIF(p->>'side_effects', ''), p->'suggested_dosage', v_reg, v_class, v_reg, 0)
      RETURNING id INTO v_id;
    EXCEPTION WHEN unique_violation THEN
      RAISE EXCEPTION 'A drug called "%" already exists.', v_name;
    END;
    PERFORM public.inv_event('drug', v_id::text, 'created', to_jsonb(p));
    RETURN v_id;
  END IF;

  SELECT * INTO v_row FROM inventory WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Drug not found.'; END IF;
  IF v_row.status = 'retired' THEN RAISE EXCEPTION 'This drug is retired. Restore it before editing.'; END IF;

  IF (v_reg IS DISTINCT FROM v_row.register_required OR v_class IS DISTINCT FROM v_row.control_class) AND v_role <> 'admin' THEN
    RAISE EXCEPTION 'Only an administrator can change whether a drug is in the controlled register.' USING ERRCODE = '42501';
  END IF;
  IF v_row.register_required AND NOT v_reg THEN
    SELECT COALESCE((SELECT balance_after FROM controlled_register WHERE inventory_id = p_id ORDER BY seq DESC LIMIT 1), 0) INTO v_balance;
    IF v_balance <> 0 THEN RAISE EXCEPTION 'The register balance is % . Account for all of it before taking this drug out of the register.', v_balance; END IF;
  END IF;

  BEGIN
    UPDATE inventory SET
      drug_name = v_name, category = COALESCE(NULLIF(p->>'category', ''), 'General'), price = v_price, cost_price = v_cost,
      min_threshold = v_min, reorder_quantity = v_reorder, unit = COALESCE(NULLIF(p->>'unit', ''), 'unit'),
      drug_type = NULLIF(p->>'drug_type', ''), manufacturer = NULLIF(p->>'manufacturer', ''), generic_name = NULLIF(p->>'generic_name', ''),
      indications = NULLIF(p->>'indications', ''), side_effects = NULLIF(p->>'side_effects', ''), suggested_dosage = p->'suggested_dosage',
      register_required = v_reg, control_class = v_class, is_controlled_drug = v_reg, updated_at = now()
    WHERE id = p_id;
  EXCEPTION WHEN unique_violation THEN
    RAISE EXCEPTION 'A drug called "%" already exists.', v_name;
  END;

  -- Joining the register: record what is on the shelf as the opening balance.
  IF v_reg AND NOT v_row.register_required AND v_row.stock_level > 0 THEN
    PERFORM public.inv_register(p_id, NULL, 'opening', v_row.stock_level, NULL, 'Opening balance when the drug joined the register', NULL, NULL, NULL, NULL);
  END IF;
  PERFORM public.inv_event('drug', p_id::text, 'edited', jsonb_build_object('before', to_jsonb(v_row), 'after', to_jsonb(p)));
  RETURN p_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION public.inv_retire_drug(p_id UUID, p_reason TEXT) RETURNS VOID AS $$
DECLARE v_row inventory%ROWTYPE; v_open INTEGER;
BEGIN
  PERFORM public.inv_require(ARRAY['pharmacist', 'admin']);
  IF btrim(COALESCE(p_reason, '')) = '' THEN RAISE EXCEPTION 'Give a reason for retiring this drug.'; END IF;
  SELECT * INTO v_row FROM inventory WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Drug not found.'; END IF;
  IF v_row.status = 'retired' THEN RAISE EXCEPTION 'Already retired.'; END IF;
  IF v_row.stock_level > 0 THEN RAISE EXCEPTION '% still has % in stock. Dispose of or use it first.', v_row.drug_name, v_row.stock_level; END IF;
  SELECT COUNT(*) INTO v_open FROM purchase_order_lines l JOIN purchase_orders o ON o.id = l.po_id
   WHERE l.inventory_id = p_id AND o.status IN ('draft', 'ordered', 'partially_received');
  IF v_open > 0 THEN RAISE EXCEPTION '% is on an open purchase order. Cancel or finish it first.', v_row.drug_name; END IF;
  UPDATE inventory SET status = 'retired', retired_at = now(), retired_by = auth.uid(), retire_reason = btrim(p_reason), updated_at = now() WHERE id = p_id;
  PERFORM public.inv_event('drug', p_id::text, 'retired', jsonb_build_object('reason', btrim(p_reason)));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION public.inv_restore_drug(p_id UUID) RETURNS VOID AS $$
BEGIN
  PERFORM public.inv_require(ARRAY['pharmacist', 'admin']);
  UPDATE inventory SET status = 'active', retired_at = NULL, retired_by = NULL, retire_reason = NULL, updated_at = now() WHERE id = p_id AND status = 'retired';
  IF NOT FOUND THEN RAISE EXCEPTION 'Drug not found or not retired.'; END IF;
  PERFORM public.inv_event('drug', p_id::text, 'restored', NULL);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Receive stock without a purchase order.
CREATE OR REPLACE FUNCTION public.inv_receive_stock(
  p_inventory_id UUID, p_quantity INTEGER, p_batch_number TEXT, p_expiry DATE, p_supplier_id UUID, p_unit_cost NUMERIC, p_notes TEXT
) RETURNS UUID AS $$
DECLARE v_id UUID;
BEGIN
  PERFORM public.inv_require(ARRAY['pharmacist', 'admin']);
  v_id := public.inv_add_batch(p_inventory_id, p_quantity, p_batch_number, p_expiry, p_supplier_id, p_unit_cost, NULL, COALESCE(NULLIF(btrim(p_notes), ''), 'Stock received'));
  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Dispose of, use, correct or find stock in one batch. A reason is always required.
CREATE OR REPLACE FUNCTION public.inv_adjust_stock(p_batch_id UUID, p_type TEXT, p_quantity INTEGER, p_reason TEXT) RETURNS VOID AS $$
DECLARE v_batch drug_batches%ROWTYPE; v_inv inventory%ROWTYPE; v_inv_id UUID; v_signed INTEGER; v_reg_type TEXT; v_mv TEXT;
BEGIN
  PERFORM public.inv_require(ARRAY['pharmacist', 'admin']);
  IF p_type NOT IN ('dispose', 'internal_use', 'decrease', 'increase') THEN RAISE EXCEPTION 'Unknown adjustment type.'; END IF;
  IF p_quantity IS NULL OR p_quantity <= 0 THEN RAISE EXCEPTION 'Quantity must be above zero.'; END IF;
  IF btrim(COALESCE(p_reason, '')) = '' THEN RAISE EXCEPTION 'A reason is required.'; END IF;

  SELECT inventory_id INTO v_inv_id FROM drug_batches WHERE id = p_batch_id;
  IF v_inv_id IS NULL THEN RAISE EXCEPTION 'Batch not found.'; END IF;
  SELECT * INTO v_inv FROM inventory WHERE id = v_inv_id FOR UPDATE;
  SELECT * INTO v_batch FROM drug_batches WHERE id = p_batch_id FOR UPDATE;

  v_signed := CASE WHEN p_type = 'increase' THEN p_quantity ELSE -p_quantity END;
  IF v_batch.stock_level + v_signed < 0 THEN
    RAISE EXCEPTION 'Batch % only has % left.', v_batch.batch_number, v_batch.stock_level;
  END IF;
  UPDATE drug_batches SET stock_level = stock_level + v_signed WHERE id = p_batch_id;
  v_mv := p_type;
  PERFORM public.inv_move(v_inv.id, p_batch_id, v_mv, v_signed, btrim(p_reason), NULL, NULL, NULL);

  IF v_inv.register_required THEN
    v_reg_type := CASE p_type WHEN 'dispose' THEN 'disposal' WHEN 'internal_use' THEN 'internal_use' ELSE 'adjustment' END;
    PERFORM public.inv_register(v_inv.id, p_batch_id, v_reg_type, v_signed, v_batch.batch_number, btrim(p_reason), NULL, NULL, NULL, NULL);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Dispense a visit. p_lines: [{prescription_id, action: 'dispense'|'skip', inventory_id?, quantity?, reason?}].
-- Everything happens in one transaction: either every line is applied, or nothing is.
CREATE OR REPLACE FUNCTION public.inv_dispense_visit(p_visit_id UUID, p_lines JSONB) RETURNS JSONB AS $$
DECLARE
  v_uid UUID; v_visit visits%ROWTYPE; e JSONB; rx prescriptions%ROWTYPE; v_action TEXT; v_inv UUID; v_qty INTEGER;
  v_dispensed INTEGER := 0; v_skipped INTEGER := 0; v_batches JSONB := '[]'::jsonb; v_used JSONB; v_pending INTEGER; v_reason TEXT;
BEGIN
  v_uid := public.inv_require(ARRAY['pharmacist', 'admin']);
  IF p_lines IS NULL OR jsonb_typeof(p_lines) <> 'array' THEN RAISE EXCEPTION 'Nothing to dispense.'; END IF;

  SELECT * INTO v_visit FROM visits WHERE id = p_visit_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Visit not found.'; END IF;
  IF v_visit.status NOT IN ('Awaiting Dispensation', 'Dispensing') THEN
    RAISE EXCEPTION 'This visit is not at the pharmacy (status: %).', v_visit.status;
  END IF;

  IF EXISTS (
    SELECT 1 FROM prescriptions p
     WHERE p.visit_id = p_visit_id AND p.dispensed_at IS NULL AND NOT p.skipped
       AND p.id NOT IN (SELECT (x->>'prescription_id')::uuid FROM jsonb_array_elements(p_lines) x)
  ) THEN
    RAISE EXCEPTION 'Every prescription needs a decision: dispense it or skip it.';
  END IF;

  PERFORM set_config('app.dispensing', 'on', true);
  FOR e IN SELECT * FROM jsonb_array_elements(p_lines) LOOP
    SELECT * INTO rx FROM prescriptions WHERE id = (e->>'prescription_id')::uuid AND visit_id = p_visit_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'A prescription line does not belong to this visit.'; END IF;
    IF rx.dispensed_at IS NOT NULL OR rx.skipped THEN CONTINUE; END IF;     -- already decided (safe to repeat)

    v_action := e->>'action';
    v_reason := NULLIF(btrim(COALESCE(e->>'reason', '')), '');
    IF v_action = 'skip' THEN
      IF v_reason IS NULL THEN RAISE EXCEPTION 'Give a reason for skipping %.', rx.drug_name; END IF;
      UPDATE prescriptions SET skipped = true, skip_reason = v_reason, dispensed_by = v_uid WHERE id = rx.id;
      v_skipped := v_skipped + 1;
      CONTINUE;
    ELSIF v_action <> 'dispense' THEN
      RAISE EXCEPTION 'Unknown action for %.', rx.drug_name;
    END IF;

    v_inv := COALESCE(rx.inventory_id, NULLIF(e->>'inventory_id', '')::uuid);
    IF v_inv IS NULL THEN RAISE EXCEPTION 'Choose the stock item for %.', rx.drug_name; END IF;
    v_qty := COALESCE(NULLIF(e->>'quantity', '')::integer, rx.quantity);
    IF v_qty IS NULL OR v_qty <= 0 OR v_qty > rx.quantity THEN
      RAISE EXCEPTION 'Quantity for % must be between 1 and the prescribed %.', rx.drug_name, rx.quantity;
    END IF;

    -- A controlled drug needs a recorded prescriber.
    IF EXISTS (SELECT 1 FROM inventory WHERE id = v_inv AND register_required) AND v_visit.signed_off_by IS NULL THEN
      RAISE EXCEPTION 'This visit has no signed-off prescriber, which a controlled-drug entry needs.';
    END IF;
    v_used := public.inv_take_stock(v_inv, v_qty, 'Dispensed to patient', rx.id, p_visit_id, v_visit.patient_id, v_visit.signed_off_by);
    UPDATE prescriptions SET inventory_id = v_inv, dispensed_at = now(), dispensed_by = v_uid, dispensed_quantity = v_qty WHERE id = rx.id;
    v_dispensed := v_dispensed + 1;
    v_batches := v_batches || jsonb_build_object('prescription_id', rx.id, 'batches', v_used);
  END LOOP;

  SELECT COUNT(*) INTO v_pending FROM controlled_register r
   WHERE r.visit_id = p_visit_id AND NOT EXISTS (SELECT 1 FROM controlled_register_signatures s WHERE s.entry_id = r.id);
  PERFORM set_config('app.dispensing', 'off', true);
  PERFORM public.inv_event('dispense', p_visit_id::text, 'dispensed', jsonb_build_object('dispensed', v_dispensed, 'skipped', v_skipped, 'pending_signatures', v_pending));
  RETURN jsonb_build_object('dispensed', v_dispensed, 'skipped', v_skipped, 'pending_signatures', v_pending, 'batches', v_batches);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- The second signature on a controlled-drug register entry.
CREATE OR REPLACE FUNCTION public.inv_sign_register_entry(p_entry_id UUID, p_note TEXT) RETURNS VOID AS $$
DECLARE v_uid UUID; r controlled_register%ROWTYPE;
BEGIN
  v_uid := public.inv_require(ARRAY['pharmacist', 'admin']);
  SELECT * INTO r FROM controlled_register WHERE id = p_entry_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Register entry not found.'; END IF;
  IF r.performed_by = v_uid THEN RAISE EXCEPTION 'A different person must give the second signature.' USING ERRCODE = '42501'; END IF;
  IF EXISTS (SELECT 1 FROM controlled_register_signatures WHERE entry_id = p_entry_id) THEN RAISE EXCEPTION 'Already signed.'; END IF;
  INSERT INTO controlled_register_signatures (entry_id, signed_by, signed_by_name, note)
  VALUES (p_entry_id, v_uid, public.inv_name(v_uid), NULLIF(btrim(COALESCE(p_note, '')), ''));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Purchase orders -------------------------------------------------------------------------------------------
-- p_lines: [{inventory_id, quantity, unit_cost?}]. Create when p_po_id is null; edit only while a draft.
CREATE OR REPLACE FUNCTION public.inv_save_po(p_po_id UUID, p_supplier_id UUID, p_expected DATE, p_notes TEXT, p_lines JSONB) RETURNS UUID AS $$
DECLARE v_uid UUID; v_id UUID := p_po_id; v_po purchase_orders%ROWTYPE; e JSONB; v_n INTEGER := 0;
BEGIN
  v_uid := public.inv_require(ARRAY['pharmacist', 'admin']);
  IF NOT EXISTS (SELECT 1 FROM suppliers WHERE id = p_supplier_id AND active) THEN RAISE EXCEPTION 'Choose an active supplier.'; END IF;
  IF p_lines IS NULL OR jsonb_typeof(p_lines) <> 'array' OR jsonb_array_length(p_lines) = 0 THEN RAISE EXCEPTION 'Add at least one item.'; END IF;

  IF v_id IS NULL THEN
    INSERT INTO purchase_orders (po_number, supplier_id, expected_date, notes, created_by)
    VALUES ('PO-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('po_number_seq')::text, 4, '0'), p_supplier_id, p_expected, NULLIF(btrim(COALESCE(p_notes, '')), ''), v_uid)
    RETURNING id INTO v_id;
  ELSE
    SELECT * INTO v_po FROM purchase_orders WHERE id = v_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Purchase order not found.'; END IF;
    IF v_po.status <> 'draft' THEN RAISE EXCEPTION 'Only a draft purchase order can be edited (this one is %).', v_po.status; END IF;
    UPDATE purchase_orders SET supplier_id = p_supplier_id, expected_date = p_expected, notes = NULLIF(btrim(COALESCE(p_notes, '')), '') WHERE id = v_id;
    DELETE FROM purchase_order_lines WHERE po_id = v_id;
  END IF;

  FOR e IN SELECT * FROM jsonb_array_elements(p_lines) LOOP
    IF NOT EXISTS (SELECT 1 FROM inventory WHERE id = (e->>'inventory_id')::uuid AND status = 'active') THEN
      RAISE EXCEPTION 'An item on the order is missing or retired.';
    END IF;
    IF COALESCE((e->>'quantity')::integer, 0) <= 0 THEN RAISE EXCEPTION 'Every quantity must be above zero.'; END IF;
    BEGIN
      INSERT INTO purchase_order_lines (po_id, inventory_id, quantity_ordered, unit_cost)
      VALUES (v_id, (e->>'inventory_id')::uuid, (e->>'quantity')::integer, NULLIF(e->>'unit_cost', '')::numeric);
    EXCEPTION WHEN unique_violation THEN
      RAISE EXCEPTION 'The same item is on the order twice.';
    END;
    v_n := v_n + 1;
  END LOOP;
  PERFORM public.inv_event('purchase_order', v_id::text, CASE WHEN p_po_id IS NULL THEN 'created' ELSE 'edited' END, jsonb_build_object('lines', v_n));
  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION public.inv_set_po_status(p_po_id UUID, p_status TEXT, p_reason TEXT) RETURNS VOID AS $$
DECLARE v_uid UUID; v_po purchase_orders%ROWTYPE;
BEGIN
  v_uid := public.inv_require(ARRAY['pharmacist', 'admin']);
  SELECT * INTO v_po FROM purchase_orders WHERE id = p_po_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Purchase order not found.'; END IF;

  IF p_status = 'ordered' THEN
    IF v_po.status <> 'draft' THEN RAISE EXCEPTION 'Only a draft can be marked as ordered.'; END IF;
    IF NOT EXISTS (SELECT 1 FROM purchase_order_lines WHERE po_id = p_po_id) THEN RAISE EXCEPTION 'The order has no items.'; END IF;
    UPDATE purchase_orders SET status = 'ordered', ordered_by = v_uid, ordered_at = now() WHERE id = p_po_id;
  ELSIF p_status = 'cancelled' THEN
    IF v_po.status NOT IN ('draft', 'ordered') THEN RAISE EXCEPTION 'A % order cannot be cancelled.', v_po.status; END IF;
    IF btrim(COALESCE(p_reason, '')) = '' THEN RAISE EXCEPTION 'Give a reason for cancelling.'; END IF;
    UPDATE purchase_orders SET status = 'cancelled', cancelled_by = v_uid, cancelled_at = now(), cancel_reason = btrim(p_reason) WHERE id = p_po_id;
  ELSE
    RAISE EXCEPTION 'Unknown status.';
  END IF;
  PERFORM public.inv_event('purchase_order', p_po_id::text, p_status, jsonb_build_object('reason', NULLIF(btrim(COALESCE(p_reason, '')), '')));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Goods received against an order. p_lines: [{line_id, quantity, batch_number, expiry_date}].
CREATE OR REPLACE FUNCTION public.inv_receive_po(p_po_id UUID, p_lines JSONB) RETURNS JSONB AS $$
DECLARE v_uid UUID; v_po purchase_orders%ROWTYPE; e JSONB; l purchase_order_lines%ROWTYPE; v_qty INTEGER; v_count INTEGER := 0; v_open INTEGER; v_status TEXT;
BEGIN
  v_uid := public.inv_require(ARRAY['pharmacist', 'admin']);
  SELECT * INTO v_po FROM purchase_orders WHERE id = p_po_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Purchase order not found.'; END IF;
  IF v_po.status NOT IN ('ordered', 'partially_received') THEN RAISE EXCEPTION 'Goods can only be received against an order that has been placed (this one is %).', v_po.status; END IF;
  IF p_lines IS NULL OR jsonb_typeof(p_lines) <> 'array' OR jsonb_array_length(p_lines) = 0 THEN RAISE EXCEPTION 'Enter what was received.'; END IF;

  FOR e IN SELECT * FROM jsonb_array_elements(p_lines) LOOP
    SELECT * INTO l FROM purchase_order_lines WHERE id = (e->>'line_id')::uuid AND po_id = p_po_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'A line does not belong to this order.'; END IF;
    v_qty := COALESCE((e->>'quantity')::integer, 0);
    IF v_qty <= 0 THEN CONTINUE; END IF;
    IF v_qty > l.quantity_ordered - l.quantity_received THEN
      RAISE EXCEPTION 'More received (%) than is still outstanding (%) on this line.', v_qty, l.quantity_ordered - l.quantity_received;
    END IF;
    PERFORM public.inv_add_batch(l.inventory_id, v_qty, e->>'batch_number', NULLIF(e->>'expiry_date', '')::date, v_po.supplier_id, l.unit_cost, p_po_id,
                                 'Received against ' || v_po.po_number);
    UPDATE purchase_order_lines SET quantity_received = quantity_received + v_qty WHERE id = l.id;
    v_count := v_count + 1;
  END LOOP;
  IF v_count = 0 THEN RAISE EXCEPTION 'Enter a quantity for at least one line.'; END IF;

  SELECT COUNT(*) INTO v_open FROM purchase_order_lines WHERE po_id = p_po_id AND quantity_received < quantity_ordered;
  v_status := CASE WHEN v_open = 0 THEN 'received' ELSE 'partially_received' END;
  UPDATE purchase_orders SET status = v_status WHERE id = p_po_id;
  PERFORM public.inv_event('purchase_order', p_po_id::text, 'received', jsonb_build_object('lines', v_count, 'status', v_status));
  RETURN jsonb_build_object('status', v_status, 'lines', v_count);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION
  public.inv_save_drug(UUID, JSONB), public.inv_retire_drug(UUID, TEXT), public.inv_restore_drug(UUID),
  public.inv_receive_stock(UUID, INTEGER, TEXT, DATE, UUID, NUMERIC, TEXT), public.inv_adjust_stock(UUID, TEXT, INTEGER, TEXT),
  public.inv_dispense_visit(UUID, JSONB), public.inv_sign_register_entry(UUID, TEXT),
  public.inv_save_po(UUID, UUID, DATE, TEXT, JSONB), public.inv_set_po_status(UUID, TEXT, TEXT), public.inv_receive_po(UUID, JSONB)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION
  public.inv_save_drug(UUID, JSONB), public.inv_retire_drug(UUID, TEXT), public.inv_restore_drug(UUID),
  public.inv_receive_stock(UUID, INTEGER, TEXT, DATE, UUID, NUMERIC, TEXT), public.inv_adjust_stock(UUID, TEXT, INTEGER, TEXT),
  public.inv_dispense_visit(UUID, JSONB), public.inv_sign_register_entry(UUID, TEXT),
  public.inv_save_po(UUID, UUID, DATE, TEXT, JSONB), public.inv_set_po_status(UUID, TEXT, TEXT), public.inv_receive_po(UUID, JSONB)
  TO authenticated;

-- 10. Guards on prescriptions and visits -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.guard_prescription() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.dispensed_at IS NOT NULL OR OLD.skipped THEN
      RAISE EXCEPTION 'A dispensed prescription is part of the stock record and cannot be removed.' USING ERRCODE = '42501';
    END IF;
    RETURN OLD;
  END IF;
  IF TG_OP = 'UPDATE' THEN
    IF OLD.dispensed_at IS NOT NULL OR OLD.skipped THEN
      RAISE EXCEPTION 'A dispensed prescription cannot be changed.' USING ERRCODE = '42501';
    END IF;
    IF (NEW.dispensed_at IS DISTINCT FROM OLD.dispensed_at OR NEW.skipped IS DISTINCT FROM OLD.skipped OR NEW.dispensed_by IS DISTINCT FROM OLD.dispensed_by
        OR NEW.dispensed_quantity IS DISTINCT FROM OLD.dispensed_quantity OR NEW.skip_reason IS DISTINCT FROM OLD.skip_reason)
       AND COALESCE(current_setting('app.dispensing', true), 'off') <> 'on' THEN
      RAISE EXCEPTION 'Prescriptions can only be marked dispensed by the dispensing function.' USING ERRCODE = '42501';
    END IF;
  END IF;
  IF TG_OP = 'INSERT' AND (NEW.dispensed_at IS NOT NULL OR NEW.skipped) THEN
    RAISE EXCEPTION 'A new prescription cannot start out dispensed.' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public, pg_temp;
REVOKE ALL ON FUNCTION public.guard_prescription() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS prescriptions_guard ON prescriptions;
CREATE TRIGGER prescriptions_guard BEFORE INSERT OR UPDATE OR DELETE ON prescriptions
  FOR EACH ROW EXECUTE FUNCTION public.guard_prescription();

-- A visit cannot leave the pharmacy while a prescription is undecided or a controlled entry lacks its second signature.
CREATE OR REPLACE FUNCTION public.guard_visit_leaves_pharmacy() RETURNS trigger AS $$
BEGIN
  IF OLD.status IN ('Awaiting Dispensation', 'Dispensing') AND NEW.status IN ('Awaiting Billing', 'Paid') THEN
    IF EXISTS (SELECT 1 FROM prescriptions WHERE visit_id = NEW.id AND dispensed_at IS NULL AND NOT skipped) THEN
      RAISE EXCEPTION 'This visit still has prescriptions that have not been dispensed or skipped.' USING ERRCODE = '42501';
    END IF;
    IF EXISTS (SELECT 1 FROM controlled_register r WHERE r.visit_id = NEW.id AND NOT EXISTS (SELECT 1 FROM controlled_register_signatures s WHERE s.entry_id = r.id)) THEN
      RAISE EXCEPTION 'A controlled drug for this visit is waiting for its second signature.' USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public, pg_temp;
REVOKE ALL ON FUNCTION public.guard_visit_leaves_pharmacy() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS visits_leave_pharmacy_guard ON visits;
CREATE TRIGGER visits_leave_pharmacy_guard BEFORE UPDATE OF status ON visits
  FOR EACH ROW EXECUTE FUNCTION public.guard_visit_leaves_pharmacy();

-- 11. Row level security: read-only from the client, except suppliers and settings ----------------------------------
DROP POLICY IF EXISTS "Pharmacists can update inventory" ON inventory;
DROP POLICY IF EXISTS "Pharmacist and Admin can manage drug batches" ON drug_batches;
DROP POLICY IF EXISTS "Pharmacist and Admin can manage inventory logs" ON inventory_logs;

ALTER TABLE inventory_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE controlled_register ENABLE ROW LEVEL SECURITY;
ALTER TABLE controlled_register_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Signed-in read inventory settings" ON inventory_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin edits inventory settings" ON inventory_settings FOR UPDATE TO authenticated
  USING (public.get_user_role() = 'admin') WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "Pharmacy and admin read suppliers" ON suppliers FOR SELECT TO authenticated USING (public.get_user_role() IN ('pharmacist', 'admin'));
CREATE POLICY "Pharmacy and admin add suppliers" ON suppliers FOR INSERT TO authenticated WITH CHECK (public.get_user_role() IN ('pharmacist', 'admin'));
CREATE POLICY "Pharmacy and admin edit suppliers" ON suppliers FOR UPDATE TO authenticated
  USING (public.get_user_role() IN ('pharmacist', 'admin')) WITH CHECK (public.get_user_role() IN ('pharmacist', 'admin'));

CREATE POLICY "Pharmacy and admin read purchase orders" ON purchase_orders FOR SELECT TO authenticated USING (public.get_user_role() IN ('pharmacist', 'admin'));
CREATE POLICY "Pharmacy and admin read purchase order lines" ON purchase_order_lines FOR SELECT TO authenticated USING (public.get_user_role() IN ('pharmacist', 'admin'));

CREATE POLICY "Signed-in read stock movements" ON stock_movements FOR SELECT TO authenticated USING (true);

CREATE POLICY "Pharmacy and admin read controlled register" ON controlled_register FOR SELECT TO authenticated USING (public.get_user_role() IN ('pharmacist', 'admin'));
CREATE POLICY "Pharmacy and admin read register signatures" ON controlled_register_signatures FOR SELECT TO authenticated USING (public.get_user_role() IN ('pharmacist', 'admin'));
CREATE POLICY "Pharmacy and admin read inventory events" ON inventory_events FOR SELECT TO authenticated USING (public.get_user_role() IN ('pharmacist', 'admin'));
