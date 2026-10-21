/**
 * CSV exports for an approved payroll run: bank payment file, statutory working schedules and a summary.
 *
 * IMPORTANT: bank and statutory portals each define their own upload layout, and those layouts change. These
 * files carry the right data in a clean generic layout so it can be copied or mapped into the bank's or
 * portal's format; they are not claimed to be the official upload formats.
 */
import { Payslip, PayrollRun, monthLabel } from './payroll';

type Cell = string | number | null | undefined;

/** One CSV cell. Text that a spreadsheet could treat as a formula is neutralised; numbers stay numbers. */
export function csvCell(v: Cell): string {
  if (v === null || v === undefined) return '';
  if (typeof v === 'number') return Number.isFinite(v) ? v.toFixed(2) : '';
  let s = String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export const toCsv = (header: string[], rows: Cell[][]): string =>
  [header, ...rows].map((r) => r.map(csvCell).join(',')).join('\r\n') + '\r\n';

const amountOf = (slip: Payslip, code: string): number =>
  Math.round(slip.lines.filter((l) => l.code === code).reduce((s, l) => s + l.amount, 0) * 100) / 100;

const sumWhere = (slip: Payslip, pred: (code: string, kind: string) => boolean): number =>
  Math.round(slip.lines.filter((l) => pred(l.code, l.kind)).reduce((s, l) => s + l.amount, 0) * 100) / 100;

export interface ExportResult {
  filename: string;
  csv: string;
  rows: number;
  /** People left out or incomplete, for the screen to show before the file is used. */
  problems: string[];
}

const period = (run: PayrollRun) => run.periodMonth.slice(0, 7);

/** Bank salary payments: one row per person with a positive net pay. People without bank details are listed, not guessed. */
export function bankPaymentCsv(run: PayrollRun, slips: Payslip[]): ExportResult {
  const problems: string[] = [];
  const rows: Cell[][] = [];
  for (const s of slips) {
    if (s.netPay <= 0) { problems.push(`${s.employee.name}: net pay is ${s.netPay.toFixed(2)}, not included.`); continue; }
    const b = s.employee.bank ?? {};
    if (!b.number || !b.name) { problems.push(`${s.employee.name}: bank name or account number is missing, not included.`); continue; }
    rows.push([s.employee.name, b.holder || s.employee.name, b.name, b.number, s.netPay, `Salary ${monthLabel(run.periodMonth)}`, s.employee.icNumber ?? '']);
  }
  return {
    filename: `salary-payments-${period(run)}.csv`,
    csv: toCsv(['Beneficiary name', 'Account holder', 'Bank', 'Account number', 'Amount (MYR)', 'Payment reference', 'ID number'], rows),
    rows: rows.length,
    problems,
  };
}

interface StatutorySpec { filename: string; header: string[]; numberLabel: string; pick: (s: Payslip) => Cell[]; idOf: (s: Payslip) => string | null | undefined; idName: string }

function statutoryCsv(run: PayrollRun, slips: Payslip[], spec: StatutorySpec): ExportResult {
  const problems: string[] = [];
  const rows: Cell[][] = [];
  for (const s of slips) {
    const values = spec.pick(s);
    if (values.every((v) => !v)) continue;    // nothing contributed (for example not eligible): leave the row out
    if (!spec.idOf(s)) problems.push(`${s.employee.name}: ${spec.idName} is missing.`);
    rows.push([s.employee.name, s.employee.icNumber ?? '', spec.idOf(s) ?? '', s.gross, ...values]);
  }
  return { filename: `${spec.filename}-${period(run)}.csv`, csv: toCsv(spec.header, rows), rows: rows.length, problems };
}

export const epfCsv = (run: PayrollRun, slips: Payslip[]) => statutoryCsv(run, slips, {
  filename: 'epf-schedule', numberLabel: 'EPF number', idName: 'EPF number', idOf: (s) => s.employee.epfNumber,
  header: ['Name', 'ID number', 'EPF number', 'Gross pay (MYR)', 'Employee EPF', 'Employer EPF', 'Total'],
  pick: (s) => { const e = amountOf(s, 'EPF_EE'), r = amountOf(s, 'EPF_ER'); return [e, r, e + r]; },
});

export const socsoCsv = (run: PayrollRun, slips: Payslip[]) => statutoryCsv(run, slips, {
  filename: 'socso-schedule', numberLabel: 'SOCSO number', idName: 'SOCSO number', idOf: (s) => s.employee.socsoNumber,
  header: ['Name', 'ID number', 'SOCSO number', 'Gross pay (MYR)', 'Employee SOCSO', 'Employer SOCSO', 'Total'],
  pick: (s) => { const e = amountOf(s, 'SOCSO_EE'), r = amountOf(s, 'SOCSO_ER'); return [e, r, e + r]; },
});

export const eisCsv = (run: PayrollRun, slips: Payslip[]) => statutoryCsv(run, slips, {
  filename: 'eis-schedule', numberLabel: 'SOCSO number', idName: 'SOCSO number', idOf: (s) => s.employee.socsoNumber,
  header: ['Name', 'ID number', 'SOCSO number', 'Gross pay (MYR)', 'Employee EIS', 'Employer EIS', 'Total'],
  pick: (s) => { const e = amountOf(s, 'EIS_EE'), r = amountOf(s, 'EIS_ER'); return [e, r, e + r]; },
});

export const pcbCsv = (run: PayrollRun, slips: Payslip[]) => statutoryCsv(run, slips, {
  filename: 'pcb-schedule', numberLabel: 'Tax reference', idName: 'income tax reference number', idOf: (s) => s.employee.taxRef,
  header: ['Name', 'ID number', 'Income tax reference', 'Gross pay (MYR)', 'PCB'],
  pick: (s) => [amountOf(s, 'PCB')],
});

/** Everything per employee on one line, for the accountant. */
export function summaryCsv(run: PayrollRun, slips: Payslip[]): ExportResult {
  const header = ['Name', 'Job title', 'Basic', 'Unpaid leave', 'Allowances', 'Overtime', 'Gross', 'EPF (employee)', 'SOCSO (employee)', 'EIS (employee)', 'PCB', 'Other deductions', 'Total deductions', 'Net pay', 'EPF (employer)', 'SOCSO (employer)', 'EIS (employer)', 'Employer cost'];
  const rows = slips.map((s) => [
    s.employee.name, s.employee.jobTitle ?? '', amountOf(s, 'BASIC'), amountOf(s, 'UNPAID_LEAVE'),
    sumWhere(s, (c) => c.startsWith('ALLOWANCE_')), sumWhere(s, (c) => c.startsWith('OVERTIME_')), s.gross,
    amountOf(s, 'EPF_EE'), amountOf(s, 'SOCSO_EE'), amountOf(s, 'EIS_EE'), amountOf(s, 'PCB'), sumWhere(s, (c) => c.startsWith('DEDUCTION_')),
    s.totalDeductions, s.netPay, amountOf(s, 'EPF_ER'), amountOf(s, 'SOCSO_ER'), amountOf(s, 'EIS_ER'), Math.round((s.gross + s.employerContributions) * 100) / 100,
  ]);
  return { filename: `payroll-summary-${period(run)}.csv`, csv: toCsv(header, rows), rows: rows.length, problems: [] };
}

/** Save text as a file in the browser. */
export function downloadText(filename: string, text: string, mime = 'text/csv;charset=utf-8') {
  const blob = new Blob(['﻿' + text], { type: mime });    // BOM so Excel reads UTF-8 names correctly
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
