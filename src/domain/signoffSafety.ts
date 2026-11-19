import { checkDrugSafety, type DrugSafetyAlert } from './drugSafetyEngine';
import { recordedAllergies } from './allergy';

/**
 * What the sign-off screen tells the doctor about drug safety. It is worked out from the prescription and the patient's
 * recorded allergies, never assumed: before this, the screen showed "Allergy Safety Verification Passed" whenever any
 * allergy was on file, even if the prescription conflicted with it.
 */
export type SignoffSafety = {
  /** 'none-recorded': the patient has no recorded drug allergy, so there was nothing to check against. */
  status: 'conflict' | 'clear' | 'none-recorded';
  allergies: string[];
  alerts: DrugSafetyAlert[];
  /** Lines the prescriber added anyway, with the reason they wrote. */
  overrides: { drug: string; rationale: string }[];
};

const OVERRIDE = /^(.*?)\s*\[OVERRIDDEN:\s*([\s\S]*)\]\s*$/;

/** Splits "Amoxicillin 500mg [OVERRIDDEN: tolerated before]" into the drug and the reason (the consultation stores it this way). */
export function splitOverride(drugName: string): { drug: string; rationale: string | null } {
  const m = drugName.match(OVERRIDE);
  return m ? { drug: m[1].trim(), rationale: m[2].trim() } : { drug: drugName.trim(), rationale: null };
}

export function signoffSafety(drugNames: readonly string[], allergies: readonly string[] | null | undefined): SignoffSafety {
  const recorded = recordedAllergies(allergies);
  const parts = drugNames.map(splitOverride);
  const overrides = parts.filter((p) => p.rationale !== null).map((p) => ({ drug: p.drug, rationale: p.rationale as string }));
  const result = checkDrugSafety(parts.map((p) => p.drug), recorded);
  const status: SignoffSafety['status'] = result.alerts.length > 0 ? 'conflict' : recorded.length === 0 ? 'none-recorded' : 'clear';
  return { status, allergies: recorded, alerts: result.alerts, overrides };
}
