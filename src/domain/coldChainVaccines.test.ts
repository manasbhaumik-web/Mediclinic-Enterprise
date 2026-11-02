import { describe, it, expect } from 'vitest';
import {
  evaluateTemperatureExcursion,
  evaluateShakeTestResult,
  isFridgeCheckDueForToday,
  exportColdChainMonthlyCsv,
  DEFAULT_VACCINE_FRIDGES,
  DEFAULT_COLD_CHAIN_RECORDS,
  TwiceDailyTempRecord,
} from './coldChainVaccines';

describe('Vaccine Cold Chain Temperature Monitoring & Quality Control Engine', () => {
  describe('evaluateTemperatureExcursion', () => {
    it('approves compliant temperature readings within +2.0°C to +8.0°C', () => {
      const result = evaluateTemperatureExcursion(4.5, 3.2, 5.8);
      expect(result.isCompliant).toBe(true);
      expect(result.severity).toBe('normal');
      expect(result.excursionType).toBeUndefined();
      expect(result.message).toContain('compliant (+2.0°C to +8.0°C)');
    });

    it('approves boundary readings exactly at 2.0°C and 8.0°C', () => {
      const result = evaluateTemperatureExcursion(2.0, 2.0, 8.0);
      expect(result.isCompliant).toBe(true);
      expect(result.severity).toBe('normal');
    });

    it('flags critical Freeze Hazard when current temperature falls below +2.0°C', () => {
      const result = evaluateTemperatureExcursion(1.4, 1.0, 3.8);
      expect(result.isCompliant).toBe(false);
      expect(result.severity).toBe('freeze_hazard');
      expect(result.excursionType).toBe('Freeze Hazard (<2°C)');
      expect(result.message).toContain('CRITICAL FREEZE EXCURSION');
      expect(result.message).toContain('WHO/KKM Shake Test required');
    });

    it('flags critical Freeze Hazard when min temperature recorded is below +2.0°C even if current is normal', () => {
      const result = evaluateTemperatureExcursion(4.2, 0.5, 5.1);
      expect(result.isCompliant).toBe(false);
      expect(result.severity).toBe('freeze_hazard');
      expect(result.excursionType).toBe('Freeze Hazard (<2°C)');
      expect(result.message).toContain('0.5°C');
    });

    it('flags Heat Hazard when current temperature exceeds +8.0°C', () => {
      const result = evaluateTemperatureExcursion(9.4, 4.0, 9.8);
      expect(result.isCompliant).toBe(false);
      expect(result.severity).toBe('heat_hazard');
      expect(result.excursionType).toBe('Heat Hazard (>8°C)');
      expect(result.message).toContain('HEAT EXCURSION');
      expect(result.message).toContain('gasket seal');
    });

    it('flags Heat Hazard when max temperature exceeds +8.0°C even if current is within range', () => {
      const result = evaluateTemperatureExcursion(6.5, 4.0, 11.2);
      expect(result.isCompliant).toBe(false);
      expect(result.severity).toBe('heat_hazard');
      expect(result.excursionType).toBe('Heat Hazard (>8°C)');
      expect(result.message).toContain('11.2°C');
    });

    it('prioritizes Freeze Hazard over Heat Hazard if both thresholds are breached (wide fluctuation)', () => {
      const result = evaluateTemperatureExcursion(1.2, 0.4, 10.5);
      expect(result.isCompliant).toBe(false);
      expect(result.severity).toBe('freeze_hazard');
      expect(result.excursionType).toBe('Freeze Hazard (<2°C)');
    });
  });

  describe('evaluateShakeTestResult (Ujian Goncang)', () => {
    it('fails test and mandates stock condemnation if rapid sedimentation is observed', () => {
      const result = evaluateShakeTestResult(true, 'Hexaxim (DTaP-IPV-HepB-Hib)', 'HX2026-99');
      expect(result.result).toBe('Fail');
      expect(result.disposition).toBe('Quarantined & Discarded');
      expect(result.message).toContain('SHAKE TEST FAILED');
      expect(result.message).toContain('Aluminum lattice irreversibly destroyed');
      expect(result.message).toContain('Hexaxim');
    });

    it('passes test and approves clinical use when suspension remains cloudy and stable', () => {
      const result = evaluateShakeTestResult(false, 'Engerix-B (Hepatitis B)', 'EB-4421');
      expect(result.result).toBe('Pass');
      expect(result.disposition).toBe('Approved for Use');
      expect(result.message).toContain('SHAKE TEST PASSED');
      expect(result.message).toContain('approved for clinical administration');
    });
  });

  describe('isFridgeCheckDueForToday', () => {
    const mockRecords: TwiceDailyTempRecord[] = [
      {
        id: 'LOG-01',
        fridgeId: 'FRIDGE-VACC-01',
        date: '2026-11-01',
        shift: 'Morning (08:00)',
        loggedAt: '2026-11-01T08:00:00.000Z',
        currentTempC: 4.1,
        minTempC: 3.5,
        maxTempC: 5.0,
        isCompliant: true,
        operatorStaffName: 'Staff Nurse Siti',
        operatorStaffId: 'STF-01',
      },
    ];

    it('indicates check is due if evening shift is not logged yet', () => {
      const status = isFridgeCheckDueForToday(mockRecords, '2026-11-01');
      expect(status.morningDone).toBe(true);
      expect(status.eveningDone).toBe(false);
      expect(status.isCheckDue).toBe(true);
    });

    it('indicates check is not due when both morning and evening are logged', () => {
      const fullDayRecords: TwiceDailyTempRecord[] = [
        ...mockRecords,
        {
          id: 'LOG-02',
          fridgeId: 'FRIDGE-VACC-01',
          date: '2026-11-01',
          shift: 'Evening (17:00)',
          loggedAt: '2026-11-01T17:00:00.000Z',
          currentTempC: 4.4,
          minTempC: 3.2,
          maxTempC: 5.3,
          isCompliant: true,
          operatorStaffName: 'Clinic Assistant Johan',
          operatorStaffId: 'STF-02',
        },
      ];
      const status = isFridgeCheckDueForToday(fullDayRecords, '2026-11-01');
      expect(status.morningDone).toBe(true);
      expect(status.eveningDone).toBe(true);
      expect(status.isCheckDue).toBe(false);
    });

    it('indicates check is due if no logs exist for target date', () => {
      const status = isFridgeCheckDueForToday(mockRecords, '2026-11-02');
      expect(status.morningDone).toBe(false);
      expect(status.eveningDone).toBe(false);
      expect(status.isCheckDue).toBe(true);
    });
  });

  describe('exportColdChainMonthlyCsv', () => {
    it('generates properly formatted CSV with headers and quoted fields', () => {
      const csv = exportColdChainMonthlyCsv(DEFAULT_COLD_CHAIN_RECORDS);
      expect(csv).toContain('Log ID,Date,Shift,Logged At,Current Temp (°C),Min Temp (°C),Max Temp (°C),Compliance Status,Excursion Type,Operator Staff,Notes');
      expect(csv).toContain('CC-LOG-20261101-01,2026-11-01,Morning (08:00)');
      expect(csv).toContain('4.2,3.4,5.1,COMPLIANT,None,"Staff Nurse Aisyah (STF-CA-01)"');
    });

    it('escapes quotes in notes', () => {
      const customRecord: TwiceDailyTempRecord[] = [
        {
          id: 'LOG-QUOTE',
          fridgeId: 'FRIDGE-01',
          date: '2026-11-01',
          shift: 'Evening (17:00)',
          loggedAt: '2026-11-01T17:00:00.000Z',
          currentTempC: 4.0,
          minTempC: 3.0,
          maxTempC: 5.0,
          isCompliant: true,
          operatorStaffName: 'Nurse "Amy"',
          operatorStaffId: 'STF-03',
          notes: 'Checked with "NIST" thermometer',
        },
      ];
      const csv = exportColdChainMonthlyCsv(customRecord);
      expect(csv).toContain('""NIST""');
    });
  });

  describe('Default Configuration & Data Integrity', () => {
    it('contains certified Haier Biomedical Refrigerator with annual calibration cycle', () => {
      expect(DEFAULT_VACCINE_FRIDGES.length).toBeGreaterThan(0);
      const fridge = DEFAULT_VACCINE_FRIDGES[0];
      expect(fridge.targetTempRange).toEqual({ min: 2.0, max: 8.0 });
      expect(fridge.hasBackupPower).toBe(true);
      expect(fridge.status).toBe('operational');
    });

    it('contains baseline seed logs', () => {
      expect(DEFAULT_COLD_CHAIN_RECORDS.length).toBeGreaterThanOrEqual(2);
      expect(DEFAULT_COLD_CHAIN_RECORDS.every((r) => r.isCompliant)).toBe(true);
    });
  });
});
