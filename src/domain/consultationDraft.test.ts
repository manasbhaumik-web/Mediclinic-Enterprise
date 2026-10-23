import { describe, expect, it } from 'vitest';
import { ConsultationDraft, DRAFT_PREFIX, clearAllDrafts, draftKey, parseDraft } from './consultationDraft';

const draft: ConsultationDraft = {
  v: 1,
  subjective: 'Cough for 5 days',
  vitals: { bpSystolic: 138, bpDiastolic: 88, heartRate: 88, temperature: 37.9, respiratoryRate: 18 },
  icd: null,
  clinicalNotes: '',
  rx: [],
  mcDays: 1,
  mcGenerated: false,
  pharmacyMemo: '',
  referralDetails: { hospital: '', department: '', reason: '' },
  referralGenerated: false,
  savedAt: 1_700_000_000_000,
};

describe('parseDraft', () => {
  it('round-trips a saved draft', () => {
    expect(parseDraft(JSON.stringify(draft))).toEqual(draft);
  });
  it('accepts a blank day count', () => {
    expect(parseDraft(JSON.stringify({ ...draft, mcDays: '' }))?.mcDays).toBe('');
  });
  it('rejects missing, damaged and other-version data', () => {
    expect(parseDraft(null)).toBeNull();
    expect(parseDraft('not json')).toBeNull();
    expect(parseDraft(JSON.stringify({ ...draft, v: 2 }))).toBeNull();
    expect(parseDraft(JSON.stringify({ ...draft, vitals: { bpSystolic: 'x' } }))).toBeNull();
    expect(parseDraft(JSON.stringify({ ...draft, rx: 'none' }))).toBeNull();
  });
});

describe('clearAllDrafts', () => {
  it('removes drafts only, leaving other keys alone', () => {
    const store = new Map<string, string>([[draftKey('a'), '1'], [draftKey('b'), '2'], ['mediclinic.consultRoom', 'Room 1'], ['theme', 'ice']]);
    const storage = {
      get length() { return store.size; },
      key: (i: number) => [...store.keys()][i] ?? null,
      removeItem: (k: string) => { store.delete(k); },
    };
    clearAllDrafts(storage);
    expect([...store.keys()].sort()).toEqual(['mediclinic.consultRoom', 'theme']);
    expect([...store.keys()].some((k) => k.startsWith(DRAFT_PREFIX))).toBe(false);
  });
});
