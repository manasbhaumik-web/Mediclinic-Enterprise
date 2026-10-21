/**
 * Leave and attendance calculation. Pure TypeScript with no Deno globals: the same code runs in the leave edge
 * function (authoritative), the browser (displays) and the unit tests.
 *
 * Entitlements are NOT hard-coded. Every figure comes from rule rows (the leave_rules table) that an administrator
 * edits and verifies, so a change in law or policy never needs a code change.
 *
 * Conventions:
 *   - Working days are the ISO weekdays in settings.workDays, minus public holidays.
 *   - Leave is counted in working days. A half day (single day only) counts 0.5.
 *   - The leave year is the calendar year. Service for tier selection is measured at 1 January of that year.
 *   - Balance = entitlement - approved days. Pending days are shown separately and also reserved when filing.
 *   - Attendance rate = attended working days / recorded working days. Days with no record are reported as
 *     "unrecorded" and are NOT counted for or against the person.
 */

export interface LeaveSettings {
  workDays: number[];            // ISO weekdays, 1 = Monday ... 7 = Sunday
  workStart: string;             // HH:MM or HH:MM:SS, local time
  lateGraceMinutes: number;
  timezone: string;
  backdateDays: number;
}

export const DEFAULT_SETTINGS: LeaveSettings = {
  workDays: [1, 2, 3, 4, 5, 6], workStart: '09:00', lateGraceMinutes: 15, timezone: 'Asia/Kuala_Lumpur', backdateDays: 30,
};

export type EntitlementConfig =
  | { type: 'fixed'; days: number; prorate?: boolean }
  | { type: 'service_tiers'; tiers: { minYears: number; days: number }[]; prorate?: boolean }
  | { type: 'unlimited' };

export interface LeaveEligibility { genders?: string[]; minServiceMonths?: number }

export interface LeaveRuleRow {
  id: string;
  leaveType: string;
  label: string;
  effectiveFrom: string;         // YYYY-MM-DD
  priority: number;
  eligibility: LeaveEligibility;
  config: EntitlementConfig;
  active: boolean;
  verified: boolean;
}

export interface LeaveDay { date: string; fraction: number }

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
export const isDate = (s: unknown): s is string => typeof s === 'string' && DATE_RE.test(s) && !Number.isNaN(Date.parse(s + 'T00:00:00Z'));

const utc = (d: string) => Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10));
const toStr = (ms: number) => new Date(ms).toISOString().slice(0, 10);
export const addDays = (d: string, n: number) => toStr(utc(d) + n * 86400000);
export const daysBetween = (from: string, to: string) => Math.round((utc(to) - utc(from)) / 86400000);

/** ISO weekday of a YYYY-MM-DD date: 1 = Monday ... 7 = Sunday. */
export function isoWeekday(d: string): number {
  const w = new Date(utc(d)).getUTCDay();
  return w === 0 ? 7 : w;
}

export const isWorkingDay = (d: string, settings: LeaveSettings, holidays: ReadonlySet<string>): boolean =>
  settings.workDays.includes(isoWeekday(d)) && !holidays.has(d);

/** The working days (with fractions) a leave request covers. A half day only applies to a single-day request. */
export function expandLeaveDays(start: string, end: string, halfDay: 'am' | 'pm' | null | undefined, settings: LeaveSettings, holidays: ReadonlySet<string>): LeaveDay[] {
  const out: LeaveDay[] = [];
  const n = daysBetween(start, end);
  for (let i = 0; i <= n; i++) {
    const d = addDays(start, i);
    if (isWorkingDay(d, settings, holidays)) out.push({ date: d, fraction: halfDay && start === end ? 0.5 : 1 });
  }
  return out;
}

export const sumDays = (days: { fraction: number }[]): number => Math.round(days.reduce((s, d) => s + d.fraction, 0) * 10) / 10;

/** Completed months of service on a date, or null if unknown. */
export function completedMonths(hireDate: string | null | undefined, onDate: string): number | null {
  if (!hireDate || !isDate(hireDate)) return null;
  let m = (+onDate.slice(0, 4) - +hireDate.slice(0, 4)) * 12 + (+onDate.slice(5, 7) - +hireDate.slice(5, 7));
  if (+onDate.slice(8, 10) < +hireDate.slice(8, 10)) m--;
  return Math.max(0, m);
}

