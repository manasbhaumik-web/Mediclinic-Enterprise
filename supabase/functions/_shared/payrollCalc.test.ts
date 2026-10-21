import { describe, expect, it } from 'vitest';
import {
  EmployeeForPay, RateRow, ageOn, calculatePayslip, computeContribution, isEligible, periodEnd, pickRate, runBlockers,
  summariseRun, unverifiedRates, validateInputs,
} from './payrollCalc';

const citizens = { maxAge: 59, citizenships: ['citizen', 'pr'] as ('citizen' | 'pr')[] };
let n = 0;
const row = (scheme: RateRow['scheme'], config: RateRow['config'], over: Partial<RateRow> = {}): RateRow => ({
  id: `r${++n}`, scheme, label: scheme, effectiveFrom: '2025-01-01', priority: 0, eligibility: citizens, config, active: true, verified: true, ...over,
});

// The seeded defaults from the migration.
const rates: RateRow[] = [
  row('epf_employee', { type: 'percent', rate: 0.11, roundUpToRinggit: true, includeOvertime: false }),
  row('epf_employer', { type: 'tiered', tiers: [{ upTo: 5000, rate: 0.13 }, { upTo: null, rate: 0.12 }], roundUpToRinggit: true, includeOvertime: false }),
  row('socso_employee', { type: 'percent', rate: 0.005, ceiling: 6000, includeOvertime: true }),
  row('socso_employer', { type: 'percent', rate: 0.0175, ceiling: 6000, includeOvertime: true }),
  row('eis_employee', { type: 'percent', rate: 0.002, ceiling: 6000, includeOvertime: true }),
  row('eis_employer', { type: 'percent', rate: 0.002, ceiling: 6000, includeOvertime: true }),
];

const run = { periodStart: '2026-10-01', workingDays: 26, hoursPerDay: 8 };
const emp = (over: Partial<EmployeeForPay> = {}): EmployeeForPay => ({ id: 'e1', name: 'Aina', baseSalary: 4000, dob: '1990-01-01', citizenship: 'citizen', ...over });
const none = { allowances: [], deductions: [] };
const line = (res: ReturnType<typeof calculatePayslip>, code: string) => res.lines.find((l) => l.code === code)?.amount;

describe('dates and eligibility', () => {
  it('finds the end of the pay month, including leap years', () => {
    expect(periodEnd('2026-10-01')).toBe('2026-10-31');
    expect(periodEnd('2028-02-01')).toBe('2028-02-29');
    expect(periodEnd('2026-02-01')).toBe('2026-02-28');
  });

  it('computes age on a date', () => {
    expect(ageOn('1990-11-01', '2026-10-31')).toBe(35);
    expect(ageOn('1990-10-31', '2026-10-31')).toBe(36);
    expect(ageOn(null, '2026-10-31')).toBeNull();
  });

  it('applies citizenship and age rules, and refuses to guess an unknown age', () => {
    expect(isEligible(citizens, { dob: '1990-01-01', citizenship: 'citizen' }, '2026-10-31')).toBe(true);
    expect(isEligible(citizens, { dob: '1990-01-01', citizenship: 'foreign' }, '2026-10-31')).toBe(false);
    expect(isEligible(citizens, { dob: '1960-01-01', citizenship: 'citizen' }, '2026-10-31')).toBe(false);
    expect(isEligible(citizens, { dob: null, citizenship: 'citizen' }, '2026-10-31')).toBe(false);
    expect(isEligible({}, { dob: null, citizenship: 'foreign' }, '2026-10-31')).toBe(true);
  });
});

describe('pickRate', () => {
  const who = { dob: '1990-01-01', citizenship: 'citizen' as const };

  it('uses the newest row that has started, ignoring future and inactive rows', () => {
    const old = row('epf_employee', { type: 'percent', rate: 0.1 }, { effectiveFrom: '2024-01-01' });
    const current = row('epf_employee', { type: 'percent', rate: 0.11 }, { effectiveFrom: '2025-01-01' });
    const future = row('epf_employee', { type: 'percent', rate: 0.12 }, { effectiveFrom: '2027-01-01' });
    const retired = row('epf_employee', { type: 'percent', rate: 0.13 }, { effectiveFrom: '2026-01-01', active: false });
    expect(pickRate([old, current, future, retired], 'epf_employee', '2026-10-31', who)?.id).toBe(current.id);
  });

  it('lets a higher priority row win over a newer one', () => {
    const a = row('socso_employee', { type: 'percent', rate: 0.005 }, { effectiveFrom: '2025-01-01', priority: 5 });
    const b = row('socso_employee', { type: 'percent', rate: 0.01 }, { effectiveFrom: '2026-01-01', priority: 0 });
    expect(pickRate([a, b], 'socso_employee', '2026-10-31', who)?.id).toBe(a.id);
  });
});

