import { describe, it, expect } from 'vitest';
import {
  evaluateCKAPSReadiness,
  generateCKAPSDossierMarkdown,
  DEFAULT_FACILITY_PROFILE,
} from './ckapsDossier';

describe('CKAPS Biennial Form B Inspection Dossier & Statutory Facility Readiness Engine', () => {
  describe('evaluateCKAPSReadiness', () => {
    it('evaluates fully compliant facility with 100% Grade A inspection readiness', () => {
      const dossier = evaluateCKAPSReadiness();
      expect(dossier.overallScore).toBe(100);
      expect(dossier.grade).toBe('Grade A (Inspection Ready)');
      expect(dossier.isInspectionReady).toBe(true);
      expect(dossier.criticalDefects.length).toBe(0);
      expect(dossier.pillars.length).toBe(8);
      expect(dossier.recommendations.length).toBeGreaterThan(0);
    });

    it('flags critical defect and revokes Grade A if Person In-Charge lacks active APC', () => {
      const dossier = evaluateCKAPSReadiness({ hasActiveApc: false });
      expect(dossier.overallScore).toBeLessThan(90);
      expect(dossier.grade).not.toBe('Grade A (Inspection Ready)');
      expect(dossier.isInspectionReady).toBe(false);
      expect(dossier.criticalDefects).toContain('PIC Annual Practising Certificate (APC) expired or missing.');
    });

    it('flags critical defect if crash cart daily check is overdue or oxygen is depleted', () => {
      const dossier = evaluateCKAPSReadiness({ isCrashCartVerifiedDaily: false });
      expect(dossier.isInspectionReady).toBe(false);
      expect(dossier.criticalDefects.some((d) => d.includes('Crash cart'))).toBe(true);
    });

    it('flags critical defect if vaccine cold chain has unaddressed excursion', () => {
      const dossier = evaluateCKAPSReadiness({ isColdChainCompliant: false });
      expect(dossier.isInspectionReady).toBe(false);
      expect(dossier.criticalDefects.some((d) => d.includes('Cold chain'))).toBe(true);
    });

    it('flags critical defect if Dangerous Drugs Act perpetual register count has discrepancy', () => {
      const dossier = evaluateCKAPSReadiness({ isDdaSafeBalanced: false });
      expect(dossier.isInspectionReady).toBe(false);
      expect(dossier.criticalDefects.some((d) => d.includes('Dangerous Drugs Act'))).toBe(true);
    });

    it('flags critical defect if Atomic Energy Radiation Licence is expired', () => {
      const dossier = evaluateCKAPSReadiness({ isRadiationLicenceActive: false });
      expect(dossier.isInspectionReady).toBe(false);
      expect(dossier.criticalDefects.some((d) => d.includes('Atomic Energy'))).toBe(true);
    });
  });

  describe('generateCKAPSDossierMarkdown', () => {
    it('generates complete statutory markdown dossier ready for MOH inspection pack', () => {
      const dossier = evaluateCKAPSReadiness();
      const markdown = generateCKAPSDossierMarkdown(dossier);

      expect(markdown).toContain('MINISTRY OF HEALTH MALAYSIA (KEMENTERIAN KESIHATAN MALAYSIA)');
      expect(markdown).toContain('CAWANGAN KAWALAN AMALAN PERUBATAN SWASTA (CKAPS)');
      expect(markdown).toContain(DEFAULT_FACILITY_PROFILE.facilityName);
      expect(markdown).toContain(DEFAULT_FACILITY_PROFILE.ckapsRegistrationNo);
      expect(markdown).toContain(DEFAULT_FACILITY_PROFILE.personInChargeName);
      expect(markdown).toContain(DEFAULT_FACILITY_PROFILE.personInChargeMmcNo);
      expect(markdown).toContain('STATUTORY DECLARATION BY PERSON IN-CHARGE (PIC)');
      expect(markdown).toContain('Signature of Person In-Charge');
    });
  });

  describe('DEFAULT_FACILITY_PROFILE', () => {
    it('contains comprehensive clinic operational metadata', () => {
      expect(DEFAULT_FACILITY_PROFILE.facilityName).toBeTruthy();
      expect(DEFAULT_FACILITY_PROFILE.ckapsRegistrationNo).toBeTruthy();
      expect(DEFAULT_FACILITY_PROFILE.personInChargeMmcNo).toContain('MMC-');
      expect(DEFAULT_FACILITY_PROFILE.personInChargeApcYear).toBeGreaterThanOrEqual(2026);
    });
  });
});
