import { describe, it, expect } from 'vitest';
import { 
  calculateChildAgeInMonths, 
  evaluateImmunizationStatus, 
  evaluateColdChainTemp,
  KKM_CHILDHOOD_IMMUNIZATION_SCHEDULE 
} from './immunization';

describe('KKM National Childhood Immunization Schedule & Cold Chain Domain', () => {
  it('accurately calculates child age in full calendar months', () => {
    const fixedNow = new Date('2026-06-15');
    // Born 2 months ago
    expect(calculateChildAgeInMonths('2026-04-15', fixedNow)).toBe(2);
    // Born 6 months ago
    expect(calculateChildAgeInMonths('2025-12-15', fixedNow)).toBe(6);
    // Born yesterday
    expect(calculateChildAgeInMonths('2026-06-14', fixedNow)).toBe(0);
  });

  it('evaluates vaccine status correctly for 2-month-old infant', () => {
    const fixedNow = new Date('2026-06-15');
    // Infant born on 2026-04-15 (2 months old today)
    // Given BCG and HepB-1 at birth
    const administered = [
      { code: 'BCG', administeredDate: '2026-04-15', batchNo: 'BCG-001' },
      { code: 'HepB-1', administeredDate: '2026-04-15', batchNo: 'HEP-001' }
    ];

    const roster = evaluateImmunizationStatus('2026-04-15', administered, fixedNow);

    const bcg = roster.find(v => v.vaccineCode === 'BCG');
    expect(bcg?.status).toBe('Administered');

    const hepa1 = roster.find(v => v.vaccineCode === 'HepB-1');
    expect(hepa1?.status).toBe('Administered');

    // HepB-2 is due at 1 month, child is 2 months => Overdue
    const hepa2 = roster.find(v => v.vaccineCode === 'HepB-2');
    expect(hepa2?.isDue).toBe(true);

    // Hexavalent-1 is due at 2 months => Due
    const hexa1 = roster.find(v => v.vaccineCode === 'DTaP-IPV-HepB-Hib-1');
    expect(hexa1?.status).toBe('Due');

    // MMR-1 is at 12 months => Upcoming
    const mmr = roster.find(v => v.vaccineCode === 'MMR-1');
    expect(mmr?.status).toBe('Upcoming');
  });

  it('evaluates Cold-Chain temperature compliance per KKM guidelines (+2°C to +8°C)', () => {
    // Compliant temperatures
    expect(evaluateColdChainTemp(4.5).isCompliant).toBe(true);
    expect(evaluateColdChainTemp(2.0).isCompliant).toBe(true);
    expect(evaluateColdChainTemp(8.0).isCompliant).toBe(true);

    // Freezing hazard (< 2°C)
    const freezing = evaluateColdChainTemp(1.2);
    expect(freezing.isCompliant).toBe(false);
    expect(freezing.excursionType).toBe('Freeze Hazard (<2°C)');
    expect(freezing.warningMessage).toContain('CRITICAL COLD EXCURSION');

    // Heat excursion (> 8°C)
    const heat = evaluateColdChainTemp(9.4);
    expect(heat.isCompliant).toBe(false);
    expect(heat.excursionType).toBe('Heat Hazard (>8°C)');
    expect(heat.warningMessage).toContain('HEAT EXCURSION');
  });

  it('validates comprehensive coverage of KKM schedule milestones', () => {
    expect(KKM_CHILDHOOD_IMMUNIZATION_SCHEDULE.length).toBeGreaterThanOrEqual(7);
    const codes = KKM_CHILDHOOD_IMMUNIZATION_SCHEDULE.flatMap(m => m.vaccines.map(v => v.code));
    expect(codes).toContain('BCG');
    expect(codes).toContain('DTaP-IPV-HepB-Hib-1');
    expect(codes).toContain('PCV-1');
    expect(codes).toContain('MMR-1');
  });
});
