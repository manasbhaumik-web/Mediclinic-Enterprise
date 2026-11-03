import {
  LayoutDashboard, Users, Activity, CalendarClock, Stethoscope, FileText, Pill, PackageOpen, CreditCard,
} from 'lucide-react';
import type { UserRole } from '../types';
import { SYSTEM_ROLES } from '../../supabase/functions/_shared/staffAccess';
import type { AppModule } from './types';

const EVERYONE: readonly UserRole[] = SYSTEM_ROLES;

/**
 * Every staff page under /app/*, in navbar order. To add a page: add it here, add its screen to
 * `routes/appPages.tsx`, and (if it has a navbar label) its text to `data.ts`. Nothing else lists pages.
 */
export const APP_MODULES = [
  {
    id: 'dashboard', label: { en: 'Dashboard', bm: 'Papan Pemuka' }, hint: 'Today at a glance', icon: LayoutDashboard,
    roles: EVERYONE,
    nav: { labelKey: 'dashboard', fallback: 'Dashboard', always: true },
  },
  {
    id: 'registration', label: { en: 'Patient registration', bm: 'Pendaftaran pesakit' }, hint: 'Waiting room, registration form, registry', icon: Users,
    roles: ['receptionist', 'clinic-assistant'],
    nav: { labelKey: 'patientRegistration', fallback: 'Patients & Registry' },
  },
  {
    id: 'triage', label: { en: 'Triage station', bm: 'Stesen triaj' }, hint: 'Vitals, treatment room', icon: Activity,
    roles: ['clinic-assistant'],
    nav: { labelKey: 'triageModule', fallback: 'Triage Module', badge: 'triage' },
  },
  {
    id: 'appointments', label: { en: 'Appointments', bm: 'Temu janji' }, hint: 'Day schedule and booking', icon: CalendarClock,
    // Admins may open the page by URL; only receptionists get a navbar tab.
    roles: ['receptionist', 'admin'],
    nav: { labelKey: 'appointments', fallback: 'Appointments', roles: ['receptionist'] },
  },
  {
    id: 'queue', label: { en: 'Patient queue', bm: 'Giliran pesakit' }, hint: 'Doctor queue', icon: Users,
    roles: ['doctor'],
    nav: { labelKey: 'patientQueue', fallback: 'Patient Queue', badge: 'doctor', badgeHiddenOn: 'consultation' },
  },
  {
    id: 'consultation', label: { en: 'Consultation', bm: 'Perundingan' }, hint: 'See a patient', icon: Stethoscope,
    roles: ['doctor'],
    nav: { labelKey: 'consultationSuite', fallback: 'Consultation Suite' },
  },
  {
    id: 'reports', label: { en: 'Monthly report', bm: 'Laporan bulanan' }, hint: 'Your consultations and billing', icon: FileText,
    roles: ['doctor'],
    nav: { labelKey: 'monthlyReports', fallback: 'Monthly Reports' },
  },
  {
    id: 'dispensary', label: { en: 'Dispensary', bm: 'Farmasi' }, hint: 'Dispense, Buku Racun, dangerous drugs', icon: Pill,
    roles: ['pharmacist'],
    nav: { labelKey: 'dispensary', fallback: 'Dispensary', badge: 'pharmacy' },
  },
  {
    id: 'inventory', label: { en: 'Inventory and pharmacy', bm: 'Inventori dan farmasi' }, hint: 'Stock, orders, register, ledger', icon: PackageOpen,
    roles: ['pharmacist'],
    nav: { labelKey: 'inventory', fallback: 'Inventory' },
  },
  {
    id: 'billing', label: { en: 'Billing and panel claims', bm: 'Bil dan tuntutan panel' }, hint: 'Cashier invoicing, TPA claims', icon: CreditCard,
    roles: ['cashier'],
    nav: { labelKey: 'billing', fallback: 'Billing', badge: 'cashier' },
  },
  {
    id: 'my-leave', label: { en: 'My leave and attendance', bm: 'Cuti dan kehadiran saya' }, hint: 'Balances, requests', icon: CalendarClock,
    roles: EVERYONE,
    userMenu: true,
  },
] as const satisfies readonly AppModule[];

export type AppTab = (typeof APP_MODULES)[number]['id'];
