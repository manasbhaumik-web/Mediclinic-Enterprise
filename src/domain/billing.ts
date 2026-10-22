/**
 * Invoice maths for the cashier desk, extracted from BillingDesk so it can be tested.
 * Amounts are MYR. `taxRate` is a fraction (0.06 for 6% SST), not a percentage.
 */
import { PrescriptionItem, TPAConfig } from '../types';

export interface Discount {
  type: 'fixed' | 'percentage';
  value: number;
}

export interface BillInput {
  consultationFee: number;
  procedureFee: number;
  prescription: Pick<PrescriptionItem, 'pricePerUnit' | 'quantity'>[];
  customItems: { amount: number; description?: string }[];
  discount: Discount;
  taxRate: number;
  /** Set only when the visit is claimed against a panel / TPA guarantee letter. */
  panel?: TPAConfig | null;
}

export interface BillBreakdown {
  medicationCost: number;
  customItemsTotal: number;
  discountAmount: number;
  subtotal: number;
  sstTax: number;
  grandTotal: number;
  panelPaid: number;
  patientCopay: number;
}

export const EMPTY_BREAKDOWN: BillBreakdown = {
  medicationCost: 0,
  customItemsTotal: 0,
  discountAmount: 0,
  subtotal: 0,
  sstTax: 0,
  grandTotal: 0,
  panelPaid: 0,
  patientCopay: 0,
};

export function calculateBill(input: BillInput): BillBreakdown {
  const medicationCost = input.prescription.reduce((sum, rx) => sum + rx.pricePerUnit * rx.quantity, 0);
  const customItemsTotal = input.customItems.reduce((sum, item) => sum + item.amount, 0);
  const preDiscount = input.consultationFee + input.procedureFee + medicationCost + customItemsTotal;

  const discountAmount = input.discount.type === 'fixed'
    ? input.discount.value
    : preDiscount * (input.discount.value / 100);

  // A discount can never push the invoice below zero.
  const subtotal = Math.max(0, preDiscount - discountAmount);
  const sstTax = subtotal * input.taxRate;
  const grandTotal = subtotal + sstTax;

  let panelPaid = 0;
  let patientCopay = grandTotal;

  const panel = input.panel;
  if (panel) {
    if (grandTotal <= panel.coverageLimit) {
      panelPaid = grandTotal;
      patientCopay = 0;
    } else {
      panelPaid = panel.coverageLimit;
      patientCopay = grandTotal - panel.coverageLimit;
    }

    if (panel.coPayRequired && panel.coPayPercentage) {
      const copay = (grandTotal * panel.coPayPercentage) / 100;
      patientCopay += copay;
      panelPaid -= copay;
    }
  }

  return { medicationCost, customItemsTotal, discountAmount, subtotal, sstTax, grandTotal, panelPaid, patientCopay };
}

/** What was billed, in the shape the e-invoice builder needs. Captured when the payment is settled. */
export interface InvoiceSnapshot {
  lines: { description: string; quantity: number; unitPrice: number; amount: number }[];
  discountAmount: number;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  grandTotal: number;
}

export function buildInvoiceSnapshot(
  input: BillInput & { prescription: Pick<PrescriptionItem, 'pricePerUnit' | 'quantity'>[] },
  breakdown: BillBreakdown,
  rxNames: string[] = [],
): InvoiceSnapshot {
  const lines: InvoiceSnapshot['lines'] = [];
  const add = (description: string, quantity: number, unitPrice: number) => {
    if (quantity * unitPrice > 0) lines.push({ description, quantity, unitPrice, amount: quantity * unitPrice });
  };

  add('Consultation fee', 1, input.consultationFee);
  add('Clinical procedures / nursing', 1, input.procedureFee);
  input.prescription.forEach((rx, i) => add(rxNames[i] || 'Medication', rx.quantity, rx.pricePerUnit));
  input.customItems.forEach((item, i) => add(item.description || `Additional charge ${i + 1}`, 1, item.amount));

  return {
    lines,
    discountAmount: breakdown.discountAmount,
    subtotal: breakdown.subtotal,
    taxRate: input.taxRate,
    taxAmount: breakdown.sstTax,
    grandTotal: breakdown.grandTotal,
  };
}

// ---- settlement ---------------------------------------------------------------------------------------------

/** Added to the procedure fee when the visit ends in a referral. */
export const REFERRAL_PROCEDURE_SURCHARGE = 25;

export const procedureFeeFor = (baseFee: number, requiresReferral?: boolean): number =>
  requiresReferral ? baseFee + REFERRAL_PROCEDURE_SURCHARGE : baseFee;

export const round2 = (n: number): number => Math.round((n + Number.EPSILON) * 100) / 100;

export type SettlementMethod = 'Cash' | 'Credit Card' | 'e-Wallet' | 'Panel';

export interface Settlement {
  paymentMethod: SettlementMethod;
  /** What the patient pays now (the whole bill, or their co-pay on a panel visit). */
  paidAmount: number;
  /** The panel's share, to be claimed later. */
  panelClaimed: number;
  glNumber?: string;
  /** Card payment intent id, or the e-wallet / bank reference. */
  reference?: string;
  /** The itemised bill as charged; kept with the payment so a receipt can be reprinted exactly. */
  bill?: InvoiceSnapshot;
  /** The panel the claim is against. */
  panelName?: string;
}

/** The outcome of recording a payment. */
export type SettleResult = { ok: true; receiptNo: string } | { ok: false; error: string };

/** The first reason this settlement would be refused, in the words shown to the cashier; null when it is fine. Mirrors billing_settle_visit. */
export function validateSettlement(s: Settlement): string | null {
  if (!Number.isFinite(s.paidAmount) || !Number.isFinite(s.panelClaimed) || s.paidAmount < 0 || s.panelClaimed < 0) return 'Amounts must be zero or more.';
  if (s.panelClaimed > 0 && !s.glNumber?.trim()) return 'Enter the guarantee letter (GL) reference for the panel claim.';
  if (s.paymentMethod === 'Panel' && s.panelClaimed <= 0) return 'A panel payment needs a claimed amount.';
  if ((s.paymentMethod === 'Credit Card' || s.paymentMethod === 'e-Wallet') && !s.reference?.trim()) return 'Enter the payment reference.';
  return null;
}

/** Arguments for the billing_settle_visit database function. Amounts are rounded to sen so the total always equals paid plus claimed. */
export function buildSettlementArgs(visitId: string, s: Settlement) {
  const paid = round2(s.paidAmount);
  const claimed = round2(s.panelClaimed);
  return {
    p_visit_id: visitId,
    p_payment_method: s.paymentMethod,
    p_paid_amount: paid,
    p_panel_claimed: claimed,
    p_total_bill: round2(paid + claimed),
    p_gl_number: claimed > 0 ? s.glNumber?.trim() ?? null : null,
    p_payment_reference: s.reference?.trim() || null,
    p_bill: s.bill ?? null,
    p_panel_name: claimed > 0 ? s.panelName?.trim() || null : null,
  };
}
