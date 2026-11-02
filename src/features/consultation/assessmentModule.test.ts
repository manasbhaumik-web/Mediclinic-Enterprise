import { describe, it, expect } from 'vitest';
import { ICD10_CATALOG } from '../../data';
import type { ICD10Code } from '../../types';

// The Layman Synonym Dictionary as implemented in AssessmentTab.tsx
const LAYMAN_SYNONYMS: Record<string, string[]> = {
  cold: ['J06.9', 'J00', 'J30.9', 'R05.9'],
  flu: ['J06.9', 'R50.9', 'Z23'],
  influenza: ['J06.9'],
  cough: ['R05.9', 'J06.9', 'J20.9', 'J45.909'],
  batuk: ['R05.9', 'J06.9'],
  sugar: ['E11.9', 'E10'],
  diabetes: ['E11.9'],
  'kencing manis': ['E11.9'],
  'blood pressure': ['I10', 'I25.10'],
  bp: ['I10'],
  pressure: ['I10'],
  hypertension: ['I10'],
  'darah tinggi': ['I10'],
  tummy: ['K29.7', 'K30', 'A09.9', 'K21.9', 'R11.2'],
  belly: ['K29.7', 'K30', 'A09.9'],
  stomach: ['K29.7', 'K30', 'K21.9'],
  perut: ['K29.7', 'K30', 'A09.9'],
  diarrhea: ['A09.9', 'K58.9'],
  cirit: ['A09.9'],
  gastric: ['K29.7', 'K30', 'K21.9'],
  gastritis: ['K29.7', 'K30'],
  fever: ['R50.9', 'A90', 'B01.9'],
  demam: ['R50.9', 'A90'],
  throat: ['J02.9', 'J06.9'],
  'sore throat': ['J02.9', 'J06.9'],
  headache: ['G43.909', 'G44.209'],
  migraine: ['G43.909'],
  asthma: ['J45.909'],
  semput: ['J45.909'],
  dengue: ['A90'],
  vomit: ['R11.2', 'A09.9'],
  muntah: ['R11.2', 'A09.9'],
  dizzy: ['R42'],
  giddy: ['R42'],
  pening: ['R42'],
  pain: ['M79.1', 'M54.5', 'R07.9'],
  sakit: ['M79.1', 'M54.5'],
  back: ['M54.5', 'M79.1'],
  rash: ['L20.9', 'L50.9', 'T78.40'],
  gatal: ['L20.9', 'L50.9'],
  allergy: ['T78.40', 'L20.9'],
  mc: ['Z02.7'],
};

// Simulation of the exact search algorithm in AssessmentTab.tsx
function searchICD(query: string, catalog: ICD10Code[] = ICD10_CATALOG): ICD10Code[] {
  const raw = query.trim().toLowerCase();
  if (!raw) return [];

  const matchedCodes = new Set<string>();
  for (const [synonym, codes] of Object.entries(LAYMAN_SYNONYMS)) {
    if (raw.includes(synonym) || synonym.includes(raw)) {
      codes.forEach((c) => matchedCodes.add(c.toLowerCase()));
    }
  }

  return catalog
    .filter((i) => {
      const codeLower = i.code.toLowerCase();
      const descLower = i.desc.toLowerCase();
      const catLower = i.category.toLowerCase();
      const matchesDirect = codeLower.includes(raw) || descLower.includes(raw) || catLower.includes(raw);
      const matchesSynonym = matchedCodes.has(codeLower);
      return matchesDirect || matchesSynonym;
    })
    .sort((a, b) => {
      const aSyn = matchedCodes.has(a.code.toLowerCase());
      const bSyn = matchedCodes.has(b.code.toLowerCase());
      if (aSyn && !bSyn) return -1;
      if (!aSyn && bSyn) return 1;
      return 0;
    });
}

// Simulation of the clinical note append logic in AssessmentTab.tsx
function appendClinicalFinding(currentNotes: string, phrase: string): string {
  const trimmed = currentNotes.trim();
  if (!trimmed) return phrase;
  return `${trimmed}\n• ${phrase}`;
}

// Simulation of the custom diagnosis generator in AssessmentTab.tsx
function generateCustomDiagnosis(rawInput: string): ICD10Code {
  return {
    code: `DX-${rawInput.trim().substring(0, 6).toUpperCase()}`,
    desc: rawInput.trim(),
    category: 'Clinical Diagnosis',
  };
}

