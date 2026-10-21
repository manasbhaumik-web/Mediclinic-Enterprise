// Admin-only operations on integration connections that need the service role:
//   set_secret   store or replace a connection's credential (write-only: it is never returned)
//   clear_secret remove the stored credential
//   test         call the remote system and record the result in the health + audit tables
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { validateEndpoint } from '../_shared/endpoint.ts';
import { AuthType, buildAuthHeaders } from '../_shared/headers.ts';
import { authenticate, corsHeadersFor, jsonResponse, recordEvent, recordHealth, safeFetch, serviceClient } from '../_shared/runtime.ts';

const MAX_SECRET_LENGTH = 4096;

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeadersFor(req) });
  if (req.method !== 'POST') return jsonResponse(req, { error: 'Method not allowed' }, 405);

  const caller = await authenticate(req);
  if (!caller) return jsonResponse(req, { error: 'Unauthorized' }, 401);
  if (caller.role !== 'admin') return jsonResponse(req, { error: 'Forbidden' }, 403);

  let body: { action?: string; connectionId?: string; secret?: string };
  try {
    body = await req.json();
  } catch {
    return jsonResponse(req, { error: 'Invalid JSON' }, 400);
  }
  const { action, connectionId } = body;
  if (!connectionId || typeof connectionId !== 'string') return jsonResponse(req, { error: 'connectionId is required' }, 400);

  const db = serviceClient();
  const { data: connection } = await db.from('integration_connections').select('*').eq('id', connectionId).maybeSingle();
  if (!connection) return jsonResponse(req, { error: 'Connection not found' }, 404);

  if (action === 'set_secret') {
    const secret = body.secret;
    if (typeof secret !== 'string' || !secret || secret.length > MAX_SECRET_LENGTH) {
      return jsonResponse(req, { error: `secret must be 1-${MAX_SECRET_LENGTH} characters` }, 400);
    }
    const { error } = await db.from('integration_secrets').upsert({ connection_id: connectionId, secret, updated_at: new Date().toISOString() });
    if (error) return jsonResponse(req, { error: 'Could not store secret' }, 500);
    await db.from('integration_connections').update({ secret_set: true }).eq('id', connectionId);
    await recordEvent(db, { connectionId, direction: 'admin', eventType: 'secret.set', status: 'success', actor: caller.userId });
    return jsonResponse(req, { ok: true });
  }

  if (action === 'clear_secret') {
    await db.from('integration_secrets').delete().eq('connection_id', connectionId);
    await db.from('integration_connections').update({ secret_set: false }).eq('id', connectionId);
    await recordEvent(db, { connectionId, direction: 'admin', eventType: 'secret.cleared', status: 'success', actor: caller.userId });
    return jsonResponse(req, { ok: true });
  }

  if (action === 'test') {
    if (connection.type !== 'fhir') {
      return jsonResponse(req, { ok: false, message: `No connector is implemented for "${connection.type}" yet.` });
    }

    const endpoint = validateEndpoint(connection.endpoint_url);
    if (!endpoint.ok) {
      await recordEvent(db, { connectionId, direction: 'admin', eventType: 'connection.test', status: 'blocked', detail: endpoint.reason, actor: caller.userId });
      return jsonResponse(req, { ok: false, message: endpoint.reason });
    }

    const started = Date.now();
    try {
      const { data: secretRow } = await db.from('integration_secrets').select('secret').eq('connection_id', connectionId).maybeSingle();
      const headers = buildAuthHeaders(connection.auth_type as AuthType, secretRow?.secret ?? null, connection.auth_header_name);

      // A FHIR server publishes its capability statement at [base]/metadata.
      const res = await safeFetch(`${endpoint.url}/metadata`, { method: 'GET', headers: { Accept: 'application/fhir+json', ...headers } }, 10_000);
      const latency = Date.now() - started;
      let fhirVersion: string | undefined;
      let software: string | undefined;
      if (res.ok) {
        try {
          const meta = await res.json();
          fhirVersion = typeof meta.fhirVersion === 'string' ? meta.fhirVersion : undefined;
          software = typeof meta.software?.name === 'string' ? meta.software.name : undefined;
          if (meta.resourceType !== 'CapabilityStatement') throw new Error('Response is not a FHIR CapabilityStatement');
        } catch (e) {
          const message = e instanceof Error ? e.message : 'Unreadable response';
          await recordHealth(db, connectionId, false, latency, message);
          await recordEvent(db, { connectionId, direction: 'admin', eventType: 'connection.test', status: 'failure', httpStatus: res.status, detail: message, actor: caller.userId });
          return jsonResponse(req, { ok: false, httpStatus: res.status, latencyMs: latency, message });
        }
      }

      await recordHealth(db, connectionId, res.ok, latency, res.ok ? null : `HTTP ${res.status}`);
      await recordEvent(db, { connectionId, direction: 'admin', eventType: 'connection.test', status: res.ok ? 'success' : 'failure', httpStatus: res.status, detail: res.ok ? `FHIR ${fhirVersion ?? '?'} ${software ?? ''}`.trim() : `HTTP ${res.status}`, actor: caller.userId });
      return jsonResponse(req, { ok: res.ok, httpStatus: res.status, latencyMs: latency, fhirVersion, software, message: res.ok ? 'Connection successful' : `Server responded with HTTP ${res.status}` });
    } catch (e) {
      const message = e instanceof Error && e.name === 'AbortError' ? 'Timed out after 10 seconds' : (e instanceof Error ? e.message : 'Request failed');
      await recordHealth(db, connectionId, false, null, message);
      await recordEvent(db, { connectionId, direction: 'admin', eventType: 'connection.test', status: 'failure', detail: message, actor: caller.userId });
      return jsonResponse(req, { ok: false, message });
    }
  }

  return jsonResponse(req, { error: 'Unknown action' }, 400);
});
