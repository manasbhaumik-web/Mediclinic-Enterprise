import { describe, it, expect } from 'vitest';
import { parseClinicalDialogue, getContextualICDSuggestions } from './aiScribe';
import { ICD10_CATALOG } from '../data';

describe('AI Ambient Clinical Scribe & Contextual ICD Engine', () => {
  it('parses English consultation dialogue into structured SOAP', () => {
    const speech = 'Doctor, I have had high fever, dry cough, and sore throat for 3 days.';
    const soap = parseClinicalDialogue(speech, 'EN');

    expect(soap.chiefComplaint).toContain('Acute upper respiratory tract infection');
    expect(soap.subjective).toContain(speech);
    expect(soap.objectiveObservation).toContain('Pharynx injected');
    expect(soap.suggestedICD10[0].code).toBe('J06.9');
    expect(soap.suggestedPlan.recommendedMedications).toContain('Paracetamol 500mg');
    expect(soap.suggestedPlan.mcDaysRecommended).toBe(2);
  });

  it('parses Bahasa Malaysia consultation dialogue with local medical terminology', () => {
    const speech = 'Saya ada demam panas sejak semalam dan batuk berkahak tekak perit.';
    const soap = parseClinicalDialogue(speech, 'BM');

    expect(soap.chiefComplaint).toContain('Jangkitan saluran pernafasan');
    expect(soap.suggestedICD10[0].code).toBe('J06.9');
    expect(soap.suggestedPlan.patientAdviceBM).toContain('Minum air secukupnya');
  });

  it('parses gastrointestinal complaints accurately', () => {
    const speech = 'Perut saya rasa pedih sangat, gastric dan cirit birit dari pagi tadi.';
    const soap = parseClinicalDialogue(speech, 'BM');

    expect(soap.suggestedICD10[0].code).toBe('K29.7');
    expect(soap.suggestedPlan.recommendedMedications).toContain('Omeprazole 20mg');
    expect(soap.suggestedPlan.patientAdviceBM).toContain('Elakkan makanan pedas');
  });

  it('provides contextual ICD-10 suggestions with confidence scores from symptoms', () => {
    const symptoms = 'Patient c/o migraine, severe headache and photophobia for 2 days.';
    const suggestions = getContextualICDSuggestions(symptoms, ICD10_CATALOG);

    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions[0].code).toBe('G44.209');
    expect(suggestions[0].confidence).toBeGreaterThan(0.7);
    expect(suggestions[0].reason).toContain('headache');
  });

  it('returns empty array when symptom string is blank', () => {
    const suggestions = getContextualICDSuggestions('', ICD10_CATALOG);
    expect(suggestions).toEqual([]);
  });
});
