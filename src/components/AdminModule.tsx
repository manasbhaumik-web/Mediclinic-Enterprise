import React, { useState } from 'react';
import {
  Users, Stethoscope, Pill, CreditCard, Activity, FileText, Settings, Plus, DollarSign,
  Building, ShieldAlert, LogOut, Server, Database, Menu, Bell, Globe2, TrendingUp
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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 antialiased">

      {/* Admin Header */}
      <header className="bg-[#07B2B2] text-white px-5 py-3 flex items-center justify-between border-b border-cyan-800 shrink-0 shadow-md">
        <div className="flex items-center gap-3">
          <div className="bg-white/10 p-2 rounded-lg border border-slate-700 shadow-inner">
            <ShieldAlert className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-extrabold tracking-tight uppercase leading-none font-sans text-white">
              MediClinic Admin Console
            </h1>
            <span className="text-[10px] text-cyan-100 font-mono tracking-wider">System Configuration & Governance</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button className="relative text-cyan-50 hover:text-white cursor-pointer">
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('landing')}
            className="flex items-center gap-2 bg-cyan-900/50 hover:bg-red-500/80 text-white px-3 py-1.5 rounded-lg border border-cyan-800 transition-colors text-xs font-bold cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Terminate Session
          </button>
        </div>
      </header>

      <div className="flex-1 flex flex-col overflow-hidden relative">

        {/* Admin Navigation Bar */}
        <nav className="w-full bg-[#069494] text-white flex items-center justify-start border-b border-cyan-800 shrink-0 px-4 overflow-x-auto custom-scrollbar">
          <div className="flex items-center space-x-1 py-2">
            {(userRole === 'admin' || userRole === 'hr') && settings.modules.staff && (
              <button
                onClick={() => setActiveTab('staff')}
                className={`flex items-center px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all whitespace-nowrap ${activeTab === 'staff'
                    ? 'bg-[#058A8A] text-white shadow font-semibold'
                    : 'text-cyan-50 hover:bg-[#07B2B2] hover:text-white'
                  }`}
              >
                <Users className="w-4 h-4 mr-2" />
                Staff
              </button>
            )}

            {userRole === 'admin' && settings.modules.medicine && (
              <button
                onClick={() => setActiveTab('medicine')}
                className={`flex items-center px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all whitespace-nowrap ${activeTab === 'medicine'
                    ? 'bg-[#058A8A] text-white shadow font-semibold'
                    : 'text-cyan-50 hover:bg-[#07B2B2] hover:text-white'
                  }`}
              >
                <Pill className="w-4 h-4 mr-2" />
                Inventory
              </button>
            )}

            {userRole === 'admin' && settings.modules.equipment && (
              <button
                onClick={() => setActiveTab('equipment')}
                className={`flex items-center px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all whitespace-nowrap ${activeTab === 'equipment'
                    ? 'bg-[#058A8A] text-white shadow font-semibold'
                    : 'text-cyan-50 hover:bg-[#07B2B2] hover:text-white'
                  }`}
              >
                <Stethoscope className="w-4 h-4 mr-2" />
                Equipment
              </button>
            )}

            {userRole === 'admin' && settings.modules.billing && (
              <button
                onClick={() => setActiveTab('billing')}
                className={`flex items-center px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all whitespace-nowrap ${activeTab === 'billing'
                    ? 'bg-[#058A8A] text-white shadow font-semibold'
                    : 'text-cyan-50 hover:bg-[#07B2B2] hover:text-white'
                  }`}
              >
                <DollarSign className="w-4 h-4 mr-2" />
                Billing
              </button>
            )}

            {userRole === 'admin' && settings.modules.reports && (
              <button
                onClick={() => setActiveTab('reports')}
                className={`flex items-center px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all whitespace-nowrap ${activeTab === 'reports'
                    ? 'bg-[#058A8A] text-white shadow font-semibold'
                    : 'text-cyan-50 hover:bg-[#07B2B2] hover:text-white'
                  }`}
              >
                <FileText className="w-4 h-4 mr-2" />
                Reports
              </button>
            )}

            {userRole === 'admin' && (
              <button
                onClick={() => setActiveTab('moh')}
                className={`flex items-center px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all whitespace-nowrap ${activeTab === 'moh'
                    ? 'bg-[#058A8A] text-white shadow font-semibold'
                    : 'text-cyan-50 hover:bg-[#07B2B2] hover:text-white'
                  }`}
              >
                <Globe2 className="w-4 h-4 mr-2" />
                MOH
              </button>
            )}

            {userRole === 'admin' && (
              <button
                onClick={() => setActiveTab('rcm')}
                className={`flex items-center px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all whitespace-nowrap ${activeTab === 'rcm'
                    ? 'bg-[#058A8A] text-white shadow font-semibold'
                    : 'text-cyan-50 hover:bg-[#07B2B2] hover:text-white'
                  }`}
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                RCM
              </button>
            )}

            {userRole === 'admin' && (
              <button 
                onClick={() => setActiveTab('architecture')}
                className={`flex items-center px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all whitespace-nowrap ${
                  activeTab === 'architecture' 
                    ? 'bg-[#058A8A] text-white shadow font-semibold' 
                    : 'text-cyan-50 hover:bg-[#07B2B2] hover:text-white'
                }`}
              >
                <Server className="w-4 h-4 mr-2" />
                Architecture
              </button>
            )}

            {userRole === 'admin' && (
              <button
                onClick={() => setActiveTab('operations')}
                className={`flex items-center px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all whitespace-nowrap ${activeTab === 'operations'
                    ? 'bg-[#058A8A] text-white shadow font-semibold'
                    : 'text-cyan-50 hover:bg-[#07B2B2] hover:text-white'
                  }`}
              >
                <Activity className="w-4 h-4 mr-2" />
                Operations
              </button>
            )}

            {userRole === 'admin' && (
              <button
                onClick={() => setActiveTab('integrations')}
                className={`flex items-center px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all whitespace-nowrap ${activeTab === 'integrations'
                    ? 'bg-[#058A8A] text-white shadow font-semibold'
                    : 'text-cyan-50 hover:bg-[#07B2B2] hover:text-white'
                  }`}
              >
                <Database className="w-4 h-4 mr-2" />
                Integrations
              </button>
            )}

            {userRole === 'admin' && (
              <button
                onClick={() => setActiveTab('settings')}
                className={`flex items-center px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all whitespace-nowrap ${activeTab === 'settings'
                    ? 'bg-[#058A8A] text-white shadow font-semibold'
                    : 'text-cyan-50 hover:bg-[#07B2B2] hover:text-white'
                  }`}
              >
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </button>
            )}
          </div>
        </nav>

        {/* Main Content Area */}
        <main className="flex-1 p-5 overflow-y-auto">

          {activeTab === 'staff' && (
            <StaffManagementModule />
          )}

          {activeTab === 'medicine' && (
            <MedicineManagementModule />
          )}

          {activeTab === 'equipment' && (
            <EquipmentManagementModule />
          )}

          {activeTab === 'billing' && (
            <BillingManagementModule />
          )}

          {activeTab === 'reports' && (
            <ReportsAnalyticsModule />
          )}

          {activeTab === 'moh' && (
            <div className="space-y-4 animate-fadeIn max-w-6xl mx-auto">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-4">
                <Globe2 className="w-6 h-6 text-[#07B2B2]" />
                MOH & Clinic Analysis
              </h2>
              <MOHDashboard
                completedVisits={completedVisits}
                totalRegisteredCount={totalRegisteredCount}
                activeLanguage={activeLanguage}
              />
            </div>
          )}

          {activeTab === 'settings' && (
            <SettingsModule />
          )}

          {activeTab === 'integrations' && (
            <IntegrationsHub />
          )}

          {activeTab === 'operations' && (
            <OperationsHub />
          )}

          {activeTab === 'security' && (
            <SecurityHub />
          )}

          {activeTab === 'rcm' && (
            <RevenueCycleHub />
          )}

          {activeTab === 'architecture' && (
            <SystemArchitectureHub />
          )}

        </main>
      </div>
    </div>
  );
}
