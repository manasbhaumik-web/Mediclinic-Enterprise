import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PayrollRun, Payslip, monthLabel } from '../domain/payroll';
import { maskICNumber } from './piiMasker';

const money = (n: number) => `RM ${n.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** Show only the last four digits of a bank account number. */
export const maskAccount = (n: string | null | undefined): string => {
  if (!n) return '-';
  const clean = n.replace(/\s/g, '');
  return clean.length <= 4 ? '****' : `${'*'.repeat(clean.length - 4)}${clean.slice(-4)}`;
};

/** Draw one payslip on the current page of an existing document. */
export function drawPayslip(doc: jsPDF, run: PayrollRun, slip: Payslip, clinicName = 'Mediclinic Enterprise') {
  const e = slip.employee;
  doc.setFontSize(18);
  doc.text(clinicName, 14, 18);
  doc.setFontSize(12);
  doc.text(`Payslip - ${monthLabel(run.periodMonth)}`, 14, 26);
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(run.status === 'paid' ? `Paid on ${run.paidOn ?? ''}` : `Status: ${run.status}`, 14, 31);
  doc.setTextColor(0);

  autoTable(doc, {
    startY: 36,
    theme: 'plain',
    styles: { fontSize: 9, cellPadding: 1 },
    body: [
      ['Employee', e.name, 'Position', e.jobTitle ?? '-'],
      ['IC / passport', maskICNumber(e.icNumber) || '-', 'Department', e.department ?? '-'],
      ['EPF no.', e.epfNumber || '-', 'SOCSO no.', e.socsoNumber || '-'],
      ['Tax ref', e.taxRef || '-', 'Bank account', `${e.bank?.name ?? '-'} ${maskAccount(e.bank?.number)}`],
    ],
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 28 }, 2: { fontStyle: 'bold', cellWidth: 28 } },
  });

  const earnings = slip.lines.filter((l) => l.kind === 'earning');
  const deductions = slip.lines.filter((l) => l.kind === 'deduction');
  const employer = slip.lines.filter((l) => l.kind === 'employer');
  // @ts-expect-error jspdf-autotable adds lastAutoTable at runtime
  let y: number = doc.lastAutoTable.finalY + 6;

  const section = (title: string, rows: Payslip['lines'], total?: [string, number]) => {
    autoTable(doc, {
      startY: y,
      head: [[title, 'Amount']],
      body: rows.length ? rows.map((l) => [l.label, money(l.amount)]) : [['None', '']],
      foot: total ? [[total[0], money(total[1])]] : undefined,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [30, 64, 175] },
      footStyles: { fillColor: [241, 245, 249], textColor: 0 },
      columnStyles: { 1: { halign: 'right', cellWidth: 40 } },
    });
    // @ts-expect-error jspdf-autotable adds lastAutoTable at runtime
    y = doc.lastAutoTable.finalY + 5;
  };

  section('Earnings', earnings, ['Gross pay', slip.gross]);
  section('Deductions', deductions, ['Total deductions', slip.totalDeductions]);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`Net pay: ${money(slip.netPay)}`, 14, y + 2);
  doc.setFont('helvetica', 'normal');
  y += 10;

  section('Employer contributions (not deducted from pay)', employer, ['Total employer contributions', slip.employerContributions]);

  if (slip.warnings.length) {
    doc.setFontSize(8);
    doc.setTextColor(180, 83, 9);
    doc.text(doc.splitTextToSize(`Notes: ${slip.warnings.join(' ')}`, 180), 14, y);
    doc.setTextColor(0);
  }
  doc.setFontSize(8);
  doc.setTextColor(120);
  doc.text('Computer-generated payslip. Confidential.', 14, 285);
  doc.setTextColor(0);
}

export function generatePayslipPdf(run: PayrollRun, slip: Payslip): jsPDF {
  const doc = new jsPDF();
  drawPayslip(doc, run, slip);
  return doc;
}

/** One document, one payslip per page. */
export function generateRunPayslipsPdf(run: PayrollRun, slips: Payslip[]): jsPDF {
  const doc = new jsPDF();
  slips.forEach((s, i) => {
    if (i > 0) doc.addPage();
    drawPayslip(doc, run, s);
  });
  return doc;
}

export const payslipFilename = (run: PayrollRun, slip: Payslip) =>
  `payslip-${run.periodMonth.slice(0, 7)}-${slip.employee.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.pdf`;
