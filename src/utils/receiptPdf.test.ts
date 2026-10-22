import { describe, expect, it, vi } from 'vitest';
import type { InvoiceSnapshot } from '../domain/billing';
import { buildReceipt } from '../domain/receipt';
import { downloadReceiptPdf } from './receiptPdf';

const captured = vi.hoisted(() => ({ text: '', file: '' }));

// Wrap jsPDF so the finished document's text and file name can be inspected instead of triggering a download.
vi.mock('jspdf', async (importOriginal) => {
  const mod = await importOriginal<typeof import('jspdf')>();
  class Capturing extends mod.jsPDF {
    constructor(...args: ConstructorParameters<typeof mod.jsPDF>) {
      super(...args);
      (this as unknown as { save: (name: string) => unknown }).save = (name: string) => {
        captured.text = this.output();
        captured.file = name;
        return this;
      };
    }
  }
  return { ...mod, jsPDF: Capturing };
});

const clinic = { name: 'Klinik Contoh', branch: 'Shah Alam', address: 'Level 2, Menara Medical', phone: '03-1234 5678', licenseNo: 'KKM-77' };

const bill: InvoiceSnapshot = {
  lines: [
    { description: 'Consultation fee', quantity: 1, unitPrice: 35, amount: 35 },
    { description: 'Amoxicillin 500mg', quantity: 10, unitPrice: 1.5, amount: 15 },
  ],
  discountAmount: 5,
  subtotal: 45,
  taxRate: 0.08,
  taxAmount: 3.6,
  grandTotal: 48.6,
};

/** PDF content streams escape parentheses and backslashes, so compare against the escaped form. */
const pdf = (s: string) => s.replace(/[()\\]/g, '\\$&');

/** Runs the real PDF code and returns the document text as written (jsPDF leaves text streams uncompressed). */
function render(receipt: ReturnType<typeof buildReceipt>): { text: string; file: string } {
  captured.text = '';
  captured.file = '';
  downloadReceiptPdf(receipt);
  return { text: captured.text, file: captured.file };
}

describe('downloadReceiptPdf', () => {
  it('prints the real bill: clinic header, number, lines, discount, SST at the charged rate and total', () => {
    const { text, file } = render(buildReceipt({
      receiptNo: 'RC-2026-000042', date: '2026-10-22T04:00:00Z', patientName: 'Siti Aminah', visitId: 'abcdef12-0000-0000-0000-000000000000',
      paymentMethod: 'Cash', paidAmount: 48.6, panelClaimed: 0, bill,
    }, clinic));

    expect(file).toBe('Receipt_RC-2026-000042.pdf');
    for (const expected of [
      'Klinik Contoh', 'Shah Alam', 'Level 2, Menara Medical', '03-1234 5678', 'KKM-77',
      'RC-2026-000042', 'Siti Aminah', 'ABCDEF12',
      'Consultation fee', 'Amoxicillin 500mg', 'RM 1.50', 'RM 15.00',
      'Discount', '-RM 5.00', 'Subtotal', 'RM 45.00', 'SST (8%)', 'RM 3.60', 'RM 48.60',
      'Cash', 'Paid by patient',
    ]) expect(text, expected).toContain(pdf(expected));
    // Nothing from the old hard-coded receipt.
    for (const gone of ['Jalan Bukit Bintang', 'billing@mediclinic', 'SST (6%)']) expect(text).not.toContain(pdf(gone));
  });

  it('shows the panel share, GL reference and payment reference', () => {
    const { text } = render(buildReceipt({
      receiptNo: 'RC-2026-000043', date: '2026-10-22T04:00:00Z', patientName: 'Lim', visitId: null,
      paymentMethod: 'Credit Card', paymentReference: 'pi_123', paidAmount: 10, panelClaimed: 38.6, glNumber: 'GL-9', panelName: 'MiCare TPA', bill,
    }, clinic));
    for (const expected of ['Claimed from MiCare TPA', 'RM 38.60', 'GL-9', 'pi_123', 'RM 10.00']) expect(text, expected).toContain(pdf(expected));
  });

  it('makes a clearly labelled summary copy for older payments', () => {
    const { text, file } = render(buildReceipt({
      receiptNo: null, date: '2026-08-01T00:00:00Z', patientName: 'Race Test', visitId: '1851b25a-d653-4efc-8e0a-1ad9026978e1',
      paymentMethod: 'Credit Card', paidAmount: 53, panelClaimed: 0, bill: null,
    }, clinic));
    expect(file).toBe('Receipt_1851B25A.pdf');
    for (const expected of ['Summary copy', 'Itemised bill not available', 'RM 53.00']) expect(text, expected).toContain(pdf(expected));
    expect(text).not.toContain('Subtotal');
  });
});
