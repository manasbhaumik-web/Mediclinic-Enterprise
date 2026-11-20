import { csvField } from './csv';
/** The audit trail for patient and clinical data: who opened or changed what, and when. It never holds the values themselves. */
export type AuditAction = 'create' | 'update' | 'delete' | 'view';

export interface ClinicalAuditEntry {
  id: number;
  at: string;
  actor?: string;
  actorRoles: string[];
  action: AuditAction;
  entity: string;
  entityId: string;
  patientId?: string;
  visitId?: string;
  fields: string[];
  context: string;
}

export const ACTION_LABEL: Record<AuditAction, string> = {
  create: 'Created',
  update: 'Changed',
  delete: 'Removed',
  view: 'Opened',
};

export const ENTITY_LABEL: Record<string, string> = {
  patients: 'Patient record',
  visits: 'Visit',
  soap_notes: 'Consultation note',
  prescriptions: 'Prescription line',
  investigations: 'Lab or imaging order',
  device_results: 'Device result',
};

export const SCREEN_LABEL: Record<string, string> = {
  consultation: 'Consultation room',
  triage: 'Triage',
  dispensary: 'Dispensary',
  billing: 'Billing',
  registry: 'Patient registry',
  'patient-admin': 'Patient administration',
};

export function auditFromRow(r: any): ClinicalAuditEntry {
  return {
    id: Number(r.id),
    at: r.at,
    actor: r.actor ?? undefined,
    actorRoles: Array.isArray(r.actor_roles) ? r.actor_roles : [],
    action: r.action,
    entity: r.entity,
    entityId: r.entity_id ?? '',
    patientId: r.patient_id ?? undefined,
    visitId: r.visit_id ?? undefined,
    fields: Array.isArray(r.fields) ? r.fields : [],
    context: r.context ?? '',
  };
}

/** "clinical_notes" becomes "clinical notes". */
export const fieldLabel = (f: string) => f.replace(/_/g, ' ');

/** The changed fields as a short phrase: the first few, then "and 3 more". */
export function fieldsSummary(fields: readonly string[], max = 4): string {
  if (fields.length === 0) return '';
  const shown = fields.slice(0, max).map(fieldLabel).join(', ');
  return fields.length > max ? `${shown} and ${fields.length - max} more` : shown;
}

/** One line for the log: what happened, to what, and on which screen when it was an "opened". */
export function describeEntry(e: ClinicalAuditEntry): string {
  const what = ENTITY_LABEL[e.entity] ?? e.entity;
  if (e.action === 'view') return `Opened the patient record${e.context ? ` in ${SCREEN_LABEL[e.context] ?? e.context}` : ''}`;
  const fields = e.action === 'update' ? fieldsSummary(e.fields) : '';
  return `${ACTION_LABEL[e.action]} ${what.toLowerCase()}${fields ? ` (${fields})` : ''}`;
}

export interface AuditFilters {
  patientId?: string;
  actor?: string;
  action?: AuditAction | '';
  entity?: string;
  /** Inclusive day range as YYYY-MM-DD, read in Malaysia time. */
  from?: string;
  to?: string;
}

/** Start of a day in Malaysia time (UTC+8) as an ISO instant, for filtering. */
export const dayStartMy = (day: string) => new Date(`${day}T00:00:00+08:00`).toISOString();
/** The instant a day ends (start of the next day), so the range is inclusive of the last day. */
export const dayEndMy = (day: string) => new Date(new Date(`${day}T00:00:00+08:00`).getTime() + 86_400_000).toISOString();

export const PAGE_SIZE = 50;

/** CSV text of the entries on screen, for an investigation. No clinical values are in the log, so none are in the file. */
export function auditCsv(entries: readonly ClinicalAuditEntry[], nameOf: (id?: string) => string, patientOf: (id?: string) => string): string {
  const head = ['time', 'staff', 'roles', 'action', 'what', 'patient', 'fields', 'screen'];
  const rows = entries.map((e) => [e.at, nameOf(e.actor), e.actorRoles.join('/'), ACTION_LABEL[e.action], ENTITY_LABEL[e.entity] ?? e.entity, patientOf(e.patientId), e.fields.join(' '), e.context]);
  return [head, ...rows].map((r) => r.map((c) => csvField(c ?? '')).join(',')).join('\n');
}
