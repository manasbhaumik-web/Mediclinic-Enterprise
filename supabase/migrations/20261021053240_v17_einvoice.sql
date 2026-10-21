-- v17: LHDN MyInvois e-Invoicing.
--
-- The e-invoice connection reuses integration_connections / integration_secrets (type 'einvoice'):
--   config  = supplier details, client id, submission mode (non-secret)
--   secret  = the MyInvois client secret (service role only, never readable from the client)
--
-- einvoices holds one row per invoice or consolidated invoice. Admins can read it; only edge functions
-- (service role) change status after creation. Cashiers create rows through record_einvoice().

-- 1. Allow the new connection type and OAuth client-credentials auth.
DO $$
DECLARE c RECORD;
BEGIN
  FOR c IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'public.integration_connections'::regclass AND contype = 'c'
      AND (pg_get_constraintdef(oid) ILIKE '%fhir%' OR pg_get_constraintdef(oid) ILIKE '%bearer%')
  LOOP
    EXECUTE format('ALTER TABLE public.integration_connections DROP CONSTRAINT %I', c.conname);
  END LOOP;
END $$;

ALTER TABLE integration_connections ADD CONSTRAINT integration_connections_type_check
  CHECK (type IN ('fhir', 'tpa', 'lis', 'erx', 'wearable', 'device', 'ledger', 'einvoice'));
ALTER TABLE integration_connections ADD CONSTRAINT integration_connections_auth_type_check
  CHECK (auth_type IN ('none', 'bearer', 'basic', 'api_key_header', 'oauth_client_credentials'));

-- 2. Invoice numbering (gaps are possible and acceptable; numbers are never reused).
CREATE SEQUENCE IF NOT EXISTS einvoice_number_seq;

-- 3. Invoices.
CREATE TABLE IF NOT EXISTS einvoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_number TEXT NOT NULL UNIQUE,
  kind TEXT NOT NULL DEFAULT 'invoice' CHECK (kind IN ('invoice', 'consolidated')),
  visit_id UUID REFERENCES visits(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'needs_buyer', 'submitted', 'valid', 'invalid', 'cancelled', 'error', 'consolidated')),
  buyer_type TEXT NOT NULL DEFAULT 'general_public' CHECK (buyer_type IN ('general_public', 'individual', 'business')),
  buyer JSONB NOT NULL DEFAULT '{}'::jsonb,          -- name, tin, idType, idValue, address, phone, email
  snapshot JSONB NOT NULL,                           -- invoice lines and totals as billed
  total_payable NUMERIC(14, 2) NOT NULL,
  tax_total NUMERIC(14, 2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'MYR',
  period_month DATE,                                 -- first day of the month, consolidated invoices only
  consolidated_into UUID REFERENCES einvoices(id) ON DELETE SET NULL,
  submission_uid TEXT,
  lhdn_uuid TEXT,
  long_id TEXT,
  validation_errors JSONB,
  document_hash TEXT,
  last_error TEXT,
  attempts INTEGER NOT NULL DEFAULT 0,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  submitted_at TIMESTAMPTZ,
  validated_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancel_reason TEXT,
  created_by UUID
);
CREATE UNIQUE INDEX IF NOT EXISTS einvoices_one_per_visit ON einvoices (visit_id) WHERE kind = 'invoice' AND visit_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS einvoices_status_idx ON einvoices (status, issued_at DESC);
CREATE INDEX IF NOT EXISTS einvoices_consolidated_into_idx ON einvoices (consolidated_into);

ALTER TABLE einvoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read e-invoices" ON einvoices
  FOR SELECT TO authenticated USING (public.get_user_role() = 'admin');

-- 4. Called by the cashier when a payment is settled. Does nothing unless an e-invoice connection is enabled.
CREATE OR REPLACE FUNCTION public.record_einvoice(p_visit_id UUID, p_snapshot JSONB, p_buyer JSONB)
RETURNS UUID AS $$
DECLARE
  new_id UUID;
  v_total NUMERIC(14, 2);
  v_tax NUMERIC(14, 2);
  v_buyer_type TEXT;
  v_status TEXT;
BEGIN
  IF auth.uid() IS NULL OR public.get_user_role() NOT IN ('clinic-assistant', 'admin') THEN
    RAISE EXCEPTION 'Not authorised';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM integration_connections WHERE type = 'einvoice' AND enabled) THEN
    RETURN NULL;
  END IF;

  v_total := round(COALESCE((p_snapshot->>'grandTotal')::numeric, 0), 2);
  v_tax := round(COALESCE((p_snapshot->>'taxAmount')::numeric, 0), 2);
  IF v_total <= 0 THEN
    RETURN NULL;   -- nothing billed, nothing to invoice
  END IF;

  v_buyer_type := COALESCE(NULLIF(p_buyer->>'type', ''), 'general_public');
  IF v_buyer_type NOT IN ('general_public', 'individual', 'business') THEN
    RAISE EXCEPTION 'Invalid buyer type';
  END IF;
  -- A business or named individual must have a TIN before the invoice can be submitted.
  v_status := CASE WHEN v_buyer_type = 'general_public' OR COALESCE(p_buyer->>'tin', '') <> '' THEN 'pending' ELSE 'needs_buyer' END;

  INSERT INTO einvoices (invoice_number, visit_id, status, buyer_type, buyer, snapshot, total_payable, tax_total, created_by)
  VALUES (
    'INV-' || to_char(now() AT TIME ZONE 'Asia/Kuala_Lumpur', 'YYYY') || '-' || lpad(nextval('einvoice_number_seq')::text, 6, '0'),
    p_visit_id, v_status, v_buyer_type, COALESCE(p_buyer, '{}'::jsonb) - 'type', p_snapshot, v_total, v_tax, auth.uid()
  )
  ON CONFLICT (visit_id) WHERE kind = 'invoice' AND visit_id IS NOT NULL DO NOTHING
  RETURNING id INTO new_id;

  RETURN new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION public.record_einvoice(UUID, JSONB, JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_einvoice(UUID, JSONB, JSONB) TO authenticated;
