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
      {/* GLOBAL HEADER BAR - DARK EMERALD SLATE PALETTE */}
      <header className="bg-[#092e38] text-white px-6 py-3 flex items-center justify-between border-b border-[#0d9488]/40 shrink-0 shadow-md relative z-20 sticky top-0">

        {/* Clinician clinic logo titles */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-none overflow-hidden border border-[#14b8a6]/40 shadow-2xs shrink-0 bg-white flex items-center justify-center">
            <img src="./logo_primary.jpg" alt="Mediclinic Enterprise Logo" className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="text-sm font-extrabold tracking-tight uppercase leading-none font-sans text-white">
              {t.clinicName || 'MEDICLINIC ENTERPRISE'}
            </h1>
            <span className="text-[10px] text-[#2dd4bf] font-mono tracking-wider font-semibold">Enterprise Clinical Suite v1.1.2</span>
          </div>
        </div>

        {/* Global actions: network status PWA toggle, BM/EN translations control */}
        <div className="flex items-center gap-3">

          {/* PWA Network Simulator toggle */}
          <button
            type="button"
            id="pwa-network-toggle"
            onClick={() => setIsOnline(!isOnline)}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-[#0f3c4c] rounded-none border border-[#14b8a6]/40 hover:bg-[#134e4a] transition-colors cursor-pointer text-[10px] uppercase font-bold font-mono text-[#2dd4bf]"
            title="Simulate offline cache network mode"
          >
            {isOnline ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-[#2dd4bf]" />
                <span className="text-[#2dd4bf]">{t.online || 'Online'}</span>
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
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-none border transition-colors cursor-pointer text-[10px] uppercase font-bold font-mono ${
              showPII 
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 hover:bg-amber-500/30' 
                : 'bg-[#0f3c4c] text-[#2dd4bf] border border-[#14b8a6]/40 hover:bg-[#134e4a]'
            }`}
            title="Toggle Global PII Visibility"
          >
            {showPII ? (
              <><Eye className="w-3.5 h-3.5" /> <span>PII Shown</span></>
            ) : (
              <><EyeOff className="w-3.5 h-3.5" /> <span>PII Masked</span></>
            )}
          </button>

          {/* Lang Selector BM/EN switcher */}
          <div className="bg-[#0f3c4c] rounded-none border border-[#14b8a6]/40 p-0.5 flex">
            <button
              type="button"
              id="lang-toggle-en"
              onClick={() => setActiveLanguage('EN')}
              className={`px-2 py-0.5 rounded-none text-[10px] font-bold transition-all cursor-pointer ${
                activeLanguage === 'EN' ? 'bg-[#14b8a6] text-[#092e38] font-black' : 'text-[#2dd4bf] hover:text-white'
              }`}
            >
              {t.enToggle || 'EN'}
            </button>
            <button
              type="button"
              id="lang-toggle-bm"
              onClick={() => setActiveLanguage('BM')}
              className={`px-2 py-0.5 rounded-none text-[10px] font-bold transition-all cursor-pointer ${
                activeLanguage === 'BM' ? 'bg-[#14b8a6] text-[#092e38] font-black' : 'text-[#2dd4bf] hover:text-white'
              }`}
            >
              {t.bmToggle || 'BM'}
            </button>
          </div>

          <span className="text-[#5eead4] hidden sm:inline text-xs font-mono font-bold uppercase bg-[#134e4a] px-2.5 py-1 border border-[#14b8a6]/40 rounded-none">
            {userRole ? `${userRole.charAt(0).toUpperCase() + userRole.slice(1)} Suite` : 'Suite'}
          </span>

          <button 
            type="button" 
            onClick={onSignOut} 
            className="text-xs bg-[#14b8a6] hover:bg-rose-600 text-[#092e38] hover:text-white px-3 py-1 rounded-none font-black transition-colors cursor-pointer border border-[#14b8a6]"
          >
            Logout
          </button>
        </div>

      </header>

      {/* CORE FRAME LAYOUT */}
      <div className="flex-1 flex flex-col overflow-hidden relative">

        {/* TOP NAVIGATION BAR - DARK EMERALD SLATE TABS */}
        <nav className="w-full bg-[#0f3c4c] text-white flex items-center justify-between border-b border-[#0d9488]/40 shrink-0 px-4 overflow-x-auto custom-scrollbar shadow-xs relative z-10">

          <div className="flex items-center space-x-1 py-1.5" id="sidebar-navigation-links">

            {/* Generic Dashboard Icon */}
            <button
              type="button"
              id="sidebar-link-dashboard"
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center px-4 py-2 rounded-none text-xs font-bold cursor-pointer transition-all duration-200 whitespace-nowrap ${
                activeTab === 'dashboard'
                  ? 'bg-[#134e4a] text-[#2dd4bf] border-b-2 border-[#14b8a6] font-black shadow-2xs'
                  : 'text-slate-300 hover:bg-[#134e4a]/60 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <LayoutDashboard className={`w-4 h-4 ${activeTab === 'dashboard' ? 'text-[#2dd4bf]' : 'text-slate-400'}`} />
                <span>{t.dashboard || 'Dashboard'}</span>
              </div>
            </button>

            {/* Patient Registration Icon */}
            {userRole === 'clinic-assistant' && (
              <button
                type="button"
                id="sidebar-link-registration"
                onClick={() => setActiveTab('registration')}
                className={`flex items-center px-4 py-2 rounded-none text-xs font-bold cursor-pointer transition-all duration-200 whitespace-nowrap ${
                  activeTab === 'registration'
                    ? 'bg-[#134e4a] text-[#2dd4bf] border-b-2 border-[#14b8a6] font-black shadow-2xs'
                    : 'text-slate-300 hover:bg-[#134e4a]/60 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Users className={`w-4 h-4 ${activeTab === 'registration' ? 'text-[#2dd4bf]' : 'text-slate-400'}`} />
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
                  className={`flex items-center px-4 py-2 rounded-none text-xs font-bold cursor-pointer transition-all duration-200 whitespace-nowrap ${
                    activeTab === 'queue'
                      ? 'bg-[#134e4a] text-[#2dd4bf] border-b-2 border-[#14b8a6] font-black shadow-2xs'
                      : 'text-slate-300 hover:bg-[#134e4a]/60 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Users className={`w-4 h-4 ${activeTab === 'queue' ? 'text-[#2dd4bf]' : 'text-slate-400'}`} />
                    <span>Patient Queue</span>
                  </div>
                  {doctorQueueLength > 0 && (
                    <span className={`text-[9px] font-bold font-mono px-1.5 py-0.5 rounded-none min-w-[16px] flex items-center justify-center ml-2 ${
                      activeTab === 'queue' ? 'bg-[#14b8a6] text-[#092e38]' : 'bg-[#092e38] text-[#2dd4bf] border border-[#14b8a6]/40'
                    }`}>
                      {doctorQueueLength}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  id="sidebar-link-consultation"
                  onClick={() => setActiveTab('consultation')}
                  className={`flex items-center px-4 py-2 rounded-none text-xs font-bold cursor-pointer transition-all duration-200 whitespace-nowrap ${
                    activeTab === 'consultation'
                      ? 'bg-[#134e4a] text-[#2dd4bf] border-b-2 border-[#14b8a6] font-black shadow-2xs'
                      : 'text-slate-300 hover:bg-[#134e4a]/60 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Stethoscope className={`w-4 h-4 ${activeTab === 'consultation' ? 'text-[#2dd4bf]' : 'text-slate-400'}`} />
                    <span>Consultation Suite</span>
                  </div>
                </button>

                <button
                  type="button"
                  id="sidebar-link-reports"
                  onClick={() => setActiveTab('reports')}
                  className={`flex items-center px-4 py-2 rounded-none text-xs font-bold cursor-pointer transition-all duration-200 whitespace-nowrap ${
                    activeTab === 'reports'
                      ? 'bg-[#134e4a] text-[#2dd4bf] border-b-2 border-[#14b8a6] font-black shadow-2xs'
                      : 'text-slate-300 hover:bg-[#134e4a]/60 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <FileText className={`w-4 h-4 ${activeTab === 'reports' ? 'text-[#2dd4bf]' : 'text-slate-400'}`} />
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
                className={`flex items-center px-4 py-2 rounded-none text-xs font-bold cursor-pointer transition-all duration-200 whitespace-nowrap ${
                  activeTab === 'dispensary'
                    ? 'bg-[#134e4a] text-[#2dd4bf] border-b-2 border-[#14b8a6] font-black shadow-2xs'
                    : 'text-slate-300 hover:bg-[#134e4a]/60 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Pill className={`w-4 h-4 ${activeTab === 'dispensary' ? 'text-[#2dd4bf]' : 'text-slate-400'}`} />
                  <span>{t.dispensary || 'Dispensary'}</span>
                </div>
                {pharmacyQueueLength > 0 && (
                  <span className={`text-[9px] font-bold font-mono px-1.5 py-0.5 rounded-none min-w-[16px] flex items-center justify-center ml-2 ${
                    activeTab === 'dispensary' ? 'bg-[#14b8a6] text-[#092e38]' : 'bg-[#092e38] text-[#2dd4bf] border border-[#14b8a6]/40'
                  }`}>
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
                className={`flex items-center px-4 py-2 rounded-none text-xs font-bold cursor-pointer transition-all duration-200 whitespace-nowrap ${
                  activeTab === 'billing'
                    ? 'bg-[#134e4a] text-[#2dd4bf] border-b-2 border-[#14b8a6] font-black shadow-2xs'
                    : 'text-slate-300 hover:bg-[#134e4a]/60 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <CreditCard className={`w-4 h-4 ${activeTab === 'billing' ? 'text-[#2dd4bf]' : 'text-slate-400'}`} />
                  <span>{t.billing || 'Billing'}</span>
                </div>
                {cashierQueueLength > 0 && (
                  <span className={`text-[9px] font-bold font-mono px-1.5 py-0.5 rounded-none min-w-[16px] flex items-center justify-center ml-2 ${
                    activeTab === 'billing' ? 'bg-[#14b8a6] text-[#092e38]' : 'bg-[#092e38] text-[#2dd4bf] border border-[#14b8a6]/40'
                  }`}>
                    {cashierQueueLength}
                  </span>
                )}
              </button>
            )}
          </div>

          <div className="hidden lg:flex items-center space-x-4 text-[10px] text-slate-300 font-mono pl-4 border-l border-[#0d9488]/40 ml-4">
            <div className="flex items-center gap-1.5">
              <span>Sync:</span>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2dd4bf] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#14b8a6]"></span>
              </span>
              <span className="text-[#2dd4bf] font-bold uppercase">KKM-ONLINE</span>
            </div>
            <div>
              <span>ID: <strong className="text-white font-mono">MY-APC-KLG-20</strong></span>
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
