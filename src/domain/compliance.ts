/** Roll-ups for the admin compliance page: licence status, diagnosis coding, notifiable-disease counts and the controlled-drug register. */
import { daysBetween } from './equipment';

// ---- licence ---------------------------------------------------------------------------------------------------

export type LicenceState = 'none' | 'ok' | 'soon' | 'expired';
export const LICENCE_WARN_DAYS = 90;

/** Where the clinic's licence stands. `days` is days left (negative once expired); null when no expiry is recorded. */
export function licenceStatus(expiry: string | null | undefined, today: string, warnDays = LICENCE_WARN_DAYS): { state: LicenceState; days: number | null } {
  if (!expiry) return { state: 'none', days: null };
  const days = daysBetween(today, expiry);
  if (days < 0) return { state: 'expired', days };
  return { state: days <= warnDays ? 'soon' : 'ok', days };
}

// ---- diagnosis coding --------------------------------------------------------------------------------------------

export interface CodingSummary {
  /** Visits whose consultation has finished in the period. */
  consulted: number;
  coded: number;
  missing: number;
  /** Null until at least one consultation has finished. */
  percent: number | null;
}

/** From the counts report_diagnosis_coding returns. */
export function summarizeCoding(consulted: number, coded: number): CodingSummary {
  return {
    consulted,
    coded,
    missing: Math.max(0, consulted - coded),
    percent: consulted > 0 ? Math.round((coded / consulted) * 100) : null,
  };
}

// ---- notifiable diseases -----------------------------------------------------------------------------------------

export interface NotifiableCondition { icdPrefix: string; condition: string }

/**
 * Notifiable conditions that a doctor cannot currently record, because no code in the diagnosis list starts with any
 * of the condition's ICD prefixes. Counts of such a condition will always read zero.
 */
export function notifiableWithoutCode(notifiable: NotifiableCondition[], catalogCodes: string[]): { uncovered: string[]; total: number } {
  const codes = catalogCodes.map((c) => c.toUpperCase());
  const byCondition = new Map<string, boolean>();
  for (const n of notifiable) {
    const covered = codes.some((c) => c.startsWith(n.icdPrefix.toUpperCase()));
    byCondition.set(n.condition, (byCondition.get(n.condition) ?? false) || covered);
  }
  return {
    uncovered: [...byCondition].filter(([, covered]) => !covered).map(([name]) => name).sort((a, b) => a.localeCompare(b)),
    total: byCondition.size,
  };
}

export interface SurveillanceRow { weekStart: string; condition: string; icdCode: string; cases: number }

export interface SurveillanceSummary {
  totalCases: number;
  byCondition: { condition: string; cases: number }[];
}

export function summarizeSurveillance(rows: SurveillanceRow[]): SurveillanceSummary {
  const by = new Map<string, number>();
  let totalCases = 0;
  for (const r of rows) {
    totalCases += r.cases;
    by.set(r.condition, (by.get(r.condition) ?? 0) + r.cases);
  }
  return {
    totalCases,
    byCondition: [...by].map(([condition, cases]) => ({ condition, cases })).sort((a, b) => b.cases - a.cases || a.condition.localeCompare(b.condition)),
  };
}

export const surveillanceFromRow = (r: any): SurveillanceRow => ({
  weekStart: r.week_start, condition: r.condition, icdCode: r.icd_code, cases: Number(r.cases),
});

// ---- controlled-drug register ------------------------------------------------------------------------------------

/** Register entries still waiting for their second signature, and how long the oldest has waited. */
export function summarizeUnsigned(entries: { signedBy: string | null; createdAt: string }[], now: number): { unsigned: number; oldestDays: number | null } {
  const waiting = entries.filter((e) => !e.signedBy);
  if (waiting.length === 0) return { unsigned: 0, oldestDays: null };
  const oldest = Math.min(...waiting.map((e) => Date.parse(e.createdAt)));
  return { unsigned: waiting.length, oldestDays: Math.max(0, Math.floor((now - oldest) / 86_400_000)) };
}
