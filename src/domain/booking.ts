import { isCompleteNric, parseNric } from '../utils/nric';

/** Pure rules for the public online booking page. The database enforces the same rules; these give fast feedback. */

export const CLINIC_TIME_ZONE = 'Asia/Kuala_Lumpur';
export const BOOKING_DAYS_AHEAD = 30;

export const BOOKING_SERVICES = [
  { value: 'General Outpatient Consultation', en: 'General Outpatient Consultation', bm: 'Konsultasi Pesakit Luar Am' },
  { value: 'Pediatrics & Child Vaccination', en: 'Pediatrics & Child Vaccination', bm: 'Pediatrik & Vaksinasi Kanak-kanak' },
  { value: 'Executive Health Screening', en: 'Executive Health Screening', bm: 'Saringan Kesihatan Eksekutif' },
  { value: 'Corporate Panel TPA Visit', en: 'Corporate Panel TPA Visit', bm: 'Lawatan Panel Korporat TPA' },
] as const;

export interface BookingDetails { name: string; ic: string; phone: string }
export type BookingErrors = Partial<Record<keyof BookingDetails, string>>;

/** Phone number reduced to its digits, the way the database compares them. */
export const phoneDigits = (phone: string) => phone.replace(/\D/g, '');

export function validateBookingDetails(d: BookingDetails, bm = false): BookingErrors {
  const e: BookingErrors = {};
  const name = d.name.trim();
  if (name.length < 2 || name.length > 100) e.name = bm ? 'Sila masukkan nama penuh pesakit.' : "Please enter the patient's full name.";
  if (!isCompleteNric(d.ic.trim()) || !parseNric(d.ic.trim())) {
    e.ic = bm ? 'Masukkan nombor MyKad yang sah, contoh 900101-14-5555.' : 'Enter a valid MyKad number, for example 900101-14-5555.';
  }
  const digits = phoneDigits(d.phone);
  if (digits.length < 9 || digits.length > 13) e.phone = bm ? 'Sila masukkan nombor telefon yang sah.' : 'Please enter a valid phone number.';
  return e;
}

/** The date (YYYY-MM-DD) at the clinic for an instant. */
export function clinicDateKey(d: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: CLINIC_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
}

/** Today and the days ahead that can be booked, as clinic dates. */
export function bookableDays(now: Date, count = BOOKING_DAYS_AHEAD + 1): string[] {
  const [y, m, d] = clinicDateKey(now).split('-').map(Number);
  return Array.from({ length: count }, (_, i) => {
    const t = new Date(Date.UTC(y, m - 1, d + i));
    return t.toISOString().slice(0, 10);
  });
}

/** Label for a clinic date such as 2026-10-26: weekday, day and month. */
export function dayLabel(key: string, bm = false): { weekday: string; day: string; month: string } {
  const t = new Date(`${key}T12:00:00Z`);
  const loc = bm ? 'ms-MY' : 'en-MY';
  const f = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(loc, { timeZone: 'UTC', ...o }).format(t);
  return { weekday: f({ weekday: 'short' }), day: f({ day: 'numeric' }), month: f({ month: 'short' }) };
}

/** Time of a slot at the clinic, for example 9:00 AM. */
export function slotLabel(iso: string): string {
  return new Intl.DateTimeFormat('en-MY', { timeZone: CLINIC_TIME_ZONE, hour: 'numeric', minute: '2-digit', hour12: true }).format(new Date(iso)).toUpperCase();
}

export function whenLabel(iso: string, bm = false): string {
  const date = new Intl.DateTimeFormat(bm ? 'ms-MY' : 'en-MY', { timeZone: CLINIC_TIME_ZONE, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso));
  return `${date}, ${slotLabel(iso)}`;
}

/** Morning, afternoon and later slots, so a long day stays readable. */
export function groupSlots(slots: string[]): { key: 'morning' | 'afternoon'; slots: string[] }[] {
  const hour = (iso: string) => Number(new Intl.DateTimeFormat('en-GB', { timeZone: CLINIC_TIME_ZONE, hour: '2-digit', hour12: false }).format(new Date(iso)));
  const morning = slots.filter((s) => hour(s) < 12);
  const afternoon = slots.filter((s) => hour(s) >= 12);
  return [{ key: 'morning' as const, slots: morning }, { key: 'afternoon' as const, slots: afternoon }].filter((g) => g.slots.length > 0);
}
