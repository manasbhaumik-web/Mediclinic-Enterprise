# Integrations: setup and operation

Admin console → Platform → Integrations. The **Connections** tab is real; the **Playground** tab is sample data only.

## What works today
- Admins create connections (type, endpoint, auth, sandbox/live), store a credential, test it, and enable it.
- **HL7 FHIR** is the only implemented connector type. Other types can be recorded but not enabled.
- Completing a consultation queues a FHIR message for every *enabled* FHIR connection. The worker builds a FHIR transaction bundle (Patient, Encounter, Condition, vital-sign Observations) from the database and POSTs it to the endpoint, with retries and an audit log.
- The NRIC is omitted from the bundle unless the connection has "Include NRIC" ticked.

## One-time setup

1. **Apply the migration** `supabase/migrations/20260726000010_v11_integrations.sql` (adds five tables and `enqueue_integration_message`).

2. **Set function secrets** (never in the browser or `.env.local`):
   ```bash
   supabase secrets set ALLOWED_ORIGIN=https://your-app.example INTEGRATIONS_WORKER_SECRET=$(openssl rand -hex 32)
   ```
   `SUPABASE_URL`, `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are provided to functions automatically.

3. **Deploy the functions**:
   ```bash
   supabase functions deploy integrations-admin
   supabase functions deploy integrations-worker --no-verify-jwt
   ```
   The worker is authenticated by the `x-worker-secret` header, not a user JWT, so it is deployed without JWT verification.

4. **Schedule the worker** (every minute), in the SQL editor, with `pg_cron` and `pg_net` enabled:
   ```sql
   select cron.schedule('integrations-worker', '* * * * *', $$
     select net.http_post(
       url := 'https://<project-ref>.functions.supabase.co/integrations-worker',
       headers := jsonb_build_object('x-worker-secret', '<the INTEGRATIONS_WORKER_SECRET value>')
     );
   $$);
   ```

## Trying it safely
1. Add a FHIR connection in **sandbox** mode pointing at a public test server (for example `https://hapi.fhir.org/baseR4`). Use test data only: public servers are readable by anyone.
2. Click **Test**: it reads the server's `/metadata` and shows the FHIR version and latency.
3. Enable it, complete a consultation, then watch **Recent activity**. The worker picks the message up on its next run.

## Safety properties
- Endpoints must be `https` and cannot point at localhost, private ranges, link-local/cloud-metadata addresses or internal hostnames. Redirects are not followed. This checks the literal host only; it does not resolve DNS, so keep network-level egress controls too.
- Credentials live in `integration_secrets`, which has RLS enabled and no policies: only the service role (edge functions) can read it, and the admin UI can write but never read it. Consider moving them to Supabase Vault for encryption at rest.
- The browser sends only a reference (visit id) to be queued; patient data is read server-side at delivery time.
- Missing demographics (gender, date of birth) cause the message to be marked **dead** with an explanation, instead of sending invented values.
- Going live requires an explicit confirmation of PDPA approval for that endpoint. The `integration_events` log records metadata only, never patient data or credentials.

## Not built yet
TPA, lab/radiology, e-prescribing, wearables and device connectors; an inbound webhook endpoint; a manual "retry dead messages" action; credential encryption via Vault.
