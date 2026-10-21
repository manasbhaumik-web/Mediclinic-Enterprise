/**
 * Strict FHIR R4 transaction bundle for a completed encounter, built from database rows.
 *
 * Unlike the playground builder in src/lib/hl7FhirEngine.ts, this never invents data: a missing
 * required field is an error, so a placeholder patient can never be sent to an external system.
 * Pure TypeScript with no Deno globals, so it can be unit tested.
 */

export interface PatientRow {
  id: string;
  full_name: string;
  ic_number?: string | null;
  gender?: string | null;
  dob?: string | null;
  phone?: string | null;
}

export interface VisitRow {
  id: string;
  patient_id: string;
  status: string;
  visit_date?: string | null;
  date?: string | null;
}

export interface SoapRow {
  icd_code?: string | null;
  description?: string | null;
  bp_systolic?: number | null;
  bp_diastolic?: number | null;
  heart_rate?: number | null;
  temperature?: number | null;
  respiratory_rate?: number | null;
}

export interface FhirOptions {
  /** Include the national ID (NRIC) as an identifier. Off by default: send only what the receiver needs. */
  sendNric?: boolean;
}

export class FhirBuildError extends Error {
  constructor(public missing: string[]) {
    super(`Cannot build FHIR bundle, missing: ${missing.join(', ')}`);
  }
}

const GENDERS: Record<string, 'male' | 'female'> = { male: 'male', lelaki: 'male', female: 'female', perempuan: 'female' };

interface BundleEntry { fullUrl: string; resource: Record<string, unknown>; request: { method: 'PUT'; url: string } }

const entry = (type: string, id: string, resource: Record<string, unknown>): BundleEntry => ({
  fullUrl: `urn:uuid:${id}`,
  resource: { resourceType: type, id, ...resource },
  request: { method: 'PUT', url: `${type}/${id}` },
});

export function buildEncounterBundle(patient: PatientRow, visit: VisitRow, soap: SoapRow | null, options: FhirOptions = {}) {
  const missing: string[] = [];
  if (!patient.id) missing.push('patient.id');
  if (!patient.full_name) missing.push('patient.full_name');
  const gender = patient.gender ? GENDERS[patient.gender.toLowerCase()] : undefined;
  if (!gender) missing.push('patient.gender');
  if (!patient.dob) missing.push('patient.dob');
  if (!visit.id) missing.push('visit.id');
  const when = visit.visit_date ?? visit.date;
  if (!when) missing.push('visit.visit_date');
  if (missing.length) throw new FhirBuildError(missing);

  const subject = { reference: `Patient/${patient.id}` };
  const encounter = { reference: `Encounter/${visit.id}` };
  const entries: BundleEntry[] = [];

  entries.push(entry('Patient', patient.id, {
    active: true,
    identifier: options.sendNric && patient.ic_number
      ? [{ system: 'urn:oid:2.16.458.1.1.1', value: patient.ic_number, use: 'official' }]
      : [],
    name: [{ use: 'official', text: patient.full_name }],
    telecom: patient.phone ? [{ system: 'phone', value: patient.phone }] : [],
    gender,
    birthDate: patient.dob,
  }));

  entries.push(entry('Encounter', visit.id, {
    status: 'finished',
    class: { system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode', code: 'AMB', display: 'ambulatory' },
    subject,
    period: { start: when },
  }));

  if (soap?.icd_code) {
    entries.push(entry('Condition', `${visit.id}-dx`, {
      clinicalStatus: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-clinical', code: 'active' }] },
      code: {
        coding: [{ system: 'http://hl7.org/fhir/sid/icd-10', code: soap.icd_code, display: soap.description ?? undefined }],
        text: soap.description ?? soap.icd_code,
      },
      subject,
      encounter,
      recordedDate: when,
    }));
  }

  const vital = (suffix: string, loinc: string, display: string, value: number | null | undefined, unit: string, ucum: string) => {
    if (value === null || value === undefined || !(value > 0)) return;
    entries.push(entry('Observation', `${visit.id}-${suffix}`, {
      status: 'final',
      category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'vital-signs' }] }],
      code: { coding: [{ system: 'http://loinc.org', code: loinc, display }] },
      subject,
      encounter,
      effectiveDateTime: when,
      valueQuantity: { value, unit, system: 'http://unitsofmeasure.org', code: ucum },
    }));
  };
  vital('hr', '8867-4', 'Heart rate', soap?.heart_rate, 'beats/min', '/min');
  vital('temp', '8310-5', 'Body temperature', soap?.temperature, 'Cel', 'Cel');
  vital('rr', '9279-1', 'Respiratory rate', soap?.respiratory_rate, 'breaths/min', '/min');

  if (soap?.bp_systolic && soap.bp_systolic > 0 && soap.bp_diastolic && soap.bp_diastolic > 0) {
    const component = (loinc: string, display: string, value: number) => ({
      code: { coding: [{ system: 'http://loinc.org', code: loinc, display }] },
      valueQuantity: { value, unit: 'mmHg', system: 'http://unitsofmeasure.org', code: 'mm[Hg]' },
    });
    entries.push(entry('Observation', `${visit.id}-bp`, {
      status: 'final',
      category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'vital-signs' }] }],
      code: { coding: [{ system: 'http://loinc.org', code: '85354-9', display: 'Blood pressure panel' }] },
      subject,
      encounter,
      effectiveDateTime: when,
      component: [component('8480-6', 'Systolic blood pressure', soap.bp_systolic), component('8462-4', 'Diastolic blood pressure', soap.bp_diastolic)],
    }));
  }

  return { resourceType: 'Bundle', type: 'transaction', entry: entries };
}
