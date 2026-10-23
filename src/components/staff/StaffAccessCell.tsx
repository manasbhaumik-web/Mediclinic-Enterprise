import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  AccessState, ROLE_LABELS, SystemRole, accessBadge, assignableRoles, canManageAccessOf,
} from '../../domain/staffAccess';
import RoleChecks from './RoleChecks';

export interface AccessActions {
  onGrant: (roles: SystemRole[]) => void;
  onResend: () => void;
  onReset: () => void;
  onChangeRoles: (roles: SystemRole[]) => void;
  onRevoke: () => void;
  onRestore: () => void;
}

interface StaffAccessCellProps extends AccessActions {
  hasLogin: boolean;
  /** Every role the person holds; the first is primary. */
  systemRoles: SystemRole[];
  state?: AccessState;
  busy: boolean;
}

const toneClass = {
  ok: 'chip-ok',
  info: 'chip-info',
  warn: 'chip-warn',
  idle: 'chip-neutral',
};

const smallBtn =
  'min-h-11 px-3 text-xs font-bold border border-line-subtle bg-surface hover:bg-surface-muted text-muted cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';

/** Access column of the staff directory: shows login state and the roles held, and the actions the signed-in user may take. */
export default function StaffAccessCell(p: StaffAccessCellProps) {
  const { role: callerRole } = useAuth();
  const options = assignableRoles(callerRole);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<SystemRole[]>([]);
  const badge = accessBadge(p.state, p.hasLogin);
  const allowed = canManageAccessOf(callerRole, p.hasLogin ? p.systemRoles : null);

  const open = () => { setDraft(p.systemRoles); setEditing(true); };
  const save = () => {
    if (draft.length === 0) return;
    if (p.hasLogin) p.onChangeRoles(draft); else p.onGrant(draft);
    setEditing(false);
  };

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className={`text-2xs font-bold px-2 py-0.5 border ${toneClass[badge.tone]}`}>{badge.label}</span>
        {p.systemRoles.map((r, i) => (
          <span key={r} className="text-2xs font-bold uppercase tracking-wider text-accent">{ROLE_LABELS[r].split(' (')[0]}{i < p.systemRoles.length - 1 ? ' ·' : ''}</span>
        ))}
      </div>

      {!allowed ? (
        <p className="text-2xs text-subtle">Managed by an administrator</p>
      ) : (
        <div className="flex flex-wrap items-center gap-1">
          {p.hasLogin && p.state === 'invited' && <button type="button" className={smallBtn} disabled={p.busy} onClick={p.onResend}>Resend invite</button>}
          {p.hasLogin && p.state === 'active' && <button type="button" className={smallBtn} disabled={p.busy} onClick={p.onReset}>Send password reset</button>}
          {p.hasLogin && (p.state === 'revoked'
            ? <button type="button" className={smallBtn} disabled={p.busy} onClick={p.onRestore}>Restore access</button>
            : <button type="button" className={`${smallBtn} !text-rose-700`} disabled={p.busy} onClick={p.onRevoke}>Revoke</button>)}
          <button type="button" className={smallBtn} disabled={p.busy} aria-expanded={editing} onClick={() => (editing ? setEditing(false) : open())}>
            {p.hasLogin ? 'Edit roles' : 'Grant access…'}
          </button>
        </div>
      )}

      {allowed && editing && (
        <div className="border border-line bg-surface-accent p-2.5 space-y-2">
          <RoleChecks legend={p.hasLogin ? 'Roles this person holds' : 'Roles to invite them with'} options={options} value={draft} onChange={setDraft} disabled={p.busy} />
          <div className="flex gap-2">
            <button type="button" className="btn-primary" disabled={draft.length === 0 || p.busy} onClick={save}>{p.hasLogin ? 'Save roles' : 'Invite'}</button>
            <button type="button" className="btn-secondary" onClick={() => setEditing(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
