import type { ICD10Code, PrescriptionItem } from '../types';

/**
 * A consultation in progress is kept for the browser session, so a refresh or a dropped connection does not lose it.
 * It lives in sessionStorage (gone when the tab closes), is removed when the consultation is signed off or the patient
 * goes back to the queue, and is wiped when the user signs out.
 */
export const DRAFT_PREFIX = 'mediclinic.draft.';

export const draftKey = (visitId: string) => `${DRAFT_PREFIX}${visitId}`;

export interface ConsultationDraft {
  v: 1;
  subjective: string;
  vitals: { bpSystolic: number; bpDiastolic: number; heartRate: number; temperature: number; respiratoryRate: number };
  icd: ICD10Code | null;
  clinicalNotes: string;
  rx: PrescriptionItem[];
  mcDays: number | '';
  mcGenerated: boolean;
  pharmacyMemo: string;
  referralDetails: { hospital: string; department: string; reason: string };
  referralGenerated: boolean;
  /** Added after v1 drafts were first saved, so older drafts may lack them. */
  labOrders?: string[];
  labReason?: string;
  mcReason?: string;
  followUpWeeks?: number;
  savedAt: number;
}

const isNum = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n);

/** Returns the draft, or null when the stored text is missing, damaged or from another version. */
export function parseDraft(raw: string | null): ConsultationDraft | null {
  if (!raw) return null;
  let d: any;
  try { d = JSON.parse(raw); } catch { return null; }
  if (!d || d.v !== 1) return null;
  const v = d.vitals;
  if (typeof d.subjective !== 'string' || typeof d.clinicalNotes !== 'string' || typeof d.pharmacyMemo !== 'string') return null;
  if (!v || !isNum(v.bpSystolic) || !isNum(v.bpDiastolic) || !isNum(v.heartRate) || !isNum(v.temperature) || !isNum(v.respiratoryRate)) return null;
  if (!Array.isArray(d.rx) || typeof d.mcGenerated !== 'boolean' || typeof d.referralGenerated !== 'boolean' || !isNum(d.savedAt)) return null;
  if (!(d.mcDays === '' || isNum(d.mcDays))) return null;
  const r = d.referralDetails;
  if (!r || typeof r.hospital !== 'string' || typeof r.department !== 'string' || typeof r.reason !== 'string') return null;
  if (d.labOrders !== undefined && !(Array.isArray(d.labOrders) && d.labOrders.every((x: unknown) => typeof x === 'string'))) return null;
  if (d.labReason !== undefined && typeof d.labReason !== 'string') return null;
  if (d.mcReason !== undefined && typeof d.mcReason !== 'string') return null;
  if (d.followUpWeeks !== undefined && !isNum(d.followUpWeeks)) return null;
  return d as ConsultationDraft;
}

/** Removes every saved consultation draft (used when a user signs out). */
export function clearAllDrafts(storage: Pick<Storage, 'length' | 'key' | 'removeItem'>): void {
  const keys: string[] = [];
  for (let i = 0; i < storage.length; i++) {
    const k = storage.key(i);
    if (k && k.startsWith(DRAFT_PREFIX)) keys.push(k);
  }
  keys.forEach((k) => storage.removeItem(k));
}
