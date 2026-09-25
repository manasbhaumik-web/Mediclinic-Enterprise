import React, { useState, useEffect } from 'react';
import {
  Activity, Wifi, WifiOff, Eye, EyeOff, LayoutDashboard, Users, Stethoscope, 
  FileText, Pill, CreditCard, Search, Clock, RefreshCw, Building, 
  ChevronDown, LogOut, CalendarClock, Moon, Sun
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
  const [isNightShift, setIsNightShift] = useState<boolean>(false);

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
    <div className={`min-h-screen flex flex-col font-sans antialiased selection:bg-[#07b2b2]/20 transition-colors duration-300 ${
      isNightShift ? 'dark bg-[#092e38] text-slate-100' : 'bg-[#f8fafc] text-slate-800'
    }`}>
      
      {/* ========================================================================= */}
      {/* GLOBAL TOP HEADER BAR (DARK ICE MINT TONE: #0A837F)                        */}
      {/* ========================================================================= */}
      <header className="bg-[#0a837f] text-white px-4 sm:px-6 py-2.5 flex items-center justify-between border-b border-[#086b68] shrink-0 shadow-md shadow-black/10 relative z-30 sticky top-0">

        {/* Left: Brand Identity & Interactive Clinic Tooltip */}
        <div className="flex items-center gap-3 relative">
          <div 
            onMouseEnter={() => setShowClinicInfoTooltip(true)}
            onMouseLeave={() => setShowClinicInfoTooltip(false)}
            className="flex items-center gap-3 cursor-pointer group focus-visible:ring-2 focus-visible:ring-[#2dd4bf] focus-visible:outline-none rounded-md"
            tabIndex={0}
          >
            <div className="w-9 h-9 rounded-none shrink-0 flex items-center justify-center transition-transform group-hover:scale-105">
              <img src="./logo_transparent.svg" alt="Mediclinic Enterprise Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-sm font-extrabold tracking-tight uppercase leading-none font-sans text-white group-hover:text-teal-100 transition-colors flex items-center gap-1.5">
                <span>{t.clinicName || 'MEDICLINIC ENTERPRISE'}</span>
                <ChevronDown className="w-3.5 h-3.5 text-teal-100 opacity-80 group-hover:opacity-100 transition-opacity" />
              </h1>
              <span className="text-[10px] text-teal-100 font-mono tracking-wider font-semibold block mt-0.5">
                Enterprise Clinical Suite v1.1.2
              </span>
            </div>
          </div>

          {/* Interactive Clinic Information Popover Tooltip */}
          {showClinicInfoTooltip && (
            <div className="absolute top-12 left-0 z-50 bg-[#086b68] border border-[#065451] p-4 shadow-2xl text-xs space-y-2 w-72 rounded-md animate-fadeIn text-white">
              <div className="flex items-center justify-between border-b border-[#065451] pb-2">
                <span className="font-extrabold text-white uppercase flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-teal-100" /> Shah Alam Main Branch
                </span>
                <span className="px-1.5 py-0.5 bg-emerald-400/20 text-emerald-200 font-mono text-[9px] font-bold uppercase rounded-md border border-emerald-400/40">
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

        {/* Right: Real-time Clock, Night Shift Toggle & Global Actions */}
        <div className="flex items-center gap-2.5 sm:gap-3">

          {/* Live Monospace Clock */}
          <div className="hidden xl:flex items-center gap-1.5 bg-[#086b68] px-2.5 py-1 border border-[#065451] font-mono text-xs text-white rounded-md font-bold shadow-2xs">
            <Clock className="w-3.5 h-3.5 text-teal-100" />
            <span>{timeString || '13:50:24 MYT'}</span>
          </div>

          {/* Night Shift Dark Mode Toggle */}
          <button
            type="button"
            onClick={() => setIsNightShift(!isNightShift)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border transition-all cursor-pointer text-[10px] uppercase font-bold font-mono shadow-2xs focus-visible:ring-2 focus-visible:ring-[#2dd4bf] focus-visible:outline-none ${
              isNightShift 
                ? 'bg-indigo-950/80 text-amber-300 border-indigo-700/60 hover:bg-indigo-900' 
                : 'bg-[#086b68] text-white border border-[#065451] hover:bg-[#065451]'
            }`}
            title="Toggle Night Shift Ergonomic Dark Mode"
          >
            {isNightShift ? (
              <><Moon className="w-3.5 h-3.5 text-amber-300" /> <span className="hidden sm:inline">Night Shift</span></>
            ) : (
              <><Sun className="w-3.5 h-3.5 text-amber-200" /> <span className="hidden sm:inline">Day Mode</span></>
            )}
          </button>

          {/* PWA Network Simulator toggle */}
          <button
            type="button"
            id="pwa-network-toggle"
            onClick={() => setIsOnline(!isOnline)}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-[#086b68] rounded-md border border-[#065451] hover:bg-[#065451] transition-all cursor-pointer text-[10px] uppercase font-bold font-mono text-white shadow-2xs focus-visible:ring-2 focus-visible:ring-[#2dd4bf] focus-visible:outline-none"
            title="Toggle Simulated PWA Offline/Online Mode"
          >
            {isOnline ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-teal-100" />
                <span className="text-white">{t.online || 'Online'}</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-rose-300 animate-pulse" />
                <span className="text-rose-200">{t.offline || 'Offline'}</span>
              </>
            )}
          </button>

          {/* Privacy Mode Toggle */}
          <button
            type="button"
            onClick={() => setShowPII(!showPII)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border transition-all cursor-pointer text-[10px] uppercase font-bold font-mono focus-visible:ring-2 focus-visible:ring-[#2dd4bf] focus-visible:outline-none ${
              showPII 
                ? 'bg-amber-400/20 text-amber-200 border-amber-400/50 hover:bg-amber-400/30' 
                : 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40 hover:bg-emerald-500/30'
            }`}
            title="Toggle Privacy Mode (Mask sensitive patient PII)"
          >
            {showPII ? (
              <><Eye className="w-3.5 h-3.5 text-amber-200" /> <span className="hidden sm:inline">Privacy Mode: OFF</span></>
            ) : (
              <><EyeOff className="w-3.5 h-3.5 text-emerald-300" /> <span className="hidden sm:inline">Privacy Mode: ON</span></>
            )}
          </button>

          {/* Language Switcher (EN | BM) */}
          <div className="bg-[#086b68] rounded-md border border-[#065451] p-0.5 flex">
            <button
              type="button"
              id="lang-toggle-en"
              onClick={() => setActiveLanguage('EN')}
              className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[#2dd4bf] focus-visible:outline-none ${
                activeLanguage === 'EN' ? 'bg-[#0a837f] text-white font-black shadow-xs' : 'text-teal-100 hover:text-white'
              }`}
            >
              EN
            </button>
            <button
              type="button"
              id="lang-toggle-bm"
              onClick={() => setActiveLanguage('BM')}
              className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[#2dd4bf] focus-visible:outline-none ${
                activeLanguage === 'BM' ? 'bg-[#0a837f] text-white font-black shadow-xs' : 'text-teal-100 hover:text-white'
              }`}
            >
              BM
            </button>
          </div>

          {/* User Profile Avatar Pill */}
          <div className="flex items-center gap-2 bg-[#086b68] border border-[#065451] px-2.5 py-1 rounded-md shadow-2xs">
            <div className="w-5 h-5 bg-[#0a837f] text-white font-mono text-[10px] font-black flex items-center justify-center rounded-md">
              {getUserInitials(userName)}
            </div>
            <span className="text-teal-100 hidden sm:inline text-xs font-mono font-bold uppercase">
              {userRole ? `${userRole.charAt(0).toUpperCase() + userRole.slice(1)} Suite` : 'Suite'}
            </span>
          </div>

          {/* Logout / End Shift Button */}
          <button 
            type="button" 
            onClick={onSignOut} 
            className="text-xs bg-rose-950/60 hover:bg-rose-900 text-rose-200 border border-rose-700/60 px-3 py-1.5 rounded-none font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:outline-none"
            title="End clinician shift and log out of clinical workstation"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-300" />
            <span className="hidden sm:inline">Sign out workstation</span>
          </button>
        </div>

      </header>

      {/* ========================================================================= */}
      {/* WORKSPACE SUB-NAVIGATION BAR (EXACT MATCH USER IMAGE: #0D9488)              */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col overflow-hidden relative">

        <nav className="w-full bg-[#0d9488] text-white flex items-center justify-between border-b border-[#096b62] shrink-0 px-4 py-1.5 overflow-x-auto custom-scrollbar shadow-xs relative z-10">

          <div className="flex items-center space-x-1.5 py-0.5" id="sidebar-navigation-links">

            {/* Dashboard Navigation Link */}
            <button
              type="button"
              id="sidebar-link-dashboard"
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center px-3.5 py-1.5 rounded-md text-xs font-bold cursor-pointer transition-all duration-200 whitespace-nowrap focus-visible:ring-2 focus-visible:ring-[#2dd4bf] focus-visible:outline-none ${
                activeTab === 'dashboard'
                  ? 'bg-[#0f766e] text-white border border-[#096b62] font-black shadow-inner ring-1 ring-[#2dd4bf]/40'
                  : 'text-teal-50 hover:bg-[#0f766e]/70 hover:text-white font-semibold'
              }`}
            >
              <div className="flex items-center gap-2">
                {activeTab === 'dashboard' && <span className="w-1.5 h-1.5 rounded-full bg-[#2dd4bf] animate-pulse"></span>}
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
                className={`flex items-center px-3.5 py-1.5 rounded-md text-xs font-bold cursor-pointer transition-all duration-200 whitespace-nowrap focus-visible:ring-2 focus-visible:ring-[#2dd4bf] focus-visible:outline-none ${
                  activeTab === 'registration'
                    ? 'bg-[#0f766e] text-white border border-[#096b62] font-black shadow-inner ring-1 ring-[#2dd4bf]/40'
                    : 'text-teal-50 hover:bg-[#0f766e]/70 hover:text-white font-semibold'
                }`}
              >
                <div className="flex items-center gap-2">
                  {activeTab === 'registration' && <span className="w-1.5 h-1.5 rounded-full bg-[#2dd4bf] animate-pulse"></span>}
                  <Users className={`w-4 h-4 ${activeTab === 'registration' ? 'text-white' : 'text-teal-200'}`} />
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
                className={`flex items-center px-3.5 py-1.5 rounded-md text-xs font-bold cursor-pointer transition-all duration-200 whitespace-nowrap focus-visible:ring-2 focus-visible:ring-[#2dd4bf] focus-visible:outline-none ${
                  activeTab === 'triage'
                    ? 'bg-[#0f766e] text-white border border-[#096b62] font-black shadow-inner ring-1 ring-[#2dd4bf]/40'
                    : 'text-teal-50 hover:bg-[#0f766e]/70 hover:text-white font-semibold'
                }`}
              >
                <div className="flex items-center gap-2">
                  {activeTab === 'triage' && <span className="w-1.5 h-1.5 rounded-full bg-[#2dd4bf] animate-pulse"></span>}
                  <Activity className={`w-4 h-4 ${activeTab === 'triage' ? 'text-white' : 'text-teal-200'}`} />
                  <span>Triage Module</span>
                </div>
                {triageQueueLength > 0 && (
                  <span className={`text-[9px] font-bold font-mono px-1.5 py-0.5 rounded-md min-w-[16px] flex items-center justify-center ml-2 ${
                    activeTab === 'triage' ? 'bg-[#2dd4bf] text-teal-950 font-black animate-pulse' : 'bg-[#0f766e] text-teal-100 border border-[#096b62]'
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
                className={`flex items-center px-3.5 py-1.5 rounded-md text-xs font-bold cursor-pointer transition-all duration-200 whitespace-nowrap focus-visible:ring-2 focus-visible:ring-[#2dd4bf] focus-visible:outline-none ${
                  activeTab === 'appointments'
                    ? 'bg-[#0f766e] text-white border border-[#096b62] font-black shadow-inner ring-1 ring-[#2dd4bf]/40'
                    : 'text-teal-50 hover:bg-[#0f766e]/70 hover:text-white font-semibold'
                }`}
              >
                <div className="flex items-center gap-2">
                  {activeTab === 'appointments' && <span className="w-1.5 h-1.5 rounded-full bg-[#2dd4bf] animate-pulse"></span>}
                  <CalendarClock className={`w-4 h-4 ${activeTab === 'appointments' ? 'text-white' : 'text-teal-200'}`} />
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
                  className={`flex items-center px-3.5 py-1.5 rounded-md text-xs font-bold cursor-pointer transition-all duration-200 whitespace-nowrap focus-visible:ring-2 focus-visible:ring-[#2dd4bf] focus-visible:outline-none ${
                    activeTab === 'queue'
                      ? 'bg-[#0f766e] text-white border border-[#096b62] font-black shadow-inner ring-1 ring-[#2dd4bf]/40'
                      : 'text-teal-50 hover:bg-[#0f766e]/70 hover:text-white font-semibold'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {activeTab === 'queue' && <span className="w-1.5 h-1.5 rounded-full bg-[#2dd4bf] animate-pulse"></span>}
                    <Users className={`w-4 h-4 ${activeTab === 'queue' ? 'text-white' : 'text-teal-200'}`} />
                    <span>Patient Queue</span>
                  </div>
                  {activeTab !== 'consultation' && doctorQueueLength > 0 && (
                    <span className={`text-[9px] font-bold font-mono px-1.5 py-0.5 rounded-md min-w-[16px] flex items-center justify-center ml-2 ${
                      activeTab === 'queue' ? 'bg-[#2dd4bf] text-teal-950 font-black animate-pulse' : 'bg-[#0f766e] text-teal-100 border border-[#096b62]'
                    }`}>
                      {doctorQueueLength}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  id="sidebar-link-consultation"
                  onClick={() => setActiveTab('consultation')}
                  className={`flex items-center px-3.5 py-1.5 rounded-md text-xs font-bold cursor-pointer transition-all duration-200 whitespace-nowrap focus-visible:ring-2 focus-visible:ring-[#2dd4bf] focus-visible:outline-none ${
                    activeTab === 'consultation'
                      ? 'bg-[#0f766e] text-white border border-[#096b62] font-black shadow-inner ring-1 ring-[#2dd4bf]/40'
                      : 'text-teal-50 hover:bg-[#0f766e]/70 hover:text-white font-semibold'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {activeTab === 'consultation' && <span className="w-1.5 h-1.5 rounded-full bg-[#2dd4bf] animate-pulse"></span>}
                    <Stethoscope className={`w-4 h-4 ${activeTab === 'consultation' ? 'text-white' : 'text-teal-200'}`} />
                    <span>Consultation Suite</span>
                  </div>
                </button>

                <button
                  type="button"
                  id="sidebar-link-reports"
                  onClick={() => setActiveTab('reports')}
                  className={`flex items-center px-3.5 py-1.5 rounded-md text-xs font-bold cursor-pointer transition-all duration-200 whitespace-nowrap focus-visible:ring-2 focus-visible:ring-[#2dd4bf] focus-visible:outline-none ${
                    activeTab === 'reports'
                      ? 'bg-[#0f766e] text-white border border-[#096b62] font-black shadow-inner ring-1 ring-[#2dd4bf]/40'
                      : 'text-teal-50 hover:bg-[#0f766e]/70 hover:text-white font-semibold'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {activeTab === 'reports' && <span className="w-1.5 h-1.5 rounded-full bg-[#2dd4bf] animate-pulse"></span>}
                    <FileText className={`w-4 h-4 ${activeTab === 'reports' ? 'text-white' : 'text-teal-200'}`} />
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
                className={`flex items-center px-3.5 py-1.5 rounded-md text-xs font-bold cursor-pointer transition-all duration-200 whitespace-nowrap focus-visible:ring-2 focus-visible:ring-[#2dd4bf] focus-visible:outline-none ${
                  activeTab === 'dispensary'
                    ? 'bg-[#0f766e] text-white border border-[#096b62] font-black shadow-inner ring-1 ring-[#2dd4bf]/40'
                    : 'text-teal-50 hover:bg-[#0f766e]/70 hover:text-white font-semibold'
                }`}
              >
                <div className="flex items-center gap-2">
                  {activeTab === 'dispensary' && <span className="w-1.5 h-1.5 rounded-full bg-[#2dd4bf] animate-pulse"></span>}
                  <Pill className={`w-4 h-4 ${activeTab === 'dispensary' ? 'text-white' : 'text-teal-200'}`} />
                  <span>{t.dispensary || 'Dispensary'}</span>
                </div>
                {pharmacyQueueLength > 0 && (
                  <span className={`text-[9px] font-bold font-mono px-1.5 py-0.5 rounded-md min-w-[16px] flex items-center justify-center ml-2 ${
                    activeTab === 'dispensary' ? 'bg-[#2dd4bf] text-teal-950 font-black animate-pulse' : 'bg-[#0f766e] text-teal-100 border border-[#096b62]'
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
                className={`flex items-center px-3.5 py-1.5 rounded-md text-xs font-bold cursor-pointer transition-all duration-200 whitespace-nowrap focus-visible:ring-2 focus-visible:ring-[#2dd4bf] focus-visible:outline-none ${
                  activeTab === 'billing'
                    ? 'bg-[#0f766e] text-white border border-[#096b62] font-black shadow-inner ring-1 ring-[#2dd4bf]/40'
                    : 'text-teal-50 hover:bg-[#0f766e]/70 hover:text-white font-semibold'
                }`}
              >
                <div className="flex items-center gap-2">
                  {activeTab === 'billing' && <span className="w-1.5 h-1.5 rounded-full bg-[#2dd4bf] animate-pulse"></span>}
                  <CreditCard className={`w-4 h-4 ${activeTab === 'billing' ? 'text-white' : 'text-teal-200'}`} />
                  <span>{t.billing || 'Billing'}</span>
                </div>
                {cashierQueueLength > 0 && (
                  <span className={`text-[9px] font-bold font-mono px-1.5 py-0.5 rounded-md min-w-[16px] flex items-center justify-center ml-2 ${
                    activeTab === 'billing' ? 'bg-[#2dd4bf] text-teal-950 font-black animate-pulse' : 'bg-[#0f766e] text-teal-100 border border-[#096b62]'
                  }`}>
                    {cashierQueueLength}
                  </span>
                )}
              </button>
            )}
          </div>

          {/* Nav Right Telemetry Sync Status & Manual Refresh Trigger */}
          <div className="hidden lg:flex items-center space-x-3 text-[10px] text-teal-50 font-mono pl-4 border-l border-[#0f766e] ml-4">
            <div className="flex items-center gap-1.5">
              <span>Sync:</span>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
              </span>
              <span className="text-white font-bold uppercase">KKM-ONLINE</span>
            </div>

            <button
              type="button"
              onClick={handleManualSync}
              className="p-1 hover:bg-[#0f766e] text-white rounded-md transition-colors border border-[#096b62] focus-visible:ring-2 focus-visible:ring-[#2dd4bf] focus-visible:outline-none"
              title="Force Refresh Data Sync"
            >
              <RefreshCw className={`w-3 h-3 ${isSyncRefreshing ? 'animate-spin text-teal-200' : ''}`} />
            </button>

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
