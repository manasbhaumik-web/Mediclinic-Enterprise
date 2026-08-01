import React, { useState } from 'react';
import { Patient, Visit, Language, UserRole } from './types';
import { TRANSLATIONS } from './data';
import { useFinancials } from './context/FinancialContext';
import { useSupabaseSync } from './hooks/useSupabaseSync';
import { useAuth } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
import { InventoryProvider } from './context/InventoryContext';
import { AuxiliaryProvider } from './context/AuxiliaryContext';

// Import modules
import MyKadScanner from './components/MyKadScanner';
import DispensaryDashboard from './components/DispensaryDashboard';
import BillingDesk from './components/BillingDesk';
import LoginModule from './components/LoginModule';
import AdminModule from './components/AdminModule';
import DoctorDashboardModule from './components/DoctorDashboardModule';
// Landing Dashboard & Public Landing Page
import LandingDashboard from './components/LandingDashboard';
import ClinicLandingPage from './components/ClinicLandingPage';
import PatientRegistrationModule from './components/PatientRegistrationModule';

// Import icons
import {
  Building, Users, FolderCheck, Stethoscope, Pill, CreditCard,
  Settings, Menu, LayoutDashboard, Globe, AlertCircle, Wifi, WifiOff,
  CheckCircle2, ChevronRight, Activity, X, UserCheck, MapPin,
  LogOut, ShieldAlert, FileText, Smartphone, MessageCircle, Network, BarChart3, Mic, LogIn
} from 'lucide-react';

