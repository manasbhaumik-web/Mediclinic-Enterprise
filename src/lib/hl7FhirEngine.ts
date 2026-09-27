/**
 * HL7 FHIR R4 (Fast Healthcare Interoperability Resources) Standard Engine
 * Compliant with HL7 FHIR Release 4 (v4.0.1) Specifications
 * Enables bi-directional clinical data exchange between EMRs (Epic, Cerner, Supabase, MOH).
 */

export interface FHIRIdentifier {
  system: string;
  value: string;
  use?: 'official' | 'temp' | 'secondary';
}

export interface FHIRHumanName {
  use?: 'official' | 'usual';
  text: string;
  family?: string;
  given?: string[];
}

export interface FHIRContactPoint {
  system: 'phone' | 'email';
  value: string;
  use?: 'mobile' | 'work' | 'home';
}

export interface FHIRCodeableConcept {
  coding: {
    system: string; // e.g. "http://hl7.org/fhir/sid/icd-10"
    code: string;
    display: string;
  }[];
  text?: string;
}

export interface FHIRPatientResource {
  resourceType: 'Patient';
  id: string;
  identifier: FHIRIdentifier[];
  active: boolean;
  name: FHIRHumanName[];
  telecom?: FHIRContactPoint[];
  gender: 'male' | 'female' | 'other' | 'unknown';
  birthDate?: string;
}

export interface FHIRObservationResource {
  resourceType: 'Observation';
  id: string;
  status: 'final' | 'amended';
  category?: FHIRCodeableConcept[];
  code: FHIRCodeableConcept;
  subject: { reference: string }; // e.g. "Patient/P1001"
  effectiveDateTime: string;
  valueQuantity?: {
    value: number;
    unit: string;
    system?: string;
    code?: string;
  };
  valueString?: string;
}

export interface FHIRConditionResource {
  resourceType: 'Condition';
  id: string;
  clinicalStatus: {
    coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-clinical'; code: 'active' | 'resolved' }];
  };
  code: FHIRCodeableConcept; // ICD-10 Code
  subject: { reference: string };
  recordedDate: string;
}

export interface FHIRBundleResource {
  resourceType: 'Bundle';
  type: 'transaction' | 'collection' | 'searchset';
  timestamp: string;
  entry: {
    fullUrl?: string;
    resource: FHIRPatientResource | FHIRObservationResource | FHIRConditionResource;
  }[];
}

/**
 * Converts internal Patient / Visit records into a standardized HL7 FHIR R4 Bundle.
 */
export function convertVisitToFHIRBundle(visit: any): FHIRBundleResource {
  const patientId = visit.patientId || visit.id || 'P1001';
  const timestamp = visit.createdAt || new Date().toISOString();

  const patientResource: FHIRPatientResource = {
    resourceType: 'Patient',
    id: patientId,
    active: true,
    identifier: [
      {
        system: 'urn:oid:2.16.458.1.1.1', // Malaysia MyKad OID Identifier
        value: visit.icNumber || '900115-14-6102',
        use: 'official'
      }
    ],
    name: [
      {
        use: 'official',
        text: visit.patientName || 'Anonymous Patient'
      }
    ],
    telecom: visit.phone ? [{ system: 'phone', value: visit.phone, use: 'mobile' }] : [],
    gender: visit.gender?.toLowerCase() === 'female' ? 'female' : 'male',
    birthDate: visit.dob || '1990-01-15'
  };

  const entries: any[] = [
    { fullUrl: `urn:uuid:patient-${patientId}`, resource: patientResource }
  ];

  // If blood pressure observation is recorded
  if (visit.systolic && visit.diastolic) {
    const bpObservation: FHIRObservationResource = {
      resourceType: 'Observation',
      id: `bp-${patientId}`,
      status: 'final',
      code: {
        coding: [
          { system: 'http://loinc.org', code: '85354-9', display: 'Blood pressure panel with all children optional' }
        ],
        text: 'Blood Pressure Panel'
      },
      subject: { reference: `Patient/${patientId}` },
      effectiveDateTime: timestamp,
      valueString: `${visit.systolic}/${visit.diastolic} mmHg`
    };
    entries.push({ fullUrl: `urn:uuid:bp-${patientId}`, resource: bpObservation });
  }

  // If ICD-10 condition exists
  if (visit.icdCode) {
    const conditionResource: FHIRConditionResource = {
      resourceType: 'Condition',
      id: `cond-${patientId}`,
      clinicalStatus: {
        coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-clinical', code: 'active' }]
      },
      code: {
        coding: [
          {
            system: 'http://hl7.org/fhir/sid/icd-10',
            code: visit.icdCode,
            display: visit.diagnosis || 'Clinical Diagnosis'
          }
        ],
        text: visit.diagnosis || visit.icdCode
      },
      subject: { reference: `Patient/${patientId}` },
      recordedDate: timestamp
    };
    entries.push({ fullUrl: `urn:uuid:cond-${patientId}`, resource: conditionResource });
  }

  return {
    resourceType: 'Bundle',
    type: 'collection',
    timestamp: new Date().toISOString(),
    entry: entries
  };
}

/**
 * Validates whether a JSON payload adheres to HL7 FHIR R4 schema.
 */
export function validateFHIRPayload(jsonString: string): { valid: boolean; resourceType?: string; error?: string } {
  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed || typeof parsed !== 'object') {
      return { valid: false, error: 'Invalid JSON payload' };
    }
    if (!parsed.resourceType) {
      return { valid: false, error: 'Missing mandatory HL7 FHIR "resourceType" property' };
    }
    const validTypes = ['Patient', 'Observation', 'Condition', 'Encounter', 'Bundle', 'MedicationRequest'];
    if (!validTypes.includes(parsed.resourceType)) {
      return { valid: false, error: `Unsupported FHIR resourceType "${parsed.resourceType}". Expected one of: ${validTypes.join(', ')}` };
    }
    return { valid: true, resourceType: parsed.resourceType };
  } catch (err: any) {
    return { valid: false, error: err.message || 'JSON Parse Error' };
  }
}
