import { describe, it, expect } from 'vitest';
import {
  calculateShockIndex,
  validateSBARCompleteness,
  formatSBARVerbalSummary,
  INITIAL_SBAR_RECORDS,
  MALAYSIAN_TERTIARY_HOSPITALS,
  AMBULANCE_PROVIDERS,
  SBARTransferRecord,
} from './emergencyTransferSBAR';

describe('emergencyTransferSBAR domain', () => {
  describe('calculateShockIndex', () => {
    it('calculates normal shock index (< 0.7)', () => {
      const res = calculateShockIndex(72, 120);
      expect(res.shockIndex).toBe(0.6);
      expect(res.isElevated).toBe(false);
      expect(res.riskGrade).toBe('normal');
      expect(res.interpretation).toContain('Normal hemodynamics');
    });

    it('classifies mild borderline compensation (0.7 - 0.89)', () => {
      const res = calculateShockIndex(85, 100);
      expect(res.shockIndex).toBe(0.85);
      expect(res.isElevated).toBe(false);
      expect(res.riskGrade).toBe('mild');
    });

    it('flags elevated shock index (>= 0.9 to < 1.1) indicating occult shock', () => {
      const res = calculateShockIndex(105, 100);
      expect(res.shockIndex).toBe(1.05);
      expect(res.isElevated).toBe(true);
      expect(res.riskGrade).toBe('moderate');
      expect(res.interpretation).toContain('Elevated Shock Index');
    });

    it('flags severe hemodynamic collapse (>= 1.1)', () => {
      const res = calculateShockIndex(130, 85);
      expect(res.shockIndex).toBe(1.53);
      expect(res.isElevated).toBe(true);
      expect(res.riskGrade).toBe('severe');
      expect(res.interpretation).toContain('Severe Hemodynamic Shock');
    });

    it('handles zero or negative inputs safely', () => {
      const res = calculateShockIndex(0, 120);
      expect(res.shockIndex).toBe(0);
      expect(res.isElevated).toBe(false);
      expect(res.interpretation).toContain('Invalid or zero');
    });
  });

  describe('validateSBARCompleteness', () => {
    it('passes for complete standard record', () => {
      const sample = INITIAL_SBAR_RECORDS[0];
      const res = validateSBARCompleteness(sample);
      expect(res.isValid).toBe(true);
      expect(res.missingFields).toHaveLength(0);
    });

    it('identifies missing essential statutory clinical transfer fields', () => {
      const incomplete: Partial<SBARTransferRecord> = {
        patientName: 'Jane Doe',
        // missing patientIC, situation, assessment, recommendation
      };
      const res = validateSBARCompleteness(incomplete);
      expect(res.isValid).toBe(false);
      expect(res.missingFields).toContain('Patient IC / Passport');
      expect(res.missingFields).toContain('Situation: Chief Complaint');
      expect(res.missingFields).toContain('Situation: Provisional Acute Diagnosis');
      expect(res.missingFields).toContain('Assessment: At least one set of Vital Signs');
      expect(res.missingFields).toContain('Recommendation: Target Referral Hospital');
    });
  });

  describe('formatSBARVerbalSummary', () => {
    it('formats a structured phone/radio transfer handover script', () => {
      const sample = INITIAL_SBAR_RECORDS[0];
      const script = formatSBARVerbalSummary(sample);

      expect(script).toContain('[SBAR VERBAL HANDOVER - RED PRIORITY]');
      expect(script).toContain('SITUATION:');
      expect(script).toContain('Dr. Sarah Farhana');
      expect(script).toContain('Tan Sri Dato Ahmad Razif');
      expect(script).toContain('620815-10-5421');
      expect(script).toContain('BACKGROUND:');
      expect(script).toContain('Hypertension x 15y');
      expect(script).toContain('Allergies: Penicillin');
      expect(script).toContain('ASSESSMENT:');
      expect(script).toContain('Shock Index: 1.08');
      expect(script).toContain('RECOMMENDATION:');
      expect(script).toContain('Hospital Serdang');
      expect(script).toContain('MECC 999');
      expect(script).toContain('Aspirin (Dispersible) 300 mg');
    });
  });

  describe('Malaysian healthcare directory constants', () => {
    it('contains major public and private referral emergency centers', () => {
      expect(MALAYSIAN_TERTIARY_HOSPITALS.length).toBeGreaterThanOrEqual(10);
      expect(MALAYSIAN_TERTIARY_HOSPITALS.some((h) => h.includes('Hospital Kuala Lumpur'))).toBe(true);
      expect(MALAYSIAN_TERTIARY_HOSPITALS.some((h) => h.includes('Hospital Serdang'))).toBe(true);
      expect(MALAYSIAN_TERTIARY_HOSPITALS.some((h) => h.includes('Sunway Medical Centre'))).toBe(true);
    });

    it('contains national ambulance dispatch services', () => {
      expect(AMBULANCE_PROVIDERS).toContain('MECC 999 (Kementerian Kesihatan Malaysia)');
      expect(AMBULANCE_PROVIDERS.some((a) => a.includes('St. John Ambulance'))).toBe(true);
    });
  });
});
