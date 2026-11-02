import { describe, it, expect } from 'vitest';
import {
  DEFAULT_POCT_DEVICES,
  evaluateQCReading,
  calculateEffectiveExpiry,
  isReagentLotExpired,
  evaluateDeviceQcStatus,
  createPOCTCalibrationRecord,
  POCTCalibrationRecord,
  POCTDevice,
} from './poctCalibration';

describe('poctCalibration domain', () => {
  const testDevice: POCTDevice = {
    id: 'POCT-TEST-01',
    name: 'Precision Test Glucometer',
    type: 'glucometer',
    serialNumber: 'SN-TEST-100',
    location: 'Treatment Room',
    reagentLotNumber: 'LOT-998',
    reagentExpiryDate: '2027-12-31',
    reagentOpenedAt: '2026-10-01',
    openVialShelfLifeDays: 90,
    qcSchedule: 'daily',
    level1Target: { min: 2.0, max: 4.0, unit: 'mmol/L' },
    level2Target: { min: 14.0, max: 20.0, unit: 'mmol/L' },
  };

  describe('evaluateQCReading', () => {
    it('passes when reading is inside the target interval', () => {
      const res = evaluateQCReading(3.0, 2.0, 4.0);
      expect(res.status).toBe('pass');
      expect(res.deviation).toBe(0);
    });

    it('fails when reading is below the minimum threshold', () => {
      const res = evaluateQCReading(1.8, 2.0, 4.0);
      expect(res.status).toBe('fail');
      expect(res.deviation).toBe(-1.2);
    });

    it('fails when reading exceeds the maximum threshold', () => {
      const res = evaluateQCReading(4.5, 2.0, 4.0);
      expect(res.status).toBe('fail');
      expect(res.deviation).toBe(1.5);
    });
  });

  describe('calculateEffectiveExpiry', () => {
    it('calculates open-vial stability when earlier than manufacturer box expiry', () => {
      // Opened on 2026-10-01, 90 days shelf life => ~2026-12-30, earlier than 2027-12-31
      const effective = calculateEffectiveExpiry('2026-10-01', 90, '2027-12-31');
      expect(effective).toBe('2026-12-30');
    });

    it('retains manufacturer expiry if open-vial stability exceeds it', () => {
      // Opened with 180 days on 2026-10-01 => 2027-03-30, but box expires 2026-11-01
      const effective = calculateEffectiveExpiry('2026-10-01', 180, '2026-11-01');
      expect(effective).toBe('2026-11-01');
    });

    it('falls back to manufacturer expiry if vial has not been opened yet', () => {
      const effective = calculateEffectiveExpiry(null, 90, '2027-05-15');
      expect(effective).toBe('2027-05-15');
    });
  });

  describe('isReagentLotExpired', () => {
    it('returns false for unexpired reagent', () => {
      const isExp = isReagentLotExpired('2026-10-01', 90, '2027-12-31', '2026-11-01');
      expect(isExp).toBe(false);
    });

    it('returns true when current date surpasses open-vial stability', () => {
      // 90 days after 2026-06-01 is 2026-08-30. Current date 2026-11-01 is expired.
      const isExp = isReagentLotExpired('2026-06-01', 90, '2027-12-31', '2026-11-01');
      expect(isExp).toBe(true);
    });
  });

  describe('evaluateDeviceQcStatus', () => {
    it('flags expired_lot when reagent is expired', () => {
      const expiredDevice: POCTDevice = {
        ...testDevice,
        reagentOpenedAt: '2026-01-01',
        openVialShelfLifeDays: 30, // Expired in Feb 2026
      };
      const result = evaluateDeviceQcStatus(expiredDevice, [], '2026-11-01');
      expect(result.isValid).toBe(false);
      expect(result.status).toBe('expired_lot');
      expect(result.reason).toContain('expired or exceeded open-vial stability');
    });

    it('flags missing_daily_qc when no test was run today', () => {
      const pastRecord: POCTCalibrationRecord = {
        id: 'QC-01',
        deviceId: testDevice.id,
        deviceName: testDevice.name,
        deviceType: testDevice.type,
        testedAt: '2026-10-31T08:00:00Z',
        operatorStaffId: 'STF-01',
        operatorStaffName: 'Nurse A',
        level1: { level: 1, controlLot: 'C1', measuredValue: 3.0, unit: 'mmol/L', targetMin: 2, targetMax: 4, status: 'pass', deviation: 0 },
        level2: { level: 2, controlLot: 'C2', measuredValue: 16.0, unit: 'mmol/L', targetMin: 14, targetMax: 20, status: 'pass', deviation: -1 },
        overallStatus: 'pass',
        reagentLotVerified: true,
      };

      const result = evaluateDeviceQcStatus(testDevice, [pastRecord], '2026-11-01');
      expect(result.isValid).toBe(false);
      expect(result.status).toBe('missing_daily_qc');
      expect(result.lastRecord?.id).toBe('QC-01');
    });

    it('flags failed_qc when a test was run today but failed tolerance', () => {
      const failedRecord: POCTCalibrationRecord = {
        id: 'QC-FAIL-01',
        deviceId: testDevice.id,
        deviceName: testDevice.name,
        deviceType: testDevice.type,
        testedAt: '2026-11-01T07:30:00Z',
        operatorStaffId: 'STF-01',
        operatorStaffName: 'Nurse A',
        level1: { level: 1, controlLot: 'C1', measuredValue: 1.2, unit: 'mmol/L', targetMin: 2, targetMax: 4, status: 'fail', deviation: -1.8 },
        level2: { level: 2, controlLot: 'C2', measuredValue: 16.0, unit: 'mmol/L', targetMin: 14, targetMax: 20, status: 'pass', deviation: -1 },
        overallStatus: 'fail',
        reagentLotVerified: true,
      };

      const result = evaluateDeviceQcStatus(testDevice, [failedRecord], '2026-11-01');
      expect(result.isValid).toBe(false);
      expect(result.status).toBe('failed_qc');
      expect(result.reason).toContain('Daily QC test failed today');
    });

    it('returns valid when today has a passing 2-level QC record', () => {
      const passedRecord: POCTCalibrationRecord = {
        id: 'QC-PASS-01',
        deviceId: testDevice.id,
        deviceName: testDevice.name,
        deviceType: testDevice.type,
        testedAt: '2026-11-01T07:45:00Z',
        operatorStaffId: 'STF-01',
        operatorStaffName: 'Nurse A',
        level1: { level: 1, controlLot: 'C1', measuredValue: 3.2, unit: 'mmol/L', targetMin: 2, targetMax: 4, status: 'pass', deviation: 0.2 },
        level2: { level: 2, controlLot: 'C2', measuredValue: 17.5, unit: 'mmol/L', targetMin: 14, targetMax: 20, status: 'pass', deviation: 0.5 },
        overallStatus: 'pass',
        reagentLotVerified: true,
      };

      const result = evaluateDeviceQcStatus(testDevice, [passedRecord], '2026-11-01');
      expect(result.isValid).toBe(true);
      expect(result.status).toBe('valid');
    });
  });

  describe('createPOCTCalibrationRecord', () => {
    it('creates passing record when both level 1 and level 2 are within limits', () => {
      const record = createPOCTCalibrationRecord({
        device: testDevice,
        operatorStaffId: 'STF-09',
        operatorStaffName: 'Clinic Assistant Zarith',
        controlLot: 'CTL-BATCH-2026',
        level1Reading: 3.1,
        level2Reading: 17.0,
        notes: 'Calibrated smoothly.',
        customDate: '2026-11-01T08:00:00Z',
      });

      expect(record.overallStatus).toBe('pass');
      expect(record.level1.status).toBe('pass');
      expect(record.level2.status).toBe('pass');
      expect(record.deviceId).toBe(testDevice.id);
      expect(record.reagentLotVerified).toBe(true);
    });

    it('creates failing record if any level is out of limits', () => {
      const record = createPOCTCalibrationRecord({
        device: testDevice,
        operatorStaffId: 'STF-09',
        operatorStaffName: 'Clinic Assistant Zarith',
        controlLot: 'CTL-BATCH-2026',
        level1Reading: 5.5, // Exceeds max 4.0
        level2Reading: 17.0,
        customDate: '2026-11-01T08:00:00Z',
      });

      expect(record.overallStatus).toBe('fail');
      expect(record.level1.status).toBe('fail');
      expect(record.level2.status).toBe('pass');
    });
  });

  describe('DEFAULT_POCT_DEVICES', () => {
    it('includes standard Malaysian primary care instruments', () => {
      expect(DEFAULT_POCT_DEVICES.length).toBeGreaterThanOrEqual(4);
      const types = DEFAULT_POCT_DEVICES.map((d) => d.type);
      expect(types).toContain('glucometer');
      expect(types).toContain('hba1c');
      expect(types).toContain('urine_analyzer');
      expect(types).toContain('dengue_rapid');
    });
  });
});
