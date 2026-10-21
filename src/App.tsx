import React, { Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router';
import GlobalSpinner from './components/ui/GlobalSpinner';
import { RequireAuth, RequireRole } from './routes/guards';
import { ADMIN_ROLES, TAB_ROLES } from './routes/permissions';
import ClinicShell from './routes/ClinicShell';
import {
  AppointmentsPage, BillingPage, DashboardPage, DispensaryPage, DoctorPage, MyLeavePage, RegistrationPage, TriagePage,
} from './routes/ClinicPages';
import { AdminPage, LandingPage, LoginPage, TelemetryPage } from './routes/PublicPages';
import SetPasswordPage from './routes/SetPasswordPage';

/** Wraps a page so only the roles listed for it in TAB_ROLES can open it. */
const guarded = (tab: keyof typeof TAB_ROLES, page: React.ReactNode) => (
  <RequireRole roles={TAB_ROLES[tab]}>{page}</RequireRole>
);

export default function App() {
  return (
    <Suspense fallback={<GlobalSpinner />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/telemetry" element={<TelemetryPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/set-password" element={<SetPasswordPage />} />

        <Route element={<RequireAuth />}>
          <Route path="/app" element={<ClinicShell />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={guarded('dashboard', <DashboardPage />)} />
            <Route path="queue" element={guarded('queue', <DoctorPage tab="queue" />)} />
            <Route path="consultation" element={guarded('consultation', <DoctorPage tab="consultation" />)} />
            <Route path="reports" element={guarded('reports', <DoctorPage tab="reports" />)} />
            <Route path="registration" element={guarded('registration', <RegistrationPage />)} />
            <Route path="triage" element={guarded('triage', <TriagePage />)} />
            <Route path="appointments" element={guarded('appointments', <AppointmentsPage />)} />
            <Route path="dispensary" element={guarded('dispensary', <DispensaryPage />)} />
            <Route path="billing" element={guarded('billing', <BillingPage />)} />
            <Route path="my-leave" element={guarded('my-leave', <MyLeavePage />)} />
            <Route path="*" element={<Navigate to="/app/dashboard" replace />} />
          </Route>
          <Route path="/admin" element={<RequireRole roles={ADMIN_ROLES}><AdminPage /></RequireRole>} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
