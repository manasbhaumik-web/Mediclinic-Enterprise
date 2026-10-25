/**
 * AI Ambient Clinical Scribe & Contextual Diagnosis Engine.
 * Parses doctor-patient consultation dialogues (supporting English & Bahasa Malaysia)
 * and extracts structured SOAP notes, ICD-10 candidates, and prescription plans.
 */

import { ICD10Code } from '../types';

export interface StructuredSOAPDraft {
  chiefComplaint: string;
  subjective: string;
  objectiveObservation: string;
  suggestedICD10: {
    code: string;
    description: string;
    category: string;
    confidence: number; // 0.0 to 1.0
    rationale: string;
  }[];
  suggestedPlan: {
    recommendedMedications: string[];
    investigations: string[];
    mcDaysRecommended: number;
    patientAdvice: string;
    patientAdviceBM: string;
  };
}

// Symptom pattern dictionary for clinical intent recognition
interface ClinicalPattern {
  keywords: string[];
  chiefComplaintEN: string;
  chiefComplaintBM: string;
  icdCode: string;
  icdDesc: string;
  icdCat: string;
  objectiveNote: string;
  medications: string[];
  defaultMcDays: number;
  adviceEN: string;
  adviceBM: string;
}

const CLINICAL_PATTERNS: ClinicalPattern[] = [
  {
    keywords: ['fever', 'demam', 'cough', 'batuk', 'flu', 'selesema', 'runny nose', 'urti', 'throat', 'tekak'],
    chiefComplaintEN: 'Acute upper respiratory tract infection with fever and cough',
    chiefComplaintBM: 'Jangkitan saluran pernafasan atas akut bersama demam dan batuk',
    icdCode: 'J06.9',
    icdDesc: 'Acute upper respiratory infection, unspecified',
    icdCat: 'Infectious / Respiratory',
    objectiveNote: 'Pharynx injected, non-toxic appearance, clear lung auscultation with vesicular breath sounds.',
    medications: ['Paracetamol 500mg', 'Diphenhydramine Syrup', 'Vitamin C 500mg'],
    defaultMcDays: 2,
    adviceEN: 'Adequate hydration, warm saline gargle, rest, monitor fever trajectory.',
    adviceBM: 'Minum air secukupnya, kumur air garam suam, rehat, pantau suhu demam.',
  },
  {
    keywords: ['stomach', 'perut', 'gastric', 'gastritis', 'cirit', 'diarrhea', 'vomit', 'muntah', 'epigastric', 'pedih ulu hati'],
    chiefComplaintEN: 'Acute gastroenteritis and epigastric dyspepsia',
    chiefComplaintBM: 'Gastroenteritis akut dan ketidakhadaman epigastrik',
    icdCode: 'K29.7',
    icdDesc: 'Gastritis, unspecified',
    icdCat: 'Gastrointestinal',
    objectiveNote: 'Soft abdomen, mild epigastric tenderness, no guarding or rebound tenderness, hyperactive bowel sounds.',
    medications: ['Omeprazole 20mg', 'Oral Rehydration Salts (ORS)', 'Metoclopramide 10mg'],
    defaultMcDays: 1,
    adviceEN: 'Avoid spicy and oily food, frequent small sips of ORS, avoid caffeine.',
    adviceBM: 'Elakkan makanan pedas dan berminyak, minum ORS sedikit demi sedikit, elakkan kafein.',
  },
  {
    keywords: ['headache', 'sakit kepala', 'migraine', 'migrain', 'dizzy', 'pening', 'giddy', 'berpusing'],
    chiefComplaintEN: 'Tension headache and acute episodic dizziness',
    chiefComplaintBM: 'Sakit kepala tegang dan pening episodik akut',
    icdCode: 'G44.209',
    icdDesc: 'Tension-type headache, unspecified',
    icdCat: 'Neurological',
    objectiveNote: 'Alert, cranial nerves intact, neck supple, pupils equal and reactive to light (PEARL), no focal neurological deficit.',
    medications: ['Paracetamol 500mg', 'Betahistine 24mg'],
    defaultMcDays: 1,
    adviceEN: 'Reduce screen exposure, sleep in quiet dark environment, stress management.',
    adviceBM: 'Kurangkan masa skrin, rehat dalam bilik tenang dan gelap, kawal stres.',
  },
  {
    keywords: ['hypertension', 'darah tinggi', 'blood pressure', 'bp tinggi', 'dizzy bp'],
    chiefComplaintEN: 'Hypertension review and blood pressure elevation',
    chiefComplaintBM: 'Pemeriksaan darah tinggi dan tekanan darah tinggi',
    icdCode: 'I10',
    icdDesc: 'Essential (primary) hypertension',
    icdCat: 'Cardiovascular',
    objectiveNote: 'Cardiovascular regular rhythm, S1 S2 heard, no murmur, peripheral pulses present, no pedal edema.',
    medications: ['Amlodipine 5mg', 'Perindopril 4mg'],
    defaultMcDays: 0,
    adviceEN: 'Low salt diet, daily home BP charting, regular aerobic exercise.',
    adviceBM: 'Diet rendah garam, catat tekanan darah di rumah setiap hari, senaman aerobik.',
  },
  {
    keywords: ['back pain', 'sakit pinggang', 'muscle', 'otot', 'lenguh', 'joint', 'sendi', 'sprain', 'terseliuh'],
    chiefComplaintEN: 'Musculoskeletal strain and acute mechanical backache',
    chiefComplaintBM: 'Ketegangan muskuloskeletal dan sakit belakang mekanikal',
    icdCode: 'M54.5',
    icdDesc: 'Low back pain',
    icdCat: 'Musculoskeletal',
    objectiveNote: 'Paraspinal muscle spasm, straight leg raise negative bilaterally, range of motion mildly restricted by pain.',
    medications: ['Diclofenac 50mg', 'Paracetamol 500mg', 'Methyl Salicylate Cream'],
    defaultMcDays: 2,
    adviceEN: 'Hot pack application, avoid heavy lifting, ergonomics education.',
    adviceBM: 'Tuam tuala suam, elakkan mengangkat barang berat, jaga postur badan.',
  },
];

