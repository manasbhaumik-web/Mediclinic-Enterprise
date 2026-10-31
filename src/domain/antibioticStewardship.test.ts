import { describe, it, expect } from 'vitest';
import { 
  isAntibioticDrug, 
  findMatchingViralCondition, 
  auditAntimicrobialPrescription,
  MONITORED_ANTIBIOTICS,
  VALID_CLINICAL_JUSTIFICATIONS 
} from './antibioticStewardship';

describe('Malaysian National Antimicrobial Guideline (NAG) Stewardship Engine', () => {
  it('correctly identifies monitored systemic antibiotics by generic or brand name', () => {
    expect(isAntibioticDrug('Amoxicillin 500mg Capsule')).toBe(true);
    expect(isAntibioticDrug('Augmentin 625mg Tablet')).toBe(true);
    expect(isAntibioticDrug('Zithromax 250mg')).toBe(true);
    expect(isAntibioticDrug('Cravit (Levofloxacin) 500mg')).toBe(true);
    expect(isAntibioticDrug('Paracetamol 500mg Tablet')).toBe(false);
    expect(isAntibioticDrug('Cetirizine 10mg')).toBe(false);
  });

  it('matches viral ICD-10 codes requiring antibiotic stewardship scrutiny', () => {
    const urtiRule = findMatchingViralCondition('J06.9');
    expect(urtiRule).toBeDefined();
    expect(urtiRule?.conditionName).toContain('Upper Respiratory Tract Infection');

    const ageRule = findMatchingViralCondition('A09.9');
    expect(ageRule).toBeDefined();
    expect(ageRule?.conditionName).toContain('Gastroenteritis');

    const bacterialRule = findMatchingViralCondition('L02.9'); // Cutaneous abscess
    expect(bacterialRule).toBeUndefined();
  });

  it('flags stewardship alert when prescribing Augmentin for J06.9 URTI without justification', () => {
    const result = auditAntimicrobialPrescription(
      [{ code: 'J06.9', name: 'Acute upper respiratory infection, unspecified' }],
      ['Augmentin 625mg Tablet', 'Paracetamol 500mg']
    );

    expect(result.requiresStewardshipReview).toBe(true);
    expect(result.prescribedAntibiotics).toContain('Augmentin 625mg Tablet');
    expect(result.triggeringDiagnoses).toHaveLength(1);
    expect(result.recommendedAlternatives.length).toBeGreaterThan(0);
    expect(result.justificationRequired).toBe(true);
  });

  it('does NOT flag stewardship when non-antibiotics are prescribed for viral conditions', () => {
    const result = auditAntimicrobialPrescription(
      [{ code: 'J06.9', name: 'Acute upper respiratory infection, unspecified' }],
      ['Paracetamol 500mg', 'Loratadine 10mg']
    );

    expect(result.requiresStewardshipReview).toBe(false);
    expect(result.prescribedAntibiotics).toHaveLength(0);
  });

  it('does NOT flag stewardship when antibiotics are prescribed for bacterial conditions', () => {
    const result = auditAntimicrobialPrescription(
      [{ code: 'N39.0', name: 'Urinary tract infection, site not specified' }],
      ['Ciprofloxacin 500mg Tablet']
    );

    expect(result.requiresStewardshipReview).toBe(false);
    expect(result.triggeringDiagnoses).toHaveLength(0);
  });

  it('contains comprehensive KKM NAG clinical justifications', () => {
    expect(VALID_CLINICAL_JUSTIFICATIONS.length).toBeGreaterThanOrEqual(5);
    expect(VALID_CLINICAL_JUSTIFICATIONS.some(j => j.includes('Centor'))).toBe(true);
    expect(VALID_CLINICAL_JUSTIFICATIONS.some(j => j.includes('secondary bacterial superinfection'))).toBe(true);
  });
});
