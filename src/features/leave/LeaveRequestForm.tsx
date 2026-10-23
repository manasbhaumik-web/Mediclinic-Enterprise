import React, { useEffect, useState } from 'react';
import Button from '../../components/ui/Button';
import { useLeaveActions, useLeaveReference } from '../../hooks/useLeave';
import { errorMessage, inputClass } from '../payroll/shared';

export interface PersonOption { id: string; name: string }

/** File a leave request. Managers pick the person; employees file for themselves. The server checks every rule. */
export default function LeaveRequestForm({ people, onDone }: { people?: PersonOption[]; onDone: () => void }) {
  const { types } = useLeaveReference();
  const api = useLeaveActions();
  const [staffId, setStaffId] = useState('');
  const [leaveType, setLeaveType] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [half, setHalf] = useState<'' | 'am' | 'pm'>('');
  const [reason, setReason] = useState('');
  const [info, setInfo] = useState<{ valid: boolean; text: string; warnings: string[] } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const activeTypes = (types.data ?? []).filter((t) => t.active);
  const needsPerson = !!people;

  // Preview the days and the balance check as the form is filled in.
  useEffect(() => {
    setInfo(null);
    if (!leaveType || !start || !end || (needsPerson && !staffId)) return;
    const t = setTimeout(async () => {
      try {
        const r = await api.preview({ leaveType, startDate: start, endDate: end, halfDay: half || null, ...(needsPerson ? { staffId } : {}) });
        setInfo(r.valid ? { valid: true, text: `${r.days} working day${r.days === 1 ? '' : 's'}`, warnings: r.warnings ?? [] } : { valid: false, text: r.message ?? 'Cannot be filed.', warnings: [] });
      } catch (e) { setInfo({ valid: false, text: errorMessage(e), warnings: [] }); }
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leaveType, start, end, half, staffId]);

  const submit = async () => {
    setErr(null);
    try {
      const r = await api.call.mutateAsync({ action: 'request', leaveType, startDate: start, endDate: end, halfDay: half || null, reason, ...(needsPerson ? { staffId } : {}) });
      if (r.ok === false) setErr(r.message ?? 'Could not file the request.');
      else onDone();
    } catch (e) { setErr(errorMessage(e)); }
  };

  const singleDay = !!start && start === end;

  return (
    <div className="bg-surface border border-line-subtle p-4 space-y-3">
      <h3 className="type-heading-caps text-ink">New leave request</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {needsPerson && (
          <label className="block space-y-1"><span className="text-2xs font-bold uppercase text-subtle">Employee</span>
            <select className={inputClass} value={staffId} onChange={(e) => setStaffId(e.target.value)}>
              <option value="">Choose…</option>
              {people!.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select></label>
        )}
        <label className="block space-y-1"><span className="text-2xs font-bold uppercase text-subtle">Leave type</span>
          <select className={inputClass} value={leaveType} onChange={(e) => setLeaveType(e.target.value)}>
            <option value="">Choose…</option>
            {activeTypes.map((t) => <option key={t.code} value={t.code}>{t.name}{t.paid ? '' : ' (unpaid)'}</option>)}
          </select></label>
        <label className="block space-y-1"><span className="text-2xs font-bold uppercase text-subtle">From</span>
          <input className={inputClass} type="date" value={start} onChange={(e) => { setStart(e.target.value); if (!end || end < e.target.value) setEnd(e.target.value); }} /></label>
        <label className="block space-y-1"><span className="text-2xs font-bold uppercase text-subtle">To</span>
          <input className={inputClass} type="date" min={start || undefined} value={end} onChange={(e) => setEnd(e.target.value)} /></label>
        {singleDay && (
          <label className="block space-y-1"><span className="text-2xs font-bold uppercase text-subtle">Length</span>
            <select className={inputClass} value={half} onChange={(e) => setHalf(e.target.value as '' | 'am' | 'pm')}>
              <option value="">Full day</option><option value="am">Half day (morning)</option><option value="pm">Half day (afternoon)</option>
            </select></label>
        )}
      </div>
      <label className="block space-y-1"><span className="text-2xs font-bold uppercase text-subtle">Reason (optional)</span>
        <input className={inputClass} value={reason} maxLength={500} onChange={(e) => setReason(e.target.value)} /></label>

      {info && (
        <div role="status" className={`text-xs font-medium border px-3 py-2 ${info.valid ? 'chip-ok' : 'chip-danger'}`}>
          {info.text}
          {info.warnings.map((w, i) => <div key={i} className="text-amber-800">{w}</div>)}
        </div>
      )}
      {err && <p role="alert" className="text-xs font-bold text-rose-700">{err}</p>}
      <div className="flex gap-2">
        <Button size="sm" onClick={submit} disabled={api.call.isPending || !leaveType || !start || !end || (needsPerson && !staffId) || info?.valid === false}>File request</Button>
        <Button variant="outline" size="sm" onClick={onDone}>Cancel</Button>
      </div>
    </div>
  );
}
