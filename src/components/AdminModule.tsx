import React, { useState, useEffect } from 'react';
import {
  Users, Stethoscope, Pill, DollarSign, Activity, FileText, Settings, 
  Building, ShieldAlert, LogOut, Server, Database, Bell, Globe2, TrendingUp,
  Clock, ShieldCheck, Moon, Sun, ChevronDown, ChevronRight, Eye, EyeOff, Wifi, WifiOff
} from 'lucide-react';
import StaffManagementModule from './StaffManagementModule';
import MedicineManagementModule from './MedicineManagementModule';
import EquipmentManagementModule from './EquipmentManagementModule';
import BillingManagementModule from './BillingManagementModule';
import ReportsAnalyticsModule from './ReportsAnalyticsModule';
import SettingsModule from './SettingsModule';
import MOHDashboard from './MOHDashboard';
import IntegrationsHub from './IntegrationsHub';
import OperationsHub from './OperationsHub';
import SecurityHub from './SecurityHub';
import RevenueCycleHub from './RevenueCycleHub';
import SystemArchitectureHub from './SystemArchitectureHub';
import { useSettings } from '../context/SettingsContext';
import { Visit, Language } from '../types';

interface AdminModuleProps {
  onNavigate: (view: 'landing' | 'login') => void;
  userRole: 'admin' | 'hr';
  completedVisits?: Visit[];
  totalRegisteredCount?: number;
  activeLanguage?: Language;
}

type AdminTab = 'overview' | 'staff' | 'medicine' | 'equipment' | 'billing' | 'reports' | 'moh' | 'settings' | 'integrations' | 'operations' | 'security' | 'rcm' | 'architecture';