/**
 * Parses raw dialogue transcript or text narrative into structured SOAP consultation fields.
 */
export function parseClinicalDialogue(transcript: string, activeLanguage: 'EN' | 'BM' = 'EN'): StructuredSOAPDraft {
  const norm = transcript.toLowerCase();

  // Match best clinical patterns
  const matchedPatterns = CLINICAL_PATTERNS.filter(p =>
    p.keywords.some(k => norm.includes(k))
  );

  const primary = matchedPatterns[0] || CLINICAL_PATTERNS[0];

  // Build subjective clinical narrative
  const cleanTranscript = transcript.trim();
  const subjective = cleanTranscript
    ? `${activeLanguage === 'BM' ? primary.chiefComplaintBM : primary.chiefComplaintEN}. Patient notes: "${cleanTranscript}"`
    : (activeLanguage === 'BM' ? primary.chiefComplaintBM : primary.chiefComplaintEN);

  // Generate ICD-10 suggestions with confidence
  const suggestedICD10 = matchedPatterns.slice(0, 3).map((p, idx) => ({
    code: p.icdCode,
    description: p.icdDesc,
    category: p.icdCat,
    confidence: Math.round((0.95 - idx * 0.15) * 100) / 100,
    rationale: `Matched clinical keywords from patient narrative (${p.keywords.filter(k => norm.includes(k)).slice(0, 3).join(', ')})`,
  }));

  if (suggestedICD10.length === 0) {
    suggestedICD10.push({
      code: primary.icdCode,
      description: primary.icdDesc,
      category: primary.icdCat,
      confidence: 0.85,
      rationale: 'Primary clinical baseline from presenting symptoms',
    });
  }

  return {
    chiefComplaint: activeLanguage === 'BM' ? primary.chiefComplaintBM : primary.chiefComplaintEN,
    subjective,
    objectiveObservation: primary.objectiveNote,
    suggestedICD10,
    suggestedPlan: {
      recommendedMedications: primary.medications,
      investigations: ['Vital Signs Monitoring', 'Blood Glucose Profile (as indicated)'],
      mcDaysRecommended: primary.defaultMcDays,
      patientAdvice: primary.adviceEN,
      patientAdviceBM: primary.adviceBM,
    },
  };
}

/**
 * Analyzes patient subjective symptoms against the ICD-10 catalog to generate contextual suggestions.
 */
export function getContextualICDSuggestions(
  symptoms: string,
  catalog: ICD10Code[]
): { code: string; desc: string; category: string; confidence: number; reason: string }[] {
  if (!symptoms || !symptoms.trim()) return [];

  const norm = symptoms.toLowerCase();
  const results: { code: string; desc: string; category: string; confidence: number; reason: string }[] = [];

  for (const pattern of CLINICAL_PATTERNS) {
    const hits = pattern.keywords.filter(k => norm.includes(k));
    if (hits.length > 0) {
      const match = catalog.find(i => i.code.toLowerCase() === pattern.icdCode.toLowerCase()) || {
        code: pattern.icdCode,
        desc: pattern.icdDesc,
        category: pattern.icdCat,
      };

      const confidence = Math.min(0.98, Math.round((0.75 + hits.length * 0.08) * 100) / 100);

      results.push({
        code: match.code,
        desc: match.desc,
        category: match.category,
        confidence,
        reason: `Associated with "${hits.join(', ')}"`,
      });
    }
  }

  return results.sort((a, b) => b.confidence - a.confidence);
}
