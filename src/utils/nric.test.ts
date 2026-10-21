import { describe, expect, it } from 'vitest';
import { formatNric, isCompleteNric, looksLikeNric, nricError, parseNric } from './nric';

const NOW = new Date(2026, 5, 15); // 15 Jun 2026

describe('formatNric', () => {
  it('inserts dashes as digits are typed', () => {
    expect(formatNric('9001')).toBe('9001');
    expect(formatNric('90010114')).toBe('900101-14');
    expect(formatNric('900101145555')).toBe('900101-14-5555');
  });

  it('drops digits beyond twelve and passes passport numbers through', () => {
    expect(formatNric('90010114555599')).toBe('900101-14-5555');
    expect(formatNric('A1234567')).toBe('A1234567');
  });
});

describe('parseNric', () => {
  it('reads date of birth and gender', () => {
    expect(parseNric('900101-14-5555', NOW)).toEqual({ dob: '1990-01-01', gender: 'Male' });
    expect(parseNric('850505-10-5678', NOW)).toEqual({ dob: '1985-05-05', gender: 'Female' });
  });

  it('puts two-digit years later than the current year in the 1900s', () => {
    expect(parseNric('260101-14-5555', NOW)?.dob).toBe('2026-01-01');
    expect(parseNric('270101-14-5555', NOW)?.dob).toBe('1927-01-01');
  });

  it('rejects impossible and future dates and incomplete numbers', () => {
    expect(parseNric('900231-14-5555', NOW)).toBeNull(); // 31 Feb
    expect(parseNric('261231-14-5555', NOW)).toBeNull(); // later this year than NOW
    expect(parseNric('900101-14-555', NOW)).toBeNull();
  });
});

describe('nricError', () => {
  it('accepts empty input, passport numbers and valid NRICs', () => {
    expect(nricError('')).toBe('');
    expect(nricError('A1234567')).toBe('');
    expect(nricError('900101-14-5555')).toBe('');
  });

  it('explains incomplete and invalid NRICs', () => {
    expect(nricError('9001')).toMatch(/12 digits/);
    expect(nricError('999999-14-5555')).toMatch(/date of birth/);
  });

  it('helpers agree on what an NRIC looks like', () => {
    expect(looksLikeNric('9001-')).toBe(true);
    expect(looksLikeNric('A123')).toBe(false);
    expect(isCompleteNric('900101-14-5555')).toBe(true);
  });
});
