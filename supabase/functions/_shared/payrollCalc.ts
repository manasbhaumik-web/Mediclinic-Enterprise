/**
 * Payroll calculation. Pure TypeScript with no Deno globals: the same code runs in the payroll edge function
 * (authoritative), the browser (previews) and the unit tests.
 *
 * Statutory rates are NOT hard-coded. Every EPF, SOCSO, EIS and PCB figure comes from rate rows (the
 * payroll_rates table) that an administrator edits and verifies, so a rate change never needs a code change.
 *
 * Conventions (all configurable per run or per rate row, and stated on the payslip):
 *   - Daily rate    = monthly basic / working days in the month (default 26).
 *   - Hourly rate   = daily rate / hours per day (default 8).
 *   - Overtime pay  = hourly rate x multiplier x hours.
 *   - Unpaid leave  = daily rate x days, never more than the basic.
 *   - Contribution wages = basic - unpaid leave + contributory allowances, plus overtime only where the rate
 *     row says includeOvertime.
 *   - Net pay       = gross earnings - employee statutory deductions - PCB - other deductions.
 *   - Employer contributions are reported separately and never reduce net pay.
 */

export type Scheme = 'epf_employee' | 'epf_employer' | 'socso_employee' | 'socso_employer' | 'eis_employee' | 'eis_employer' | 'pcb';
export const SCHEMES: readonly Scheme[] = ['epf_employee', 'epf_employer', 'socso_employee', 'socso_employer', 'eis_employee', 'eis_employer', 'pcb'];

export const SCHEME_LABELS: Record<Scheme, string> = {
  epf_employee: 'EPF (employee)',
  epf_employer: 'EPF (employer)',
  socso_employee: 'SOCSO (employee)',
  socso_employer: 'SOCSO (employer)',
  eis_employee: 'EIS (employee)',
  eis_employer: 'EIS (employer)',
  pcb: 'PCB (monthly tax deduction)',
};

export type Citizenship = 'citizen' | 'pr' | 'foreign';

export interface Eligibility { minAge?: number; maxAge?: number; citizenships?: Citizenship[] }

export type RateConfig =
  | { type: 'percent'; rate: number; ceiling?: number; floor?: number; roundUpToRinggit?: boolean; includeOvertime?: boolean }
  | { type: 'tiered'; tiers: { upTo: number | null; rate: number }[]; ceiling?: number; roundUpToRinggit?: boolean; includeOvertime?: boolean }
  | { type: 'bands'; bands: { from: number; to: number | null; amount: number }[]; includeOvertime?: boolean }
  | { type: 'none' };

export interface RateRow {
  id: string;
  scheme: Scheme;
  label: string;
  effectiveFrom: string;     // YYYY-MM-DD
  priority: number;
  eligibility: Eligibility;
  config: RateConfig;
  active: boolean;
  verified: boolean;
}

export interface PayLineInput { label: string; amount: number; contributory?: boolean }
export interface OvertimeInput { hours: number; multiplier: number; label?: string }

export interface PayInputs {
  allowances?: PayLineInput[];
  deductions?: PayLineInput[];
  overtime?: OvertimeInput[];
  unpaidLeaveDays?: number;
  /** When set (including 0), replaces any calculated PCB. */
  pcbOverride?: number | null;
}

export interface EmployeeForPay {
  id: string;
  name: string;
  baseSalary: number;
  dob?: string | null;
  citizenship: Citizenship;
}

export interface RunParams { periodStart: string; workingDays: number; hoursPerDay: number }

export interface PayLine {
  code: string;
  label: string;
  kind: 'earning' | 'deduction' | 'employer';
  amount: number;
  note?: string;
}

export interface PayslipResult {
  lines: PayLine[];
  gross: number;
  totalDeductions: number;
  netPay: number;
  employerContributions: number;
  warnings: string[];
  /** Ids of the rate rows used, so a run can snapshot exactly what it relied on. */
  usedRates: string[];
}

export const r2 = (n: number): number => Math.round((n + Number.EPSILON) * 100) / 100;

/** Last day of the month that `periodStart` (YYYY-MM-01) belongs to, as YYYY-MM-DD. */
export function periodEnd(periodStart: string): string {
  const [y, m] = periodStart.split('-').map(Number);
  return new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10);
}

