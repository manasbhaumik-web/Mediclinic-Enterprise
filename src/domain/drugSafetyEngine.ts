/**
 * Clinical Drug Safety & Cross-Sensitivity Interaction Engine.
 * Analyzes prescription lists against patient allergies and cross-drug contraindications.
 */

export interface DrugSafetyAlert {
  id: string;
  type: 'allergy' | 'drug-interaction' | 'duplicate-class';
  severity: 'contraindicated' | 'major' | 'moderate';
  drugA: string;
  drugB?: string;
  allergen?: string;
  title: string;
  description: string;
  recommendation: string;
}

export interface DrugSafetyResult {
  hasAlerts: boolean;
  hasContraindications: boolean;
  hasMajor: boolean;
  alerts: DrugSafetyAlert[];
}

// Normalized drug class mappings
const DRUG_CLASSES: Record<string, { class: string; crossClasses?: string[] }> = {
  // Penicillins
  penicillin: { class: 'penicillin', crossClasses: ['cephalosporin'] },
  amoxicillin: { class: 'penicillin', crossClasses: ['cephalosporin'] },
  augmentin: { class: 'penicillin', crossClasses: ['cephalosporin'] },
  ampicillin: { class: 'penicillin', crossClasses: ['cephalosporin'] },
  cloxacillin: { class: 'penicillin', crossClasses: ['cephalosporin'] },

  // Cephalosporins
  cephalexin: { class: 'cephalosporin', crossClasses: ['penicillin'] },
  cefuroxime: { class: 'cephalosporin', crossClasses: ['penicillin'] },
  ceftriaxone: { class: 'cephalosporin', crossClasses: ['penicillin'] },

  // NSAIDs
  aspirin: { class: 'nsaid' },
  ibuprofen: { class: 'nsaid' },
  'mefenamic acid': { class: 'nsaid' },
  ponstan: { class: 'nsaid' },
  diclofenac: { class: 'nsaid' },
  voltaren: { class: 'nsaid' },
  naproxen: { class: 'nsaid' },
  celecoxib: { class: 'nsaid' },

  // Anticoagulants
  warfarin: { class: 'anticoagulant' },
  heparin: { class: 'anticoagulant' },
  rivaroxaban: { class: 'anticoagulant' },
  dabigatran: { class: 'anticoagulant' },

  // Antithrombotics
  clopidogrel: { class: 'antiplatelet' },
  plavix: { class: 'antiplatelet' },

  // PPIs
  omeprazole: { class: 'ppi' },
  pantoprazole: { class: 'ppi' },
  esomeprazole: { class: 'ppi' },

  // Statins
  simvastatin: { class: 'statin' },
  atorvastatin: { class: 'statin' },
  rosuvastatin: { class: 'statin' },

  // Macrolides
  clarithromycin: { class: 'macrolide' },
  erythromycin: { class: 'macrolide' },
  azithromycin: { class: 'macrolide' },

  // Sulfa
  bactrim: { class: 'sulfa' },
  cotrimoxazole: { class: 'sulfa' },
  sulfamethoxazole: { class: 'sulfa' },

  // Antidiabetic
  metformin: { class: 'biguanide' },

  // Paracetamol
  paracetamol: { class: 'paracetamol' },
  panadol: { class: 'paracetamol' },

  // Opioids
  tramadol: { class: 'opioid' },
  codeine: { class: 'opioid' },
};

function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, ' ').trim();
}

function matchDrugClass(drugName: string): { key: string; class: string; crossClasses?: string[] } | null {
  const norm = normalizeName(drugName);
  for (const [key, info] of Object.entries(DRUG_CLASSES)) {
    if (norm.includes(key)) {
      return { key, ...info };
    }
  }
  return null;
}

/**
 * Checks a prescription list against patient known allergies and concurrent drug interactions.
 */
