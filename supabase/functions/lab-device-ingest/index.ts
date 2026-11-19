// Receives result messages from lab analyzers, imaging gateways and point-of-care devices.
//
//   POST  /functions/v1/lab-device-ingest
//   Authorization: Bearer <the device's key>        (made in Admin > Lab devices; only its SHA-256 is stored)
//   Body: HL7 v2 (ORU^R01), a FHIR Observation or Bundle, or the plain JSON format (see _shared/deviceMessages.ts)
//
// The results are stored in the inbox as Pending. A person accepts each one, which records it on the order.
// This function must be deployed with JWT verification OFF: a device has a key, not a signed-in user.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { buildHl7Ack, isUsable, parseDeviceMessage, type DeviceFormat } from '../_shared/deviceMessages.ts';
import { serviceClient } from '../_shared/runtime.ts';

const text = (body: string, status: number, type = 'text/plain') => new Response(body, { status, headers: { 'Content-Type': type } });
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const key = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '').trim();
  if (!key) return json({ error: 'Missing device key' }, 401);

  const db = serviceClient();
  const { data: keyRow } = await db.from('lab_device_keys').select('device_id').eq('key_hash', await sha256Hex(key)).maybeSingle();
  if (!keyRow) return json({ error: 'Unknown device key' }, 401);

  const { data: device } = await db.from('lab_devices').select('id, protocol, active').eq('id', keyRow.device_id).maybeSingle();
  if (!device || !device.active) return json({ error: 'This device is switched off' }, 403);

  const body = await req.text();
  const parsed = parseDeviceMessage(body, device.protocol as DeviceFormat, req.headers.get('Content-Type') ?? '');
  const isHl7 = parsed.format === 'hl7v2';

  if (!isUsable(parsed)) {
    const message = parsed.errors[0] ?? 'The message could not be used.';
    return isHl7 ? text(buildHl7Ack(parsed.controlId, false), 422) : json({ ok: false, errors: parsed.errors, message }, 422);
  }

  const { data, error } = await db.rpc('device_results_ingest', {
    p_device_id: device.id,
    p_format: parsed.format,
    p_items: parsed.observations.map((o) => ({
      message_id: o.messageId,
      patient_ref: o.patientRef,
      device_code: o.deviceCode,
      value: o.value,
      unit: o.unit,
      range: o.range,
      abnormal: o.abnormal,
      observed_at: o.observedAt ?? null,
      notes: o.notes,
    })),
  });

  if (error) {
    // Nothing from the database is echoed back: the sender only learns that storing failed.
    return isHl7 ? text(buildHl7Ack(parsed.controlId, false), 500) : json({ ok: false, message: 'The results could not be stored.' }, 500);
  }
  return isHl7 ? text(buildHl7Ack(parsed.controlId, true), 200) : json({ ok: true, ...data, warnings: parsed.errors });
});
