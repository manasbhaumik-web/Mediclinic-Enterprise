import { describe, expect, it } from 'vitest';
import { buildInvoiceSnapshot, calculateBill, InvoiceSnapshot } from './billing';
import {
  averageDaysToPay, claimsAgeing, csvField, fastMovers, groupVolume, monthLabel, monthWindow, monthsBetween, recentMonthKeys,
  revenueByCategory, revenueByMonth, slug, stockValue, summarizeDoctorMonth, toCsv, DoctorVisit, VolumeDay,
} from './reports';

describe('csv', () => {
  it('quotes fields that need it and leaves blanks empty', () => {
    expect(csvField('plain')).toBe('plain');
    expect(csvField('a,b')).toBe('"a,b"');
    expect(csvField('say "hi"')).toBe('"say ""hi"""');
    expect(csvField('two\nlines')).toBe('"two\nlines"');
    expect(csvField(null)).toBe('');
    expect(csvField(12.5)).toBe('12.5');
  });

  it('defuses spreadsheet formulas in text but not negative numbers', () => {
    expect(csvField('=HYPERLINK("x")')).toBe(`"'=HYPERLINK(""x"")"`);
    expect(csvField('+60123')).toBe("'+60123");
    expect(csvField('@sum')).toBe("'@sum");
    expect(csvField(-5)).toBe('-5');
  });

  it('writes a header row then the rows', () => {
    expect(toCsv({ columns: ['Name', 'Amount'], rows: [['Siti, A', 10], ['Lim', null]] })).toBe('Name,Amount\r\n"Siti, A",10\r\nLim,');
  });

  it('makes safe file name slugs', () => {
    expect(slug('Revenue by month (Oct 2026)')).toBe('revenue-by-month-oct-2026');
  });
});

describe('revenueByMonth', () => {
  it('includes months with no payments and splits patient and panel amounts', () => {
    expect(monthsBetween('2026-09-15', '2026-11-02')).toEqual(['2026-09', '2026-10', '2026-11']);
    expect(monthsBetween('2025-12-01', '2026-02-01')).toEqual(['2025-12', '2026-01', '2026-02']);
    const rows = revenueByMonth([
      { visitDate: new Date(2026, 8, 10, 12).toISOString(), paidAmount: 50, panelClaimed: 0, paymentMethod: 'Cash' },
      { visitDate: new Date(2026, 8, 20, 12).toISOString(), paidAmount: 10, panelClaimed: 90, paymentMethod: 'Panel' },
      { visitDate: new Date(2026, 10, 1, 12).toISOString(), paidAmount: 5, panelClaimed: 0, paymentMethod: null },
    ], '2026-09-01', '2026-11-30');
    expect(rows).toEqual([
      { month: '2026-09', patientPaid: 60, panelClaimed: 90, total: 150, visits: 2 },
      { month: '2026-10', patientPaid: 0, panelClaimed: 0, total: 0, visits: 0 },
      { month: '2026-11', patientPaid: 5, panelClaimed: 0, total: 5, visits: 1 },
    ]);
  });
});

