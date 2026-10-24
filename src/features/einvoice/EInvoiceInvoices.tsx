import React, { useState } from 'react';
import { RefreshCw, Send } from 'lucide-react';
import Button from '../../components/ui/Button';
import FormField from '../../components/ui/FormField';
import { BuyerInput, useEInvoice } from '../../hooks/useEInvoice';
import {
  EDITABLE, EInvoiceConnection, EInvoiceRow, EInvoiceStatus, STATUS_LABELS, Tone,
  canCancel, cancelWindowOpen, consolidatedDueDate, recentMonths, summariseInvoices,
} from '../../domain/einvoice';

const toneClass: Record<Tone, string> = {
  ok: 'chip-ok',
  warn: 'chip-warn',
  bad: 'chip-danger',
  info: 'chip-info',
  idle: 'chip-neutral',
};

const inputClass =
  'w-full px-3 py-2 bg-surface border border-line-subtle rounded-none text-xs font-medium text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/30';
const myr = (n: number) => `RM${n.toFixed(2)}`;
const when = (iso: string | null) => (iso ? new Date(iso).toLocaleString() : '–');
const errorMessage = (e: unknown) => (e instanceof Error ? e.message : 'Something went wrong.');

export default function EInvoiceInvoices({ connection }: { connection: EInvoiceConnection }) {
  const [filter, setFilter] = useState<EInvoiceStatus | 'all'>('all');
  const api = useEInvoice(filter);
  const [month, setMonth] = useState(recentMonths(1)[0]);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const [editing, setEditing] = useState<EInvoiceRow | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  const rows = api.invoices.data ?? [];
  const counts = summariseInvoices((api.counts.data ?? []) as { status: EInvoiceStatus }[]);
  const due = consolidatedDueDate(month);

  const run = async (body: Record<string, unknown>, doneLabel?: string) => {
    setNotice(null);
    try {
      const res = await api.action.mutateAsync(body);
      const parts = Object.entries(res).filter(([k, v]) => typeof v === 'number' && k !== 'latencyMs').map(([k, v]) => `${k}: ${v}`).join(', ');
      setNotice({ ok: res.ok !== false, text: res.message ?? (parts ? `${doneLabel ?? 'Done'} (${parts})` : doneLabel ?? 'Done.') });
    } catch (e) {
      setNotice({ ok: false, text: errorMessage(e) });
    }
  };

  const cancel = (r: EInvoiceRow) => {
    if (!cancelWindowOpen(r.validatedAt) && !window.confirm('This e-invoice was validated more than 72 hours ago, so LHDN will probably refuse the cancellation. Try anyway?')) return;
    const reason = window.prompt(`Reason for cancelling ${r.invoiceNumber}? (sent to LHDN)`);
    if (reason && reason.trim()) void run({ action: 'cancel', id: r.id, reason: reason.trim() });
  };

  return (
    <div className="space-y-5">
      {!connection.enabled && (
        <p role="status" className="text-xs font-bold text-amber-900 bg-amber-50 border border-amber-300 px-3 py-2">
          e-Invoicing is switched OFF, so new payments are not being recorded as e-invoices. Turn it on in Setup.
        </p>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {([['pending', 'Ready to submit'], ['needs_buyer', 'Need buyer details'], ['valid', 'Valid'], ['invalid', 'Rejected']] as [EInvoiceStatus, string][]).map(([s, label]) => (
          <button key={s} type="button" onClick={() => setFilter(s)} className={`text-left bg-surface border p-3 cursor-pointer ${filter === s ? 'border-brand' : 'border-line-subtle'}`}>
            <div className="text-2xs font-bold uppercase tracking-wider text-subtle">{label}</div>
            <div className="text-xl font-bold text-ink font-mono">{counts[s]}</div>
          </button>
        ))}
      </div>

      <div className="bg-surface border border-line-subtle p-4 space-y-3">
        <h3 className="type-heading-caps text-ink">Submit to LHDN</h3>
        <div className="flex flex-wrap items-end gap-3">
          {connection.config.submissionMode === 'per_invoice' && (
            <Button size="sm" icon={<Send className="w-3.5 h-3.5" />} disabled={api.action.isPending} onClick={() => run({ action: 'process_pending' }, 'Submitted')}>
              Submit ready invoices now
            </Button>
          )}
          <Button variant="outline" size="sm" icon={<RefreshCw className="w-3.5 h-3.5" />} disabled={api.action.isPending} onClick={() => run({ action: 'refresh' }, 'Checked')}>
            Check LHDN status
          </Button>
          <div className="flex items-end gap-2 ml-auto">
            <FormField id="ei-month" label="Consolidated month">
              {(p) => (
                <select {...p} className={inputClass} value={month} onChange={(e) => setMonth(e.target.value)}>
                  {recentMonths(6).map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              )}
            </FormField>
            <Button size="sm" disabled={api.action.isPending} onClick={() => {
              if (window.confirm(`Submit one consolidated e-invoice for all pending walk-in receipts in ${month}?`)) void run({ action: 'submit_consolidated', month });
            }}>
              Submit consolidated
            </Button>
          </div>
        </div>
        <p className="text-2xs text-subtle">
          Consolidated e-invoices cover walk-in (general public) receipts only; panel invoices are always sent individually.
          {due && <> A consolidated e-invoice for {month} is due by {due.toLocaleDateString()} (7 days after month end), per LHDN guidance. Confirm with your tax adviser.</>}
        </p>
      </div>

      {notice && (
        <p role="status" className={`text-xs font-bold px-3 py-2 border ${notice.ok ? 'chip-ok' : 'chip-danger'}`}>{notice.text}</p>
      )}
      {api.invoices.error && (
        <p role="alert" className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-2">
          Could not load e-invoices ({errorMessage(api.invoices.error)}). Has the v17 e-Invoice migration been applied?
        </p>
      )}

      <div className="flex items-center justify-between">
        <h3 className="type-heading-caps text-ink">E-invoices</h3>
        <select aria-label="Filter by status" className={`${inputClass} !w-auto`} value={filter} onChange={(e) => setFilter(e.target.value as EInvoiceStatus | 'all')}>
          <option value="all">All statuses</option>
          {(Object.keys(STATUS_LABELS) as EInvoiceStatus[]).map((s) => <option key={s} value={s}>{STATUS_LABELS[s].label}</option>)}
        </select>
      </div>

      <div className="bg-surface border border-line-subtle overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="bg-surface-muted text-2xs uppercase tracking-wider text-subtle">
            <tr><th className="p-2">Invoice</th><th className="p-2">Issued</th><th className="p-2">Buyer</th><th className="p-2 text-right">Total</th><th className="p-2">Status</th><th className="p-2">Actions</th></tr>
          </thead>
          <tbody className="divide-y divide-line-subtle">
            {rows.map((r) => {
              const s = STATUS_LABELS[r.status];
              return (
                <React.Fragment key={r.id}>
                  <tr>
                    <td className="p-2 font-mono font-bold">{r.invoiceNumber}{r.kind === 'consolidated' && <span className="ml-1 text-2xs text-accent">(consolidated)</span>}</td>
                    <td className="p-2 whitespace-nowrap">{when(r.issuedAt)}</td>
                    <td className="p-2">{r.kind === 'consolidated' ? 'General public' : r.buyerType === 'general_public' ? 'General public' : r.buyer.name || '–'}</td>
                    <td className="p-2 text-right font-mono">{myr(r.totalPayable)}</td>
                    <td className="p-2"><span title={s.hint} className={`text-2xs font-bold px-2 py-0.5 border ${toneClass[s.tone]}`}>{s.label}</span></td>
                    <td className="p-2 space-x-1 whitespace-nowrap">
                      <Button variant="ghost" size="sm" onClick={() => setOpen(open === r.id ? null : r.id)}>{open === r.id ? 'Hide' : 'Details'}</Button>
                      {r.kind === 'invoice' && EDITABLE.includes(r.status) && <Button variant="outline" size="sm" onClick={() => setEditing(r)}>Buyer</Button>}
                      {(r.status === 'invalid' || r.status === 'error') && <Button variant="outline" size="sm" disabled={api.action.isPending} onClick={() => run({ action: 'retry', id: r.id })}>Retry</Button>}
                      {canCancel(r) && <Button variant="danger" size="sm" onClick={() => cancel(r)}>Cancel</Button>}
                    </td>
                  </tr>
                  {open === r.id && (
                    <tr className="bg-surface-muted">
                      <td colSpan={6} className="p-3 space-y-1 text-2xs text-muted">
                        <div>Tax {myr(r.taxTotal)} · attempts {r.attempts} · submitted {when(r.submittedAt)} · validated {when(r.validatedAt)}</div>
                        {r.lhdnUuid && <div className="font-mono break-all">LHDN UUID: {r.lhdnUuid}</div>}
                        {r.lastError && <div className="text-rose-700 font-bold">Error: {r.lastError}</div>}
                        {r.validationErrors?.map((e) => <div key={e} className="text-rose-700">• {e}</div>)}
                        {r.cancelReason && <div>Cancelled: {r.cancelReason}</div>}
                        {r.consolidatedInto && <div>Included in a consolidated e-invoice.</div>}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
            {rows.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-subtle">No e-invoices {filter === 'all' ? 'yet' : 'with this status'}. They appear here when a payment is settled while e-Invoicing is ON.</td></tr>}
          </tbody>
        </table>
      </div>

      {editing && (
        <BuyerDialog
          invoice={editing}
          saving={api.action.isPending}
          onClose={() => setEditing(null)}
          onSave={async (buyer) => { await run({ action: 'update_buyer', id: editing.id, buyer }); setEditing(null); }}
        />
      )}
    </div>
  );
}

function BuyerDialog({ invoice, saving, onClose, onSave }: {
  invoice: EInvoiceRow; saving: boolean; onClose: () => void; onSave: (b: BuyerInput) => Promise<void>;
}) {
  const [b, setB] = useState<BuyerInput>({
    type: invoice.buyerType === 'general_public' ? 'business' : invoice.buyerType,
    name: invoice.buyer.name ?? '', tin: invoice.buyer.tin ?? '', idType: invoice.buyer.idType ?? 'BRN', idValue: invoice.buyer.idValue ?? '',
    address1: invoice.buyer.address1 ?? '', city: invoice.buyer.city ?? '', postcode: invoice.buyer.postcode ?? '',
    stateCode: invoice.buyer.stateCode ?? '', phone: invoice.buyer.phone ?? '', email: invoice.buyer.email ?? '',
  });
  const set = (k: keyof BuyerInput, v: string) => setB((x) => ({ ...x, [k]: v }));
  const named = b.type !== 'general_public';
  const valid = !named || (!!b.name.trim() && !!b.tin.trim());

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/65 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="buyer-title">
      <form className="bg-surface border border-line-subtle shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 space-y-3"
        onSubmit={(e) => { e.preventDefault(); if (valid) void onSave(b); }}>
        <h3 id="buyer-title" className="type-heading-caps text-ink">Buyer for {invoice.invoiceNumber}</h3>
        <FormField id="by-type" label="Buyer">
          {(p) => (
            <select {...p} className={inputClass} value={b.type} onChange={(e) => set('type', e.target.value)}>
              <option value="business">Business / panel (TIN required)</option>
              <option value="individual">Named individual (TIN required)</option>
              <option value="general_public">General public</option>
            </select>
          )}
        </FormField>
        {named && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <FormField id="by-name" label="Name" required>{(p) => <input {...p} className={inputClass} value={b.name} onChange={(e) => set('name', e.target.value)} />}</FormField>
              <FormField id="by-tin" label="TIN" required>{(p) => <input {...p} className={inputClass} value={b.tin} onChange={(e) => set('tin', e.target.value)} />}</FormField>
              <FormField id="by-idtype" label="ID type">
                {(p) => (
                  <select {...p} className={inputClass} value={b.idType} onChange={(e) => set('idType', e.target.value)}>
                    <option value="BRN">Business registration no.</option><option value="NRIC">NRIC</option><option value="PASSPORT">Passport</option><option value="ARMY">Army ID</option>
                  </select>
                )}
              </FormField>
              <FormField id="by-idvalue" label="ID number">{(p) => <input {...p} className={inputClass} value={b.idValue} onChange={(e) => set('idValue', e.target.value)} />}</FormField>
              <FormField id="by-addr" label="Address">{(p) => <input {...p} className={inputClass} value={b.address1} onChange={(e) => set('address1', e.target.value)} />}</FormField>
              <FormField id="by-city" label="City">{(p) => <input {...p} className={inputClass} value={b.city} onChange={(e) => set('city', e.target.value)} />}</FormField>
              <FormField id="by-post" label="Postcode">{(p) => <input {...p} className={inputClass} value={b.postcode} onChange={(e) => set('postcode', e.target.value)} />}</FormField>
              <FormField id="by-state" label="State code">{(p) => <input {...p} className={inputClass} value={b.stateCode} onChange={(e) => set('stateCode', e.target.value)} />}</FormField>
            </div>
          </>
        )}
        <div className="flex justify-end gap-2 pt-2 border-t border-line-subtle">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button type="submit" size="sm" disabled={!valid || saving}>{saving ? 'Saving…' : 'Save buyer'}</Button>
        </div>
      </form>
    </div>
  );
}
