import React from 'react';
import { KeyRound } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  ROLE_LABELS, SystemRole, assignableRoles, describeRoleAccess, suggestSystemRole,
} from '../../domain/staffAccess';

interface StaffAccessSectionProps {
  jobTitle: string;
  department: string;
  email: string;
  value: SystemRole | null;
  onChange: (role: SystemRole | null) => void;
  /** Editing an existing record: access is managed from the staff list, not here. */
  existing?: boolean;
}

const selectClass =
  'w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-300 rounded-none text-xs text-slate-900 font-semibold focus:bg-white focus:border-brand focus:ring-1 focus:ring-brand transition-all shadow-2xs';

export default function StaffAccessSection({ jobTitle, department, email, value, onChange, existing }: StaffAccessSectionProps) {
  const { role: callerRole } = useAuth();
  const options = assignableRoles(callerRole);
  const suggestion = suggestSystemRole(jobTitle, department);
  const access = value ? describeRoleAccess(value) : null;

  return (
    <section className="bg-white border border-line shadow-xs rounded-none overflow-hidden">
      <div className="bg-surface-accent px-5 py-3.5 border-b border-line flex items-center gap-2.5">
        <KeyRound className="w-4 h-4 text-accent" />
        <h3 className="type-label text-ink">6. System Access (Login)</h3>
      </div>

      <div className="p-6 space-y-4">
        {existing ? (
          <p className="text-xs text-slate-600">
            Login and access role are managed from the staff list (Access column), where you can grant, change or revoke access.
          </p>
        ) : (
          <>
            <p className="text-xs text-slate-600 leading-relaxed">
              Choose an access role to create a login for this person. They will receive an email invitation at{' '}
              <b className="font-mono">{email || 'their email address'}</b> and choose their own password. Leave it as
              "No system access" to save the staff record only.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label htmlFor="staff-system-role" className="block text-2xs font-bold uppercase tracking-wider text-ink mb-1.5">Access role</label>
                <select
                  id="staff-system-role"
                  className={selectClass}
                  value={value ?? ''}
                  onChange={(e) => onChange((e.target.value || null) as SystemRole | null)}
                >
                  <option value="">No system access</option>
                  {options.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                </select>
                {callerRole === 'hr' && (
                  <p className="text-2xs text-slate-500 mt-1">HR can grant clinical and front-desk roles. Administrator and HR accounts must be created by an administrator.</p>
                )}
              </div>

              {suggestion && !value && options.includes(suggestion) && (
                <div className="self-end">
                  <button
                    type="button"
                    onClick={() => onChange(suggestion)}
                    className="text-xs font-bold text-accent underline cursor-pointer"
                  >
                    Suggested from the job title: {ROLE_LABELS[suggestion]}. Use it
                  </button>
                </div>
              )}
            </div>

            {access && value && (
              <div className="border border-line bg-surface-accent/40 p-4 space-y-2" aria-live="polite">
                <p className="text-xs font-bold text-ink">{ROLE_LABELS[value]} will be able to:</p>
                <ul className="grid md:grid-cols-2 gap-x-6 gap-y-1 text-xs text-slate-700 list-disc pl-5">
                  {access.pages.map((p) => <li key={p}>Open: {p}</li>)}
                  {access.adminConsole && <li>Open: Admin console</li>}
                  {access.permissions.map((p) => <li key={p}>{p}</li>)}
                </ul>
                <p className="text-2xs text-slate-500">This is enforced on every page and in the database, not just hidden in the menu.</p>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
