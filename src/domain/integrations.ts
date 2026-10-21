/** Types and pure helpers for the admin Integrations screen. */

export type IntegrationType = 'fhir' | 'tpa' | 'lis' | 'erx' | 'wearable' | 'device' | 'ledger';
export type AuthType = 'none' | 'bearer' | 'basic' | 'api_key_header';
export type IntegrationMode = 'sandbox' | 'live';

export interface IntegrationConnection {
  id: string;
  type: IntegrationType;
  name: string;
  endpointUrl: string | null;
  authType: AuthType;
  authHeaderName: string | null;
  mode: IntegrationMode;
  enabled: boolean;
  config: { sendNric?: boolean };
  secretSet: boolean;
}

export interface IntegrationHealth {
  connectionId: string;
  lastSuccessAt: string | null;
  lastFailureAt: string | null;
  lastLatencyMs: number | null;
  lastError: string | null;
  consecutiveFailures: number;
}

export interface IntegrationEvent {
  id: string;
  connectionId: string | null;
  direction: 'outbound' | 'inbound' | 'admin';
  eventType: string;
  status: 'success' | 'failure' | 'blocked';
  httpStatus: number | null;
  detail: string | null;
  createdAt: string;
}

export interface OutboxSummary {
  pending: number;
  failed: number;
  dead: number;
  sent: number;
}

/** Connector types that have a working server-side implementation. The rest are shown as "not built yet". */
export const IMPLEMENTED_TYPES: readonly IntegrationType[] = ['fhir'];

export const TYPE_LABELS: Record<IntegrationType, string> = {
  fhir: 'HL7 FHIR',
  tpa: 'TPA / Insurance',
  lis: 'Lab / Radiology',
  erx: 'e-Prescribing',
  wearable: 'Wearables',
  device: 'Biometric devices',
  ledger: 'Audit ledger',
};

export type StatusTone = 'ok' | 'warn' | 'bad' | 'idle';

export interface ConnectionStatus {
  label: string;
  tone: StatusTone;
}

/** One honest status line per connection, derived only from stored health data. */
export function connectionStatus(conn: IntegrationConnection, health?: IntegrationHealth): ConnectionStatus {
  if (!IMPLEMENTED_TYPES.includes(conn.type)) return { label: 'Connector not built yet', tone: 'idle' };
  if (!conn.enabled) return { label: 'Disabled', tone: 'idle' };
  if (!health || (!health.lastSuccessAt && !health.lastFailureAt)) return { label: 'Never tested', tone: 'warn' };
  if (health.consecutiveFailures >= 3) return { label: `Failing (${health.consecutiveFailures} in a row)`, tone: 'bad' };
  if (health.consecutiveFailures > 0) return { label: 'Last attempt failed', tone: 'warn' };
  return { label: 'Healthy', tone: 'ok' };
}

/** Why a connection cannot be switched on yet, or null if it can. */
export function enableBlocker(conn: IntegrationConnection, endpointOk: boolean): string | null {
  if (!IMPLEMENTED_TYPES.includes(conn.type)) return 'This connector type is not implemented yet.';
  if (!endpointOk) return 'Set a valid https endpoint first.';
  if (conn.authType !== 'none' && !conn.secretSet) return 'Store the credential first.';
  return null;
}

export function summariseOutbox(rows: { status: string }[]): OutboxSummary {
  const out: OutboxSummary = { pending: 0, failed: 0, dead: 0, sent: 0 };
  for (const r of rows) {
    if (r.status === 'pending' || r.status === 'sending') out.pending++;
    else if (r.status === 'failed') out.failed++;
    else if (r.status === 'dead') out.dead++;
    else if (r.status === 'sent') out.sent++;
  }
  return out;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export const connectionFromRow = (r: any): IntegrationConnection => ({
  id: r.id,
  type: r.type,
  name: r.name,
  endpointUrl: r.endpoint_url,
  authType: r.auth_type,
  authHeaderName: r.auth_header_name,
  mode: r.mode,
  enabled: r.enabled,
  config: r.config ?? {},
  secretSet: !!r.secret_set,
});

export const healthFromRow = (r: any): IntegrationHealth => ({
  connectionId: r.connection_id,
  lastSuccessAt: r.last_success_at,
  lastFailureAt: r.last_failure_at,
  lastLatencyMs: r.last_latency_ms,
  lastError: r.last_error,
  consecutiveFailures: r.consecutive_failures ?? 0,
});

export const eventFromRow = (r: any): IntegrationEvent => ({
  id: r.id,
  connectionId: r.connection_id,
  direction: r.direction,
  eventType: r.event_type,
  status: r.status,
  httpStatus: r.http_status,
  detail: r.detail,
  createdAt: r.created_at,
});
