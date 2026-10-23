import React from 'react';
import { ROLE_LABELS, SystemRole } from '../../domain/staffAccess';

interface RoleChecksProps {
  /** Roles the signed-in user may grant. */
  options: readonly SystemRole[];
  /** The roles ticked, in the order they were ticked; the first is the person's primary role. */
  value: readonly SystemRole[];
  onChange: (roles: SystemRole[]) => void;
  disabled?: boolean;
  legend: string;
}

/** Tick every role this person holds. A small clinic can tick Receptionist, Assistant and Cashier for one person. */
export default function RoleChecks({ options, value, onChange, disabled, legend }: RoleChecksProps) {
  const toggle = (role: SystemRole) => onChange(value.includes(role) ? value.filter((r) => r !== role) : [...value, role]);
  return (
    <fieldset disabled={disabled} className="space-y-1.5">
      <legend className="block text-2xs font-bold uppercase tracking-wider text-ink mb-1">{legend}</legend>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
        {options.map((r) => (
          <label key={r} className="flex items-center gap-2 min-h-11 px-3 border border-line bg-surface text-xs font-semibold text-ink cursor-pointer">
            <input type="checkbox" className="w-5 h-5 accent-primary" checked={value.includes(r)} onChange={() => toggle(r)} />
            <span>{ROLE_LABELS[r]}</span>
            {value[0] === r && value.length > 1 && <span className="chip-brand ml-auto px-1.5 py-0.5 text-2xs">Primary</span>}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
