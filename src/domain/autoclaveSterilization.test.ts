import { describe, expect, it } from 'vitest';
import { 
  validateAutoclaveCycle, 
  logAutoclaveCycle, 
  verifyPackForProcedure 
} from './autoclaveSterilization';

describe('Infection Control & Autoclave Sterilization Log (PHFSA 1998 Reg Part XVI)', () => {
  it('validates a compliant 134°C Porous cycle meeting temperature, pressure, and hold-time criteria', () => {
    const res = validateAutoclaveCycle({
      program: '134C_Porous_2.1bar',
      achievedTemperatureC: 134.5,
      achievedPressureBar: 2.15,
      holdingTimeMinutes: 4.0,
      chemicalIndicatorPassed: true,
      biologicalSporeTestValid: true
    });
    expect(res.isCompliant).toBe(true);
    expect(res.error).toBeUndefined();
  });

  it('rejects an autoclave cycle if temperature is sub-therapeutic (< 134°C)', () => {
    const res = validateAutoclaveCycle({
      program: '134C_Porous_2.1bar',
      achievedTemperatureC: 131.0,
      achievedPressureBar: 1.8,
      holdingTimeMinutes: 3.5,
      chemicalIndicatorPassed: true,
      biologicalSporeTestValid: true
    });
    expect(res.isCompliant).toBe(false);
    expect(res.error).toContain('Temperature 131°C below required 134°C');
  });

  it('generates traceable sterile instrument packs with 30-day expiry dates on compliant cycle', () => {
    const record = logAutoclaveCycle({
      cycleNumber: 'CYCLE-20261101-01',
      autoclaveUnitId: 'AUTOCLAVE-01 (Tuttnauer)',
      program: '134C_Porous_2.1bar',
      achievedTemperatureC: 135.0,
      achievedPressureBar: 2.2,
      holdingTimeMinutes: 4.0,
      chemicalIndicatorPassed: true,
      biologicalSporeTestValid: true,
      operatorNurseId: 'nurse-02',
      operatorNurseName: 'Staff Nurse Fadhilah',
      packTypes: ['SutureSet', 'IncisionDrainageSet'],
      customDate: '2026-11-01T08:00:00Z'
    });

    expect(record.isCycleCompliant).toBe(true);
    expect(record.packsGenerated).toHaveLength(2);
    expect(record.packsGenerated[0].packId).toBe('PACK-SUT-20261101-01-01');
    expect(record.packsGenerated[0].expiryDate).toBe('2026-12-01'); // 30 days after
  });

  it('flags an expired or already-used instrument pack when checked for a procedure', () => {
    const pack = {
      packId: 'PACK-SUT-20261001-01',
      packType: 'SutureSet' as const,
      sterilizedAt: '2026-10-01T08:00:00Z',
      expiryDate: '2026-10-31',
      isUsed: false
    };

    // Checked on Nov 1st -> expired on Oct 31st
    const checkExpired = verifyPackForProcedure(pack, new Date('2026-11-01'));
    expect(checkExpired.isValid).toBe(false);
    expect(checkExpired.reason).toContain('expired');

    const usedPack = { ...pack, expiryDate: '2026-12-01', isUsed: true, usedInVisitId: 'VISIT-992' };
    const checkUsed = verifyPackForProcedure(usedPack, new Date('2026-11-01'));
    expect(checkUsed.isValid).toBe(false);
    expect(checkUsed.reason).toContain('already used');
  });
});
