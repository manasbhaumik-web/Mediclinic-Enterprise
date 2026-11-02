/**
 * Malaysian National Antimicrobial Guideline (NAG) Stewardship Engine
 * Regulates empirical antibiotic prescribing in outpatient clinics to curb antimicrobial resistance (AMR).
 */

export interface AntibioticDefinition {
  genericName: string;
  category: 'Beta-Lactam' | 'Macrolide' | 'Quinolone' | 'Tetracycline' | 'Cephalosporin' | 'Other';
  commonBrands: string[];
}

export const MONITORED_ANTIBIOTICS: AntibioticDefinition[] = [
  { genericName: 'Amoxicillin', category: 'Beta-Lactam', commonBrands: ['Amoxil', 'Ospamox'] },
  { genericName: 'Amoxicillin + Clavulanate', category: 'Beta-Lactam', commonBrands: ['Augmentin', 'Curam', 'Clavamel'] },
  { genericName: 'Azithromycin', category: 'Macrolide', commonBrands: ['Zithromax', 'Zitrocin'] },
  { genericName: 'Clarithromycin', category: 'Macrolide', commonBrands: ['Klacid'] },
  { genericName: 'Erythromycin', category: 'Macrolide', commonBrands: ['Erythrocin'] },
  { genericName: 'Cefuroxime', category: 'Cephalosporin', commonBrands: ['Zinnat', 'Ceftum'] },
  { genericName: 'Cephalexin', category: 'Cephalosporin', commonBrands: ['Keflex'] },
  { genericName: 'Ciprofloxacin', category: 'Quinolone', commonBrands: ['Ciprobay', 'Cipro'] },
  { genericName: 'Levofloxacin', category: 'Quinolone', commonBrands: ['Cravit'] },
  { genericName: 'Doxycycline', category: 'Tetracycline', commonBrands: ['Doryx', 'Vibramycin'] },
  { genericName: 'Metronidazole', category: 'Other', commonBrands: ['Flagyl'] },
  { genericName: 'Ampicillin', category: 'Beta-Lactam', commonBrands: ['Penbritin'] }
];

export interface ViralConditionRule {
  icd10Prefix: string;
  conditionName: string;
  nagRecommendation: string;
  recommendedAlternatives: string[];
}

export const VIRAL_OR_SELF_LIMITING_CONDITIONS: ViralConditionRule[] = [
  {
    icd10Prefix: 'J06',
    conditionName: 'Acute Upper Respiratory Tract Infection (Common Cold / URTI)',
    nagRecommendation: 'KKM NAG strongly discourages antibiotics for uncomplicated URTI. 90-95% are viral etiology.',
    recommendedAlternatives: ['Paracetamol / NSAIDs for fever & analgesia', 'Antihistamines / Decongestants for rhinorrhea', 'Sore throat lozenges', 'Adequate oral hydration']
  },
  {
    icd10Prefix: 'J00',
    conditionName: 'Acute Nasopharyngitis (Common Cold)',
    nagRecommendation: 'Viral etiology. Antibiotics do not hasten symptom resolution or prevent complications.',
    recommendedAlternatives: ['Normal saline nasal rinse', 'Oral analgesics', 'Warm fluids & rest']
  },
  {
    icd10Prefix: 'J20',
    conditionName: 'Acute Bronchitis',
    nagRecommendation: 'Antibiotic therapy is not indicated for acute bronchitis in immunocompetent patients without underlying COPD.',
    recommendedAlternatives: ['Inhaled bronchodilators if wheezing present', 'Honey / Antitussives', 'Rest & oral fluids']
  },
  {
    icd10Prefix: 'A09',
    conditionName: 'Infectious Gastroenteritis and Colitis, Unspecified (AGE)',
    nagRecommendation: 'Most acute watery diarrhea is viral (Rotavirus/Norovirus) or self-limiting. Oral Rehydration Solution (ORS) is the cornerstone.',
    recommendedAlternatives: ['Oral Rehydration Salts (ORS)', 'Oral zinc supplementation', 'Probiotics / Antiemetics', 'Avoid anti-motility agents if high fever']
  },
  {
    icd10Prefix: 'B34',
    conditionName: 'Viral Infection of Unspecified Site',
    nagRecommendation: 'Unspecified viral syndromes resolve spontaneously without antimicrobial intervention.',
    recommendedAlternatives: ['Supportive care & antipyretics']
  },
  {
    icd10Prefix: 'J10',
    conditionName: 'Influenza Due to Identified Seasonal Influenza Virus',
    nagRecommendation: 'Viral pathogen. Oseltamivir may be considered if within 48h for high-risk patients; antibacterials not indicated.',
    recommendedAlternatives: ['Antipyretics', 'Hydration', 'Neuraminidase inhibitor if indicated']
  },
  {
    icd10Prefix: 'J11',
    conditionName: 'Influenza, Virus Not Identified',
    nagRecommendation: 'Viral influenza-like illness. Antibacterial therapy is clinically inappropriate.',
    recommendedAlternatives: ['Antipyretics', 'Adequate fluid replacement', 'Rest']
  }
];

