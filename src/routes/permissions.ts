import { UserRole } from '../types';

export type AppTab =
  | 'dashboard' | 'queue' | 'consultation' | 'reports'
  | 'registration' | 'triage' | 'dispensary' | 'billing' | 'appointments' | 'my-leave' | 'inventory';

/** Roles allowed on each /app/* page. Mirrors what the old tab switch in App.tsx enforced. */
export const TAB_ROLES: Record<AppTab, readonly UserRole[]> = {
  dashboard: ['doctor', 'pharmacist', 'receptionist', 'clinic-assistant', 'cashier', 'admin', 'hr'],
  queue: ['doctor'],
  consultation: ['doctor'],
  reports: ['doctor'],
  registration: ['receptionist'],
  triage: ['clinic-assistant'],
  appointments: ['receptionist', 'admin'],
  dispensary: ['pharmacist'],
  inventory: ['pharmacist'],
  billing: ['cashier'],
  'my-leave': ['doctor', 'pharmacist', 'receptionist', 'clinic-assistant', 'cashier', 'admin', 'hr'],
};

/** Whether anyone holding `roles` may open `tab`. A person with several roles gets the union of their pages. */
export const canOpenTab = (roles: readonly UserRole[] | null | undefined, tab: AppTab): boolean =>
  !!roles && roles.some((r) => TAB_ROLES[tab].includes(r));

export const ADMIN_ROLES: readonly UserRole[] = ['admin', 'hr'];

export const tabPath = (tab: string) => `/app/${tab}`;