/** Whole years of age on a date (YYYY-MM-DD), or null if the birth date is unknown. */
export function ageOn(dob: string | null | undefined, onDate: string): number | null {
  if (!dob || !/^\d{4}-\d{2}-\d{2}$/.test(dob)) return null;
  const [by, bm, bd] = dob.split('-').map(Number);
  const [y, m, d] = onDate.split('-').map(Number);
  let age = y - by;
  if (m < bm || (m === bm && d < bd)) age--;
  return age;
}

export function isEligible(e: Eligibility, who: { dob?: string | null; citizenship: Citizenship }, onDate: string): boolean {
  if (e.citizenships && e.citizenships.length > 0 && !e.citizenships.includes(who.citizenship)) return false;
  if (e.minAge !== undefined || e.maxAge !== undefined) {
    const age = ageOn(who.dob, onDate);
    if (age === null) return false;      // an age rule cannot be applied to an unknown age: flag it, do not guess
    if (e.minAge !== undefined && age < e.minAge) return false;
    if (e.maxAge !== undefined && age > e.maxAge) return false;
  }
  return true;
}

/** The rate row that applies: active, started on or before the period end, eligible; highest priority then newest. */
export function pickRate(rows: RateRow[], scheme: Scheme, onDate: string, who: { dob?: string | null; citizenship: Citizenship }): RateRow | null {
  const candidates = rows
    .filter((r) => r.active && r.scheme === scheme && r.effectiveFrom <= onDate && isEligible(r.eligibility ?? {}, who, onDate))
    .sort((a, b) => b.priority - a.priority || (a.effectiveFrom < b.effectiveFrom ? 1 : a.effectiveFrom > b.effectiveFrom ? -1 : 0));
  return candidates[0] ?? null;
}

/** Contribution for the given wages under a rate config. */
export function computeContribution(config: RateConfig, wages: number): number {
  if (!(wages > 0) || config.type === 'none') return 0;
  let amount = 0;

  if (config.type === 'percent') {
    let base = wages;
    if (config.floor !== undefined && base < config.floor) return 0;
    if (config.ceiling !== undefined) base = Math.min(base, config.ceiling);
    amount = base * config.rate;
  } else if (config.type === 'tiered') {
    const tier = config.tiers.find((t) => t.upTo === null || wages <= t.upTo) ?? config.tiers[config.tiers.length - 1];
    const base = config.ceiling !== undefined ? Math.min(wages, config.ceiling) : wages;
    amount = tier ? base * tier.rate : 0;
  } else if (config.type === 'bands') {
    const band = config.bands.find((b) => wages >= b.from && (b.to === null || wages <= b.to));
    amount = band ? band.amount : 0;
  }

  amount = r2(amount);
  if ((config.type === 'percent' || config.type === 'tiered') && config.roundUpToRinggit) amount = Math.ceil(amount);
  return amount;
}

const finite = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n);

/** Problems with manually entered inputs, as sentences for the person entering them. */
export function validateInputs(inputs: PayInputs, workingDays: number): string[] {
  const problems: string[] = [];
  for (const [name, list] of [['Allowance', inputs.allowances], ['Deduction', inputs.deductions]] as const) {
    (list ?? []).forEach((l, i) => {
      if (!l.label || !l.label.trim()) problems.push(`${name} ${i + 1} needs a description`);
      if (!finite(l.amount) || l.amount < 0) problems.push(`${name} ${i + 1} must be an amount of zero or more`);
    });
  }
  (inputs.overtime ?? []).forEach((o, i) => {
    if (!finite(o.hours) || o.hours < 0 || o.hours > 400) problems.push(`Overtime ${i + 1}: hours must be between 0 and 400`);
    if (!finite(o.multiplier) || o.multiplier < 1 || o.multiplier > 5) problems.push(`Overtime ${i + 1}: multiplier must be between 1 and 5`);
  });
  if (inputs.unpaidLeaveDays !== undefined && (!finite(inputs.unpaidLeaveDays) || inputs.unpaidLeaveDays < 0 || inputs.unpaidLeaveDays > workingDays)) {
    problems.push(`Unpaid leave must be between 0 and ${workingDays} days`);
  }
  if (inputs.pcbOverride !== undefined && inputs.pcbOverride !== null && (!finite(inputs.pcbOverride) || inputs.pcbOverride < 0)) {
    problems.push('PCB must be an amount of zero or more');
  }
  return problems;
}