describe('computeContribution', () => {
  it('percent with ceiling and no rounding up', () => {
    expect(computeContribution({ type: 'percent', rate: 0.005, ceiling: 6000 }, 8000)).toBe(30);
    expect(computeContribution({ type: 'percent', rate: 0.005, ceiling: 6000 }, 4321)).toBe(21.61);
  });

  it('rounds EPF-style contributions up to the next ringgit', () => {
    expect(computeContribution({ type: 'percent', rate: 0.11, roundUpToRinggit: true }, 3333.33)).toBe(367);
    expect(computeContribution({ type: 'percent', rate: 0.11, roundUpToRinggit: true }, 4000)).toBe(440);
  });

  it('tiered rate switches at the threshold (13% up to 5,000, 12% above)', () => {
    const cfg = { type: 'tiered', tiers: [{ upTo: 5000, rate: 0.13 }, { upTo: null, rate: 0.12 }], roundUpToRinggit: true } as const;
    expect(computeContribution(cfg, 5000)).toBe(650);
    expect(computeContribution(cfg, 5001)).toBe(601);
  });

  it('bands return the fixed amount for the band the wages fall in', () => {
    const cfg = { type: 'bands', bands: [{ from: 0, to: 30, amount: 0.1 }, { from: 30.01, to: 50, amount: 0.2 }, { from: 50.01, to: null, amount: 0.3 }] } as const;
    expect(computeContribution(cfg, 20)).toBe(0.1);
    expect(computeContribution(cfg, 40)).toBe(0.2);
    expect(computeContribution(cfg, 9999)).toBe(0.3);
  });

  it('is zero for no wages or an empty config', () => {
    expect(computeContribution({ type: 'percent', rate: 0.11 }, 0)).toBe(0);
    expect(computeContribution({ type: 'none' }, 4000)).toBe(0);
  });
});

describe('calculatePayslip', () => {
  it('a plain RM4,000 salary under the seeded rates', () => {
    const r = calculatePayslip(emp(), run, {}, none, rates);
    expect(r.gross).toBe(4000);
    expect(line(r, 'EPF_EE')).toBe(440);
    expect(line(r, 'SOCSO_EE')).toBe(20);
    expect(line(r, 'EIS_EE')).toBe(8);
    expect(r.totalDeductions).toBe(468);
    expect(r.netPay).toBe(3532);
    expect(line(r, 'EPF_ER')).toBe(520);
    expect(line(r, 'SOCSO_ER')).toBe(70);
    expect(line(r, 'EIS_ER')).toBe(8);
    expect(r.employerContributions).toBe(598);
    expect(r.warnings).toEqual([]);
  });

  it('employer contributions never reduce net pay', () => {
    const r = calculatePayslip(emp(), run, {}, none, rates);
    expect(r.netPay).toBe(r.gross - r.totalDeductions);
  });

  it('unpaid leave reduces pay by the daily rate and the contribution wages', () => {
    const r = calculatePayslip(emp(), run, { unpaidLeaveDays: 2 }, none, rates);
    expect(line(r, 'UNPAID_LEAVE')).toBe(-307.69);
    expect(r.gross).toBe(3692.31);
    expect(line(r, 'EPF_EE')).toBe(407);        // 11% of 3,692.31 = 406.15, rounded up
  });

  it('unpaid leave can never exceed the basic salary', () => {
    const r = calculatePayslip(emp(), run, { unpaidLeaveDays: 40 }, none, rates);
    expect(r.gross).toBe(0);
  });

  it('overtime is paid at hourly rate x multiplier and counts for SOCSO/EIS but not EPF', () => {
    const r = calculatePayslip(emp(), run, { overtime: [{ hours: 10, multiplier: 1.5 }] }, none, rates);
    expect(line(r, 'OVERTIME_1')).toBe(288.46);   // 4000 / 26 / 8 x 1.5 x 10
    expect(r.gross).toBe(4288.46);
    expect(line(r, 'EPF_EE')).toBe(440);          // overtime excluded
    expect(line(r, 'SOCSO_EE')).toBe(21.44);      // overtime included
  });

  it('allowances add to gross; non-contributory ones stay out of the contribution wages', () => {
    const r = calculatePayslip(emp(), run, { allowances: [{ label: 'Meal', amount: 200, contributory: false }, { label: 'Phone', amount: 100 }] }, none, rates);
    expect(r.gross).toBe(4300);
    expect(line(r, 'EPF_EE')).toBe(451);          // 11% of 4,100 = 451
  });

  it('recurring items are applied alongside this month\'s items', () => {
    const r = calculatePayslip(emp(), run, { deductions: [{ label: 'Advance', amount: 50 }] }, { allowances: [{ label: 'Transport', amount: 120 }], deductions: [{ label: 'Loan', amount: 100 }] }, rates);
    expect(r.gross).toBe(4120);
    expect(r.lines.filter((l) => l.code.startsWith('DEDUCTION')).map((l) => l.amount)).toEqual([100, 50]);
  });

  it('applies the SOCSO/EIS wage ceiling and the lower employer EPF tier above RM5,000', () => {
    const r = calculatePayslip(emp({ baseSalary: 8000 }), run, {}, none, rates);
    expect(line(r, 'SOCSO_EE')).toBe(30);
    expect(line(r, 'EIS_EE')).toBe(12);
    expect(line(r, 'EPF_ER')).toBe(960);
  });

  it('PCB comes from a manual figure, else a configured table, else nothing', () => {
    expect(line(calculatePayslip(emp(), run, { pcbOverride: 85.5 }, none, rates), 'PCB')).toBe(85.5);
    const table = row('pcb', { type: 'bands', bands: [{ from: 0, to: 3000, amount: 0 }, { from: 3000.01, to: null, amount: 60 }] });
    expect(line(calculatePayslip(emp(), run, {}, none, [...rates, table]), 'PCB')).toBe(60);
    expect(line(calculatePayslip(emp(), run, {}, none, rates), 'PCB')).toBeUndefined();
    // a manual zero overrides the table
    expect(line(calculatePayslip(emp(), run, { pcbOverride: 0 }, none, [...rates, table]), 'PCB')).toBeUndefined();
  });

  it('warns instead of guessing for ineligible staff, unknown ages and missing salary', () => {
    const foreign = calculatePayslip(emp({ citizenship: 'foreign' }), run, {}, none, rates);
    expect(foreign.totalDeductions).toBe(0);
    expect(foreign.warnings.some((w) => w.includes('EPF (employee)'))).toBe(true);

    const noDob = calculatePayslip(emp({ dob: null }), run, {}, none, rates);
    expect(noDob.warnings.length).toBeGreaterThan(0);

    const zero = calculatePayslip(emp({ baseSalary: 0 }), run, {}, none, rates);
    expect(zero.warnings[0]).toMatch(/Basic salary is 0/);
  });

  it('flags negative net pay', () => {
    const r = calculatePayslip(emp({ baseSalary: 1000 }), run, { deductions: [{ label: 'Big advance', amount: 5000 }] }, none, rates);
    expect(r.netPay).toBeLessThan(0);
    expect(r.warnings.some((w) => w.includes('negative'))).toBe(true);
  });

  it('records which rate rows it used', () => {
    const r = calculatePayslip(emp(), run, {}, none, rates);
    expect(r.usedRates.sort()).toEqual(rates.map((x) => x.id).sort());
  });

  it('always rounds to whole sen', () => {
    const r = calculatePayslip(emp({ baseSalary: 3333.33 }), run, { overtime: [{ hours: 7, multiplier: 2 }] }, none, rates);
    for (const l of r.lines) expect(Math.round(l.amount * 100)).toBeCloseTo(l.amount * 100, 6);
  });
});

