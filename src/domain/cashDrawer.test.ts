import { describe, expect, it } from 'vitest';
import {
  calculateDenominationTotal,
  generateShiftReconciliation,
  DenominationBreakdown,
} from './cashDrawer';
import { Visit } from '../types';

describe('cashDrawer domain logic', () => {
  it('correctly calculates total currency from physical denomination breakdown', () => {
    const denoms: DenominationBreakdown = {
      rm100: 2,  // 200
      rm50: 4,   // 200
      rm20: 5,   // 100
      rm10: 10,  // 100
      rm5: 8,    // 40
      rm1: 15,   // 15
      sen50: 6,  // 3.00
      sen20: 10, // 2.00
      sen10: 5,  // 0.50
    };

    expect(calculateDenominationTotal(denoms)).toBe(660.50);
  });

  it('generates a balanced shift reconciliation report when drawer matches expected cash', () => {
    const visits: Visit[] = [
      {
        id: 'v1', patientId: 'p1', date: '2026-10-31', status: 'Paid',
        totalBill: 60, panelClaimed: 0, paidAmount: 60, paymentMethod: 'Cash',
        soap: {} as any,
      },
      {
        id: 'v2', patientId: 'p2', date: '2026-10-31', status: 'Paid',
        totalBill: 120, panelClaimed: 0, paidAmount: 120, paymentMethod: 'Credit Card',
        soap: {} as any,
      },
      {
        id: 'v3', patientId: 'p3', date: '2026-10-31', status: 'Paid',
        totalBill: 80, panelClaimed: 80, paidAmount: 0, paymentMethod: 'Panel',
        soap: {} as any,
      },
    ];

    const openingFloat = 200.00;
    // Expected cash: 200 (float) + 60 (cash) = 260.00
    const denominations: DenominationBreakdown = {
      rm100: 2,
      rm50: 1,
      rm20: 0,
      rm10: 1,
      rm5: 0,
      rm1: 0,
      sen50: 0,
      sen20: 0,
      sen10: 0,
    }; // Total: 260.00

    const report = generateShiftReconciliation(visits, openingFloat, denominations, 'Siti Nurhaliza');

    expect(report.status).toBe('Balanced');
    expect(report.variance).toBe(0);
    expect(report.totalCashCollected).toBe(60);
    expect(report.totalCardCollected).toBe(120);
    expect(report.totalPanelInvoiced).toBe(80);
    expect(report.totalRevenue).toBe(260);
    expect(report.expectedCashInDrawer).toBe(260);
    expect(report.actualCashCounted).toBe(260);
  });

  it('detects cash shortage when physical count is lower than expected', () => {
    const visits: Visit[] = [
      {
        id: 'v1', patientId: 'p1', date: '2026-10-31', status: 'Paid',
        totalBill: 100, panelClaimed: 0, paidAmount: 100, paymentMethod: 'Cash',
        soap: {} as any,
      },
    ];

    const openingFloat = 200.00; // Expected: 300.00
    const denominations: DenominationBreakdown = {
      rm100: 2,
      rm50: 1, // Counted: 250.00 (Short by 50)
      rm20: 0, rm10: 0, rm5: 0, rm1: 0, sen50: 0, sen20: 0, sen10: 0,
    };

    const report = generateShiftReconciliation(visits, openingFloat, denominations, 'Cashier 1', 'Counter 1', 'Short RM50 due to change discrepancy');

    expect(report.status).toBe('Shortage');
    expect(report.variance).toBe(-50.00);
    expect(report.explanation).toContain('change discrepancy');
  });
});
