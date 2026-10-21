// Deno-side e-invoice operations shared by the einvoice-admin and einvoice-worker functions.
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  Buyer, GENERAL_PUBLIC_TIN, Snapshot, Supplier, TaxCategory, buildConsolidatedDocument, buildInvoiceDocument, r2, validateSupplier,
} from './ubl.ts';
import {
  Environment, MyInvoisError, cancelDocument, getDocumentDetails, getToken, mapLhdnStatus, submitDocument,
} from './myinvois.ts';
import { recordEvent, recordHealth } from './runtime.ts';

export const MAX_ATTEMPTS = 5;

export interface EInvoiceContext {
  connectionId: string;
  env: Environment;
  clientId: string;
  clientSecret: string;
  onBehalfOf?: string;
  supplier: Supplier;
  taxCategory: TaxCategory;
  classificationCode: string;
  submissionMode: 'per_invoice' | 'consolidated';
}

/** Loads the enabled e-invoice connection and its secret, or explains why it cannot be used. */
export async function loadContext(db: SupabaseClient, opts: { requireEnabled: boolean }): Promise<{ ctx?: EInvoiceContext; error?: string }> {
  const { data: conn } = await db.from('integration_connections').select('*').eq('type', 'einvoice').order('created_at').limit(1).maybeSingle();
  if (!conn) return { error: 'No e-Invoice connection has been set up.' };
  if (opts.requireEnabled && !conn.enabled) return { error: 'The e-Invoice connection is disabled.' };

  const cfg = conn.config ?? {};
  if (!cfg.clientId) return { error: 'The MyInvois client ID is not set.' };
  const { data: secretRow } = await db.from('integration_secrets').select('secret').eq('connection_id', conn.id).maybeSingle();
  if (!secretRow?.secret) return { error: 'The MyInvois client secret is not stored.' };

  const problems = validateSupplier(cfg.supplier ?? {});
  if (problems.length) return { error: `Supplier details incomplete: ${problems.join('; ')}.` };

  return {
    ctx: {
      connectionId: conn.id,
      env: conn.mode === 'live' ? 'production' : 'sandbox',
      clientId: cfg.clientId,
      clientSecret: secretRow.secret,
      onBehalfOf: cfg.intermediaryTin || undefined,
      supplier: cfg.supplier,
      taxCategory: (['01', '02', '06'].includes(cfg.taxCategory) ? cfg.taxCategory : '06') as TaxCategory,
      classificationCode: cfg.classificationCode || '022',
      submissionMode: cfg.submissionMode === 'consolidated' ? 'consolidated' : 'per_invoice',
    },
  };
}

const token = (c: EInvoiceContext) => getToken(c.env, c.clientId, c.clientSecret, c.onBehalfOf);

function buyerFor(row: { buyer_type: string; buyer: Record<string, any> }): Buyer {
  if (row.buyer_type === 'general_public') return { name: 'General Public', tin: GENERAL_PUBLIC_TIN };
  const b = row.buyer ?? {};
  return {
    name: b.name, tin: b.tin, idType: b.idType, idValue: b.idValue, address1: b.address1, city: b.city,
    postcode: b.postcode, stateCode: b.stateCode, phone: b.phone, email: b.email,
  };
}

export async function testCredentials(db: SupabaseClient, c: EInvoiceContext, actor?: string) {
  const started = Date.now();
  try {
    await token(c);
    const latency = Date.now() - started;
    await recordHealth(db, c.connectionId, true, latency);
    await recordEvent(db, { connectionId: c.connectionId, direction: 'admin', eventType: 'einvoice.test', status: 'success', detail: `Token issued (${c.env})`, actor });
    return { ok: true, latencyMs: latency, message: `Authenticated with MyInvois (${c.env})` };
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Request failed';
    await recordHealth(db, c.connectionId, false, null, message);
    await recordEvent(db, { connectionId: c.connectionId, direction: 'admin', eventType: 'einvoice.test', status: 'failure', detail: message, actor });
    return { ok: false, message };
  }
}

