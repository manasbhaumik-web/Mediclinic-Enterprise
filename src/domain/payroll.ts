/** Types, mappers and workflow rules for the admin Payroll screens. Calculation lives in the shared payrollCalc module. */
import {
  Citizenship, PayInputs, PayLine, RateRow, Scheme, RunTotals,
} from '../../supabase/functions/_shared/payrollCalc';

export type { PayInputs, PayLine, RateRow, Scheme, RunTotals, Citizenship };
export {
  SCHEMES, SCHEME_LABELS, calculatePayslip, summariseRun, validateInputs, runBlockers, unverifiedRates,
} from '../../supabase/functions/_shared/payrollCalc';

export type RunStatus = 'draft' | 'reviewed' | 'approved' | 'paid' | 'cancelled';

export interface EmployeeSnapshot {
  name: string;
  email?: string;
  jobTitle?: string;
  department?: string;
  icNumber?: string | null;
  dob?: string | null;
  citizenship: Citizenship;
  baseSalary: number;
  epfNumber?: string | null;
  socsoNumber?: string | null;
  taxRef?: string | null;
  bank: { name?: string | null; holder?: string | null; number?: string | null };
}

export interface PayrollRun {
  id: string;
  periodMonth: string;            // YYYY-MM-01
  status: RunStatus;
  workingDays: number;
  hoursPerDay: number;
  notes: string | null;
  totals: Partial<RunTotals>;
  createdAt: string;
  reviewedAt: string | null;
  approvedAt: string | null;
  paidAt: string | null;
  paidOn: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  reviewedBy: string | null;
  createdBy: string | null;
}

export interface Payslip {
  id: string;
  runId: string;
  staffId: string | null;
  employee: EmployeeSnapshot;
  inputs: PayInputs;
  lines: PayLine[];
  gross: number;
  totalDeductions: number;
  netPay: number;
  employerContributions: number;
  warnings: string[];
}

export interface PayItem {
  id: string;
  staffId: string;
  kind: 'allowance' | 'deduction';
  label: string;
  amount: number;
  contributory: boolean;
  active: boolean;
}

export interface PayrollEvent { id: string; runId: string; action: string; actor: string | null; detail: string | null; createdAt: string }

export const STATUS_STYLE: Record<RunStatus, { label: string; tone: 'idle' | 'info' | 'warn' | 'ok' | 'bad'; hint: string }> = {
  draft: { label: 'Draft', tone: 'idle', hint: 'Being prepared. Figures can still change.' },
  reviewed: { label: 'Awaiting approval', tone: 'warn', hint: 'Submitted for approval by an administrator.' },
  approved: { label: 'Approved', tone: 'info', hint: 'Frozen. Payslips and exports are final; ready to pay.' },
  paid: { label: 'Paid', tone: 'ok', hint: 'Salaries paid. This record is permanent.' },
  cancelled: { label: 'Cancelled', tone: 'bad', hint: 'Cancelled, kept on record.' },
};

/** Month label like "October 2026" from YYYY-MM-01. */
export function monthLabel(periodMonth: string): string {
  const [y, m] = periodMonth.slice(0, 10).split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleString('en-MY', { month: 'long', year: 'numeric', timeZone: 'UTC' });
}

export interface RunActions {
  recalc: boolean;
  editInputs: boolean;
  submit: boolean;
  returnToDraft: boolean;
  approve: boolean;
  markPaid: boolean;
  cancel: boolean;
  export: boolean;
}

/** Which buttons a person may use for a run. The server enforces the same rules. */
export function runActions(status: RunStatus, role: string | null | undefined): RunActions {
  const admin = role === 'admin';
  const staff = admin || role === 'hr';
  return {
    recalc: staff && status === 'draft',
    editInputs: staff && status === 'draft',
    submit: staff && status === 'draft',
    returnToDraft: staff && status === 'reviewed',
    approve: admin && status === 'reviewed',
    markPaid: admin && status === 'approved',
    cancel: (status === 'draft' || status === 'reviewed') ? staff : status === 'approved' ? admin : false,
    export: staff && (status === 'approved' || status === 'paid'),
  };
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export const runFromRow = (r: any): PayrollRun => ({
  id: r.id,
  periodMonth: String(r.period_month).slice(0, 10),
  status: r.status,
  workingDays: r.working_days,
  hoursPerDay: Number(r.hours_per_day),
  notes: r.notes,
  totals: r.totals ?? {},
  createdAt: r.created_at,
  reviewedAt: r.reviewed_at,
  approvedAt: r.approved_at,
  paidAt: r.paid_at,
  paidOn: r.paid_on,
  cancelledAt: r.cancelled_at,
  cancelReason: r.cancel_reason,
  reviewedBy: r.reviewed_by,
  createdBy: r.created_by,
});

export const slipFromRow = (r: any): Payslip => ({
  id: r.id,
  runId: r.run_id,
  staffId: r.staff_id,
  employee: r.employee,
  inputs: r.inputs ?? {},
  lines: r.lines ?? [],
  gross: Number(r.gross),
  totalDeductions: Number(r.total_deductions),
  netPay: Number(r.net_pay),
  employerContributions: Number(r.employer_contributions),
  warnings: r.warnings ?? [],
});

export const rateFromRow = (r: any): RateRow & { note?: string | null; verifiedAt?: string | null } => ({
  id: r.id,
  scheme: r.scheme,
  label: r.label,
  effectiveFrom: String(r.effective_from).slice(0, 10),
  priority: r.priority,
  eligibility: r.eligibility ?? {},
  config: r.config,
  active: r.active,
  verified: r.verified,
  note: r.note,
  verifiedAt: r.verified_at,
});

export const payItemFromRow = (r: any): PayItem => ({
  id: r.id, staffId: r.staff_id, kind: r.kind, label: r.label, amount: Number(r.amount), contributory: r.contributory, active: r.active,
});

export const eventFromRow = (r: any): PayrollEvent => ({
  id: r.id, runId: r.run_id, action: r.action, actor: r.actor, detail: r.detail, createdAt: r.created_at,
});

/** A short human summary of a rate row's configuration, for the rates table. */
export function describeRate(config: RateRow['config']): string {
  switch (config.type) {
    case 'percent':
      return `${(config.rate * 100).toFixed(2).replace(/\.?0+$/, '')}%${config.ceiling ? ` up to RM${config.ceiling.toLocaleString()}` : ''}${config.roundUpToRinggit ? ', rounded up to the ringgit' : ''}${config.includeOvertime ? ', includes overtime' : ''}`;
    case 'tiered':
      return config.tiers.map((t) => `${(t.rate * 100).toFixed(2).replace(/\.?0+$/, '')}% ${t.upTo === null ? 'above' : `up to RM${t.upTo.toLocaleString()}`}`).join(', ') + (config.roundUpToRinggit ? ', rounded up to the ringgit' : '');
    case 'bands':
      return `${config.bands.length} wage bands`;
    default:
      return 'No contribution';
  }
}
