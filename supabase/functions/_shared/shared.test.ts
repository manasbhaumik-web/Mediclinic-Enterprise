import { describe, expect, it } from 'vitest';
import { validateEndpoint } from './endpoint';
import { MAX_ATTEMPTS, backoffDelayMs, isRetryableStatus, outcomeAfterAttempt } from './outbox';
import { FhirBuildError, buildEncounterBundle } from './fhir';
import { buildAuthHeaders } from './headers';

describe('validateEndpoint', () => {
  it('accepts a public https URL and normalises it', () => {
    expect(validateEndpoint('https://hapi.fhir.org/baseR4/')).toEqual({ ok: true, url: 'https://hapi.fhir.org/baseR4' });
  });

  it.each([
    ['', 'required'],
    ['not a url', 'valid URL'],
    ['http://fhir.example.com', 'https'],
    ['https://user:pw@fhir.example.com', 'credentials'],
    ['https://localhost/fhir', 'Internal'],
    ['https://db.internal', 'Internal'],
    ['https://printer.local', 'Internal'],
    ['https://127.0.0.1/fhir', 'Private'],
    ['https://10.0.0.5', 'Private'],
    ['https://192.168.1.10', 'Private'],
    ['https://172.20.0.1', 'Private'],
    ['https://169.254.169.254/latest/meta-data', 'Private'],
    ['https://[::1]/', 'IPv6'],
    ['https://intranet', 'fully qualified'],
  ])('rejects %s', (input, reason) => {
    const r = validateEndpoint(input);
    expect(r.ok).toBe(false);
    expect(r.reason).toContain(reason);
  });

  it('catches numeric and hex forms of loopback addresses', () => {
    expect(validateEndpoint('https://2130706433/').ok).toBe(false);   // 127.0.0.1 as a decimal
    expect(validateEndpoint('https://0x7f.0.0.1/').ok).toBe(false);
  });

  it('allows public IP addresses', () => {
    expect(validateEndpoint('https://8.8.8.8/fhir').ok).toBe(true);
  });
});

describe('outbox retry policy', () => {
  const noJitter = () => 0;

  it('backs off exponentially from one minute and caps at six hours', () => {
    expect(backoffDelayMs(1, noJitter)).toBe(60_000);
    expect(backoffDelayMs(2, noJitter)).toBe(120_000);
    expect(backoffDelayMs(4, noJitter)).toBe(480_000);
    expect(backoffDelayMs(20, noJitter)).toBe(6 * 60 * 60_000);
  });

  it('adds at most 10% jitter', () => {
    expect(backoffDelayMs(1, () => 1)).toBe(66_000);
  });

  it('marks success as sent, early failures as retryable, and exhausted ones as dead', () => {
    const now = new Date('2026-01-01T00:00:00Z');
    expect(outcomeAfterAttempt(true, 1, now)).toEqual({ status: 'sent' });
    const failed = outcomeAfterAttempt(false, 1, now, noJitter);
    expect(failed).toEqual({ status: 'failed', nextRetryAt: new Date('2026-01-01T00:01:00Z') });
    expect(outcomeAfterAttempt(false, MAX_ATTEMPTS, now)).toEqual({ status: 'dead' });
  });

  it('retries network errors, 408, 429 and 5xx but not other client errors', () => {
    expect(isRetryableStatus(null)).toBe(true);
    expect([408, 429, 500, 503].every(isRetryableStatus)).toBe(true);
    expect([400, 401, 403, 404, 422].some(isRetryableStatus)).toBe(false);
  });
});

