import React from 'react';
import RoleChecks from './RoleChecks';
import { KeyRound } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  ROLE_LABELS, SystemRole, assignableRoles, describeRoleAccess, suggestSystemRoles,
} from '../../domain/staffAccess';

interface StaffAccessSectionProps {
  jobTitle: string;
  department: string;
  email: string;
  /** Roles ticked, in order; the first is primary. Empty = no system access. */
  value: SystemRole[];
  onChange: (roles: SystemRole[]) => void;
  /** Editing an existing record: access is managed from the staff list, not here. */
  existing?: boolean;
}

export default function StaffAccessSection({ jobTitle, department, email, value, onChange, existing }: StaffAccessSectionProps) {
  const { role: callerRole } = useAuth();
  const options = assignableRoles(callerRole);
  const suggestion = suggestSystemRoles(jobTitle, department).filter((r) => options.includes(r));
  const access = value.length > 0 ? describeRoleAccess(value) : null;

  return (
    <section className="bg-surface border border-line shadow-none rounded-none overflow-hidden">
      <div className="bg-surface-accent px-5 py-3.5 border-b border-line flex items-center gap-2.5">
        <KeyRound className="w-4 h-4 text-accent" />
        <h3 className="type-label text-ink">6. System Access (Login)</h3>
      </div>

      <div className="p-6 space-y-4">
        {existing ? (
          <p className="text-xs text-muted">
            Login and access role are managed from the staff list (Access column), where you can grant, change or revoke access.
          </p>
        ) : (
          <>
            <p className="text-xs text-muted leading-relaxed">
              Tick the access roles to give this person a login now. Access starts straight away; a notification is then emailed to{' '}
              <b className="font-mono">{email || 'their email address'}</b> so they can choose their own password. If that email cannot be sent, the access still stands and you can resend the notification from the staff list. Leave everything unticked to save the staff record only.
            </p>

            <div className="space-y-3">
              <RoleChecks legend="Access roles" options={options} value={value} onChange={onChange} />
              <p className="text-2xs text-subtle">Tick more than one role when one person covers several jobs (for example Receptionist, Assistant and Cashier in a small clinic). They see every page their roles allow.</p>
              {callerRole === 'hr' && (
                <p className="text-2xs text-subtle">HR can grant clinical and front-desk roles. Administrator and HR accounts must be created by an administrator.</p>
              )}
              {suggestion.length > 0 && value.length === 0 && (
                <button type="button" onClick={() => onChange(suggestion)} className="text-xs font-bold text-accent underline cursor-pointer min-h-11">
                  Suggested from the job title: {suggestion.map((r) => ROLE_LABELS[r]).join(' + ')}. Use it
                </button>
              )}
            </div>

            {access && value.length > 0 && (
              <div className="border border-line bg-surface-accent/40 p-4 space-y-2" aria-live="polite">
                <p className="text-xs font-bold text-ink">{value.map((r) => ROLE_LABELS[r]).join(' + ')} will be able to:</p>
                <ul className="grid md:grid-cols-2 gap-x-6 gap-y-1 text-xs text-muted list-disc pl-5">
                  {access.pages.map((p) => <li key={p}>Open: {p}</li>)}
                  {access.adminConsole && <li>Open: Admin console</li>}
                  {access.permissions.map((p) => <li key={p}>{p}</li>)}
                </ul>
                <p className="text-2xs text-subtle">This is enforced on every page and in the database, not just hidden in the menu.</p>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
