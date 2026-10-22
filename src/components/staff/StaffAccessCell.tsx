import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  AccessState, ROLE_LABELS, SystemRole, accessBadge, assignableRoles, canManageAccessOf,
} from '../../domain/staffAccess';

export interface AccessActions {
  onGrant: (role: SystemRole) => void;
  onResend: () => void;
  onReset: () => void;
  onChangeRole: (role: SystemRole) => void;
  onRevoke: () => void;
  onRestore: () => void;
}

interface StaffAccessCellProps extends AccessActions {
  hasLogin: boolean;
  systemRole: SystemRole | null;
  state?: AccessState;
  busy: boolean;
}

const toneClass = {
  ok: 'chip-ok',
  info: 'chip-info',
  warn: 'chip-warn',
  idle: 'bg-slate-100 text-muted border-slate-300',
};

const smallBtn =
  'px-2 py-1 text-2xs font-bold border border-line-subtle bg-surface hover:bg-surface-muted text-muted cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';

/** Access column of the staff directory: shows login state and the actions the signed-in user may take. */
export default function StaffAccessCell(p: StaffAccessCellProps) {
  const { role: callerRole } = useAuth();
  const options = assignableRoles(callerRole);
  const [pick, setPick] = useState<SystemRole | ''>('');
  const badge = accessBadge(p.state, p.hasLogin);
  const allowed = canManageAccessOf(callerRole, p.hasLogin ? p.systemRole : null);

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className={`text-2xs font-bold px-2 py-0.5 border ${toneClass[badge.tone]}`}>{badge.label}</span>
        {p.systemRole && <span className="text-2xs font-bold uppercase tracking-wider text-accent">{ROLE_LABELS[p.systemRole]}</span>}
      </div>

      {!allowed ? (
        <p className="text-2xs text-subtle">Managed by an administrator</p>
      ) : !p.hasLogin ? (
        <div className="flex items-center gap-1">
          <select aria-label="Access role to grant" className="text-2xs border border-line-subtle bg-surface px-1.5 py-1" value={pick} onChange={(e) => setPick(e.target.value as SystemRole | '')}>
            <option value="">Grant access…</option>
            {options.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
          </select>
          <button type="button" className={smallBtn} disabled={!pick || p.busy} onClick={() => pick && p.onGrant(pick)}>Invite</button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-1">
          {p.state === 'invited' && <button type="button" className={smallBtn} disabled={p.busy} onClick={p.onResend}>Resend invite</button>}
          {p.state === 'active' && <button type="button" className={smallBtn} disabled={p.busy} onClick={p.onReset}>Send password reset</button>}
          {p.state === 'revoked'
            ? <button type="button" className={smallBtn} disabled={p.busy} onClick={p.onRestore}>Restore access</button>
            : <button type="button" className={`${smallBtn} !text-rose-700`} disabled={p.busy} onClick={p.onRevoke}>Revoke</button>}
          <select
            aria-label="Change access role"
            className="text-2xs border border-line-subtle bg-surface px-1.5 py-1"
            value={p.systemRole ?? ''}
            disabled={p.busy}
            onChange={(e) => { const r = e.target.value as SystemRole; if (r && r !== p.systemRole) p.onChangeRole(r); }}
          >
            {p.systemRole && !options.includes(p.systemRole) && <option value={p.systemRole}>{ROLE_LABELS[p.systemRole]}</option>}
            {options.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
          </select>
        </div>
      )}
    </div>
  );
}
