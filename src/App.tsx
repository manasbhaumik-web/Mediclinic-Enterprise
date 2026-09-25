import React, { useState, Suspense } from 'react';
import { Patient, Visit, Language, UserRole } from './types';
import { TRANSLATIONS } from './data';
import { useFinancials } from './context/FinancialContext';
import { useSupabaseSync } from './hooks/useSupabaseSync';
import { useAuth } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
import { InventoryProvider } from './context/InventoryContext';
import { AuxiliaryProvider } from './context/AuxiliaryContext';

// Import modules lazily (Code Splitting)
const MyKadScanner = React.lazy(() => import('./components/MyKadScanner'));
const DispensaryDashboard = React.lazy(() => import('./components/DispensaryDashboard'));
const BillingDesk = React.lazy(() => import('./components/BillingDesk'));
const LoginModule = React.lazy(() => import('./components/LoginModule'));
const AdminModule = React.lazy(() => import('./components/AdminModule'));
const DoctorDashboardModule = React.lazy(() => import('./components/DoctorDashboardModule'));

// Landing Dashboard & Public Landing Page (Keep Landing Dashboard sync for fast initial render if desired, but we'll lazy load everything to slash initial bundle size)
const LandingDashboard = React.lazy(() => import('./components/LandingDashboard'));
const ClinicLandingPage = React.lazy(() => import('./components/ClinicLandingPage'));
const PatientRegistrationModule = React.lazy(() => import('./components/PatientRegistrationModule'));
const TriageModule = React.lazy(() => import('./components/TriageModule'));
const AppointmentCalendarModule = React.lazy(() => import('./components/AppointmentCalendarModule'));

import GlobalSpinner from './components/ui/GlobalSpinner';
import EnterpriseLayoutTemplate from './components/EnterpriseLayoutTemplate';

// Import icons
import {
  Building, Users, FolderCheck, Stethoscope, Pill, CreditCard,
  Settings, Menu, LayoutDashboard, Globe, AlertCircle, Wifi, WifiOff,
  CheckCircle2, ChevronRight, Activity, X, UserCheck, MapPin,
  LogOut, ShieldAlert, FileText, Smartphone, MessageCircle, Network, BarChart3, Mic, LogIn, CalendarClock
} from 'lucide-react';

