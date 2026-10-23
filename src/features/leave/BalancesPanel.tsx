import React, { useState } from 'react';
import Button from '../../components/ui/Button';
import { useBalances, useLeaveActions, useStaffForLeave } from '../../hooks/useLeave';
import { errorMessage, inputClass } from '../payroll/shared';

const val = (n: number | null) => (n === null ? 'No limit' : String(n));

/** Leave balances per person, derived from the entitlement rules and approved requests. Also where the hire date is set. */
export default function BalancesPanel() {
  const staff = useStaffForLeave();
  const api = useLeaveActions();
  const [staffId, setStaffId] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const person = (staff.data ?? []).find((s) => s.id === staffId);
  const balances = useBalances(staffId || null, year);
  const [hire, setHire] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const missingHire = (staff.data ?? []).filter((s) => !s.hireDate).length;

  const pickPerson = (id: string) => { setStaffId(id); setHire((staff.data ?? []).find((s) => s.id === id)?.hireDate ?? ''); setMsg(null); };
  const saveHire = async () => {
    try {
      await api.setHireDate.mutateAsync({ staffId, hireDate: hire || null });
      setMsg({ ok: true, text: 'Hire date saved.' });
    } catch (e) { setMsg({ ok: false, text: errorMessage(e) }); }
  };

  return (
    <div className="space-y-4">
      {missingHire > 0 && (
        <p role="status" className="text-xs font-medium text-amber-900 bg-amber-50 border border-amber-300 px-3 py-2">
          {missingHire} active staff have no hire date. Until it is set, service-based entitlements use the lowest tier and rules that need length of service do not apply.
        </p>
      )}
      <div className="flex flex-wrap items-end gap-3">
        <label className="block space-y-1"><span className="text-2xs font-bold uppercase text-subtle">Employee</span>
          <select className={`${inputClass} !w-64`} value={staffId} onChange={(e) => pickPerson(e.target.value)}>
            <option value="">Choose…</option>
            {(staff.data ?? []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select></label>
        <label className="block space-y-1"><span className="text-2xs font-bold uppercase text-subtle">Year</span>
          <input className={`${inputClass} !w-24`} type="number" min="2020" max="2100" value={year} onChange={(e) => setYear(Number(e.target.value) || year)} /></label>
        {person && (
          <>
            <label className="block space-y-1"><span className="text-2xs font-bold uppercase text-subtle">Hire date</span>
              <input className={`${inputClass} !w-44`} type="date" value={hire} onChange={(e) => setHire(e.target.value)} /></label>
            <Button variant="outline" size="sm" onClick={saveHire} disabled={api.setHireDate.isPending}>Save hire date</Button>
          </>
        )}
      </div>
      {msg && <p role="status" className={`text-xs font-bold ${msg.ok ? 'text-emerald-700' : 'text-rose-700'}`}>{msg.text}</p>}

      {staffId && balances.data?.balances && (
        <div className="bg-surface border border-line-subtle overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-2xs uppercase tracking-wider text-subtle border-b border-line-subtle">
                <th className="p-3">Leave type</th><th className="p-3 text-right">Entitled</th><th className="p-3 text-right">Taken</th><th className="p-3 text-right">Awaiting approval</th><th className="p-3 text-right">Remaining</th><th className="p-3">Notes</th>
              </tr>
            </thead>
            <tbody>
              {balances.data.balances.map((b) => (
                <tr key={b.code} className="border-b border-line-subtle">
                  <td className="p-3 font-bold text-ink">{b.name}{!b.paid && <span className="ml-1 text-amber-700">(unpaid)</span>}</td>
                  <td className="p-3 text-right font-mono">{b.balanceLimited ? (b.hasRule ? val(b.entitled) : '–') : 'No limit'}</td>
                  <td className="p-3 text-right font-mono">{b.taken}</td>
                  <td className="p-3 text-right font-mono">{b.pending}</td>
                  <td className="p-3 text-right font-mono font-bold">{b.balanceLimited && b.hasRule ? val(b.remaining) : '–'}</td>
                  <td className="p-3 text-subtle">{[...b.warnings, b.hasRule && b.balanceLimited && !b.verified ? 'Rule not verified.' : ''].filter(Boolean).join(' ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {staffId && balances.data?.ok === false && <p role="alert" className="text-xs font-bold text-rose-700">{balances.data.message}</p>}
      {staffId && balances.error && <p role="alert" className="text-xs font-bold text-rose-700">{errorMessage(balances.error)}</p>}
    </div>
  );
}
