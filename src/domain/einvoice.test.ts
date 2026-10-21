import { describe, expect, it } from 'vitest';
import { InvoiceSnapshot, buildInvoiceSnapshot, calculateBill } from './billing';
import {
  EMPTY_CONFIG, EInvoiceConfig, EInvoiceRow, canCancel, cancelWindowOpen, checkSetup, connectionFromRow,
  consolidatedDueDate, invoiceFromRow, recentMonths, summariseInvoices,
} from './einvoice';

const goodConfig = (): EInvoiceConfig => ({
  ...EMPTY_CONFIG,
  clientId: 'abc',
  supplier: {
    ...EMPTY_CONFIG.supplier, name: 'Klinik', tin: 'C12345678901', brn: '202001012345', msicCode: '86201',
    msicDescription: 'Medical practice', address1: '1 Jalan', city: 'Shah Alam', postcode: '40000', stateCode: '10', phone: '0355',
  },
});

describe('checkSetup', () => {
  it('passes only when supplier, client id and secret are all present', () => {
    expect(checkSetup(goodConfig(), true)).toEqual({ ok: true, problems: [] });
  });

  it('lists everything that is missing', () => {
    const r = checkSetup(EMPTY_CONFIG, false);
    expect(r.ok).toBe(false);
    expect(r.problems).toEqual(expect.arrayContaining(['TIN is required', 'MyInvois client ID is required', 'MyInvois client secret has not been saved']));
  });

  it('flags a missing secret even when everything else is right', () => {
    expect(checkSetup(goodConfig(), false).problems).toEqual(['MyInvois client secret has not been saved']);
  });
});

describe('dates', () => {
  it('consolidated invoices are due 7 days after month end', () => {
    expect(consolidatedDueDate('2026-10')?.toISOString().slice(0, 10)).toBe('2026-11-07');
    expect(consolidatedDueDate('2026-02')?.toISOString().slice(0, 10)).toBe('2026-03-07');
    expect(consolidatedDueDate('nope')).toBeNull();
  });

  it('lists recent months newest first in Malaysia time', () => {
    // 2026-10-31 20:00 UTC is already 1 November in Malaysia.
    expect(recentMonths(3, new Date('2026-10-31T20:00:00Z'))).toEqual(['2026-11', '2026-10', '2026-09']);
    expect(recentMonths(2, new Date('2026-01-15T00:00:00Z'))).toEqual(['2026-01', '2025-12']);
  });

  it('the cancellation window is 72 hours from validation', () => {
    const v = '2026-10-21T00:00:00Z';
    expect(cancelWindowOpen(v, new Date('2026-10-23T23:00:00Z'))).toBe(true);
    expect(cancelWindowOpen(v, new Date('2026-10-24T01:00:00Z'))).toBe(false);
    expect(cancelWindowOpen(null)).toBe(true);
  });
});

describe('canCancel', () => {
  it('only submitted or valid e-invoices that have an LHDN id can be cancelled', () => {
    expect(canCancel({ status: 'valid', lhdnUuid: 'u' })).toBe(true);
    expect(canCancel({ status: 'submitted', lhdnUuid: 'u' })).toBe(true);
    expect(canCancel({ status: 'valid', lhdnUuid: null })).toBe(false);
    for (const status of ['pending', 'needs_buyer', 'invalid', 'cancelled', 'error', 'consolidated'] as const) {
      expect(canCancel({ status, lhdnUuid: 'u' })).toBe(false);
    }
  });
});

describe('row mapping', () => {
  it('maps a connection and fills missing config with defaults', () => {
    const c = connectionFromRow({ id: 'c', enabled: true, mode: 'live', secret_set: true, config: { clientId: 'x', supplier: { name: 'N' } } });
    expect(c).toMatchObject({ enabled: true, mode: 'live', secretSet: true });
    expect(c.config.clientId).toBe('x');
    expect(c.config.supplier.name).toBe('N');
    expect(c.config.supplier.country).toBe('MYS');
    expect(c.config.submissionMode).toBe('consolidated');
  });

  it('maps an invoice row and coerces numeric strings', () => {
    const r = invoiceFromRow({ id: 'i', invoice_number: 'INV-1', kind: 'invoice', status: 'valid', buyer_type: 'general_public', buyer: null, total_payable: '52.47', tax_total: '2.97', validation_errors: null });
    expect(r).toMatchObject({ invoiceNumber: 'INV-1', totalPayable: 52.47, taxTotal: 2.97, buyer: {}, validationErrors: null });
  });

  it('summarises statuses', () => {
    const s = summariseInvoices([{ status: 'pending' }, { status: 'pending' }, { status: 'valid' }] as Pick<EInvoiceRow, 'status'>[]);
    expect(s.pending).toBe(2);
    expect(s.valid).toBe(1);
    expect(s.error).toBe(0);
  });
});

describe('buildInvoiceSnapshot', () => {
  const input = {
    consultationFee: 35, procedureFee: 15,
    prescription: [{ pricePerUnit: 2, quantity: 10 }],
    customItems: [{ amount: 5, description: 'Dressing' }] as { amount: number }[],
    discount: { type: 'fixed' as const, value: 5 }, taxRate: 0.06,
  };
  const breakdown = calculateBill(input);
  const snap: InvoiceSnapshot = buildInvoiceSnapshot(input, breakdown, ['Paracetamol']);

  it('has one line per charge with its name, quantity and price', () => {
    expect(snap.lines.map((l) => l.description)).toEqual(['Consultation fee', 'Clinical procedures / nursing', 'Paracetamol', 'Dressing']);
    expect(snap.lines[2]).toEqual({ description: 'Paracetamol', quantity: 10, unitPrice: 2, amount: 20 });
  });

  it('carries the same totals the cashier saw', () => {
    expect(snap).toMatchObject({ discountAmount: 5, subtotal: 70, taxRate: 0.06 });
    expect(snap.taxAmount).toBeCloseTo(4.2);
    expect(snap.grandTotal).toBeCloseTo(74.2);
    // Lines minus discount equal the subtotal.
    expect(snap.lines.reduce((s, l) => s + l.amount, 0) - snap.discountAmount).toBeCloseTo(snap.subtotal);
  });

  it('leaves out zero-value charges', () => {
    const s = buildInvoiceSnapshot({ ...input, procedureFee: 0, prescription: [], customItems: [] }, calculateBill({ ...input, procedureFee: 0, prescription: [], customItems: [] }));
    expect(s.lines.map((l) => l.description)).toEqual(['Consultation fee']);
  });
});
