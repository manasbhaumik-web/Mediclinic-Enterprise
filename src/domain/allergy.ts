/** Drug allergies worth checking: blank entries and "none" mean the patient has no known allergy. */
export function recordedAllergies(allergies: readonly string[] | null | undefined): string[] {
  return (allergies ?? []).map((a) => a.trim()).filter((a) => a !== '' && a.toLowerCase() !== 'none');
}

/** True when the drug name contains a recorded allergen (case-insensitive). */
export function conflictsWithAllergy(drugName: string, allergies: readonly string[] | null | undefined): boolean {
  const name = drugName.toLowerCase();
  return recordedAllergies(allergies).some((a) => name.includes(a.toLowerCase()));
}