describe('buildAuthHeaders', () => {
  it('builds each auth style', () => {
    expect(buildAuthHeaders('none', null)).toEqual({});
    expect(buildAuthHeaders('bearer', 'tok')).toEqual({ Authorization: 'Bearer tok' });
    expect(buildAuthHeaders('basic', 'user:pw')).toEqual({ Authorization: `Basic ${btoa('user:pw')}` });
    expect(buildAuthHeaders('api_key_header', 'k', 'X-Api-Key')).toEqual({ 'X-Api-Key': 'k' });
  });

  it('refuses a missing secret and header names that could inject headers', () => {
    expect(() => buildAuthHeaders('bearer', null)).toThrow(/secret/);
    expect(() => buildAuthHeaders('api_key_header', 'k', 'X-A\r\nEvil: 1')).toThrow(/header name/);
    expect(() => buildAuthHeaders('api_key_header', 'k', '')).toThrow(/header name/);
  });
});

describe('buildEncounterBundle', () => {
  const patient = { id: 'p1', full_name: 'Aina Ali', ic_number: '900101-14-5555', gender: 'Female', dob: '1990-01-01', phone: '0123' };
  const visit = { id: 'v1', patient_id: 'p1', status: 'Awaiting Dispensation', visit_date: '2026-01-02T03:04:05Z' };
  const soap = { icd_code: 'J06.9', description: 'URTI', bp_systolic: 120, bp_diastolic: 80, heart_rate: 72, temperature: 37.2, respiratory_rate: 16 };

  const types = (b: ReturnType<typeof buildEncounterBundle>) => b.entry.map((e) => e.resource.resourceType);

  it('builds a transaction bundle with patient, encounter, diagnosis and vitals', () => {
    const b = buildEncounterBundle(patient, visit, soap);
    expect(b.type).toBe('transaction');
    expect(types(b)).toEqual(['Patient', 'Encounter', 'Condition', 'Observation', 'Observation', 'Observation', 'Observation']);
    expect(b.entry.every((e) => e.request.method === 'PUT' && e.request.url.endsWith(String(e.resource.id)))).toBe(true);
  });

  it('omits the NRIC unless explicitly enabled', () => {
    const without = JSON.stringify(buildEncounterBundle(patient, visit, soap));
    expect(without).not.toContain('900101-14-5555');
    const withNric = JSON.stringify(buildEncounterBundle(patient, visit, soap, { sendNric: true }));
    expect(withNric).toContain('900101-14-5555');
  });

  it('skips vitals that were not recorded instead of sending zeros', () => {
    const b = buildEncounterBundle(patient, visit, { icd_code: null, bp_systolic: 0, bp_diastolic: 0, heart_rate: 0 });
    expect(types(b)).toEqual(['Patient', 'Encounter']);
  });

  it('refuses to invent missing demographics', () => {
    expect(() => buildEncounterBundle({ ...patient, dob: null, gender: null }, visit, soap)).toThrow(FhirBuildError);
    try {
      buildEncounterBundle({ ...patient, dob: null, gender: null }, visit, soap);
    } catch (e) {
      expect((e as FhirBuildError).missing).toEqual(['patient.gender', 'patient.dob']);
    }
  });

  it('maps Malay gender labels', () => {
    const b = buildEncounterBundle({ ...patient, gender: 'Lelaki' }, visit, null);
    expect(b.entry[0].resource.gender).toBe('male');
  });
});

import { resolveOutcome } from './outbox';

describe('resolveOutcome', () => {
  const now = new Date('2026-01-01T00:00:00Z');

  it('retries transient failures until attempts are exhausted', () => {
    expect(resolveOutcome({ success: false, httpStatus: 503, attemptsSoFar: 1, now, random: () => 0 }).status).toBe('failed');
    expect(resolveOutcome({ success: false, httpStatus: null, attemptsSoFar: MAX_ATTEMPTS, now }).status).toBe('dead');
  });

  it('does not retry client errors or failures marked permanent', () => {
    expect(resolveOutcome({ success: false, httpStatus: 400, attemptsSoFar: 1, now }).status).toBe('dead');
    expect(resolveOutcome({ success: false, httpStatus: null, attemptsSoFar: 1, now, permanent: true }).status).toBe('dead');
  });

  it('success always wins', () => {
    expect(resolveOutcome({ success: true, httpStatus: 200, attemptsSoFar: 3, now }).status).toBe('sent');
  });
});
