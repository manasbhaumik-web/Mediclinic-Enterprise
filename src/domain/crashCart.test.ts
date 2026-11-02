import { describe, it, expect } from 'vitest';
import { 
  evaluateCrashCartReadiness, 
  createCrashCartInspectionRecord, 
  exportCrashCartLogText,
  MANDATORY_CRASH_CART_DRUGS 
} from './crashCart';

describe('Emergency Crash Cart Readiness (PHFSA 1998 Part V) Domain', () => {
  const validDrugs = [
    { name: 'Adrenaline (Epinephrine) 1:1000 (1mg/ml)', availableQty: 5, expiryDate: '2027-12-31' },
    { name: 'Atropine Sulphate 0.5mg/ml', availableQty: 5, expiryDate: '2027-12-31' },
    { name: 'Hydrocortisone Sodium Succinate 100mg', availableQty: 2, expiryDate: '2027-12-31' },
    { name: 'Dextrose 50% 50ml Vial', availableQty: 2, expiryDate: '2027-12-31' },
    { name: 'Salbutamol 5mg/2.5ml Respirator Solution', availableQty: 5, expiryDate: '2027-12-31' },
    { name: 'Normal Saline 0.9% 500ml Infusion Bottle', availableQty: 2, expiryDate: '2027-12-31' }
  ];

  it('validates a 100% compliant and ready crash cart', () => {
    const fixedNow = new Date('2026-06-01');
    const result = evaluateCrashCartReadiness({
      oxygenPsi: 1800,
      isSealIntact: true,
      ambuBagAdultTested: true,
      ambuBagPediatricTested: true,
      suctionMachineVacuumTested: true,
      aedPowerOnTested: true,
      aedBatteryOk: true,
      aedAdultPadsExpiry: '2027-10-31',
      aedPediatricPadsExpiry: '2027-10-31',
      drugs: validDrugs,
      currentDate: fixedNow
    });

    expect(result.isFullyReady).toBe(true);
    expect(result.criticalDefects).toHaveLength(0);
    expect(result.isOxygenCompliant).toBe(true);
  });

  it('flags critical defect when oxygen cylinder pressure is below 1000 PSI', () => {
    const fixedNow = new Date('2026-06-01');
    const result = evaluateCrashCartReadiness({
      oxygenPsi: 650, // Depleted cylinder
      isSealIntact: true,
      ambuBagAdultTested: true,
      ambuBagPediatricTested: true,
      suctionMachineVacuumTested: true,
      aedPowerOnTested: true,
      aedBatteryOk: true,
      aedAdultPadsExpiry: '2027-10-31',
      aedPediatricPadsExpiry: '2027-10-31',
      drugs: validDrugs,
      currentDate: fixedNow
    });

    expect(result.isFullyReady).toBe(false);
    expect(result.isOxygenCompliant).toBe(false);
    expect(result.criticalDefects.some(d => d.includes('Oxygen cylinder pressure critical'))).toBe(true);
  });

  it('flags expired Adrenaline ampoules or missing resuscitation medications', () => {
    const fixedNow = new Date('2026-06-01');
    const defectiveDrugs = [
      { name: 'Adrenaline (Epinephrine) 1:1000 (1mg/ml)', availableQty: 5, expiryDate: '2026-01-01' }, // Expired!
      { name: 'Atropine Sulphate 0.5mg/ml', availableQty: 1, expiryDate: '2027-12-31' }, // Deficient (only 1 instead of 5)!
      // Missing other mandatory drugs
    ];

    const result = evaluateCrashCartReadiness({
      oxygenPsi: 1500,
      isSealIntact: true,
      ambuBagAdultTested: true,
      ambuBagPediatricTested: true,
      suctionMachineVacuumTested: true,
      aedPowerOnTested: true,
      aedBatteryOk: true,
      aedAdultPadsExpiry: '2027-10-31',
      aedPediatricPadsExpiry: '2027-10-31',
      drugs: defectiveDrugs,
      currentDate: fixedNow
    });

    expect(result.isFullyReady).toBe(false);
    expect(result.criticalDefects.some(d => d.includes('Expired emergency drug: Adrenaline'))).toBe(true);
    expect(result.criticalDefects.some(d => d.includes('deficient drug: Atropine'))).toBe(true);
  });

  it('creates complete inspection log and exports statutory text report', () => {
    const record = createCrashCartInspectionRecord({
      shift: 'Morning (08:00)',
      inspectorNurse: 'Staff Nurse Siti (SRN-4921)',
      tamperSealNumber: 'SEAL-2026-8812',
      isSealIntact: true,
      oxygenPsi: 1900,
      ambuBagAdultTested: true,
      ambuBagPediatricTested: true,
      suctionMachineVacuumTested: true,
      aedPowerOnTested: true,
      aedBatteryOk: true,
      aedAdultPadsExpiry: '2027-10-31',
      aedPediatricPadsExpiry: '2027-10-31',
      drugs: validDrugs
    });

    expect(record.id).toMatch(/^CART-/);
    expect(record.isFullyReady).toBe(true);

    const exported = exportCrashCartLogText(record);
    expect(exported).toContain('DAILY EMERGENCY CRASH CART AUDIT');
    expect(exported).toContain('PHFSA 1998 PART V REGULATION');
    expect(exported).toContain('1900 PSI');
    expect(exported).toContain('SEAL-2026-8812');
  });
});
