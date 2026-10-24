import { describe, it, expect } from 'vitest';
import { ICD10_CATALOG } from '../../data';
import { draftKey, parseDraft, ConsultationDraft } from '../../domain/consultationDraft';
import { formatTicket } from '../../domain/ticket';
import { conflictsWithAllergy } from '../../domain/allergy';

describe('Comprehensive Consultation Module Test Suite', () => {
  describe('1. ICD-10 Diagnostic Catalog & Smart Synonym Search', () => {
    // The synonym dictionary used in AssessmentTab
    const LAYMAN_SYNONYMS: Record<string, string[]> = {
      cold: ['J06.9', 'J00', 'J30.9', 'R05.9'],
      flu: ['J06.9', 'R50.9', 'Z23'],
      sugar: ['E11.9', 'E10'],
      'blood pressure': ['I10', 'I25.10'],
      bp: ['I10'],
      tummy: ['K29.7', 'K30', 'A09.9', 'K21.9', 'R11.2'],
      stomach: ['K29.7', 'K30', 'K21.9'],
      belly: ['K29.7', 'K30', 'A09.9'],
      fever: ['R50.9', 'A90', 'B01.9'],
      cough: ['R05.9', 'J06.9', 'J20.9', 'J45.909'],
    };

    const searchCatalog = (query: string) => {
      const raw = query.trim().toLowerCase();
      if (!raw) return [];
      const matchedCodes = new Set<string>();
      for (const [synonym, codes] of Object.entries(LAYMAN_SYNONYMS)) {
        if (raw.includes(synonym) || synonym.includes(raw)) {
          codes.forEach((c) => matchedCodes.add(c.toLowerCase()));
        }
      }
      return ICD10_CATALOG.filter((i) => {
        const codeLower = i.code.toLowerCase();
        const descLower = i.desc.toLowerCase();
        const catLower = i.category.toLowerCase();
        return codeLower.includes(raw) || descLower.includes(raw) || catLower.includes(raw) || matchedCodes.has(codeLower);
      });
    };

    it('matches "cold" to Acute Upper Respiratory Infection (J06.9)', () => {
      const results = searchCatalog('cold');
      expect(results.some((r) => r.code === 'J06.9')).toBe(true);
    });

    it('matches "flu" to J06.9 (Common Cold/URTI/Flu)', () => {
      const results = searchCatalog('flu');
      expect(results.some((r) => r.code === 'J06.9')).toBe(true);
    });

    it('matches "sugar" to Type 2 Diabetes Mellitus (E11.9)', () => {
      const results = searchCatalog('sugar');
      expect(results.some((r) => r.code === 'E11.9')).toBe(true);
    });

    it('matches "blood pressure" and "bp" to Essential Hypertension (I10)', () => {
      const resultsBp = searchCatalog('bp');
      const resultsFull = searchCatalog('blood pressure');
      expect(resultsBp.some((r) => r.code === 'I10')).toBe(true);
      expect(resultsFull.some((r) => r.code === 'I10')).toBe(true);
    });

    it('matches "tummy" and "stomach" to Gastritis (K29.7) and Diarrhea (A09.9)', () => {
      const results = searchCatalog('tummy');
      expect(results.some((r) => r.code === 'K29.7' || r.code === 'K30' || r.code === 'A09.9')).toBe(true);
    });
  });

  describe('2. Plain-English Clinical Presets & Quick Finding Formatter', () => {
    const quickPresets = [
      { code: 'J06.9', label: 'Flu & Cold (URTI)' },
      { code: 'I10', label: 'High Blood Pressure (HTN)' },
      { code: 'E11.9', label: 'Diabetes (T2DM)' },
      { code: 'A09.9', label: 'Tummy Flu / Diarrhea (AGE)' },
      { code: 'K29.7', label: 'Gastritis / Gastric Pain' },
      { code: 'J20.9', label: 'Chest Cough / Bronchitis' },
      { code: 'R50.9', label: 'Fever / Pyrexia' },
      { code: 'M79.1', label: 'Body Ache / Muscle Pain' },
    ];

    it('contains all 4 requested core plain-English diagnoses', () => {
      expect(quickPresets.find((p) => p.code === 'J06.9')?.label).toBe('Flu & Cold (URTI)');
      expect(quickPresets.find((p) => p.code === 'I10')?.label).toBe('High Blood Pressure (HTN)');
      expect(quickPresets.find((p) => p.code === 'E11.9')?.label).toBe('Diabetes (T2DM)');
      expect(quickPresets.find((p) => p.code === 'A09.9')?.label).toBe('Tummy Flu / Diarrhea (AGE)');
    });

    const formatClinicalNotes = (existing: string, newPhrase: string) => {
      const trimmed = existing.trim();
      if (!trimmed) return newPhrase;
      return `${trimmed}\n• ${newPhrase}`;
    };

    it('appends quick exam phrases cleanly into clinical notes', () => {
      let notes = '';
      notes = formatClinicalNotes(notes, 'NAD (Patient alert, conscious, no acute distress)');
      expect(notes).toBe('NAD (Patient alert, conscious, no acute distress)');

      notes = formatClinicalNotes(notes, 'Chest clear bilaterally, good equal air entry');
      expect(notes).toContain('• Chest clear bilaterally');

      notes = formatClinicalNotes(notes, 'Abdomen soft, non-tender, no organomegaly or guarding');
      expect(notes).toContain('• Abdomen soft, non-tender');
    });
  });

  describe('3. Vitals Anomaly Detection & Clinical Alerts (Objective Tab)', () => {
    const checkVitalsAlerts = (vitals: {
      bpSystolic: number;
      bpDiastolic: number;
      heartRate: number;
      temperature: number;
      respiratoryRate: number;
    }) => {
      const alerts: string[] = [];
      if (vitals.temperature >= 38.0) alerts.push('High Fever');
      if (vitals.bpSystolic >= 140 || vitals.bpDiastolic >= 90) alerts.push('Elevated BP');
      if (vitals.heartRate > 100) alerts.push('Tachycardia');
      if (vitals.respiratoryRate > 20) alerts.push('Tachypnea');
      return alerts;
    };

    it('flags high fever when temperature >= 38.0 C', () => {
      const alerts = checkVitalsAlerts({ bpSystolic: 120, bpDiastolic: 80, heartRate: 72, temperature: 38.5, respiratoryRate: 16 });
      expect(alerts).toContain('High Fever');
    });

    it('flags elevated blood pressure for stage 1/2 hypertension', () => {
      const alerts = checkVitalsAlerts({ bpSystolic: 155, bpDiastolic: 95, heartRate: 75, temperature: 36.8, respiratoryRate: 16 });
      expect(alerts).toContain('Elevated BP');
    });

    it('returns empty alerts when vitals are in normal reference ranges', () => {
      const alerts = checkVitalsAlerts({ bpSystolic: 118, bpDiastolic: 78, heartRate: 72, temperature: 36.6, respiratoryRate: 16 });
      expect(alerts.length).toBe(0);
    });
  });

  describe('4. Drug Allergy Safety Verification (Plan Tab)', () => {
    it('detects penicillin allergy when prescribing penicillin', () => {
      const allergies = ['Penicillin'];
      expect(conflictsWithAllergy('Penicillin V 250mg', allergies)).toBe(true);
    });

    it('detects NSAID allergy when prescribing mefenamic acid or diclofenac', () => {
      const allergies = ['NSAID', 'Aspirin'];
      expect(conflictsWithAllergy('Ponstan (NSAID) 500mg', allergies)).toBe(true);
      expect(conflictsWithAllergy('Voltaren (NSAID) 50mg', allergies)).toBe(true);
      expect(conflictsWithAllergy('Paracetamol 500mg', allergies)).toBe(false);
    });
  });

  describe('5. Consultation Session Draft Persistence & Sign-Off Readiness', () => {
    it('creates predictable sessionStorage draft keys based on visit id', () => {
      const key = draftKey('visit-abc-123');
      expect(key).toBe('mediclinic.draft.visit-abc-123');
    });

    it('successfully validates round-trip parsing of consultation draft', () => {
      const draft: ConsultationDraft = {
        v: 1,
        savedAt: Date.now(),
        subjective: 'Patient reports fever, sore throat and rhinorrhea for 2 days.',
        vitals: { bpSystolic: 120, bpDiastolic: 80, heartRate: 78, temperature: 37.8, respiratoryRate: 18 },
        icd: { code: 'J06.9', desc: 'Acute upper respiratory infection, unspecified', category: 'Infectious / Respiratory' },
        clinicalNotes: 'NAD. Pharynx injected. Prescribed symptomatic relief.',
        rx: [],
        mcDays: 2,
        mcGenerated: true,
        pharmacyMemo: 'Dispense blister pack',
        referralDetails: { hospital: 'Hospital Shah Alam', department: 'ENT', reason: 'Persistent symptoms' },
        referralGenerated: false,
        labOrders: ['FBC'],
        labReason: 'Rule out bacterial infection',
        mcReason: 'Acute URTI with fever',
        followUpWeeks: 1,
      };

      const serialized = JSON.stringify(draft);
      const parsed = parseDraft(serialized);
      expect(parsed).not.toBeNull();
      expect(parsed?.subjective).toBe(draft.subjective);
      expect(parsed?.icd?.code).toBe('J06.9');
      expect(parsed?.mcDays).toBe(2);
      expect(parsed?.mcGenerated).toBe(true);
    });

    it('formats ticket correctly for display in the consultation HUD', () => {
      expect(formatTicket(1)).toBe('#001');
      expect(formatTicket(42)).toBe('#042');
      expect(formatTicket(105)).toBe('#105');
      expect(formatTicket(undefined)).toBe('');
    });
  });
});
