import { getPersonaAvatar } from '../../utils/personaAvatars';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import logoUrl from '../../assets/logo_transparent.svg';
import ThemeSelector from '../../components/ui/ThemeSelector';
import BrandName from '../../components/ui/BrandName';
import {
  Users, Stethoscope, Pill, DollarSign, Activity, FileText, Settings, 
  Building, ShieldAlert, LogOut, Server, Database, Globe2, Globe, TrendingUp,
  Clock, ShieldCheck, Moon, Sun, ChevronDown, ChevronRight, Eye, EyeOff, Wifi, WifiOff,
  Layers, FolderKanban, CalendarClock, FolderCheck,
  LayoutDashboard, UserCog
} from 'lucide-react';
import GlobalSpinner from '../../components/ui/GlobalSpinner';
import { useClinicData } from '../../hooks/useClinicData';

const StaffManagementModule = React.lazy(() => import('../staff/StaffManagementModule'));
const PatientAdminView = React.lazy(() => import('../patientAdmin/PatientAdminView'));
const InventoryPage = React.lazy(() => import('../inventory/InventoryPage'));
const EquipmentPage = React.lazy(() => import('../equipment/EquipmentPage'));
const BillingManagementModule = React.lazy(() => import('../billing/BillingManagementModule'));
const ReportsAnalyticsModule = React.lazy(() => import('../reports/ReportsAnalyticsModule'));
const SettingsModule = React.lazy(() => import('./SettingsModule'));
const MOHDashboard = React.lazy(() => import('../reports/MOHDashboard'));
const EInvoicePage = React.lazy(() => import('../einvoice/EInvoicePage'));
const PayrollPage = React.lazy(() => import('../payroll/PayrollPage'));
const LeavePage = React.lazy(() => import('../leave/LeavePage'));
const IntegrationsPage = React.lazy(() => import('../integrations/IntegrationsPage'));
const OperationsHub = React.lazy(() => import('../operations/OperationsHub'));
const SecurityHub = React.lazy(() => import('./SecurityHub'));
const RevenueCycleHub = React.lazy(() => import('../billing/RevenueCycleHub'));
const SystemArchitectureHub = React.lazy(() => import('./SystemArchitectureHub'));
import { useSettings } from '../../context/SettingsContext';
import HelpCenter, { AppFooter, HelpButton, useHelp } from '../shell/HelpCenter';
import NotificationBell from '../shell/NotificationBell';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { getGreeting } from '../../domain/roleBanner';

interface AdminModuleProps {
  onNavigate: (view: 'landing' | 'login') => void;
  userRole: 'admin' | 'hr';
  onOpenDashboard?: () => void;
}

type AdminTab = 'staff' | 'patients' | 'medicine' | 'equipment' | 'billing' | 'reports' | 'moh' | 'settings' | 'integrations' | 'operations' | 'security' | 'rcm' | 'einvoice' | 'payroll' | 'leave' | 'architecture';

type AdminCategory = 'people' | 'clinical' | 'finance' | 'compliance' | 'platform';