describe('validateInputs', () => {
  it('accepts sensible inputs', () => {
    expect(validateInputs({ allowances: [{ label: 'A', amount: 10 }], overtime: [{ hours: 5, multiplier: 1.5 }], unpaidLeaveDays: 1 }, 26)).toEqual([]);
  });

  it('reports each kind of problem', () => {
    const problems = validateInputs({
      allowances: [{ label: '', amount: -5 }], overtime: [{ hours: -1, multiplier: 9 }], unpaidLeaveDays: 30, pcbOverride: -1,
    }, 26);
    expect(problems.join(' | ')).toMatch(/needs a description/);
    expect(problems.join(' | ')).toMatch(/zero or more/);
    expect(problems.join(' | ')).toMatch(/hours must be/);
    expect(problems.join(' | ')).toMatch(/multiplier must be/);
    expect(problems.join(' | ')).toMatch(/Unpaid leave must be between 0 and 26/);
    expect(problems.join(' | ')).toMatch(/PCB must be/);
  });
});

describe('run totals and approval blockers', () => {
  const slipA = calculatePayslip(emp(), run, {}, none, rates);
  const slipB = calculatePayslip(emp({ id: 'e2', name: 'Bala', baseSalary: 5000 }), run, { pcbOverride: 100 }, none, rates);

  it('adds up pay, statutory contributions and employer cost across the run', () => {
    const t = summariseRun([slipA, slipB]);
    expect(t.headcount).toBe(2);
    expect(t.gross).toBe(9000);
    expect(t.statutory.PCB).toBe(100);
    expect(t.statutory.EPF_EE).toBe(440 + 550);
    expect(t.employerCost).toBe(t.gross + t.employerContributions);
  });

  it('blocks approval while rates in use are unverified, or net pay is negative, or the run is empty', () => {
    const unverified = rates.map((r, i) => (i === 0 ? { ...r, verified: false } : r));
    expect(unverifiedRates(unverified, slipA.usedRates)).toHaveLength(1);
    expect(runBlockers(unverified, slipA.usedRates, [{ employee: { name: 'Aina' }, warnings: [], netPay: 10 }]).join(' ')).toMatch(/Unverified rates/);
    expect(runBlockers(rates, slipA.usedRates, [{ employee: { name: 'Aina' }, warnings: [], netPay: -1 }]).join(' ')).toMatch(/Negative net pay for: Aina/);
    expect(runBlockers(rates, [], [])).toEqual(['The run has no payslips.']);
    expect(runBlockers(rates, slipA.usedRates, [{ employee: { name: 'Aina' }, warnings: [], netPay: 10 }])).toEqual([]);
  });
});
