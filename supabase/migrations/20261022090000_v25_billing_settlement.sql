-- v25: Atomic billing settlement
--
-- Settling a visit used to be two separate client writes (mark the visit Paid, then insert a transaction),
-- so a failure between them left a paid visit with no ledger row. billing_settle_visit does both in one
-- database transaction, checks the figures, and refuses to settle a visit twice. Marking a panel claim as
-- paid now records who received what reference on which day, instead of flipping a flag.
-- Both functions run as the caller, so existing RLS (admin and clinic-assistant on transactions) still applies.

ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS payment_reference TEXT,       -- card payment intent id, or the e-wallet / bank reference
  ADD COLUMN IF NOT EXISTS recorded_by UUID DEFAULT auth.uid(),
  ADD COLUMN IF NOT EXISTS claim_received_on DATE,       -- when the panel's payment arrived
  ADD COLUMN IF NOT EXISTS claim_reference TEXT,         -- the panel's remittance / statement reference
  ADD COLUMN IF NOT EXISTS claim_marked_by UUID;

CREATE OR REPLACE FUNCTION billing_settle_visit(
  p_visit_id UUID,
  p_payment_method TEXT,
  p_paid_amount NUMERIC,
  p_panel_claimed NUMERIC,
  p_total_bill NUMERIC,
  p_gl_number TEXT DEFAULT NULL,
  p_payment_reference TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_status TEXT;
  v_patient UUID;
  v_trx UUID;
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

  SELECT status, patient_id INTO v_status, v_patient FROM visits WHERE id = p_visit_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Visit not found.';
  END IF;
  IF v_status = 'Paid' THEN
    RAISE EXCEPTION 'This visit has already been paid.';
  END IF;
  IF v_status <> 'Awaiting Billing' THEN
    RAISE EXCEPTION 'This visit is not ready for billing.';
  END IF;

  UPDATE visits SET
    status = 'Paid',
    payment_method = p_payment_method,
    paid_amount = p_paid_amount,
    panel_claimed = p_panel_claimed,
    total_bill = p_total_bill,
    gl_number = CASE WHEN p_panel_claimed > 0 THEN btrim(p_gl_number) ELSE NULL END,
    updated_at = now()
  WHERE id = p_visit_id;

  INSERT INTO transactions (patient_id, visit_id, payment_method, paid_amount, panel_claimed, gl_number, status, payment_reference)
  VALUES (
    v_patient, p_visit_id, p_payment_method, p_paid_amount, p_panel_claimed,
    CASE WHEN p_panel_claimed > 0 THEN btrim(p_gl_number) ELSE NULL END,
    CASE WHEN p_panel_claimed > 0 THEN 'Pending Claim' ELSE 'Completed' END,
    nullif(btrim(p_payment_reference), '')
  )
  RETURNING id INTO v_trx;

  RETURN v_trx;
END;
$$;

CREATE OR REPLACE FUNCTION billing_mark_claim_paid(
  p_transaction_id UUID,
  p_reference TEXT,
  p_received_on DATE
) RETURNS VOID
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_status TEXT;
BEGIN
  IF get_user_role() IS NULL OR get_user_role() NOT IN ('admin', 'clinic-assistant') THEN
    RAISE EXCEPTION 'You are not allowed to update claims.' USING ERRCODE = '42501';
  END IF;
  IF coalesce(btrim(p_reference), '') = '' THEN
    RAISE EXCEPTION 'Enter the panel''s payment or statement reference.';
  END IF;
  IF p_received_on IS NULL OR p_received_on > (now() AT TIME ZONE 'Asia/Kuala_Lumpur')::date THEN
    RAISE EXCEPTION 'Enter the date the payment was received (not in the future).';
  END IF;

  SELECT status INTO v_status FROM transactions WHERE id = p_transaction_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Claim not found.';
  END IF;
  IF v_status <> 'Pending Claim' THEN
    RAISE EXCEPTION 'This claim is not awaiting payment.';
  END IF;

  UPDATE transactions SET
    status = 'Claim Paid',
    claim_reference = btrim(p_reference),
    claim_received_on = p_received_on,
    claim_marked_by = auth.uid()
  WHERE id = p_transaction_id;
END;
$$;

REVOKE ALL ON FUNCTION billing_settle_visit(UUID, TEXT, NUMERIC, NUMERIC, NUMERIC, TEXT, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION billing_mark_claim_paid(UUID, TEXT, DATE) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION billing_settle_visit(UUID, TEXT, NUMERIC, NUMERIC, NUMERIC, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION billing_mark_claim_paid(UUID, TEXT, DATE) TO authenticated;
