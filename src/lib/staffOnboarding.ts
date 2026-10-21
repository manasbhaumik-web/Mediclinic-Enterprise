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
  access?: Record<string, { state: AccessState; role: SystemRole | null }>;
}

/** Every call goes through the staff-onboard edge function, which checks the caller's role itself. */
async function call(body: Record<string, unknown>): Promise<OnboardResult> {
  const { data, error } = await supabase.functions.invoke('staff-onboard', { body });
  if (error) throw new Error(error.message || 'Request failed');
  return (data ?? {}) as OnboardResult;
}

export const createStaff = (staff: NewStaffPayload, systemRole: SystemRole | null) => call({ action: 'create', staff, systemRole });
export const grantAccess = (staffId: string, systemRole: SystemRole) => call({ action: 'grant_access', staffId, systemRole });
export const resendInvite = (staffId: string) => call({ action: 'resend_invite', staffId });
export const sendPasswordReset = (staffId: string) => call({ action: 'send_reset', staffId });
export const changeRole = (staffId: string, systemRole: SystemRole) => call({ action: 'change_role', staffId, systemRole });
export const revokeAccess = (staffId: string) => call({ action: 'revoke', staffId });
export const restoreAccess = (staffId: string) => call({ action: 'restore', staffId });
export const loadAccessStatus = () => call({ action: 'access_status' });
