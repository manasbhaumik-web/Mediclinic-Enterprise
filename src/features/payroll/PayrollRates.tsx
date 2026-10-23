import React, { useState } from 'react';
import Button from '../../components/ui/Button';
import { usePayrollActions, usePayrollRates } from '../../hooks/usePayroll';
import { Citizenship, RateRow, SCHEMES, SCHEME_LABELS, Scheme, describeRate } from '../../domain/payroll';
import { errorMessage, inputClass } from './shared';

type Row = ReturnType<typeof usePayrollRates> extends { data?: infer D } ? (D extends (infer R)[] ? R : never) : never;

const EXAMPLE = '{"type":"percent","rate":0.11}';

function eligibilityText(r: RateRow): string {
  const e = r.eligibility ?? {};
  const parts: string[] = [];
  if (e.citizenships?.length) parts.push(e.citizenships.join('/'));
  if (e.minAge !== undefined) parts.push(`age ${e.minAge}+`);
  if (e.maxAge !== undefined) parts.push(`age up to ${e.maxAge}`);
  return parts.length ? parts.join(', ') : 'Everyone';
}

/** Statutory rate tables. Administrators edit and verify them; HR can read them. Editing a rate clears its verification. */
export default function PayrollRates({ role }: { role: 'admin' | 'hr' }) {
  const rates = usePayrollRates();
  const api = usePayrollActions();
  const [editing, setEditing] = useState<Partial<Row> | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const admin = role === 'admin';
  const rows = rates.data ?? [];
  const unverified = rows.filter((r) => r.active && !r.verified).length;

  const attempt = async (fn: () => Promise<unknown>) => {
    setMsg(null);
    try { await fn(); } catch (e) { setMsg({ ok: false, text: errorMessage(e) }); }
  };

  return (
    <div className="space-y-4">
      {rates.error && (
        <p role="alert" className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-2">
          Could not load the rate tables. Has the v20 payroll migration been applied?
        </p>
      )}
      <div role="status" className="text-xs font-medium text-amber-900 bg-amber-50 border border-amber-300 px-3 py-2 leading-relaxed">
        The starting rates were entered from public guidance and have <b>not</b> been checked against the official KWSP, PERKESO and LHDN tables.
        Check each rate, then mark it Verified. A run cannot be approved while it relies on an unverified rate.
        {unverified > 0 && <> Currently <b>{unverified}</b> active rate{unverified === 1 ? ' is' : 's are'} unverified.</>}
        {' '}Foreign workers, people aged 60 and over, and PCB have no starting rates: add rows for them if they apply.
      </div>

      {admin && <div><Button size="sm" onClick={() => setEditing({ scheme: 'epf_employee', label: '', effectiveFrom: new Date().toISOString().slice(0, 10), priority: 0, eligibility: {}, active: true })}>Add rate</Button></div>}

      <div className="bg-surface border border-line-subtle overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-2xs uppercase tracking-wider text-subtle border-b border-line-subtle">
              <th className="p-3">Scheme</th><th className="p-3">Rule</th><th className="p-3">Applies to</th><th className="p-3">From</th><th className="p-3">Status</th>{admin && <th className="p-3" />}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className={`border-b border-line-subtle ${r.active ? '' : 'opacity-50'}`}>
                <td className="p-3 font-bold text-ink">{SCHEME_LABELS[r.scheme]}<div className="font-medium text-subtle">{r.label}</div></td>
                <td className="p-3">{describeRate(r.config)}</td>
                <td className="p-3">{eligibilityText(r)}</td>
                <td className="p-3 font-mono">{r.effectiveFrom}</td>
                <td className="p-3">
                  <span className={`text-2xs font-bold px-2 py-0.5 border uppercase ${r.verified ? 'chip-ok' : 'chip-warn'}`}>{r.verified ? 'Verified' : 'Unverified'}</span>
                  {!r.active && <span className="ml-2 text-subtle">off</span>}
                </td>
                {admin && (
                  <td className="p-3 space-x-3 whitespace-nowrap">
                    <button type="button" className="font-bold text-accent cursor-pointer" onClick={() => setEditing(r)}>Edit</button>
                    <button type="button" className="font-bold text-accent cursor-pointer" onClick={() => attempt(() => api.setVerified.mutateAsync({ id: r.id, verified: !r.verified }))}>{r.verified ? 'Unverify' : 'Mark verified'}</button>
                    <button type="button" className="font-bold text-muted cursor-pointer" onClick={() => attempt(() => api.setActive.mutateAsync({ id: r.id, active: !r.active }))}>{r.active ? 'Turn off' : 'Turn on'}</button>
                  </td>
                )}
              </tr>
            ))}
            {rows.length === 0 && <tr><td className="p-4 text-subtle" colSpan={6}>No rates yet.</td></tr>}
          </tbody>
        </table>
      </div>
      {msg && <p role="alert" className="text-xs font-bold text-rose-700">{msg.text}</p>}
      {editing && <RateEditor initial={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

function RateEditor({ initial, onClose }: { initial: Partial<Row>; onClose: () => void }) {
  const api = usePayrollActions();
  const e = initial.eligibility ?? {};
  const [f, setF] = useState({
    scheme: (initial.scheme ?? 'epf_employee') as Scheme, label: initial.label ?? '', effectiveFrom: initial.effectiveFrom ?? '', priority: String(initial.priority ?? 0),
    minAge: e.minAge === undefined ? '' : String(e.minAge), maxAge: e.maxAge === undefined ? '' : String(e.maxAge),
    citizenships: (e.citizenships ?? []) as Citizenship[], config: initial.config ? JSON.stringify(initial.config, null, 2) : EXAMPLE, note: initial.note ?? '',
  });
  const [err, setErr] = useState<string | null>(null);
  const toggleCit = (c: Citizenship) => setF({ ...f, citizenships: f.citizenships.includes(c) ? f.citizenships.filter((x) => x !== c) : [...f.citizenships, c] });

  const save = async () => {
    let config: RateRow['config'];
    try { config = JSON.parse(f.config); } catch { setErr('The rule is not valid JSON.'); return; }
    if (!config || !['percent', 'tiered', 'bands', 'none'].includes((config as { type?: string }).type ?? '')) { setErr('The rule needs a "type" of percent, tiered, bands or none.'); return; }
    if (!f.label.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(f.effectiveFrom)) { setErr('Give the rate a name and a start date (YYYY-MM-DD).'); return; }
    const eligibility: RateRow['eligibility'] = {};
    if (f.minAge !== '') eligibility.minAge = Number(f.minAge);
    if (f.maxAge !== '') eligibility.maxAge = Number(f.maxAge);
    if (f.citizenships.length) eligibility.citizenships = f.citizenships;
    try {
      await api.saveRate.mutateAsync({ id: initial.id, scheme: f.scheme, label: f.label.trim(), effectiveFrom: f.effectiveFrom, priority: Number(f.priority) || 0, eligibility, config, active: initial.active ?? true, note: f.note.trim() || null });
      onClose();
    } catch (x) { setErr(errorMessage(x)); }
  };

  return (
    <div role="dialog" aria-modal="true" aria-label="Edit rate" className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-surface border border-line w-full max-w-2xl max-h-[90vh] overflow-y-auto p-5 space-y-3">
        <h3 className="type-heading-caps text-ink">{initial.id ? 'Edit rate' : 'Add rate'}</h3>
        {initial.id && <p className="text-xs text-amber-800 bg-amber-50 border border-amber-300 px-3 py-2">Saving a change marks this rate Unverified until you verify it again.</p>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="block space-y-1"><span className="text-2xs font-bold uppercase text-subtle">Scheme</span>
            <select className={inputClass} value={f.scheme} onChange={(ev) => setF({ ...f, scheme: ev.target.value as Scheme })}>{SCHEMES.map((s) => <option key={s} value={s}>{SCHEME_LABELS[s]}</option>)}</select></label>
          <label className="block space-y-1"><span className="text-2xs font-bold uppercase text-subtle">Name</span>
            <input className={inputClass} value={f.label} onChange={(ev) => setF({ ...f, label: ev.target.value })} /></label>
          <label className="block space-y-1"><span className="text-2xs font-bold uppercase text-subtle">Effective from</span>
            <input className={inputClass} type="date" value={f.effectiveFrom} onChange={(ev) => setF({ ...f, effectiveFrom: ev.target.value })} /></label>
          <label className="block space-y-1"><span className="text-2xs font-bold uppercase text-subtle">Priority (higher wins)</span>
            <input className={inputClass} type="number" value={f.priority} onChange={(ev) => setF({ ...f, priority: ev.target.value })} /></label>
          <label className="block space-y-1"><span className="text-2xs font-bold uppercase text-subtle">Minimum age</span>
            <input className={inputClass} type="number" value={f.minAge} onChange={(ev) => setF({ ...f, minAge: ev.target.value })} /></label>
          <label className="block space-y-1"><span className="text-2xs font-bold uppercase text-subtle">Maximum age</span>
            <input className={inputClass} type="number" value={f.maxAge} onChange={(ev) => setF({ ...f, maxAge: ev.target.value })} /></label>
        </div>
        <div className="flex gap-4 text-xs font-medium">
          {(['citizen', 'pr', 'foreign'] as Citizenship[]).map((c) => (
            <label key={c} className="flex items-center gap-1"><input type="checkbox" checked={f.citizenships.includes(c)} onChange={() => toggleCit(c)} /> {c === 'pr' ? 'Permanent resident' : c === 'citizen' ? 'Citizen' : 'Foreign worker'}</label>
          ))}
          <span className="text-subtle">(none ticked = everyone)</span>
        </div>
        <label className="block space-y-1"><span className="text-2xs font-bold uppercase text-subtle">Rule (JSON)</span>
          <textarea className={`${inputClass} font-mono h-40`} value={f.config} onChange={(ev) => setF({ ...f, config: ev.target.value })} spellCheck={false} /></label>
        <p className="text-2xs text-subtle leading-relaxed">
          Examples: <code>{EXAMPLE}</code>; with a wage ceiling <code>{'{"type":"percent","rate":0.005,"ceiling":6000}'}</code>; two rates by wage
          <code>{' {"type":"tiered","tiers":[{"upTo":5000,"rate":0.13},{"upTo":null,"rate":0.12}],"roundUpToRinggit":true}'}</code>; or <code>{'{"type":"none"}'}</code>.
        </p>
        <label className="block space-y-1"><span className="text-2xs font-bold uppercase text-subtle">Source / note</span>
          <input className={inputClass} value={f.note} onChange={(ev) => setF({ ...f, note: ev.target.value })} placeholder="Where this rate comes from" /></label>
        {err && <p role="alert" className="text-xs font-bold text-rose-700">{err}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={save} disabled={api.saveRate.isPending}>Save</Button>
        </div>
      </div>
    </div>
  );
}
