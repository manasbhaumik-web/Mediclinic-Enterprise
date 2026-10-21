/** Types, mappers and workflow rules for the Leave & Attendance screens. Calculation lives in the shared leaveCalc module. */
import type { AttendanceStatus, LeaveRuleRow, LeaveSettings } from '../../supabase/functions/_shared/leaveCalc';

export type { AttendanceStatus, LeaveRuleRow, LeaveSettings };
export {
  DEFAULT_SETTINGS, addDays, expandLeaveDays, localParts, pickLeaveRule, summariseAttendance, sumDays,
} from '../../supabase/functions/_shared/leaveCalc';

export type RequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';
type Tone = 'idle' | 'info' | 'warn' | 'ok' | 'bad';

export interface LeaveType { code: string; name: string; paid: boolean; balanceLimited: boolean; active: boolean; sortOrder: number }

export interface LeaveRequest {
  id: string;
  staffId: string | null;
  staffName: string;
  leaveType: string;
  unpaid: boolean;
  startDate: string;
  endDate: string;
  halfDay: 'am' | 'pm' | null;
  days: number;
  reason: string | null;
  status: RequestStatus;
  requestedBy: string | null;
  requestedAt: string;
  decidedBy: string | null;
  decidedAt: string | null;
  decisionNote: string | null;
  cancelReason: string | null;
  staffAuthId: string | null;
}

export interface AttendanceRecord {
  id: string;
  staffId: string;
  date: string;
  status: AttendanceStatus;
  clockIn: string | null;
  clockOut: string | null;
  source: 'clock' | 'manual';
  note: string | null;
}

export interface Holiday { id: string; date: string; name: string }

export interface HrEvent { id: string; entity: string; entityId: string | null; staffId: string | null; action: string; actor: string | null; detail: Record<string, unknown> | null; createdAt: string }

export interface LeaveBalanceRow {
  code: string;
  name: string;
  paid: boolean;
  balanceLimited: boolean;
  entitled: number | null;
  taken: number;
  pending: number;
  remaining: number | null;
  hasRule: boolean;
  verified: boolean;
  warnings: string[];
}

export const REQUEST_STYLE: Record<RequestStatus, { label: string; tone: Tone }> = {
  pending: { label: 'Awaiting approval', tone: 'warn' },
  approved: { label: 'Approved', tone: 'ok' },
  rejected: { label: 'Rejected', tone: 'bad' },
  cancelled: { label: 'Cancelled', tone: 'idle' },
};

export const ATTENDANCE_LABEL: Record<AttendanceStatus, string> = { present: 'Present', late: 'Late', half_day: 'Half day', absent: 'Absent' };

export const isManager = (role: string | null | undefined) => role === 'admin' || role === 'hr';

/** Which buttons a person may use on a request. The server enforces the same rules. */
export function requestActions(r: Pick<LeaveRequest, 'status' | 'staffAuthId'>, role: string | null | undefined, userId: string | null | undefined) {
  const manager = isManager(role);
  const own = !!userId && r.staffAuthId === userId;
  return {
    approve: manager && r.status === 'pending',
    reject: manager && r.status === 'pending',
    cancel: (r.status === 'pending' && (manager || own)) || (r.status === 'approved' && manager),
    selfApprovalBlocked: manager && own && r.status === 'pending',
  };
}

export function formatRange(r: Pick<LeaveRequest, 'startDate' | 'endDate' | 'halfDay'>): string {
  const f = (d: string) => new Date(d + 'T00:00:00Z').toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
  const half = r.halfDay ? (r.halfDay === 'am' ? ' (morning)' : ' (afternoon)') : '';
  return r.startDate === r.endDate ? `${f(r.startDate)}${half}` : `${f(r.startDate)} to ${f(r.endDate)}`;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export const typeFromRow = (r: any): LeaveType => ({ code: r.code, name: r.name, paid: r.paid, balanceLimited: r.balance_limited, active: r.active, sortOrder: r.sort_order });

export const requestFromRow = (r: any): LeaveRequest => ({
  id: r.id, staffId: r.staff_id, staffName: r.staff_name, leaveType: r.leave_type, unpaid: r.unpaid, startDate: String(r.start_date).slice(0, 10),
  endDate: String(r.end_date).slice(0, 10), halfDay: r.half_day, days: Number(r.days), reason: r.reason, status: r.status, requestedBy: r.requested_by,
  requestedAt: r.requested_at, decidedBy: r.decided_by, decidedAt: r.decided_at, decisionNote: r.decision_note, cancelReason: r.cancel_reason, staffAuthId: r.staff_auth_id,
});

export const attendanceFromRow = (r: any): AttendanceRecord => ({
  id: r.id, staffId: r.staff_id, date: String(r.work_date).slice(0, 10), status: r.status, clockIn: r.clock_in, clockOut: r.clock_out, source: r.source, note: r.note,
});

export const holidayFromRow = (r: any): Holiday => ({ id: r.id, date: String(r.holiday_date).slice(0, 10), name: r.name });

export const eventFromRow = (r: any): HrEvent => ({
  id: r.id, entity: r.entity, entityId: r.entity_id, staffId: r.staff_id, action: r.action, actor: r.actor, detail: r.detail, createdAt: r.created_at,
});

export const settingsFromRow = (r: any): LeaveSettings => ({
  workDays: r.work_days, workStart: String(r.work_start).slice(0, 5), lateGraceMinutes: r.late_grace_minutes, timezone: r.timezone, backdateDays: r.backdate_days,
});

export const ruleFromRow = (r: any): LeaveRuleRow & { note: string | null } => ({
  id: r.id, leaveType: r.leave_type, label: r.label, effectiveFrom: String(r.effective_from).slice(0, 10), priority: r.priority,
  eligibility: r.eligibility ?? {}, config: r.config, active: r.active, verified: r.verified, note: r.note,
});

export const WEEKDAYS = [
  { n: 1, label: 'Mon' }, { n: 2, label: 'Tue' }, { n: 3, label: 'Wed' }, { n: 4, label: 'Thu' }, { n: 5, label: 'Fri' }, { n: 6, label: 'Sat' }, { n: 7, label: 'Sun' },
];

export function describeEntitlement(c: LeaveRuleRow['config']): string {
  if (c.type === 'unlimited') return 'No limit';
  if (c.type === 'fixed') return `${c.days} days${c.prorate ? ', prorated in the first year' : ''}`;
  return [...c.tiers].sort((a, b) => a.minYears - b.minYears).map((t) => `${t.days} days from ${t.minYears} yr${t.minYears === 1 ? '' : 's'}`).join(', ') + (c.prorate ? ', prorated in the first year' : '');
}
