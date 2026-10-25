import { describe, expect, it } from 'vitest';
import { calculatePatientAge } from './patientAge';

describe('calculatePatientAge', () => {
  const referenceDate = new Date(2026, 9, 25); // 25 Oct 2026

  it('calculates full adult age accurately', () => {
    const age = calculatePatientAge('1990-01-15', referenceDate);
    expect(age.years).toBe(36);
    expect(age.displayAge).toBe('36 Yrs');
    expect(age.isPediatric).toBe(false);
    expect(age.isInfant).toBe(false);
  });

  it('handles child / pediatric age properly', () => {
    const age = calculatePatientAge('2018-10-10', referenceDate);
    expect(age.years).toBe(8);
    expect(age.displayAge).toBe('8 Yrs');
    expect(age.isPediatric).toBe(true);
    expect(age.isInfant).toBe(false);
  });

  it('formats infant age in months when under 1 year rather than showing 0 Yrs', () => {
    const age = calculatePatientAge('2026-04-25', referenceDate);
    expect(age.years).toBe(0);
    expect(age.months).toBe(6);
    expect(age.displayAge).toBe('6 Mos');
    expect(age.fullLabel).toBe('6 Months (< 1 Yr)');
    expect(age.isPediatric).toBe(true);
    expect(age.isInfant).toBe(true);
  });

  it('formats newborn age in days when under 1 month', () => {
    const age = calculatePatientAge('2026-10-20', referenceDate);
    expect(age.years).toBe(0);
    expect(age.months).toBe(0);
    expect(age.days).toBe(5);
    expect(age.displayAge).toBe('5 Days');
    expect(age.isPediatric).toBe(true);
    expect(age.isInfant).toBe(true);
  });

  it('falls back to default 30 Yrs when dob is missing or invalid', () => {
    const missing = calculatePatientAge(null, referenceDate);
    expect(missing.years).toBe(30);
    expect(missing.displayAge).toBe('30 Yrs');

    const empty = calculatePatientAge('', referenceDate);
    expect(empty.years).toBe(30);

    const invalid = calculatePatientAge('not-a-date', referenceDate);
    expect(invalid.years).toBe(30);
  });

  it('calculates birthday boundary correctly when birthday has not occurred yet this year', () => {
    // Born 28 Dec 2025; on 25 Oct 2026, the baby is 9 months old, NOT 1 year old
    const age = calculatePatientAge('2025-12-28', referenceDate);
    expect(age.years).toBe(0);
    expect(age.months).toBe(9);
    expect(age.displayAge).toBe('9 Mos');
  });
});