/** Submit invoices that are ready. General-public invoices are skipped in consolidated mode. */
export async function processPending(db: SupabaseClient, c: EInvoiceContext, limit = 20) {
  const summary = { submitted: 0, rejected: 0, retrying: 0, failed: 0 };
  let query = db.from('einvoices').select('*').eq('status', 'pending').eq('kind', 'invoice').order('issued_at').limit(limit);
  if (c.submissionMode === 'consolidated') query = query.neq('buyer_type', 'general_public');
  const { data: rows } = await query;
  if (!rows?.length) return summary;

  let tok: string;
  try {
    tok = await token(c);
  } catch (e) {
    await recordHealth(db, c.connectionId, false, null, e instanceof Error ? e.message : 'Token failed');
    return { ...summary, retrying: rows.length };
  }

  for (const row of rows) {
    const buyer = buyerFor(row);
    if (row.buyer_type !== 'general_public' && !buyer.tin) {
      await db.from('einvoices').update({ status: 'needs_buyer' }).eq('id', row.id);
      continue;
    }
    const started = Date.now();
    try {
      const doc = buildInvoiceDocument(row.snapshot as Snapshot, {
        invoiceNumber: row.invoice_number, issuedAt: new Date(row.issued_at), supplier: c.supplier, buyer,
        taxCategory: c.taxCategory, classificationCode: c.classificationCode,
      });
      const res = await submitDocument(c.env, tok, doc, row.invoice_number, c.onBehalfOf);
      await recordHealth(db, c.connectionId, true, Date.now() - started);
      if (res.accepted) {
        await db.from('einvoices').update({
          status: 'submitted', lhdn_uuid: res.accepted.uuid, submission_uid: res.submissionUid, document_hash: res.documentHash,
          submitted_at: new Date().toISOString(), attempts: row.attempts + 1, last_error: null, validation_errors: null,
        }).eq('id', row.id);
        await recordEvent(db, { connectionId: c.connectionId, direction: 'outbound', eventType: 'einvoice.submit', status: 'success', detail: `${row.invoice_number} accepted` });
        summary.submitted++;
      } else {
        const rej = res.rejected;
        await db.from('einvoices').update({
          status: 'invalid', attempts: row.attempts + 1, last_error: rej?.message ?? 'Rejected by MyInvois',
          validation_errors: rej?.details ?? [], document_hash: res.documentHash,
        }).eq('id', row.id);
        await recordEvent(db, { connectionId: c.connectionId, direction: 'outbound', eventType: 'einvoice.submit', status: 'failure', detail: `${row.invoice_number} rejected: ${rej?.message ?? ''}` });
        summary.rejected++;
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Submission failed';
      const canRetry = e instanceof MyInvoisError ? e.retryable : false;
      const attempts = row.attempts + 1;
      const final = !canRetry || attempts >= MAX_ATTEMPTS;
      await db.from('einvoices').update({ status: final ? 'error' : 'pending', attempts, last_error: message }).eq('id', row.id);
      await recordHealth(db, c.connectionId, false, null, message);
      await recordEvent(db, { connectionId: c.connectionId, direction: 'outbound', eventType: 'einvoice.submit', status: 'failure', detail: `${row.invoice_number}: ${message}` });
      if (final) summary.failed++; else summary.retrying++;
    }
  }
  return summary;
}

/** Ask MyInvois for the outcome of documents we have submitted. */
export async function refreshSubmitted(db: SupabaseClient, c: EInvoiceContext, limit = 30) {
  const summary = { checked: 0, valid: 0, invalid: 0, cancelled: 0 };
  const { data: rows } = await db.from('einvoices').select('id, invoice_number, lhdn_uuid, kind, status').eq('status', 'submitted').not('lhdn_uuid', 'is', null).order('submitted_at').limit(limit);
  if (!rows?.length) return summary;

  let tok: string;
  try { tok = await token(c); } catch { return summary; }

  for (const row of rows) {
    try {
      const d = await getDocumentDetails(c.env, tok, row.lhdn_uuid, c.onBehalfOf);
      const status = mapLhdnStatus(d.status);
      summary.checked++;
      if (status === 'submitted') continue;
      await db.from('einvoices').update({
        status, long_id: d.longId, validation_errors: d.errors.length ? d.errors : null,
        validated_at: status === 'valid' ? new Date().toISOString() : null,
        ...(status === 'cancelled' ? { cancelled_at: new Date().toISOString() } : {}),
      }).eq('id', row.id);
      if (status === 'valid') summary.valid++;
      if (status === 'invalid') {
        summary.invalid++;
        // An invalid consolidated invoice releases its receipts so they can be consolidated again.
        if (row.kind === 'consolidated') await db.from('einvoices').update({ status: 'pending', consolidated_into: null }).eq('consolidated_into', row.id);
      }
      if (status === 'cancelled') summary.cancelled++;
      await recordEvent(db, { connectionId: c.connectionId, direction: 'inbound', eventType: 'einvoice.status', status: status === 'invalid' ? 'failure' : 'success', detail: `${row.invoice_number} is ${status}` });
    } catch { /* leave it submitted; the next run will check again */ }
  }
  return summary;
}

/** Bounds of a calendar month in Malaysia time (UTC+8), as ISO instants. */
export function monthRange(month: string): { start: string; end: string; first: string } | null {
  const m = month.match(/^(\d{4})-(0[1-9]|1[0-2])$/);
  if (!m) return null;
  const y = Number(m[1]), mo = Number(m[2]);
  const start = new Date(Date.UTC(y, mo - 1, 1) - 8 * 3600_000);
  const end = new Date(Date.UTC(y, mo, 1) - 8 * 3600_000);
  return { start: start.toISOString(), end: end.toISOString(), first: `${m[1]}-${m[2]}-01` };
}

/** Roll up a month's pending general-public invoices into one consolidated e-invoice. */
export async function submitConsolidated(db: SupabaseClient, c: EInvoiceContext, month: string, actor?: string) {
  const range = monthRange(month);
  if (!range) return { ok: false, message: 'Month must look like 2026-10.' };

  const { data: members } = await db.from('einvoices').select('id, invoice_number, snapshot, tax_total')
    .eq('kind', 'invoice').eq('status', 'pending').eq('buyer_type', 'general_public').is('consolidated_into', null)
    .gte('issued_at', range.start).lt('issued_at', range.end).order('issued_at');
  if (!members?.length) return { ok: false, message: `No pending general-public invoices for ${month}.` };

  const { count } = await db.from('einvoices').select('id', { count: 'exact', head: true }).eq('kind', 'consolidated').eq('period_month', range.first);
  const number = `CON-${month.replace('-', '')}-${String((count ?? 0) + 1).padStart(2, '0')}`;
  const taxRate = (members[0].snapshot as Snapshot).taxRate;
  const parts = members.map((m) => ({ invoiceNumber: m.invoice_number, netAmount: (m.snapshot as Snapshot).subtotal, taxAmount: Number(m.tax_total) }));
  const net = r2(parts.reduce((a, p) => a + p.netAmount, 0));
  const tax = r2(parts.reduce((a, p) => a + p.taxAmount, 0));

  const issuedAt = new Date();
  const { data: created, error: insErr } = await db.from('einvoices').insert({
    invoice_number: number, kind: 'consolidated', status: 'pending', buyer_type: 'general_public', buyer: {},
    snapshot: { members: members.map((m) => m.id), taxRate }, total_payable: r2(net + tax), tax_total: tax,
    period_month: range.first, issued_at: issuedAt.toISOString(), created_by: actor ?? null,
  }).select('id').single();
  if (insErr || !created) return { ok: false, message: 'Could not create the consolidated invoice.' };

  try {
    const tok = await token(c);
    const doc = buildConsolidatedDocument(parts, taxRate, { invoiceNumber: number, issuedAt, supplier: c.supplier, taxCategory: c.taxCategory });
    const res = await submitDocument(c.env, tok, doc, number, c.onBehalfOf);
    if (res.accepted) {
      await db.from('einvoices').update({
        status: 'submitted', lhdn_uuid: res.accepted.uuid, submission_uid: res.submissionUid, document_hash: res.documentHash,
        submitted_at: new Date().toISOString(), attempts: 1,
      }).eq('id', created.id);
      await db.from('einvoices').update({ status: 'consolidated', consolidated_into: created.id }).in('id', members.map((m) => m.id));
      await recordEvent(db, { connectionId: c.connectionId, direction: 'outbound', eventType: 'einvoice.consolidated', status: 'success', detail: `${number} accepted (${members.length} receipts)`, actor });
      return { ok: true, message: `Submitted ${number} covering ${members.length} receipts.`, number };
    }
    const rej = res.rejected;
    await db.from('einvoices').update({ status: 'invalid', last_error: rej?.message ?? 'Rejected', validation_errors: rej?.details ?? [], attempts: 1 }).eq('id', created.id);
    await recordEvent(db, { connectionId: c.connectionId, direction: 'outbound', eventType: 'einvoice.consolidated', status: 'failure', detail: `${number} rejected: ${rej?.message ?? ''}`, actor });
    return { ok: false, message: `MyInvois rejected ${number}: ${rej?.message ?? 'see the invoice for details'}` };
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Submission failed';
    await db.from('einvoices').update({ status: 'error', last_error: message, attempts: 1 }).eq('id', created.id);
    await recordEvent(db, { connectionId: c.connectionId, direction: 'outbound', eventType: 'einvoice.consolidated', status: 'failure', detail: `${number}: ${message}`, actor });
    return { ok: false, message };
  }
}

export async function cancelInvoice(db: SupabaseClient, c: EInvoiceContext, id: string, reason: string, actor?: string) {
  const { data: row } = await db.from('einvoices').select('id, invoice_number, kind, status, lhdn_uuid').eq('id', id).maybeSingle();
  if (!row) return { ok: false, message: 'Invoice not found.' };
  if (!['submitted', 'valid'].includes(row.status) || !row.lhdn_uuid) return { ok: false, message: 'Only submitted or valid e-invoices can be cancelled.' };
  if (!reason.trim()) return { ok: false, message: 'A cancellation reason is required.' };

  try {
    await cancelDocument(c.env, await token(c), row.lhdn_uuid, reason, c.onBehalfOf);
    await db.from('einvoices').update({ status: 'cancelled', cancelled_at: new Date().toISOString(), cancel_reason: reason.slice(0, 300) }).eq('id', id);
    if (row.kind === 'consolidated') await db.from('einvoices').update({ status: 'pending', consolidated_into: null }).eq('consolidated_into', id);
    await recordEvent(db, { connectionId: c.connectionId, direction: 'outbound', eventType: 'einvoice.cancel', status: 'success', detail: `${row.invoice_number} cancelled`, actor });
    return { ok: true, message: `${row.invoice_number} cancelled.` };
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Cancellation failed';
    await recordEvent(db, { connectionId: c.connectionId, direction: 'outbound', eventType: 'einvoice.cancel', status: 'failure', detail: `${row.invoice_number}: ${message}`, actor });
    return { ok: false, message };
  }
}