describe('revenueByCategory', () => {
  const bill = (over: Partial<InvoiceSnapshot> = {}): InvoiceSnapshot => ({
    lines: [
      { description: 'Consultation fee', quantity: 1, unitPrice: 35, amount: 35, kind: 'consultation' },
      { description: 'Clinical procedures / nursing', quantity: 1, unitPrice: 15, amount: 15, kind: 'procedure' },
      { description: 'Amoxicillin', quantity: 10, unitPrice: 1.5, amount: 15, kind: 'medication' },
      { description: 'Dressing', quantity: 1, unitPrice: 5, amount: 5, kind: 'other' },
    ],
    discountAmount: 5, subtotal: 65, taxRate: 0.06, taxAmount: 3.9, grandTotal: 68.9, ...over,
  });

  it('adds up line categories, discounts and tax so they reconcile to the billed total', () => {
    const r = revenueByCategory([{ bill: bill() }, { bill: bill() }]);
    expect(r.categories.map((c) => [c.kind, c.amount])).toEqual([['consultation', 70], ['procedure', 30], ['medication', 30], ['other', 10]]);
    expect(r).toMatchObject({ discounts: 10, tax: 7.8, total: 137.8, itemised: 2, payments: 2 });
  });

  it('counts payments with no stored bill without inventing amounts', () => {
    const r = revenueByCategory([{ bill: bill() }, { bill: null }, {}]);
    expect(r).toMatchObject({ itemised: 1, payments: 3, total: 68.9 });
  });

  it('puts untagged lines under other charges', () => {
    const r = revenueByCategory([{ bill: bill({ lines: [{ description: 'x', quantity: 1, unitPrice: 9, amount: 9 }], discountAmount: 0, taxAmount: 0 }) }]);
    expect(r.categories.find((c) => c.kind === 'other')?.amount).toBe(9);
  });

  it('matches what the cashier desk stores: the bill builder tags every line', () => {
    const input = { consultationFee: 35, procedureFee: 15, prescription: [{ pricePerUnit: 2, quantity: 5 }], customItems: [{ amount: 4, description: 'Dressing' }], discount: { type: 'fixed' as const, value: 0 }, taxRate: 0.06 };
    const snap = buildInvoiceSnapshot(input, calculateBill(input), ['Paracetamol']);
    expect(snap.lines.map((l) => l.kind)).toEqual(['consultation', 'procedure', 'medication', 'other']);
    expect(revenueByCategory([{ bill: snap }]).total).toBeCloseTo(snap.grandTotal, 2);
  });
});

describe('claims', () => {
  const today = '2026-10-22';
  const at = (daysAgo: number) => new Date(2026, 9, 22 - daysAgo, 12).toISOString();

  it('ages pending claims into buckets and ignores paid or empty ones', () => {
    const a = claimsAgeing([
      { status: 'Pending Claim', date: at(5), panelClaimed: 100 },
      { status: 'Pending Claim', date: at(30), panelClaimed: 50 },
      { status: 'Pending Claim', date: at(31), panelClaimed: 25 },
      { status: 'Pending Claim', date: at(120), panelClaimed: 10.5 },
      { status: 'Claim Paid', date: at(40), panelClaimed: 999 },
      { status: 'Completed', date: at(2), panelClaimed: 0 },
    ], today);
    expect(a.buckets).toEqual([
      { label: '0–30 days', count: 2, amount: 150 },
      { label: '31–60 days', count: 1, amount: 25 },
      { label: '61–90 days', count: 0, amount: 0 },
      { label: 'Over 90 days', count: 1, amount: 10.5 },
    ]);
    expect(a).toMatchObject({ count: 4, amount: 185.5, oldestDays: 120 });
    expect(claimsAgeing([], today)).toMatchObject({ count: 0, amount: 0, oldestDays: null });
  });

  it('averages days to payment over claims that record when they were paid', () => {
    expect(averageDaysToPay([
      { status: 'Claim Paid', date: at(20), panelClaimed: 1, claimReceivedOn: '2026-10-12' },
      { status: 'Claim Paid', date: at(10), panelClaimed: 1, claimReceivedOn: '2026-10-20' },
      { status: 'Claim Paid', date: at(10), panelClaimed: 1, claimReceivedOn: null },
      { status: 'Pending Claim', date: at(10), panelClaimed: 1 },
    ])).toEqual({ days: 9, claims: 2 });
    expect(averageDaysToPay([])).toEqual({ days: null, claims: 0 });
  });
});