export default function App() {
  const { recordTransaction } = useFinancials();
  const { user, role: userRole, signIn, signOut } = useAuth();
  const effectiveRole = userRole || 'doctor';
  const [appView, setAppView] = useState<'landing' | 'telemetry' | 'login' | 'suite' | 'admin'>('suite');

  // Navigation Menu Active Page
  const [activeTab, setActiveTab] = useState<'dashboard' | 'queue' | 'consultation' | 'reports' | 'registration' | 'triage' | 'dispensary' | 'billing' | 'appointments'>('consultation');

  const handleLogin = async (role: UserRole) => {
    await signIn(role);
    if (role === 'admin' || role === 'hr') {
      setAppView('admin');
    } else {
      setAppView('suite');
      // Automatically route to dedicated dashboard view according to logged-in user role
      if (role === 'doctor') setActiveTab('queue');
      else if (role === 'pharmacist') setActiveTab('dispensary');
      else if (role === 'clinic-assistant') setActiveTab('triage');
      else setActiveTab('dashboard');
    }
  };

  // Multi-language active language (EN or BM)
  const [activeLanguage, setActiveLanguage] = useState<Language>('EN');
  const t = TRANSLATIONS[activeLanguage];

  // PWA Network Emulator State
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [showPII, setShowPII] = useState<boolean>(true);

  // Clinic State Databases with Supabase Sync
  const {
    patientsList,
    setPatientsList,
    visitsQueue,
    setVisitsQueue,
    completedVisits,
    setCompletedVisits,
    addPatientToDb,
    addVisitToDb,
    updateVisitInDb,
    appointments,
    addAppointmentToDb,
    updateAppointmentInDb,
    isSyncing
  } = useSupabaseSync();

  // Registration Form state
  const [whatsappToast, setWhatsappToast] = useState<string | null>(null);

  // Selected patient actively being consulted by doctor
  const [activeConsultationVisitId, setActiveConsultationVisitId] = useState<string | null>('v1');

  // Auto-translate genders helper
  const translateGender = (g: string) => {
    if (activeLanguage === 'BM') {
      return g === 'Male' ? 'Lelaki' : 'Perempuan';
    }
    return g;
  };

  // Time-based greeting helper
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Doctor Complete Case Soap Callback
  const handleDoctorSoapSubmit = (soapData: any, issueMc: boolean, mcDuration: number) => {
    if (!activeConsultationVisitId) return;

    const visit = visitsQueue.find(v => v.id === activeConsultationVisitId);
    if (visit) {
      updateVisitInDb({
        ...visit,
        soap: soapData,
        status: 'Awaiting Dispensation', // Sent to Pharmacy!
        mcIssued: issueMc,
      });
    }

    setActiveConsultationVisitId(null);
    setActiveTab('dashboard'); // Auto route back to dashboard
  };

  // Dispensary Pharmaceutic Complete callback
  const handleDispenseVerified = (visitId: string) => {
    const visit = visitsQueue.find(v => v.id === visitId);
    if (visit) {
      updateVisitInDb({
        ...visit,
        status: 'Awaiting Billing' // Route to Cashier invoice table
      });
    }

    setActiveTab('dashboard'); // Auto route back to dashboard
  };

  // Cashier Desk settled payment receipt callback
  const handleBillingSettled = (visitId: string, payInfo: any) => {
    // Audit log
    const indexVisit = visitsQueue.find(v => v.id === visitId);
    if (!indexVisit) return;

    const completedVisit: Visit = {
      ...indexVisit,
      status: 'Paid',
      paymentMethod: payInfo.paymentMethod,
      paidAmount: payInfo.paidAmount,
      panelClaimed: payInfo.panelClaimed,
      glNumber: payInfo.glNumber
    };

    recordTransaction({
      patientId: indexVisit.patientId,
      visitId: visitId,
      paymentMethod: payInfo.paymentMethod,
      paidAmount: payInfo.paidAmount,
      panelClaimed: payInfo.panelClaimed,
      glNumber: payInfo.glNumber
    });

    updateVisitInDb(completedVisit);
    setActiveTab('dashboard');
  };

  // Derived maps
  const patientsMap = patientsList.reduce<Record<string, Patient>>((acc, curr) => {
    acc[curr.id] = curr;
    return acc;
  }, {});

  // Categorize flow lists
  const triageQueue = visitsQueue.filter(v => v.status === 'Awaiting Triage');
  const doctorQueue = visitsQueue.filter(v => v.status === 'Awaiting Consult' || v.status === 'Consulting');
  const pharmacyQueue = visitsQueue.filter(v => v.status === 'Awaiting Dispensation');
  const cashierQueue = visitsQueue.filter(v => v.status === 'Awaiting Billing');

  const handleTriageComplete = (visitId: string, vitals: any, chiefComplaint: string) => {
    const visit = visitsQueue.find(v => v.id === visitId);
    if (visit) {
      updateVisitInDb({
        ...visit,
        soap: {
          ...visit.soap,
          subjective: chiefComplaint,
          objective: {
            ...visit.soap?.objective,
            ...vitals
          }
        },
        status: 'Awaiting Consult'
      });
    }
  };

  const getUserDisplayName = () => {
    if (user?.user_metadata?.full_name) return user.user_metadata.full_name;
    if (user?.email) return user.email.split('@')[0];
    if (userRole === 'doctor') return 'Dr. Sarah Jenkins';
    if (userRole === 'pharmacist') return 'Pharm. Ahmad Razak';
    if (userRole === 'clinic-assistant') return 'Clinic Assistant Siti Aishah';
    if (userRole === 'admin') return 'Administrator';
    return 'User';
  };

  const renderView = () => {
    if (appView === 'landing') return (
      <ClinicLandingPage
        activeLanguage={activeLanguage}
        onToggleLanguage={setActiveLanguage}
        onOpenLogin={() => setAppView('login')}
        onOpenTelemetry={() => setAppView('telemetry')}
        doctorQueueLength={doctorQueue.length}
      />
    );
    if (appView === 'telemetry') return (
      <div className="min-h-screen bg-[#f7fdfd] flex flex-col font-sans selection:bg-[#0d9488] selection:text-white">
        <div className="sticky top-0 z-50 bg-[#e0f5f2]/95 backdrop-blur-md px-4 lg:px-8 py-3 flex items-center justify-between border-b border-[#b2f5ea] shadow-xs">
          <button
            type="button"
            onClick={() => setAppView('landing')}
            className="text-xs font-extrabold bg-[#f7fdfd] hover:bg-[#e6f4f1] px-3.5 py-2 rounded-none border border-[#ccfbf1] text-[#0d9488] flex items-center gap-2 cursor-pointer transition-colors shadow-2xs"
          >
            ← Back to Public Website
          </button>
          
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-mono text-slate-900 font-black tracking-tight">
              LIVE OPERATIONAL TELEMETRY DASHBOARD
            </span>
          </div>

          <button
            type="button"
            onClick={() => setAppView('login')}
            className="text-xs font-extrabold bg-[#0d9488] hover:bg-[#0f766e] px-4 py-2 rounded-none text-white flex items-center gap-2 cursor-pointer transition-all shadow-md shadow-teal-500/20 hover:scale-105"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Staff Portal Login</span>
          </button>
        </div>

        <div className="p-4 sm:p-6 lg:p-8 flex-1 max-w-7xl mx-auto w-full">
          <LandingDashboard
            userRole={userRole}
            userName={getUserDisplayName()}
            triageQueue={triageQueue}
            doctorQueue={doctorQueue}
            pharmacyQueue={pharmacyQueue}
            cashierQueue={cashierQueue}
            completedVisits={completedVisits}
            patientsList={patientsList}
            activeLanguage={activeLanguage}
            onNavigateTab={setActiveTab}
            onOpenLogin={() => setAppView('login')}
          />
        </div>
      </div>
    );
    if (appView === 'login') return <LoginModule onLogin={handleLogin} onNavigate={(view) => {
      if (view === 'landing') setAppView('landing');
      else setAppView(view);
    }} />;
    if (appView === 'admin') return <AdminModule
      onNavigate={async () => {
        setAppView('login');
        await signOut();
      }}
      userRole={userRole as 'admin' | 'hr'}
      completedVisits={completedVisits}
      totalRegisteredCount={patientsList.length}
      activeLanguage={activeLanguage}
    />;
    return null;
  };

  const currentView = renderView();
  if (currentView) {
    return (
      <SettingsProvider>
        <InventoryProvider>
          <AuxiliaryProvider>
            {currentView}
          </AuxiliaryProvider>
        </InventoryProvider>
      </SettingsProvider>
    );
  }

  return (
    <SettingsProvider>
      <InventoryProvider>
        <AuxiliaryProvider>
          {/* Global Toast for WhatsApp */}
          {whatsappToast && (
            <div className="fixed top-20 right-8 z-[100] bg-emerald-500 text-white px-4 py-3 rounded-none shadow-xl flex items-center gap-3">
              <MessageCircle className="w-5 h-5" />
              <div>
                <p className="font-bold text-sm">WhatsApp Sent</p>
                <p className="text-xs text-emerald-100">{whatsappToast}</p>
              </div>
              <button onClick={() => setWhatsappToast(null)} className="ml-4 hover:text-emerald-200 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <EnterpriseLayoutTemplate
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            userName={getUserDisplayName()}
            userRole={userRole || 'doctor'}
            isOnline={isOnline}
            setIsOnline={setIsOnline}
            showPII={showPII}
            setShowPII={setShowPII}
            activeLanguage={activeLanguage}
            setActiveLanguage={setActiveLanguage}
            onSignOut={async () => { setAppView('login'); await signOut(); }}
            t={t}
            triageQueueLength={triageQueue.length}
            doctorQueueLength={doctorQueue.length}
            pharmacyQueueLength={pharmacyQueue.length}
            cashierQueueLength={cashierQueue.length}
          >
            <Suspense fallback={<GlobalSpinner />}>

              {/* DOCTOR MODULE: PATIENT QUEUE, CONSULTATION SUITE, MONTHLY REPORTS */}
              {(activeTab === 'queue' || activeTab === 'consultation' || activeTab === 'reports') && effectiveRole === 'doctor' && (
                <DoctorDashboardModule
                  doctorTab={activeTab === 'reports' ? 'reports' : activeTab === 'consultation' ? 'consultation' : 'queue'}
                  onTabChange={(t) => setActiveTab(t)}
                  doctorQueue={doctorQueue}
                  completedVisits={completedVisits}
                  patientsMap={patientsMap}
                  activeLanguage={activeLanguage}
                  activeConsultationVisitId={activeConsultationVisitId}
                  setActiveConsultationVisitId={setActiveConsultationVisitId}
                  onConsultationComplete={handleDoctorSoapSubmit}
                  doctorName={getUserDisplayName()}
                />
              )}

              {activeTab === 'dashboard' && (
                <LandingDashboard
                  userRole={userRole}
                  userName={getUserDisplayName()}
                  triageQueue={triageQueue}
                  doctorQueue={doctorQueue}
                  pharmacyQueue={pharmacyQueue}
                  cashierQueue={cashierQueue}
                  completedVisits={completedVisits}
                  patientsList={patientsList}
                  activeLanguage={activeLanguage}
                  onNavigateTab={(tab) => {
                    if (!userRole) {
                      setAppView('login');
                    } else {
                      setActiveTab(tab);
                    }
                  }}
                  onOpenLogin={() => setAppView('login')}
                />
              )}

              {/* TAB 2: PATIENT REGISTRATION MODULE */}
              {activeTab === 'registration' && userRole === 'clinic-assistant' && (
                <PatientRegistrationModule
                  t={t}
                  activeLanguage={activeLanguage}
                  searchPatients={async (query: string) => patientsList.filter(p => p.fullName.toLowerCase().includes(query.toLowerCase()) || p.icNumber.includes(query))}
                  totalPatientCount={patientsList.length}
                  triageQueue={triageQueue}
                  patientsMap={patientsMap}
                  addPatientToDb={addPatientToDb}
                  addVisitToDb={addVisitToDb}
                  updateVisitInDb={updateVisitInDb}
                  onNavigateTab={setActiveTab}
                />
              )}

              {/* TRIAGE MODULE */}
              {activeTab === 'triage' && userRole === 'clinic-assistant' && (
                <TriageModule
                  triageQueue={triageQueue}
                  patientsMap={patientsMap}
                  onTriageComplete={handleTriageComplete}
                />
              )}

              {/* APPOINTMENT CALENDAR MODULE */}
              {activeTab === 'appointments' && (userRole === 'clinic-assistant' || userRole === 'admin') && (
                <AppointmentCalendarModule
                  appointments={appointments}
                  patientsList={patientsList}
                  addAppointment={addAppointmentToDb}
                  updateAppointment={updateAppointmentInDb}
                />
              )}

              {/* DISPENSARY TAB */}
              {activeTab === 'dispensary' && userRole === 'pharmacist' && (
                <DispensaryDashboard
                  queue={pharmacyQueue}
                  patientsMap={patientsMap}
                  activeLanguage={activeLanguage}
                  onDispenseSubmit={handleDispenseVerified}
                  pharmacistName={getUserDisplayName()}
                />
              )}

              {/* BILLING TAB */}
              {activeTab === 'billing' && userRole === 'clinic-assistant' && (
                <BillingDesk
                  queue={cashierQueue}
                  patientsMap={patientsMap}
                  activeLanguage={activeLanguage}
                  onPaymentComplete={(visitId, paymentDetails) => handleBillingSettled(visitId, paymentDetails)}
                />
              )}

            </Suspense>
          </EnterpriseLayoutTemplate>
        </AuxiliaryProvider>
      </InventoryProvider>
    </SettingsProvider>
  );
}
