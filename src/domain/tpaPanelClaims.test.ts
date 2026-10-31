import { describe, it, expect } from 'vitest';
import { 
  calculateTPAClaimSplit, 
  isItemNonClaimable, 
  KNOWN_TPA_PROVIDERS, 
  BillItem 
} from './tpaPanelClaims';

describe('Corporate TPA Panel Claim Split & Outpatient Excess Domain', () => {
  const micare = KNOWN_TPA_PROVIDERS.find(p => p.id === 'micare')!;
  const healthmetrics = KNOWN_TPA_PROVIDERS.find(p => p.id === 'healthmetrics')!;

  const standardItems: BillItem[] = [
    { id: '1', name: 'Standard GP Consultation', category: 'Consultation', price: 35.00 },
    { id: '2', name: 'Paracetamol 500mg Tablet', category: 'Medication', price: 10.00 },
    { id: '3', name: 'Amoxicillin 500mg Capsule', category: 'Medication', price: 15.00 }
  ];

  it('correctly splits claimable bill within TPA limit with fixed co-pay (MiCare RM 5 co-pay)', () => {
    // Total bill = RM 60, Cap = RM 65, Copay = RM 5 fixed
    const result = calculateTPAClaimSplit(standardItems, micare);

    expect(result.totalBill).toBe(60.00);
    expect(result.claimableTotal).toBe(60.00);
    expect(result.nonClaimableTotal).toBe(0.00);
    expect(result.patientCopay).toBe(5.00);
    expect(result.panelPayable).toBe(55.00); // 60 - 5
    expect(result.patientTotalDue).toBe(5.00);
    expect(result.excessOverCap).toBe(0.00);
  });

  it('correctly detects non-claimable items (e.g. Vitamin C / Cosmetic Cream)', () => {
    expect(isItemNonClaimable('Vitamin C 1000mg Effervescent', micare)).toBe(true);
    expect(isItemNonClaimable('Herbal Energy Tonic Supplement', micare)).toBe(true);
    expect(isItemNonClaimable('Amoxicillin 500mg', micare)).toBe(false);
  });

  it('allocates excess over cap and non-claimables directly to patient cash excess', () => {
    const itemsWithExcessAndNonClaimable: BillItem[] = [
      { id: '1', name: 'Standard GP Consultation', category: 'Consultation', price: 40.00 },
      { id: '2', name: 'Augmentin 625mg', category: 'Medication', price: 45.00 },
      { id: '3', name: 'Vitamin C Complex Lozenges', category: 'Medication', price: 25.00 } // Non-claimable
    ];

    // Total Bill = 110.00 (Claimable: 85, Non-claimable: 25)
    // MiCare Cap = 65, Copay = 5
    // Claimable after copay = 80. Cap = 65. Excess over cap = 15.
    // Panel pays = 65.
    // Patient pays = 25 (non-claimable) + 5 (copay) + 15 (excess) = 45.00.
    const result = calculateTPAClaimSplit(itemsWithExcessAndNonClaimable, micare);

    expect(result.totalBill).toBe(110.00);
    expect(result.claimableTotal).toBe(85.00);
    expect(result.nonClaimableTotal).toBe(25.00);
    expect(result.patientCopay).toBe(5.00);
    expect(result.excessOverCap).toBe(15.00);
    expect(result.panelPayable).toBe(65.00);
    expect(result.patientTotalDue).toBe(45.00);
    expect(result.panelPayable + result.patientTotalDue).toBe(110.00);
  });

  it('correctly handles percentage copay (HealthMetrics 10%)', () => {
    // Total Bill = 60.00, Copay = 10% = 6.00, Cap = 75.00
    // Panel pays = 54.00, Patient pays = 6.00
    const result = calculateTPAClaimSplit(standardItems, healthmetrics);

    expect(result.totalBill).toBe(60.00);
    expect(result.patientCopay).toBe(6.00);
    expect(result.panelPayable).toBe(54.00);
    expect(result.patientTotalDue).toBe(6.00);
  });
});
