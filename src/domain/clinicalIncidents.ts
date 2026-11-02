export type IncidentCategory = 
  | 'MedicationError'
  | 'PatientFall'
  | 'NeedleStickExposure'
  | 'EquipmentMalfunction'
  | 'AdverseDrugReaction'
  | 'ProceduralComplication'
  | 'DiagnosticDelay';

export type IncidentSeverity = 
  | 'NearMiss'   // Caught before reaching the patient
  | 'NoHarm'     // Reached patient/staff, no harm resulted
  | 'MinorHarm'  // First aid / minor symptomatic treatment required
  | 'MajorHarm'  // Hospital transfer / sentinel event / OSHA reportable
  | 'Sentinel';

export type IncidentStatus = 'Logged' | 'UnderInvestigation' | 'CAPAImplemented' | 'Closed';

export interface ClinicalIncident {
  id: string;
  incidentNumber: string; // e.g. INC-2026-001
  timestamp: string; // ISO string
  location: 'ConsultationRoom' | 'TriageStation' | 'ProcedureRoom' | 'PharmacyDispensary' | 'WaitingArea' | 'Washroom';
  category: IncidentCategory;
  severity: IncidentSeverity;
  patientId?: string;
  patientName?: string;
  reporterStaffId: string;
  reporterStaffName: string;
  reporterRole: string;
  description: string;
  immediateActionTaken: string;
  rootCauseAnalysis?: string; // RCA findings
  correctivePreventiveAction?: string; // CAPA
  requiresOshaNotification: boolean; // OSHA 1994 NADOPOD (for needle-stick, acute toxic exposure)
  status: IncidentStatus;
  investigatedBy?: string;
  investigatedAt?: string;
  closedAt?: string;
}

export function generateIncidentNumber(existingIncidentsCount: number, year = new Date().getFullYear()): string {
  const seq = (existingIncidentsCount + 1).toString().padStart(3, '0');
  return `INC-${year}-${seq}`;
}

export function evaluateOshaNadopodReportability(incident: Partial<ClinicalIncident>): boolean {
  if (incident.category === 'NeedleStickExposure') return true;
  if (incident.severity === 'MajorHarm' || incident.severity === 'Sentinel') return true;
  return false;
}

export function createClinicalIncident(params: {
  category: IncidentCategory;
  severity: IncidentSeverity;
  location: ClinicalIncident['location'];
  reporterStaffId: string;
  reporterStaffName: string;
  reporterRole: string;
  description: string;
  immediateActionTaken: string;
  patientId?: string;
  patientName?: string;
  existingCount?: number;
}): ClinicalIncident {
  const oshaRequired = evaluateOshaNadopodReportability({
    category: params.category,
    severity: params.severity
  });

  return {
    id: `inc-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    incidentNumber: generateIncidentNumber(params.existingCount || 0),
    timestamp: new Date().toISOString(),
    location: params.location,
    category: params.category,
    severity: params.severity,
    patientId: params.patientId,
    patientName: params.patientName,
    reporterStaffId: params.reporterStaffId,
    reporterStaffName: params.reporterStaffName,
    reporterRole: params.reporterRole,
    description: params.description.trim(),
    immediateActionTaken: params.immediateActionTaken.trim(),
    requiresOshaNotification: oshaRequired,
    status: 'Logged',
  };
}

export function closeClinicalIncident(
  incident: ClinicalIncident,
  investigator: string,
  rca: string,
  capa: string
): ClinicalIncident {
  return {
    ...incident,
    rootCauseAnalysis: rca.trim(),
    correctivePreventiveAction: capa.trim(),
    investigatedBy: investigator,
    investigatedAt: new Date().toISOString(),
    closedAt: new Date().toISOString(),
    status: 'Closed'
  };
}
