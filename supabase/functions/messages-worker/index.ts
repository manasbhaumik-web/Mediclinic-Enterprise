// Queues and sends patient WhatsApp messages (appointment reminders, "results reviewed", follow-up due).
// Run on a schedule (every 5 minutes, see docs/patient-messages.md) with the header
// `x-worker-secret: $MESSAGES_WORKER_SECRET`. It is not callable with a user JWT.
//
// Secrets: MESSAGES_WORKER_SECRET, WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_ACCESS_TOKEN.
// Until the WhatsApp keys are added, messages stay queued and the admin page says the provider is not set up.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { buildWhatsAppPayload, classifyResponse, providerConfigured, type ClaimedMessage } from '../_shared/messaging.ts';
import { serviceClient } from '../_shared/runtime.ts';

const GRAPH_VERSION = 'v20.0';

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

serve(async (req) => {
  const expected = Deno.env.get('MESSAGES_WORKER_SECRET') ?? '';
  const provided = req.headers.get('x-worker-secret') ?? '';
  if (!expected || !timingSafeEqual(provided, expected)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  const db = serviceClient();
  const phoneId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID') ?? '';
  const token = Deno.env.get('WHATSAPP_ACCESS_TOKEN') ?? '';
  const configured = providerConfigured({ WHATSAPP_PHONE_NUMBER_ID: phoneId, WHATSAPP_ACCESS_TOKEN: token });
  await db.rpc('messages_report_run', { p_configured: configured });

  const plan = await db.rpc('messages_plan');
  const summary = { planned: plan.data ?? null, sent: 0, retrying: 0, failed: 0, held: 0 };

  // Without keys nothing is claimed, so queued messages wait instead of failing.
  if (!configured) {
    return new Response(JSON.stringify({ ...summary, note: 'WhatsApp provider is not configured; messages stay queued.' }), { headers: { 'Content-Type': 'application/json' } });
  }

  const { data: claimed } = await db.rpc('messages_claim', { p_limit: 25 });
  for (const m of (claimed ?? []) as ClaimedMessage[]) {
    try {
      const res = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${encodeURIComponent(phoneId)}/messages`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(buildWhatsAppPayload(m)),
      });
      const body = await res.json().catch(() => ({}));
      const outcome = classifyResponse(res.status, body);
      if (outcome.ok) {
        await db.rpc('messages_report', { p_id: m.id, p_ok: true, p_provider_id: outcome.providerId, p_error: null, p_retry: false });
        summary.sent++;
      } else {
        await db.rpc('messages_report', { p_id: m.id, p_ok: false, p_provider_id: null, p_error: outcome.error, p_retry: outcome.retry });
        if (outcome.retry) summary.retrying++; else summary.failed++;
      }
    } catch {
      // The network failed before the provider answered: try again later.
      await db.rpc('messages_report', { p_id: m.id, p_ok: false, p_provider_id: null, p_error: 'Network error reaching the provider.', p_retry: true });
      summary.retrying++;
    }
  }
  return new Response(JSON.stringify(summary), { headers: { 'Content-Type': 'application/json' } });
});