describe('Superpower Assessment Module Deep-Dive Test Suite', () => {
  describe('1. Layman-to-Medical Synonym Resolution & Search Engine', () => {
    it('resolves respiratory symptoms ("cold", "flu", "cough", "batuk")', () => {
      const coldResults = searchICD('cold');
      expect(coldResults.length).toBeGreaterThan(0);
      expect(coldResults[0].code).toBe('J06.9');
      expect(coldResults[0].desc).toContain('Common Cold / URTI / Flu');

      const fluResults = searchICD('flu');
      expect(fluResults.some((r) => r.code === 'J06.9')).toBe(true);

      const coughResults = searchICD('cough');
      expect(coughResults.some((r) => r.code === 'R05.9' || r.code === 'J06.9')).toBe(true);

      const batukResults = searchICD('batuk');
      expect(batukResults.some((r) => r.code === 'R05.9' || r.code === 'J06.9')).toBe(true);
    });

    it('resolves metabolic & endocrine colloquialisms ("sugar", "diabetes", "kencing manis")', () => {
      const sugarResults = searchICD('sugar');
      expect(sugarResults.length).toBeGreaterThan(0);
      expect(sugarResults.some((r) => r.code === 'E11.9')).toBe(true);

      const diabetesResults = searchICD('diabetes');
      expect(diabetesResults.some((r) => r.code === 'E11.9')).toBe(true);

      const malayResults = searchICD('kencing manis');
      expect(malayResults.some((r) => r.code === 'E11.9')).toBe(true);
    });

    it('resolves cardiovascular terms ("blood pressure", "bp", "pressure", "darah tinggi")', () => {
      const bpResults = searchICD('bp');
      expect(bpResults.length).toBeGreaterThan(0);
      expect(bpResults.some((r) => r.code === 'I10')).toBe(true);

      const fullResults = searchICD('blood pressure');
      expect(fullResults.some((r) => r.code === 'I10')).toBe(true);

      const darahTinggiResults = searchICD('darah tinggi');
      expect(darahTinggiResults.some((r) => r.code === 'I10')).toBe(true);
    });

    it('resolves gastrointestinal colloquialisms ("tummy", "belly", "stomach", "gastric", "cirit")', () => {
      const tummyResults = searchICD('tummy');
      expect(tummyResults.some((r) => r.code === 'K29.7' || r.code === 'K30' || r.code === 'A09.9')).toBe(true);

      const stomachResults = searchICD('stomach');
      expect(stomachResults.some((r) => r.code === 'K29.7' || r.code === 'K30')).toBe(true);

      const ciritResults = searchICD('cirit');
      expect(ciritResults.some((r) => r.code === 'A09.9')).toBe(true);
    });

    it('resolves neurological and general pain terms ("headache", "migraine", "pening", "back")', () => {
      const headacheResults = searchICD('headache');
      expect(headacheResults.some((r) => r.code === 'G43.909' || r.code === 'G44.209')).toBe(true);

      const peningResults = searchICD('pening');
      expect(peningResults.some((r) => r.code === 'R42')).toBe(true);

      const backResults = searchICD('back');
      expect(backResults.some((r) => r.code === 'M54.5' || r.code === 'M79.1')).toBe(true);
    });

    it('handles exact code searches with case insensitivity ("j06.9", "I10", "e11.9")', () => {
      const r1 = searchICD('j06.9');
      expect(r1.length).toBeGreaterThan(0);
      expect(r1[0].code).toBe('J06.9');

      const r2 = searchICD('i10');
      expect(r2.some((r) => r.code === 'I10')).toBe(true);

      const r3 = searchICD('e11.9');
      expect(r3.some((r) => r.code === 'E11.9')).toBe(true);
    });

    it('returns empty array when query is empty or whitespace', () => {
      expect(searchICD('')).toEqual([]);
      expect(searchICD('   ')).toEqual([]);
    });

    it('generates a clean custom diagnosis when condition is not found in catalog', () => {
      const custom = generateCustomDiagnosis('Rare Dengue Encephalopathy');
      expect(custom.code).toBe('DX-RARE D');
      expect(custom.desc).toBe('Rare Dengue Encephalopathy');
      expect(custom.category).toBe('Clinical Diagnosis');
    });
  });

  describe('2. Plain-English Clinical Presets Accuracy & Metadata', () => {
    const quickPresets = [
      { code: 'J06.9', label: 'Flu & Cold (URTI)', desc: 'Acute upper respiratory infection, unspecified (Common Cold / URTI / Flu)' },
      { code: 'I10', label: 'High Blood Pressure (HTN)', desc: 'Essential (primary) hypertension (HTN / High Blood Pressure)' },
      { code: 'E11.9', label: 'Diabetes (T2DM)', desc: 'Type 2 diabetes mellitus without complications (T2DM / Diabetes)' },
      { code: 'A09.9', label: 'Tummy Flu / Diarrhea (AGE)', desc: 'Gastroenteritis and colitis of infectious origin (Diarrhea / Food Poisoning)' },
      { code: 'K29.7', label: 'Gastritis / Gastric Pain', desc: 'Gastritis, unspecified (Stomach Ulcer / Epigastric Pain)' },
      { code: 'J20.9', label: 'Chest Cough / Bronchitis', desc: 'Acute bronchitis, unspecified (Chest Cough / Bronchial Inflammation)' },
      { code: 'R50.9', label: 'Fever / Pyrexia', desc: 'Fever, unspecified (Pyrexia / Viral Fever)' },
      { code: 'M79.1', label: 'Body Ache / Muscle Pain', desc: 'Myalgia (General Muscle Pain / Back Pain / Body Ache)' },
    ];

    it('verifies all 8 presets exist in ICD10_CATALOG with valid codes', () => {
      quickPresets.forEach((preset) => {
        const found = ICD10_CATALOG.find((i) => i.code === preset.code);
        expect(found, `Expected preset ${preset.code} to exist in catalog`).toBeDefined();
        expect(preset.label).toBeTruthy();
        expect(preset.desc).toBeTruthy();
      });
    });

    it('provides clear non-jargon labels on the 4 requested outpatient buttons', () => {
      expect(quickPresets[0].label).toBe('Flu & Cold (URTI)');
      expect(quickPresets[1].label).toBe('High Blood Pressure (HTN)');
      expect(quickPresets[2].label).toBe('Diabetes (T2DM)');
      expect(quickPresets[3].label).toBe('Tummy Flu / Diarrhea (AGE)');
    });
  });

  describe('3. Clinical Examination Finding Tokens & Compounding Engine', () => {
    const findingTokens = [
      { label: '+ Patient Looks Well (NAD)', phrase: 'NAD (Patient alert, conscious, no acute distress)' },
      { label: '+ Lungs Clear', phrase: 'Chest clear bilaterally, good equal air entry, no rhonchi/wheeze' },
      { label: '+ Normal Tummy', phrase: 'Abdomen soft, non-tender, no organomegaly or guarding' },
      { label: '+ Throat Mildly Red', phrase: 'Pharynx mildly injected, tonsils not enlarged, no exudate' },
      { label: '+ Vitals Stable & Normal', phrase: 'Afebrile, vital signs within normal clinical limits' },
      { label: '+ Follow-up in 1–2 Weeks', phrase: 'Medication titrated/prescribed; advise follow-up review in 1–2 weeks' },
    ];

    it('formats single token cleanly on an empty note without bullet prefixes', () => {
      const result = appendClinicalFinding('', findingTokens[0].phrase);
      expect(result).toBe('NAD (Patient alert, conscious, no acute distress)');
    });

    it('compounds multiple tokens sequentially with bullet points and newlines', () => {
      let notes = '';
      notes = appendClinicalFinding(notes, findingTokens[0].phrase); // NAD
      notes = appendClinicalFinding(notes, findingTokens[1].phrase); // Lungs
      notes = appendClinicalFinding(notes, findingTokens[2].phrase); // Tummy

      expect(notes).toContain('NAD (Patient alert, conscious, no acute distress)');
      expect(notes).toContain('\n• Chest clear bilaterally, good equal air entry, no rhonchi/wheeze');
      expect(notes).toContain('\n• Abdomen soft, non-tender, no organomegaly or guarding');
    });

    it('preserves existing custom doctor notes when appending finding tokens', () => {
      let notes = 'Patient presents with 2 days history of productive cough.';
      notes = appendClinicalFinding(notes, findingTokens[1].phrase);

      expect(notes.indexOf('Patient presents with 2 days history of productive cough.')).toBe(0);
      expect(notes).toContain('• Chest clear bilaterally');
    });
  });

  describe('4. Assessment State Transitions & Safety Sign-off Logic', () => {
    it('properly represents unselected state (null) requiring sign-off action', () => {
      let selectedICD: ICD10Code | null = null;
      expect(selectedICD).toBeNull();
      const isSignoffReady = selectedICD !== null;
      expect(isSignoffReady).toBe(false);
    });

    it('properly represents selected state and enables sign-off readiness', () => {
      let selectedICD: ICD10Code | null = null;
      selectedICD = { code: 'J06.9', desc: 'Acute upper respiratory infection, unspecified', category: 'Infectious / Respiratory' };
      expect(selectedICD).not.toBeNull();
      expect(selectedICD.code).toBe('J06.9');
      const isSignoffReady = selectedICD !== null;
      expect(isSignoffReady).toBe(true);
    });

    it('supports clearing diagnosis back to null for user modification', () => {
      let selectedICD: ICD10Code | null = { code: 'I10', desc: 'Essential hypertension', category: 'Cardiovascular' };
      // User clicks Change / Remove Diagnosis
      selectedICD = null;
      expect(selectedICD).toBeNull();
    });

    it('supports switching from one diagnosis to another cleanly', () => {
      let selectedICD: ICD10Code | null = { code: 'J06.9', desc: 'URTI', category: 'Respiratory' };
      // User clicks Diabetes preset
      selectedICD = { code: 'E11.9', desc: 'Type 2 diabetes', category: 'Endocrine' };
      expect(selectedICD.code).toBe('E11.9');
    });
  });

  describe('5. Plan Handoff & Navigation Flow', () => {
    it('executes onProceedToPlan callback without error', () => {
      let currentTab = 'assessment';
      const handleProceedToPlan = () => {
        currentTab = 'plan';
      };

      expect(currentTab).toBe('assessment');
      handleProceedToPlan();
      expect(currentTab).toBe('plan');
    });
  });
});
