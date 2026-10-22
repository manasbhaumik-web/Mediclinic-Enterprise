/** Pure helpers for the admin System Status page: what to check, and how to read what comes back. */

export type Tone = 'ok' | 'warn' | 'bad' | 'idle';

/** The edge functions this project ships (supabase/functions) and what each is for. A test keeps this list in step with the folder. */
export const EDGE_FUNCTIONS = [
  { slug: 'leave', label: 'Leave and attendance', scheduled: false },
  { slug: 'payroll', label: 'Payroll runs and payslips', scheduled: false },
  { slug: 'staff-onboard', label: 'Staff account invitations', scheduled: false },
  { slug: 'einvoice-admin', label: 'e-Invoice admin actions (LHDN MyInvois)', scheduled: false },
  { slug: 'einvoice-worker', label: 'e-Invoice worker', scheduled: true },
  { slug: 'integrations-admin', label: 'Integrations admin actions', scheduled: false },
  { slug: 'integrations-worker', label: 'Integrations worker (outbound messages)', scheduled: true },
  { slug: 'payment-intent', label: 'Card payments (Stripe)', scheduled: false },
] as const;

/** Tables the app listens to for live changes. A test keeps this list in step with the subscriptions in the code. */
export const APP_REALTIME_TABLES = [
  'appointments', 'clinic_settings', 'drug_batches', 'inventory', 'prescriptions', 'staff', 'stock_movements', 'transactions', 'visits',
] as const;

// ---- API round trip ----------------------------------------------------------------------------------------------

export interface LatencySummary { median: number; min: number; max: number; samples: number }

export function summarizeLatency(samples: number[]): LatencySummary | null {
  if (samples.length === 0) return null;
  const sorted = [...samples].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  return { median: Math.round(median), min: Math.round(sorted[0]), max: Math.round(sorted[sorted.length - 1]), samples: sorted.length };
}

/** A round trip from this browser to the backend. Thresholds are for a normal broadband connection. */
export const latencyTone = (ms: number): Tone => (ms <= 400 ? 'ok' : ms <= 1200 ? 'warn' : 'bad');

// ---- edge functions ----------------------------------------------------------------------------------------------

/**
 * deployed      the platform answered for this function (any status other than "not found", e.g. 401 without a token)
 * not-deployed  the platform reports the function does not exist
 * unreadable    the request was sent but the browser may not read the answer (the function answers without CORS headers)
 * unreachable   no function answered at all, so the check itself could not run
 */
export type FunctionState = 'deployed' | 'not-deployed' | 'unreadable' | 'unreachable';

export interface ProbeResult { status?: number; body?: string; failed?: boolean }

export function classifyProbe(r: ProbeResult): FunctionState {
  if (r.failed || r.status === undefined) return 'unreadable';
  if (r.status === 404 && /NOT_FOUND|not found/i.test(r.body ?? '')) return 'not-deployed';
  return 'deployed';
}

/** If every probe failed, nothing could be checked (offline, blocked); otherwise a failed probe means "answers, but unreadable". */
export function resolveProbes(states: FunctionState[]): FunctionState[] {
  const anyAnswered = states.some((s) => s === 'deployed' || s === 'not-deployed');
  return anyAnswered ? states : states.map(() => 'unreachable' as const);
}

export const FUNCTION_STATE_LABEL: Record<FunctionState, { label: string; tone: Tone }> = {
  deployed: { label: 'Deployed', tone: 'ok' },
  'not-deployed': { label: 'Not deployed', tone: 'bad' },
  unreadable: { label: 'Responds (answer not readable here)', tone: 'idle' },
  unreachable: { label: 'Could not check', tone: 'warn' },
};

// ---- realtime ------------------------------------------------------------------------------------------------------

export interface RealtimeCoverage { published: string[]; missing: string[] }

/** Which of the tables the app listens to actually publish change events. */
export function realtimeCoverage(publishedTables: string[], appTables: readonly string[] = APP_REALTIME_TABLES): RealtimeCoverage {
  const published = new Set(publishedTables);
  return {
    published: appTables.filter((t) => published.has(t)),
    missing: appTables.filter((t) => !published.has(t)),
  };
}

// ---- formatting --------------------------------------------------------------------------------------------------

export function formatBytes(n: number): string {
  if (!Number.isFinite(n) || n < 0) return '—';
  if (n < 1024) return `${n} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let v = n / 1024;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i++; }
  return `${v >= 100 ? v.toFixed(0) : v.toFixed(1)} ${units[i]}`;
}

/** Whole minutes until a session token expires (expiresAtSec is a Unix time in seconds); null when unknown. */
export function minutesLeft(expiresAtSec: number | null | undefined, nowMs: number): number | null {
  if (!expiresAtSec) return null;
  return Math.max(0, Math.floor((expiresAtSec * 1000 - nowMs) / 60000));
}

/** What the database function system_status returns. */
export interface DbFacts {
  server_time: string;
  pg_version: string;
  db_size_bytes: number;
  tables: number;
  tables_without_rls: number;
  functions: number;
  migrations: { count: number; latest: string } | null;
  extensions: string[];
  realtime_tables: string[];
  accounts: number;
}
