/** Builds what a receipt shows from a stored payment and the clinic profile. Pure, so a reprint is always the same document. */
import { InvoiceSnapshot, round2 } from './billing';

/** The parts of a stored payment a receipt needs (a ledger transaction satisfies this). */
export interface ReceiptSource {
  receiptNo?: string | null;
  /** When the payment was taken (ISO). */
  date: string;
  patientName?: string | null;
  visitId?: string | null;
  paymentMethod: string;
  paymentReference?: string | null;
  paidAmount: number;
  panelClaimed: number;
  glNumber?: string | null;
  panelName?: string | null;
  /** The itemised bill as charged. Absent for payments taken before bills were stored. */
  bill?: InvoiceSnapshot | null;
}

export interface ClinicHeader {
  name: string;
  branch: string;
  address: string;
  phone: string;
  licenseNo: string;
}

export interface ReceiptLine { description: string; quantity: number; unitPrice: number; amount: number }

export interface ReceiptData {
  /** Null for payments taken before receipts were numbered. */
  receiptNo: string | null;
  issuedAt: string;
  clinic: ClinicHeader;
  patientName: string;
  visitRef: string | null;
  /** False when only totals are known (older payments), so the receipt is a summary copy. */
  itemised: boolean;
  lines: ReceiptLine[];
  discount: number;
  subtotal: number | null;
  taxLabel: string | null;
  tax: number | null;
  total: number;
  paidByPatient: number;
  panelClaimed: number;
  panelName: string | null;
  glNumber: string | null;
  paymentMethod: string;
  paymentReference: string | null;
}

/** "SST (6%)" from the fraction the bill was charged at (0.06). */
export const taxLabel = (rate: number): string => `SST (${Number((rate * 100).toFixed(2))}%)`;

const text = (s: string | null | undefined) => (s ?? '').trim();

export function buildReceipt(src: ReceiptSource, clinic: ClinicHeader): ReceiptData {
  const bill = src.bill ?? null;
  return {
    receiptNo: text(src.receiptNo) || null,
    issuedAt: src.date,
    clinic: {
      name: text(clinic.name) || 'Clinic', branch: text(clinic.branch), address: text(clinic.address),
      phone: text(clinic.phone), licenseNo: text(clinic.licenseNo),
    },
    patientName: text(src.patientName) || 'Patient',
    visitRef: src.visitId ? src.visitId.slice(0, 8).toUpperCase() : null,
    itemised: !!bill,
    lines: bill ? bill.lines.map((l) => ({ description: l.description, quantity: l.quantity, unitPrice: l.unitPrice, amount: l.amount })) : [],
    discount: bill ? round2(bill.discountAmount) : 0,
    subtotal: bill ? round2(bill.subtotal) : null,
    taxLabel: bill ? taxLabel(bill.taxRate) : null,
    tax: bill ? round2(bill.taxAmount) : null,
    // What was actually charged: the patient's payment plus the panel's share.
    total: round2(src.paidAmount + src.panelClaimed),
    paidByPatient: round2(src.paidAmount),
    panelClaimed: round2(src.panelClaimed),
    panelName: text(src.panelName) || null,
    glNumber: text(src.glNumber) || null,
    paymentMethod: src.paymentMethod,
    paymentReference: text(src.paymentReference) || null,
  };
}
