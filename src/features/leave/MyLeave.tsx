import React, { useEffect, useState } from 'react';
import { LogIn, LogOut, Plus, X } from 'lucide-react';
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
  const [confirmCancel, setConfirmCancel] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const typeName = new Map((types.data ?? []).map((t) => [t.code, t.name]));

  // Escape closes the request panel
  useEffect(() => {
    if (!adding) return;
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setAdding(false); };
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [adding]);

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

  const tiles = (bal.data?.balances ?? []).filter((b) => b.hasRule || !b.balanceLimited);

  return (
    <div className="animate-fadeIn w-full space-y-5 pb-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted font-medium max-w-3xl">Request leave, see what is left, and clock in and out. HR or an administrator approves leave requests.</p>
        {staffId && (
          <button type="button" className="btn-primary" onClick={() => setAdding(true)}>
            <Plus className="w-4 h-4" aria-hidden="true" />Request leave
          </button>
        )}
      </div>

      {notLinked && (
        <p role="alert" className="chip-warn block w-full px-3 py-2 text-xs font-bold">
          {bal.data?.message ?? 'Could not load your leave.'} Leave and attendance need your login to be linked to a staff record.
        </p>
      )}
      {msg && (
        <div role="status" className={`${msg.ok ? 'chip-ok' : 'chip-danger'} flex w-full items-center justify-between gap-3 px-3 py-2 text-xs font-bold`}>
          <span>{msg.text}</span>
          <button type="button" aria-label="Dismiss message" className="cursor-pointer min-w-11 min-h-11 -my-3 flex items-center justify-center" onClick={() => setMsg(null)}><X className="w-4 h-4" aria-hidden="true" /></button>
        </div>
      )}

      {staffId && (
        <>
          <div className="bg-surface border border-line-subtle p-4 flex flex-wrap items-center gap-4">
            <div className="space-y-0.5">
              <div className="text-2xs font-bold uppercase tracking-wider text-subtle">Today ({today})</div>
              <div className="text-sm font-bold text-ink">
                {todayRec ? `${ATTENDANCE_LABEL[todayRec.status]}${todayRec.clockIn ? `, in ${localParts(todayRec.clockIn, cfg.timezone).time}` : ''}${todayRec.clockOut ? `, out ${localParts(todayRec.clockOut, cfg.timezone).time}` : ''}` : 'Not clocked in'}
              </div>
            </div>
            <button type="button" className="btn-primary" disabled={api.call.isPending || !!todayRec} onClick={() => act({ action: 'clock_in' })}><LogIn className="w-4 h-4" aria-hidden="true" />Clock in</button>
            <button type="button" className="btn-secondary" disabled={api.call.isPending || !todayRec?.clockIn || !!todayRec?.clockOut} onClick={() => act({ action: 'clock_out' })}><LogOut className="w-4 h-4" aria-hidden="true" />Clock out</button>
            <div className="ml-auto text-xs text-muted">
              This month: <b className="font-mono">{summary.rate === null ? '–' : `${summary.rate}%`}</b> attendance · {summary.late} late · {summary.absent} absent{summary.unrecorded > 0 && <> · <span className="chip-warn px-1.5 py-0.5">{summary.unrecorded} unrecorded</span></>}
            </div>
          </div>

          <section aria-label={`${year} leave balances`} className="space-y-2">
            <h2 className="type-heading-caps text-ink">{year} leave</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {tiles.map((b) => {
                const limited = b.balanceLimited && b.entitled !== null && b.entitled > 0;
                const takenPct = limited ? Math.min(100, (b.taken / b.entitled!) * 100) : 0;
                const pendingPct = limited ? Math.min(100 - takenPct, (b.pending / b.entitled!) * 100) : 0;
                return (
                  <div key={b.code} className="bg-surface border border-line-subtle p-4 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-bold text-ink">{b.name}</h3>
                      {!b.paid && <span className="chip-warn px-1.5 py-0.5 text-2xs">Unpaid</span>}
                    </div>
                    <div>
                      <span className="type-metric font-mono text-strong">{b.balanceLimited ? val(b.remaining) : 'No limit'}</span>
                      {limited && <span className="text-xs text-muted ml-1">of {val(b.entitled)} days left</span>}
                    </div>
                    {limited && (
                      <div role="progressbar" aria-label={`${b.name}: ${b.taken} taken, ${b.pending} awaiting approval`} aria-valuemin={0} aria-valuemax={b.entitled!} aria-valuenow={b.taken}
                        className="h-2 bg-surface-strong flex overflow-hidden">
                        <div className="bg-primary" style={{ width: `${takenPct}%` }} />
                        <div className="bg-amber-500" style={{ width: `${pendingPct}%` }} />
                      </div>
                    )}
                    <div className="flex justify-between text-xs text-muted">
                      <span>{b.taken} taken</span>
                      <span>{b.pending} awaiting approval</span>
                    </div>
                  </div>
                );
              })}
              {tiles.length === 0 && <p className="text-xs text-subtle">No leave types are set up for you yet.</p>}
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="type-heading-caps text-ink">My requests</h2>
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
                        <td className="p-3"><span className={`${toneClass[st.tone]} px-2 py-0.5 text-2xs uppercase`}>{st.label}</span>{(r.decisionNote || r.cancelReason) && <div className="text-subtle mt-1">{r.decisionNote ?? r.cancelReason}</div>}</td>
                        <td className="p-3 text-right">
                          {r.status === 'pending' && (confirmCancel === r.id ? (
                            <span className="inline-flex gap-2">
                              <button type="button" className="btn-danger" onClick={() => { setConfirmCancel(null); void act({ action: 'cancel', requestId: r.id }); }}>Confirm cancel</button>
                              <button type="button" className="btn-secondary" onClick={() => setConfirmCancel(null)}>Keep</button>
                            </span>
                          ) : (
                            <button type="button" className="btn-secondary" onClick={() => setConfirmCancel(r.id)}>Cancel request</button>
                          ))}
                        </td>
                      </tr>
                    );
                  })}
                  {(requests.data ?? []).length === 0 && (
                    <tr><td className="p-6 text-center text-muted" colSpan={5}>
                      <p className="mb-3">No leave requests yet.</p>
                      <button type="button" className="btn-primary" onClick={() => setAdding(true)}><Plus className="w-4 h-4" aria-hidden="true" />Request leave</button>
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {adding && (
        <div onKeyDown={(e) => { if (e.key === 'Escape') setAdding(false); }} className="fixed inset-0 z-50 bg-night-950/70 backdrop-blur-xs flex items-start justify-center overflow-y-auto p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) setAdding(false); }}>
          <div role="dialog" aria-modal="true" aria-label="Request leave" className="bg-surface border border-line w-full max-w-2xl mt-10 shadow-2xl">
            <div className="flex items-center justify-between px-4 py-2 border-b border-line-subtle">
              <h2 className="type-heading-caps text-ink">Request leave</h2>
              <button type="button" aria-label="Close" className="cursor-pointer min-w-11 min-h-11 flex items-center justify-center text-muted hover:text-ink" onClick={() => setAdding(false)}><X className="w-5 h-5" aria-hidden="true" /></button>
            </div>
            <div className="p-4"><LeaveRequestForm onDone={() => setAdding(false)} /></div>
          </div>
        </div>
      )}
    </div>
  );
}
