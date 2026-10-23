/** Pure roll-ups and export tables for the Analytics Reports and the doctor's Monthly Report. */
import { InvoiceSnapshot, LineKind, round2 } from './billing';
import { DrugItem, usableStock } from './inventory';
import { daysBetween } from './equipment';
import { localDateKey } from './operations';

// ---- export tables -----------------------------------------------------------------------------------------------

export type Cell = string | number | null | undefined;

/** A table any report can hand to the CSV / PDF export. */
export interface ReportTable {
  title: string;
  /** Printed under the title, e.g. the period. */
  subtitle?: string;
  columns: string[];
  rows: Cell[][];
  /** Indexes of columns that hold numbers (right-aligned in the PDF). */
  numeric?: number[];
}

/** One CSV field. Text that a spreadsheet would run as a formula (starts with = + - @) is made safe. */
export function csvField(value: Cell): string {
  if (value === null || value === undefined) return '';
  let text = String(value);
  if (typeof value === 'string' && /^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(table: Pick<ReportTable, 'columns' | 'rows'>): string {
  return [table.columns, ...table.rows].map((r) => r.map(csvField).join(',')).join('\r\n');
}

export const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// ---- revenue -----------------------------------------------------------------------------------------------------

export interface PaidVisitRow { visitDate: string; paidAmount: number; panelClaimed: number; paymentMethod: string | null }

export interface MonthRevenue { month: string; patientPaid: number; panelClaimed: number; total: number; visits: number }

/** Every calendar month from `from` to `to` (YYYY-MM-DD), including months with nothing paid. */
export function monthsBetween(from: string, to: string): string[] {
  const out: string[] = [];
  let y = Number(from.slice(0, 4));
  let m = Number(from.slice(5, 7));
  const endY = Number(to.slice(0, 4));
  const endM = Number(to.slice(5, 7));
  while (y < endY || (y === endY && m <= endM)) {
    out.push(`${y}-${String(m).padStart(2, '0')}`);
    m++;
    if (m > 12) { m = 1; y++; }
  }
  return out;
}

export function revenueByMonth(rows: PaidVisitRow[], from: string, to: string): MonthRevenue[] {
  const by = new Map<string, MonthRevenue>(monthsBetween(from, to).map((m) => [m, { month: m, patientPaid: 0, panelClaimed: 0, total: 0, visits: 0 }]));
  for (const r of rows) {
    const bucket = by.get(localDateKey(new Date(r.visitDate)).slice(0, 7));
    if (!bucket) continue;
    bucket.patientPaid += r.paidAmount;
    bucket.panelClaimed += r.panelClaimed;
    bucket.visits++;
  }
  return [...by.values()].map((b) => ({ ...b, patientPaid: round2(b.patientPaid), panelClaimed: round2(b.panelClaimed), total: round2(b.patientPaid + b.panelClaimed) }));
}

export const KIND_LABEL: Record<LineKind, string> = {
  consultation: 'Consultation', procedure: 'Procedures / nursing', medication: 'Medication', other: 'Other charges',
};

export interface CategoryRevenue {
  /** Line totals before discount and tax. */
  categories: { kind: LineKind; label: string; amount: number }[];
  discounts: number;
  tax: number;
  /** Sum of the itemised bills: categories - discounts + tax. */
  total: number;
  /** Payments that carry an itemised bill, out of all payments considered. */
  itemised: number;
  payments: number;
}

/** Revenue by what was charged for, from the itemised bills stored with payments. Older payments have none and are only counted. */
export function revenueByCategory(payments: { bill?: InvoiceSnapshot | null }[]): CategoryRevenue {
  const sums: Record<LineKind, number> = { consultation: 0, procedure: 0, medication: 0, other: 0 };
  let discounts = 0;
  let tax = 0;
  let itemised = 0;
  for (const p of payments) {
    if (!p.bill) continue;
    itemised++;
    for (const l of p.bill.lines) sums[l.kind ?? 'other'] += l.amount;
    discounts += p.bill.discountAmount;
    tax += p.bill.taxAmount;
  }
  const categories = (Object.keys(sums) as LineKind[]).map((kind) => ({ kind, label: KIND_LABEL[kind], amount: round2(sums[kind]) }));
  const total = round2(categories.reduce((s, c) => s + c.amount, 0) - discounts + tax);
  return { categories, discounts: round2(discounts), tax: round2(tax), total, itemised, payments: payments.length };
}

// ---- panel claims ------------------------------------------------------------------------------------------------

export interface ClaimRow { status: string; date: string; panelClaimed: number; claimReceivedOn?: string | null }

export const AGEING_BUCKETS = [
  { label: '0–30 days', max: 30 }, { label: '31–60 days', max: 60 }, { label: '61–90 days', max: 90 }, { label: 'Over 90 days', max: Infinity },
] as const;

export interface ClaimsAgeing {
  buckets: { label: string; count: number; amount: number }[];
  count: number;
  amount: number;
  oldestDays: number | null;
}

/** Panel claims still waiting for payment, grouped by how long ago the payment was taken. */
export function claimsAgeing(claims: ClaimRow[], today: string): ClaimsAgeing {
  const buckets = AGEING_BUCKETS.map((b) => ({ label: b.label, count: 0, amount: 0 }));
  let oldest: number | null = null;
  let count = 0;
  let amount = 0;
  for (const c of claims) {
    if (c.status !== 'Pending Claim' || c.panelClaimed <= 0) continue;
    const age = Math.max(0, daysBetween(localDateKey(new Date(c.date)), today));
    const i = AGEING_BUCKETS.findIndex((b) => age <= b.max);
    buckets[i].count++;
    buckets[i].amount += c.panelClaimed;
    count++;
    amount += c.panelClaimed;
    oldest = oldest === null ? age : Math.max(oldest, age);
  }
  return { buckets: buckets.map((b) => ({ ...b, amount: round2(b.amount) })), count, amount: round2(amount), oldestDays: oldest };
}

/** Average days between taking a payment and the panel paying, over claims that have been paid with a received date. */
export function averageDaysToPay(claims: ClaimRow[]): { days: number | null; claims: number } {
  const paid = claims.filter((c) => c.status === 'Claim Paid' && c.claimReceivedOn);
  if (paid.length === 0) return { days: null, claims: 0 };
  const total = paid.reduce((s, c) => s + Math.max(0, daysBetween(localDateKey(new Date(c.date)), c.claimReceivedOn as string)), 0);
  return { days: Math.round(total / paid.length), claims: paid.length };
}

// ---- stock -------------------------------------------------------------------------------------------------------

export interface StockValue {
  /** At the cost recorded on each batch. */
  value: number;
  batchesCosted: number;
  /** Batches holding stock with no cost recorded, which are not in the value. */
  batchesMissingCost: number;
}

export function stockValue(drugs: Pick<DrugItem, 'status' | 'batches'>[]): StockValue {
  let value = 0;
  let costed = 0;
  let missing = 0;
  for (const d of drugs) {
    if (d.status !== 'active') continue;
    for (const b of d.batches ?? []) {
      if (b.stock <= 0) continue;
      if (b.unitCost === null || b.unitCost === undefined) { missing++; continue; }
      costed++;
      value += b.stock * b.unitCost;
    }
  }
  return { value: round2(value), batchesCosted: costed, batchesMissingCost: missing };
}

export interface PrescribingRow { drugName: string; prescriptions: number; totalQuantity: number; isControlled: boolean }

export const prescribingFromRow = (r: any): PrescribingRow => ({
  drugName: r.drug_name, prescriptions: Number(r.prescriptions), totalQuantity: Number(r.total_quantity), isControlled: !!r.is_controlled,
});

export interface FastMover extends PrescribingRow { onHand: number | null }

/** Most-prescribed drugs with the in-date stock on hand now (null when the drug is not in the catalogue). */
export function fastMovers(prescribing: PrescribingRow[], drugs: Pick<DrugItem, 'name' | 'batches'>[], today: string): FastMover[] {
  const stock = new Map(drugs.map((d) => [d.name.toLowerCase(), usableStock(d, today)]));
  return prescribing.map((p) => ({ ...p, onHand: stock.get(p.drugName.toLowerCase()) ?? null }));
}

// ---- visit volume ------------------------------------------------------------------------------------------------

export interface VolumeDay { day: string; total: number; completed: number; cancelled: number; inProgress: number }

export const volumeFromRow = (r: any): VolumeDay => ({
  day: r.day, total: Number(r.total), completed: Number(r.completed), cancelled: Number(r.cancelled), inProgress: Number(r.in_progress),
});

/** Monday of the week containing a YYYY-MM-DD date. */
const weekStart = (day: string): string => {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
};

/** Daily rows as they are for short periods; summed by week for long ones so the chart stays readable. */
export function groupVolume(days: VolumeDay[], by: 'day' | 'week'): VolumeDay[] {
  if (by === 'day') return days;
  const weeks = new Map<string, VolumeDay>();
  for (const d of days) {
    const k = weekStart(d.day);
    const w = weeks.get(k) ?? { day: k, total: 0, completed: 0, cancelled: 0, inProgress: 0 };
    w.total += d.total; w.completed += d.completed; w.cancelled += d.cancelled; w.inProgress += d.inProgress;
    weeks.set(k, w);
  }
  return [...weeks.values()];
}

// ---- a doctor's month --------------------------------------------------------------------------------------------

export interface DoctorVisit {
  id: string;
  /** When the consultation was signed off (ISO). */
  signedOffAt: string;
  status: string;
  patientName: string;
  icdCode: string | null;
  diagnosis: string | null;
  paymentMethod: string | null;
  /** Paid + panel share once billed; null before the visit is paid. */
  fee: number | null;
  mcDays: number;
  referral: boolean;
  mcReason?: string | null;
  referralTo?: string | null;
  labOrders?: string[];
}

const hasCode = (c: string | null | undefined) => !!c && c.trim() !== '' && c.trim().toUpperCase() !== 'N/A';

export interface DoctorMonth {
  encounters: number;
  billed: number;
  billedVisits: number;
  averageBill: number | null;
  certificates: number;
  referrals: number;
  /** Visits with at least one lab or imaging order. */
  withLabOrders: number;
  coded: number;
  uncoded: number;
  topDiagnosis: { code: string; diagnosis: string | null; count: number; sharePercent: number } | null;
  byDay: { day: string; count: number }[];
  byMethod: { method: string; count: number; amount: number }[];
}

export function summarizeDoctorMonth(visits: DoctorVisit[]): DoctorMonth {
  const days = new Map<string, number>();
  const methods = new Map<string, { method: string; count: number; amount: number }>();
  const codes = new Map<string, { code: string; diagnosis: string | null; count: number }>();
  let billed = 0;
  let billedVisits = 0;
  let certificates = 0;
  let referrals = 0;
  let withLabOrders = 0;
  let coded = 0;
  for (const v of visits) {
    const day = localDateKey(new Date(v.signedOffAt));
    days.set(day, (days.get(day) ?? 0) + 1);
    if (v.fee !== null) {
      billed += v.fee;
      billedVisits++;
      const key = v.paymentMethod || 'Unspecified';
      const m = methods.get(key) ?? { method: key, count: 0, amount: 0 };
      m.count++; m.amount += v.fee;
      methods.set(key, m);
    }
    if (v.mcDays > 0) certificates++;
    if (v.referral) referrals++;
    if (v.labOrders && v.labOrders.length > 0) withLabOrders++;
    if (hasCode(v.icdCode)) {
      coded++;
      const c = codes.get(v.icdCode as string) ?? { code: v.icdCode as string, diagnosis: v.diagnosis, count: 0 };
      c.count++;
      codes.set(v.icdCode as string, c);
    }
  }
  const top = [...codes.values()].sort((a, b) => b.count - a.count || a.code.localeCompare(b.code))[0];
  return {
    encounters: visits.length,
    billed: round2(billed),
    billedVisits,
    averageBill: billedVisits ? round2(billed / billedVisits) : null,
    certificates,
    referrals,
    withLabOrders,
    coded,
    uncoded: visits.length - coded,
    topDiagnosis: top ? { ...top, sharePercent: Math.round((top.count / coded) * 100) } : null,
    byDay: [...days].map(([day, count]) => ({ day, count })).sort((a, b) => a.day.localeCompare(b.day)),
    byMethod: [...methods.values()].map((m) => ({ ...m, amount: round2(m.amount) })).sort((a, b) => b.amount - a.amount),
  };
}

/** The last `count` calendar months, newest first, as YYYY-MM keys. */
export function recentMonthKeys(count: number, now: Date): string[] {
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
}

/** Start of a month and of the next one, as ISO instants, for a YYYY-MM key (local time). */
export function monthWindow(key: string): { from: string; to: string } {
  const y = Number(key.slice(0, 4));
  const m = Number(key.slice(5, 7)) - 1;
  return { from: new Date(y, m, 1).toISOString(), to: new Date(y, m + 1, 1).toISOString() };
}

export const monthLabel = (key: string): string =>
  new Date(Number(key.slice(0, 4)), Number(key.slice(5, 7)) - 1, 1).toLocaleDateString('en-MY', { month: 'long', year: 'numeric' });