export function checkDrugSafety(
  prescribedDrugNames: string[],
  patientAllergies: string[] = []
): DrugSafetyResult {
  const alerts: DrugSafetyAlert[] = [];

  const normalizedAllergies = patientAllergies.map(a => normalizeName(a));

  // 1. ALLERGY & CROSS-ALLERGY CHECKS
  for (const drugName of prescribedDrugNames) {
    const matched = matchDrugClass(drugName);
    const normDrug = normalizeName(drugName);

    for (const allergen of normalizedAllergies) {
      if (!allergen) continue;

      // Exact or direct match
      if (normDrug.includes(allergen) || allergen.includes(normDrug)) {
        alerts.push({
          id: `allergy-${drugName}-${allergen}`,
          type: 'allergy',
          severity: 'contraindicated',
          drugA: drugName,
          allergen,
          title: `Direct Allergy Conflict: ${drugName}`,
          description: `Patient has documented allergy to "${allergen}". Prescribing ${drugName} carries severe anaphylaxis risk.`,
          recommendation: `Do not dispense. Select an alternative non-cross-reacting medication class.`,
        });
        continue;
      }

      // Class match
      if (matched) {
        if (matched.class === allergen || allergen.includes(matched.class)) {
          alerts.push({
            id: `allergy-class-${drugName}-${allergen}`,
            type: 'allergy',
            severity: 'contraindicated',
            drugA: drugName,
            allergen,
            title: `Allergy Class Conflict: ${drugName} (${matched.class})`,
            description: `Patient is allergic to ${allergen}. ${drugName} belongs to the ${matched.class} family.`,
            recommendation: `Contraindicated. Replace with a different therapeutic antibiotic/analgesic class.`,
          });
        } else if (matched.crossClasses?.some(cc => allergen.includes(cc) || cc.includes(allergen))) {
          // Cross-sensitivity caution (e.g. Penicillin -> Cephalosporin)
          alerts.push({
            id: `cross-allergy-${drugName}-${allergen}`,
            type: 'allergy',
            severity: 'major',
            drugA: drugName,
            allergen,
            title: `Cross-Sensitivity Warning: ${drugName}`,
            description: `Patient is allergic to ${allergen}. ${drugName} carries up to 10% cross-allergenicity.`,
            recommendation: `Exercise clinical vigilance. Verify previous tolerance before administration.`,
          });
        }
      }
    }
  }

  // 2. DRUG-DRUG INTERACTIONS (Pairwise)
  const drugCount = prescribedDrugNames.length;
  for (let i = 0; i < drugCount; i++) {
    for (let j = i + 1; j < drugCount; j++) {
      const drugA = prescribedDrugNames[i];
      const drugB = prescribedDrugNames[j];
      const matchA = matchDrugClass(drugA);
      const matchB = matchDrugClass(drugB);

      if (!matchA || !matchB) continue;

      const classA = matchA.class;
      const classB = matchB.class;

      // Rule: Double NSAID Prescribing
      if (classA === 'nsaid' && classB === 'nsaid') {
        alerts.push({
          id: `ddi-duplicate-nsaid-${i}-${j}`,
          type: 'duplicate-class',
          severity: 'major',
          drugA,
          drugB,
          title: `Duplicate NSAID Therapy: ${drugA} + ${drugB}`,
          description: `Concurrent prescribing of multiple NSAIDs significantly increases gastrointestinal ulceration and nephrotoxicity without additional analgesic benefit.`,
          recommendation: `Retain only one NSAID or add gastroprotection (PPI).`,
        });
      }

      // Rule: Anticoagulant + NSAID
      if ((classA === 'anticoagulant' && classB === 'nsaid') || (classA === 'nsaid' && classB === 'anticoagulant')) {
        alerts.push({
          id: `ddi-anticoag-nsaid-${i}-${j}`,
          type: 'drug-interaction',
          severity: 'contraindicated',
          drugA,
          drugB,
          title: `Severe Hemorrhage Risk: ${drugA} + ${drugB}`,
          description: `Co-administration of ${drugA} with ${drugB} causes potentiation of anticoagulant effect and severe risk of GI hemorrhage.`,
          recommendation: `Contraindicated. Use Paracetamol or alternative analgesic for pain relief.`,
        });
      }

      // Rule: Statin + Macrolide
      if ((classA === 'statin' && classB === 'macrolide') || (classA === 'macrolide' && classB === 'statin')) {
        alerts.push({
          id: `ddi-statin-macrolide-${i}-${j}`,
          type: 'drug-interaction',
          severity: 'major',
          drugA,
          drugB,
          title: `Rhabdomyolysis Risk: ${drugA} + ${drugB}`,
          description: `Macrolides inhibit CYP3A4 metabolism of statins, elevating statin blood levels and increasing risk of severe myopathy.`,
          recommendation: `Temporarily suspend statin during macrolide antibiotic course or select azithromycin.`,
        });
      }

      // Rule: Clopidogrel + Omeprazole
      if ((matchA.key === 'clopidogrel' && matchB.key === 'omeprazole') || (matchA.key === 'omeprazole' && matchB.key === 'clopidogrel')) {
        alerts.push({
          id: `ddi-clopidogrel-omeprazole-${i}-${j}`,
          type: 'drug-interaction',
          severity: 'moderate',
          drugA,
          drugB,
          title: `Reduced Antiplatelet Efficacy: Clopidogrel + Omeprazole`,
          description: `Omeprazole competitively inhibits CYP2C19 activation of clopidogrel, potentially reducing cardiovascular protection.`,
          recommendation: `Consider switching to Pantoprazole or an H2-receptor antagonist.`,
        });
      }
    }
  }

  const hasContraindications = alerts.some(a => a.severity === 'contraindicated');
  const hasMajor = alerts.some(a => a.severity === 'major');

  return {
    hasAlerts: alerts.length > 0,
    hasContraindications,
    hasMajor,
    alerts,
  };
}
