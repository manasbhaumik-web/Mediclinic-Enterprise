import { describe, expect, it } from 'vitest';
import { splitBrandName } from './BrandName';

describe('BrandName Dual-Color Splitter', () => {
  it('splits two-word enterprise brand names with First Letter Caps', () => {
    const res = splitBrandName('MEDICLINIC ENTERPRISE');
    expect(res.first).toBe('Mediclinic');
    expect(res.last).toBe('Enterprise');
  });

  it('splits multi-word clinic names keeping all leading words in primary font', () => {
    const res = splitBrandName('Pusat Perubatan Mediview');
    expect(res.first).toBe('Pusat Perubatan');
    expect(res.last).toBe('Mediview');
  });

  it('splits camelCase single-word brand names like MediClinic', () => {
    const res = splitBrandName('MediClinic');
    expect(res.first).toBe('Medi');
    expect(res.last).toBe('Clinic');
  });

  it('gracefully splits single-word uppercase names with First Letter Caps', () => {
    const res = splitBrandName('MEDICLINIC');
    expect(res.first).toBe('Medi');
    expect(res.last).toBe('Clinic');
  });

  it('handles empty or short inputs', () => {
    const res = splitBrandName('ABC');
    expect(res.first).toBe('ABC');
    expect(res.last).toBe('');
  });

  it('defaults to Mediclinic Enterprise with First Letter Caps', () => {
    const res = splitBrandName();
    expect(res.first).toBe('Mediclinic');
    expect(res.last).toBe('Enterprise');
  });
});
