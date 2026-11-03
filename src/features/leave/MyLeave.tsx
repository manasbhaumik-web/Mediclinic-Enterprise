import React, { useEffect, useState } from 'react';
import { CalendarOff, LogIn, LogOut, Plus, X } from 'lucide-react';
import { useAttendance, useBalances, useLeaveActions, useLeaveReference, useLeaveRequests, useApprovedLeaveDays } from '../../hooks/useLeave';
import { ATTENDANCE_LABEL, DEFAULT_SETTINGS, REQUEST_STYLE, addDays, formatRange, localParts, summariseAttendance } from '../../domain/leave';
import LeaveRequestForm from './LeaveRequestForm';
import { errorMessage, toneClass } from '../../components/ui/formHelpers';

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

  const recent = [...(records.data ?? [])].sort((x, y) => (x.date < y.date ? 1 : -1)).slice(0, 6);
  const dateLine = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="animate-fadeIn w-full space-y-5 pb-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted">{dateLine}</p>
          <h1 className="mt-1 type-section-title text-ink font-bold">My leave and attendance</h1>
          <p className="mt-1 text-xs text-muted max-w-3xl">Request leave, see what is left, and clock in and out. HR or an administrator approves leave requests.</p>
        </div>
        {staffId && (
          <button type="button" className="btn-primary min-h-11 px-5 text-sm" onClick={() => setAdding(true)}>
            <Plus className="w-4 h-4" aria-hidden="true" />Request leave
          </button>
        )}
      </div>

      {notLinked && (
        <section role="alert" className="bg-surface border border-line p-8 sm:p-12 text-center">
          <CalendarOff className="w-10 h-10 text-accent mx-auto mb-3 opacity-70" aria-hidden="true" />
          <h2 className="text-base font-bold text-ink">Your login is not linked to a staff record</h2>
          <p className="mt-1.5 text-sm text-muted max-w-xl mx-auto">
            Leave and attendance need your login to be linked to a staff record. Ask HR or an administrator to link it, then reload this page.
          </p>
        </section>
      )}
      {msg && (
        <div role="status" className={`${msg.ok ? 'chip-ok' : 'chip-danger'} flex w-full items-center justify-between gap-3 px-3 py-2 text-xs font-bold`}>
          <span>{msg.text}</span>
          <button type="button" aria-label="Dismiss message" className="cursor-pointer min-w-11 min-h-11 -my-3 flex items-center justify-center" onClick={() => setMsg(null)}><X className="w-4 h-4" aria-hidden="true" /></button>
        </div>
      )}

      {staffId && (
        <>
          <section aria-label={`${year} leave balances`} className="grid grid-cols-[repeat(auto-fit,minmax(12rem,1fr))] bg-surface border-l border-t border-line">
            {tiles.map((b) => {
              const limited = b.balanceLimited && b.entitled !== null && b.entitled > 0;
              const takenPct = limited ? Math.min(100, (b.taken / b.entitled!) * 100) : 0;
              const pendingPct = limited ? Math.min(100 - takenPct, (b.pending / b.entitled!) * 100) : 0;
              return (
                <div key={b.code} className="px-5 py-5 border-r border-b border-line">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-xs font-medium text-muted">{b.name}</h2>
                    {!b.paid && <span className="chip-warn px-1.5 py-0.5 text-2xs">Unpaid</span>}
                  </div>
                  <p className="mt-2 text-3xl font-bold leading-none tracking-tight tabular-nums text-ink">
                    {b.balanceLimited ? val(b.remaining) : 'No limit'}
                    {limited && <span className="ml-1.5 text-sm font-semibold text-muted">days left</span>}
                  </p>
                  {limited && (
                    <div role="progressbar" aria-label={`${b.name}: ${b.taken} taken, ${b.pending} awaiting approval`} aria-valuemin={0} aria-valuemax={b.entitled!} aria-valuenow={b.taken}
                      className="mt-3 h-1.5 bg-surface-strong flex overflow-hidden">
                      <div className="bg-primary" style={{ width: `${takenPct}%` }} />
                      <div className="bg-amber-500" style={{ width: `${pendingPct}%` }} />
                    </div>
                  )}
                  <p className="mt-2.5 text-xs font-semibold text-accent">{b.taken} taken · {b.pending} awaiting approval</p>
                </div>
              );
            })}
            {tiles.length === 0 && <p className="px-5 py-5 text-xs text-subtle border-r border-b border-line">No leave types are set up for you yet.</p>}
          </section>

          <section aria-label="Requests and attendance" className="flex flex-wrap bg-surface border border-line">
            <div className="flex-[65_1_32rem] min-w-0 flex flex-col">
              <div className="px-5 py-4 border-b border-line">
                <h2 className="text-base font-bold text-ink">My requests</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[600px]">
                  <thead><tr className="text-left text-xs font-semibold text-muted bg-surface-muted border-b border-line"><th className="px-5 py-2.5">Leave type</th><th className="px-3 py-2.5">Dates</th><th className="px-3 py-2.5 text-right">Days</th><th className="px-3 py-2.5">Status</th><th className="px-5 py-2.5" /></tr></thead>
                  <tbody>
                    {(requests.data ?? []).map((r) => {
                      const st = REQUEST_STYLE[r.status];
                      return (
                        <tr key={r.id} className={`border-b border-line-subtle ${r.status === 'pending' ? 'bg-amber-50/70 dark:bg-amber-950/30' : ''}`}>
                          <td className="px-5 py-3.5 font-semibold text-ink">{typeName.get(r.leaveType) ?? r.leaveType}</td>
                          <td className="px-3 py-3.5 text-muted tabular-nums">{formatRange(r)}</td>
                          <td className="px-3 py-3.5 text-right font-bold tabular-nums">{r.days}</td>
                          <td className="px-3 py-3.5"><span className={`${toneClass[st.tone]} px-2 py-0.5 text-xs font-semibold`}>{st.label}</span>{(r.decisionNote || r.cancelReason) && <div className="text-xs text-subtle mt-1">{r.decisionNote ?? r.cancelReason}</div>}</td>
                          <td className="px-5 py-3.5 text-right">
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
                      <tr><td className="p-8 text-center text-muted" colSpan={5}>
                        <p className="mb-3">No leave requests yet.</p>
                        <button type="button" className="btn-primary" onClick={() => setAdding(true)}><Plus className="w-4 h-4" aria-hidden="true" />Request leave</button>
                      </td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <aside aria-labelledby="my-attendance" className="flex-[35_1_20rem] min-w-0 border-t lg:border-t-0 lg:border-l border-line flex flex-col">
              <div className="p-5 flex flex-col gap-3.5 border-b border-line">
                <p id="my-attendance" className="inline-flex items-center gap-2 text-sm font-semibold text-accent">
                  <span className="w-2 h-2 bg-emerald-600" aria-hidden="true" />
                  Today ({today})
                </p>
                <p className="text-lg font-bold text-ink">
                  {todayRec ? `${ATTENDANCE_LABEL[todayRec.status]}${todayRec.clockIn ? `, in ${localParts(todayRec.clockIn, cfg.timezone).time}` : ''}${todayRec.clockOut ? `, out ${localParts(todayRec.clockOut, cfg.timezone).time}` : ''}` : 'Not clocked in'}
                </p>
                <div className="flex flex-wrap gap-2">
                  <button type="button" className="btn-primary flex-1 min-h-12 text-sm" disabled={api.call.isPending || !!todayRec} onClick={() => act({ action: 'clock_in' })}><LogIn className="w-4 h-4" aria-hidden="true" />Clock in</button>
                  <button type="button" className="btn-secondary flex-1 min-h-12 text-sm text-ink" disabled={api.call.isPending || !todayRec?.clockIn || !!todayRec?.clockOut} onClick={() => act({ action: 'clock_out' })}><LogOut className="w-4 h-4" aria-hidden="true" />Clock out</button>
                </div>
              </div>

              <div className="px-5 py-4 border-b border-line flex items-center justify-between gap-2">
                <h2 className="text-base font-bold text-ink">This month</h2>
                <span className="px-2.5 py-1 bg-surface-muted text-muted text-xs font-semibold tabular-nums">{summary.rate === null ? '–' : `${summary.rate}%`} attendance</span>
              </div>
              <dl className="grid grid-cols-3 gap-px bg-line border-b border-line">
                <div className="bg-surface-muted px-4 py-2.5"><dt className="text-xs font-medium text-muted">Late</dt><dd className="mt-0.5 text-lg font-bold tabular-nums text-ink">{summary.late}</dd></div>
                <div className="bg-surface-muted px-4 py-2.5"><dt className="text-xs font-medium text-muted">Absent</dt><dd className="mt-0.5 text-lg font-bold tabular-nums text-ink">{summary.absent}</dd></div>
                <div className="bg-surface-muted px-4 py-2.5"><dt className="text-xs font-medium text-muted">Unrecorded</dt><dd className={`mt-0.5 text-lg font-bold tabular-nums ${summary.unrecorded > 0 ? 'text-amber-800' : 'text-ink'}`}>{summary.unrecorded}</dd></div>
              </dl>
              {recent.length === 0 ? (
                <p className="px-5 py-5 text-sm text-muted">No attendance recorded this month yet.</p>
              ) : (
                <ul>
                  {recent.map((rec) => (
                    <li key={rec.date} className="flex items-center gap-3 px-5 py-3 border-b border-line-subtle">
                      <span className="shrink-0 min-w-20 text-sm font-bold text-accent tabular-nums">{rec.date.slice(5)}</span>
                      <span className="flex-1 min-w-0 text-sm text-muted tabular-nums">
                        {rec.clockIn ? localParts(rec.clockIn, cfg.timezone).time : '–'}{rec.clockOut ? ` to ${localParts(rec.clockOut, cfg.timezone).time}` : ''}
                      </span>
                      <span className="text-sm font-semibold text-ink">{ATTENDANCE_LABEL[rec.status]}</span>
                    </li>
                  ))}
                </ul>
              )}
            </aside>
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