export interface Who { gender?: string | null; hireDate?: string | null }

export function ruleApplies(r: LeaveRuleRow, year: number, who: Who): boolean {
  if (!r.active || r.effectiveFrom > `${year}-12-31`) return false;
  const e = r.eligibility ?? {};
  if (e.genders && e.genders.length > 0) {
    const g = (who.gender ?? '').toLowerCase();
    if (!e.genders.map((x) => x.toLowerCase()).includes(g)) return false;
  }
  if (e.minServiceMonths !== undefined) {
    const months = completedMonths(who.hireDate, `${year}-12-31`);
    if (months === null || months < e.minServiceMonths) return false;
  }
  return true;
}

/** The rule that applies: active, started by the end of the year, eligible; highest priority then newest. */
export function pickLeaveRule(rules: LeaveRuleRow[], leaveType: string, year: number, who: Who): LeaveRuleRow | null {
  const c = rules
    .filter((r) => r.leaveType === leaveType && ruleApplies(r, year, who))
    .sort((a, b) => b.priority - a.priority || (a.effectiveFrom < b.effectiveFrom ? 1 : a.effectiveFrom > b.effectiveFrom ? -1 : 0));
  return c[0] ?? null;
}

const roundHalf = (n: number) => Math.round(n * 2) / 2;

/** Days a rule grants for a leave year. `days: null` means unlimited. Never guesses an unknown hire date upwards. */
export function entitlementDays(rule: LeaveRuleRow, who: Who, year: number): { days: number | null; warnings: string[] } {
  const warnings: string[] = [];
  const cfg = rule.config;
  if (cfg.type === 'unlimited') return { days: null, warnings };

  let days = 0;
  if (cfg.type === 'fixed') {
    days = cfg.days;
  } else if (cfg.type === 'service_tiers') {
    const tiers = [...cfg.tiers].sort((a, b) => a.minYears - b.minYears);
    const months = completedMonths(who.hireDate, `${year}-01-01`);
    let years = 0;
    if (months === null) warnings.push('Hire date is not set, so the lowest service tier is used.');
    else years = Math.floor(months / 12);
    days = tiers.filter((t) => years >= t.minYears).pop()?.days ?? tiers[0]?.days ?? 0;
  }

  if (cfg.prorate && who.hireDate && isDate(who.hireDate) && +who.hireDate.slice(0, 4) === year) {
    const monthsLeft = 12 - (+who.hireDate.slice(5, 7) - 1);
    days = roundHalf((days * monthsLeft) / 12);
  }
  return { days, warnings };
}

export interface LeaveBalance {
  leaveType: string;
  entitled: number | null;       // null = unlimited or no rule
  taken: number;                 // approved
  pending: number;
  remaining: number | null;      // entitled - taken - pending
  hasRule: boolean;
  verified: boolean;
  warnings: string[];
}

export function computeBalance(leaveType: string, rule: LeaveRuleRow | null, who: Who, year: number, taken: number, pending: number): LeaveBalance {
  if (!rule) return { leaveType, entitled: null, taken, pending, remaining: null, hasRule: false, verified: false, warnings: ['No entitlement rule applies to this person.'] };
  const e = entitlementDays(rule, who, year);
  return {
    leaveType, entitled: e.days, taken, pending, hasRule: true, verified: rule.verified, warnings: e.warnings,
    remaining: e.days === null ? null : Math.round((e.days - taken - pending) * 10) / 10,
  };
}

