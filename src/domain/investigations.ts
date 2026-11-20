import type { UserRole } from '../types';

/** Laboratory tests and imaging scans ordered for a visit. The order moves Ordered > Collected > Resulted > Reviewed. */
export type InvestigationKind = 'lab' | 'imaging';
export type InvestigationStatus = 'Ordered' | 'Collected' | 'Resulted' | 'Reviewed' | 'Cancelled';
export type InvestigationUrgency = 'routine' | 'urgent';

export interface Investigation {
  id: string;
  visitId: string;
  patientId: string;
  patientName: string;
  patientIc: string;
  kind: InvestigationKind;
  name: string;
  urgency: InvestigationUrgency;
  clinicalInfo: string;
  status: InvestigationStatus;
  orderedAt: string;
  collectedAt?: string;
  resultValue?: string;
  resultUnit?: string;
  referenceRange?: string;
  abnormal: boolean;
  resultNotes?: string;
  resultedAt?: string;
  reviewedAt?: string;
  cancelReason?: string;
}

export interface CatalogItem {
  name: string;
  kind: InvestigationKind;
  category: string;
  turnaround: string;
}

/** What a doctor can order from the Investigations page. The names of the first seven match the consultation's lab list. */
export const INVESTIGATION_CATALOG: readonly CatalogItem[] = [
  { name: 'Full Blood Count (FBC)', kind: 'lab', category: 'Haematology', turnaround: '2 hrs' },
  { name: 'Renal Function Test (RFT)', kind: 'lab', category: 'Biochemistry', turnaround: '3 hrs' },
  { name: 'Liver Function Test (LFT)', kind: 'lab', category: 'Biochemistry', turnaround: '3 hrs' },
  { name: 'Fasting Blood Glucose & Lipid Profile', kind: 'lab', category: 'Metabolic', turnaround: '4 hrs' },
  { name: 'Urine FEME & Microalbumin', kind: 'lab', category: 'Urinalysis', turnaround: '1 hr' },
  { name: 'HbA1c', kind: 'lab', category: 'Metabolic', turnaround: '4 hrs' },
  { name: 'Thyroid Function Test (TFT)', kind: 'lab', category: 'Endocrine', turnaround: '1 day' },
  { name: 'Dengue NS1 / IgM', kind: 'lab', category: 'Infectious disease', turnaround: '1 hr' },
  { name: '12-Lead Electrocardiogram (ECG)', kind: 'imaging', category: 'Cardiac', turnaround: 'Immediate' },
  { name: 'Chest X-Ray (PA View)', kind: 'imaging', category: 'Radiology', turnaround: 'Immediate' },
  { name: 'Abdominal X-Ray', kind: 'imaging', category: 'Radiology', turnaround: 'Immediate' },
  { name: 'Ultrasound Abdomen', kind: 'imaging', category: 'Ultrasound', turnaround: '1 day' },
  { name: 'Ultrasound Pelvis', kind: 'imaging', category: 'Ultrasound', turnaround: '1 day' },
];

export const STATUS_LABEL: Record<InvestigationStatus, { en: string; bm: string }> = {
  Ordered: { en: 'Ordered', bm: 'Dipesan' },
  Collected: { en: 'Collected', bm: 'Sampel diambil' },
  Resulted: { en: 'Result in', bm: 'Keputusan diterima' },
  Reviewed: { en: 'Reviewed', bm: 'Disemak' },
  Cancelled: { en: 'Cancelled', bm: 'Dibatalkan' },
};

const STATUSES: readonly InvestigationStatus[] = ['Ordered', 'Collected', 'Resulted', 'Reviewed', 'Cancelled'];

export function investigationFromRow(row: any): Investigation {
  const patient = Array.isArray(row.patients) ? row.patients[0] : row.patients;
  return {
    id: row.id,
    visitId: row.visit_id,
    patientId: row.patient_id,
    patientName: patient?.full_name ?? 'Unknown patient',
    patientIc: patient?.ic_number ?? '',
    kind: row.kind === 'imaging' ? 'imaging' : 'lab',
    name: row.name,
    urgency: row.urgency === 'urgent' ? 'urgent' : 'routine',
    clinicalInfo: row.clinical_info ?? '',
    status: STATUSES.includes(row.status) ? row.status : 'Ordered',
    orderedAt: row.ordered_at,
    collectedAt: row.collected_at ?? undefined,
    resultValue: row.result_value ?? undefined,
    resultUnit: row.result_unit ?? undefined,
    referenceRange: row.reference_range ?? undefined,
    abnormal: !!row.abnormal,
    resultNotes: row.result_notes ?? undefined,
    resultedAt: row.resulted_at ?? undefined,
    reviewedAt: row.reviewed_at ?? undefined,
    cancelReason: row.cancel_reason ?? undefined,
  };
}

