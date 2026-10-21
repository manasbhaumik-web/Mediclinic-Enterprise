import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SETTINGS, LeaveRuleRow, addDays, clockStatus, completedMonths, computeBalance, entitlementDays, expandLeaveDays, isoWeekday,
  localParts, pickLeaveRule, summariseAttendance, sumDays, unpaidDaysInMonth, validateRequestDates, zonedTimeToIso,
} from './leaveCalc';

const S = DEFAULT_SETTINGS;                       // Monday to Saturday
const NO_HOLIDAYS = new Set<string>();

const annual: LeaveRuleRow = {
  id: 'a', leaveType: 'annual', label: 'Annual', effectiveFrom: '2023-01-01', priority: 0, eligibility: {}, active: true, verified: true,
  config: { type: 'service_tiers', tiers: [{ minYears: 0, days: 8 }, { minYears: 2, days: 12 }, { minYears: 5, days: 16 }] },
};
const rule = (over: Partial<LeaveRuleRow>): LeaveRuleRow => ({ ...annual, ...over });

describe('dates and working days', () => {
  it('finds the ISO weekday', () => {
    expect(isoWeekday('2026-10-19')).toBe(1);   // Monday
    expect(isoWeekday('2026-10-25')).toBe(7);   // Sunday
  });
  it('counts working days Monday to Saturday and skips Sundays', () => {
    const d = expandLeaveDays('2026-10-19', '2026-10-26', null, S, NO_HOLIDAYS);   // Mon..next Mon, one Sunday in between
    expect(sumDays(d)).toBe(7);
  });
  it('skips public holidays', () => {
    const d = expandLeaveDays('2026-10-19', '2026-10-21', null, S, new Set(['2026-10-20']));
    expect(d.map((x) => x.date)).toEqual(['2026-10-19', '2026-10-21']);
  });
  it('a half day is 0.5 and only for a single day', () => {
    expect(sumDays(expandLeaveDays('2026-10-19', '2026-10-19', 'am', S, NO_HOLIDAYS))).toBe(0.5);
    expect(sumDays(expandLeaveDays('2026-10-19', '2026-10-20', 'am', S, NO_HOLIDAYS))).toBe(2);
  });
  it('a weekend-only range has no working days', () => {
    expect(expandLeaveDays('2026-10-25', '2026-10-25', null, S, NO_HOLIDAYS)).toEqual([]);
  });
  it('respects a Monday to Friday week', () => {
    const five = { ...S, workDays: [1, 2, 3, 4, 5] };
    expect(sumDays(expandLeaveDays('2026-10-19', '2026-10-25', null, five, NO_HOLIDAYS))).toBe(5);
  });
});

describe('entitlement rules', () => {
  it('measures completed months of service', () => {
    expect(completedMonths('2024-03-15', '2026-01-01')).toBe(21);
    expect(completedMonths('2024-03-15', '2026-03-14')).toBe(23);
    expect(completedMonths(null, '2026-01-01')).toBeNull();
  });
  it('picks the service tier at 1 January of the year', () => {
    expect(entitlementDays(annual, { hireDate: '2025-06-01' }, 2026).days).toBe(8);     // 7 months
    expect(entitlementDays(annual, { hireDate: '2024-01-01' }, 2026).days).toBe(12);    // exactly 2 years
    expect(entitlementDays(annual, { hireDate: '2020-01-01' }, 2026).days).toBe(16);    // 6 years
  });
  it('uses the lowest tier and warns when the hire date is unknown', () => {
    const r = entitlementDays(annual, {}, 2026);
    expect(r.days).toBe(8);
    expect(r.warnings.join(' ')).toMatch(/hire date/i);
  });
  it('fixed and unlimited rules', () => {
    expect(entitlementDays(rule({ config: { type: 'fixed', days: 60 } }), {}, 2026).days).toBe(60);
    expect(entitlementDays(rule({ config: { type: 'unlimited' } }), {}, 2026).days).toBeNull();
  });
  it('prorates the first year when asked to', () => {
    const r = rule({ config: { type: 'fixed', days: 12, prorate: true } });
    expect(entitlementDays(r, { hireDate: '2026-07-10' }, 2026).days).toBe(6);          // July to December = 6 of 12 months
    expect(entitlementDays(r, { hireDate: '2025-07-10' }, 2026).days).toBe(12);
  });
  it('applies gender and service eligibility', () => {
    const mat = rule({ leaveType: 'maternity', eligibility: { genders: ['female'] }, config: { type: 'fixed', days: 98 } });
    expect(pickLeaveRule([mat], 'maternity', 2026, { gender: 'Female' })).not.toBeNull();
    expect(pickLeaveRule([mat], 'maternity', 2026, { gender: 'Male' })).toBeNull();
    const pat = rule({ leaveType: 'paternity', eligibility: { genders: ['male'], minServiceMonths: 12 }, config: { type: 'fixed', days: 7 } });
    expect(pickLeaveRule([pat], 'paternity', 2026, { gender: 'Male', hireDate: '2026-06-01' })).toBeNull();
    expect(pickLeaveRule([pat], 'paternity', 2026, { gender: 'Male', hireDate: '2024-06-01' })).not.toBeNull();
    expect(pickLeaveRule([pat], 'paternity', 2026, { gender: 'Male' })).toBeNull();      // unknown hire date: not guessed
  });
  it('prefers higher priority, then the newer rule, and ignores inactive or future rules', () => {
    const old = rule({ id: 'old', effectiveFrom: '2023-01-01' });
    const fresh = rule({ id: 'new', effectiveFrom: '2025-01-01' });
    const high = rule({ id: 'hi', effectiveFrom: '2024-01-01', priority: 5 });
    expect(pickLeaveRule([old, fresh], 'annual', 2026, {})?.id).toBe('new');
    expect(pickLeaveRule([old, fresh, high], 'annual', 2026, {})?.id).toBe('hi');
    expect(pickLeaveRule([rule({ active: false })], 'annual', 2026, {})).toBeNull();
    expect(pickLeaveRule([rule({ effectiveFrom: '2027-01-01' })], 'annual', 2026, {})).toBeNull();
  });
});