export const VALID_CLINICAL_JUSTIFICATIONS: string[] = [
  'Centor Score ≥ 3 (Fever >38°C, tonsillar exudates, tender anterior cervical lymphadenopathy, absence of cough)',
  'Suspected secondary bacterial superinfection (worsening purulent sputum/discharge after initial improvement > 7 days)',
  'High-risk immunocompromised host (uncontrolled Diabetes Mellitus, advanced chronic kidney disease, immunosuppression)',
  'Severe systemic toxicity / hemodynamic compromise requiring empirical antimicrobial coverage',
  'Acute Otitis Media with bulging tympanic membrane / severe otalgia in pediatric patient',
  'Underlying chronic respiratory disease (COPD / Bronchiectasis exacerbation meeting Anthonisen criteria)',
  'Positive point-of-care rapid bacterial diagnostic (Strep A / elevated CRP > 40 mg/L)'
];

export function isAntibioticDrug(drugName: string): boolean {
  const lower = drugName.toLowerCase();
  return MONITORED_ANTIBIOTICS.some(ab => 
    lower.includes(ab.genericName.toLowerCase()) || 
    ab.commonBrands.some(brand => lower.includes(brand.toLowerCase()))
  );
}

export function findMatchingViralCondition(icd10Code: string): ViralConditionRule | undefined {
  const cleanCode = icd10Code.trim().toUpperCase();
  return VIRAL_OR_SELF_LIMITING_CONDITIONS.find(rule => cleanCode.startsWith(rule.icd10Prefix));
}

export interface StewardshipCheckResult {
  requiresStewardshipReview: boolean;
  prescribedAntibiotics: string[];
  triggeringDiagnoses: { code: string; name: string; rule: ViralConditionRule }[];
  recommendedAlternatives: string[];
  justificationRequired: boolean;
}

export function auditAntimicrobialPrescription(
  diagnoses: { code: string; name: string }[],
  prescribedDrugNames: string[]
): StewardshipCheckResult {
  const prescribedAntibiotics = prescribedDrugNames.filter(isAntibioticDrug);

  if (prescribedAntibiotics.length === 0) {
    return {
      requiresStewardshipReview: false,
      prescribedAntibiotics: [],
      triggeringDiagnoses: [],
      recommendedAlternatives: [],
      justificationRequired: false
    };
  }

  const triggeringDiagnoses: { code: string; name: string; rule: ViralConditionRule }[] = [];
  const alternativesSet = new Set<string>();

  for (const dx of diagnoses) {
    const matchedRule = findMatchingViralCondition(dx.code);
    if (matchedRule) {
      triggeringDiagnoses.push({
        code: dx.code,
        name: dx.name,
        rule: matchedRule
      });
      matchedRule.recommendedAlternatives.forEach(alt => alternativesSet.add(alt));
    }
  }

  const requiresStewardshipReview = triggeringDiagnoses.length > 0;

  return {
    requiresStewardshipReview,
    prescribedAntibiotics,
    triggeringDiagnoses,
    recommendedAlternatives: Array.from(alternativesSet),
    justificationRequired: requiresStewardshipReview
  };
}
