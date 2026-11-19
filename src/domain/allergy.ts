import { checkDrugSafety } from './drugSafetyEngine';

/** Drug allergies worth checking: blank entries and "none" mean the patient has no known allergy. */
export function recordedAllergies(allergies: readonly string[] | null | undefined): string[] {
  return (allergies ?? []).map((a) => a.trim()).filter((a) => a !== '' && a.toLowerCase() !== 'none');
}

/**
 * True when the drug clashes with a recorded allergy: the allergen is in the drug name, or the drug belongs to the
 * allergen's family (amoxicillin for a penicillin allergy). Matching on the name alone missed families, so a
 * penicillin-allergic patient could be prescribed amoxicillin without any prompt.
 */
export function conflictsWithAllergy(drugName: string, allergies: readonly string[] | null | undefined): boolean {
  const recorded = recordedAllergies(allergies);
  if (recorded.length === 0) return false;
  const name = drugName.toLowerCase();
  if (recorded.some((a) => name.includes(a.toLowerCase()))) return true;
  return checkDrugSafety([drugName], recorded).alerts.some((a) => a.type === 'allergy' && a.severity === 'contraindicated');
}
