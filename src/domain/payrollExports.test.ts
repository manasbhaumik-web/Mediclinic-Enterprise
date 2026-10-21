import { describe, expect, it } from 'vitest';
import { calculatePayslip, PayrollRun, Payslip, RateRow } from './payroll';
import { bankPaymentCsv, csvCell, epfCsv, pcbCsv, summaryCsv } from './payrollExports';
import { generatePayslipPdf, generateRunPayslipsPdf, maskAccount } from '../utils/payslipPdf';

const rates: RateRow[] = [
  { id: 'a', scheme: 'epf_employee', label: 'EPF', effectiveFrom: '2025-01-01', priority: 0, eligibility: {}, config: { type: 'percent', rate: 0.11 }, active: true, verified: true },
  { id: 'b', scheme: 'epf_employer', label: 'EPF', effectiveFrom: '2025-01-01', priority: 0, eligibility: {}, config: { type: 'percent', rate: 0.13 }, active: true, verified: true },
];

const run: PayrollRun = {
  id: 'r1', periodMonth: '2026-10-01', status: 'approved', workingDays: 26, hoursPerDay: 8, notes: null, totals: {},
  createdAt: '', reviewedAt: null, approvedAt: null, paidAt: null, paidOn: null, cancelledAt: null, cancelReason: null, reviewedBy: null, createdBy: null,
};

function slip(name: string, bank: { name?: string; number?: string }, epf = '123'): Payslip {
  const emp = { id: name, name, dob: '1990-01-01', citizenship: 'citizen' as const, baseSalary: 4000 };
  const calc = calculatePayslip(emp, { periodStart: '2026-10-01', workingDays: 26, hoursPerDay: 8 }, {}, { allowances: [], deductions: [] }, rates);
  return {
    id: name, runId: 'r1', staffId: name, inputs: {}, lines: calc.lines, gross: calc.gross, totalDeductions: calc.totalDeductions,
    netPay: calc.netPay, employerContributions: calc.employerContributions, warnings: calc.warnings,
    employee: { name, citizenship: 'citizen', baseSalary: 4000, epfNumber: epf, icNumber: '900115-14-6102', bank },
  };
}

describe('csv', () => {
  it('neutralises formulas and quotes commas', () => {
    expect(csvCell('=SUM(A1)')).toBe("'=SUM(A1)");
    expect(csvCell('a,b')).toBe('"a,b"');
    expect(csvCell(12.5)).toBe('12.50');
  });
  it('bank file lists only payable people with bank details and reports the rest', () => {
    const r = bankPaymentCsv(run, [slip('Ann', { name: 'Maybank', number: '1234567890' }), slip('Bob', {})]);
    expect(r.rows).toBe(1);
    expect(r.csv).toContain('Ann');
    expect(r.csv).toContain('3560.00');
    expect(r.problems.join(' ')).toContain('Bob');
  });
  it('EPF schedule uses gross pay and flags missing numbers', () => {
    const r = epfCsv(run, [slip('Ann', {}, ''), slip('Bob', {})]);
    expect(r.rows).toBe(2);
    expect(r.csv).toContain('440.00');
    expect(r.csv).toContain('520.00');
    expect(r.problems).toHaveLength(1);
  });
  it('omits people with no contribution', () => {
    expect(pcbCsv(run, [slip('Ann', {})]).rows).toBe(0);
  });
  it('summary has one row per person', () => {
    expect(summaryCsv(run, [slip('Ann', {}), slip('Bob', {})]).csv.trim().split('\r\n')).toHaveLength(3);
  });
});

describe('payslip pdf', () => {
  it('masks bank account', () => expect(maskAccount('1234567890')).toBe('******7890'));
  it('generates single and run documents', () => {
    const s = slip('Ann', { name: 'Maybank', number: '1234567890' });
    expect(generatePayslipPdf(run, s).getNumberOfPages()).toBe(1);
    expect(generateRunPayslipsPdf(run, [s, slip('Bob', {})]).getNumberOfPages()).toBe(2);
  });
});
