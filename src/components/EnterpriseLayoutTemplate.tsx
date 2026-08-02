import React from 'react';
import {
  Activity, Wifi, WifiOff, Eye, EyeOff, LayoutDashboard, Users, Stethoscope, FileText, Pill, CreditCard, Mic
} from 'lucide-react';

interface EnterpriseLayoutTemplateProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userName: string;
  userRole: string;
  isOnline: boolean;
  setIsOnline: (val: boolean) => void;
  showPII: boolean;
  setShowPII: (val: boolean) => void;
  activeLanguage: string;
  setActiveLanguage: (val: string) => void;
  onSignOut: () => void;
  t: any;
  doctorQueueLength: number;
  pharmacyQueueLength: number;
  cashierQueueLength: number;
  children: React.ReactNode;
}

export default function EnterpriseLayoutTemplate({
  activeTab,
  setActiveTab,
  userName,
  userRole,
  isOnline,
  setIsOnline,
  showPII,
  setShowPII,
  activeLanguage,
  setActiveLanguage,
  onSignOut,
  t,
  doctorQueueLength,
  pharmacyQueueLength,
  cashierQueueLength,
  children
}: EnterpriseLayoutTemplateProps) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 antialiased selection:bg-teal-600/20">
      {/* GLOBAL HEADER BAR */}
      <header className="bg-gradient-to-r from-teal-600/95 via-teal-600/95 to-teal-700/95 backdrop-blur-md text-white px-6 py-3 flex items-center justify-between border-b border-teal-800/50 shrink-0 shadow-sm relative z-20 sticky top-0">

        {/* Clinician clinic logo titles */}
        <div className="flex items-center gap-3">
          <div className="bg-white/10 p-2 rounded-lg border border-teal-500/20 shadow-inner">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-extrabold tracking-tight uppercase leading-none font-sans">
              {t.clinicName || 'MEDICLINIC ENTERPRISE'}
            </h1>
            <span className="text-[10px] text-teal-200 font-mono tracking-wider">Enterprise Clinical Suite v1.1.2</span>
          </div>
        </div>

        {/* Global actions: network status PWA toggle, BM/EN translations control */}
        <div className="flex items-center gap-4">

          {/* PWA Network Simulator toggle */}
          <button
            type="button"
            id="pwa-network-toggle"
            onClick={() => setIsOnline(!isOnline)}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-teal-800/80 rounded border border-teal-700 hover:bg-teal-900 transition-colors cursor-pointer text-[10px] uppercase font-bold font-mono"
            title="Simulate offline cache network mode"
          >
            {isOnline ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-white" />
                <span className="text-white">{t.online || 'Online'}</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                <span className="text-rose-300">{t.offline || 'Offline'}</span>
              </>
            )}
          </button>

          {/* PII Masking Toggle */}
          <button
            type="button"
            onClick={() => setShowPII(!showPII)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded border transition-colors cursor-pointer text-[10px] uppercase font-bold font-mono ${showPII ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 hover:bg-amber-500/30' : 'bg-teal-800/80 text-teal-300 border-teal-700 hover:bg-teal-900'}`}
            title="Toggle Global PII Visibility"
          >
            {showPII ? (
              <><Eye className="w-3.5 h-3.5" /> <span>PII Shown</span></>
            ) : (
              <><EyeOff className="w-3.5 h-3.5" /> <span>PII Masked</span></>
            )}
          </button>

          {/* Lang Selector BM/EN switcher */}
          <div className="bg-teal-800/80 rounded border border-teal-700 p-0.5 flex">
            <button
              type="button"
              id="lang-toggle-en"
              onClick={() => setActiveLanguage('EN')}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${activeLanguage === 'EN' ? 'bg-teal-600 text-white shadow-xs' : 'text-teal-300 hover:text-white'
                }`}
            >
              {t.enToggle || 'EN'}
            </button>
            <button
              type="button"
              id="lang-toggle-bm"
              onClick={() => setActiveLanguage('BM')}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${activeLanguage === 'BM' ? 'bg-teal-600 text-white shadow-xs' : 'text-teal-300 hover:text-white'
                }`}
            >
              {t.bmToggle || 'BM'}
            </button>
          </div>

          <span className="text-slate-100 hidden sm:inline text-xs font-mono font-medium">
            {userRole ? `${userRole.charAt(0).toUpperCase() + userRole.slice(1)} Suite` : 'Suite'}
          </span>
          <button type="button" onClick={onSignOut} className="text-xs bg-teal-900/50 hover:bg-rose-500/80 text-white px-2 py-1 rounded transition-colors cursor-pointer">Logout</button>
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
                ? 'bg-teal-50 text-teal-600 shadow-sm ring-1 ring-teal-100/50'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                }`}
            >
              <div className="flex items-center gap-2">
                <LayoutDashboard className={`w-4 h-4 ${activeTab === 'dashboard' ? 'text-teal-600' : 'text-slate-400'}`} />
                <span>{t.dashboard || 'Dashboard'}</span>
              </div>
            </button>

            {/* Patient Registration Icon */}
            {userRole === 'clinic-assistant' && (
              <button
                type="button"
                id="sidebar-link-registration"
                onClick={() => setActiveTab('registration')}
                className={`flex items-center px-4 py-2.5 rounded-lg text-xs font-bold cursor-pointer transition-all duration-300 whitespace-nowrap ${activeTab === 'registration'
                  ? 'bg-teal-50 text-teal-600 shadow-sm ring-1 ring-teal-100/50'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                  }`}
              >
                <div className="flex items-center gap-2">
                  <Users className={`w-4 h-4 ${activeTab === 'registration' ? 'text-teal-600' : 'text-slate-400'}`} />
                  <span>{t.patientRegistration || 'Registration'}</span>
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
                    ? 'bg-teal-50 text-teal-600 shadow-sm ring-1 ring-teal-100/50'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                    }`}
                >
                  <div className="flex items-center gap-2">
                    <Users className={`w-4 h-4 ${activeTab === 'queue' ? 'text-teal-600' : 'text-slate-400'}`} />
                    <span>Patient Queue</span>
                  </div>
                  {doctorQueueLength > 0 && (
                    <span className="bg-rose-500 text-white text-[9px] font-bold font-mono px-1.5 py-0.5 rounded-full min-w-[16px] flex items-center justify-center ml-2">
                      {doctorQueueLength}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  id="sidebar-link-consultation"
                  onClick={() => setActiveTab('consultation')}
                  className={`flex items-center px-4 py-2.5 rounded-lg text-xs font-bold cursor-pointer transition-all duration-300 whitespace-nowrap ${activeTab === 'consultation'
                    ? 'bg-teal-50 text-teal-600 shadow-sm ring-1 ring-teal-100/50'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                    }`}
                >
                  <div className="flex items-center gap-2">
                    <Stethoscope className={`w-4 h-4 ${activeTab === 'consultation' ? 'text-teal-600' : 'text-slate-400'}`} />
                    <span>Consultation Suite</span>
                  </div>
                </button>

                <button
                  type="button"
                  id="sidebar-link-reports"
                  onClick={() => setActiveTab('reports')}
                  className={`flex items-center px-4 py-2.5 rounded-lg text-xs font-bold cursor-pointer transition-all duration-300 whitespace-nowrap ${activeTab === 'reports'
                    ? 'bg-teal-50 text-teal-600 shadow-sm ring-1 ring-teal-100/50'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                    }`}
                >
                  <div className="flex items-center gap-2">
                    <FileText className={`w-4 h-4 ${activeTab === 'reports' ? 'text-teal-600' : 'text-slate-400'}`} />
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
                  ? 'bg-teal-50 text-teal-600 shadow-sm ring-1 ring-teal-100/50'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                  }`}
              >
                <div className="flex items-center gap-2">
                  <Pill className={`w-4 h-4 ${activeTab === 'dispensary' ? 'text-teal-600' : 'text-slate-400'}`} />
                  <span>{t.dispensary || 'Dispensary'}</span>
                </div>
                {pharmacyQueueLength > 0 && (
                  <span className="bg-amber-500 text-white text-[9px] font-bold font-mono px-1.5 py-0.5 rounded-full min-w-[16px] flex items-center justify-center ml-2">
                    {pharmacyQueueLength}
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
                  ? 'bg-teal-50 text-teal-600 shadow-sm ring-1 ring-teal-100/50'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                  }`}
              >
                <div className="flex items-center gap-2">
                  <CreditCard className={`w-4 h-4 ${activeTab === 'billing' ? 'text-teal-600' : 'text-slate-400'}`} />
                  <span>{t.billing || 'Billing'}</span>
                </div>
                {cashierQueueLength > 0 && (
                  <span className="bg-blue-500 text-white text-[9px] font-bold font-mono px-1.5 py-0.5 rounded-full min-w-[16px] flex items-center justify-center ml-2">
                    {cashierQueueLength}
                  </span>
                )}
              </button>
            )}
          </div>

          <div className="hidden lg:flex items-center space-x-4 text-[10px] text-slate-400 font-mono pl-4 border-l border-slate-200 ml-4">
            <div className="flex items-center gap-1">
              <span>Sync:</span>
              <span className="text-teal-600 font-bold uppercase drop-shadow-sm">KKM-ONLINE</span>
            </div>
            <div>
              <span>ID: <strong>MY-APC-KLG-20</strong></span>
            </div>
          </div>

        </nav>

        {/* INNER PAGE STAGE WINDOW CONTAINER */}
        <main className="flex-1 p-5 overflow-y-auto max-h-full">
          {children}
        </main>
      </div>
    </div>
  );
}