export default function AdminModule({
  onNavigate,
  userRole,
  completedVisits = [],
  totalRegisteredCount = 0,
  activeLanguage = 'EN'
}: AdminModuleProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('staff');
  const { settings } = useSettings();

  // Workstation Header State
  const [showUserMenu, setShowUserMenu] = useState<boolean>(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState<boolean>(false);
  const [isNightShift, setIsNightShift] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [showPII, setShowPII] = useState<boolean>(true);
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

  return (
    <div className={`min-h-screen flex flex-col font-sans antialiased selection:bg-[#0d9488]/20 transition-colors duration-300 ${
      isNightShift ? 'dark bg-[#092e38] text-slate-100' : 'bg-[#f7fdfd] text-[#0f3c4c]'
    }`}>

      {/* ========================================================================= */}
      {/* GLOBAL TOP ADMIN HEADER BAR (Unified with Doctor & Assistant Workspace)   */}
      {/* ========================================================================= */}
      <header className="h-[60px] bg-[#0a837f] text-white px-4 sm:px-6 flex items-center justify-between border-b border-[#086b68] shrink-0 shadow-md shadow-black/10 relative z-30 sticky top-0 font-sans">
        
        {/* Left: Brand Identity & Module Subtitle */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-none shrink-0 flex items-center justify-center">
            <img src="./logo_transparent.svg" alt="Mediclinic Enterprise Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tight uppercase leading-none font-sans text-white flex items-center gap-1.5">
              <span>MEDICLINIC ADMIN CONSOLE</span>
            </h1>
            <span className="text-[10px] text-teal-100 font-mono tracking-wider font-semibold block mt-0.5">
              System Configuration &amp; Governance • Executive Suite
            </span>
          </div>
        </div>

        {/* Center: Offline Mode Warning Indicator */}
        {!isOnline && (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-rose-500/20 text-rose-100 border border-rose-400/50 rounded-none text-xs font-mono font-bold uppercase animate-pulse">
            <WifiOff className="w-3.5 h-3.5 text-rose-300" />
            <span>Offline Simulation Mode</span>
          </div>
        )}

        {/* Right Controls: Notifications & Workstation Settings */}
        <div className="flex items-center gap-3 relative">
          
          {/* Notifications Bell */}
          <button 
            type="button"
            className="relative p-1.5 text-teal-100 hover:text-white cursor-pointer transition-colors bg-[#086b68] border border-[#065451]"
            title="System Alerts & Governance Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-400 rounded-full animate-ping"></span>
            <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-400 rounded-full"></span>
          </button>

          {/* Live Clock */}
          <div className="hidden xl:flex items-center gap-1.5 bg-[#086b68] px-2.5 py-1 border border-[#065451] font-mono text-xs text-white rounded-none font-bold shadow-2xs">
            <Clock className="w-3.5 h-3.5 text-teal-100" />
            <span>{timeString || '14:20:15 MYT'}</span>
          </div>

          {/* Workstation Settings Popover & User Trigger */}
          <div className="relative">
            <button 
              type="button"
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 bg-[#086b68] hover:bg-[#065451] border border-[#065451] px-3 py-1.5 rounded-none cursor-pointer transition-colors shadow-2xs"
              title="Workstation settings and administrator controls"
            >
              <div className="w-6 h-6 bg-[#0a837f] text-white font-mono text-[11px] font-black flex items-center justify-center rounded-none border border-teal-300/40">
                {userRole === 'admin' ? 'AD' : 'HR'}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-white text-xs font-bold leading-none">{adminName}</p>
                <p className="text-[9px] text-teal-100 font-mono uppercase tracking-wider mt-0.5">
                  {userRole.toUpperCase()} Console
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
                    <p className="font-extrabold text-sm text-[#5eead4]">{adminName}</p>
                    <p className="text-[10px] text-teal-200 font-mono uppercase">{userRole.toUpperCase()} Suite • Admin Station</p>
                  </div>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" title="Active session"></span>
                </div>

                {/* Workstation Settings Controls */}
                <div className="space-y-2.5 pt-1">
                  <p className="text-[10px] font-mono uppercase text-teal-300 tracking-wider font-extrabold">Console Settings</p>
                  
                  {/* Theme Switch */}
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
                      {isNightShift ? 'Night' : 'Day'}
                    </button>
                  </div>

                  {/* PII Privacy Mask Toggle */}
                  <div className="flex items-center justify-between bg-[#0b333d] p-2 border border-teal-900/60">
                    <span className="text-teal-100 font-medium flex items-center gap-1.5">
                      {showPII ? <Eye className="w-3.5 h-3.5 text-teal-300" /> : <EyeOff className="w-3.5 h-3.5 text-rose-300" />}
                      <span>Mask Patient PII</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowPII(!showPII)}
                      className={`px-2.5 py-1 text-[10px] font-bold font-mono uppercase transition-colors cursor-pointer border ${
                        showPII ? 'bg-teal-700 text-white border-teal-600' : 'bg-rose-950 text-rose-300 border-rose-800'
                      }`}
                    >
                      {showPII ? 'Unmasked' : 'Masked'}
                    </button>
                  </div>

                  {/* PWA / Network Simulator Toggle */}
                  <div className="flex items-center justify-between bg-[#0b333d] p-2 border border-teal-900/60">
                    <span className="text-teal-100 font-medium flex items-center gap-1.5">
                      {isOnline ? <Wifi className="w-3.5 h-3.5 text-emerald-400" /> : <WifiOff className="w-3.5 h-3.5 text-rose-400" />}
                      <span>Network Sync</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsOnline(!isOnline)}
                      className={`px-2.5 py-1 text-[10px] font-bold font-mono uppercase transition-colors cursor-pointer border ${
                        isOnline ? 'bg-emerald-950 text-emerald-300 border-emerald-700' : 'bg-rose-950 text-rose-300 border-rose-800'
                      }`}
                    >
                      {isOnline ? 'Online' : 'Offline'}
                    </button>
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
                      <LogOut className="w-4 h-4 text-rose-400" /> Terminate Session...
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-rose-300" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quick Signout Button */}
          <button
            type="button"
            onClick={() => onNavigate('landing')}
            className="flex items-center gap-1.5 bg-[#086b68] hover:bg-rose-700 text-teal-100 hover:text-white px-3 py-1.5 border border-[#065451] hover:border-rose-600 transition-colors text-xs font-extrabold cursor-pointer"
            title="Terminate session and return to homepage"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Exit</span>
          </button>

        </div>
      </header>

      {/* ========================================================================= */}
      {/* UNIFIED SUB-NAVIGATION STRIP                                              */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col overflow-hidden relative">

        <nav className="w-full bg-[#086b68] text-white flex items-center justify-start border-b border-[#065451] shrink-0 px-4 overflow-x-auto custom-scrollbar font-sans">
          <div className="flex items-center space-x-1 py-2">
            
            {(userRole === 'admin' || userRole === 'hr') && settings.modules.staff && (
              <button
                type="button"
                onClick={() => setActiveTab('staff')}
                className={`flex items-center px-3.5 py-2 text-xs cursor-pointer transition-all whitespace-nowrap ${
                  activeTab === 'staff'
                    ? 'bg-[#0a837f] text-white shadow-sm font-extrabold border border-teal-300/40 rounded-none'
                    : 'text-teal-100 hover:bg-[#065451] hover:text-white font-semibold rounded-none'
                }`}
              >
                <Users className="w-4 h-4 mr-2" />
                Staff Directory
              </button>
            )}

            {userRole === 'admin' && settings.modules.medicine && (
              <button
                type="button"
                onClick={() => setActiveTab('medicine')}
                className={`flex items-center px-3.5 py-2 text-xs cursor-pointer transition-all whitespace-nowrap ${
                  activeTab === 'medicine'
                    ? 'bg-[#0a837f] text-white shadow-sm font-extrabold border border-teal-300/40 rounded-none'
                    : 'text-teal-100 hover:bg-[#065451] hover:text-white font-semibold rounded-none'
                }`}
              >
                <Pill className="w-4 h-4 mr-2" />
                Inventory &amp; Pharmacy
              </button>
            )}

            {userRole === 'admin' && settings.modules.equipment && (
              <button
                type="button"
                onClick={() => setActiveTab('equipment')}
                className={`flex items-center px-3.5 py-2 text-xs cursor-pointer transition-all whitespace-nowrap ${
                  activeTab === 'equipment'
                    ? 'bg-[#0a837f] text-white shadow-sm font-extrabold border border-teal-300/40 rounded-none'
                    : 'text-teal-100 hover:bg-[#065451] hover:text-white font-semibold rounded-none'
                }`}
              >
                <Stethoscope className="w-4 h-4 mr-2" />
                Equipment &amp; Assets
              </button>
            )}

            {userRole === 'admin' && settings.modules.billing && (
              <button
                type="button"
                onClick={() => setActiveTab('billing')}
                className={`flex items-center px-3.5 py-2 text-xs cursor-pointer transition-all whitespace-nowrap ${
                  activeTab === 'billing'
                    ? 'bg-[#0a837f] text-white shadow-sm font-extrabold border border-teal-300/40 rounded-none'
                    : 'text-teal-100 hover:bg-[#065451] hover:text-white font-semibold rounded-none'
                }`}
              >
                <DollarSign className="w-4 h-4 mr-2" />
                Billing Desk
              </button>
            )}

            {userRole === 'admin' && settings.modules.reports && (
              <button
                type="button"
                onClick={() => setActiveTab('reports')}
                className={`flex items-center px-3.5 py-2 text-xs cursor-pointer transition-all whitespace-nowrap ${
                  activeTab === 'reports'
                    ? 'bg-[#0a837f] text-white shadow-sm font-extrabold border border-teal-300/40 rounded-none'
                    : 'text-teal-100 hover:bg-[#065451] hover:text-white font-semibold rounded-none'
                }`}
              >
                <FileText className="w-4 h-4 mr-2" />
                Analytics Reports
              </button>
            )}

            {userRole === 'admin' && (
              <button
                type="button"
                onClick={() => setActiveTab('moh')}
                className={`flex items-center px-3.5 py-2 text-xs cursor-pointer transition-all whitespace-nowrap ${
                  activeTab === 'moh'
                    ? 'bg-[#0a837f] text-white shadow-sm font-extrabold border border-teal-300/40 rounded-none'
                    : 'text-teal-100 hover:bg-[#065451] hover:text-white font-semibold rounded-none'
                }`}
              >
                <Globe2 className="w-4 h-4 mr-2" />
                MOH Regulatory
              </button>
            )}

            {userRole === 'admin' && (
              <button
                type="button"
                onClick={() => setActiveTab('rcm')}
                className={`flex items-center px-3.5 py-2 text-xs cursor-pointer transition-all whitespace-nowrap ${
                  activeTab === 'rcm'
                    ? 'bg-[#0a837f] text-white shadow-sm font-extrabold border border-teal-300/40 rounded-none'
                    : 'text-teal-100 hover:bg-[#065451] hover:text-white font-semibold rounded-none'
                }`}
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                RCM Gateway
              </button>
            )}

            {userRole === 'admin' && (
              <button 
                type="button"
                onClick={() => setActiveTab('architecture')}
                className={`flex items-center px-3.5 py-2 text-xs cursor-pointer transition-all whitespace-nowrap ${
                  activeTab === 'architecture' 
                    ? 'bg-[#0a837f] text-white shadow-sm font-extrabold border border-teal-300/40 rounded-none' 
                    : 'text-teal-100 hover:bg-[#065451] hover:text-white font-semibold rounded-none'
                }`}
              >
                <Server className="w-4 h-4 mr-2" />
                Architecture
              </button>
            )}

            {userRole === 'admin' && (
              <button
                type="button"
                onClick={() => setActiveTab('operations')}
                className={`flex items-center px-3.5 py-2 text-xs cursor-pointer transition-all whitespace-nowrap ${
                  activeTab === 'operations'
                    ? 'bg-[#0a837f] text-white shadow-sm font-extrabold border border-teal-300/40 rounded-none'
                    : 'text-teal-100 hover:bg-[#065451] hover:text-white font-semibold rounded-none'
                }`}
              >
                <Activity className="w-4 h-4 mr-2" />
                Operations
              </button>
            )}

            {userRole === 'admin' && (
              <button
                type="button"
                onClick={() => setActiveTab('integrations')}
                className={`flex items-center px-3.5 py-2 text-xs cursor-pointer transition-all whitespace-nowrap ${
                  activeTab === 'integrations'
                    ? 'bg-[#0a837f] text-white shadow-sm font-extrabold border border-teal-300/40 rounded-none'
                    : 'text-teal-100 hover:bg-[#065451] hover:text-white font-semibold rounded-none'
                }`}
              >
                <Database className="w-4 h-4 mr-2" />
                Integrations
              </button>
            )}

            {userRole === 'admin' && (
              <button
                type="button"
                onClick={() => setActiveTab('settings')}
                className={`flex items-center px-3.5 py-2 text-xs cursor-pointer transition-all whitespace-nowrap ${
                  activeTab === 'settings'
                    ? 'bg-[#0a837f] text-white shadow-sm font-extrabold border border-teal-300/40 rounded-none'
                    : 'text-teal-100 hover:bg-[#065451] hover:text-white font-semibold rounded-none'
                }`}
              >
                <Settings className="w-4 h-4 mr-2" />
                Console Settings
              </button>
            )}
          </div>
        </nav>

        {/* ========================================================================= */}
        {/* MAIN CONTENT AREA                                                         */}
        {/* ========================================================================= */}
        <main className="flex-1 p-5 overflow-y-auto bg-[#f7fdfd] text-[#0f3c4c]">

          {activeTab === 'staff' && (userRole === 'admin' || userRole === 'hr') && settings.modules.staff && (
            <StaffManagementModule />
          )}

          {activeTab === 'medicine' && userRole === 'admin' && settings.modules.medicine && (
            <MedicineManagementModule />
          )}

          {activeTab === 'equipment' && userRole === 'admin' && settings.modules.equipment && (
            <EquipmentManagementModule />
          )}

          {activeTab === 'billing' && userRole === 'admin' && settings.modules.billing && (
            <BillingManagementModule />
          )}

          {activeTab === 'reports' && userRole === 'admin' && settings.modules.reports && (
            <ReportsAnalyticsModule />
          )}

          {activeTab === 'moh' && userRole === 'admin' && (
            <div className="space-y-4 animate-fadeIn max-w-6xl mx-auto">
              <h2 className="text-xl font-black text-[#0f3c4c] flex items-center gap-2 mb-4">
                <Globe2 className="w-6 h-6 text-[#0d9488]" />
                MOH &amp; Clinic Regulatory Compliance
              </h2>
              <MOHDashboard
                completedVisits={completedVisits}
                totalRegisteredCount={totalRegisteredCount}
                activeLanguage={activeLanguage}
              />
            </div>
          )}

          {activeTab === 'settings' && userRole === 'admin' && (
            <SettingsModule />
          )}

          {activeTab === 'integrations' && userRole === 'admin' && (
            <IntegrationsHub />
          )}

          {activeTab === 'operations' && userRole === 'admin' && (
            <OperationsHub />
          )}

          {activeTab === 'security' && userRole === 'admin' && (
            <SecurityHub />
          )}

          {activeTab === 'rcm' && userRole === 'admin' && (
            <RevenueCycleHub />
          )}

          {activeTab === 'architecture' && userRole === 'admin' && (
            <SystemArchitectureHub />
          )}

        </main>
      </div>

      {/* Sign Out Confirmation Modal */}
      {showSignOutConfirm && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn font-sans">
          <div className="bg-[#07252d] border border-rose-500/50 max-w-md w-full p-6 shadow-2xl space-y-4 text-white">
            <div className="flex items-center gap-3 text-rose-400">
              <LogOut className="w-6 h-6 shrink-0" />
              <h3 className="text-lg font-black uppercase tracking-tight text-white">Confirm Console Termination</h3>
            </div>
            <p className="text-xs text-teal-100/80 leading-relaxed">
              Are you sure you want to terminate your administrative session? Unsaved configuration changes will be safely persisted to Supabase.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowSignOutConfirm(false)}
                className="px-4 py-2 bg-[#0b333d] hover:bg-[#0f4350] text-teal-100 font-bold text-xs border border-teal-800/80 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowSignOutConfirm(false);
                  onNavigate('landing');
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs cursor-pointer shadow-md"
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
