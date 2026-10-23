import { describe, expect, it } from 'vitest';
import { formatTicket } from './ticket';

describe('formatTicket', () => {
  it('pads to three digits', () => {
    expect(formatTicket(1)).toBe('#001');
    expect(formatTicket(14)).toBe('#014');
    expect(formatTicket(123)).toBe('#123');
  });
  it('keeps going past 999', () => {
    expect(formatTicket(1204)).toBe('#1204');
  });
  it('is blank for a visit with no ticket', () => {
    expect(formatTicket(undefined)).toBe('');
    expect(formatTicket(null)).toBe('');
    expect(formatTicket(0)).toBe('');
    expect(formatTicket(2.5)).toBe('');
  });
});