describe('balances', () => {
  it('derives remaining from approved and pending days', () => {
    const b = computeBalance('annual', annual, { hireDate: '2024-01-01' }, 2026, 5, 2);
    expect(b).toMatchObject({ entitled: 12, taken: 5, pending: 2, remaining: 5, hasRule: true });
  });
  it('reports a missing rule instead of inventing an entitlement', () => {
    const b = computeBalance('annual', null, {}, 2026, 0, 0);
    expect(b.hasRule).toBe(false);
    expect(b.remaining).toBeNull();
  });
});

describe('request validation', () => {
  it('accepts a normal request', () => {
    expect(validateRequestDates('2026-10-20', '2026-10-22', null, '2026-10-19', S, true)).toEqual([]);
  });
  it('rejects reversed, half-day-range and over-long requests', () => {
    expect(validateRequestDates('2026-10-22', '2026-10-20', null, '2026-10-19', S, false).join(' ')).toMatch(/before/);
    expect(validateRequestDates('2026-10-20', '2026-10-21', 'am', '2026-10-19', S, false).join(' ')).toMatch(/single day/);
    expect(validateRequestDates('2026-01-01', '2027-06-01', null, '2026-01-01', S, false).join(' ')).toMatch(/year/);
  });
  it('limits back-dating for self-service only', () => {
    expect(validateRequestDates('2026-08-01', '2026-08-02', null, '2026-10-19', S, true).join(' ')).toMatch(/Ask HR/);
    expect(validateRequestDates('2026-08-01', '2026-08-02', null, '2026-10-19', S, false)).toEqual([]);
  });
});

describe('clock times', () => {
  it('converts to and from the local time zone', () => {
    expect(zonedTimeToIso('2026-10-19', '09:05', 'Asia/Kuala_Lumpur')).toBe('2026-10-19T01:05:00.000Z');
    expect(localParts('2026-10-19T01:05:00Z', 'Asia/Kuala_Lumpur')).toEqual({ date: '2026-10-19', time: '09:05' });
    expect(localParts('2026-10-19T17:30:00Z', 'Asia/Kuala_Lumpur').date).toBe('2026-10-20');
  });
  it('marks late only after the grace period', () => {
    expect(clockStatus('09:15', S)).toBe('present');
    expect(clockStatus('09:16', S)).toBe('late');
    expect(clockStatus('08:00', S)).toBe('present');
  });
});

describe('attendance rate', () => {
  const from = '2026-10-19', to = '2026-10-24';      // Monday to Saturday, 6 working days
  it('is attended divided by recorded days, with unrecorded days reported separately', () => {
    const s = summariseAttendance(
      [{ date: '2026-10-19', status: 'present' }, { date: '2026-10-20', status: 'late' }, { date: '2026-10-21', status: 'absent' }, { date: '2026-10-22', status: 'half_day' }],
      [], S, NO_HOLIDAYS, from, to, '2026-10-24',
    );
    expect(s).toMatchObject({ workingDays: 6, recordedDays: 4, unrecorded: 2, late: 1, absent: 1 });
    expect(s.attended).toBe(2.5);
    expect(s.rate).toBe(62.5);
  });
  it('excludes approved leave and public holidays, and ignores the future', () => {
    const s = summariseAttendance(
      [{ date: '2026-10-19', status: 'present' }],
      [{ date: '2026-10-20', fraction: 1 }], S, new Set(['2026-10-21']), from, to, '2026-10-22',
    );
    expect(s.leaveDays).toBe(1);
    expect(s.workingDays).toBe(2);                 // 19th and 22nd only (20th leave, 21st holiday, rest in the future)
    expect(s.rate).toBe(100);
    expect(s.unrecorded).toBe(1);
  });
  it('has no rate when nothing is recorded', () => {
    expect(summariseAttendance([], [], S, NO_HOLIDAYS, from, to, to).rate).toBeNull();
  });
});

describe('unpaid days for payroll', () => {
  it('only counts days inside the month', () => {
    const days = [{ date: '2026-09-30', fraction: 1 }, { date: '2026-10-01', fraction: 1 }, { date: '2026-10-02', fraction: 0.5 }];
    expect(unpaidDaysInMonth(days, '2026-10-01')).toBe(1.5);
    expect(unpaidDaysInMonth(days, '2026-09-01')).toBe(1);
  });
  it('adds days', () => expect(addDays('2026-02-28', 1)).toBe('2026-03-01'));
});
