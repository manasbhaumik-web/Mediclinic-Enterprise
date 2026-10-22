/** Builds the table each report offers for CSV / PDF download. What is exported is exactly what the screen is built from. */
import { round2 } from './billing';
import { DrugItem, usableStock } from './inventory';
import {
  CategoryRevenue, ClaimRow, FastMover, MonthRevenue, ReportTable, VolumeDay,
} from './reports';
import { daysBetween } from './equipment';
import { localDateKey } from './operations';

const money = (n: number) => n.toFixed(2);

const fmt = (key: string) => new Date(`${key}T00:00:00`).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' });

/** "1 Oct 2026 to 22 Oct 2026" */
export const periodLabel = (from: string, to: string) => `${fmt(from)} to ${fmt(to)}`;

export const revenueTable = (months: MonthRevenue[], period: string): ReportTable => ({
  title: 'Revenue by month',
  subtitle: `Paid visits, ${period}`,
  columns: ['Month', 'Paid visits', 'Paid by patients (RM)', 'Claimed from panels (RM)', 'Total (RM)'],
  rows: [
    ...months.map((m) => [m.month, m.visits, money(m.patientPaid), money(m.panelClaimed), money(m.total)]),
    ['Total', months.reduce((s, m) => s + m.visits, 0), money(round2(months.reduce((s, m) => s + m.patientPaid, 0))), money(round2(months.reduce((s, m) => s + m.panelClaimed, 0))), money(round2(months.reduce((s, m) => s + m.total, 0)))],
  ],
  numeric: [1, 2, 3, 4],
});

export const categoryTable = (c: CategoryRevenue, period: string): ReportTable => ({
  title: 'Revenue by category',
  subtitle: `${period}. From ${c.itemised} of ${c.payments} payments that carry an itemised bill.`,
  columns: ['Category', 'Amount (RM)'],
  rows: [
    ...c.categories.map((x) => [x.label, money(x.amount)]),
    ['Discounts', money(-c.discounts)],
    ['SST', money(c.tax)],
    ['Total billed', money(c.total)],
  ],
  numeric: [1],
});

export const diagnosesTable = (rows: { icdCode: string; diagnosis: string | null; visits: number }[], period: string): ReportTable => ({
  title: 'Top diagnoses',
  subtitle: `Visits by ICD-10 code, ${period}`,
  columns: ['ICD-10 code', 'Diagnosis', 'Visits'],
  rows: rows.map((r) => [r.icdCode, r.diagnosis, r.visits]),
  numeric: [2],
});

export const volumeTable = (days: VolumeDay[], period: string, by: 'day' | 'week'): ReportTable => ({
  title: 'Visit volume',
  subtitle: `${by === 'week' ? 'By week (starting Monday)' : 'By day'}, ${period}`,
  columns: [by === 'week' ? 'Week starting' : 'Date', 'Visits', 'Completed', 'Cancelled', 'In progress'],
  rows: days.map((d) => [d.day, d.total, d.completed, d.cancelled, d.inProgress]),
  numeric: [1, 2, 3, 4],
});

export const prescribingTable = (rows: FastMover[], period: string): ReportTable => ({
  title: 'Most prescribed drugs',
  subtitle: `Prescriptions in ${period}, with in-date stock on hand now`,
  columns: ['Drug', 'Prescriptions', 'Quantity', 'Controlled', 'In stock now'],
  rows: rows.map((r) => [r.drugName, r.prescriptions, r.totalQuantity, r.isControlled ? 'Yes' : 'No', r.onHand]),
  numeric: [1, 2, 4],
});

export interface ClaimExportRow extends ClaimRow {
  receiptNo?: string; patientName?: string; panelName?: string; glNumber?: string; claimReference?: string;
}

export const claimsTable = (claims: ClaimExportRow[], today: string): ReportTable => ({
  title: 'Panel claims awaiting payment',
  subtitle: `As at ${fmt(today)}`,
  columns: ['Receipt no.', 'Patient', 'Panel', 'GL reference', 'Payment date', 'Days waiting', 'Amount (RM)'],
  rows: claims
    .filter((c) => c.status === 'Pending Claim' && c.panelClaimed > 0)
    .map((c) => {
      const day = localDateKey(new Date(c.date));
      return { c, day, age: Math.max(0, daysBetween(day, today)) };
    })
    .sort((a, b) => b.age - a.age)
    .map(({ c, day, age }) => [c.receiptNo ?? '', c.patientName ?? '', c.panelName ?? '', c.glNumber ?? '', day, age, money(c.panelClaimed)]),
  numeric: [5, 6],
});

export interface LedgerExportRow extends ClaimExportRow { paidAmount: number; paymentMethod: string; paymentReference?: string }

export const ledgerTable = (rows: LedgerExportRow[], period: string): ReportTable => ({
  title: 'Payments ledger',
  subtitle: period,
  columns: ['Receipt no.', 'Date', 'Patient', 'Method', 'Reference', 'Paid by patient (RM)', 'Claimed from panel (RM)', 'Panel', 'GL reference', 'Status'],
  rows: rows.map((r) => [
    r.receiptNo ?? '', localDateKey(new Date(r.date)), r.patientName ?? '', r.paymentMethod, r.paymentReference ?? '',
    money(r.paidAmount), money(r.panelClaimed), r.panelName ?? '', r.glNumber ?? '', r.status,
  ]),
  numeric: [5, 6],
});

export const stockTable = (drugs: Pick<DrugItem, 'name' | 'status' | 'minThreshold' | 'unit' | 'batches'>[], today: string): ReportTable => ({
  title: 'Stock on hand',
  subtitle: `Active drugs, in-date stock as at ${fmt(today)}`,
  columns: ['Drug', 'Unit', 'In-date stock', 'Reorder level', 'Value at cost (RM)', 'Batches without cost'],
  rows: drugs.filter((d) => d.status === 'active').map((d) => {
    const costed = (d.batches ?? []).filter((b) => b.stock > 0 && b.unitCost !== null && b.unitCost !== undefined);
    const missing = (d.batches ?? []).filter((b) => b.stock > 0 && (b.unitCost === null || b.unitCost === undefined)).length;
    return [d.name, d.unit, usableStock(d, today), d.minThreshold, money(round2(costed.reduce((s, b) => s + b.stock * (b.unitCost ?? 0), 0))), missing];
  }),
  numeric: [2, 3, 4, 5],
});


export const doctorEncountersTable = (
  visits: { signedOffAt: string; patientName: string; icdCode: string | null; diagnosis: string | null; paymentMethod: string | null; fee: number | null; mcDays: number; referral: boolean }[],
  monthText: string,
): ReportTable => ({
  title: `My consultations, ${monthText}`,
  subtitle: 'Consultations signed off by you. Contains patient names and diagnoses: keep confidential.',
  columns: ['Signed off', 'Patient', 'ICD-10 code', 'Diagnosis', 'MC days', 'Referral', 'Payment method', 'Billed (RM)'],
  rows: visits.map((v) => [
    new Date(v.signedOffAt).toLocaleString('en-MY', { timeZone: 'Asia/Kuala_Lumpur', hour12: false }),
    v.patientName,
    v.icdCode && v.icdCode.trim().toUpperCase() !== 'N/A' ? v.icdCode : '',
    v.diagnosis ?? '',
    v.mcDays || '',
    v.referral ? 'Yes' : '',
    v.paymentMethod ?? '',
    v.fee === null ? '' : money(v.fee),
  ]),
  numeric: [4, 7],
});
