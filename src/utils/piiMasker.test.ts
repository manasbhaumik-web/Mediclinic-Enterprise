import { describe, expect, it } from 'vitest';
import {
  maskEmailAddress, maskICNumber, maskPatientName, maskPhoneNumber, sanitizeClinicalTextForAI,
} from './piiMasker';

describe('masking defaults to hidden', () => {
  it('masks every field unless showPII is explicitly true', () => {
    expect(maskICNumber('900101-14-5555')).toBe('900101-XX-5555');
    expect(maskPhoneNumber('012-3456789')).toBe('012-XXX-6789');
    expect(maskEmailAddress('sarah.tan@mediclinic.my')).toBe('s***n@mediclinic.my');
    expect(maskPatientName('Aina Binti Ali')).toBe('A. B. A. (Protected)');
  });

  it('returns the real value when PII is shown', () => {
    expect(maskICNumber('900101-14-5555', true)).toBe('900101-14-5555');
    expect(maskPhoneNumber('0123456789', true)).toBe('0123456789');
    expect(maskPatientName('Aina', true)).toBe('Aina');
  });

  it('handles missing and malformed input without leaking', () => {
    expect(maskICNumber(null)).toBe('');
    expect(maskICNumber('12')).toBe('****');
    expect(maskPhoneNumber('123')).toBe('01X-XXX-XXXX');
    expect(maskEmailAddress('not-an-email')).toBe('***@***.***');
    expect(maskPatientName(undefined)).toBe('Anonymous Patient');
    expect(maskPatientName('Madonna')).toBe('M. (Protected)');
  });

  it('does not reveal the middle of an IC number', () => {
    const masked = maskICNumber('900101-14-5555');
    expect(masked).not.toContain('-14-');
  });
});

describe('sanitizeClinicalTextForAI', () => {
  it('redacts IC numbers, phones and emails and reports what it found', () => {
    const out = sanitizeClinicalTextForAI('Pt 900101-14-5555 call 012-3456789 or aina@example.com');
    expect(out.sanitizedText).not.toMatch(/900101|3456789|aina@example/);
    expect(out.sanitizedText).toContain('[REDACTED_MYKAD_IC]');
    expect(out.piiFoundCount).toBeGreaterThanOrEqual(3);
    expect(out.detectedTypes).toContain('MYKAD_IC_NUMBER');
  });

  it('returns an empty, clean result for empty or non-string input', () => {
    expect(sanitizeClinicalTextForAI('').piiFoundCount).toBe(0);
    expect(sanitizeClinicalTextForAI(undefined as unknown as string).sanitizedText).toBe('');
  });

  it('leaves text without PII unchanged', () => {
    const out = sanitizeClinicalTextForAI('Fever and cough for 3 days');
    expect(out.sanitizedText).toBe('Fever and cough for 3 days');
    expect(out.piiFoundCount).toBe(0);
  });
});
