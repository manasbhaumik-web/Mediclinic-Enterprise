import React, { Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router';
import GlobalSpinner from './components/ui/GlobalSpinner';
import ErrorBoundary from './components/ui/ErrorBoundary';
import { RequireAuth, RequireRole } from './routes/guards';
import { ADMIN_ROLES, TAB_ROLES, type AppTab } from './routes/permissions';
import ClinicShell from './routes/ClinicShell';
import { APP_MODULES } from './modules';
import { APP_PAGES } from './routes/appPages';
import { AdminPage, LandingPage, LoginPage, TelemetryPage } from './routes/PublicPages';
import SetPasswordPage from './routes/SetPasswordPage';
import { TenantProvider } from './context/TenantContext';

/** Wraps a page so only the roles listed for it in TAB_ROLES can open it. */
const guarded = (tab: AppTab, page: React.ReactNode) => (
  <RequireRole roles={TAB_ROLES[tab]}>
    <ErrorBoundary fallbackTitle={`Workstation Error (${String(tab)})`}>
      {page}
    </ErrorBoundary>
  </RequireRole>
);

export default function App() {
  return (
    <ErrorBoundary fallbackTitle="Application Service Recovery">
      <Suspense fallback={<GlobalSpinner />}>
        <TenantProvider>
          <Routes>
            {/* Public Patient-Facing Tenant Landing Pages */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/c/:tenantSlug" element={<LandingPage />} />
            
            <Route path="/telemetry" element={<TelemetryPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/c/:tenantSlug/login" element={<LoginPage />} />
            <Route path="/set-password" element={<SetPasswordPage />} />

            {/* Authenticated Clinical & Admin Workstations */}
            <Route element={<RequireAuth />}>
              <Route path="/app" element={<ClinicShell />}>
                <Route index element={<Navigate to="dashboard" replace />} />
                {APP_MODULES.map((m) => (
                  <Route key={m.id} path={m.id} element={guarded(m.id, APP_PAGES[m.id])} />
                ))}
                <Route path="*" element={<Navigate to="/app/dashboard" replace />} />
              </Route>
              <Route path="/admin" element={<RequireRole roles={ADMIN_ROLES}><ErrorBoundary fallbackTitle="Admin Control Panel Error"><AdminPage /></ErrorBoundary></RequireRole>} />
              <Route path="/c/:tenantSlug/admin" element={<RequireRole roles={ADMIN_ROLES}><ErrorBoundary fallbackTitle="Admin Control Panel Error"><AdminPage /></ErrorBoundary></RequireRole>} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </TenantProvider>
      </Suspense>
    </ErrorBoundary>
  );
}
