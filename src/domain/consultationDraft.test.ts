import { describe, expect, it, beforeEach } from 'vitest';
import {
  ConsultationDraft,
  DRAFT_PREFIX,
  clearAllDrafts,
  draftKey,
  parseDraft,
  getSavedDraft,
  saveDraft,
  removeDraft,
} from './consultationDraft';

const createMockStorage = () => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = String(value); },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
    key: (i: number) => Object.keys(store)[i] ?? null,
    get length() { return Object.keys(store).length; },
  };
};

if (typeof globalThis.sessionStorage === 'undefined') {
  (globalThis as any).sessionStorage = createMockStorage();
}
if (typeof globalThis.localStorage === 'undefined') {
  (globalThis as any).localStorage = createMockStorage();
}

const draft: ConsultationDraft = {
  v: 1,
  activeTab: 'assessment',
  subjective: 'Cough for 5 days',
  vitals: { bpSystolic: 138, bpDiastolic: 88, heartRate: 88, temperature: 37.9, respiratoryRate: 18 },
  icd: { code: 'J06.9', desc: 'Acute upper respiratory infection', category: 'Infectious' },
  clinicalNotes: 'Pharynx mildly injected, lungs clear bilaterally',
  rx: [],
  mcDays: 1,
  mcGenerated: false,
  pharmacyMemo: '',
  referralDetails: { hospital: '', department: '', reason: '' },
  referralGenerated: false,
  savedAt: 1_700_000_000_000,
};

describe('parseDraft', () => {
  it('round-trips a saved draft with activeTab and assessment details', () => {
    expect(parseDraft(JSON.stringify(draft))).toEqual(draft);
  });
  it('accepts a blank day count', () => {
    expect(parseDraft(JSON.stringify({ ...draft, mcDays: '' }))?.mcDays).toBe('');
  });
  it('keeps the plan details, and still reads drafts saved before they existed', () => {
    const withPlan = { ...draft, labOrders: ['FBC'], labReason: 'Anaemia?', mcReason: 'Fever', followUpWeeks: 2 };
    expect(parseDraft(JSON.stringify(withPlan))).toEqual(withPlan);
    expect(parseDraft(JSON.stringify(draft))?.labOrders).toBeUndefined();
    expect(parseDraft(JSON.stringify({ ...draft, labOrders: 'FBC' }))).toBeNull();
    expect(parseDraft(JSON.stringify({ ...draft, followUpWeeks: 'x' }))).toBeNull();
  });
  it('preserves activeTab state across assessment, subjective, objective, plan', () => {
    for (const tab of ['subjective', 'objective', 'assessment', 'plan'] as const) {
      const withTab = { ...draft, activeTab: tab };
      expect(parseDraft(JSON.stringify(withTab))?.activeTab).toBe(tab);
    }
    // Invalid activeTab string is rejected
    expect(parseDraft(JSON.stringify({ ...draft, activeTab: 'unknown_tab' }))).toBeNull();
  });
  it('rejects missing, damaged and other-version data', () => {
    expect(parseDraft(null)).toBeNull();
    expect(parseDraft('not json')).toBeNull();
    expect(parseDraft(JSON.stringify({ ...draft, v: 2 }))).toBeNull();
    expect(parseDraft(JSON.stringify({ ...draft, vitals: { bpSystolic: 'x' } }))).toBeNull();
    expect(parseDraft(JSON.stringify({ ...draft, rx: 'none' }))).toBeNull();
  });
});

describe('saveDraft, getSavedDraft, and removeDraft persistence', () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  it('persists and restores draft from sessionStorage', () => {
    const visitId = 'visit-abc-777';
    saveDraft(visitId, draft);

    const loaded = getSavedDraft(visitId);
    expect(loaded).toEqual(draft);
    expect(loaded?.activeTab).toBe('assessment');
    expect(loaded?.icd?.code).toBe('J06.9');
    expect(loaded?.clinicalNotes).toContain('Pharynx mildly injected');
  });

  it('falls back to localStorage if sessionStorage was cleared or refreshed', () => {
    const visitId = 'visit-xyz-888';
    saveDraft(visitId, draft);

    // Simulate session storage drop
    sessionStorage.clear();

    const loaded = getSavedDraft(visitId);
    expect(loaded).toEqual(draft);
    expect(loaded?.icd?.code).toBe('J06.9');
  });

  it('removeDraft removes from both storage backends on clinical sign-off', () => {
    const visitId = 'visit-del-999';
    saveDraft(visitId, draft);
    expect(getSavedDraft(visitId)).not.toBeNull();

    removeDraft(visitId);
    expect(getSavedDraft(visitId)).toBeNull();
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