/**
 * Reads a reference range such as "3.5-5.0", "3.5 - 5.0", "<5.7", "<=5.7" or ">10". Anything else (a text range such
 * as "Negative") returns null, so the screen never guesses.
 */
export function parseRange(range: string | undefined): { low?: number; high?: number } | null {
  const r = (range ?? '').trim().replace(/,/g, '');
  if (!r) return null;
  const between = r.match(/^(-?\d+(?:\.\d+)?)\s*(?:-|–|to)\s*(-?\d+(?:\.\d+)?)$/i);
  if (between) {
    const low = Number(between[1]);
    const high = Number(between[2]);
    return low <= high ? { low, high } : null;
  }
  const below = r.match(/^(?:<|<=|≤)\s*(-?\d+(?:\.\d+)?)$/);
  if (below) return { high: Number(below[1]) };
  const above = r.match(/^(?:>|>=|≥)\s*(-?\d+(?:\.\d+)?)$/);
  if (above) return { low: Number(above[1]) };
  return null;
}

/**
 * Whether a numeric result falls outside its reference range. Returns null when it cannot tell (no range, a text
 * range, or a non-numeric result), so the person entering the result decides.
 */
export function outsideRange(value: string | undefined, range: string | undefined): boolean | null {
  const v = (value ?? '').trim().replace(/,/g, '');
  if (!/^-?\d+(?:\.\d+)?$/.test(v)) return null;
  const parsed = parseRange(range);
  if (!parsed) return null;
  const n = Number(v);
  return (parsed.low !== undefined && n < parsed.low) || (parsed.high !== undefined && n > parsed.high);
}

/** Work waiting for this person: samples and scans for an assistant, results to read for a doctor. */
export function actionableCount(roles: readonly UserRole[], items: readonly Investigation[]): number {
  let n = 0;
  if (roles.includes('clinic-assistant')) n += items.filter((i) => i.status === 'Ordered' || i.status === 'Collected').length;
  if (roles.includes('doctor')) n += items.filter((i) => i.status === 'Resulted').length;
  return n;
}

/** Results in that a doctor has not yet marked as read, and how many of them are abnormal. */
export function unreviewedSummary(items: readonly Investigation[]): { count: number; abnormal: number } {
  const waiting = items.filter((i) => i.status === 'Resulted');
  return { count: waiting.length, abnormal: waiting.filter((i) => i.abnormal).length };
}

const URGENCY_RANK: Record<InvestigationUrgency, number> = { urgent: 0, routine: 1 };

/** Urgent first, then oldest first, so nothing waits behind newer work. */
export function sortWorklist(items: readonly Investigation[]): Investigation[] {
  return [...items].sort((a, b) => URGENCY_RANK[a.urgency] - URGENCY_RANK[b.urgency] || a.orderedAt.localeCompare(b.orderedAt));
}

/** Only these roles may enter results or take samples (the database enforces the same). */
/**
 * The orders to place for the test names a doctor ticked in the consultation. Each name is looked up in the catalogue to decide
 * lab or imaging (a name not in it is treated as a lab test); repeats and blanks are dropped.
 */
export function ordersFromNames(names: readonly string[] | undefined, clinicalInfo?: string): { kind: InvestigationKind; name: string; urgency: InvestigationUrgency; clinicalInfo?: string }[] {
  const seen = new Set<string>();
  const out: { kind: InvestigationKind; name: string; urgency: InvestigationUrgency; clinicalInfo?: string }[] = [];
  for (const raw of names ?? []) {
    const name = (raw ?? '').trim();
    const key = name.toLowerCase();
    if (!name || seen.has(key)) continue;
    seen.add(key);
    const item = INVESTIGATION_CATALOG.find((c) => c.name.toLowerCase() === key);
    out.push({ kind: item?.kind ?? 'lab', name, urgency: 'routine', clinicalInfo: clinicalInfo?.trim() || undefined });
  }
  return out;
}

export const canRecordResults = (roles: readonly UserRole[]) => roles.includes('clinic-assistant') || roles.includes('doctor');
export const canOrder = (roles: readonly UserRole[]) => roles.includes('doctor');
export const canReview = (roles: readonly UserRole[]) => roles.includes('doctor');
