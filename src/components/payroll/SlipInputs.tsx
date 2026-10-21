import React, { useState } from 'react';
import Button from '../ui/Button';
import { usePayrollActions } from '../../hooks/usePayroll';
import { PayInputs, Payslip, PayrollRun, validateInputs } from '../../domain/payroll';
import { errorMessage, inputClass } from './shared';

interface Line { label: string; amount: string; contributory: boolean }
interface Ot { hours: string; multiplier: string; label: string }

/** This month's one-off adjustments for one person: extra allowances, deductions, overtime, unpaid leave and a manual PCB. */
export default function SlipInputs({ slip, run, onClose }: { slip: Payslip; run: PayrollRun; onClose: () => void }) {
  const api = usePayrollActions();
  const i = slip.inputs;
  const [allow, setAllow] = useState<Line[]>((i.allowances ?? []).map((l) => ({ label: l.label, amount: String(l.amount), contributory: !!l.contributory })));
  const [ded, setDed] = useState<Line[]>((i.deductions ?? []).map((l) => ({ label: l.label, amount: String(l.amount), contributory: false })));
  const [ot, setOt] = useState<Ot[]>((i.overtime ?? []).map((o) => ({ hours: String(o.hours), multiplier: String(o.multiplier), label: o.label ?? '' })));
  const [leave, setLeave] = useState(String(i.unpaidLeaveDays ?? 0));
  const [pcb, setPcb] = useState(i.pcbOverride === null || i.pcbOverride === undefined ? '' : String(i.pcbOverride));
  const [err, setErr] = useState<string | null>(null);

  const build = (): PayInputs => ({
    allowances: allow.filter((l) => l.label.trim() || l.amount).map((l) => ({ label: l.label.trim(), amount: Number(l.amount), contributory: l.contributory })),
    deductions: ded.filter((l) => l.label.trim() || l.amount).map((l) => ({ label: l.label.trim(), amount: Number(l.amount) })),
    overtime: ot.filter((o) => o.hours).map((o) => ({ hours: Number(o.hours), multiplier: Number(o.multiplier), label: o.label.trim() || undefined })),
    unpaidLeaveDays: Number(leave) || 0,
    pcbOverride: pcb.trim() === '' ? null : Number(pcb),
  });

  const save = async () => {
    const inputs = build();
    const problems = validateInputs(inputs, run.workingDays);
    if (problems.length) { setErr(problems.join(' ')); return; }
    try {
      const res = await api.call.mutateAsync({ action: 'save_inputs', payslipId: slip.id, inputs });
      if (res.ok === false) setErr(res.message ?? 'Could not save.'); else onClose();
    } catch (e) { setErr(errorMessage(e)); }
  };

  const lineRows = (rows: Line[], set: (r: Line[]) => void, withContrib: boolean, kind: string) => (
    <div className="space-y-2">
      {rows.map((r, n) => (
        <div key={n} className="flex flex-wrap items-center gap-2">
          <input className={`${inputClass} !w-48`} placeholder="Name" aria-label={`${kind} name`} value={r.label} onChange={(e) => set(rows.map((x, m) => (m === n ? { ...x, label: e.target.value } : x)))} />
          <input className={`${inputClass} !w-28`} type="number" min="0" step="0.01" placeholder="Amount" aria-label={`${kind} amount`} value={r.amount} onChange={(e) => set(rows.map((x, m) => (m === n ? { ...x, amount: e.target.value } : x)))} />
          {withContrib && <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={r.contributory} onChange={(e) => set(rows.map((x, m) => (m === n ? { ...x, contributory: e.target.checked } : x)))} /> Counts for EPF/SOCSO/EIS</label>}
          <button type="button" className="text-rose-700 text-xs font-bold cursor-pointer" onClick={() => set(rows.filter((_, m) => m !== n))}>Remove</button>
        </div>
      ))}
      <button type="button" className="text-xs font-bold text-accent cursor-pointer" onClick={() => set([...rows, { label: '', amount: '', contributory: false }])}>+ Add {kind}</button>
    </div>
  );

  return (
    <div role="dialog" aria-modal="true" aria-label={`Adjust pay for ${slip.employee.name}`} className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-surface border border-line w-full max-w-2xl max-h-[90vh] overflow-y-auto p-5 space-y-4">
        <h3 className="type-heading-caps text-ink">Adjust pay: {slip.employee.name}</h3>
        <p className="text-xs text-slate-600">One-off items for this month only. Recurring allowances and deductions are set in Pay profiles.</p>

        <section className="space-y-2"><h4 className="text-xs font-bold text-ink">Extra allowances</h4>{lineRows(allow, setAllow, true, 'allowance')}</section>
        <section className="space-y-2"><h4 className="text-xs font-bold text-ink">Other deductions</h4>{lineRows(ded, setDed, false, 'deduction')}</section>

        <section className="space-y-2">
          <h4 className="text-xs font-bold text-ink">Overtime</h4>
          {ot.map((o, n) => (
            <div key={n} className="flex flex-wrap items-center gap-2">
              <input className={`${inputClass} !w-24`} type="number" min="0" step="0.5" placeholder="Hours" aria-label="Overtime hours" value={o.hours} onChange={(e) => setOt(ot.map((x, m) => (m === n ? { ...x, hours: e.target.value } : x)))} />
              <select className={`${inputClass} !w-40`} aria-label="Overtime rate" value={o.multiplier} onChange={(e) => setOt(ot.map((x, m) => (m === n ? { ...x, multiplier: e.target.value } : x)))}>
                <option value="1.5">1.5x (normal day)</option><option value="2">2x (rest day)</option><option value="3">3x (public holiday)</option>
              </select>
              <input className={`${inputClass} !w-40`} placeholder="Note (optional)" aria-label="Overtime note" value={o.label} onChange={(e) => setOt(ot.map((x, m) => (m === n ? { ...x, label: e.target.value } : x)))} />
              <button type="button" className="text-rose-700 text-xs font-bold cursor-pointer" onClick={() => setOt(ot.filter((_, m) => m !== n))}>Remove</button>
            </div>
          ))}
          <button type="button" className="text-xs font-bold text-accent cursor-pointer" onClick={() => setOt([...ot, { hours: '', multiplier: '1.5', label: '' }])}>+ Add overtime</button>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="block space-y-1"><span className="text-2xs font-bold uppercase text-slate-500">Unpaid leave (days)</span>
            <input className={inputClass} type="number" min="0" step="0.5" value={leave} onChange={(e) => setLeave(e.target.value)} /></label>
          <label className="block space-y-1"><span className="text-2xs font-bold uppercase text-slate-500">PCB (monthly tax) override</span>
            <input className={inputClass} type="number" min="0" step="0.01" placeholder="Blank = use the rate table" value={pcb} onChange={(e) => setPcb(e.target.value)} /></label>
        </div>
        <p className="text-2xs text-slate-500">There is no built-in PCB table. Enter the amount from LHDN's calculator or your payroll provider, or add PCB wage bands under Statutory rates.</p>

        {err && <p role="alert" className="text-xs font-bold text-rose-700">{err}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={save} disabled={api.call.isPending}>Save and recalculate</Button>
        </div>
      </div>
    </div>
  );
}
