import React, { useState, useEffect, useRef, useSyncExternalStore } from 'react';
import { useIsFetching, useQueryClient } from '@tanstack/react-query';
import ThemeSelector from '../../components/ui/ThemeSelector';
import Modal from '../../components/ui/Modal';
import NotificationBell from './NotificationBell';
import HelpCenter, { AppFooter, HelpButton, useHelp } from './HelpCenter';
import { brandName } from '../../utils/brandName';
import BrandName from '../../components/ui/BrandName';
import { bannerFor, getGreeting } from '../../domain/roleBanner';
import { canOpenTab } from '../../routes/permissions';
import { joinRoleLabels } from '../../domain/roles';
import type { UserRole } from '../../types';
import { useSettings } from '../../context/SettingsContext';
import {
  Activity, Wifi, WifiOff, Eye, EyeOff, LayoutDashboard, Users, Stethoscope, 
  FileText, Pill, CreditCard, Search, Clock, RefreshCw, 
  ChevronDown, ChevronRight, LogOut, CalendarClock, PackageOpen, Moon, Sun, ShieldAlert, CheckCircle2, UserCheck, Settings, Globe, ShieldCheck, User
} from 'lucide-react';
import logoUrl from '../../assets/logo_transparent.svg';
import { getPersonaAvatar } from '../../utils/personaAvatars';

interface EnterpriseLayoutTemplateProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userName: string;
  userRole: string;
  /** Every role the person holds; the navbar shows the union of their pages. */
  userRoles?: UserRole[];
  isOnline: boolean;
  setIsOnline: (val: boolean) => void;
  showPII: boolean;
  setShowPII: (val: boolean) => void;
  activeLanguage: string;
  setActiveLanguage: (val: string) => void;
  onSignOut: () => void;
  onOpenAdmin?: () => void;
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
  userRoles,
  isOnline,
  setIsOnline,
  showPII,
  setShowPII,
  activeLanguage,
  setActiveLanguage,
  onSignOut,
  onOpenAdmin,
  t,
  triageQueueLength = 0,
  doctorQueueLength,
  pharmacyQueueLength,
  cashierQueueLength,
  children
}: EnterpriseLayoutTemplateProps) {
  // Live Real-Time Clock & Sync timestamp
  const [timeString, setTimeString] = useState<string>('');
  // Sync status reflects the real query cache: the newest successful fetch and any fetch in flight.
  const queryClient = useQueryClient();
  const isFetching = useIsFetching() > 0;
  const queryCache = queryClient.getQueryCache();
  const lastSyncedAt = useSyncExternalStore(
    // Only successful fetches matter here; queries being created during other components' renders must not wake the header.
    (notify) => queryCache.subscribe((event) => { if (event.type === 'updated' && event.action.type === 'success') notify(); }),
    () => queryCache.getAll().reduce((latest, q) => Math.max(latest, q.state.dataUpdatedAt), 0),
  );
  const lastSyncedTime = lastSyncedAt
    ? new Date(lastSyncedAt).toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit' })
    : '';
  const [showUserMenu, setShowUserMenu] = useState<boolean>(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState<boolean>(false);
  const [isNightShift, setIsNightShift] = useState<boolean>(false);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const { clinic } = useSettings();
  const help = useHelp();

  // Close workstation settings popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };
    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTimeString(now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' MYT');
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleManualSync = () => { void queryClient.invalidateQueries(); };

  const getUserInitials = (name: string) => {
    if (!name) return 'EX';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const held: UserRole[] = userRoles && userRoles.length > 0 ? userRoles : [userRole as UserRole];
  const roleLabel = bannerFor(held, activeLanguage).label;
  // Navbar items come from the same table as the route guards, so a page is shown exactly when it can be opened.
  const can = (tab: Parameters<typeof canOpenTab>[1]) => canOpenTab(held, tab);

  return (
    <div className={`min-h-screen flex flex-col font-sans antialiased selection:bg-primary/20 transition-colors duration-300 ${
      isNightShift ? 'dark bg-night-850 text-slate-100' : 'bg-canvas text-ink'
    }`}>
      
      {/* GLOBAL TOP HEADER BAR */}
      <header className="workspace-header">

        {/* Left: Brand logo & clinic title */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full border border-line bg-surface-accent p-1 shrink-0 flex items-center justify-center shadow-2xs">
            <img src={logoUrl} alt="Mediclinic Enterprise Logo" className="w-full h-full object-contain" />
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <h1 className="workspace-header-title truncate text-[22px]" style={{ fontSize: '22px' }}>
              <BrandName 
                name={clinic.name || t.clinicName || 'MEDICLINIC ENTERPRISE'} 
                className="font-bold tracking-tight text-ink dark:text-white"
                accentClassName="text-accent"
              />
            </h1>
            {clinic.branch && (
              <span className="hidden md:inline-block px-2 py-0.5 bg-surface-accent text-accent border border-line text-2xs font-mono font-semibold rounded-none shrink-0">
                {clinic.branch}
              </span>
            )}
          </div>
        </div>

        {/* Center: Offline indicator if offline */}
        {!isOnline && (
          <div className="flex items-center justify-center gap-1.5 px-3 py-1 bg-rose-500/20 text-rose-700 dark:text-rose-200 border border-rose-300 dark:border-rose-700 rounded-none text-xs font-mono font-bold uppercase motion-safe:animate-pulse">
            <WifiOff className="w-3.5 h-3.5 text-rose-600 dark:text-rose-300" />
            <span>{t.offlineMode || 'Offline Mode'}</span>
          </div>
        )}

        {/* Right Controls: Clock, Help, Alerts, User Profile, Settings */}
        <div className="flex items-center gap-2 sm:gap-3 relative shrink-0">

          {/* Live Clock */}
          <div className="workspace-header-clock">
            <Clock className="w-3.5 h-3.5 text-accent dark:text-teal-400" />
            <span>{timeString || '--:--:-- MYT'}</span>
          </div>

          <HelpButton onClick={help.show} light />

          <NotificationBell onOpenTab={setActiveTab} onOpenAdmin={onOpenAdmin} light />

          {/* User Profile Card */}
          <div 
            className="workspace-header-user-box"
            title={`Logged in as ${userName || 'Clinician'} (${userRole ? joinRoleLabels(held, activeLanguage) : (activeLanguage === 'BM' ? 'Kakitangan' : 'Staff')})`}
          >
            <div className="workspace-header-avatar-badge">
              {getUserInitials(userName)}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-ink dark:text-white text-xs font-bold leading-none">{userName || 'Clinician'}</p>
              <p className="text-[10px] text-accent dark:text-teal-400 font-mono uppercase tracking-wider mt-0.5 font-bold">
                {userRole ? joinRoleLabels(held, activeLanguage) : (activeLanguage === 'BM' ? 'Kakitangan' : 'Staff')}
              </p>
            </div>
          </div>

          {/* Standalone Workstation Settings Button & Menu */}
          <div ref={userMenuRef} className="relative">
            <button 
              type="button"
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="workspace-header-settings-btn"
              title="Workstation settings and preferences"
              aria-label="Workstation settings"
              aria-expanded={showUserMenu}
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Consolidated Workstation Settings & Utility Popover Menu */}
            {showUserMenu && (
              <div className="absolute right-0 top-12 w-72 max-w-[calc(100vw-1.5rem)] bg-surface dark:bg-night-900 border border-line dark:border-white/15 p-4 shadow-2xl text-xs space-y-3 rounded-none animate-fadeIn text-ink dark:text-white z-50 font-sans">
                <div className="flex items-center justify-between border-b border-line dark:border-white/15 pb-2.5">
                  <div>
                    <p className="font-bold text-sm text-accent dark:text-teal-300">{userName || 'Clinician'}</p>
                    <p className="text-2xs text-muted dark:text-teal-200 font-mono uppercase font-bold">{joinRoleLabels(held, activeLanguage)}</p>
                  </div>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 motion-safe:animate-pulse" title="Active workstation session"></span>
                </div>

                <button
                  type="button"
                  id="user-menu-my-leave"
                  onClick={() => { setActiveTab('my-leave'); setShowUserMenu(false); }}
                  className="w-full min-h-11 flex items-center gap-2 px-3 bg-surface-accent dark:bg-night-800 border border-line dark:border-white/15 hover:bg-surface-strong dark:hover:bg-night-700 text-ink dark:text-teal-100 font-semibold cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300"
                >
                  <CalendarClock className="w-4 h-4 text-muted dark:text-teal-200" aria-hidden="true" />
                  <span>{t.myLeave || 'My leave & attendance'}</span>
                </button>

                <div className="space-y-2.5 pt-1">
                  <p className="text-2xs font-mono uppercase text-accent dark:text-teal-300 tracking-wider font-bold">{t.workstationSettings || 'Workstation Settings'}</p>
                  
                  {/* Theme Mode Toggle */}
                  <div className="flex items-center justify-between bg-surface-accent dark:bg-night-800 p-2 border border-line dark:border-white/15">
                    <span className="text-ink dark:text-teal-100 font-medium flex items-center gap-1.5">
                      {isNightShift ? <Moon className="w-3.5 h-3.5 text-amber-300" /> : <Sun className="w-3.5 h-3.5 text-amber-600 dark:text-amber-200" />}
                      <span>{t.themeMode || 'Theme Mode'}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsNightShift(!isNightShift)}
                      className={`px-2.5 py-1 text-2xs font-bold font-mono uppercase transition-colors cursor-pointer border ${
                        isNightShift ? 'bg-teal-950 text-amber-300 border-line dark:border-teal-700' : 'bg-primary text-white border-teal-600'
                      }`}
                    >
                      {isNightShift ? (t.nightShift || 'Night Shift') : (t.dayMode || 'Day Mode')}
                    </button>
                  </div>

                  <ThemeSelector variant="menu" />

                  {/* Privacy Mask Toggle */}
                  <div className="flex items-center justify-between bg-surface-accent dark:bg-night-800 p-2 border border-line dark:border-white/15">
                    <span className="text-ink dark:text-teal-100 font-medium flex items-center gap-1.5">
                      {showPII ? <Eye className="w-3.5 h-3.5 text-amber-600 dark:text-amber-200" /> : <EyeOff className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-300" />}
                      <span>{t.privacyMask || 'Privacy Mask'}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowPII(!showPII)}
                      className={`px-2.5 py-1 text-2xs font-bold font-mono uppercase transition-colors cursor-pointer border ${
                        showPII ? 'bg-amber-50 text-amber-900 border-amber-300 dark:bg-amber-500/30 dark:text-amber-100 dark:border-amber-400/50' : 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-500/30 dark:text-emerald-200 dark:border-emerald-400/40'
                      }`}
                    >
                      {showPII ? (t.unmasked || 'Off (Exposed)') : (t.masked || 'On (Masked)')}
                    </button>
                  </div>

                  {/* Network simulator */}
                  {import.meta.env.DEV && (
                    <div className="flex items-center justify-between bg-surface-accent dark:bg-night-800 p-2 border border-line dark:border-white/15">
                      <span className="text-ink dark:text-teal-100 font-medium flex items-center gap-1.5">
                        {isOnline ? <Wifi className="w-3.5 h-3.5 text-muted dark:text-teal-200" /> : <WifiOff className="w-3.5 h-3.5 text-rose-600 dark:text-rose-300" />}
                        <span>{t.networkState || 'Network State'}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsOnline(!isOnline)}
                        className={`px-2.5 py-1 text-2xs font-bold font-mono uppercase transition-colors cursor-pointer border ${
                          isOnline ? 'bg-emerald-700 text-white border-emerald-600' : 'bg-rose-900 text-rose-200 border-rose-700'
                        }`}
                      >
                        {isOnline ? (t.online || 'Online') : (activeLanguage === 'BM' ? 'Simulasi Luar Talian' : 'Simulate Offline')}
                      </button>
                    </div>
                  )}

                  {/* Language */}
                  <div className="flex items-center justify-between bg-surface-accent dark:bg-night-800 p-2 border border-line dark:border-white/15">
                    <span className="text-ink dark:text-teal-100 font-medium flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-muted dark:text-teal-200" />
                      <span>{t.language || 'Language'}</span>
                    </span>
                    <div className="inline-flex border border-line dark:border-teal-700 font-mono text-2xs">
                      <button
                        type="button"
                        onClick={() => setActiveLanguage('EN')}
                        className={`px-2 py-0.5 cursor-pointer uppercase ${activeLanguage === 'EN' ? 'bg-primary text-white font-bold' : 'text-muted dark:text-teal-200 hover:text-white'}`}
                      >
                        EN
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveLanguage('BM')}
                        className={`px-2 py-0.5 cursor-pointer uppercase ${activeLanguage === 'BM' ? 'bg-primary text-white font-bold' : 'text-muted dark:text-teal-200 hover:text-white'}`}
                      >
                        BM
                      </button>
                    </div>
                  </div>
                </div>

                {/* Sign Out */}
                <div className="border-t border-line dark:border-white/15 pt-2.5">
                  <button 
                    type="button"
                    onClick={() => {
                      setShowUserMenu(false);
                      setShowSignOutConfirm(true);
                    }}
                    className="w-full text-left px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 dark:bg-rose-950/50 dark:hover:bg-rose-900/80 dark:text-rose-200 dark:border-rose-800/60 font-bold flex items-center justify-between rounded-none transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <LogOut className="w-4 h-4 text-rose-400" /> {t.signOutWorkstation || 'Sign Out Workstation...'}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-rose-600 dark:text-rose-300" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

      </header>

      {/* PAGE BANNER - Unified and persistent across all tabs to eliminate layout jumps & flickering */}
      <section className="workspace-banner-section" aria-label="Page banner">
        <div className="workspace-banner-bar">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="workspace-banner-avatar">
              <img 
                src={getPersonaAvatar(userRole)} 
                alt={userName || 'Staff'} 
                className="w-full h-full object-cover" 
              />
            </div>
            <div className="min-w-0 flex-1 flex flex-wrap items-center gap-x-3 gap-y-1">
              <h1 className="workspace-banner-title">{getGreeting(undefined, activeLanguage)}, {userName}</h1>
              <span className="workspace-banner-pill">{roleLabel}</span>
              <span className="workspace-banner-status">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                {isOnline ? (t.allSystemsOperational || 'All systems operational') : (t.offline || 'Offline')}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <div className="flex items-center gap-2 font-mono text-xs">
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-chrome-deep border border-white/15 text-white rounded-none shadow-none">
                <Clock className="w-3.5 h-3.5 text-teal-200" />
                <span>{activeLanguage === 'BM' ? 'Sesi:' : 'Session:'} <strong className="text-white font-bold">{activeLanguage === 'BM' ? 'Aktif' : 'Active'}</strong></span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WORKSPACE SUB-NAVIGATION BAR */}
      <div className="flex-1 flex flex-col relative font-sans">

        <nav className="workspace-navbar">

          <div className="flex items-stretch h-full" id="sidebar-navigation-links">

            {/* Dashboard Link */}
            <button
              type="button"
              id="sidebar-link-dashboard"
              onClick={() => setActiveTab('dashboard')}
              aria-current={activeTab === 'dashboard' ? 'page' : undefined}
              className={`nav-btn ${
                activeTab === 'dashboard' ? 'nav-btn-active' : 'nav-btn-inactive'
              }`}
            >
              <div className="flex items-center gap-2">
                {activeTab === 'dashboard' && <span className="w-1.5 h-1.5 rounded-none bg-white"></span>}
                <LayoutDashboard className={`w-4 h-4 ${activeTab === 'dashboard' ? 'text-white' : 'text-teal-100/90'}`} />
                <span>{t.dashboard || 'Dashboard'}</span>
              </div>
            </button>

            {/* Administration Console Link (admin / HR) */}
            {(held.includes('admin') || held.includes('hr')) && (
              <button
                type="button"
                id="sidebar-link-admin"
                onClick={() => onOpenAdmin?.()}
                className="nav-btn nav-btn-inactive"
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-teal-100/90" />
                  <span>{t.administration || 'Administration'}</span>
                </div>
              </button>
            )}

            {/* Registration Navigation Link */}
            {can('registration') && (
              <button
                type="button"
                id="sidebar-link-registration"
                onClick={() => setActiveTab('registration')}
              aria-current={activeTab === 'registration' ? 'page' : undefined}
                className={`nav-btn ${
                  activeTab === 'registration' ? 'nav-btn-active' : 'nav-btn-inactive'
                }`}
              >
                <div className="flex items-center gap-2">
                  {activeTab === 'registration' && <span className="w-1.5 h-1.5 rounded-none bg-white"></span>}
                  <Users className={`w-4 h-4 ${activeTab === 'registration' ? 'text-white' : 'text-teal-100/90'}`} />
                  <span>{t.patientRegistration || 'Patients & Registry'}</span>
                </div>
              </button>
            )}

            {/* Triage Module Link */}
            {can('triage') && (
              <button
                type="button"
                id="sidebar-link-triage"
                onClick={() => setActiveTab('triage')}
              aria-current={activeTab === 'triage' ? 'page' : undefined}
                className={`nav-btn ${
                  activeTab === 'triage' ? 'nav-btn-active' : 'nav-btn-inactive'
                }`}
              >
                <div className="flex items-center gap-2">
                  {activeTab === 'triage' && <span className="w-1.5 h-1.5 rounded-none bg-white"></span>}
                  <Activity className={`w-4 h-4 ${activeTab === 'triage' ? 'text-white' : 'text-teal-100/90'}`} />
                  <span>{t.triageModule || 'Triage Module'}</span>
                </div>
                {triageQueueLength > 0 && (
                  <span className={`text-2xs font-bold font-mono px-1.5 py-0.5 rounded-none min-w-[16px] flex items-center justify-center ml-2 ${
                    activeTab === 'triage' ? 'bg-white text-chrome font-bold' : 'bg-black/25 text-white border border-white/20'
                  }`}>
                    {triageQueueLength}
                  </span>
                )}
              </button>
            )}

            {/* Appointments Link */}
            {held.includes('receptionist') && can('appointments') && (
              <button
                type="button"
                id="sidebar-link-appointments"
                onClick={() => setActiveTab('appointments')}
              aria-current={activeTab === 'appointments' ? 'page' : undefined}
                className={`nav-btn ${
                  activeTab === 'appointments' ? 'nav-btn-active' : 'nav-btn-inactive'
                }`}
              >
                <div className="flex items-center gap-2">
                  {activeTab === 'appointments' && <span className="w-1.5 h-1.5 rounded-none bg-white"></span>}
                  <CalendarClock className={`w-4 h-4 ${activeTab === 'appointments' ? 'text-white' : 'text-teal-100/90'}`} />
                  <span>{t.appointments || 'Appointments'}</span>
                </div>
              </button>
            )}

            {/* Doctor Suite Links */}
            {can('queue') && (
              <>
                <button
                  type="button"
                  id="sidebar-link-queue"
                  onClick={() => setActiveTab('queue')}
              aria-current={activeTab === 'queue' ? 'page' : undefined}
                  className={`nav-btn ${
                    activeTab === 'queue' ? 'nav-btn-active' : 'nav-btn-inactive'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {activeTab === 'queue' && <span className="w-1.5 h-1.5 rounded-none bg-white"></span>}
                    <Users className={`w-4 h-4 ${activeTab === 'queue' ? 'text-white' : 'text-teal-100/90'}`} />
                    <span>{t.patientQueue || 'Patient Queue'}</span>
                  </div>
                  {activeTab !== 'consultation' && doctorQueueLength > 0 && (
                    <span className={`text-2xs font-bold font-mono px-1.5 py-0.5 rounded-none min-w-[16px] flex items-center justify-center ml-2 ${
                      activeTab === 'queue' ? 'bg-white text-chrome font-bold' : 'bg-black/25 text-white border border-white/20'
                    }`}>
                      {doctorQueueLength}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  id="sidebar-link-consultation"
                  onClick={() => setActiveTab('consultation')}
              aria-current={activeTab === 'consultation' ? 'page' : undefined}
                  className={`nav-btn ${
                    activeTab === 'consultation' ? 'nav-btn-active' : 'nav-btn-inactive'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {activeTab === 'consultation' && <span className="w-1.5 h-1.5 rounded-none bg-white"></span>}
                    <Stethoscope className={`w-4 h-4 ${activeTab === 'consultation' ? 'text-white' : 'text-teal-100/90'}`} />
                    <span>{t.consultationSuite || 'Consultation Suite'}</span>
                  </div>
                </button>

                <button
                  type="button"
                  id="sidebar-link-reports"
                  onClick={() => setActiveTab('reports')}
              aria-current={activeTab === 'reports' ? 'page' : undefined}
                  className={`nav-btn ${
                    activeTab === 'reports' ? 'nav-btn-active' : 'nav-btn-inactive'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {activeTab === 'reports' && <span className="w-1.5 h-1.5 rounded-none bg-white"></span>}
                    <FileText className={`w-4 h-4 ${activeTab === 'reports' ? 'text-white' : 'text-teal-100/90'}`} />
                    <span>{t.monthlyReports || 'Monthly Reports'}</span>
                  </div>
                </button>
              </>
            )}

            {/* Pharmacy Link */}
            {can('dispensary') && (
              <button
                type="button"
                id="sidebar-link-dispensary"
                onClick={() => setActiveTab('dispensary')}
              aria-current={activeTab === 'dispensary' ? 'page' : undefined}
                className={`nav-btn ${
                  activeTab === 'dispensary' ? 'nav-btn-active' : 'nav-btn-inactive'
                }`}
              >
                <div className="flex items-center gap-2">
                  {activeTab === 'dispensary' && <span className="w-1.5 h-1.5 rounded-none bg-white"></span>}
                  <Pill className={`w-4 h-4 ${activeTab === 'dispensary' ? 'text-white' : 'text-teal-100/90'}`} />
                  <span>{t.dispensary || 'Dispensary'}</span>
                </div>
                {pharmacyQueueLength > 0 && (
                  <span className={`text-2xs font-bold font-mono px-1.5 py-0.5 rounded-none min-w-[16px] flex items-center justify-center ml-2 ${
                    activeTab === 'dispensary' ? 'bg-white text-chrome font-bold' : 'bg-black/25 text-white border border-white/20'
                  }`}>
                    {pharmacyQueueLength}
                  </span>
                )}
              </button>
            )}

            {/* Inventory & stock (pharmacist) */}
            {can('inventory') && (
              <button
                type="button"
                id="sidebar-link-inventory"
                onClick={() => setActiveTab('inventory')}
              aria-current={activeTab === 'inventory' ? 'page' : undefined}
                className={`nav-btn ${activeTab === 'inventory' ? 'nav-btn-active' : 'nav-btn-inactive'}`}
              >
                <div className="flex items-center gap-2">
                  {activeTab === 'inventory' && <span className="w-1.5 h-1.5 rounded-none bg-white"></span>}
                  <PackageOpen className={`w-4 h-4 ${activeTab === 'inventory' ? 'text-white' : 'text-teal-100/90'}`} />
                  <span>{t.inventory || 'Inventory'}</span>
                </div>
              </button>
            )}

            {/* Billing Link */}
            {can('billing') && (
              <button
                type="button"
                id="sidebar-link-billing"
                onClick={() => setActiveTab('billing')}
              aria-current={activeTab === 'billing' ? 'page' : undefined}
                className={`nav-btn ${
                  activeTab === 'billing' ? 'nav-btn-active' : 'nav-btn-inactive'
                }`}
              >
                <div className="flex items-center gap-2">
                  {activeTab === 'billing' && <span className="w-1.5 h-1.5 rounded-none bg-white"></span>}
                  <CreditCard className={`w-4 h-4 ${activeTab === 'billing' ? 'text-white' : 'text-teal-100/90'}`} />
                  <span>{t.billing || 'Billing'}</span>
                </div>
                {cashierQueueLength > 0 && (
                  <span className={`text-2xs font-bold font-mono px-1.5 py-0.5 rounded-none min-w-[16px] flex items-center justify-center ml-2 ${
                    activeTab === 'billing' ? 'bg-white text-chrome font-bold' : 'bg-black/25 text-white border border-white/20'
                  }`}>
                    {cashierQueueLength}
                  </span>
                )}
              </button>
            )}
          </div>

          {/* Sync Status & Sync Now Action */}
          <div className="hidden lg:flex items-center space-x-3 text-xs text-white/90 font-sans pl-4 border-l border-chrome-deep ml-4">
            <div className="flex items-center gap-1.5" role="status" aria-live="polite">
              <span className={`inline-flex rounded-full h-2 w-2 ${!isOnline ? 'bg-rose-400' : isFetching ? 'bg-amber-300 motion-safe:animate-pulse' : 'bg-emerald-400'}`}></span>
              <span className="text-white font-bold font-mono">
                {!isOnline ? (t.offline || 'Offline') : isFetching ? (t.syncing || 'Syncing…') : lastSyncedTime ? `${t.lastSynced || 'Last synced'}: ${lastSyncedTime}` : (t.notSyncedYet || 'Not synced yet')}
              </span>
            </div>

            <button
              type="button"
              onClick={handleManualSync}
              disabled={isFetching || !isOnline}
              className="px-2.5 py-1 bg-chrome-deep hover:bg-chrome-line border border-teal-300/40 text-white rounded-none transition-colors font-sans text-2xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              title="Refresh clinical records from the server"
            >
              <RefreshCw className={`w-3 h-3 ${isFetching ? 'motion-safe:animate-spin text-white' : ''}`} />
              <span>{t.syncNow || 'Sync Now'}</span>
            </button>
          </div>

        </nav>

        <div className="relative z-40 h-0 pointer-events-none" aria-hidden="true">
          <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-b from-[rgb(15_60_76/0.2)] to-transparent" />
        </div>

        {/* MAIN CONTAINER */}
        <main className="flex-1 p-3 sm:p-5 overflow-y-auto max-h-full font-sans">
          {children}
        </main>
      </div>

      <AppFooter online={isOnline} onHelp={help.show} />
      <HelpCenter open={help.open} onClose={help.hide} role={userRole} roles={held} activeTab={activeTab} />

      {/* Standardized Sign Out Confirmation Modal */}
      <Modal
        isOpen={showSignOutConfirm}
        onClose={() => setShowSignOutConfirm(false)}
        title={t.signOutConfirmTitle || "Sign Out Workstation"}
        subtitle={t.signOutConfirmSubtitle || "End clinical session and purge cached data"}
        size="sm"
      >
        <div className="text-center space-y-4">
          <div className="w-12 h-12 bg-rose-100 dark:bg-rose-950/60 rounded-none mx-auto flex items-center justify-center text-rose-600 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
            <LogOut className="w-6 h-6" />
          </div>
          <p className="text-xs text-muted dark:text-slate-300 font-medium leading-relaxed">
            {t.signOutConfirmText || "Are you sure you want to end your clinical session? Cached patient information will be safely cleared."}
          </p>
          <div className="flex gap-2 justify-center pt-2">
            <button
              type="button"
              onClick={() => setShowSignOutConfirm(false)}
              className="px-4 py-2 bg-surface-muted dark:bg-night-850 text-accent dark:text-teal-300 border border-line dark:border-teal-800 font-bold text-xs rounded-none uppercase cursor-pointer"
            >
              {t.cancel || "Cancel"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowSignOutConfirm(false);
                onSignOut();
              }}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-none uppercase shadow-xs cursor-pointer"
            >
              {t.confirmSignOut || "Confirm Sign Out"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

