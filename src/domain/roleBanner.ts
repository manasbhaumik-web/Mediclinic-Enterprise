import type { UserRole } from '../types';
import { ROLE_LABEL } from './roles';

/** Banner wording shared by the dashboard and every other staff page. */
export const ROLE_BANNER: Record<UserRole, { label: string; subtitle: string }> = {
  doctor: { label: 'Doctor dashboard', subtitle: 'Your consultation queue, patient flow and diagnosis trends.' },
  pharmacist: { label: 'Pharmacy dashboard', subtitle: 'Prescriptions awaiting fulfilment, stock levels and fast-moving medicines.' },
  receptionist: { label: 'Reception dashboard', subtitle: 'Register patients, manage appointments and see who is waiting for triage.' },
  'clinic-assistant': { label: 'Assistant dashboard', subtitle: 'Patients waiting for triage and clinical readings.' },
  cashier: { label: 'Cashier dashboard', subtitle: 'Visits ready for payment, collections and receipts.' },
  admin: { label: 'Administrator dashboard', subtitle: 'Clinic-wide operations, finance, compliance and administration.' },
  hr: { label: 'HR dashboard', subtitle: 'Staff, shifts and workforce administration.' },
};

/** Banner wording for someone holding several roles: the labels together and each role's description. */
export function bannerFor(roles: readonly UserRole[]): { label: string; subtitle: string } {
  const held = roles.filter((r) => ROLE_BANNER[r]);
  if (held.length <= 1) return ROLE_BANNER[held[0] ?? 'admin'];
  return { label: held.map((r) => ROLE_LABEL[r]).join(' · '), subtitle: held.map((r) => ROLE_BANNER[r].subtitle).join(' ') };
}

export function getGreeting(date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 18) return 'Good Afternoon';
  return 'Good Evening';
}
