import { describe, expect, it } from 'vitest';
import { formatRM, monthBounds, percentChange, summarizeEInvoiceHealth, summarizeRevenue } from './revenue';

describe('summarizeRevenue', () => {
  it('adds patient-paid and panel-claimed amounts and groups by payment method', () => {
    const s = summarizeRevenue([
      { paidAmount: 100, panelClaimed: 0, paymentMethod: 'Cash' },
      { paidAmount: 50.5, panelClaimed: 0, paymentMethod: 'Cash' },
      { paidAmount: 20, panelClaimed: 180, paymentMethod: 'Credit Card' },
      { paidAmount: 0, panelClaimed: 300, paymentMethod: 'Panel' },
      { paidAmount: 10, panelClaimed: 0, paymentMethod: null },
    ]);
    expect(s).toMatchObject({ visits: 5, patientPaid: 180.5, panelClaimed: 480, total: 660.5, average: 132.1 });
    // Largest first.
    expect(s.byMethod.map((m) => [m.method, m.count, m.amount])).toEqual([
      ['Panel', 1, 300], ['Credit Card', 1, 200], ['Cash', 2, 150.5], ['Unspecified', 1, 10],
    ]);
  });

  it('handles no visits', () => {
    expect(summarizeRevenue([])).toEqual({ visits: 0, patientPaid: 0, panelClaimed: 0, total: 0, average: 0, byMethod: [] });
  });
});

describe('percentChange', () => {
  it('compares to the previous period and has no answer when there was none', () => {
    expect(percentChange(150, 100)).toBe(50);
    expect(percentChange(50, 100)).toBe(-50);
    expect(percentChange(10, 0)).toBeNull();
  });
});

describe('monthBounds', () => {
  it('returns the start of this and the previous month, across a year boundary', () => {
    const { start, previousStart } = monthBounds(new Date(2026, 0, 15, 10));
    expect([start.getFullYear(), start.getMonth(), start.getDate()]).toEqual([2026, 0, 1]);
    expect([previousStart.getFullYear(), previousStart.getMonth(), previousStart.getDate()]).toEqual([2025, 11, 1]);
  });
});

describe('summarizeEInvoiceHealth', () => {
  it('counts invoices that still need action and their value', () => {
    const h = summarizeEInvoiceHealth([
      { status: 'valid', totalPayable: 100 }, { status: 'invalid', totalPayable: 50.25 },
      { status: 'needs_buyer', totalPayable: 10 }, { status: 'cancelled', totalPayable: 999 },
    ]);
    expect(h.needAttention).toBe(2);
    expect(h.valueNeedingAttention).toBe(60.25);
    expect(h.counts.valid).toBe(1);
  });
});

describe('formatRM', () => {
  it('formats with thousands separators and two decimals', () => {
    expect(formatRM(1234.5)).toBe('RM 1,234.50');
  });
});