/** Calculate one payslip. Never throws on bad data: problems come back as warnings and the line is left at 0. */
export function calculatePayslip(
  emp: EmployeeForPay, run: RunParams, inputs: PayInputs, recurring: { allowances: PayLineInput[]; deductions: PayLineInput[] }, rates: RateRow[],
): PayslipResult {
  const warnings: string[] = [];
  const lines: PayLine[] = [];
  const usedRates: string[] = [];
  const endDate = periodEnd(run.periodStart);

  const base = r2(Math.max(0, finite(emp.baseSalary) ? emp.baseSalary : 0));
  if (base === 0) warnings.push('Basic salary is 0. Set it on the pay profile.');

  const dailyRate = base / run.workingDays;
  const hourlyRate = dailyRate / run.hoursPerDay;

  // ---- earnings ----
  lines.push({ code: 'BASIC', label: 'Basic salary', kind: 'earning', amount: base });

  const unpaidDays = finite(inputs.unpaidLeaveDays) ? Math.min(Math.max(inputs.unpaidLeaveDays, 0), run.workingDays) : 0;
  const unpaid = unpaidDays > 0 ? Math.min(base, r2(dailyRate * unpaidDays)) : 0;
  if (unpaid > 0) lines.push({ code: 'UNPAID_LEAVE', label: `Unpaid leave (${unpaidDays} day${unpaidDays === 1 ? '' : 's'})`, kind: 'earning', amount: -unpaid, note: `${r2(dailyRate)} per day` });

  let contributoryWages = base - unpaid;
  const allowances = [...recurring.allowances, ...(inputs.allowances ?? [])];
  allowances.forEach((a, i) => {
    const amount = finite(a.amount) && a.amount > 0 ? r2(a.amount) : 0;
    if (amount === 0) return;
    lines.push({ code: `ALLOWANCE_${i + 1}`, label: a.label, kind: 'earning', amount, note: a.contributory === false ? 'Not subject to statutory contributions' : undefined });
    if (a.contributory !== false) contributoryWages += amount;
  });

  let overtimePay = 0;
  (inputs.overtime ?? []).forEach((o, i) => {
    if (!finite(o.hours) || !finite(o.multiplier) || o.hours <= 0) return;
    const pay = r2(hourlyRate * o.multiplier * o.hours);
    overtimePay += pay;
    lines.push({ code: `OVERTIME_${i + 1}`, label: o.label?.trim() || `Overtime (${o.hours} h x ${o.multiplier})`, kind: 'earning', amount: pay, note: `${r2(hourlyRate)} per hour` });
  });

  const gross = r2(lines.filter((l) => l.kind === 'earning').reduce((s, l) => s + l.amount, 0));

  // ---- statutory ----
  const who = { dob: emp.dob, citizenship: emp.citizenship };
  const statutory = (scheme: Scheme, code: string, label: string, kind: 'deduction' | 'employer') => {
    const row = pickRate(rates, scheme, endDate, who);
    if (!row) {
      warnings.push(`No ${SCHEME_LABELS[scheme]} rate applies (check age, citizenship and the rate table). It is calculated as 0.`);
      return 0;
    }
    usedRates.push(row.id);
    const wages = contributoryWages + (row.config.type !== 'none' && (row.config as { includeOvertime?: boolean }).includeOvertime ? overtimePay : 0);
    const amount = computeContribution(row.config, wages);
    if (amount > 0) lines.push({ code, label, kind, amount, note: row.label });
    return amount;
  };

  const epfEe = statutory('epf_employee', 'EPF_EE', 'EPF (employee)', 'deduction');
  const socsoEe = statutory('socso_employee', 'SOCSO_EE', 'SOCSO (employee)', 'deduction');
  const eisEe = statutory('eis_employee', 'EIS_EE', 'EIS (employee)', 'deduction');
  statutory('epf_employer', 'EPF_ER', 'EPF (employer)', 'employer');
  statutory('socso_employer', 'SOCSO_ER', 'SOCSO (employer)', 'employer');
  statutory('eis_employer', 'EIS_ER', 'EIS (employer)', 'employer');

  // ---- PCB: a manual figure wins; otherwise a configured table; otherwise 0 ----
  let pcb = 0;
  if (inputs.pcbOverride !== undefined && inputs.pcbOverride !== null && finite(inputs.pcbOverride)) {
    pcb = r2(Math.max(0, inputs.pcbOverride));
    if (pcb > 0) lines.push({ code: 'PCB', label: 'PCB (monthly tax deduction)', kind: 'deduction', amount: pcb, note: 'Entered manually' });
  } else {
    const row = pickRate(rates, 'pcb', endDate, who);
    if (row) {
      usedRates.push(row.id);
      pcb = computeContribution(row.config, gross);
      if (pcb > 0) lines.push({ code: 'PCB', label: 'PCB (monthly tax deduction)', kind: 'deduction', amount: pcb, note: row.label });
    }
  }

  // ---- other deductions ----
  const deductions = [...recurring.deductions, ...(inputs.deductions ?? [])];
  deductions.forEach((d, i) => {
    const amount = finite(d.amount) && d.amount > 0 ? r2(d.amount) : 0;
    if (amount > 0) lines.push({ code: `DEDUCTION_${i + 1}`, label: d.label, kind: 'deduction', amount });
  });

  const totalDeductions = r2(lines.filter((l) => l.kind === 'deduction').reduce((s, l) => s + l.amount, 0));
  const employerContributions = r2(lines.filter((l) => l.kind === 'employer').reduce((s, l) => s + l.amount, 0));
  const netPay = r2(gross - totalDeductions);
  if (netPay < 0) warnings.push('Deductions are larger than gross pay, so net pay is negative.');
  void epfEe; void socsoEe; void eisEe;

  return { lines, gross, totalDeductions, netPay, employerContributions, warnings, usedRates: [...new Set(usedRates)] };
}

