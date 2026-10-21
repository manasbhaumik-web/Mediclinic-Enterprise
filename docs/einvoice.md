# e-Invoice (LHDN MyInvois)

Admin console → **Finance → e-Invoice (LHDN)**. Visible to `admin` only (not HR).

## Status: not yet validated against LHDN
The document builder and API client follow LHDN's published MyInvois structure as understood by the author. **They have not been run against the MyInvois pre-production (sandbox) environment.** Treat go-live as blocked until, at minimum:
1. a sample invoice and a consolidated invoice validate in sandbox;
2. your tax adviser confirms the TIN, MSIC code, tax category (service tax / sales tax / not applicable) and item classification code;
3. you have confirmed whether your submissions must be digitally signed (document version 1.1). The builder produces unsigned version 1.0.

Dates and thresholds for your phase are summarised in the project discussion; confirm them with LHDN or your tax adviser.

## How it works
1. **Setup (Admin → e-Invoice → Setup):** supplier details (TIN, BRN, MSIC, address), MyInvois client ID and secret, environment (sandbox/live), submission mode, tax category. The client secret is write-only and stored server-side in `integration_secrets`. e-Invoicing cannot be switched on until the checklist passes.
2. **Recording:** when a cashier settles a payment *and e-Invoicing is ON*, the bill (lines, discount, tax, total) is recorded as an e-invoice via `record_einvoice()`. While OFF nothing is recorded.
   - Walk-in self-pay patients → buyer is **General Public** (TIN `EI00000000010`).
   - Panel / TPA claims → buyer is a **business**; the invoice waits as *Needs buyer details* until an admin enters the panel's TIN.
3. **Submitting:**
   - *Monthly consolidated* (default): an admin picks the month and presses **Submit consolidated**, which rolls pending walk-in receipts into one e-invoice (due 7 days after month end per LHDN guidance; confirm with your adviser). Panel invoices are always sent individually.
   - *Each invoice*: the worker submits ready invoices automatically (or press **Submit ready invoices now**).
4. **Tracking:** **Check LHDN status** (and the worker) fetch the validation result: Valid, Rejected (with errors), or Cancelled. Rejected or failed invoices can be corrected (edit buyer) and retried. Valid/submitted e-invoices can be cancelled with a reason (LHDN allows this within 72 hours of validation).

## Deploy
1. Apply `supabase/migrations/20261021100000_v17_einvoice.sql`.
2. Deploy the functions:
   ```bash
   supabase functions deploy einvoice-admin
   supabase functions deploy einvoice-worker --no-verify-jwt
   ```
   `integrations-admin` (from the integrations feature) must also be deployed: it stores the client secret.
3. Set secrets (same as the integrations worker): `ALLOWED_ORIGIN`, `INTEGRATIONS_WORKER_SECRET`.
4. Optional, for per-invoice mode, schedule the worker every few minutes (same pattern as `integrations-worker` in `docs/integrations.md`, URL `.../einvoice-worker`).

## Safety properties
- MyInvois base URLs are fixed constants in the server code, never admin-supplied, so the connector cannot be pointed at an internal address.
- Credentials never reach the browser; the audit log (`integration_events`) records outcomes only, never patient data or secrets.
- Only admins can read `einvoices`; cashiers can only create rows through `record_einvoice()`, which does nothing unless the connection is enabled.
- Amounts are taken from the bill the cashier saw (calculated in the browser, as with card payments). The server validates structure and totals but cannot independently recompute the bill.

## Not built yet
Credit/debit notes and refund documents, digital signing (v1.1), QR code on the printed receipt, buyer self-service e-invoice requests, TIN verification against LHDN, and a scheduled consolidated submission.
