import { getPersonaAvatar } from '../../utils/personaAvatars';
import React, { useState, useEffect } from 'react';
import logoUrl from '../../assets/logo_transparent.svg';
import ThemeSelector from '../../components/ui/ThemeSelector';
import {
  Users, Stethoscope, Pill, DollarSign, Activity, FileText, Settings, 
  Building, ShieldAlert, LogOut, Server, Database, Globe2, TrendingUp,
  Clock, ShieldCheck, Moon, Sun, ChevronDown, ChevronRight, Eye, EyeOff, Wifi, WifiOff,
  Layers, FolderKanban, CalendarClock,
  LayoutDashboard, UserCog
} from 'lucide-react';
import GlobalSpinner from '../../components/ui/GlobalSpinner';

const StaffManagementModule = React.lazy(() => import('../staff/StaffManagementModule'));
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
import { getGreeting } from '../../domain/roleBanner';

interface AdminModuleProps {
  onNavigate: (view: 'landing' | 'login') => void;
  userRole: 'admin' | 'hr';
  onOpenDashboard?: () => void;
}

type AdminTab = 'staff' | 'medicine' | 'equipment' | 'billing' | 'reports' | 'moh' | 'settings' | 'integrations' | 'operations' | 'security' | 'rcm' | 'einvoice' | 'payroll' | 'leave' | 'architecture';

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

  const adminName = userRole === 'admin' ? 'System Administrator' : 'HR Executive';

  // Navigation module definition with categories
  const modules = [
    // 1. People
    { id: 'staff', label: 'Staff Directory', category: 'people', icon: Users, roleReq: 'all', enabled: settings.modules.staff },
    { id: 'leave', label: 'Leave & Attendance', category: 'people', icon: CalendarClock, roleReq: 'all', enabled: true },
    
    // 2. Clinical Operations
    { id: 'medicine', label: 'Inventory & Pharmacy', category: 'clinical', icon: Pill, roleReq: 'admin', enabled: settings.modules.medicine },
    { id: 'equipment', label: 'Equipment & Assets', category: 'clinical', icon: Stethoscope, roleReq: 'admin', enabled: settings.modules.equipment },
    { id: 'operations', label: 'Operations Hub', category: 'clinical', icon: Activity, roleReq: 'admin', enabled: true },
    
    // 3. Finance
    { id: 'billing', label: 'Billing Desk', category: 'finance', icon: DollarSign, roleReq: 'admin', enabled: settings.modules.billing },
    { id: 'payroll', label: 'Payroll', category: 'finance', icon: DollarSign, roleReq: 'all', enabled: true },
    { id: 'einvoice', label: 'e-Invoice (LHDN)', category: 'finance', icon: FileText, roleReq: 'admin', enabled: true },
    { id: 'rcm', label: 'Revenue', category: 'finance', icon: TrendingUp, roleReq: 'admin', enabled: true },

    // 4. Compliance & Governance
    { id: 'moh', label: 'MOH Compliance', category: 'compliance', icon: Globe2, roleReq: 'admin', enabled: true },
    { id: 'reports', label: 'Analytics Reports', category: 'compliance', icon: FileText, roleReq: 'admin', enabled: settings.modules.reports },
    { id: 'security', label: 'Security & Audit', category: 'compliance', icon: ShieldAlert, roleReq: 'admin', enabled: true },

    // 5. Platform
    { id: 'architecture', label: 'System Status', category: 'platform', icon: Server, roleReq: 'admin', enabled: true },
    { id: 'integrations', label: 'Integrations', category: 'platform', icon: Database, roleReq: 'admin', enabled: true },
    { id: 'settings', label: 'Console Settings', category: 'platform', icon: Settings, roleReq: 'admin', enabled: true }
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
    { id: 'people', label: 'People' },
    { id: 'clinical', label: 'Clinical Ops' },
    { id: 'finance', label: 'Finance' },
    { id: 'compliance', label: 'Compliance' },
    { id: 'platform', label: 'Platform' }
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
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-full border border-line bg-surface-accent p-1.5 shrink-0 flex items-center justify-center shadow-2xs">
            <img src={logoUrl} alt="Mediclinic Enterprise Logo" className="w-full h-full object-contain" />
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <h1 className="workspace-header-title truncate text-[20px]" style={{ fontSize: '20px' }}>
              Mediclinic Admin Console
            </h1>
            {clinic.branch && (
              <span className="hidden md:inline-block px-2 py-0.5 bg-surface-accent text-accent border border-line text-2xs font-mono font-semibold rounded-none shrink-0">
                {clinic.branch}
              </span>
            )}
          </div>
        </div>

        {/* Center: Offline Warning Indicator */}
        {!isOnline && (
          <div className="flex items-center justify-center gap-1.5 px-3 py-1 bg-rose-500/20 text-rose-700 dark:text-rose-200 border border-rose-300 dark:border-rose-700 rounded-none text-xs font-mono font-bold uppercase motion-safe:animate-pulse">
            <WifiOff className="w-3.5 h-3.5 text-rose-600 dark:text-rose-300" />
            <span>Offline Mode</span>
          </div>
        )}

        {/* Right Controls: Notifications & Workstation Settings */}
        <div className="flex items-center gap-2 sm:gap-3 relative shrink-0">

          {onOpenDashboard && (
            <button
              type="button"
              onClick={onOpenDashboard}
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-surface hover:bg-surface-accent border border-line text-accent text-xs font-bold cursor-pointer transition-colors rounded-none"
              title="Back to Clinical Dashboard"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-accent" />
              <span className="hidden sm:inline">Dashboard</span>
            </button>
          )}
          
          <HelpButton onClick={help.show} />

          <NotificationBell onOpenTab={() => {}} onOpenAdmin={(tab) => { if (tab) setActiveTab(tab as AdminTab); }} />

          {/* Live Clock */}
          <div className="workspace-header-clock">
            <Clock className="w-3.5 h-3.5 text-accent" />
            <span>{timeString || '14:20:15 MYT'}</span>
          </div>

          {/* Workstation Settings Popover & User Trigger */}
          <div className="relative">
            <button 
              type="button"
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="workspace-header-user-btn"
              title="Console Settings"
            >
              <div className="workspace-header-avatar-badge">
                {userRole === 'admin' ? 'AD' : 'HR'}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-xs font-bold leading-none text-ink">{adminName}</p>
                <p className="text-2xs text-muted font-mono uppercase tracking-wider mt-0.5">
                  {userRole.toUpperCase()} Console
                </p>
              </div>
              <Settings className="w-3.5 h-3.5 text-accent ml-1" />
              <ChevronDown className="w-3.5 h-3.5 text-muted" />
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
                  <p className="text-2xs font-mono uppercase text-accent dark:text-teal-300 tracking-wider font-bold">Console Settings</p>
                  
                  {/* Theme Switch */}
                  <div className="flex items-center justify-between bg-surface-accent dark:bg-night-800 p-2 border border-line dark:border-white/15">
                    <span className="text-ink dark:text-teal-100 font-medium flex items-center gap-1.5">
                      {isNightShift ? <Moon className="w-3.5 h-3.5 text-amber-300" /> : <Sun className="w-3.5 h-3.5 text-amber-600 dark:text-amber-200" />}
                      <span>Theme Mode</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsNightShift(!isNightShift)}
                      className={`px-2.5 py-1 text-2xs font-bold font-mono uppercase transition-colors cursor-pointer border ${
                        isNightShift ? 'bg-teal-950 text-amber-300 border-line dark:border-teal-700' : 'bg-primary text-white border-teal-600'
                      }`}
                    >
                      {isNightShift ? 'Night' : 'Day'}
                    </button>
                  </div>

                  {/* Colour theme (Ice Mint / Sky Blue) */}
                  <ThemeSelector variant="menu" />

                  {/* PII Privacy Mask Toggle */}
                  <div className="flex items-center justify-between bg-surface-accent dark:bg-night-800 p-2 border border-line dark:border-white/15">
                    <span className="text-ink dark:text-teal-100 font-medium flex items-center gap-1.5">
                      {showPII ? <Eye className="w-3.5 h-3.5 text-accent dark:text-teal-300" /> : <EyeOff className="w-3.5 h-3.5 text-rose-600 dark:text-rose-300" />}
                      <span>Mask Patient PII</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowPII(!showPII)}
                      className={`px-2.5 py-1 text-2xs font-bold font-mono uppercase transition-colors cursor-pointer border ${
                        showPII ? 'bg-primary text-white border-teal-600' : 'bg-rose-950 text-rose-600 dark:text-rose-300 border-rose-800'
                      }`}
                    >
                      {showPII ? 'Unmasked' : 'Masked'}
                    </button>
                  </div>

                  {/* Network simulator: development builds only. Production follows the browser. */}
                  {import.meta.env.DEV && (
                  <div className="flex items-center justify-between bg-surface-accent dark:bg-night-800 p-2 border border-line dark:border-white/15">
                    <span className="text-ink dark:text-teal-100 font-medium flex items-center gap-1.5">
                      {isOnline ? <Wifi className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <WifiOff className="w-3.5 h-3.5 text-rose-400" />}
                      <span>Network Sync</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsOnline(!isOnline)}
                      className={`px-2.5 py-1 text-2xs font-bold font-mono uppercase transition-colors cursor-pointer border ${
                        isOnline ? 'bg-emerald-950 text-emerald-600 dark:text-emerald-300 border-emerald-700' : 'bg-rose-950 text-rose-600 dark:text-rose-300 border-rose-800'
                      }`}
                    >
                      {isOnline ? 'Online' : 'Offline'}
                    </button>
                  </div>
                  )}
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
                      <LogOut className="w-4 h-4 text-rose-400" /> Terminate Session...
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-rose-600 dark:text-rose-300" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quick Exit Button */}
          <button
            type="button"
            onClick={() => onNavigate('landing')}
            className="flex items-center justify-center gap-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 px-3 py-1.5 border border-rose-300 dark:border-rose-800 transition-colors text-xs font-bold cursor-pointer rounded-none"
            title="Exit Admin Console"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Exit</span>
          </button>

        </div>
      </header>

      {/* PAGE BANNER */}
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
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="workspace-banner-title">{getGreeting()}, {adminName}</h1>
                <span className="workspace-banner-pill">{userRole === 'admin' ? 'Administrator console' : 'HR console'}</span>
                <span className="workspace-banner-status">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  All systems operational
                </span>
              </div>
              <p className="text-2xs text-teal-50 font-mono mt-0.5 truncate">
                Authenticated administrative session • User: {adminName} • Console Station #04
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2.5 shrink-0">
            <div className="workspace-banner-telemetry">
              <Clock className="w-3.5 h-3.5 text-teal-100" />
              <span>Console: <strong className="text-white font-bold">Active</strong></span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* GROUPED CATEGORIZED MODULE NAVIGATION STRIP                               */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col overflow-hidden relative font-sans">

        <nav className="workspace-navbar">
          
          <div className="flex items-stretch h-full overflow-x-auto scrollbar-none" id="admin-navigation-links">

            {/* Category Groups Inset Selector */}
            <div className="flex items-stretch bg-chrome-deep/60 border-r-2 border-chrome-deep shrink-0">
              <div className="px-3 flex items-center gap-1.5 text-2xs font-mono uppercase text-teal-200 tracking-wider font-bold border-r border-chrome-deep shrink-0">
                <FolderKanban className="w-3.5 h-3.5 text-teal-200" />
                <span className="hidden sm:inline">Group:</span>
              </div>
              {availableCategories.map((cat) => {
                const isCatActive = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setActiveCategory(cat.id as any);
                      const firstInCat = filteredModules.find(m => m.category === cat.id);
                      if (firstInCat) setActiveTab(firstInCat.id as any);
                    }}
                    className={`h-full px-3 sm:px-3.5 text-xs font-bold transition-all cursor-pointer border-r border-chrome-deep flex items-center gap-1.5 shrink-0 ${
                      isCatActive 
                        ? 'bg-chrome text-white border-b-2 border-b-teal-300 font-bold' 
                        : 'text-teal-100/80 hover:bg-chrome-hover hover:text-white bg-transparent'
                    }`}
                  >
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Module Navigation Tabs (Standardized nav-btn, nav-btn-active, nav-btn-inactive) */}
            <div className="flex items-stretch overflow-x-auto scrollbar-none">
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
                      aria-current={isActive ? 'page' : undefined}
                      className={`nav-btn ${
                        isActive ? 'nav-btn-active' : 'nav-btn-inactive'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {isActive && <span className="w-1.5 h-1.5 rounded-none bg-white"></span>}
                        <IconComponent className={`w-4 h-4 ${isActive ? 'text-white' : 'text-teal-100/90'}`} />
                        <span>{mod.label}</span>
                      </div>
                      {isActive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 ml-2 animate-pulse"></span>}
                    </button>
                  );
                })}
            </div>

          </div>

          {/* Right Status Indicator */}
          <div className="hidden xl:flex items-center space-x-3 text-xs text-teal-100 font-sans pl-4 border-l border-chrome-deep ml-auto pr-3 shrink-0">
            <span className="font-mono text-2xs tracking-wider uppercase text-teal-200">
              Active: <strong className="text-white">{filteredModules.find(m => m.id === activeTab)?.label}</strong>
            </span>
          </div>

        </nav>

        {/* ========================================================================= */}
        {/* MAIN CONTENT AREA                                                         */}
        {/* ========================================================================= */}
        <main className="flex-1 p-5 overflow-y-auto bg-canvas dark:bg-night-900 text-ink dark:text-slate-100">
          <React.Suspense fallback={<GlobalSpinner />}>

          {activeTab === 'staff' && (userRole === 'admin' || userRole === 'hr') && settings.modules.staff && (
            <StaffManagementModule />
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
        </main>
      </div>

      <AppFooter online={isOnline} onHelp={help.show} />
      <HelpCenter open={help.open} onClose={help.hide} role={userRole} activeTab={activeTab} />

      {/* Sign Out Confirmation Modal */}
      {showSignOutConfirm && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn font-sans">
          <div className="bg-night-900 border border-rose-500/50 max-w-md w-full p-6 shadow-2xl space-y-4 text-white">
            <div className="flex items-center gap-3 text-rose-400">
              <LogOut className="w-6 h-6 shrink-0" />
              <h3 className="type-heading-caps text-white">Confirm Console Termination</h3>
            </div>
            <p className="text-xs text-teal-100/80 leading-relaxed">
              Are you sure you want to terminate your administrative session? Unsaved configuration changes will be safely persisted to Supabase.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowSignOutConfirm(false)}
                className="px-4 py-2 bg-night-800 hover:bg-night-700 text-teal-100 font-bold text-xs border border-white/15 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowSignOutConfirm(false);
                  onNavigate('landing');
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs cursor-pointer shadow-none"
              >
                Terminate Session
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
