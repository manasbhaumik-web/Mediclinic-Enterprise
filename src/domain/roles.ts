import type { UserRole } from '../types';

/**
 * Every role a staff member can hold. One person may hold several (a small clinic's front desk can be
 * Receptionist, Assistant and Cashier at once); they then see the union of those roles' pages and permissions.
 * The first role is the person's primary one, used for display and as the stored `profiles.role`.
 */
export const ALL_ROLES: readonly UserRole[] = ['doctor', 'pharmacist', 'receptionist', 'clinic-assistant', 'cashier', 'admin', 'hr'];

export const ROLE_LABEL: Record<UserRole, string> = {
  doctor: 'Doctor',
  pharmacist: 'Pharmacist',
  receptionist: 'Receptionist',
  'clinic-assistant': 'Assistant',
  cashier: 'Cashier',
  admin: 'Administrator',
  hr: 'HR',
};

export const ROLE_LABEL_BM: Record<UserRole, string> = {
  doctor: 'Doktor',
  pharmacist: 'Pegawai Farmasi',
  receptionist: 'Penyambut Tetamu',
  'clinic-assistant': 'Pembantu Klinik',
  cashier: 'Juruwang',
  admin: 'Pentadbir',
  hr: 'Sumber Manusia',
};

export const isUserRole = (value: unknown): value is UserRole => typeof value === 'string' && (ALL_ROLES as readonly string[]).includes(value);

/** Valid roles from a stored list, in the order of ALL_ROLES with the primary role first and no repeats. */
export function normalizeRoles(primary: unknown, roles?: unknown): UserRole[] {
  const held = new Set<UserRole>();
  if (isUserRole(primary)) held.add(primary);
  if (Array.isArray(roles)) roles.forEach((r) => { if (isUserRole(r)) held.add(r); });
  if (!isUserRole(primary)) return ALL_ROLES.filter((r) => held.has(r));
  return [primary, ...ALL_ROLES.filter((r) => held.has(r) && r !== primary)];
}

/** True when any role held is in `allowed`. */
export const hasAnyRole = (held: readonly UserRole[] | null | undefined, allowed: readonly UserRole[]): boolean =>
  !!held && held.some((r) => allowed.includes(r));

/** "Receptionist · Assistant · Cashier" for a person with several roles. */
export const joinRoleLabels = (held: readonly UserRole[], lang: string = 'EN'): string => {
  const dict = lang === 'BM' ? ROLE_LABEL_BM : ROLE_LABEL;
  return held.map((r) => dict[r] || ROLE_LABEL[r]).join(' · ');
};
