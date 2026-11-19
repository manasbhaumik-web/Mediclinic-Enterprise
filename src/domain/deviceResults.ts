import type { Investigation } from './investigations';

/** Connected devices, the inbox of results they send, and the test-code map that matches those results to orders. */
export type DeviceKind = 'analyzer' | 'imaging' | 'point_of_care' | 'other';
export type DeviceProtocol = 'hl7v2' | 'fhir' | 'json';
export type DeviceResultStatus = 'Pending' | 'Accepted' | 'Rejected';

export interface LabDevice {
  id: string;
  name: string;
  kind: DeviceKind;
  protocol: DeviceProtocol;
  location: string;
  active: boolean;
  keyHint: string;
  lastSeenAt?: string;
}

export interface DeviceCode {
  deviceId: string;
  deviceCode: string;
  testName: string;
}

export interface DeviceResult {
  id: string;
  deviceId: string;
  deviceCode: string;
  patientRef: string;
  patientId?: string;
  testName?: string;
  investigationId?: string;
  value: string;
  unit: string;
  range: string;
  abnormal: boolean;
  notes: string;
  observedAt?: string;
  receivedAt: string;
  status: DeviceResultStatus;
  rejectReason?: string;
}

export const KIND_LABEL: Record<DeviceKind, string> = {
  analyzer: 'Lab analyzer',
  imaging: 'Imaging machine',
  point_of_care: 'Point-of-care device',
  other: 'Other device',
};

export const PROTOCOL_LABEL: Record<DeviceProtocol, string> = {
  hl7v2: 'HL7 v2 (ORU)',
  fhir: 'FHIR',
  json: 'Plain JSON',
};

export function labDeviceFromRow(row: any): LabDevice {
  return {
    id: row.id,
    name: row.name,
    kind: row.kind in KIND_LABEL ? row.kind : 'other',
    protocol: row.protocol in PROTOCOL_LABEL ? row.protocol : 'hl7v2',
    location: row.location ?? '',
    active: row.active !== false,
    keyHint: row.key_hint ?? '',
    lastSeenAt: row.last_seen_at ?? undefined,
  };
}

export const deviceCodeFromRow = (row: any): DeviceCode => ({ deviceId: row.device_id, deviceCode: row.device_code, testName: row.test_name });

export function deviceResultFromRow(row: any): DeviceResult {
  return {
    id: row.id,
    deviceId: row.device_id,
    deviceCode: row.device_code,
    patientRef: row.patient_ref ?? '',
    patientId: row.patient_id ?? undefined,
    testName: row.test_name ?? undefined,
    investigationId: row.investigation_id ?? undefined,
    value: row.result_value ?? '',
    unit: row.result_unit ?? '',
    range: row.reference_range ?? '',
    abnormal: !!row.abnormal,
    notes: row.notes ?? '',
    observedAt: row.observed_at ?? undefined,
    receivedAt: row.received_at,
    status: row.status === 'Accepted' || row.status === 'Rejected' ? row.status : 'Pending',
    rejectReason: row.reject_reason ?? undefined,
  };
}

/** How well a waiting result is matched, so the inbox can say what a person still has to decide. */
export type MatchState = 'matched' | 'no-patient' | 'unmapped' | 'no-order';

export function matchState(r: DeviceResult): MatchState {
  if (r.investigationId) return 'matched';
  if (!r.patientId) return 'no-patient';
  if (!r.testName) return 'unmapped';
  return 'no-order';
}

export const MATCH_LABEL: Record<MatchState, string> = {
  matched: 'Matched to an open order',
  'no-patient': 'No patient found for this identifier',
  unmapped: 'This test code is not mapped yet',
  'no-order': 'No open order for this test',
};

/** Open orders this result could be recorded against: the same patient's, still waiting for a result. */
export function candidateOrders(result: DeviceResult, investigations: readonly Investigation[]): Investigation[] {
  if (!result.patientId) return [];
  return investigations.filter((i) => i.patientId === result.patientId && (i.status === 'Ordered' || i.status === 'Collected'));
}

// ---- device keys ---------------------------------------------------------------------------------------------------

/** A new device key. It is shown once; only its SHA-256 is kept. */
export function generateDeviceKey(random: (n: number) => Uint8Array = (n) => crypto.getRandomValues(new Uint8Array(n))): string {
  return 'mcd_' + Array.from(random(24)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** The last few characters, kept so staff can tell keys apart without the key being stored. */
export const keyHint = (key: string) => key.slice(-4);

export function ingestUrl(supabaseUrl: string | undefined): string {
  return `${(supabaseUrl ?? '').replace(/\/+$/, '')}/functions/v1/lab-device-ingest`;
}

/** A device that has not sent anything for this long is shown as quiet. */
export const QUIET_AFTER_HOURS = 24;

export function deviceActivity(d: Pick<LabDevice, 'active' | 'lastSeenAt'>, now = Date.now()): 'off' | 'never' | 'recent' | 'quiet' {
  if (!d.active) return 'off';
  if (!d.lastSeenAt) return 'never';
  return now - Date.parse(d.lastSeenAt) > QUIET_AFTER_HOURS * 3_600_000 ? 'quiet' : 'recent';
}
