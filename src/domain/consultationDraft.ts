import type { ICD10Code, PrescriptionItem } from '../types';

/**
 * A consultation in progress is kept for the browser session and local persistence,
 * so a refresh, tab-switch, or page reload does not lose it.
 * It is removed when the consultation is completed/signed off, or when the user signs out.
 */
export const DRAFT_PREFIX = 'mediclinic.draft.';

export const draftKey = (visitId: string) => `${DRAFT_PREFIX}${visitId}`;

export interface ConsultationDraft {
  v: 1;
  activeTab?: 'subjective' | 'objective' | 'assessment' | 'plan';
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
  if (d.activeTab !== undefined && !['subjective', 'objective', 'assessment', 'plan'].includes(d.activeTab)) return null;
  return d as ConsultationDraft;
}

/** Retrieves the consultation draft from sessionStorage with fallback to localStorage. */
export function getSavedDraft(visitId: string): ConsultationDraft | null {
  try {
    const fromSession = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(draftKey(visitId)) : null;
    const parsedSession = parseDraft(fromSession);
    if (parsedSession) return parsedSession;

    const fromLocal = typeof localStorage !== 'undefined' ? localStorage.getItem(draftKey(visitId)) : null;
    return parseDraft(fromLocal);
  } catch {
    return null;
  }
}

/** Saves the consultation draft to both sessionStorage and localStorage for crash/tab-switch resilience. */
export function saveDraft(visitId: string, draft: ConsultationDraft): void {
  const json = JSON.stringify(draft);
  try { if (typeof sessionStorage !== 'undefined') sessionStorage.setItem(draftKey(visitId), json); } catch { /* storage full */ }
  try { if (typeof localStorage !== 'undefined') localStorage.setItem(draftKey(visitId), json); } catch { /* storage full */ }
}

/** Removes the consultation draft from both sessionStorage and localStorage (e.g. upon clinical sign-off). */
export function removeDraft(visitId: string): void {
  try { if (typeof sessionStorage !== 'undefined') sessionStorage.removeItem(draftKey(visitId)); } catch { /* ignore */ }
  try { if (typeof localStorage !== 'undefined') localStorage.removeItem(draftKey(visitId)); } catch { /* ignore */ }
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
