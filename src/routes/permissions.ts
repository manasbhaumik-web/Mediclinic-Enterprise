import { UserRole } from '../types';

export type AppTab =
  | 'dashboard' | 'queue' | 'consultation' | 'reports'
  | 'registration' | 'triage' | 'dispensary' | 'billing' | 'appointments';

/** Roles allowed on each /app/* page. Mirrors what the old tab switch in App.tsx enforced. */
export const TAB_ROLES: Record<AppTab, readonly UserRole[]> = {
  dashboard: ['doctor', 'pharmacist', 'clinic-assistant', 'admin', 'hr'],
  queue: ['doctor'],
  consultation: ['doctor'],
  reports: ['doctor'],
  registration: ['clinic-assistant'],
  triage: ['clinic-assistant'],
  appointments: ['clinic-assistant', 'admin'],
  dispensary: ['pharmacist'],
  billing: ['clinic-assistant'],
};

export const ADMIN_ROLES: readonly UserRole[] = ['admin', 'hr'];

export const tabPath = (tab: string) => `/app/${tab}`;
