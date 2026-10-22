-- v28: Receipts
--
-- Each payment now keeps what a receipt needs, so a reprint always matches what was issued:
--   receipt_no    a sequential number (RC-2026-000001), gapless: the counter is bumped inside the same database
--                 transaction as the payment, so a payment that fails does not use up a number
--   bill          the itemised bill as charged (lines, discount, SST, total)
--   patient_name  the patient's name at the time, kept even if the patient record is later removed
--   panel_name    which panel the claim is against
-- Payments made before this migration have no number or itemised bill; a reprint of those is a summary copy.
--
-- billing_settle_visit now runs with the owner's rights (it checks the caller's role itself, like the v13 report
-- functions) because the counter table has no RLS policies: nothing else can read or change it.

ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS receipt_no TEXT,
  ADD COLUMN IF NOT EXISTS patient_name TEXT,
  ADD COLUMN IF NOT EXISTS panel_name TEXT,
  ADD COLUMN IF NOT EXISTS bill JSONB;

CREATE UNIQUE INDEX IF NOT EXISTS transactions_receipt_no_key ON transactions (receipt_no) WHERE receipt_no IS NOT NULL;

CREATE TABLE IF NOT EXISTS receipt_counters (
  year INTEGER PRIMARY KEY,
  last_no INTEGER NOT NULL
);
ALTER TABLE receipt_counters ENABLE ROW LEVEL SECURITY;

-- Names for payments that already exist.
UPDATE transactions t SET patient_name = p.full_name
FROM patients p
WHERE p.id = t.patient_id AND t.patient_name IS NULL;

DROP FUNCTION IF EXISTS billing_settle_visit(UUID, TEXT, NUMERIC, NUMERIC, NUMERIC, TEXT, TEXT);

CREATE OR REPLACE FUNCTION billing_settle_visit(
  p_visit_id UUID,
  p_payment_method TEXT,
  p_paid_amount NUMERIC,
  p_panel_claimed NUMERIC,
  p_total_bill NUMERIC,
  p_gl_number TEXT DEFAULT NULL,
  p_payment_reference TEXT DEFAULT NULL,
  p_bill JSONB DEFAULT NULL,
  p_panel_name TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_status TEXT;
  v_patient UUID;
  v_name TEXT;
  v_trx UUID;
  v_year INTEGER := extract(year FROM (now() AT TIME ZONE 'Asia/Kuala_Lumpur'))::int;
  v_n INTEGER;
  v_receipt TEXT;
BEGIN
  IF get_user_role() IS NULL OR get_user_role() NOT IN ('admin', 'clinic-assistant') THEN
    RAISE EXCEPTION 'You are not allowed to take payments.' USING ERRCODE = '42501';
  END IF;

  IF p_payment_method NOT IN ('Cash', 'Credit Card', 'e-Wallet', 'Panel') THEN
    RAISE EXCEPTION 'Unknown payment method.';
  END IF;
  IF p_paid_amount IS NULL OR p_panel_claimed IS NULL OR p_total_bill IS NULL
     OR p_paid_amount < 0 OR p_panel_claimed < 0 OR p_total_bill < 0 THEN
    RAISE EXCEPTION 'Amounts must be zero or more.';
  END IF;
  IF abs((p_paid_amount + p_panel_claimed) - p_total_bill) > 0.01 THEN
    RAISE EXCEPTION 'The amounts do not add up to the bill total.';
  END IF;
  IF p_panel_claimed > 0 AND coalesce(btrim(p_gl_number), '') = '' THEN
    RAISE EXCEPTION 'A panel claim needs a guarantee letter reference.';
  END IF;
  IF p_payment_method = 'Panel' AND p_panel_claimed <= 0 THEN
    RAISE EXCEPTION 'A panel payment needs a claimed amount.';
  END IF;
  IF p_payment_method IN ('Credit Card', 'e-Wallet') AND coalesce(btrim(p_payment_reference), '') = '' THEN
    RAISE EXCEPTION 'A card or e-wallet payment needs a payment reference.';
  END IF;
  IF p_bill IS NOT NULL THEN
    IF jsonb_typeof(p_bill) <> 'object' OR jsonb_typeof(p_bill->'lines') <> 'array'
       OR abs(coalesce((p_bill->>'grandTotal')::numeric, -1) - p_total_bill) > 0.01 THEN
      RAISE EXCEPTION 'The itemised bill does not match the total.';
    END IF;
  END IF;

  SELECT v.status, v.patient_id INTO v_status, v_patient FROM visits v WHERE v.id = p_visit_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Visit not found.';
  END IF;
  IF v_status = 'Paid' THEN
    RAISE EXCEPTION 'This visit has already been paid.';
  END IF;
  IF v_status <> 'Awaiting Billing' THEN
    RAISE EXCEPTION 'This visit is not ready for billing.';
  END IF;

  SELECT full_name INTO v_name FROM patients WHERE id = v_patient;

  -- The row lock on the counter serialises concurrent payments; a rollback also undoes the increment.
  INSERT INTO receipt_counters (year, last_no) VALUES (v_year, 1)
  ON CONFLICT (year) DO UPDATE SET last_no = receipt_counters.last_no + 1
  RETURNING last_no INTO v_n;
  v_receipt := 'RC-' || v_year || '-' || lpad(v_n::text, 6, '0');

  UPDATE visits SET
    status = 'Paid',
    payment_method = p_payment_method,
    paid_amount = p_paid_amount,
    panel_claimed = p_panel_claimed,
    total_bill = p_total_bill,
    gl_number = CASE WHEN p_panel_claimed > 0 THEN btrim(p_gl_number) ELSE NULL END,
    updated_at = now()
  WHERE id = p_visit_id;

  INSERT INTO transactions (patient_id, visit_id, payment_method, paid_amount, panel_claimed, gl_number, status,
                            payment_reference, receipt_no, patient_name, panel_name, bill)
  VALUES (
    v_patient, p_visit_id, p_payment_method, p_paid_amount, p_panel_claimed,
    CASE WHEN p_panel_claimed > 0 THEN btrim(p_gl_number) ELSE NULL END,
    CASE WHEN p_panel_claimed > 0 THEN 'Pending Claim' ELSE 'Completed' END,
    nullif(btrim(p_payment_reference), ''), v_receipt, v_name,
    CASE WHEN p_panel_claimed > 0 THEN nullif(btrim(p_panel_name), '') ELSE NULL END,
    p_bill
  )
  RETURNING id INTO v_trx;

  RETURN jsonb_build_object('transaction_id', v_trx, 'receipt_no', v_receipt);
END;
$$;

REVOKE ALL ON FUNCTION billing_settle_visit(UUID, TEXT, NUMERIC, NUMERIC, NUMERIC, TEXT, TEXT, JSONB, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION billing_settle_visit(UUID, TEXT, NUMERIC, NUMERIC, NUMERIC, TEXT, TEXT, JSONB, TEXT) TO authenticated;
