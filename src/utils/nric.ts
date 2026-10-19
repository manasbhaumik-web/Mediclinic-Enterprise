/**
 * Malaysian NRIC (MyKad) helpers.
 * Format: YYMMDD-PB-###G, where YYMMDD is the date of birth, PB the place of birth and the last
 * digit is odd for male and even for female. Passport numbers are left untouched.
 */

export interface NricDetails {
  dob: string; // YYYY-MM-DD
  gender: 'Male' | 'Female';
}

/** True when the input looks like an NRIC being typed (digits and dashes only), not a passport number. */
export const looksLikeNric = (value: string) => /^[\d-]*$/.test(value.trim());

/** Insert the dashes as the user types: 900101145555 becomes 900101-14-5555. Passport numbers pass through. */
export function formatNric(value: string): string {
  if (!looksLikeNric(value)) return value;
  const digits = value.replace(/\D/g, '').slice(0, 12);
  if (digits.length <= 6) return digits;
  if (digits.length <= 8) return `${digits.slice(0, 6)}-${digits.slice(6)}`;
  return `${digits.slice(0, 6)}-${digits.slice(6, 8)}-${digits.slice(8)}`;
}

export const isCompleteNric = (value: string) => /^\d{6}-\d{2}-\d{4}$/.test(value);

/**
 * Read the date of birth and gender from a complete NRIC.
 * The century is not stored on the card, so a two-digit year later than the current one is taken as 19xx.
 * Returns null when the number is incomplete or the date does not exist.
 */
export function parseNric(value: string, now: Date = new Date()): NricDetails | null {
  if (!isCompleteNric(value)) return null;
  const yy = Number(value.slice(0, 2));
  const mm = Number(value.slice(2, 4));
  const dd = Number(value.slice(4, 6));
  const currentYY = now.getFullYear() % 100;
  const year = (yy > currentYY ? 1900 : 2000) + yy;
  const date = new Date(year, mm - 1, dd);
  if (date.getFullYear() !== year || date.getMonth() !== mm - 1 || date.getDate() !== dd) return null;
  if (date.getTime() > now.getTime()) return null;
  const lastDigit = Number(value[value.length - 1]);
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    dob: `${year}-${pad(mm)}-${pad(dd)}`,
    gender: lastDigit % 2 === 1 ? 'Male' : 'Female',
  };
}

/** Message to show for an NRIC that cannot be right, or an empty string when it is acceptable. */
export function nricError(value: string): string {
  const v = value.trim();
  if (!v) return '';
  if (!looksLikeNric(v)) return ''; // treated as a passport number
  if (!isCompleteNric(v)) return 'An NRIC has 12 digits, for example 900101-14-5555. For a passport, enter the passport number.';
  if (!parseNric(v)) return 'The first six digits are not a valid date of birth (YYMMDD).';
  return '';
}
