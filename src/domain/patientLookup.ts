import type { Patient, Visit } from '../types';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Patients that visits point to but the loaded patient list does not hold. The list is capped at the most
 * recent patients, so a visit of an older patient would show an unknown name and have no allergies to check.
 * Ids that are not database ids (sample data) are left out, and the result is sorted and without repeats.
 */
export function missingPatientIds(known: readonly Patient[], visits: readonly Visit[]): string[] {
  const have = new Set(known.map((p) => p.id));
  return [...new Set(visits.map((v) => v.patientId))].filter((id) => !have.has(id) && UUID.test(id)).sort();
}
