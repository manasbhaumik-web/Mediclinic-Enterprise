import React, { useState } from 'react';
import Button from '../ui/Button';
import { usePayrollActions, usePayrollRuns } from '../../hooks/usePayroll';
import { STATUS_STYLE, monthLabel } from '../../domain/payroll';
import RunDetail from './RunDetail';
import { errorMessage, inputClass, myr, toneClass } from './shared';

const thisMonth = () => new Date().toISOString().slice(0, 7);

export default function PayrollRuns({ role }: { role: 'admin' | 'hr' }) {
  const runs = usePayrollRuns();
  const api = usePayrollActions();
  const [selected, setSelected] = useState<string | null>(null);
  const [month, setMonth] = useState(thisMonth());
  const [workingDays, setWorkingDays] = useState('26');
  const [hours, setHours] = useState('8');
  const [msg, setMsg] = useState<string | null>(null);

  if (selected) return <RunDetail runId={selected} role={role} onBack={() => setSelected(null)} />;

  const create = async () => {
    setMsg(null);
    try {
      const res = await api.call.mutateAsync({ action: 'create_run', month, workingDays: Number(workingDays), hoursPerDay: Number(hours) });
      if (res.ok === false) setMsg(res.message ?? 'Could not create the run.');
      else if (res.runId) setSelected(res.runId);
    } catch (e) { setMsg(errorMessage(e)); }
  };

  return (
    <div className="space-y-4">
      {runs.error && (
        <p role="alert" className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-2">
          Could not load payroll runs. Has the v20 payroll migration been applied?
        </p>
      )}

      <div className="bg-surface border border-line-subtle p-4 space-y-3">
        <h3 className="type-heading-caps text-ink">Start a new run</h3>
        <div className="flex flex-wrap items-end gap-3">
          <label className="space-y-1 block"><span className="text-2xs font-bold uppercase text-subtle">Month</span>
            <input className={`${inputClass} !w-40`} type="month" value={month} onChange={(e) => setMonth(e.target.value)} /></label>
          <label className="space-y-1 block"><span className="text-2xs font-bold uppercase text-subtle">Working days / month</span>
            <input className={`${inputClass} !w-32`} type="number" min="1" max="31" value={workingDays} onChange={(e) => setWorkingDays(e.target.value)} /></label>
          <label className="space-y-1 block"><span className="text-2xs font-bold uppercase text-subtle">Hours / day</span>
            <input className={`${inputClass} !w-24`} type="number" min="1" max="24" step="0.5" value={hours} onChange={(e) => setHours(e.target.value)} /></label>
          <Button size="sm" onClick={create} disabled={api.call.isPending || !month}>Create run</Button>
        </div>
        <p className="text-2xs text-subtle">Working days and hours set the daily and hourly rate used for unpaid leave and overtime. Every active person gets a payslip.</p>
        {msg && <p role="alert" className="text-xs font-bold text-rose-700 whitespace-pre-line">{msg}</p>}
      </div>

      <div className="bg-surface border border-line-subtle overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-2xs uppercase tracking-wider text-subtle border-b border-line-subtle">
              <th className="p-3">Month</th><th className="p-3">Status</th><th className="p-3 text-right">Gross</th><th className="p-3 text-right">Net pay</th><th className="p-3 text-right">Employer cost</th><th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {(runs.data ?? []).map((r) => {
              const st = STATUS_STYLE[r.status];
              return (
                <tr key={r.id} className="border-b border-line-subtle">
                  <td className="p-3 font-bold text-ink">{monthLabel(r.periodMonth)}</td>
                  <td className="p-3"><span className={`text-2xs font-bold px-2 py-0.5 border uppercase ${toneClass[st.tone]}`}>{st.label}</span></td>
                  <td className="p-3 text-right font-mono">{myr(r.totals.gross)}</td>
                  <td className="p-3 text-right font-mono">{myr(r.totals.netPay)}</td>
                  <td className="p-3 text-right font-mono">{myr(r.totals.employerCost)}</td>
                  <td className="p-3 text-right"><button type="button" className="font-bold text-accent cursor-pointer" onClick={() => setSelected(r.id)}>Open</button></td>
                </tr>
              );
            })}
            {(runs.data ?? []).length === 0 && <tr><td className="p-4 text-subtle" colSpan={6}>No payroll runs yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
