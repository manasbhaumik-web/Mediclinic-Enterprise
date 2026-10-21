import { describe, expect, it } from 'vitest';
import { BillInput, calculateBill } from './billing';

const base = (over: Partial<BillInput> = {}): BillInput => ({
  consultationFee: 50,
  procedureFee: 0,
  prescription: [],
  customItems: [],
  discount: { type: 'fixed', value: 0 },
  taxRate: 0,
  ...over,
});

describe('calculateBill', () => {
  it('adds fees, medication and custom items', () => {
    const b = calculateBill(base({
      procedureFee: 20,
      prescription: [{ pricePerUnit: 2.5, quantity: 4 }, { pricePerUnit: 10, quantity: 1 }],
      customItems: [{ amount: 5 }],
    }));
    expect(b.medicationCost).toBe(20);
    expect(b.customItemsTotal).toBe(5);
    expect(b.subtotal).toBe(95);
    expect(b.grandTotal).toBe(95);
    expect(b.patientCopay).toBe(95);
    expect(b.panelPaid).toBe(0);
  });

  it('applies SST on the discounted subtotal', () => {
    const b = calculateBill(base({ consultationFee: 100, discount: { type: 'fixed', value: 20 }, taxRate: 0.06 }));
    expect(b.subtotal).toBe(80);
    expect(b.sstTax).toBeCloseTo(4.8);
    expect(b.grandTotal).toBeCloseTo(84.8);
  });

  it('supports percentage discounts', () => {
    const b = calculateBill(base({ consultationFee: 200, discount: { type: 'percentage', value: 25 } }));
    expect(b.discountAmount).toBe(50);
    expect(b.subtotal).toBe(150);
  });

  it('never lets a discount drive the bill below zero', () => {
    const b = calculateBill(base({ discount: { type: 'fixed', value: 500 }, taxRate: 0.06 }));
    expect(b.subtotal).toBe(0);
    expect(b.grandTotal).toBe(0);
  });

  describe('panel claims', () => {
    it('panel pays everything when the bill is within the coverage limit', () => {
      const b = calculateBill(base({ panel: { name: 'P', coverageLimit: 100, coPayRequired: false } }));
      expect(b.panelPaid).toBe(50);
      expect(b.patientCopay).toBe(0);
    });

    it('patient pays the excess above the coverage limit', () => {
      const b = calculateBill(base({ consultationFee: 150, panel: { name: 'P', coverageLimit: 100, coPayRequired: false } }));
      expect(b.panelPaid).toBe(100);
      expect(b.patientCopay).toBe(50);
    });

    it('moves the co-pay percentage from the panel to the patient', () => {
      const b = calculateBill(base({ consultationFee: 100, panel: { name: 'P', coverageLimit: 1000, coPayRequired: true, coPayPercentage: 10 } }));
      expect(b.patientCopay).toBe(10);
      expect(b.panelPaid).toBe(90);
    });

    it('panel and patient shares always add up to the grand total', () => {
      for (const consultationFee of [10, 99.99, 100, 250]) {
        const b = calculateBill(base({
          consultationFee, taxRate: 0.06,
          panel: { name: 'P', coverageLimit: 100, coPayRequired: true, coPayPercentage: 20 },
        }));
        expect(b.panelPaid + b.patientCopay).toBeCloseTo(b.grandTotal);
      }
    });

    it('ignores panel terms when no panel is passed (self-pay)', () => {
      const b = calculateBill(base({ panel: null }));
      expect(b.panelPaid).toBe(0);
      expect(b.patientCopay).toBe(b.grandTotal);
    });
  });
});
