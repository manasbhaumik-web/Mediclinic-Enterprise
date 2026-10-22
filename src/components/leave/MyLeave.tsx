import React, { useState } from 'react';
import { CalendarClock, LogIn, LogOut } from 'lucide-react';
import Button from '../ui/Button';
import { useAttendance, useBalances, useLeaveActions, useLeaveReference, useLeaveRequests, useApprovedLeaveDays } from '../../hooks/useLeave';
import { ATTENDANCE_LABEL, DEFAULT_SETTINGS, REQUEST_STYLE, addDays, formatRange, localParts, summariseAttendance } from '../../domain/leave';
import LeaveRequestForm from './LeaveRequestForm';
import { errorMessage, toneClass } from '../payroll/shared';

const val = (n: number | null) => (n === null ? 'No limit' : String(n));

/** Self-service page for any employee: balances, own requests, clock in and out, and this month's attendance. */
export default function MyLeave() {
  const { settings, holidays, types } = useLeaveReference();
  const cfg = settings.data ?? DEFAULT_SETTINGS;
  const today = localParts(Date.now(), cfg.timezone).date;
  const year = +today.slice(0, 4);
  const monthStart = today.slice(0, 7) + '-01';
  const monthEnd = addDays(addDays(monthStart, 31).slice(0, 7) + '-01', -1);

  const bal = useBalances(null, year);
  const staffId = bal.data?.staffId ?? null;
  const requests = useLeaveRequests({ staffId });
  const records = useAttendance(monthStart, monthEnd, staffId);
  const leave = useApprovedLeaveDays(monthStart, monthEnd);
  const api = useLeaveActions();
  const [adding, setAdding] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const typeName = new Map((types.data ?? []).map((t) => [t.code, t.name]));

  const act = async (body: Record<string, unknown>) => {
    setMsg(null);
    try {
      const r = await api.call.mutateAsync(body);
      setMsg({ ok: r.ok !== false, text: [r.message, ...(r.warnings ?? [])].filter(Boolean).join(' ') });
    } catch (e) { setMsg({ ok: false, text: errorMessage(e) }); }
  };

  const notLinked = bal.data?.ok === false || !!bal.error;
  const todayRec = (records.data ?? []).find((r) => r.date === today);
  const mine = (leave.data ?? []).filter((d) => d.staffId === staffId);
  const summary = summariseAttendance((records.data ?? []).map((r) => ({ date: r.date, status: r.status })), mine, cfg, new Set((holidays.data ?? []).map((h) => h.date)), monthStart, monthEnd, today);

  return (
    <div className="animate-fadeIn w-full space-y-5 pb-8">
      <div className="bg-surface-accent border border-line p-5 space-y-1">
        <h1 className="type-page-title text-ink flex items-center gap-2.5"><CalendarClock className="w-6 h-6 text-accent" />My leave &amp; attendance</h1>
        <p className="text-xs text-muted font-medium max-w-3xl">Request leave, see what is left, and clock in and out. HR or an administrator approves leave requests.</p>
      </div>

      {notLinked && (
        <p role="alert" className="text-xs font-bold text-amber-900 bg-amber-50 border border-amber-300 px-3 py-2">
          {bal.data?.message ?? 'Could not load your leave.'} Leave and attendance need your login to be linked to a staff record.
        </p>
      )}
      {msg && <p role="status" className={`text-xs font-bold ${msg.ok ? 'text-emerald-700' : 'text-rose-700'}`}>{msg.text}</p>}

      {staffId && (
        <>
          <div className="bg-surface border border-line-subtle p-4 flex flex-wrap items-center gap-4">
            <div className="space-y-0.5">
              <div className="text-2xs font-bold uppercase tracking-wider text-subtle">Today ({today})</div>
              <div className="text-sm font-bold text-ink">
                {todayRec ? `${ATTENDANCE_LABEL[todayRec.status]}${todayRec.clockIn ? `, in ${localParts(todayRec.clockIn, cfg.timezone).time}` : ''}${todayRec.clockOut ? `, out ${localParts(todayRec.clockOut, cfg.timezone).time}` : ''}` : 'Not clocked in'}
              </div>
            </div>
            <Button size="sm" icon={<LogIn className="w-3.5 h-3.5" />} disabled={api.call.isPending || !!todayRec} onClick={() => act({ action: 'clock_in' })}>Clock in</Button>
            <Button variant="outline" size="sm" icon={<LogOut className="w-3.5 h-3.5" />} disabled={api.call.isPending || !todayRec?.clockIn || !!todayRec?.clockOut} onClick={() => act({ action: 'clock_out' })}>Clock out</Button>
            <div className="ml-auto text-xs text-muted">
              This month: <b className="font-mono">{summary.rate === null ? '–' : `${summary.rate}%`}</b> attendance · {summary.late} late · {summary.absent} absent{summary.unrecorded > 0 && <> · <span className="text-amber-700">{summary.unrecorded} unrecorded</span></>}
            </div>
          </div>

          <div className="bg-surface border border-line-subtle overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="text-left text-2xs uppercase tracking-wider text-subtle border-b border-line-subtle"><th className="p-3">{year} leave</th><th className="p-3 text-right">Entitled</th><th className="p-3 text-right">Taken</th><th className="p-3 text-right">Awaiting approval</th><th className="p-3 text-right">Remaining</th></tr></thead>
              <tbody>
                {(bal.data?.balances ?? []).filter((b) => b.hasRule || !b.balanceLimited).map((b) => (
                  <tr key={b.code} className="border-b border-line-subtle">
                    <td className="p-3 font-bold text-ink">{b.name}{!b.paid && <span className="ml-1 text-amber-700">(unpaid)</span>}</td>
                    <td className="p-3 text-right font-mono">{b.balanceLimited ? val(b.entitled) : 'No limit'}</td>
                    <td className="p-3 text-right font-mono">{b.taken}</td>
                    <td className="p-3 text-right font-mono">{b.pending}</td>
                    <td className="p-3 text-right font-mono font-bold">{b.balanceLimited ? val(b.remaining) : '–'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center"><h3 className="type-heading-caps text-ink">My requests</h3><Button size="sm" onClick={() => setAdding(true)}>Request leave</Button></div>
          {adding && <LeaveRequestForm onDone={() => setAdding(false)} />}
          <div className="bg-surface border border-line-subtle overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="text-left text-2xs uppercase tracking-wider text-subtle border-b border-line-subtle"><th className="p-3">Type</th><th className="p-3">Dates</th><th className="p-3 text-right">Days</th><th className="p-3">Status</th><th className="p-3" /></tr></thead>
              <tbody>
                {(requests.data ?? []).map((r) => {
                  const st = REQUEST_STYLE[r.status];
                  return (
                    <tr key={r.id} className="border-b border-line-subtle">
                      <td className="p-3 font-bold text-ink">{typeName.get(r.leaveType) ?? r.leaveType}</td>
                      <td className="p-3">{formatRange(r)}</td>
                      <td className="p-3 text-right font-mono">{r.days}</td>
                      <td className="p-3"><span className={`text-2xs font-bold px-2 py-0.5 border uppercase ${toneClass[st.tone]}`}>{st.label}</span>{(r.decisionNote || r.cancelReason) && <div className="text-subtle mt-1">{r.decisionNote ?? r.cancelReason}</div>}</td>
                      <td className="p-3 text-right">{r.status === 'pending' && <button type="button" className="font-bold text-muted cursor-pointer" onClick={() => act({ action: 'cancel', requestId: r.id })}>Cancel</button>}</td>
                    </tr>
                  );
                })}
                {(requests.data ?? []).length === 0 && <tr><td className="p-4 text-subtle" colSpan={5}>No leave requests yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
