import type { ReactNode } from 'react';
import type { AppTab } from '../modules/appModules';
import {
  AppointmentsPage, BillingPage, DashboardPage, DispensaryPage, DoctorPage, InventoryRoutePage, MyLeavePage, RegistrationPage, TriagePage,
} from './ClinicPages';

/**
 * The screen each staff page renders. Kept apart from the registry (`src/modules`) so the registry stays
 * plain data; the type makes the build fail if a registered page has no screen.
 */
export const APP_PAGES: Record<AppTab, ReactNode> = {
  dashboard: <DashboardPage />,
  registration: <RegistrationPage />,
  triage: <TriagePage />,
  appointments: <AppointmentsPage />,
  queue: <DoctorPage tab="queue" />,
  consultation: <DoctorPage tab="consultation" />,
  reports: <DoctorPage tab="reports" />,
  dispensary: <DispensaryPage />,
  inventory: <InventoryRoutePage />,
  billing: <BillingPage />,
  'my-leave': <MyLeavePage />,
};
