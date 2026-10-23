import { supabase } from './supabase';
import { AccessState, SystemRole } from '../domain/staffAccess';

export interface NewStaffPayload {
  name: string;
  email: string;
  role: string;           // job title
  department: string;
  status: string;
  gender?: string;
  dob?: string;
  icNumber?: string;
  phone?: string;
  salaryBase: number;
}

export interface OnboardResult {
  ok?: boolean;
  message?: string;
  warning?: string;
  staffId?: string;
  invited?: boolean;
  /** The login exists and the roles are set. False only when granting failed. */
  accessGranted?: boolean;
  /** The "your access is ready" email went out. Access stands either way. */
  notified?: boolean;
  /** The same name and date of birth already exists: ask the user to confirm, then resend with allowPossibleDuplicate. */
  possibleDuplicate?: boolean;
  access?: Record<string, { state: AccessState; role: SystemRole | null; roles: SystemRole[] }>;
}

/** Every call goes through the staff-onboard edge function, which checks the caller's role itself. */
async function call(body: Record<string, unknown>): Promise<OnboardResult> {
  const { data, error } = await supabase.functions.invoke('staff-onboard', { body });
  if (error) throw new Error(error.message || 'Request failed');
  return (data ?? {}) as OnboardResult;
}

// A person may hold several roles: `roles` is the full set (first = primary); `systemRole` is sent too for older servers.
const roleBody = (roles: readonly SystemRole[]) => ({ systemRole: roles[0] ?? null, roles });

export const createStaff = (staff: NewStaffPayload, roles: readonly SystemRole[], allowPossibleDuplicate = false) =>
  call({ action: 'create', staff, ...roleBody(roles), allowPossibleDuplicate });
export const grantAccess = (staffId: string, roles: readonly SystemRole[]) => call({ action: 'grant_access', staffId, ...roleBody(roles) });
export const resendInvite = (staffId: string) => call({ action: 'resend_invite', staffId });
export const sendPasswordReset = (staffId: string) => call({ action: 'send_reset', staffId });
export const changeRoles = (staffId: string, roles: readonly SystemRole[]) => call({ action: 'change_role', staffId, ...roleBody(roles) });
export const revokeAccess = (staffId: string) => call({ action: 'revoke', staffId });
export const restoreAccess = (staffId: string) => call({ action: 'restore', staffId });
export const loadAccessStatus = () => call({ action: 'access_status' });
