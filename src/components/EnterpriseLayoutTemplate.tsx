import React, { useState, useEffect } from 'react';
import {
  Activity, Wifi, WifiOff, Eye, EyeOff, LayoutDashboard, Users, Stethoscope, 
  FileText, Pill, CreditCard, Search, Clock, RefreshCw, Building, 
  ChevronDown, LogOut, CalendarClock
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
  triageQueueLength?: number;
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
  triageQueueLength = 0,
  doctorQueueLength,
  pharmacyQueueLength,
  cashierQueueLength,
  children
}: EnterpriseLayoutTemplateProps) {
  // Live Real-Time Clock
  const [timeString, setTimeString] = useState<string>('');
  const [isSyncRefreshing, setIsSyncRefreshing] = useState<boolean>(false);
  const [globalSearchQuery, setGlobalSearchQuery] = useState<string>('');
  const [showClinicInfoTooltip, setShowClinicInfoTooltip] = useState<boolean>(false);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTimeString(now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' MYT');
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleManualSync = () => {
    setIsSyncRefreshing(true);
    setTimeout(() => setIsSyncRefreshing(false), 800);
  };

  const getUserInitials = (name: string) => {
    if (!name) return 'EX';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans text-slate-800 antialiased selection:bg-teal-600/20">
      
      {/* ========================================================================= */}
      {/* GLOBAL TOP HEADER BAR (SCHEME C: CRISP MEDICAL MINT & DAYLIGHT TEAL)        */}
      {/* ========================================================================= */}
      <header className="bg-[#0d9488] text-white px-4 sm:px-6 py-2.5 flex items-center justify-between border-b-2 border-[#0f766e] shrink-0 shadow-sm relative z-30 sticky top-0">

        {/* Left: Brand Identity & Interactive Clinic Tooltip */}
        <div className="flex items-center gap-3 relative">
          <div 
            onMouseEnter={() => setShowClinicInfoTooltip(true)}
            onMouseLeave={() => setShowClinicInfoTooltip(false)}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-none shrink-0 flex items-center justify-center transition-transform group-hover:scale-105">
              <img src="./logo_transparent.svg" alt="Mediclinic Enterprise Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-sm font-extrabold tracking-tight uppercase leading-none font-sans text-white group-hover:text-[#e0f5f2] transition-colors flex items-center gap-1.5">
                <span>{t.clinicName || 'MEDICLINIC ENTERPRISE'}</span>
                <ChevronDown className="w-3.5 h-3.5 text-[#e0f5f2] opacity-80 group-hover:opacity-100 transition-opacity" />
              </h1>
              <span className="text-[10px] text-[#e0f5f2] font-mono tracking-wider font-semibold block mt-0.5">
                Enterprise Clinical Suite v1.1.2
              </span>
            </div>
          </div>

          {/* Interactive Clinic Information Popover Tooltip */}
          {showClinicInfoTooltip && (
            <div className="absolute top-12 left-0 z-50 bg-[#0f766e] border border-[#2dd4bf]/40 p-4 shadow-2xl text-xs space-y-2 w-72 rounded-none animate-fadeIn">
              <div className="flex items-center justify-between border-b border-[#0d9488]/50 pb-2">
                <span className="font-extrabold text-white uppercase flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-[#e0f5f2]" /> Shah Alam Main Branch
                </span>
                <span className="px-1.5 py-0.5 bg-emerald-400/20 text-emerald-200 font-mono text-[9px] font-bold uppercase rounded-none border border-emerald-400/40">
                  Active 24/7
                </span>
              </div>
              <div className="space-y-1 text-teal-50 font-mono text-[11px]">
                <p>📍 Level 2, Menara Medical Suite</p>
                <p>📋 KKM License: Reg #KKM-2026-SL-8902</p>
                <p>📞 Emergency Hotline: +60 3-5510 8899</p>
              </div>
            </div>
          )}
        </div>

        {/* Center: Interactive Quick Search Bar */}
        <div className="hidden md:flex items-center gap-2 max-w-md w-full mx-4">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-teal-100/70" />
            <input
              type="text"
              placeholder="Search Patient Name, MRN, or ICD-10 Code..."
              value={globalSearchQuery}
              onChange={(e) => setGlobalSearchQuery(e.target.value)}
              className="w-full bg-[#0f766e] border border-[#2dd4bf]/40 text-xs text-white placeholder:text-teal-100/70 pl-8 pr-12 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#e0f5f2] focus:border-[#e0f5f2] rounded-none transition-all font-medium"
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-mono font-bold bg-[#0d9488] text-[#e0f5f2] px-1.5 py-0.5 border border-[#2dd4bf]/30 rounded-none pointer-events-none">
              ⌘K
            </span>
          </div>
        </div>

        {/* Right: Real-time Clock & Global Actions */}
        <div className="flex items-center gap-2.5 sm:gap-3">

          {/* Live Monospace Clock */}
          <div className="hidden xl:flex items-center gap-1.5 bg-[#0f766e] px-2.5 py-1 border border-[#2dd4bf]/40 font-mono text-xs text-[#e0f5f2] rounded-none font-bold">
            <Clock className="w-3.5 h-3.5 text-[#e0f5f2]" />
            <span>{timeString || '13:50:24 MYT'}</span>
          </div>

          {/* PWA Network Simulator toggle */}
          <button
            type="button"
            id="pwa-network-toggle"
            onClick={() => setIsOnline(!isOnline)}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-[#0f766e] rounded-none border border-[#2dd4bf]/40 hover:bg-[#0d9488] transition-all cursor-pointer text-[10px] uppercase font-bold font-mono text-white shadow-2xs"
            title="Toggle Simulated PWA Offline/Online Mode"
          >
            {isOnline ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-[#e0f5f2]" />
                <span className="text-white">{t.online || 'Online'}</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-rose-300 animate-pulse" />
                <span className="text-rose-200">{t.offline || 'Offline'}</span>
              </>
            )}
          </button>

          {/* PII Masking Toggle */}
          <button
            type="button"
            onClick={() => setShowPII(!showPII)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-none border transition-all cursor-pointer text-[10px] uppercase font-bold font-mono ${
              showPII 
                ? 'bg-amber-400/20 text-amber-200 border-amber-400/50 hover:bg-amber-400/30' 
                : 'bg-[#0f766e] text-white border border-[#2dd4bf]/40 hover:bg-[#0d9488]'
            }`}
            title="Toggle Global Patient PII Masking"
          >
            {showPII ? (
              <><Eye className="w-3.5 h-3.5" /> <span className="hidden sm:inline">PII Shown</span></>
            ) : (
              <><EyeOff className="w-3.5 h-3.5" /> <span className="hidden sm:inline">PII Masked</span></>
            )}
          </button>

          {/* Language Switcher (EN | BM) */}
          <div className="bg-[#0f766e] rounded-none border border-[#2dd4bf]/40 p-0.5 flex">
            <button
              type="button"
              id="lang-toggle-en"
              onClick={() => setActiveLanguage('EN')}
              className={`px-2 py-0.5 rounded-none text-[10px] font-bold transition-all cursor-pointer ${
                activeLanguage === 'EN' ? 'bg-white text-[#0d9488] font-black' : 'text-[#e0f5f2] hover:text-white'
              }`}
            >
              EN
            </button>
            <button
              type="button"
              id="lang-toggle-bm"
              onClick={() => setActiveLanguage('BM')}
              className={`px-2 py-0.5 rounded-none text-[10px] font-bold transition-all cursor-pointer ${
                activeLanguage === 'BM' ? 'bg-white text-[#0d9488] font-black' : 'text-[#e0f5f2] hover:text-white'
              }`}
            >
              BM
            </button>
          </div>

          {/* User Profile Avatar Pill */}
          <div className="flex items-center gap-2 bg-[#0f766e] border border-[#2dd4bf]/40 px-2.5 py-1 rounded-none">
            <div className="w-5 h-5 bg-[#0f3c4c] text-white font-mono text-[10px] font-black flex items-center justify-center rounded-none">
              {getUserInitials(userName)}
            </div>
            <span className="text-[#e0f5f2] hidden sm:inline text-xs font-mono font-bold uppercase">
              {userRole ? `${userRole.charAt(0).toUpperCase() + userRole.slice(1)} Suite` : 'Suite'}
            </span>
          </div>

          {/* Logout Button */}
          <button 
            type="button" 
            onClick={onSignOut} 
            className="text-xs bg-[#0f3c4c] hover:bg-rose-700 text-white px-3 py-1 rounded-none font-black transition-all cursor-pointer border border-[#0f3c4c] flex items-center gap-1 shadow-2xs"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>

      </header>

      {/* ========================================================================= */}
      {/* SUB-NAVIGATION BAR (SCHEME C: PURE WHITE CANVAS & CRISP MEDICAL TABS)       */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col overflow-hidden relative">

        <nav className="w-full bg-white text-slate-700 flex items-center justify-between border-b border-slate-200 shrink-0 px-4 overflow-x-auto custom-scrollbar shadow-xs relative z-10">

          <div className="flex items-center space-x-1 py-0" id="sidebar-navigation-links">

            {/* Dashboard Navigation Link */}
            <button
              type="button"
              id="sidebar-link-dashboard"
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center px-4 py-2.5 rounded-none text-xs font-bold cursor-pointer transition-all duration-200 whitespace-nowrap border-b-3 ${
                activeTab === 'dashboard'
                  ? 'bg-[#f0fdfa] text-[#0d9488] border-[#0d9488] font-black shadow-2xs'
                  : 'border-transparent text-slate-600 hover:bg-[#f0fdfa] hover:text-[#0d9488]'
              }`}
            >
              <div className="flex items-center gap-2">
                <LayoutDashboard className={`w-4 h-4 ${activeTab === 'dashboard' ? 'text-[#0d9488]' : 'text-slate-400'}`} />
                <span>{t.dashboard || 'Dashboard'}</span>
              </div>
            </button>

            {/* Registration Navigation Link */}
            {userRole === 'clinic-assistant' && (
              <button
                type="button"
                id="sidebar-link-registration"
                onClick={() => setActiveTab('registration')}
                className={`flex items-center px-4 py-2.5 rounded-none text-xs font-bold cursor-pointer transition-all duration-200 whitespace-nowrap border-b-3 ${
                  activeTab === 'registration'
                    ? 'bg-[#f0fdfa] text-[#0d9488] border-[#0d9488] font-black shadow-2xs'
                    : 'border-transparent text-slate-600 hover:bg-[#f0fdfa] hover:text-[#0d9488]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Users className={`w-4 h-4 ${activeTab === 'registration' ? 'text-[#0d9488]' : 'text-slate-400'}`} />
                  <span>{t.patientRegistration || 'Registration'}</span>
                </div>
              </button>
            )}

            {/* Triage Module Link */}
            {userRole === 'clinic-assistant' && (
              <button
                type="button"
                id="sidebar-link-triage"
                onClick={() => setActiveTab('triage')}
                className={`flex items-center px-4 py-2.5 rounded-none text-xs font-bold cursor-pointer transition-all duration-200 whitespace-nowrap border-b-3 ${
                  activeTab === 'triage'
                    ? 'bg-[#f0fdfa] text-[#0d9488] border-[#0d9488] font-black shadow-2xs'
                    : 'border-transparent text-slate-600 hover:bg-[#f0fdfa] hover:text-[#0d9488]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Activity className={`w-4 h-4 ${activeTab === 'triage' ? 'text-[#0d9488]' : 'text-slate-400'}`} />
                  <span>Triage Module</span>
                </div>
                {triageQueueLength > 0 && (
                  <span className={`text-[9px] font-bold font-mono px-1.5 py-0.5 rounded-none min-w-[16px] flex items-center justify-center ml-2 ${
                    activeTab === 'triage' ? 'bg-[#0d9488] text-white' : 'bg-[#e0f5f2] text-[#0f766e] border border-[#b2f5ea]'
                  }`}>
                    {triageQueueLength}
                  </span>
                )}
              </button>
            )}

            {/* Appointments Link */}
            {userRole === 'clinic-assistant' && (
              <button
                type="button"
                id="sidebar-link-appointments"
                onClick={() => setActiveTab('appointments')}
                className={`flex items-center px-4 py-2.5 rounded-none text-xs font-bold cursor-pointer transition-all duration-200 whitespace-nowrap border-b-3 ${
                  activeTab === 'appointments'
                    ? 'bg-[#f0fdfa] text-[#0d9488] border-[#0d9488] font-black shadow-2xs'
                    : 'border-transparent text-slate-600 hover:bg-[#f0fdfa] hover:text-[#0d9488]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <CalendarClock className={`w-4 h-4 ${activeTab === 'appointments' ? 'text-[#0d9488]' : 'text-slate-400'}`} />
                  <span>Appointments</span>
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
                  className={`flex items-center px-4 py-2.5 rounded-none text-xs font-bold cursor-pointer transition-all duration-200 whitespace-nowrap border-b-3 ${
                    activeTab === 'queue'
                      ? 'bg-[#f0fdfa] text-[#0d9488] border-[#0d9488] font-black shadow-2xs'
                      : 'border-transparent text-slate-600 hover:bg-[#f0fdfa] hover:text-[#0d9488]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Users className={`w-4 h-4 ${activeTab === 'queue' ? 'text-[#0d9488]' : 'text-slate-400'}`} />
                    <span>Patient Queue</span>
                  </div>
                  {doctorQueueLength > 0 && (
                    <span className={`text-[9px] font-bold font-mono px-1.5 py-0.5 rounded-none min-w-[16px] flex items-center justify-center ml-2 ${
                      activeTab === 'queue' ? 'bg-[#0d9488] text-white' : 'bg-[#e0f5f2] text-[#0f766e] border border-[#b2f5ea]'
                    }`}>
                      {doctorQueueLength}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  id="sidebar-link-consultation"
                  onClick={() => setActiveTab('consultation')}
                  className={`flex items-center px-4 py-2.5 rounded-none text-xs font-bold cursor-pointer transition-all duration-200 whitespace-nowrap border-b-3 ${
                    activeTab === 'consultation'
                      ? 'bg-[#f0fdfa] text-[#0d9488] border-[#0d9488] font-black shadow-2xs'
                      : 'border-transparent text-slate-600 hover:bg-[#f0fdfa] hover:text-[#0d9488]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Stethoscope className={`w-4 h-4 ${activeTab === 'consultation' ? 'text-[#0d9488]' : 'text-slate-400'}`} />
                    <span>Consultation Suite</span>
                  </div>
                </button>

                <button
                  type="button"
                  id="sidebar-link-reports"
                  onClick={() => setActiveTab('reports')}
                  className={`flex items-center px-4 py-2.5 rounded-none text-xs font-bold cursor-pointer transition-all duration-200 whitespace-nowrap border-b-3 ${
                    activeTab === 'reports'
                      ? 'bg-[#f0fdfa] text-[#0d9488] border-[#0d9488] font-black shadow-2xs'
                      : 'border-transparent text-slate-600 hover:bg-[#f0fdfa] hover:text-[#0d9488]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <FileText className={`w-4 h-4 ${activeTab === 'reports' ? 'text-[#0d9488]' : 'text-slate-400'}`} />
                    <span>Monthly Reports</span>
                  </div>
                </button>
              </>
            )}

            {/* Pharmacy / Dispensary Link */}
            {userRole === 'pharmacist' && (
              <button
                type="button"
                id="sidebar-link-dispensary"
                onClick={() => setActiveTab('dispensary')}
                className={`flex items-center px-4 py-2.5 rounded-none text-xs font-bold cursor-pointer transition-all duration-200 whitespace-nowrap border-b-3 ${
                  activeTab === 'dispensary'
                    ? 'bg-[#f0fdfa] text-[#0d9488] border-[#0d9488] font-black shadow-2xs'
                    : 'border-transparent text-slate-600 hover:bg-[#f0fdfa] hover:text-[#0d9488]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Pill className={`w-4 h-4 ${activeTab === 'dispensary' ? 'text-[#0d9488]' : 'text-slate-400'}`} />
                  <span>{t.dispensary || 'Dispensary'}</span>
                </div>
                {pharmacyQueueLength > 0 && (
                  <span className={`text-[9px] font-bold font-mono px-1.5 py-0.5 rounded-none min-w-[16px] flex items-center justify-center ml-2 ${
                    activeTab === 'dispensary' ? 'bg-[#0d9488] text-white' : 'bg-[#e0f5f2] text-[#0f766e] border border-[#b2f5ea]'
                  }`}>
                    {pharmacyQueueLength}
                  </span>
                )}
              </button>
            )}

            {/* Billing Link */}
            {userRole === 'clinic-assistant' && (
              <button
                type="button"
                id="sidebar-link-billing"
                onClick={() => setActiveTab('billing')}
                className={`flex items-center px-4 py-2.5 rounded-none text-xs font-bold cursor-pointer transition-all duration-200 whitespace-nowrap border-b-3 ${
                  activeTab === 'billing'
                    ? 'bg-[#f0fdfa] text-[#0d9488] border-[#0d9488] font-black shadow-2xs'
                    : 'border-transparent text-slate-600 hover:bg-[#f0fdfa] hover:text-[#0d9488]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <CreditCard className={`w-4 h-4 ${activeTab === 'billing' ? 'text-[#0d9488]' : 'text-slate-400'}`} />
                  <span>{t.billing || 'Billing'}</span>
                </div>
                {cashierQueueLength > 0 && (
                  <span className={`text-[9px] font-bold font-mono px-1.5 py-0.5 rounded-none min-w-[16px] flex items-center justify-center ml-2 ${
                    activeTab === 'billing' ? 'bg-[#0d9488] text-white' : 'bg-[#e0f5f2] text-[#0f766e] border border-[#b2f5ea]'
                  }`}>
                    {cashierQueueLength}
                  </span>
                )}
              </button>
            )}
          </div>

          {/* Nav Right Telemetry Sync Status & Manual Refresh Trigger */}
          <div className="hidden lg:flex items-center space-x-3 text-[10px] text-slate-500 font-mono pl-4 border-l border-slate-200 ml-4">
            <div className="flex items-center gap-1.5">
              <span>Sync:</span>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0d9488] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0d9488]"></span>
              </span>
              <span className="text-[#0d9488] font-bold uppercase">KKM-ONLINE</span>
            </div>

            <button
              type="button"
              onClick={handleManualSync}
              className="p-1 hover:bg-[#f0fdfa] text-[#0d9488] rounded-none transition-colors border border-[#b2f5ea]"
              title="Force Refresh Data Sync"
            >
              <RefreshCw className={`w-3 h-3 ${isSyncRefreshing ? 'animate-spin text-[#0d9488]' : ''}`} />
            </button>

            <div>
              <span>ID: <strong className="text-slate-800 font-mono">MY-APC-KLG-20</strong></span>
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
