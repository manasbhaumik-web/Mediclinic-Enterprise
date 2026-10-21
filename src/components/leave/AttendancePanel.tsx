import React, { useMemo, useState } from 'react';
import Button from '../ui/Button';
import { useApprovedLeaveDays, useAttendance, useLeaveActions, useLeaveReference, useStaffForLeave } from '../../hooks/useLeave';
import { ATTENDANCE_LABEL, AttendanceRecord, AttendanceStatus, DEFAULT_SETTINGS, addDays, localParts, summariseAttendance } from '../../domain/leave';
import { errorMessage, inputClass } from '../payroll/shared';

const monthStart = (d: string) => d.slice(0, 7) + '-01';
const monthEnd = (start: string) => addDays(addDays(start, 31).slice(0, 7) + '-01', -1);
const monthLabel = (start: string) => new Date(start + 'T00:00:00Z').toLocaleString('en-MY', { month: 'long', year: 'numeric', timeZone: 'UTC' });
const timeOf = (iso: string | null, tz: string) => (iso ? localParts(iso, tz).time : '');

/** Monthly attendance for every active employee. The rate is calculated from the daily records, never stored. */
export default function AttendancePanel() {
  const { settings, holidays } = useLeaveReference();
  const cfg = settings.data ?? DEFAULT_SETTINGS;
  const today = localParts(Date.now(), cfg.timezone).date;
  const [month, setMonth] = useState(monthStart(today));
  const to = monthEnd(month);
  const staff = useStaffForLeave();
  const records = useAttendance(month, to);
  const leave = useApprovedLeaveDays(month, to);
  const [editing, setEditing] = useState<{ staffId: string; name: string } | null>(null);

  const holidaySet = useMemo(() => new Set((holidays.data ?? []).map((h) => h.date)), [holidays.data]);
  const months = Array.from({ length: 12 }, (_, i) => { let m = monthStart(today); for (let k = 0; k < i; k++) m = monthStart(addDays(m, -1)); return m; });

  const rows = (staff.data ?? []).map((p) => {
    const recs = (records.data ?? []).filter((r) => r.staffId === p.id).map((r) => ({ date: r.date, status: r.status }));
    const days = (leave.data ?? []).filter((d) => d.staffId === p.id);
    return { p, s: summariseAttendance(recs, days, cfg, holidaySet, month, to, today) };
  });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-xs font-bold text-slate-600">Month
          <select className="px-3 py-2 bg-surface border border-line-subtle text-xs font-medium text-ink" value={month} onChange={(e) => setMonth(e.target.value)}>
            {months.map((m) => <option key={m} value={m}>{monthLabel(m)}</option>)}
          </select></label>
        <p className="text-xs text-slate-500 max-w-xl">Rate = days attended / days recorded. Approved leave and public holidays are left out. Days with no record are shown as unrecorded and do not count for or against anyone.</p>
      </div>

      {(records.error || staff.error) && <p role="alert" className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-2">Could not load attendance. Has the v21 leave migration been applied?</p>}

      <div className="bg-surface border border-line-subtle overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-2xs uppercase tracking-wider text-slate-500 border-b border-line-subtle">
              <th className="p-3">Employee</th><th className="p-3 text-right">Rate</th><th className="p-3 text-right">Attended</th><th className="p-3 text-right">Late</th><th className="p-3 text-right">Absent</th><th className="p-3 text-right">On leave</th><th className="p-3 text-right">Unrecorded</th><th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {rows.map(({ p, s }) => (
              <tr key={p.id} className="border-b border-line-subtle">
                <td className="p-3 font-bold text-ink">{p.name}</td>
                <td className="p-3 text-right font-mono font-bold">{s.rate === null ? '–' : `${s.rate}%`}</td>
                <td className="p-3 text-right font-mono">{s.attended}</td>
                <td className="p-3 text-right font-mono">{s.late}</td>
                <td className="p-3 text-right font-mono">{s.absent}</td>
                <td className="p-3 text-right font-mono">{s.leaveDays}</td>
                <td className={`p-3 text-right font-mono ${s.unrecorded > 0 ? 'text-amber-700 font-bold' : ''}`}>{s.unrecorded}</td>
                <td className="p-3 text-right"><button type="button" className="font-bold text-accent cursor-pointer" onClick={() => setEditing({ staffId: p.id, name: p.name })}>Record / correct</button></td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td className="p-4 text-slate-500" colSpan={8}>No active staff.</td></tr>}
          </tbody>
        </table>
      </div>
      {editing && <RecordDialog staffId={editing.staffId} name={editing.name} month={month} today={today} tz={cfg.timezone} records={(records.data ?? []).filter((r) => r.staffId === editing.staffId)} onClose={() => setEditing(null)} />}
    </div>
  );
}

function RecordDialog({ staffId, name, month, today, tz, records, onClose }: { staffId: string; name: string; month: string; today: string; tz: string; records: AttendanceRecord[]; onClose: () => void }) {
  const api = useLeaveActions();
  const [date, setDate] = useState(today.slice(0, 7) === month.slice(0, 7) ? today : month);
  const existing = records.find((r) => r.date === date);
  const [status, setStatus] = useState<AttendanceStatus>('present');
  const [clockIn, setClockIn] = useState('');
  const [clockOut, setClockOut] = useState('');
  const [note, setNote] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const pick = (r: AttendanceRecord) => { setDate(r.date); setStatus(r.status); setClockIn(timeOf(r.clockIn, tz)); setClockOut(timeOf(r.clockOut, tz)); };

  const run = async (body: Record<string, unknown>) => {
    setMsg(null);
    try {
      const r = await api.call.mutateAsync({ staffId, date, note, ...body });
      setMsg({ ok: r.ok !== false, text: r.message ?? 'Done.' });
      if (r.ok !== false) setNote('');
    } catch (e) { setMsg({ ok: false, text: errorMessage(e) }); }
  };

  return (
    <div role="dialog" aria-modal="true" aria-label={`Attendance for ${name}`} className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-surface border border-line w-full max-w-xl max-h-[90vh] overflow-y-auto p-5 space-y-3">
        <h3 className="type-heading-caps text-ink">Attendance: {name}</h3>
        {records.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {[...records].sort((a, b) => a.date.localeCompare(b.date)).map((r) => (
              <button key={r.id} type="button" onClick={() => pick(r)} className={`text-2xs font-bold px-2 py-1 border cursor-pointer ${r.date === date ? 'border-brand bg-surface-accent' : 'border-line-subtle'}`}>
                {r.date.slice(8)} {ATTENDANCE_LABEL[r.status]}
              </button>
            ))}
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <label className="block space-y-1"><span className="text-2xs font-bold uppercase text-slate-500">Date</span>
            <input className={inputClass} type="date" max={today} value={date} onChange={(e) => setDate(e.target.value)} /></label>
          <label className="block space-y-1"><span className="text-2xs font-bold uppercase text-slate-500">Status</span>
            <select className={inputClass} value={status} onChange={(e) => setStatus(e.target.value as AttendanceStatus)}>
              {(Object.keys(ATTENDANCE_LABEL) as AttendanceStatus[]).map((s) => <option key={s} value={s}>{ATTENDANCE_LABEL[s]}</option>)}
            </select></label>
          <label className="block space-y-1"><span className="text-2xs font-bold uppercase text-slate-500">Clock in (optional)</span>
            <input className={inputClass} type="time" value={clockIn} onChange={(e) => setClockIn(e.target.value)} /></label>
          <label className="block space-y-1"><span className="text-2xs font-bold uppercase text-slate-500">Clock out (optional)</span>
            <input className={inputClass} type="time" value={clockOut} onChange={(e) => setClockOut(e.target.value)} /></label>
        </div>
        <label className="block space-y-1"><span className="text-2xs font-bold uppercase text-slate-500">Note (required, kept in the history)</span>
          <input className={inputClass} value={note} maxLength={300} onChange={(e) => setNote(e.target.value)} placeholder="Why is this being recorded or changed?" /></label>
        {existing && <p className="text-xs text-slate-500">A record already exists for this day ({ATTENDANCE_LABEL[existing.status]}, {existing.source === 'clock' ? 'clocked' : 'entered by HR'}). Saving corrects it; the old entry stays in the history.</p>}
        {msg && <p role="status" className={`text-xs font-bold ${msg.ok ? 'text-emerald-700' : 'text-rose-700'}`}>{msg.text}</p>}
        <div className="flex justify-between gap-2">
          <div>{existing && <Button variant="outline" size="sm" disabled={api.call.isPending || !note.trim()} onClick={() => run({ action: 'delete_attendance' })}>Remove record</Button>}</div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
            <Button size="sm" disabled={api.call.isPending || !note.trim()} onClick={() => run({ action: 'record_attendance', status, clockIn: clockIn || null, clockOut: clockOut || null })}>Save</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