/** Local date (YYYY-MM-DD) and time (HH:MM) of an instant in a time zone. */
export function localParts(ts: Date | string | number, timezone: string): { date: string; time: string } {
  const f = new Intl.DateTimeFormat('en-CA', { timeZone: timezone, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  const p = Object.fromEntries(f.formatToParts(new Date(ts)).map((x) => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, time: `${p.hour}:${p.minute}` };
}

/** ISO instant of a local date and HH:MM in a time zone. */
export function zonedTimeToIso(date: string, time: string, timezone: string): string {
  const guess = Date.parse(`${date}T${time.slice(0, 5)}:00Z`);
  const lp = localParts(guess, timezone);
  const shown = Date.parse(`${lp.date}T${lp.time}:00Z`);
  return new Date(guess - (shown - guess)).toISOString();
}

/** present, or late if the clock-in is after the start time plus the grace period. */
export function clockStatus(localTime: string, settings: LeaveSettings): 'present' | 'late' {
  const mins = (t: string) => +t.slice(0, 2) * 60 + +t.slice(3, 5);
  return mins(localTime) > mins(settings.workStart) + settings.lateGraceMinutes ? 'late' : 'present';
}

export type AttendanceStatus = 'present' | 'late' | 'half_day' | 'absent';
export interface AttendanceLike { date: string; status: AttendanceStatus }

export interface AttendanceSummary {
  workingDays: number;           // scheduled working days in the period, up to today, excluding full-day leave
  leaveDays: number;
  recordedDays: number;
  attended: number;
  late: number;
  absent: number;
  unrecorded: number;
  rate: number | null;           // percent, null when nothing is recorded
}

/** Attendance for a period (inclusive). Days after `today` are ignored. */
export function summariseAttendance(
  records: AttendanceLike[], leave: LeaveDay[], settings: LeaveSettings, holidays: ReadonlySet<string>, from: string, to: string, today: string,
): AttendanceSummary {
  const end = to < today ? to : today;
  const byDate = new Map(records.map((r) => [r.date, r.status]));
  const leaveByDate = new Map<string, number>();
  for (const l of leave) leaveByDate.set(l.date, Math.min(1, (leaveByDate.get(l.date) ?? 0) + l.fraction));

  const s: AttendanceSummary = { workingDays: 0, leaveDays: 0, recordedDays: 0, attended: 0, late: 0, absent: 0, unrecorded: 0, rate: null };
  let attended = 0, recorded = 0;
  for (let d = from; d <= end; d = addDays(d, 1)) {
    if (!isWorkingDay(d, settings, holidays)) continue;
    const lf = leaveByDate.get(d) ?? 0;
    s.leaveDays += lf;
    const w = 1 - lf;
    if (w <= 0) continue;
    s.workingDays += w;
    const st = byDate.get(d);
    if (!st) { s.unrecorded += 1; continue; }
    s.recordedDays += 1;
    recorded += w;
    if (st === 'present') attended += w;
    else if (st === 'late') { attended += w; s.late += 1; }
    else if (st === 'half_day') { attended += w * 0.5; }
    else s.absent += 1;
  }
  s.attended = Math.round(attended * 10) / 10;
  s.leaveDays = Math.round(s.leaveDays * 10) / 10;
  s.workingDays = Math.round(s.workingDays * 10) / 10;
  s.rate = recorded > 0 ? Math.round((attended / recorded) * 1000) / 10 : null;
  return s;
}

/** Unpaid leave days that fall inside a month (YYYY-MM-01), from the days of approved unpaid requests. */
export function unpaidDaysInMonth(days: { date: string; fraction: number }[], periodStart: string): number {
  const month = periodStart.slice(0, 7);
  return sumDays(days.filter((d) => d.date.slice(0, 7) === month));
}

/** Problems with a leave request's dates, as sentences. */
export function validateRequestDates(start: unknown, end: unknown, halfDay: unknown, today: string, settings: LeaveSettings, isSelfService: boolean): string[] {
  const p: string[] = [];
  if (!isDate(start) || !isDate(end)) return ['Enter a start and an end date.'];
  if (end < start) p.push('The end date is before the start date.');
  if (daysBetween(start, end) > 365) p.push('A single request cannot cover more than a year.');
  if (halfDay !== null && halfDay !== undefined && halfDay !== 'am' && halfDay !== 'pm') p.push('Half day must be morning or afternoon.');
  if (halfDay && start !== end) p.push('A half day can only be requested for a single day.');
  if (isSelfService && start < addDays(today, -settings.backdateDays)) p.push(`You can only file leave up to ${settings.backdateDays} days in the past. Ask HR to file it.`);
  return p;
}
