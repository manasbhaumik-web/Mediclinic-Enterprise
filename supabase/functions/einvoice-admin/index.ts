// Admin-only e-Invoice operations. Credentials are stored with the integrations-admin function (set_secret);
// this function only uses them.
//   test | process_pending | refresh | submit_consolidated | cancel | update_buyer | retry
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { authenticate, corsHeadersFor, jsonResponse, recordEvent, serviceClient } from '../_shared/runtime.ts';
import { cancelInvoice, loadContext, processPending, refreshSubmitted, submitConsolidated, testCredentials } from '../_shared/einvoiceService.ts';

const EDITABLE_STATUSES = ['pending', 'needs_buyer', 'invalid', 'error'];

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeadersFor(req) });
  if (req.method !== 'POST') return jsonResponse(req, { error: 'Method not allowed' }, 405);

  const caller = await authenticate(req);
  if (!caller) return jsonResponse(req, { error: 'Unauthorized' }, 401);
  if (caller.role !== 'admin') return jsonResponse(req, { error: 'Forbidden' }, 403);

  let body: Record<string, any>;
  try { body = await req.json(); } catch { return jsonResponse(req, { error: 'Invalid JSON' }, 400); }
  const action = body.action as string;
  const db = serviceClient();

  // Buyer edits and retries need no MyInvois credentials.
  if (action === 'update_buyer' || action === 'retry') {
    const id = String(body.id ?? '');
    const { data: row } = await db.from('einvoices').select('id, status, invoice_number').eq('id', id).maybeSingle();
    if (!row) return jsonResponse(req, { ok: false, message: 'Invoice not found.' }, 404);
    if (!EDITABLE_STATUSES.includes(row.status)) return jsonResponse(req, { ok: false, message: `An invoice that is ${row.status} cannot be changed.` });

    if (action === 'update_buyer') {
      const b = body.buyer ?? {};
      const type = ['general_public', 'individual', 'business'].includes(b.type) ? b.type : 'business';
      const clean = (v: unknown, max = 120) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
      const buyer = {
        name: clean(b.name), tin: clean(b.tin, 20).toUpperCase(), idType: ['NRIC', 'PASSPORT', 'BRN', 'ARMY'].includes(b.idType) ? b.idType : undefined,
        idValue: clean(b.idValue, 30), address1: clean(b.address1), city: clean(b.city, 60), postcode: clean(b.postcode, 10),
        stateCode: clean(b.stateCode, 2), phone: clean(b.phone, 30), email: clean(b.email),
      };
      if (type !== 'general_public' && (!buyer.name || !buyer.tin)) return jsonResponse(req, { ok: false, message: 'Buyer name and TIN are required.' });
      await db.from('einvoices').update({
        buyer_type: type, buyer: type === 'general_public' ? {} : buyer, status: 'pending', attempts: 0, last_error: null, validation_errors: null,
      }).eq('id', id);
      await recordEvent(db, { connectionId: null, direction: 'admin', eventType: 'einvoice.buyer_updated', status: 'success', detail: row.invoice_number, actor: caller.userId });
      return jsonResponse(req, { ok: true, message: 'Buyer details saved. The invoice will be submitted on the next run.' });
    }

    await db.from('einvoices').update({ status: 'pending', attempts: 0, last_error: null, validation_errors: null }).eq('id', id);
    return jsonResponse(req, { ok: true, message: 'Queued for resubmission.' });
  }

  const { ctx, error } = await loadContext(db, { requireEnabled: action !== 'test' });
  if (!ctx) return jsonResponse(req, { ok: false, message: error });

  switch (action) {
    case 'test':
      return jsonResponse(req, await testCredentials(db, ctx, caller.userId));
    case 'process_pending':
      return jsonResponse(req, { ok: true, ...(await processPending(db, ctx)) });
    case 'refresh':
      return jsonResponse(req, { ok: true, ...(await refreshSubmitted(db, ctx)) });
    case 'submit_consolidated':
      return jsonResponse(req, await submitConsolidated(db, ctx, String(body.month ?? ''), caller.userId));
    case 'cancel':
      return jsonResponse(req, await cancelInvoice(db, ctx, String(body.id ?? ''), String(body.reason ?? ''), caller.userId));
    default:
      return jsonResponse(req, { error: 'Unknown action' }, 400);
  }
});
