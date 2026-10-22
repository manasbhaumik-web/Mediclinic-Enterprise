import type { UserRole } from '../types';

/** Banner wording shared by the dashboard and every other staff page. */
export const ROLE_BANNER: Record<UserRole, { label: string; subtitle: string }> = {
  doctor: { label: 'Doctor dashboard', subtitle: 'Your consultation queue, patient flow and diagnosis trends.' },
  pharmacist: { label: 'Pharmacy dashboard', subtitle: 'Prescriptions awaiting fulfilment, stock levels and fast-moving medicines.' },
  'clinic-assistant': { label: 'Front desk dashboard', subtitle: 'Registration, triage, appointments and billing at a glance.' },
  admin: { label: 'Administrator dashboard', subtitle: 'Clinic-wide operations, finance, compliance and administration.' },
  hr: { label: 'HR dashboard', subtitle: 'Staff, shifts and workforce administration.' },
};

export function getGreeting(date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 18) return 'Good Afternoon';
  return 'Good Evening';
}
