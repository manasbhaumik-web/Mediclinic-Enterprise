import { describe, it, expect } from 'vitest';
import { 
  calculateTPAClaimSplit, 
  isItemNonClaimable, 
  verifyTPAPolicyEligibility,
  createTPAClaimRecord,
  reconcileTPARemittance,
  exportTPAClaimsCSV,
  exportTPAClaimsJSON,
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

  it('verifies real-time TPA policy eligibility and returns active GL number', () => {
    const check = verifyTPAPolicyEligibility({
      patientIc: '920315-14-5521',
      providerId: 'micare',
      employerName: 'Petronas Dagangan Bhd'
    });

    expect(check.isEligible).toBe(true);
    expect(check.glNumber).toMatch(/^GL-MICARE-/);
    expect(check.remainingAnnualLimitRM).toBeGreaterThan(800);
    expect(check.perVisitCapRM).toBe(65.00);
    expect(check.copayValue).toBe(5.00);
  });

  it('detects expired corporate policy and returns ineligible reason', () => {
    const check = verifyTPAPolicyEligibility({
      patientIc: '850101-10-0000',
      providerId: 'pmcare'
    });

    expect(check.isEligible).toBe(false);
    expect(check.ineligibleReason).toContain('Policy expired');
  });

  it('reconciles TPA remittance and flags short-paid items with line-item variance', () => {
    const claim = createTPAClaimRecord({
      visitId: 'VISIT-1',
      patientId: 'PT-1',
      patientName: 'Ahmad Razali',
      patientIc: '900101-14-5511',
      employerName: 'Petronas',
      providerId: 'micare',
      glNumber: 'GL-MICARE-2026-55110',
      items: standardItems
    });

    // Panel Billed RM 55. Remitted RM 50 (variance RM 5)
    const reconciled = reconcileTPARemittance(claim, 50.00, [
      { itemName: 'Standard GP Consultation', approvedAmount: 30.00, disputeReason: 'Cap consultation at contractual RM 30' }
    ]);

    expect(reconciled.status).toBe('Short-Paid');
    expect(reconciled.remittedAmountRM).toBe(50.00);
    expect(reconciled.varianceAmountRM).toBe(5.00);
    expect(reconciled.lineItems.find(l => l.name.includes('Consultation'))?.approvedAmountRM).toBe(30.00);
  });

  it('exports compliant e-Claim batch in CSV and JSON formats', () => {
    const claim = createTPAClaimRecord({
      visitId: 'VISIT-2',
      patientId: 'PT-2',
      patientName: 'Sarah Lim',
      patientIc: '950202-10-6622',
      employerName: 'Maxis',
      providerId: 'healthmetrics',
      glNumber: 'GL-HEALTHMETRICS-2026-66220',
      items: standardItems
    });

    const csv = exportTPAClaimsCSV([claim]);
    expect(csv).toContain('Claim_ID,GL_Reference,TPA_Provider');
    expect(csv).toContain('GL-HEALTHMETRICS');
    expect(csv).toContain('Sarah Lim');

    const json = exportTPAClaimsJSON([claim]);
    expect(json).toContain('batchClaims');
    expect(json).toContain('GL-HEALTHMETRICS');
  });
});
