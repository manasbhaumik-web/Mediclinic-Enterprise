import { describe, it, expect } from 'vitest';
import {
  calculateRunningBalance,
  validateDualAuthorization,
  evaluatePhysicalDiscrepancy,
  exportDDALedgerCsv,
  DEFAULT_DDA_DRUGS,
  INITIAL_DDA_TRANSACTIONS,
} from './dangerousDrugsDDA';

describe('dangerousDrugsDDA domain', () => {
  describe('calculateRunningBalance', () => {
    it('correctly increments running balance for inward supplier stock', () => {
      const res = calculateRunningBalance(20, 'INWARD_PURCHASE', 10, 0, 0);
      expect(res.isValid).toBe(true);
      expect(res.newBalance).toBe(30);
    });

    it('correctly decrements running balance for outward patient administration including wastage', () => {
      // e.g. 1 ampoule given, 1 ampoule partial wastage discarded = 2 ampoules deducted from safe
      const res = calculateRunningBalance(25, 'OUTWARD_PATIENT', 0, 1, 1);
      expect(res.isValid).toBe(true);
      expect(res.newBalance).toBe(23);
    });

    it('prevents illegal negative safe balances when requested quantity exceeds available stock', () => {
      const res = calculateRunningBalance(5, 'OUTWARD_PATIENT', 0, 6, 0);
      expect(res.isValid).toBe(false);
      expect(res.error).toContain('Insufficient safe stock');
      expect(res.newBalance).toBe(5);
    });

    it('prevents negative quantities from being entered', () => {
      const res = calculateRunningBalance(10, 'INWARD_PURCHASE', -5, 0, 0);
      expect(res.isValid).toBe(false);
      expect(res.error).toContain('Quantities cannot be negative');
    });

    it('correctly updates balance on physical adjustment reconciliation', () => {
      const res = calculateRunningBalance(25, 'PHYSICAL_ADJUSTMENT', 24, 0, 0);
      expect(res.isValid).toBe(true);
      expect(res.newBalance).toBe(24);
    });
  });

  describe('validateDualAuthorization', () => {
    it('passes when Doctor MMC and Pharmacist custodian are both verified', () => {
      const res = validateDualAuthorization({
        doctorName: 'Dr. Sarah Farhana',
        doctorMMC: 'MMC-58291',
        custodianName: 'Pharm. Ahmad Razak',
        dualWitnessName: 'Staff Nurse Aisyah',
      });
      expect(res.isValid).toBe(true);
    });

    it('fails if Doctor name or MMC number is missing (DDA 1952 § 12 violation)', () => {
      const res = validateDualAuthorization({
        doctorName: '',
        doctorMMC: '',
        custodianName: 'Pharm. Ahmad Razak',
      });
      expect(res.isValid).toBe(false);
      expect(res.error).toContain('Doctor authorization invalid');
    });

    it('fails if dispensing custodian is missing', () => {
      const res = validateDualAuthorization({
        doctorName: 'Dr. Sarah Farhana',
        doctorMMC: 'MMC-58291',
        custodianName: '',
      });
      expect(res.isValid).toBe(false);
      expect(res.error).toContain('Dispensing pharmacist / custodian signature required');
    });
  });

  describe('evaluatePhysicalDiscrepancy', () => {
    it('reports exact match as compliant', () => {
      const res = evaluatePhysicalDiscrepancy(25, 25);
      expect(res.isDiscrepancy).toBe(false);
      expect(res.discrepancy).toBe(0);
      expect(res.severity).toBe('ok');
    });

    it('triggers critical statutory loss alert when physical count is lower than ledger', () => {
      // 25 theoretical, only 23 physically in the safe => 2 missing
      const res = evaluatePhysicalDiscrepancy(25, 23);
      expect(res.isDiscrepancy).toBe(true);
      expect(res.discrepancy).toBe(-2);
      expect(res.severity).toBe('statutory_alert');
      expect(res.message).toContain('CRITICAL STATUTORY LOSS ALERT');
      expect(res.message).toContain('MOH Pharmacy Enforcement Division');
    });

    it('flags surplus stock as minor alert', () => {
      const res = evaluatePhysicalDiscrepancy(25, 26);
      expect(res.isDiscrepancy).toBe(true);
      expect(res.discrepancy).toBe(1);
      expect(res.severity).toBe('minor');
      expect(res.message).toContain('Surplus stock detected');
    });
  });

  describe('exportDDALedgerCsv', () => {
    it('generates compliant MOH inspection CSV format', () => {
      const csv = exportDDALedgerCsv(INITIAL_DDA_TRANSACTIONS);
      expect(csv).toContain('Transaction ID,Date Time,Drug Name,Type');
      expect(csv).toContain('Morphine Sulfate 10mg/1mL Injection');
      expect(csv).toContain('Pethidine Hydrochloride 50mg/1mL Injection');
      expect(csv).toContain('MMC-58291');
      expect(csv).toContain('BAT-MOR-2026A');
    });
  });

  describe('DEFAULT_DDA_DRUGS', () => {
    it('includes essential controlled and dangerous drugs', () => {
      const names = DEFAULT_DDA_DRUGS.map((d) => d.genericName);
      expect(names).toContain('Morphine Sulfate');
      expect(names).toContain('Pethidine HCl');
      expect(names).toContain('Fentanyl Citrate');
      expect(names).toContain('Ketamine Hydrochloride');
      expect(names).toContain('Midazolam');
    });
  });
});
