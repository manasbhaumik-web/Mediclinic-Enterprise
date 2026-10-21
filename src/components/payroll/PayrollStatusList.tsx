import React, { useState } from 'react';
import { usePayProfiles, usePayrollRun, usePayrollRuns } from '../../hooks/usePayroll';
import { RunStatus, STATUS_STYLE, monthLabel } from '../../domain/payroll';
import { myr, toneClass } from './shared';

const thisMonth = () => new Date().toISOString().slice(0, 7) + '-01';

/** Read-only list of active employees and whether their salary for a month has been paid. */
export default function PayrollStatusList() {
  const runs = usePayrollRuns();
  const { profiles } = usePayProfiles();
  const live = (runs.data ?? []).filter((r) => r.status !== 'cancelled');
  const months = Array.from(new Set([thisMonth(), ...live.map((r) => r.periodMonth)])).sort().reverse();
  const [month, setMonth] = useState(months[0]);

  const run = live.find((r) => r.periodMonth === month) ?? null;
  const { slips } = usePayrollRun(run?.id ?? null);
  const slipByStaff = new Map((slips.data ?? []).map((s) => [s.staffId, s]));
  const people = (profiles.data ?? []).filter((p) => p.status === 'Active');

  const statusFor = (staffId: string): { label: string; tone: keyof typeof toneClass } => {
    if (!run) return { label: 'No payroll run', tone: 'idle' };
    if (!slipByStaff.has(staffId)) return { label: 'Not in this run', tone: 'idle' };
    const st = STATUS_STYLE[run.status as RunStatus];
    return { label: run.status === 'paid' ? 'Paid' : run.status === 'approved' ? 'Approved, unpaid' : st.label, tone: st.tone };
  };

  const paidCount = run?.status === 'paid' ? slipByStaff.size : 0;

  return (
    <div className="space-y-3 animate-fadeIn">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-xs font-bold text-slate-600">
          Month
          <select className="px-3 py-2 bg-surface border border-line-subtle text-xs font-medium text-ink" value={month} onChange={(e) => setMonth(e.target.value)}>
            {months.map((m) => <option key={m} value={m}>{monthLabel(m)}</option>)}
          </select>
        </label>
        <span className="text-xs text-slate-500">
          {run ? `${monthLabel(month)}: ${STATUS_STYLE[run.status].label}${run.status === 'paid' ? `, ${paidCount} paid${run.paidOn ? ` on ${run.paidOn}` : ''}` : ''}` : `No payroll run for ${monthLabel(month)} yet. Create one under Finance > Payroll.`}
        </span>
      </div>

      {(runs.error || profiles.error) && (
        <p role="alert" className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-2">Could not load payroll data.</p>
      )}

      <div className="bg-surface border border-line-subtle rounded-none shadow-2xs overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-surface-accent text-ink font-bold uppercase text-2xs tracking-wider border-b border-line">
            <tr><th className="px-6 py-3.5">Employee</th><th className="px-6 py-3.5">Role</th><th className="px-6 py-3.5 text-right">Net pay</th><th className="px-6 py-3.5">Salary status</th></tr>
          </thead>
          <tbody className="divide-y divide-line-subtle">
            {people.map((p) => {
              const st = statusFor(p.id);
              const slip = slipByStaff.get(p.id);
              return (
                <tr key={p.id} className="hover:bg-surface-muted">
                  <td className="px-6 py-3 font-bold text-ink">{p.name}</td>
                  <td className="px-6 py-3 text-slate-600">{p.role}</td>
                  <td className="px-6 py-3 text-right font-mono">{slip ? myr(slip.netPay) : '–'}</td>
                  <td className="px-6 py-3"><span className={`text-2xs font-bold px-2 py-0.5 border uppercase ${toneClass[st.tone]}`}>{st.label}</span></td>
                </tr>
              );
            })}
            {people.length === 0 && <tr><td className="px-6 py-4 text-slate-500" colSpan={4}>No active staff.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
