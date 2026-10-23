/** Staff access (RBAC) helpers for the UI. The rules themselves live in the shared module the server also uses. */
import { ClinicalPermission, RBACPermissionEngine } from './rbacPermissionEngine';
import { ADMIN_ROLES, TAB_ROLES } from '../routes/permissions';
import { SystemRole } from '../../supabase/functions/_shared/staffAccess';

export {
  ROLE_LABELS, SYSTEM_ROLES, assignableRoles, canGrant, canGrantAll, canManageAccessOf, isSystemRole, normalizeRoleSet, suggestSystemRole, suggestSystemRoles, validateStaffInput,
} from '../../supabase/functions/_shared/staffAccess';
export type { AccessState, SystemRole } from '../../supabase/functions/_shared/staffAccess';

const PAGE_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  queue: 'Patient queue',
  consultation: 'Consultation suite',
  reports: 'Monthly reports',
  registration: 'Patient registration',
  triage: 'Triage',
  appointments: 'Appointments',
  dispensary: 'Dispensary',
  billing: 'Billing desk',
  inventory: 'Inventory',
  'my-leave': 'My leave',
};

const PERMISSION_LABELS: Record<ClinicalPermission, string> = {
  VIEW_FULL_NRIC: 'See full NRIC numbers',
  EDIT_CLINICAL_SOAP: 'Write clinical (SOAP) notes',
  DISPENSE_POISON_SCHEDULE: 'Dispense scheduled poisons',
  ISSUE_MC_LEAVE: 'Issue medical certificates',
  COLLECT_PAYMENT: 'Collect payments',
  APPLY_BILLING_DISCOUNT: 'Apply billing discounts',
  VIEW_FINANCIAL_REPORTS: 'View financial reports',
  MANAGE_INVENTORY_STOCK: 'Manage medicine stock',
  MANAGE_STAFF_ACCOUNTS: 'Manage staff accounts',
  EXPORT_MOH_AUDIT_LOGS: 'Export MOH audit logs',
  CONFIGURE_SYSTEM_SETTINGS: 'Change system settings',
};

export interface RoleAccess {
  pages: string[];
  permissions: string[];
  adminConsole: boolean;
}

/** What a person holding these roles can open and do: the union over their roles, from the same tables the app enforces. */
export function describeRoleAccess(roles: SystemRole | readonly SystemRole[]): RoleAccess {
  const held = (Array.isArray(roles) ? roles : [roles]) as readonly SystemRole[];
  const pages = (Object.keys(TAB_ROLES) as (keyof typeof TAB_ROLES)[])
    .filter((tab) => held.some((r) => TAB_ROLES[tab].includes(r)))
    .map((tab) => PAGE_LABELS[tab] ?? tab);
  return {
    pages,
    permissions: RBACPermissionEngine.getPermissionsForRole(held).map((p) => PERMISSION_LABELS[p] ?? p),
    adminConsole: held.some((r) => ADMIN_ROLES.includes(r)),
  };
}

export type AccessLabelTone = 'ok' | 'info' | 'warn' | 'idle';

export function accessBadge(state: 'none' | 'invited' | 'active' | 'revoked' | undefined, hasRole: boolean): { label: string; tone: AccessLabelTone } {
  if (state === 'active') return { label: 'Has access', tone: 'ok' };
  if (state === 'invited') return { label: 'Access given, not signed in yet', tone: 'info' };
  if (state === 'revoked') return { label: 'Access revoked', tone: 'warn' };
  return { label: hasRole ? 'Not signed up' : 'No system access', tone: 'idle' };
}
