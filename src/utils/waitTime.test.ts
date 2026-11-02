import { describe, expect, it } from 'vitest';
import { formatWait } from './waitTime';

describe('formatWait', () => {
  it('formats minutes, hours and days', () => {
    expect(formatWait(0)).toBe('0m');
    expect(formatWait(45)).toBe('45m');
    expect(formatWait(134)).toBe('2h 14m');
    expect(formatWait(8414)).toBe('5d 20h');
  });
  it('clamps invalid input', () => {
    expect(formatWait(-5)).toBe('0m');
    expect(formatWait(NaN)).toBe('0m');
  });
});
