import React from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router';
import { LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useClinicData } from '../hooks/useClinicData';
import { splitQueues } from '../domain/visitWorkflow';
import GlobalSpinner from '../components/ui/GlobalSpinner';
import { ADMIN_ROLES } from './permissions';

const ClinicLandingPage = React.lazy(() => import('../components/ClinicLandingPage'));
const LandingDashboard = React.lazy(() => import('../components/LandingDashboard'));
const LoginModule = React.lazy(() => import('../components/LoginModule'));
const AdminModule = React.lazy(() => import('../components/AdminModule'));

export function LandingPage() {
  const navigate = useNavigate();
  const { activeLanguage, setActiveLanguage } = useLanguage();
  const { visitsQueue } = useClinicData();
  return (
    <ClinicLandingPage
      activeLanguage={activeLanguage}
      onToggleLanguage={setActiveLanguage}
      onOpenLogin={() => navigate('/login')}
      onOpenTelemetry={() => navigate('/telemetry')}
      doctorQueueLength={splitQueues(visitsQueue).doctor.length}
    />
  );
}

export function TelemetryPage() {
  const navigate = useNavigate();
  const { role } = useAuth();
  const { activeLanguage } = useLanguage();
  const d = useClinicData();
  const q = splitQueues(d.visitsQueue);
  return (
    <div className="min-h-screen bg-surface flex flex-col font-sans selection:bg-primary selection:text-white">
      <div className="sticky top-0 z-50 bg-surface-accent/95 backdrop-blur-md px-4 lg:px-8 py-3 flex items-center justify-between border-b border-line shadow-xs">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="text-xs font-bold bg-surface hover:bg-surface-accent px-3.5 py-2 rounded-none border border-line-subtle text-accent flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-2xs"
        >
          ← Back to Public Website
        </button>

        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-mono text-strong font-bold tracking-tight">
            LIVE OPERATIONAL TELEMETRY DASHBOARD
          </span>
        </div>

        <button
          type="button"
          onClick={() => navigate('/login')}
          className="text-xs font-bold bg-primary hover:bg-primary-hover px-4 py-2 rounded-none text-white flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md shadow-teal-500/20 hover:scale-105"
        >
          <LogIn className="w-3.5 h-3.5" />
          <span>Staff Portal Login</span>
        </button>
      </div>

      <div className="p-4 sm:p-6 lg:p-8 flex-1 max-w-7xl mx-auto w-full">
        <LandingDashboard
          userRole={role}
          userName={role ? 'Staff' : 'Guest'}
          triageQueue={q.triage}
          doctorQueue={q.doctor}
          pharmacyQueue={q.pharmacy}
          cashierQueue={q.cashier}
          completedVisits={d.completedVisits}
          patientsList={d.patientsList}
          activeLanguage={activeLanguage}
          onNavigateTab={(tab) => navigate(role ? `/app/${tab}` : '/login')}
          onOpenLogin={() => navigate('/login')}
        />
      </div>
    </div>
  );
}

export function LoginPage() {
  const { role, isLoading, signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  if (isLoading) return <GlobalSpinner />;
  // Already signed in (or just signed in): go back to the deep link they were sent from, otherwise to
  // their home: the admin console for admin/HR, the clinical dashboard for everyone else.
  if (role) {
    const from = (location.state as { from?: string } | null)?.from;
    const home = ADMIN_ROLES.includes(role) ? '/admin' : '/app/dashboard';
    return <Navigate to={from && from.startsWith('/') ? from : home} replace />;
  }
  const passwordSet = (location.state as { passwordSet?: boolean } | null)?.passwordSet;
  return (
    <LoginModule
      notice={passwordSet ? 'Your password is saved. Sign in with your email and new password.' : undefined}
      onLogin={signIn}
      onNavigate={(view) => navigate(view === 'landing' ? '/' : '/login')}
    />
  );
}

/** Route-level role check lives in App.tsx (RequireRole); this just wires data into the module. */
export function AdminPage() {
  const { role, signOut } = useAuth();
  const navigate = useNavigate();
  const { activeLanguage } = useLanguage();
  const d = useClinicData();
  return (
    <AdminModule
      onNavigate={async () => { await signOut(); navigate('/login', { replace: true }); }}
      userRole={role as 'admin' | 'hr'}
      onOpenDashboard={() => navigate('/app/dashboard')}
    />
  );
}
