import { describe, it, expect } from 'vitest';
import {
  evaluateTLDReading,
  calculateRejectRate,
  isLeadApronOverdue,
  evaluateLicenceRenewalStatus,
  DEFAULT_RADIATION_APPARATUS,
  DEFAULT_TLD_READINGS,
  DEFAULT_LEAD_APRONS,
  XRayExposureRecord,
} from './radiationSafety';

describe('radiationSafety domain', () => {
  describe('evaluateTLDReading', () => {
    it('returns normal status for low occupational quarterly doses (< 1.0 mSv)', () => {
      const res = evaluateTLDReading(0.25, 0.75);
      expect(res.status).toBe('normal');
      expect(res.message).toContain('Normal occupational dose');
    });

    it('triggers investigation_required when a single quarter dose reaches or exceeds 1.0 mSv', () => {
      const res = evaluateTLDReading(1.15, 3.2);
      expect(res.status).toBe('investigation_required');
      expect(res.message).toContain('INVESTIGATION REQUIRED');
      expect(res.message).toContain('Radiation Protection Officer');
    });

    it('triggers limit_exceeded when annual cumulative dose reaches or exceeds legal limit (20.0 mSv/year)', () => {
      const res = evaluateTLDReading(0.8, 20.4);
      expect(res.status).toBe('limit_exceeded');
      expect(res.message).toContain('CRITICAL STATUTORY BREACH');
      expect(res.message).toContain('20 mSv/year (Act 304)');
    });
  });

  describe('calculateRejectRate', () => {
    it('handles zero exposures gracefully', () => {
      const res = calculateRejectRate([]);
      expect(res.totalExposures).toBe(0);
      expect(res.rejectRatePercent).toBe(0);
      expect(res.isWithinBenchmark).toBe(true);
    });

    it('calculates reject rate percentage and verifies compliance against <5% benchmark', () => {
      const mockExposures: XRayExposureRecord[] = Array.from({ length: 25 }, (_, idx) => ({
        id: `EXP-${idx}`,
        timestamp: '2026-11-01T08:00:00Z',
        patientId: `PT-${idx}`,
        patientName: `Patient ${idx}`,
        examination: 'Chest PA',
        kVp: 110,
        mAs: 4.5,
        isRejectRetake: idx === 0, // 1 retake out of 25 = 4.0%
        operatorStaffName: 'Radiographer Farhan',
      }));

      const res = calculateRejectRate(mockExposures);
      expect(res.totalExposures).toBe(25);
      expect(res.retakes).toBe(1);
      expect(res.rejectRatePercent).toBe(4.0);
      expect(res.isWithinBenchmark).toBe(true);
      expect(res.message).toContain('compliant with MOH benchmark');
    });

    it('flags high reject rate exceeding the 5.0% threshold', () => {
      const mockExposures: XRayExposureRecord[] = [
        { id: '1', timestamp: '', patientId: '', patientName: '', examination: '', kVp: 100, mAs: 2, isRejectRetake: true, operatorStaffName: '' },
        { id: '2', timestamp: '', patientId: '', patientName: '', examination: '', kVp: 100, mAs: 2, isRejectRetake: false, operatorStaffName: '' },
        { id: '3', timestamp: '', patientId: '', patientName: '', examination: '', kVp: 100, mAs: 2, isRejectRetake: false, operatorStaffName: '' },
        { id: '4', timestamp: '', patientId: '', patientName: '', examination: '', kVp: 100, mAs: 2, isRejectRetake: false, operatorStaffName: '' },
      ]; // 1 / 4 = 25.0%

      const res = calculateRejectRate(mockExposures);
      expect(res.rejectRatePercent).toBe(25.0);
      expect(res.isWithinBenchmark).toBe(false);
      expect(res.message).toContain('exceeds statutory benchmark');
    });
  });

  describe('isLeadApronOverdue', () => {
    it('detects when 6-monthly fluoroscopic crack inspection is overdue', () => {
      // Due 2026-10-10, reference date 2026-11-01 => overdue
      const isOverdue = isLeadApronOverdue('2026-10-10', '2026-11-01');
      expect(isOverdue).toBe(true);
    });

    it('returns false when inspection is still valid', () => {
      const isOverdue = isLeadApronOverdue('2026-12-15', '2026-11-01');
      expect(isOverdue).toBe(false);
    });
  });

  describe('evaluateLicenceRenewalStatus', () => {
    it('reports active status when more than 60 days remain', () => {
      const res = evaluateLicenceRenewalStatus('2027-08-31', '2026-11-01');
      expect(res.status).toBe('active');
      expect(res.daysRemaining).toBeGreaterThan(60);
    });

    it('flags expiring_soon when within 60 days of expiration', () => {
      const res = evaluateLicenceRenewalStatus('2026-12-15', '2026-11-01');
      expect(res.status).toBe('expiring_soon');
      expect(res.daysRemaining).toBeLessThanOrEqual(60);
      expect(res.message).toContain('RENEWAL DUE');
    });

    it('flags expired when past expiration date', () => {
      const res = evaluateLicenceRenewalStatus('2026-10-01', '2026-11-01');
      expect(res.status).toBe('expired');
      expect(res.daysRemaining).toBeLessThan(0);
      expect(res.message).toContain('EXPIRED');
    });
  });

  describe('DEFAULT constants', () => {
    it('provides apparatus with designated RPO credentials', () => {
      expect(DEFAULT_RADIATION_APPARATUS.length).toBeGreaterThanOrEqual(2);
      expect(DEFAULT_RADIATION_APPARATUS[0].rpoCertificateNo).toBeDefined();
      expect(DEFAULT_RADIATION_APPARATUS[0].licenceClassCNumber).toContain('KKM/CKSP');
    });

    it('contains TLD readings and lead aprons', () => {
      expect(DEFAULT_TLD_READINGS.length).toBeGreaterThanOrEqual(3);
      expect(DEFAULT_LEAD_APRONS.length).toBeGreaterThanOrEqual(4);
    });
  });
});
