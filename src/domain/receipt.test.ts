import { describe, expect, it } from 'vitest';
import type { InvoiceSnapshot } from './billing';
import { ClinicHeader, ReceiptSource, buildReceipt, taxLabel } from './receipt';

const clinic: ClinicHeader = { name: ' Klinik Contoh ', branch: 'Shah Alam', address: 'Level 2, Menara', phone: '03-1234', licenseNo: 'KKM-1' };

const bill: InvoiceSnapshot = {
  lines: [
    { description: 'Consultation fee', quantity: 1, unitPrice: 35, amount: 35 },
    { description: 'Clinical procedures / nursing', quantity: 1, unitPrice: 40, amount: 40 },
    { description: 'Amoxicillin 500mg', quantity: 10, unitPrice: 1.5, amount: 15 },
  ],
  discountAmount: 9,
  subtotal: 81,
  taxRate: 0.08,
  taxAmount: 6.48,
  grandTotal: 87.48,
};

const paid = (over: Partial<ReceiptSource> = {}): ReceiptSource => ({
  receiptNo: 'RC-2026-000007', date: '2026-10-22T04:00:00Z', patientName: 'Siti Aminah', visitId: 'abcdef12-3456-7890-abcd-ef1234567890',
  paymentMethod: 'Cash', paidAmount: 87.48, panelClaimed: 0, bill, ...over,
});

describe('taxLabel', () => {
  it('shows the rate the bill was charged at, without trailing zeros', () => {
    expect(taxLabel(0.06)).toBe('SST (6%)');
    expect(taxLabel(0.08)).toBe('SST (8%)');
    expect(taxLabel(0.065)).toBe('SST (6.5%)');
    expect(taxLabel(0)).toBe('SST (0%)');
  });
});

describe('buildReceipt', () => {
  it('uses the stored bill, not today\'s fees', () => {
    const r = buildReceipt(paid(), clinic);
    expect(r.itemised).toBe(true);
    expect(r.lines.map((l) => l.description)).toEqual(['Consultation fee', 'Clinical procedures / nursing', 'Amoxicillin 500mg']);
    expect(r).toMatchObject({ discount: 9, subtotal: 81, tax: 6.48, taxLabel: 'SST (8%)', total: 87.48, paidByPatient: 87.48, panelClaimed: 0 });
  });

  it('carries the receipt number, patient and a short visit reference', () => {
    const r = buildReceipt(paid(), clinic);
    expect(r).toMatchObject({ receiptNo: 'RC-2026-000007', patientName: 'Siti Aminah', visitRef: 'ABCDEF12', paymentMethod: 'Cash' });
  });

  it('takes the clinic header from the profile and tidies it', () => {
    const r = buildReceipt(paid(), { ...clinic, branch: '  ', licenseNo: '' });
    expect(r.clinic).toEqual({ name: 'Klinik Contoh', branch: '', address: 'Level 2, Menara', phone: '03-1234', licenseNo: '' });
    expect(buildReceipt(paid(), { ...clinic, name: '' }).clinic.name).toBe('Clinic');
  });

  it('splits a panel visit into the patient\'s share and the panel\'s claim', () => {
    const r = buildReceipt(paid({ paymentMethod: 'Credit Card', paidAmount: 20, panelClaimed: 67.48, glNumber: ' GL-77 ', panelName: 'MiCare TPA', paymentReference: 'pi_abc' }), clinic);
    expect(r).toMatchObject({ total: 87.48, paidByPatient: 20, panelClaimed: 67.48, panelName: 'MiCare TPA', glNumber: 'GL-77', paymentReference: 'pi_abc' });
  });

  it('makes a summary copy for payments taken before bills were stored', () => {
    const r = buildReceipt(paid({ bill: null, receiptNo: null }), clinic);
    expect(r).toMatchObject({ itemised: false, lines: [], subtotal: null, tax: null, taxLabel: null, receiptNo: null, total: 87.48 });
  });

  it('copes with missing patient and visit details', () => {
    const r = buildReceipt(paid({ patientName: null, visitId: null }), clinic);
    expect(r.patientName).toBe('Patient');
    expect(r.visitRef).toBeNull();
  });

  it('reports the total actually charged, rounded to sen', () => {
    expect(buildReceipt(paid({ paidAmount: 10.004, panelClaimed: 20.003 }), clinic).total).toBe(30.01);
  });
});