export default function App() {
  const { recordTransaction } = useFinancials();
  const { user, role: userRole, signIn, signOut } = useAuth();
  const [appView, setAppView] = useState<'landing' | 'telemetry' | 'login' | 'suite' | 'admin'>('landing');

  // Navigation Menu Active Page
  const [activeTab, setActiveTab] = useState<'dashboard' | 'queue' | 'consultation' | 'reports' | 'registration' | 'dispensary' | 'billing'>('queue');

  const handleLogin = async (role: UserRole) => {
    await signIn(role);
    if (role === 'admin' || role === 'hr') {
      setAppView('admin');
    } else {
      setAppView('suite');
      // Automatically route to dedicated dashboard view according to logged-in user role
      if (role === 'doctor') setActiveTab('queue');
      else if (role === 'pharmacist') setActiveTab('dispensary');
      else if (role === 'clinic-assistant') setActiveTab('registration');
      else setActiveTab('dashboard');
    }
  };

  // Multi-language active language (EN or BM)
  const [activeLanguage, setActiveLanguage] = useState<Language>('EN');
  const t = TRANSLATIONS[activeLanguage];

  // PWA Network Emulator State
  const [isOnline, setIsOnline] = useState<boolean>(true);

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
    isSyncing
  } = useSupabaseSync();

  // Registration Form state
  const [whatsappToast, setWhatsappToast] = useState<string | null>(null);

  // Selected patient actively being consulted by doctor
  const [activeConsultationVisitId, setActiveConsultationVisitId] = useState<string | null>(null);

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
  const doctorQueue = visitsQueue.filter(v => v.status === 'Awaiting Consult' || v.status === 'Consulting');
  const pharmacyQueue = visitsQueue.filter(v => v.status === 'Awaiting Dispensation');
  const cashierQueue = visitsQueue.filter(v => v.status === 'Awaiting Billing');

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
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <div className="bg-slate-900 px-6 py-3 text-white flex items-center justify-between border-b border-slate-800 shadow-md">
          <button
            type="button"
            onClick={() => setAppView('landing')}
            className="text-xs font-bold bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-700 text-teal-300 flex items-center gap-2 cursor-pointer transition-colors"
          >
            ← Back to Public Website
          </button>
          <span className="text-xs font-mono text-slate-300 font-semibold">Live Operational Telemetry Dashboard</span>
          <button
            type="button"
            onClick={() => setAppView('login')}
            className="text-xs font-bold bg-[#0D9488] hover:bg-teal-600 px-3.5 py-1.5 rounded-lg text-white flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Staff Portal Login</span>
          </button>
        </div>
        <div className="p-4 sm:p-6 flex-1">
          <LandingDashboard
            userRole={userRole}
            userName={getUserDisplayName()}
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
          <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 antialiased selection:bg-[#07B2B2]/20">
            {/* Global Toast for WhatsApp */}
            {whatsappToast && (
              <div className="fixed top-20 right-8 z-[100] bg-emerald-500 text-white px-4 py-3 rounded-lg shadow-xl flex items-center gap-3">
                <MessageCircle className="w-5 h-5" />
                <div>
                  <p className="font-bold text-sm">WhatsApp Sent</p>
                  <p className="text-xs text-emerald-100">{whatsappToast}</p>
                </div>
                <button onClick={() => setWhatsappToast(null)} className="ml-4 hover:text-emerald-200">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* GLOBAL HEADER BAR */}
            <header className="bg-gradient-to-r from-[#07B2B2] via-teal-600 to-[#058A8A] text-white px-6 py-3 flex items-center justify-between border-b border-teal-800/50 shrink-0 shadow-lg relative z-20">

              {/* Clinician clinic logo titles */}
              <div className="flex items-center gap-3">
                <div className="bg-white/10 p-2 rounded-lg border border-cyan-500/20 shadow-inner">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-sm font-extrabold tracking-tight uppercase leading-none font-sans">
                    {t.clinicName}
                  </h1>
                  <span className="text-[10px] text-cyan-200 font-mono tracking-wider">Enterprise Clinical Suite v1.1.2</span>
                </div>
              </div>

              {/* Global actions: network status PWA toggle, BM/EN translations control */}
              <div className="flex items-center gap-4">

                {/* PWA Network Simulator toggle */}
                <button
                  type="button"
                  id="pwa-network-toggle"
                  onClick={() => setIsOnline(!isOnline)}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-cyan-800/80 rounded border border-cyan-700 hover:bg-cyan-900 transition-colors cursor-pointer text-[10px] uppercase font-bold font-mono"
                  title="Simulate offline cache network mode"
                >
                  {isOnline ? (
                    <>
                      <Wifi className="w-3.5 h-3.5 text-white" />
                      <span className="text-white">{t.online}</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-3.5 h-3.5 text-red-400 animate-pulse" />
                      <span className="text-red-300">{t.offline}</span>
                    </>
                  )}
                </button>

                {/* Lang Selector BM/EN switcher */}
                <div className="bg-cyan-800/80 rounded border border-cyan-700 p-0.5 flex">
                  <button
                    type="button"
                    id="lang-toggle-en"
                    onClick={() => setActiveLanguage('EN')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${activeLanguage === 'EN' ? 'bg-[#07B2B2] text-white shadow-xs' : 'text-cyan-300 hover:text-white'
                      }`}
                  >
                    {t.enToggle}
                  </button>
                  <button
                    type="button"
                    id="lang-toggle-bm"
                    onClick={() => setActiveLanguage('BM')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${activeLanguage === 'BM' ? 'bg-[#07B2B2] text-white shadow-xs' : 'text-cyan-300 hover:text-white'
                      }`}
                  >
                    {t.bmToggle}
                  </button>
                </div>

                <span className="text-slate-100 hidden sm:inline text-xs font-mono font-medium">
                  {userRole ? `${userRole.charAt(0).toUpperCase() + userRole.slice(1)} Suite` : 'Suite'}
                </span>
                <button type="button" onClick={async () => { setAppView('login'); await signOut(); }} className="text-xs bg-cyan-900/50 hover:bg-red-500/80 text-white px-2 py-1 rounded transition-colors cursor-pointer">Logout</button>
              </div>

            </header>

            {/* CORE FRAME LAYOUT */}
            <div className="flex-1 flex flex-col overflow-hidden relative">

              {/* TOP NAVIGATION (Clinician tools bar) */}
              <nav className="w-full bg-white/95 backdrop-blur-md text-slate-600 flex items-center justify-between border-b border-slate-200 shrink-0 px-4 overflow-x-auto custom-scrollbar shadow-sm relative z-10">

                <div className="flex items-center space-x-1 py-2" id="sidebar-navigation-links">

                  {/* Generic Dashboard Icon */}
                  <button
                    type="button"
                    id="sidebar-link-dashboard"
                    onClick={() => setActiveTab('dashboard')}
                    className={`flex items-center px-4 py-2.5 rounded-lg text-xs font-bold cursor-pointer transition-all duration-300 whitespace-nowrap ${activeTab === 'dashboard'
                      ? 'bg-teal-50 text-[#07B2B2] shadow-sm ring-1 ring-teal-100/50'
                      : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                      }`}
                  >
                    <div className="flex items-center gap-2">
                      <LayoutDashboard className={`w-4 h-4 ${activeTab === 'dashboard' ? 'text-[#07B2B2]' : 'text-slate-400'}`} />
                      <span>{t.dashboard}</span>
                    </div>
                  </button>

                  {/* Patient Registration Icon */}
                  {userRole === 'clinic-assistant' && (
                    <button
                      type="button"
                      id="sidebar-link-registration"
                      onClick={() => setActiveTab('registration')}
                      className={`flex items-center px-4 py-2.5 rounded-lg text-xs font-bold cursor-pointer transition-all duration-300 whitespace-nowrap ${activeTab === 'registration'
                        ? 'bg-teal-50 text-[#07B2B2] shadow-sm ring-1 ring-teal-100/50'
                        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                        }`}
                    >
                      <div className="flex items-center gap-2">
                        <Users className={`w-4 h-4 ${activeTab === 'registration' ? 'text-[#07B2B2]' : 'text-slate-400'}`} />
                        <span>{t.patientRegistration}</span>
                      </div>
                    </button>
                  )}

                  {/* Doctor Suite Links: Patient Queue, Consultation Suite, Monthly Reports */}
                  {userRole === 'doctor' && (
                    <>
                      <button
                        type="button"
                        id="sidebar-link-queue"
                        onClick={() => setActiveTab('queue')}
                        className={`flex items-center px-4 py-2.5 rounded-lg text-xs font-bold cursor-pointer transition-all duration-300 whitespace-nowrap ${activeTab === 'queue'
                          ? 'bg-teal-50 text-[#07B2B2] shadow-sm ring-1 ring-teal-100/50'
                          : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                          }`}
                      >
                        <div className="flex items-center gap-2">
                          <Users className={`w-4 h-4 ${activeTab === 'queue' ? 'text-[#07B2B2]' : 'text-slate-400'}`} />
                          <span>Patient Queue</span>
                        </div>
                        {doctorQueue.length > 0 && (
                          <span className="bg-red-500 text-white text-[9px] font-bold font-mono px-1.5 py-0.5 rounded-full min-w-[16px] flex items-center justify-center ml-2">
                            {doctorQueue.length}
                          </span>
                        )}
                      </button>

                      <button
                        type="button"
                        id="sidebar-link-consultation"
                        onClick={() => setActiveTab('consultation')}
                        className={`flex items-center px-4 py-2.5 rounded-lg text-xs font-bold cursor-pointer transition-all duration-300 whitespace-nowrap ${activeTab === 'consultation'
                          ? 'bg-teal-50 text-[#07B2B2] shadow-sm ring-1 ring-teal-100/50'
                          : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                          }`}
                      >
                        <div className="flex items-center gap-2">
                          <Stethoscope className={`w-4 h-4 ${activeTab === 'consultation' ? 'text-[#07B2B2]' : 'text-slate-400'}`} />
                          <span>Consultation Suite</span>
                        </div>
                      </button>

                      <button
                        type="button"
                        id="sidebar-link-reports"
                        onClick={() => setActiveTab('reports')}
                        className={`flex items-center px-4 py-2.5 rounded-lg text-xs font-bold cursor-pointer transition-all duration-300 whitespace-nowrap ${activeTab === 'reports'
                          ? 'bg-teal-50 text-[#07B2B2] shadow-sm ring-1 ring-teal-100/50'
                          : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                          }`}
                      >
                        <div className="flex items-center gap-2">
                          <FileText className={`w-4 h-4 ${activeTab === 'reports' ? 'text-[#07B2B2]' : 'text-slate-400'}`} />
                          <span>Monthly Reports</span>
                        </div>
                      </button>
                    </>
                  )}

                  {/* Pharmacy / Dispensary Icon */}
                  {userRole === 'pharmacist' && (
                    <button
                      type="button"
                      id="sidebar-link-dispensary"
                      onClick={() => setActiveTab('dispensary')}
                      className={`flex items-center px-4 py-2.5 rounded-lg text-xs font-bold cursor-pointer transition-all duration-300 whitespace-nowrap ${activeTab === 'dispensary'
                        ? 'bg-teal-50 text-[#07B2B2] shadow-sm ring-1 ring-teal-100/50'
                        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                        }`}
                    >
                      <div className="flex items-center gap-2">
                        <Pill className={`w-4 h-4 ${activeTab === 'dispensary' ? 'text-[#07B2B2]' : 'text-slate-400'}`} />
                        <span>{t.dispensary}</span>
                      </div>
                      {pharmacyQueue.length > 0 && (
                        <span className="bg-orange-500 text-white text-[9px] font-bold font-mono px-1.5 py-0.5 rounded-full min-w-[16px] flex items-center justify-center ml-2">
                          {pharmacyQueue.length}
                        </span>
                      )}
                    </button>
                  )}

                  {/* Billing claims receipt ledger icon */}
                  {userRole === 'clinic-assistant' && (
                    <button
                      type="button"
                      id="sidebar-link-billing"
                      onClick={() => setActiveTab('billing')}
                      className={`flex items-center px-4 py-2.5 rounded-lg text-xs font-bold cursor-pointer transition-all duration-300 whitespace-nowrap ${activeTab === 'billing'
                        ? 'bg-teal-50 text-[#07B2B2] shadow-sm ring-1 ring-teal-100/50'
                        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                        }`}
                    >
                      <div className="flex items-center gap-2">
                        <CreditCard className={`w-4 h-4 ${activeTab === 'billing' ? 'text-[#07B2B2]' : 'text-slate-400'}`} />
                        <span>{t.billing}</span>
                      </div>
                      {cashierQueue.length > 0 && (
                        <span className="bg-blue-500 text-white text-[9px] font-bold font-mono px-1.5 py-0.5 rounded-full min-w-[16px] flex items-center justify-center ml-2">
                          {cashierQueue.length}
                        </span>
                      )}
                    </button>
                  )}
                </div>

                <div className="hidden lg:flex items-center space-x-4 text-[10px] text-slate-400 font-mono pl-4 border-l border-slate-200 ml-4">
                  <div className="flex items-center gap-1">
                    <span>Sync:</span>
                    <span className="text-[#07B2B2] font-bold uppercase drop-shadow-sm">KKM-ONLINE</span>
                  </div>
                  <div>
                    <span>ID: <strong>MY-APC-KLG-20</strong></span>
                  </div>
                </div>

              </nav>

              {/* INNER PAGE STAGE WINDOW CONTAINER */}
              <main className="flex-1 p-5 overflow-y-auto max-h-full">

                {/* DOCTOR MODULE: PATIENT QUEUE, CONSULTATION SUITE, MONTHLY REPORTS */}
                {(activeTab === 'queue' || activeTab === 'consultation' || activeTab === 'reports') && userRole === 'doctor' && (
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
                    patientsList={patientsList}
                    addPatientToDb={addPatientToDb}
                    addVisitToDb={addVisitToDb}
                    onNavigateTab={setActiveTab}
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

              </main>
            </div>

            {/* GLOBAL SIMULATED MYKAD MODAL REMOVED (Now inside PatientRegistrationModule) */}

            {/* GLOBAL VOICE AI / NLP ASSISTANT */}
            <div className="fixed bottom-6 right-6 z-50">
              <button
                className="bg-[#07B2B2] hover:bg-[#058A8A] text-white w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-105 relative group cursor-pointer border-4 border-white"
                title="Voice AI Command"
              >
                <div className="absolute inset-0 bg-[#07B2B2] rounded-full animate-ping opacity-20"></div>
                <Mic className="w-6 h-6" />
              </button>
            </div>

          </div>
        </AuxiliaryProvider>
      </InventoryProvider>
    </SettingsProvider>
  );
}
