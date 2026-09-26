import React, { useState, useEffect } from 'react';
import {
  Activity, Wifi, WifiOff, Eye, EyeOff, LayoutDashboard, Users, Stethoscope, 
  FileText, Pill, CreditCard, Search, Clock, RefreshCw, Building, 
  ChevronDown, LogOut, CalendarClock, Moon, Sun, ShieldAlert, CheckCircle2, UserCheck, Settings, Globe
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
  // Live Real-Time Clock & Sync timestamp
  const [timeString, setTimeString] = useState<string>('');
  const [lastSyncedTime, setLastSyncedTime] = useState<string>('');
  const [isSyncRefreshing, setIsSyncRefreshing] = useState<boolean>(false);
  const [showClinicInfoTooltip, setShowClinicInfoTooltip] = useState<boolean>(false);
  const [showUserMenu, setShowUserMenu] = useState<boolean>(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState<boolean>(false);
  const [isNightShift, setIsNightShift] = useState<boolean>(false);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTimeString(now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' MYT');
      if (!lastSyncedTime) {
        setLastSyncedTime(now.toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit' }));
      }
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, [lastSyncedTime]);

  const handleManualSync = () => {
    setIsSyncRefreshing(true);
    setTimeout(() => {
      setIsSyncRefreshing(false);
      const now = new Date();
      setLastSyncedTime(now.toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit' }));
    }, 800);
  };

  const getUserInitials = (name: string) => {
    if (!name) return 'EX';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans antialiased selection:bg-[#07b2b2]/20 transition-colors duration-300 ${
      isNightShift ? 'dark bg-[#092e38] text-slate-100' : 'bg-[#f8fafc] text-slate-800'
    }`}>
      
      {/* GLOBAL TOP HEADER BAR */}
      <header className="h-[60px] bg-[#0a837f] text-white px-4 sm:px-6 flex items-center justify-between border-b border-[#086b68] shrink-0 shadow-md shadow-black/10 relative z-30 sticky top-0 font-sans">

        {/* Left: Brand Identity & Interactive Clinic Tooltip */}
        <div className="flex items-center gap-3 relative">
          <div 
            onMouseEnter={() => setShowClinicInfoTooltip(true)}
            onMouseLeave={() => setShowClinicInfoTooltip(false)}
            className="flex items-center gap-3 cursor-pointer group focus-visible:ring-2 focus-visible:ring-[#2dd4bf] focus-visible:outline-none rounded-none"
            tabIndex={0}
          >
            <div className="w-8 h-8 rounded-none shrink-0 flex items-center justify-center transition-transform group-hover:scale-105">
              <img src="./logo_transparent.svg" alt="Mediclinic Enterprise Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-sm font-black tracking-tight uppercase leading-none font-sans text-white group-hover:text-teal-100 transition-colors flex items-center gap-1.5">
                <span>{t.clinicName || 'MEDICLINIC ENTERPRISE'}</span>
                <ChevronDown className="w-3.5 h-3.5 text-teal-100 opacity-80 group-hover:opacity-100 transition-opacity" />
              </h1>
              <span className="text-[10px] text-teal-100 font-mono tracking-wider font-semibold block mt-0.5">
                Shah Alam Main Branch • 24/7 Outpatient
              </span>
            </div>
          </div>

          {/* Clinic Information Popover Tooltip */}
          {showClinicInfoTooltip && (
            <div className="absolute top-12 left-0 z-50 bg-[#086b68] border border-[#065451] p-4 shadow-2xl text-xs space-y-2 w-72 rounded-none animate-fadeIn text-white font-sans">
              <div className="flex items-center justify-between border-b border-[#065451] pb-2">
                <span className="font-black text-white uppercase flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-teal-100" /> Clinic Info & License
                </span>
                <span className="px-2 py-0.5 bg-emerald-400/20 text-emerald-200 font-mono text-[9px] font-bold uppercase rounded-none border border-emerald-400/40">
                  Active 24/7
                </span>
              </div>
              <div className="space-y-1 text-teal-50 font-mono text-[11px]">
                <p>📍 Level 2, Menara Medical Suite</p>
                <p>📋 KKM License: Reg #KKM-2026-SL-8902</p>
                <p>📞 Emergency Hotline: +60 3-5510 8899</p>
                <p>🆔 Station Code: MY-APC-KLG-20 (v1.1.2)</p>
              </div>
            </div>
          )}
        </div>

        {/* Center: Persistent Abnormal State Indicator (Shows ONLY when offline or abnormal) */}
        {!isOnline && (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-rose-500/20 text-rose-100 border border-rose-400/50 rounded-none text-xs font-mono font-bold uppercase animate-pulse">
            <WifiOff className="w-3.5 h-3.5 text-rose-300" />
            <span>Offline Mode (Cached local data)</span>
          </div>
        )}

        {/* Right Controls: Consolidated Workstation Settings & User Menu */}
        <div className="flex items-center gap-3 relative">

          {/* Live Clock */}
          <div className="hidden xl:flex items-center gap-1.5 bg-[#086b68] px-2.5 py-1 border border-[#065451] font-mono text-xs text-white rounded-none font-bold shadow-2xs">
            <Clock className="w-3.5 h-3.5 text-teal-100" />
            <span>{timeString || '13:50:24 MYT'}</span>
          </div>

          {/* Combined Workstation Settings & Profile Menu Trigger */}
          <div className="relative">
            <button 
              type="button"
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 bg-[#086b68] hover:bg-[#065451] border border-[#065451] px-3 py-1.5 rounded-none cursor-pointer transition-colors shadow-2xs focus-visible:ring-2 focus-visible:ring-[#2dd4bf] focus-visible:outline-none"
              title="Workstation settings, user profile, and preferences"
              aria-expanded={showUserMenu}
            >
              <div className="w-6 h-6 bg-[#0a837f] text-white font-mono text-[11px] font-black flex items-center justify-center rounded-none border border-teal-300/40">
                {getUserInitials(userName)}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-white text-xs font-bold leading-none">{userName || 'Clinician'}</p>
                <p className="text-[9px] text-teal-100 font-mono uppercase tracking-wider mt-0.5">
                  {userRole ? `${userRole.charAt(0).toUpperCase() + userRole.slice(1)}` : 'Staff'}
                </p>
              </div>
              <Settings className="w-4 h-4 text-teal-100 ml-1" />
              <ChevronDown className="w-3.5 h-3.5 text-teal-200" />
            </button>

            {/* Consolidated Workstation Settings & Utility Popover Menu */}
            {showUserMenu && (
              <div className="absolute right-0 top-12 w-72 bg-[#07252d] border border-teal-800/80 p-4 shadow-2xl text-xs space-y-3 rounded-none animate-fadeIn text-white z-50 font-sans">
                <div className="flex items-center justify-between border-b border-teal-800/40 pb-2.5">
                  <div>
                    <p className="font-extrabold text-sm text-[#5eead4]">{userName || 'Clinician'}</p>
                    <p className="text-[10px] text-teal-200 font-mono uppercase">{userRole} Suite • Station #04</p>
                  </div>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" title="Active workstation session"></span>
                </div>

                {/* Utility Section: Workstation Settings */}
                <div className="space-y-2.5 pt-1">
                  <p className="text-[10px] font-mono uppercase text-teal-300 tracking-wider font-extrabold">Workstation Settings</p>
                  
                  {/* 1. Day / Night Shift Mode Toggle */}
                  <div className="flex items-center justify-between bg-[#0b333d] p-2 border border-teal-900/60">
                    <span className="text-teal-100 font-medium flex items-center gap-1.5">
                      {isNightShift ? <Moon className="w-3.5 h-3.5 text-amber-300" /> : <Sun className="w-3.5 h-3.5 text-amber-200" />}
                      <span>Theme Mode</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsNightShift(!isNightShift)}
                      className={`px-2.5 py-1 text-[10px] font-bold font-mono uppercase transition-colors cursor-pointer border ${
                        isNightShift ? 'bg-indigo-950 text-amber-300 border-indigo-700' : 'bg-teal-700 text-white border-teal-600'
                      }`}
                    >
                      {isNightShift ? 'Night Shift' : 'Day Mode'}
                    </button>
                  </div>

                  {/* 2. Privacy Mode (PII Masking) Toggle */}
                  <div className="flex items-center justify-between bg-[#0b333d] p-2 border border-teal-900/60">
                    <span className="text-teal-100 font-medium flex items-center gap-1.5">
                      {showPII ? <Eye className="w-3.5 h-3.5 text-amber-200" /> : <EyeOff className="w-3.5 h-3.5 text-emerald-300" />}
                      <span>Privacy Mask</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowPII(!showPII)}
                      className={`px-2.5 py-1 text-[10px] font-bold font-mono uppercase transition-colors cursor-pointer border ${
                        showPII ? 'bg-amber-500/30 text-amber-100 border-amber-400/50' : 'bg-emerald-500/30 text-emerald-200 border-emerald-400/40'
                      }`}
                    >
                      {showPII ? 'Off (Exposed)' : 'On (Masked)'}
                    </button>
                  </div>

                  {/* 3. PWA Network State Simulator */}
                  <div className="flex items-center justify-between bg-[#0b333d] p-2 border border-teal-900/60">
                    <span className="text-teal-100 font-medium flex items-center gap-1.5">
                      {isOnline ? <Wifi className="w-3.5 h-3.5 text-teal-200" /> : <WifiOff className="w-3.5 h-3.5 text-rose-300" />}
                      <span>Network State</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsOnline(!isOnline)}
                      className={`px-2.5 py-1 text-[10px] font-bold font-mono uppercase transition-colors cursor-pointer border ${
                        isOnline ? 'bg-emerald-700 text-white border-emerald-600' : 'bg-rose-900 text-rose-200 border-rose-700'
                      }`}
                    >
                      {isOnline ? 'Online' : 'Simulate Offline'}
                    </button>
                  </div>

                  {/* 4. Language Switcher */}
                  <div className="flex items-center justify-between bg-[#0b333d] p-2 border border-teal-900/60">
                    <span className="text-teal-100 font-medium flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-teal-200" />
                      <span>Language</span>
                    </span>
                    <div className="inline-flex border border-teal-700 font-mono text-[10px]">
                      <button
                        type="button"
                        onClick={() => setActiveLanguage('EN')}
                        className={`px-2 py-0.5 cursor-pointer uppercase ${activeLanguage === 'EN' ? 'bg-[#0d9488] text-white font-bold' : 'text-teal-200 hover:text-white'}`}
                      >
                        EN
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveLanguage('BM')}
                        className={`px-2 py-0.5 cursor-pointer uppercase ${activeLanguage === 'BM' ? 'bg-[#0d9488] text-white font-bold' : 'text-teal-200 hover:text-white'}`}
                      >
                        BM
                      </button>
                    </div>
                  </div>
                </div>

                {/* Sign Out Action */}
                <div className="border-t border-teal-800/40 pt-2.5">
                  <button 
                    type="button"
                    onClick={() => {
                      setShowUserMenu(false);
                      setShowSignOutConfirm(true);
                    }}
                    className="w-full text-left px-3 py-2 bg-rose-950/50 hover:bg-rose-900/80 text-rose-200 border border-rose-800/60 font-bold flex items-center justify-between rounded-none transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <LogOut className="w-4 h-4 text-rose-400" /> Sign Out Workstation...
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-rose-300" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

      </header>

      {/* WORKSPACE SUB-NAVIGATION BAR */}
      <div className="flex-1 flex flex-col overflow-hidden relative font-sans">

        <nav className="w-full bg-[#0d9488] text-white flex items-stretch justify-between border-b border-[#096b62] shrink-0 px-4 h-11 overflow-x-auto custom-scrollbar shadow-xs relative z-10 font-sans">

          <div className="flex items-stretch h-full" id="sidebar-navigation-links">

            {/* Dashboard Link */}
            <button
              type="button"
              id="sidebar-link-dashboard"
              onClick={() => setActiveTab('dashboard')}
              className={`nav-btn ${
                activeTab === 'dashboard' ? 'nav-btn-active' : 'nav-btn-inactive'
              }`}
            >
              <div className="flex items-center gap-2">
                {activeTab === 'dashboard' && <span className="w-1.5 h-1.5 rounded-none bg-[#2dd4bf] animate-pulse"></span>}
                <LayoutDashboard className={`w-4 h-4 ${activeTab === 'dashboard' ? 'text-white' : 'text-teal-200'}`} />
                <span>{t.dashboard || 'Dashboard'}</span>
              </div>
            </button>

            {/* Registration Navigation Link */}
            {userRole === 'clinic-assistant' && (
              <button
                type="button"
                id="sidebar-link-registration"
                onClick={() => setActiveTab('registration')}
                className={`nav-btn ${
                  activeTab === 'registration' ? 'nav-btn-active' : 'nav-btn-inactive'
                }`}
              >
                <div className="flex items-center gap-2">
                  {activeTab === 'registration' && <span className="w-1.5 h-1.5 rounded-none bg-[#2dd4bf] animate-pulse"></span>}
                  <Users className={`w-4 h-4 ${activeTab === 'registration' ? 'text-white' : 'text-teal-200'}`} />
                  <span>{t.patientRegistration || 'Patients & Registry'}</span>
                </div>
              </button>
            )}

            {/* Triage Module Link */}
            {userRole === 'clinic-assistant' && (
              <button
                type="button"
                id="sidebar-link-triage"
                onClick={() => setActiveTab('triage')}
                className={`nav-btn ${
                  activeTab === 'triage' ? 'nav-btn-active' : 'nav-btn-inactive'
                }`}
              >
                <div className="flex items-center gap-2">
                  {activeTab === 'triage' && <span className="w-1.5 h-1.5 rounded-none bg-[#2dd4bf] animate-pulse"></span>}
                  <Activity className={`w-4 h-4 ${activeTab === 'triage' ? 'text-white' : 'text-teal-200'}`} />
                  <span>Triage Module</span>
                </div>
                {triageQueueLength > 0 && (
                  <span className={`text-[9px] font-bold font-mono px-1.5 py-0.5 rounded-none min-w-[16px] flex items-center justify-center ml-2 ${
                    activeTab === 'triage' ? 'bg-[#2dd4bf] text-teal-950 font-black animate-pulse' : 'bg-[#0f766e] text-teal-100 border-0'
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
                className={`nav-btn ${
                  activeTab === 'appointments' ? 'nav-btn-active' : 'nav-btn-inactive'
                }`}
              >
                <div className="flex items-center gap-2">
                  {activeTab === 'appointments' && <span className="w-1.5 h-1.5 rounded-none bg-[#2dd4bf] animate-pulse"></span>}
                  <CalendarClock className={`w-4 h-4 ${activeTab === 'appointments' ? 'text-white' : 'text-teal-200'}`} />
                  <span>Appointments</span>
                </div>
              </button>
            )}

            {/* Doctor Suite Links */}
            {userRole === 'doctor' && (
              <>
                <button
                  type="button"
                  id="sidebar-link-queue"
                  onClick={() => setActiveTab('queue')}
                  className={`nav-btn ${
                    activeTab === 'queue' ? 'nav-btn-active' : 'nav-btn-inactive'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {activeTab === 'queue' && <span className="w-1.5 h-1.5 rounded-none bg-[#2dd4bf] animate-pulse"></span>}
                    <Users className={`w-4 h-4 ${activeTab === 'queue' ? 'text-white' : 'text-teal-200'}`} />
                    <span>Patient Queue</span>
                  </div>
                  {activeTab !== 'consultation' && doctorQueueLength > 0 && (
                    <span className={`text-[9px] font-bold font-mono px-1.5 py-0.5 rounded-none min-w-[16px] flex items-center justify-center ml-2 ${
                      activeTab === 'queue' ? 'bg-[#2dd4bf] text-teal-950 font-black animate-pulse' : 'bg-[#0f766e] text-teal-100 border-0'
                    }`}>
                      {doctorQueueLength}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  id="sidebar-link-consultation"
                  onClick={() => setActiveTab('consultation')}
                  className={`nav-btn ${
                    activeTab === 'consultation' ? 'nav-btn-active' : 'nav-btn-inactive'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {activeTab === 'consultation' && <span className="w-1.5 h-1.5 rounded-none bg-[#2dd4bf] animate-pulse"></span>}
                    <Stethoscope className={`w-4 h-4 ${activeTab === 'consultation' ? 'text-white' : 'text-teal-200'}`} />
                    <span>Consultation Suite</span>
                  </div>
                </button>

                <button
                  type="button"
                  id="sidebar-link-reports"
                  onClick={() => setActiveTab('reports')}
                  className={`nav-btn ${
                    activeTab === 'reports' ? 'nav-btn-active' : 'nav-btn-inactive'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {activeTab === 'reports' && <span className="w-1.5 h-1.5 rounded-none bg-[#2dd4bf] animate-pulse"></span>}
                    <FileText className={`w-4 h-4 ${activeTab === 'reports' ? 'text-white' : 'text-teal-200'}`} />
                    <span>Monthly Reports</span>
                  </div>
                </button>
              </>
            )}

            {/* Pharmacy Link */}
            {userRole === 'pharmacist' && (
              <button
                type="button"
                id="sidebar-link-dispensary"
                onClick={() => setActiveTab('dispensary')}
                className={`nav-btn ${
                  activeTab === 'dispensary' ? 'nav-btn-active' : 'nav-btn-inactive'
                }`}
              >
                <div className="flex items-center gap-2">
                  {activeTab === 'dispensary' && <span className="w-1.5 h-1.5 rounded-none bg-[#2dd4bf] animate-pulse"></span>}
                  <Pill className={`w-4 h-4 ${activeTab === 'dispensary' ? 'text-white' : 'text-teal-200'}`} />
                  <span>{t.dispensary || 'Dispensary'}</span>
                </div>
                {pharmacyQueueLength > 0 && (
                  <span className={`text-[9px] font-bold font-mono px-1.5 py-0.5 rounded-none min-w-[16px] flex items-center justify-center ml-2 ${
                    activeTab === 'dispensary' ? 'bg-[#2dd4bf] text-teal-950 font-black animate-pulse' : 'bg-[#0f766e] text-teal-100 border-0'
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
                className={`nav-btn ${
                  activeTab === 'billing' ? 'nav-btn-active' : 'nav-btn-inactive'
                }`}
              >
                <div className="flex items-center gap-2">
                  {activeTab === 'billing' && <span className="w-1.5 h-1.5 rounded-none bg-[#2dd4bf] animate-pulse"></span>}
                  <CreditCard className={`w-4 h-4 ${activeTab === 'billing' ? 'text-white' : 'text-teal-200'}`} />
                  <span>{t.billing || 'Billing'}</span>
                </div>
                {cashierQueueLength > 0 && (
                  <span className={`text-[9px] font-bold font-mono px-1.5 py-0.5 rounded-none min-w-[16px] flex items-center justify-center ml-2 ${
                    activeTab === 'billing' ? 'bg-[#2dd4bf] text-teal-950 font-black animate-pulse' : 'bg-[#0f766e] text-teal-100 border-0'
                  }`}>
                    {cashierQueueLength}
                  </span>
                )}
              </button>
            )}
          </div>

          {/* Sync Status & Sync Now Action */}
          <div className="hidden lg:flex items-center space-x-3 text-xs text-teal-50 font-sans pl-4 border-l border-[#0f766e] ml-4">
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
              </span>
              <span className="text-white font-bold font-mono">Last Synced: {lastSyncedTime || '12:44 PM'}</span>
            </div>

            <button
              type="button"
              onClick={handleManualSync}
              className="px-2.5 py-1 hover:bg-[#0f766e] text-white rounded-none transition-colors border border-[#096b62] font-sans text-[11px] font-bold flex items-center gap-1.5"
              title="Synchronize clinical records with KKM Gateway"
            >
              <RefreshCw className={`w-3 h-3 ${isSyncRefreshing ? 'animate-spin text-teal-200' : ''}`} />
              <span>Sync Now</span>
            </button>
          </div>

        </nav>

        {/* MAIN CONTAINER */}
        <main className="flex-1 p-5 overflow-y-auto max-h-full font-sans">
          {children}
        </main>
      </div>

      {/* Sign Out Confirmation Modal */}
      {showSignOutConfirm && (
        <div className="fixed inset-0 bg-[#06191f]/70 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans">
          <div className="bg-[#f7fdfd] dark:bg-[#07252d] border border-rose-500/50 rounded-none shadow-2xl max-w-sm w-full p-6 text-center space-y-4 animate-slideUp">
            <div className="w-12 h-12 bg-rose-100 dark:bg-rose-950/60 rounded-none mx-auto flex items-center justify-center text-rose-600 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
              <LogOut className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-lg text-[#0f3c4c] dark:text-[#5eead4] uppercase">Sign Out Workstation</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 font-medium">Are you sure you want to end your clinical session?</p>
            </div>
            <div className="flex gap-2 justify-center pt-2">
              <button
                onClick={() => setShowSignOutConfirm(false)}
                className="px-4 py-2 bg-[#f0fdfa] dark:bg-[#082830] text-[#0f766e] dark:text-teal-300 border border-[#b2f5ea] dark:border-teal-800 font-bold text-xs rounded-none uppercase"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowSignOutConfirm(false);
                  onSignOut();
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-none uppercase shadow-xs"
              >
                Confirm Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

