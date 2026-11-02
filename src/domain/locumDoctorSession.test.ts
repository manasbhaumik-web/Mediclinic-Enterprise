import { describe, it, expect } from 'vitest';
import {
  validateLocumCredentials,
  calculateLocumShiftPayout,
  exportCKAPSLocumAttendanceLedger,
  DEFAULT_LOCUM_PROFILES,
  DEFAULT_LOCUM_SHIFTS,
  LocumDoctorProfile,
} from './locumDoctorSession';

describe('Locum Doctor MMC Session & Statutory Credential Governance Engine', () => {
  describe('validateLocumCredentials', () => {
    it('approves a compliant locum doctor with valid APC and active medical indemnity', () => {
      const profile = DEFAULT_LOCUM_PROFILES[0];
      const result = validateLocumCredentials(profile, '2026-11-01');
      expect(result.isValid).toBe(true);
      expect(result.status).toBe('active');
      expect(result.issues.length).toBe(0);
    });

    it('rejects a locum doctor with an expired APC year', () => {
      const expiredApcDoc: LocumDoctorProfile = {
        ...DEFAULT_LOCUM_PROFILES[0],
        apcYear: 2025,
      };
      const result = validateLocumCredentials(expiredApcDoc, '2026-11-01');
      expect(result.isValid).toBe(false);
      expect(result.status).toBe('expired_credentials');
      expect(result.issues.some((i) => i.includes('Annual Practising Certificate'))).toBe(true);
    });

    it('rejects a locum doctor with an expired medical indemnity policy', () => {
      const expiredIndemnityDoc: LocumDoctorProfile = {
        ...DEFAULT_LOCUM_PROFILES[0],
        indemnityExpiryDate: '2026-06-30',
      };
      const result = validateLocumCredentials(expiredIndemnityDoc, '2026-11-01');
      expect(result.isValid).toBe(false);
      expect(result.status).toBe('expired_credentials');
      expect(result.issues.some((i) => i.includes('Indemnity policy expired'))).toBe(true);
    });

    it('flags invalid MMC registration number format', () => {
      const invalidMmcDoc: LocumDoctorProfile = {
        ...DEFAULT_LOCUM_PROFILES[0],
        mmcNumber: '12345',
      };
      const result = validateLocumCredentials(invalidMmcDoc, '2026-11-01');
      expect(result.isValid).toBe(false);
      expect(result.issues.some((i) => i.includes('MMC'))).toBe(true);
    });
  });

  describe('calculateLocumShiftPayout', () => {
    it('calculates hourly base payout accurately', () => {
      const payout = calculateLocumShiftPayout(4, 55.0);
      expect(payout.basePayMyr).toBe(220.0);
      expect(payout.incentivePayMyr).toBe(0);
      expect(payout.totalPayoutMyr).toBe(220.0);
    });

    it('adds patient volume incentives when configured', () => {
      const payout = calculateLocumShiftPayout(5, 50.0, 15, 5.0);
      expect(payout.basePayMyr).toBe(250.0);
      expect(payout.incentivePayMyr).toBe(75.0);
      expect(payout.totalPayoutMyr).toBe(325.0);
    });

    it('handles fractional hours worked', () => {
      const payout = calculateLocumShiftPayout(3.5, 60.0);
      expect(payout.totalPayoutMyr).toBe(210.0);
    });
  });

  describe('exportCKAPSLocumAttendanceLedger', () => {
    it('formats a complete CSV attendance register matching MOH CKAPS inspection requirements', () => {
      const csv = exportCKAPSLocumAttendanceLedger(DEFAULT_LOCUM_SHIFTS, DEFAULT_LOCUM_PROFILES);
      expect(csv).toContain('Session ID,Locum Doctor Name,MMC Registration No,APC Year,Indemnity Provider & Policy');
      expect(csv).toContain('Dr. Farhan bin Razak');
      expect(csv).toContain('MMC-62180');
      expect(csv).toContain('220.00');
      expect(csv).toContain('PAID_PETTY_CASH');
    });
  });

  describe('Default Datasets', () => {
    it('has valid seed locum profiles', () => {
      expect(DEFAULT_LOCUM_PROFILES.length).toBeGreaterThan(0);
      expect(DEFAULT_LOCUM_PROFILES.every((p) => p.mmcNumber.startsWith('MMC-'))).toBe(true);
    });

    it('has historical shift logs', () => {
      expect(DEFAULT_LOCUM_SHIFTS.length).toBeGreaterThan(0);
      expect(DEFAULT_LOCUM_SHIFTS[0].totalPayoutMyr).toBeGreaterThan(0);
    });
  });
});
