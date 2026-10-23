/**
 * Rules for granting application access (RBAC roles) to staff. Pure TypeScript with no Deno globals, so the
 * same rules run in the staff-onboard edge function (authoritative), the staff form (to hide options the
 * caller may not use) and the unit tests.
 */

export type SystemRole = 'doctor' | 'pharmacist' | 'receptionist' | 'clinic-assistant' | 'cashier' | 'admin' | 'hr';

export const SYSTEM_ROLES: readonly SystemRole[] = ['doctor', 'pharmacist', 'receptionist', 'clinic-assistant', 'cashier', 'admin', 'hr'];

export const ROLE_LABELS: Record<SystemRole, string> = {
  doctor: 'Doctor',
  pharmacist: 'Pharmacist',
  receptionist: 'Receptionist (registers patients)',
  'clinic-assistant': 'Assistant (triage readings)',
  cashier: 'Cashier (billing)',
  admin: 'Administrator',
  hr: 'HR manager',
};

/** Roles that can manage other people's access. Granting these is reserved to admins. */
export const PRIVILEGED_ROLES: readonly SystemRole[] = ['admin', 'hr'];

/**
 * A person may hold several roles (a small clinic's front desk can be receptionist, assistant and cashier).
 * Valid roles only, no repeats, in the order given; the first is the primary role.
 */
export function normalizeRoleSet(roles: unknown): SystemRole[] {
  if (!Array.isArray(roles)) return [];
  const seen = new Set<SystemRole>();
  for (const r of roles) if (typeof r === 'string' && (SYSTEM_ROLES as readonly string[]).includes(r)) seen.add(r as SystemRole);
  return [...seen];
}

export const isSystemRole = (v: unknown): v is SystemRole => typeof v === 'string' && (SYSTEM_ROLES as readonly string[]).includes(v);

/** Roles a caller may grant. HR can onboard clinical and front-desk staff but cannot create admin or HR accounts. */
export function assignableRoles(callerRole: string | null | undefined): SystemRole[] {
  if (callerRole === 'admin') return [...SYSTEM_ROLES];
  if (callerRole === 'hr') return SYSTEM_ROLES.filter((r) => !PRIVILEGED_ROLES.includes(r));
  return [];
}

export const canGrant = (callerRole: string | null | undefined, role: SystemRole) => assignableRoles(callerRole).includes(role);

/** The caller may grant every role in the set (an empty set is not a grant). */
export const canGrantAll = (callerRole: string | null | undefined, roles: readonly SystemRole[]) => roles.length > 0 && roles.every((r) => canGrant(callerRole, r));

/** Whether the caller may change or revoke access that currently has `targetRole` (null = no access yet). */
export function canManageAccessOf(callerRole: string | null | undefined, target: SystemRole | readonly SystemRole[] | null): boolean {
  if (callerRole === 'admin') return true;
  const held = target === null ? [] : Array.isArray(target) ? target : [target as SystemRole];
  if (callerRole === 'hr') return held.every((r) => !PRIVILEGED_ROLES.includes(r));
  return false;
}

/**
 * Starting suggestions from the job title, never applied automatically: the person granting access must
 * confirm them. Administrator and HR are never suggested. "Receptionist & Cashier" suggests both roles.
 */
export function suggestSystemRoles(jobTitle: string, department = ''): SystemRole[] {
  const t = `${jobTitle} ${department}`.toLowerCase();
  // Office roles share words like "specialist" with clinicians; leave them for a person to decide.
  if (/\b(hr|human resources|payroll|finance|accounts?)\b/.test(t)) return [];
  if (/\b(dr\.?|doctor|physician|gp|specialist|consultant|surgeon|paediatrician|pediatrician)\b/.test(t)) return ['doctor'];
  if (/pharmac/.test(t)) return ['pharmacist'];
  const roles: SystemRole[] = [];
  if (/\b(receptionist|registrar|registration|front desk|clerk)\b/.test(t)) roles.push('receptionist');
  if (/\b(nurse|assistant|triage)\b/.test(t)) roles.push('clinic-assistant');
  if (/\b(cashier|billing)\b/.test(t)) roles.push('cashier');
  return roles;
}

/** The first suggestion, for callers that only take one role. */
export const suggestSystemRole = (jobTitle: string, department = ''): SystemRole | null => suggestSystemRoles(jobTitle, department)[0] ?? null;

export interface NewStaffInput {
  name?: string;
  email?: string;
  role?: string;          // job title
  department?: string;
  salaryBase?: number;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Pre-flight validation shared by the form, the CSV import and the server function. Returns problems. */
export function validateStaffInput(s: NewStaffInput): string[] {
  const problems: string[] = [];
  if (!s.name || !s.name.trim()) problems.push('Name is required');
  if (!s.email || !s.email.trim()) problems.push('Email is required');
  else if (!EMAIL.test(s.email.trim())) problems.push('Email is not valid');
  if (!s.role || !s.role.trim()) problems.push('Job title is required');
  if (s.salaryBase !== undefined && (!Number.isFinite(s.salaryBase) || s.salaryBase < 0)) problems.push('Salary must be a number of zero or more');
  return problems;
}

export type AccessState = 'none' | 'invited' | 'active' | 'revoked';
