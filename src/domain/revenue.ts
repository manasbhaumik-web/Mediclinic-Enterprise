/** Revenue roll-ups for the admin Revenue hub, computed from paid visits and e-invoices. */
import { EInvoiceStatus, summariseInvoices } from './einvoice';

export interface PaidVisit {
  /** What the patient paid (the full bill, or their co-pay on a panel visit). */
  paidAmount: number;
  /** The panel / TPA portion of the bill, owed by the panel. */
  panelClaimed: number;
  paymentMethod: string | null;
}

export interface MethodTotal { method: string; count: number; amount: number }

export interface RevenueSummary {
  visits: number;
  patientPaid: number;
  panelClaimed: number;
  /** Patient-paid plus panel-claimed. */
  total: number;
  average: number;
  byMethod: MethodTotal[];
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export function summarizeRevenue(rows: PaidVisit[]): RevenueSummary {
  const methods = new Map<string, MethodTotal>();
  let patientPaid = 0;
  let panelClaimed = 0;
  for (const r of rows) {
    patientPaid += r.paidAmount;
    panelClaimed += r.panelClaimed;
    const key = r.paymentMethod || 'Unspecified';
    const m = methods.get(key) ?? { method: key, count: 0, amount: 0 };
    m.count++;
    m.amount += r.paidAmount + r.panelClaimed;
    methods.set(key, m);
  }
  const total = patientPaid + panelClaimed;
  return {
    visits: rows.length,
    patientPaid: round2(patientPaid),
    panelClaimed: round2(panelClaimed),
    total: round2(total),
    average: rows.length ? round2(total / rows.length) : 0,
    byMethod: [...methods.values()].map((m) => ({ ...m, amount: round2(m.amount) })).sort((a, b) => b.amount - a.amount),
  };
}

/** Percentage change from previous to current; null when there is nothing to compare against. */
export const percentChange = (current: number, previous: number): number | null =>
  previous > 0 ? Math.round(((current - previous) / previous) * 100) : null;

/** First instant of the month containing `now`, and of the month before it (local time). */
export function monthBounds(now: Date): { start: Date; previousStart: Date } {
  return {
    start: new Date(now.getFullYear(), now.getMonth(), 1),
    previousStart: new Date(now.getFullYear(), now.getMonth() - 1, 1),
  };
}

export interface EInvoiceHealth {
  counts: Record<EInvoiceStatus, number>;
  /** Invoices that still need action before LHDN accepts them. */
  needAttention: number;
  /** Their total value. */
  valueNeedingAttention: number;
}

const ATTENTION: readonly EInvoiceStatus[] = ['pending', 'needs_buyer', 'invalid', 'error'];

export function summarizeEInvoiceHealth(rows: { status: EInvoiceStatus; totalPayable: number }[]): EInvoiceHealth {
  const needing = rows.filter((r) => ATTENTION.includes(r.status));
  return {
    counts: summariseInvoices(rows),
    needAttention: needing.length,
    valueNeedingAttention: round2(needing.reduce((s, r) => s + r.totalPayable, 0)),
  };
}

export const formatRM = (n: number): string =>
  `RM ${n.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