export default function AdminModule({
  onNavigate,
  userRole,
  onOpenDashboard
}: AdminModuleProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('staff');
  const [activeCategory, setActiveCategory] = useState<AdminCategory>('people');
  const { settings, clinic } = useSettings();
  const help = useHelp();
  const clinicData = useClinicData();
  const { activeLanguage, setActiveLanguage, t } = useLanguage();
  const navigate = useNavigate();

  // Workstation Header State
  const [showUserMenu, setShowUserMenu] = useState<boolean>(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState<boolean>(false);
  const [isNightShift, setIsNightShift] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(() => (typeof navigator === 'undefined' ? true : navigator.onLine));
  useEffect(() => {
    const up = () => setIsOnline(true);
    const down = () => setIsOnline(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    return () => { window.removeEventListener('online', up); window.removeEventListener('offline', down); };
  }, []);
  const { showPII, setShowPII } = useAuth();
  const [timeString, setTimeString] = useState<string>('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTimeString(now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' MYT');
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const adminName = userRole === 'admin'
    ? (activeLanguage === 'BM' ? 'Pentadbir Sistem' : 'System Administrator')
    : (activeLanguage === 'BM' ? 'Eksekutif Sumber Manusia' : 'HR Executive');

  // Navigation module definition with categories
  const modules = [
    // 1. People
    { id: 'staff', label: activeLanguage === 'BM' ? 'Direktori Staf' : 'Staff Directory', category: 'people', icon: Users, roleReq: 'all', enabled: settings.modules.staff },
    { id: 'patients', label: activeLanguage === 'BM' ? 'Pentadbiran Pesakit' : 'Patient Administration', category: 'people', icon: FolderCheck, roleReq: 'admin', enabled: true },
    { id: 'leave', label: activeLanguage === 'BM' ? 'Cuti & Kehadiran' : 'Leave & Attendance', category: 'people', icon: CalendarClock, roleReq: 'all', enabled: true },
    
    // 2. Clinical Operations
    { id: 'medicine', label: activeLanguage === 'BM' ? 'Inventori & Farmasi' : 'Inventory & Pharmacy', category: 'clinical', icon: Pill, roleReq: 'admin', enabled: settings.modules.medicine },
    { id: 'equipment', label: activeLanguage === 'BM' ? 'Peralatan & Aset' : 'Equipment & Assets', category: 'clinical', icon: Stethoscope, roleReq: 'admin', enabled: settings.modules.equipment },
    { id: 'operations', label: activeLanguage === 'BM' ? 'Hab Operasi' : 'Operations Hub', category: 'clinical', icon: Activity, roleReq: 'admin', enabled: true },
    
    // 3. Finance
    { id: 'billing', label: activeLanguage === 'BM' ? 'Meja Pengebilan' : 'Billing Desk', category: 'finance', icon: DollarSign, roleReq: 'admin', enabled: settings.modules.billing },
    { id: 'payroll', label: activeLanguage === 'BM' ? 'Gaji & Imbuhan' : 'Payroll', category: 'finance', icon: DollarSign, roleReq: 'all', enabled: true },
    { id: 'einvoice', label: activeLanguage === 'BM' ? 'e-Invois (LHDN)' : 'e-Invoice (LHDN)', category: 'finance', icon: FileText, roleReq: 'admin', enabled: true },
    { id: 'rcm', label: activeLanguage === 'BM' ? 'Hasil & Kutipan' : 'Revenue', category: 'finance', icon: TrendingUp, roleReq: 'admin', enabled: true },

    // 4. Compliance & Governance
    { id: 'moh', label: activeLanguage === 'BM' ? 'Kepatuhan KKM' : 'MOH Compliance', category: 'compliance', icon: Globe2, roleReq: 'admin', enabled: true },
    { id: 'reports', label: activeLanguage === 'BM' ? 'Laporan Analitik' : 'Analytics Reports', category: 'compliance', icon: FileText, roleReq: 'admin', enabled: settings.modules.reports },
    { id: 'security', label: activeLanguage === 'BM' ? 'Keselamatan & Audit' : 'Security & Audit', category: 'compliance', icon: ShieldAlert, roleReq: 'admin', enabled: true },

    // 5. Platform
    { id: 'architecture', label: activeLanguage === 'BM' ? 'Status Sistem' : 'System Status', category: 'platform', icon: Server, roleReq: 'admin', enabled: true },
    { id: 'integrations', label: activeLanguage === 'BM' ? 'Integrasi Sistem' : 'Integrations', category: 'platform', icon: Database, roleReq: 'admin', enabled: true },
    { id: 'settings', label: activeLanguage === 'BM' ? 'Tetapan Konsol' : 'Console Settings', category: 'platform', icon: Settings, roleReq: 'admin', enabled: true }
  ];

  const handleSelectTab = (tabId: AdminTab, cat: AdminCategory) => {
    setActiveTab(tabId);
    setActiveCategory(cat);
  };

  const filteredModules = modules.filter(m => {
    if (!m.enabled) return false;
    if (m.roleReq === 'admin' && userRole !== 'admin') return false;
    return true;
  });

  const categories = [
    { id: 'people', label: activeLanguage === 'BM' ? 'Kakitangan' : 'People' },
    { id: 'clinical', label: activeLanguage === 'BM' ? 'Operasi Klinikal' : 'Clinical Ops' },
    { id: 'finance', label: activeLanguage === 'BM' ? 'Kewangan' : 'Finance' },
    { id: 'compliance', label: activeLanguage === 'BM' ? 'Pematuhan' : 'Compliance' },
    { id: 'platform', label: activeLanguage === 'BM' ? 'Platform' : 'Platform' }
  ];

  const availableCategories = categories.filter(cat => 
    filteredModules.some(m => m.category === cat.id)
  );

  return (
    <div className={`min-h-screen flex flex-col font-sans antialiased selection:bg-primary/20 transition-colors duration-300 ${
      isNightShift ? 'dark bg-night-900 text-slate-100' : 'bg-canvas text-ink'
    }`}>

      {/* ========================================================================= */}
      {/* GLOBAL TOP ADMIN HEADER BAR                                               */}
      {/* ========================================================================= */}
      <header className="workspace-header">
        
        {/* Left: Product Title & Branch Context */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full border border-line bg-surface-accent p-1.5 shrink-0 flex items-center justify-center shadow-2xs">
            <img src={logoUrl} alt="Mediclinic Enterprise Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="type-brand font-sans text-ink flex items-center gap-2 text-[22px]" style={{ fontSize: '22px' }}>
              <BrandName 
                name={clinic.name ? `${clinic.name} Admin` : 'Mediclinic Admin Console'}
                className="font-bold tracking-tight text-ink dark:text-white"
                accentClassName="text-accent"
              />
            </h1>
            <span className="text-2xs text-muted font-mono tracking-wider font-semibold block mt-0.5">
              {clinic.branch ? `${clinic.branch} • ` : ''}Executive Console
            </span>
          </div>
        </div>

        {/* Center: Offline Warning Indicator */}
        {!isOnline && (
          <div className="flex items-center justify-center gap-1.5 px-3 py-1 bg-rose-500/20 text-rose-100 border border-rose-400/50 rounded-none text-xs font-mono font-bold uppercase animate-pulse">
            <WifiOff className="w-3.5 h-3.5 text-rose-300" />
            <span>Offline Simulation Mode</span>
          </div>
        )}

        {/* Right Controls: Notifications & Workstation Settings */}
        <div className="flex items-center gap-3 relative">

          {onOpenDashboard && (
            <button
              type="button"
              onClick={onOpenDashboard}
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-surface hover:bg-surface-strong border border-line text-ink text-xs font-bold cursor-pointer transition-colors rounded-none"
              title="Back to dashboard"
            >
              <LayoutDashboard className="w-4 h-4 text-teal-200" />
              <span>{t.dashboard || 'Dashboard'}</span>
            </button>
          )}
          
          <HelpButton onClick={help.show} light />

          <NotificationBell onOpenTab={(tab) => { if (tab) navigate('/app/' + tab); }} onOpenAdmin={(tab) => { if (tab) setActiveTab(tab as AdminTab); }} light />

          {/* Live Clock */}
          <div className="workspace-header-clock">
            <Clock className="w-3.5 h-3.5 text-accent dark:text-teal-400" />
            <span>{timeString || '14:20:15 MYT'}</span>
          </div>

          {/* User Profile Card */}
          <div 
            className="workspace-header-user-box"
            title={`Console Session: ${adminName} (${userRole.toUpperCase()} Console)`}
          >
            <div className="workspace-header-avatar-badge">
              {userRole === 'admin' ? 'AD' : 'HR'}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-ink dark:text-white text-xs font-bold leading-none">{adminName}</p>
              <p className="text-2xs text-accent dark:text-teal-300 font-mono uppercase tracking-wider mt-0.5">
                {userRole.toUpperCase()} Console
              </p>
            </div>
          </div>

          {/* Standalone Workstation Settings Button & Menu */}
          <div className="relative">
            <button 
              type="button"
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="workspace-header-settings-btn"
              title="Console Settings"
              aria-label="Console Settings"
              aria-expanded={showUserMenu}
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Consolidated Workstation Settings & Utility Popover Menu */}
            {showUserMenu && (
              <div className="absolute right-0 top-12 w-72 bg-surface dark:bg-night-900 border border-line dark:border-white/15 p-4 shadow-2xl text-xs space-y-3 rounded-none animate-fadeIn text-ink dark:text-white z-50 font-sans">
                <div className="flex items-center justify-between border-b border-line dark:border-white/15 pb-2.5">
                  <div>
                    <p className="font-bold text-sm text-accent dark:text-teal-300">{adminName}</p>
                    <p className="text-2xs text-muted dark:text-teal-200 font-mono uppercase">{userRole.toUpperCase()} Suite • Station #04</p>
                  </div>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" title="Active session"></span>
                </div>

                {/* Console Settings Controls */}
                <div className="space-y-2.5 pt-1">
                  <p className="text-2xs font-mono uppercase text-accent dark:text-teal-300 tracking-wider font-bold">{t.consoleSettings || 'Console Settings'}</p>
                  
                  {/* Theme Switch */}
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
                      {isNightShift ? (t.nightShift || 'Night') : (t.dayMode || 'Day')}
                    </button>
                  </div>

                  {/* Colour theme (Ice Mint / Sky Blue) */}
                  <ThemeSelector variant="menu" />

                  {/* PII Privacy Mask Toggle */}
                  <div className="flex items-center justify-between bg-surface-accent dark:bg-night-800 p-2 border border-line dark:border-white/15">
                    <span className="text-ink dark:text-teal-100 font-medium flex items-center gap-1.5">
                      {showPII ? <Eye className="w-3.5 h-3.5 text-accent dark:text-teal-300" /> : <EyeOff className="w-3.5 h-3.5 text-rose-600 dark:text-rose-300" />}
                      <span>{t.maskPatientPii || 'Mask Patient PII'}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowPII(!showPII)}
                      className={`px-2.5 py-1 text-2xs font-bold font-mono uppercase transition-colors cursor-pointer border ${
                        showPII ? 'bg-primary text-white border-teal-600' : 'bg-rose-950 text-rose-600 dark:text-rose-300 border-rose-800'
                      }`}
                    >
                      {showPII ? (t.unmasked || 'Unmasked') : (t.masked || 'Masked')}
                    </button>
                  </div>

                  {/* Network simulator: development builds only. Production follows the browser. */}
                  {import.meta.env.DEV && (
                  <div className="flex items-center justify-between bg-surface-accent dark:bg-night-800 p-2 border border-line dark:border-white/15">
                    <span className="text-ink dark:text-teal-100 font-medium flex items-center gap-1.5">
                      {isOnline ? <Wifi className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <WifiOff className="w-3.5 h-3.5 text-rose-400" />}
                      <span>{t.networkSync || 'Network Sync'}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsOnline(!isOnline)}
                      className={`px-2.5 py-1 text-2xs font-bold font-mono uppercase transition-colors cursor-pointer border ${
                        isOnline ? 'bg-emerald-950 text-emerald-600 dark:text-emerald-300 border-emerald-700' : 'bg-rose-950 text-rose-600 dark:text-rose-300 border-rose-800'
                      }`}
                    >
                      {isOnline ? (t.online || 'Online') : (t.offline || 'Offline')}
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

                {/* Sign Out Action */}
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
                      <LogOut className="w-4 h-4 text-rose-400" /> {t.terminateSession || 'Terminate Session...'}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-rose-600 dark:text-rose-300" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* PAGE BANNER: footer color chrome shade with protruding persona avatar */}
      <section className="workspace-banner-section" aria-label="Page banner">
        <div className="workspace-banner-bar">
          <div className="flex items-center gap-3.5 min-w-0 overflow-visible">
            <div className="workspace-banner-avatar" role="img" aria-label="Profile photo">
              <img 
                src={getPersonaAvatar(userRole)} 
                alt={adminName || 'Administrator'} 
                className="w-full h-full object-cover" 
              />
            </div>
            <div className="min-w-0 flex-1 flex flex-wrap items-center gap-x-3 gap-y-1">
              <h1 className="workspace-banner-title">{getGreeting(undefined, activeLanguage)}, {adminName}</h1>
              <span className="workspace-banner-pill">{userRole === 'admin' ? (activeLanguage === 'BM' ? 'Papan Pemuka Pentadbir' : 'Administrator dashboard') : (activeLanguage === 'BM' ? 'Papan Pemuka Sumber Manusia' : 'HR dashboard')}</span>
              <span className="workspace-banner-status">
                <span className="w-1.5 h-1.5 rounded-none bg-emerald-400 animate-pulse"></span>
                {isOnline ? (t.allSystemsOperational || 'All systems operational') : (t.offline || 'Offline')}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <div className="flex items-center gap-2 font-mono text-xs">
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-chrome-deep border border-white/15 text-white rounded-none shadow-none">
                <Clock className="w-3.5 h-3.5 text-teal-200" />
                <span>{activeLanguage === 'BM' ? 'Konsol:' : 'Console:'} <strong className="text-white font-bold">{activeLanguage === 'BM' ? 'Aktif' : 'Active'}</strong></span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* GROUPED CATEGORIZED MODULE NAVIGATION STRIP                               */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col relative">

        <nav className="workspace-navbar min-h-[44px] flex flex-col md:flex-row md:items-stretch">
          
          {/* Category Filter Pills */}
          <div className="flex items-stretch gap-0 overflow-x-auto text-xs">
            <span className="text-2xs font-mono uppercase text-teal-200 tracking-wider font-bold px-3 flex items-center gap-1 shrink-0">
              <FolderKanban className="w-3.5 h-3.5 text-teal-200" />
              <span>{activeLanguage === 'BM' ? 'Kumpulan:' : 'Group:'}</span>
            </span>
            {availableCategories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setActiveCategory(cat.id as any);
                  const firstInCat = filteredModules.find(m => m.category === cat.id);
                  if (firstInCat) setActiveTab(firstInCat.id as any);
                }}
                className={`px-4 py-2.5 rounded-none text-xs font-bold transition-all cursor-pointer border-0 flex items-center justify-center h-full ${
                  activeCategory === cat.id 
                    ? 'bg-chrome text-white' 
                    : 'bg-transparent text-teal-100 hover:bg-chrome-hover hover:text-white'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Module Tabs within Active Category */}
          <div className="flex items-stretch space-x-0 overflow-x-auto custom-scrollbar">
            {filteredModules
              .filter(m => m.category === activeCategory)
              .map((mod) => {
                const IconComponent = mod.icon;
                const isActive = activeTab === mod.id;

                return (
                  <button
                    key={mod.id}
                    type="button"
                    onClick={() => handleSelectTab(mod.id as any, mod.category as any)}
                    className={`flex items-center px-4 py-2.5 text-xs cursor-pointer transition-all whitespace-nowrap border-0 rounded-none h-full ${
                      isActive
                        ? 'bg-chrome text-white font-bold'
                        : 'bg-transparent text-teal-100 hover:bg-chrome-hover hover:text-white font-bold'
                    }`}
                  >
                    <IconComponent className={`w-3.5 h-3.5 mr-1.5 ${isActive ? 'text-teal-200' : 'text-teal-300'}`} />
                    <span>{mod.label}</span>
                    {isActive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 ml-2 animate-pulse"></span>}
                  </button>
                );
              })}
          </div>

        </nav>

        {/* ========================================================================= */}
        {/* MAIN CONTENT AREA                                                         */}
        {/* ========================================================================= */}
        <main className="flex-1 p-5 overflow-y-auto bg-canvas dark:bg-night-900 text-ink dark:text-slate-100">
          <div className="w-[95%] mx-auto">
          <React.Suspense fallback={<GlobalSpinner />}>

          {activeTab === 'staff' && (userRole === 'admin' || userRole === 'hr') && settings.modules.staff && (
            <StaffManagementModule />
          )}

          {activeTab === 'patients' && userRole === 'admin' && (
            <PatientAdminView
              patientsList={clinicData.patientsList}
              completedVisits={clinicData.completedVisits}
              activeVisits={clinicData.visitsQueue}
              onUpdatePatient={clinicData.updatePatientInDb}
              activeLanguage={activeLanguage}
            />
          )}

          {activeTab === 'medicine' && userRole === 'admin' && settings.modules.medicine && (
            <InventoryPage role="admin" />
          )}

          {activeTab === 'equipment' && userRole === 'admin' && settings.modules.equipment && (
            <EquipmentPage />
          )}

          {activeTab === 'billing' && userRole === 'admin' && settings.modules.billing && (
            <BillingManagementModule />
          )}

          {activeTab === 'reports' && userRole === 'admin' && settings.modules.reports && (
            <ReportsAnalyticsModule />
          )}

          {activeTab === 'moh' && userRole === 'admin' && (
            <MOHDashboard onOpenTab={setActiveTab} />
          )}

          {activeTab === 'settings' && userRole === 'admin' && (
            <SettingsModule />
          )}

          {activeTab === 'leave' && (
            <LeavePage role={userRole} />
          )}

          {activeTab === 'payroll' && (
            <PayrollPage role={userRole} />
          )}

          {activeTab === 'einvoice' && userRole === 'admin' && (
            <EInvoicePage />
          )}

          {activeTab === 'integrations' && userRole === 'admin' && (
            <IntegrationsPage />
          )}

          {activeTab === 'operations' && userRole === 'admin' && (
            <OperationsHub onOpenTab={setActiveTab} />
          )}

          {activeTab === 'security' && userRole === 'admin' && (
            <SecurityHub />
          )}

          {activeTab === 'rcm' && userRole === 'admin' && (
            <RevenueCycleHub onOpenTab={setActiveTab} />
          )}

          {activeTab === 'architecture' && userRole === 'admin' && (
            <SystemArchitectureHub onOpenTab={setActiveTab} />
          )}

        
          </React.Suspense>
          </div>
        </main>
      </div>

      <AppFooter online={isOnline} onHelp={help.show} />
      <HelpCenter open={help.open} onClose={help.hide} role={userRole} activeTab={activeTab} />

      {/* Sign Out Confirmation Modal */}
      {showSignOutConfirm && (
        <div role="alertdialog" aria-modal="true" aria-labelledby="signout-dialog-title" onKeyDown={(e) => { if (e.key === 'Escape') setShowSignOutConfirm(false); }} className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn font-sans">
          <div className="bg-night-900 border border-rose-500/50 max-w-md w-full p-6 shadow-2xl space-y-4 text-white">
            <div className="flex items-center gap-3 text-rose-400">
              <LogOut className="w-6 h-6 shrink-0" />
              <h3 id="signout-dialog-title" className="type-heading-caps text-white">{t.signOutConfirmTitle || "Confirm Console Termination"}</h3>
            </div>
            <p className="text-xs text-teal-100/80 leading-relaxed">
              {t.signOutConfirmText || "Are you sure you want to terminate your administrative session? Unsaved configuration changes will be safely persisted to Supabase."}
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowSignOutConfirm(false)}
                className="px-4 py-2 bg-night-800 hover:bg-night-700 text-teal-100 font-bold text-xs border border-white/15 cursor-pointer"
              >
                {t.cancel || "Cancel"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowSignOutConfirm(false);
                  onNavigate('landing');
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs cursor-pointer shadow-none"
              >
                {t.confirmSignOut || "Terminate Session"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
