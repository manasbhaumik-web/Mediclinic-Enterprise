/** Normalises the app's separate event tables into one activity feed for the Security hub. */

export type AuditSource = 'inventory' | 'hr' | 'payroll' | 'equipment' | 'integration';
export type AuditTone = 'ok' | 'warn' | 'bad' | 'info';

export const SOURCE_LABEL: Record<AuditSource, string> = {
  inventory: 'Inventory',
  hr: 'HR & leave',
  payroll: 'Payroll',
  equipment: 'Equipment',
  integration: 'Integrations',
};

export interface AuditEntry {
  id: string;
  source: AuditSource;
  action: string;
  detail: string;
  /** Auth user id of whoever did it, when recorded. */
  actor: string | null;
  /** A name stored with the event itself (equipment history keeps one). */
  actorName: string | null;
  at: string;
  tone: AuditTone;
}

export const humanise = (s: string | null | undefined): string => {
  const t = (s ?? '').replace(/[_.-]+/g, ' ').trim();
  return t ? t.charAt(0).toUpperCase() + t.slice(1) : '';
};

const clip = (s: string, max: number) => (s.length > max ? `${s.slice(0, max - 1)}…` : s);

/** A short "key: value" summary of an event's detail; nested values are left out. */
export function describeDetail(detail: unknown, maxPairs = 3): string {
  if (detail === null || detail === undefined) return '';
  if (typeof detail === 'string') return clip(detail, 140);
  if (typeof detail !== 'object' || Array.isArray(detail)) return clip(String(detail), 140);
  return Object.entries(detail as Record<string, unknown>)
    .filter(([, v]) => v !== null && v !== undefined && typeof v !== 'object')
    .slice(0, maxPairs)
    .map(([k, v]) => `${humanise(k)}: ${clip(String(v), 40)}`)
    .join(' · ');
}

export const inventoryEntry = (r: any): AuditEntry => ({
  id: `inventory:${r.id}`, source: 'inventory', action: `${humanise(r.entity)}: ${humanise(r.action)}`,
  detail: describeDetail(r.detail), actor: r.actor ?? null, actorName: null, at: r.created_at, tone: 'info',
});

export const hrEntry = (r: any): AuditEntry => ({
  id: `hr:${r.id}`, source: 'hr', action: `${humanise(r.entity)}: ${humanise(r.action)}`,
  detail: describeDetail(r.detail), actor: r.actor ?? null, actorName: null, at: r.created_at, tone: 'info',
});

export const payrollEntry = (r: any): AuditEntry => ({
  id: `payroll:${r.id}`, source: 'payroll', action: humanise(r.action),
  detail: describeDetail(r.detail), actor: r.actor ?? null, actorName: null, at: r.created_at, tone: 'info',
});

export const equipmentEntry = (r: any): AuditEntry => ({
  id: `equipment:${r.id}`, source: 'equipment',
  action: `${humanise(r.kind)}${r.outcome ? ` (${r.outcome})` : ''}`,
  detail: [r.performed_by && `By ${r.performed_by}`, r.findings && clip(String(r.findings), 100)].filter(Boolean).join(' · '),
  actor: r.actor ?? null, actorName: r.actor_name ?? null, at: r.created_at,
  tone: r.outcome === 'fail' ? 'bad' : r.outcome === 'conditional' ? 'warn' : 'info',
});

export const integrationEntry = (r: any): AuditEntry => ({
  id: `integration:${r.id}`, source: 'integration',
  action: `${humanise(r.event_type)} (${r.direction})`,
  detail: [r.status && humanise(r.status), r.http_status && `HTTP ${r.http_status}`, r.detail && clip(String(r.detail), 100)].filter(Boolean).join(' · '),
  actor: r.actor ?? null, actorName: null, at: r.created_at,
  tone: r.status === 'failure' ? 'bad' : r.status === 'blocked' ? 'warn' : 'ok',
});

/** Newest first. */
export const mergeFeed = (lists: AuditEntry[][], limit = 200): AuditEntry[] =>
  lists.flat().sort((a, b) => Date.parse(b.at) - Date.parse(a.at)).slice(0, limit);

export interface ActivitySummary {
  total: number;
  bySource: Record<AuditSource, number>;
  /** Events that failed or were blocked. */
  problems: number;
}

export function summarizeActivity(entries: AuditEntry[], sinceMs: number): ActivitySummary {
  const bySource: Record<AuditSource, number> = { inventory: 0, hr: 0, payroll: 0, equipment: 0, integration: 0 };
  let total = 0;
  let problems = 0;
  for (const e of entries) {
    if (Date.parse(e.at) < sinceMs) continue;
    total++;
    bySource[e.source]++;
    if (e.tone === 'bad') problems++;
  }
  return { total, bySource, problems };
}