export interface RunTotals {
  headcount: number;
  gross: number;
  totalDeductions: number;
  netPay: number;
  employerContributions: number;
  /** Sum per line code (EPF_EE, EPF_ER, SOCSO_EE, SOCSO_ER, EIS_EE, EIS_ER, PCB). */
  statutory: Record<string, number>;
  employerCost: number;
}

const STATUTORY_CODES = ['EPF_EE', 'EPF_ER', 'SOCSO_EE', 'SOCSO_ER', 'EIS_EE', 'EIS_ER', 'PCB'];

export function summariseRun(slips: { gross: number; totalDeductions: number; netPay: number; employerContributions: number; lines: PayLine[] }[]): RunTotals {
  const totals: RunTotals = { headcount: slips.length, gross: 0, totalDeductions: 0, netPay: 0, employerContributions: 0, statutory: {}, employerCost: 0 };
  for (const c of STATUTORY_CODES) totals.statutory[c] = 0;
  for (const s of slips) {
    totals.gross += s.gross; totals.totalDeductions += s.totalDeductions; totals.netPay += s.netPay; totals.employerContributions += s.employerContributions;
    for (const l of s.lines) if (STATUTORY_CODES.includes(l.code)) totals.statutory[l.code] = r2(totals.statutory[l.code] + l.amount);
  }
  totals.gross = r2(totals.gross); totals.totalDeductions = r2(totals.totalDeductions); totals.netPay = r2(totals.netPay);
  totals.employerContributions = r2(totals.employerContributions);
  totals.employerCost = r2(totals.gross + totals.employerContributions);
  return totals;
}

/** Rate rows used by any payslip that are not verified, as human-readable labels. Approval is refused while any exist. */
export function unverifiedRates(rates: RateRow[], usedIds: string[]): string[] {
  const used = new Set(usedIds);
  return rates.filter((r) => used.has(r.id) && !r.verified).map((r) => `${SCHEME_LABELS[r.scheme]}: ${r.label}`);
}

/** The run-level problems an approver should see before approving. */
export function runBlockers(rates: RateRow[], usedIds: string[], slips: { employee: { name: string }; warnings: string[]; netPay: number }[]): string[] {
  const blockers: string[] = [];
  const unverified = unverifiedRates(rates, usedIds);
  if (unverified.length) blockers.push(`Unverified rates are in use: ${unverified.join('; ')}. An administrator must verify them on the Rates tab.`);
  const negative = slips.filter((s) => s.netPay < 0).map((s) => s.employee.name);
  if (negative.length) blockers.push(`Negative net pay for: ${negative.slice(0, 5).join(', ')}${negative.length > 5 ? ', …' : ''}.`);
  if (slips.length === 0) blockers.push('The run has no payslips.');
  return blockers;
}