describe('stock', () => {
  const drug = (name: string, batches: { stock: number; unitCost?: number | null; expiryDate?: string | null }[], status: 'active' | 'retired' = 'active') =>
    ({ name, status, batches: batches.map((b, i) => ({ id: String(i), batchId: `B${i}`, stock: b.stock, expiryDate: b.expiryDate ?? null, unitCost: b.unitCost })) });

  it('values stock at recorded cost and reports what could not be valued', () => {
    const s = stockValue([
      drug('A', [{ stock: 10, unitCost: 2 }, { stock: 5, unitCost: null }, { stock: 0, unitCost: 9 }]),
      drug('B', [{ stock: 4, unitCost: 1.25 }]),
      drug('Old', [{ stock: 100, unitCost: 100 }], 'retired'),
    ] as any);
    expect(s).toEqual({ value: 25, batchesCosted: 2, batchesMissingCost: 1 });
  });

  it('joins prescribing with in-date stock on hand, ignoring expired batches', () => {
    const rows = fastMovers(
      [{ drugName: 'Paracetamol 500mg', prescriptions: 9, totalQuantity: 90, isControlled: false }, { drugName: 'Unknown', prescriptions: 1, totalQuantity: 1, isControlled: false }],
      [drug('paracetamol 500MG', [{ stock: 20, expiryDate: '2027-01-01' }, { stock: 50, expiryDate: '2026-01-01' }]) as any],
      '2026-10-22',
    );
    expect(rows.map((r) => r.onHand)).toEqual([20, null]);
  });
});

describe('visit volume', () => {
  const day = (d: string, total: number, completed = total): VolumeDay => ({ day: d, total, completed, cancelled: 0, inProgress: 0 });

  it('sums days into Monday-start weeks for long periods', () => {
    const w = groupVolume([day('2026-10-19', 2), day('2026-10-21', 3), day('2026-10-25', 1), day('2026-10-26', 4)], 'week');
    expect(w.map((x) => [x.day, x.total])).toEqual([['2026-10-19', 6], ['2026-10-26', 4]]);
    expect(groupVolume([day('2026-10-19', 2)], 'day')).toHaveLength(1);
  });
});

describe('summarizeDoctorMonth', () => {
  const v = (over: Partial<DoctorVisit>): DoctorVisit => ({
    id: Math.random().toString(), signedOffAt: new Date(2026, 9, 5, 10).toISOString(), status: 'Paid', patientName: 'P', icdCode: 'J06.9', diagnosis: 'URTI',
    paymentMethod: 'Cash', fee: 50, mcDays: 0, referral: false, ...over,
  });

  it('counts encounters, billing, certificates, referrals and the leading diagnosis', () => {
    const s = summarizeDoctorMonth([
      v({}), v({ fee: 70, paymentMethod: 'Panel', mcDays: 2 }), v({ icdCode: 'I10', diagnosis: 'HTN', referral: true, fee: null, status: 'Awaiting Billing' }),
      v({ icdCode: 'N/A', signedOffAt: new Date(2026, 9, 6, 10).toISOString() }),
    ]);
    expect(s).toMatchObject({ encounters: 4, billed: 170, billedVisits: 3, averageBill: 56.67, certificates: 1, referrals: 1, coded: 3, uncoded: 1 });
    expect(s.topDiagnosis).toEqual({ code: 'J06.9', diagnosis: 'URTI', count: 2, sharePercent: 67 });
    expect(s.byDay).toEqual([{ day: '2026-10-05', count: 3 }, { day: '2026-10-06', count: 1 }]);
    expect(s.byMethod).toEqual([{ method: 'Cash', count: 2, amount: 100 }, { method: 'Panel', count: 1, amount: 70 }].sort((a, b) => b.amount - a.amount));
  });

  it('copes with a month with no consultations', () => {
    expect(summarizeDoctorMonth([])).toMatchObject({ encounters: 0, billed: 0, averageBill: null, topDiagnosis: null, byDay: [], byMethod: [] });
  });
});

describe('months', () => {
  it('lists recent months newest first and builds their window', () => {
    expect(recentMonthKeys(3, new Date(2026, 0, 15))).toEqual(['2026-01', '2025-12', '2025-11']);
    const w = monthWindow('2026-12');
    expect(new Date(w.from).getMonth()).toBe(11);
    expect(new Date(w.to).getFullYear()).toBe(2027);
    expect(monthLabel('2026-10')).toContain('2026');
  });
});
