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
  customItems: { amount: number }[];
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
