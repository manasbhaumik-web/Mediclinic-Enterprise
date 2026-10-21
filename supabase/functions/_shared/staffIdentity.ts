/**
 * Duplicate detection for staff records. Pure TypeScript with no Deno globals: the same rules run in the
 * staff-onboard function, the staff form, the CSV import and the unit tests, and mirror the database's
 * unique indexes (which are the final guarantee).
 *
 * Two people are the SAME record when they share:
 *   - an email address (ignoring capitals and surrounding spaces), or
 *   - an ID number (NRIC or passport; ignoring dashes, spaces and capitals).
 * They are a PROBABLE duplicate when they share a name and date of birth. That is a warning that needs an
 * explicit confirmation, because two different people can occasionally share both.
 */

export interface StaffIdentity {
  id?: string;
  name?: string | null;
  email?: string | null;
  icNumber?: string | null;
  dob?: string | null;
}

export type DuplicateKind = 'email' | 'id_number' | 'name_dob';

export interface DuplicateMatch {
  kind: DuplicateKind;
  /** True when the match is certain; false for a probable duplicate that the user may override. */
  blocking: boolean;
  with: StaffIdentity;
}

export const normalizeEmail = (v: string | null | undefined): string => (v ?? '').trim().toLowerCase();

/** NRIC 850412-14-5224, "850412 14 5224" and 850412145224 all normalise to the same value. */
export const normalizeIdNumber = (v: string | null | undefined): string => (v ?? '').replace(/[^0-9A-Za-z]/g, '').toUpperCase();

const normalizeName = (v: string | null | undefined): string => (v ?? '').trim().toLowerCase().replace(/\s+/g, ' ');

/** The first reason `candidate` duplicates someone in `existing`, or null. Certain matches win over probable ones. */
export function findStaffDuplicate(candidate: StaffIdentity, existing: StaffIdentity[]): DuplicateMatch | null {
  const email = normalizeEmail(candidate.email);
  const idNumber = normalizeIdNumber(candidate.icNumber);
  const name = normalizeName(candidate.name);
  const others = existing.filter((e) => !candidate.id || e.id !== candidate.id);

  if (email) {
    const hit = others.find((e) => normalizeEmail(e.email) === email);
    if (hit) return { kind: 'email', blocking: true, with: hit };
  }
  if (idNumber) {
    const hit = others.find((e) => normalizeIdNumber(e.icNumber) === idNumber);
    if (hit) return { kind: 'id_number', blocking: true, with: hit };
  }
  if (name && candidate.dob) {
    const hit = others.find((e) => normalizeName(e.name) === name && !!e.dob && e.dob === candidate.dob);
    if (hit) return { kind: 'name_dob', blocking: false, with: hit };
  }
  return null;
}

/** A sentence for the person adding the record. */
export function duplicateMessage(match: DuplicateMatch): string {
  const who = match.with.name ? ` (${match.with.name})` : '';
  switch (match.kind) {
    case 'email': return `A staff member with this email already exists${who}.`;
    case 'id_number': return `A staff member with this ID number already exists${who}.`;
    default: return `A staff member with the same name and date of birth already exists${who}. If this is a different person, confirm to add them anyway.`;
  }
}

/** Map a database unique-violation message to the same wording, for races the pre-checks cannot see. */
export function duplicateMessageFromDbError(message: string | null | undefined): string | null {
  const m = message ?? '';
  if (/staff_email_unique_ci|staff_email_key/.test(m)) return 'A staff member with this email already exists.';
  if (/staff_id_number_unique/.test(m)) return 'A staff member with this ID number already exists.';
  if (/duplicate key|unique constraint/i.test(m)) return 'This staff member already exists.';
  return null;
}
