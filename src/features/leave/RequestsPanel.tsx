import React, { useState } from 'react';
import Button from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { useHrEvents, useLeaveActions, useLeaveReference, useLeaveRequests, useStaffForLeave } from '../../hooks/useLeave';
import { REQUEST_STYLE, formatRange, requestActions } from '../../domain/leave';
import LeaveRequestForm from './LeaveRequestForm';
import { errorMessage, toneClass } from '../payroll/shared';

/** Leave requests for HR and administrators: review, approve, reject, cancel, or file on someone's behalf. */
export default function RequestsPanel({ role }: { role: 'admin' | 'hr' }) {
  const { user } = useAuth();
  const [status, setStatus] = useState('pending');
  const [adding, setAdding] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const requests = useLeaveRequests({ status });
  const { types } = useLeaveReference();
  const staff = useStaffForLeave();
  const api = useLeaveActions();
  const typeName = new Map((types.data ?? []).map((t) => [t.code, t.name]));

  const act = async (body: Record<string, unknown>) => {
    setMsg(null);
    try {
      const r = await api.call.mutateAsync(body);
      setMsg({ ok: r.ok !== false, text: [r.message, ...(r.warnings ?? [])].filter(Boolean).join(' ') });
    } catch (e) { setMsg({ ok: false, text: errorMessage(e) }); }
  };
  const withReason = (id: string, action: 'reject' | 'cancel', prompt: string) => {
    const reason = window.prompt(prompt);
    if (reason && reason.trim()) void act({ action, requestId: id, reason: reason.trim() });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" className="flex border border-line-subtle">
          {(['pending', 'approved', 'rejected', 'cancelled', 'all'] as const).map((s) => (
            <button key={s} role="tab" aria-selected={status === s} onClick={() => setStatus(s)}
              className={`px-3 py-1.5 text-xs font-bold cursor-pointer ${status === s ? 'bg-primary text-white' : 'text-muted hover:bg-surface-accent'}`}>
              {s === 'pending' ? 'Awaiting approval' : s[0].toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <Button size="sm" onClick={() => setAdding(true)}>File leave for someone</Button>
      </div>

      {requests.error && <p role="alert" className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-2">Could not load leave requests. Has the v21 leave migration been applied?</p>}
      {adding && <LeaveRequestForm people={(staff.data ?? []).map((s) => ({ id: s.id, name: s.name }))} onDone={() => setAdding(false)} />}
      {msg && <p role="status" className={`text-xs font-bold ${msg.ok ? 'text-emerald-700' : 'text-rose-700'}`}>{msg.text}</p>}

      <div className="bg-surface border border-line-subtle overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-2xs uppercase tracking-wider text-subtle border-b border-line-subtle">
              <th className="p-3">Employee</th><th className="p-3">Type</th><th className="p-3">Dates</th><th className="p-3 text-right">Days</th><th className="p-3">Status</th><th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {(requests.data ?? []).map((r) => {
              const st = REQUEST_STYLE[r.status];
              const can = requestActions(r, role, user?.id);
              return (
                <React.Fragment key={r.id}>
                  <tr className="border-b border-line-subtle align-top">
                    <td className="p-3 font-bold text-ink">{r.staffName}{r.reason && <div className="font-medium text-subtle max-w-xs">{r.reason}</div>}</td>
                    <td className="p-3">{typeName.get(r.leaveType) ?? r.leaveType}{r.unpaid && <span className="ml-1 text-amber-700">(unpaid)</span>}</td>
                    <td className="p-3">{formatRange(r)}</td>
                    <td className="p-3 text-right font-mono">{r.days}</td>
                    <td className="p-3">
                      <span className={`text-2xs font-bold px-2 py-0.5 border uppercase ${toneClass[st.tone]}`}>{st.label}</span>
                      {(r.decisionNote || r.cancelReason) && <div className="text-subtle mt-1 max-w-[14rem]">{r.decisionNote ?? r.cancelReason}</div>}
                    </td>
                    <td className="p-3 text-right space-x-3 whitespace-nowrap">
                      {can.approve && !can.selfApprovalBlocked && <button type="button" className="font-bold text-emerald-700 cursor-pointer" disabled={api.call.isPending} onClick={() => act({ action: 'approve', requestId: r.id })}>Approve</button>}
                      {can.selfApprovalBlocked && <span className="text-subtle" title="Another administrator or HR user must approve your own leave">Needs another approver</span>}
                      {can.reject && <button type="button" className="font-bold text-rose-700 cursor-pointer" onClick={() => withReason(r.id, 'reject', 'Reason for rejecting this request? The employee will see it.')}>Reject</button>}
                      {can.cancel && <button type="button" className="font-bold text-muted cursor-pointer" onClick={() => (r.status === 'approved' ? withReason(r.id, 'cancel', 'Reason for cancelling this approved leave? It stays on record.') : void act({ action: 'cancel', requestId: r.id }))}>Cancel</button>}
                      <button type="button" className="font-bold text-accent cursor-pointer" onClick={() => setOpen(open === r.id ? null : r.id)}>History</button>
                    </td>
                  </tr>
                  {open === r.id && <tr><td colSpan={6} className="p-3 bg-surface-accent"><RequestHistory id={r.id} /></td></tr>}
                </React.Fragment>
              );
            })}
            {(requests.data ?? []).length === 0 && <tr><td className="p-4 text-subtle" colSpan={6}>No requests here.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RequestHistory({ id }: { id: string }) {
  const events = useHrEvents('leave_request', id);
  return (
    <ul className="text-xs space-y-1">
      {(events.data ?? []).map((e) => (
        <li key={e.id}><span className="font-mono text-subtle">{new Date(e.createdAt).toLocaleString()}</span> · <b>{e.action.replace(/_/g, ' ')}</b>
          {e.detail && Object.entries(e.detail).filter(([, v]) => v !== null && v !== undefined && v !== '').map(([k, v]) => ` · ${k}: ${String(v)}`).join('')}</li>
      ))}
      {(events.data ?? []).length === 0 && <li className="text-subtle">No history.</li>}
    </ul>
  );
}
