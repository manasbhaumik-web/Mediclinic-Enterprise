// Drains the integration outbox: builds each message from the database at send time, posts it to the
// connection's endpoint, and records the outcome. Invoke on a schedule (Supabase cron / pg_net) with the
// header `x-worker-secret: $INTEGRATIONS_WORKER_SECRET`. It is not callable with a user JWT.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { validateEndpoint } from '../_shared/endpoint.ts';
import { buildEncounterBundle, FhirBuildError } from '../_shared/fhir.ts';
import { AuthType, buildAuthHeaders } from '../_shared/headers.ts';
import { resolveOutcome } from '../_shared/outbox.ts';
import { recordEvent, recordHealth, safeFetch, serviceClient } from '../_shared/runtime.ts';

const BATCH_SIZE = 25;

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

serve(async (req) => {
  const expected = Deno.env.get('INTEGRATIONS_WORKER_SECRET') ?? '';
  const provided = req.headers.get('x-worker-secret') ?? '';
  if (!expected || !timingSafeEqual(provided, expected)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  const db = serviceClient();
  const summary = { picked: 0, sent: 0, retrying: 0, dead: 0 };

  const { data: due } = await db
    .from('integration_outbox')
    .select('id, connection_id, event_type, subject_type, subject_id, attempts, integration_connections!inner(*)')
    .in('status', ['pending', 'failed'])
    .lte('next_retry_at', new Date().toISOString())
    .eq('integration_connections.enabled', true)
    .eq('integration_connections.type', 'fhir')
    .order('created_at', { ascending: true })
    .limit(BATCH_SIZE);

  for (const row of due ?? []) {
    // Claim the row so two overlapping runs cannot send the same message twice.
    const { data: claimed } = await db
      .from('integration_outbox')
      .update({ status: 'sending', attempts: row.attempts + 1 })
      .eq('id', row.id)
      .in('status', ['pending', 'failed'])
      .select('id')
      .maybeSingle();
    if (!claimed) continue;
    summary.picked++;

    const connection = row.integration_connections;
    const attempts = row.attempts + 1;
    const settle = async (success: boolean, httpStatus: number | null, error: string | null, permanent = false) => {
      const outcome = resolveOutcome({ success, httpStatus, attemptsSoFar: attempts, now: new Date(), permanent });
      if (outcome.status === 'sent') {
        await db.from('integration_outbox').update({ status: 'sent', sent_at: new Date().toISOString(), last_error: null }).eq('id', row.id);
        summary.sent++;
      } else if (outcome.status === 'dead') {
        await db.from('integration_outbox').update({ status: 'dead', last_error: error }).eq('id', row.id);
        summary.dead++;
      } else {
        await db.from('integration_outbox').update({ status: 'failed', last_error: error, next_retry_at: outcome.nextRetryAt.toISOString() }).eq('id', row.id);
        summary.retrying++;
      }
    };

    const started = Date.now();
    try {
      const endpoint = validateEndpoint(connection.endpoint_url);
      if (!endpoint.ok) {
        await recordEvent(db, { connectionId: connection.id, direction: 'outbound', eventType: row.event_type, status: 'blocked', detail: endpoint.reason });
        await settle(false, null, endpoint.reason ?? 'Invalid endpoint', true);
        continue;
      }

      const [{ data: visit }, { data: secretRow }] = await Promise.all([
        db.from('visits').select('*').eq('id', row.subject_id).maybeSingle(),
        db.from('integration_secrets').select('secret').eq('connection_id', connection.id).maybeSingle(),
      ]);
      if (!visit) { await settle(false, null, 'Visit no longer exists', true); continue; }

      const [{ data: patient }, { data: soap }] = await Promise.all([
        db.from('patients').select('*').eq('id', visit.patient_id).maybeSingle(),
        db.from('soap_notes').select('*').eq('visit_id', visit.id).maybeSingle(),
      ]);
      if (!patient) { await settle(false, null, 'Patient no longer exists', true); continue; }

      const bundle = buildEncounterBundle(patient, visit, soap, { sendNric: connection.config?.sendNric === true });
      const headers = buildAuthHeaders(connection.auth_type as AuthType, secretRow?.secret ?? null, connection.auth_header_name);

      const res = await safeFetch(endpoint.url!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/fhir+json', Accept: 'application/fhir+json', ...headers },
        body: JSON.stringify(bundle),
      }, 15_000);
      const latency = Date.now() - started;

      await recordHealth(db, connection.id, res.ok, latency, res.ok ? null : `HTTP ${res.status}`);
      await recordEvent(db, { connectionId: connection.id, direction: 'outbound', eventType: row.event_type, status: res.ok ? 'success' : 'failure', httpStatus: res.status, detail: res.ok ? `Sent ${bundle.entry.length} resources` : `HTTP ${res.status}` });
      await settle(res.ok, res.status, res.ok ? null : `HTTP ${res.status}`);
    } catch (e) {
      if (e instanceof FhirBuildError) {
        // Missing clinical/demographic data will not fix itself by retrying.
        await recordEvent(db, { connectionId: connection.id, direction: 'outbound', eventType: row.event_type, status: 'blocked', detail: e.message });
        await settle(false, null, e.message, true);
        continue;
      }
      const message = e instanceof Error && e.name === 'AbortError' ? 'Timed out' : (e instanceof Error ? e.message : 'Request failed');
      await recordHealth(db, connection.id, false, null, message);
      await recordEvent(db, { connectionId: connection.id, direction: 'outbound', eventType: row.event_type, status: 'failure', detail: message });
      await settle(false, null, message);
    }
  }

  return new Response(JSON.stringify(summary), { headers: { 'Content-Type': 'application/json' } });
});
