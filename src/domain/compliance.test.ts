import { describe, expect, it } from 'vitest';
import {
  licenceStatus, notifiableWithoutCode, summarizeCoding, summarizeSurveillance, summarizeUnsigned, surveillanceFromRow,
} from './compliance';

describe('licenceStatus', () => {
  it('has no status without an expiry date', () => {
    expect(licenceStatus(null, '2026-10-22')).toEqual({ state: 'none', days: null });
    expect(licenceStatus('', '2026-10-22').state).toBe('none');
  });

  it('classifies by days left', () => {
    expect(licenceStatus('2027-10-22', '2026-10-22')).toMatchObject({ state: 'ok', days: 365 });
    expect(licenceStatus('2026-12-01', '2026-10-22')).toMatchObject({ state: 'soon', days: 40 });
    expect(licenceStatus('2026-10-22', '2026-10-22')).toMatchObject({ state: 'soon', days: 0 });
    expect(licenceStatus('2026-10-01', '2026-10-22')).toMatchObject({ state: 'expired', days: -21 });
  });

  it('honours a custom warning window', () => {
    expect(licenceStatus('2026-12-01', '2026-10-22', 30).state).toBe('ok');
  });
});

describe('summarizeCoding', () => {
  it('works out how many finished consultations lack a code', () => {
    expect(summarizeCoding(8, 1)).toEqual({ consulted: 8, coded: 1, missing: 7, percent: 13 });
    expect(summarizeCoding(4, 4)).toEqual({ consulted: 4, coded: 4, missing: 0, percent: 100 });
  });

  it('has no percentage until a consultation has finished', () => {
    expect(summarizeCoding(0, 0)).toEqual({ consulted: 0, coded: 0, missing: 0, percent: null });
  });
});

describe('notifiableWithoutCode', () => {
  const notifiable = [
    { icdPrefix: 'A90', condition: 'Dengue fever' },
    { icdPrefix: 'A15', condition: 'Tuberculosis' },
    { icdPrefix: 'A16', condition: 'Tuberculosis' },
    { icdPrefix: 'B50', condition: 'Malaria' },
  ];

  it('lists conditions that no available code can record', () => {
    expect(notifiableWithoutCode(notifiable, ['J06.9', 'A90'])).toEqual({ uncovered: ['Malaria', 'Tuberculosis'], total: 3 });
  });

  it('treats a condition as covered when any of its prefixes has a code', () => {
    expect(notifiableWithoutCode(notifiable, ['A16.2', 'B50.9', 'A90']).uncovered).toEqual([]);
  });

  it('matches case-insensitively and by prefix only', () => {
    expect(notifiableWithoutCode([{ icdPrefix: 'B08.4', condition: 'HFMD' }], ['b08.4']).uncovered).toEqual([]);
    expect(notifiableWithoutCode([{ icdPrefix: 'B08.4', condition: 'HFMD' }], ['B08']).uncovered).toEqual(['HFMD']);
  });
});

describe('summarizeSurveillance', () => {
  it('totals cases and ranks conditions', () => {
    const rows = [
      surveillanceFromRow({ week_start: '2026-10-12', condition: 'Dengue fever', icd_code: 'A90', cases: 2 }),
      surveillanceFromRow({ week_start: '2026-10-19', condition: 'Dengue fever', icd_code: 'A90', cases: '3' }),
      surveillanceFromRow({ week_start: '2026-10-19', condition: 'Malaria', icd_code: 'B54', cases: 1 }),
    ];
    expect(summarizeSurveillance(rows)).toEqual({
      totalCases: 6,
      byCondition: [{ condition: 'Dengue fever', cases: 5 }, { condition: 'Malaria', cases: 1 }],
    });
    expect(summarizeSurveillance([])).toEqual({ totalCases: 0, byCondition: [] });
  });
});

describe('summarizeUnsigned', () => {
  const now = Date.parse('2026-10-22T00:00:00Z');

  it('counts entries missing a second signature and the oldest wait', () => {
    expect(summarizeUnsigned([
      { signedBy: 'u1', createdAt: '2026-09-01T00:00:00Z' },
      { signedBy: null, createdAt: '2026-10-20T00:00:00Z' },
      { signedBy: null, createdAt: '2026-10-12T00:00:00Z' },
    ], now)).toEqual({ unsigned: 2, oldestDays: 10 });
  });

  it('reports none when everything is signed', () => {
    expect(summarizeUnsigned([{ signedBy: 'u1', createdAt: '2026-10-01T00:00:00Z' }], now)).toEqual({ unsigned: 0, oldestDays: null });
    expect(summarizeUnsigned([], now)).toEqual({ unsigned: 0, oldestDays: null });
  });
});
