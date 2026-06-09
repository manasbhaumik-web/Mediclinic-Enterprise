import React, { useState } from 'react';
import { 
  Users, Stethoscope, Pill, CreditCard, Activity, FileText, Settings, Plus, DollarSign,
  Building, ShieldAlert, LogOut, Server, Database, Menu, Bell
} from 'lucide-react';
import StaffManagementModule from './StaffManagementModule';
import MedicineManagementModule from './MedicineManagementModule';
import EquipmentManagementModule from './EquipmentManagementModule';
import BillingManagementModule from './BillingManagementModule';
import SettingsModule from './SettingsModule';
import { useSettings } from '../context/SettingsContext';

interface AdminModuleProps {
  onNavigate: (view: 'landing' | 'login') => void;
}

type AdminTab = 'overview' | 'staff' | 'medicine' | 'equipment' | 'billing' | 'reports' | 'settings';

export default function AdminModule({ onNavigate }: AdminModuleProps) {
  const [activeTab, setActiveTab] = useState<'staff' | 'medicine' | 'equipment' | 'billing' | 'reports' | 'settings'>('staff');
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
            {settings.modules.staff && (
              <button 
                onClick={() => setActiveTab('staff')}
                className={`flex items-center px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all whitespace-nowrap ${
                  activeTab === 'staff' 
                    ? 'bg-[#058A8A] text-white shadow font-semibold' 
                    : 'text-cyan-50 hover:bg-[#07B2B2] hover:text-white'
                }`}
              >
                <Users className="w-4 h-4 mr-2" />
                Staff Management
              </button>
            )}

            {settings.modules.medicine && (
              <button 
                onClick={() => setActiveTab('medicine')}
                className={`flex items-center px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all whitespace-nowrap ${
                  activeTab === 'medicine' 
                    ? 'bg-[#058A8A] text-white shadow font-semibold' 
                    : 'text-cyan-50 hover:bg-[#07B2B2] hover:text-white'
                }`}
              >
                <Pill className="w-4 h-4 mr-2" />
                Medicine & Inventory
              </button>
            )}

            {settings.modules.equipment && (
              <button 
                onClick={() => setActiveTab('equipment')}
                className={`flex items-center px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all whitespace-nowrap ${
                  activeTab === 'equipment' 
                    ? 'bg-[#058A8A] text-white shadow font-semibold' 
                    : 'text-cyan-50 hover:bg-[#07B2B2] hover:text-white'
                }`}
              >
                <Stethoscope className="w-4 h-4 mr-2" />
                Equipment Maintenance
              </button>
            )}

            {settings.modules.billing && (
              <button 
                onClick={() => setActiveTab('billing')}
                className={`flex items-center px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all whitespace-nowrap ${
                  activeTab === 'billing' 
                    ? 'bg-[#058A8A] text-white shadow font-semibold' 
                    : 'text-cyan-50 hover:bg-[#07B2B2] hover:text-white'
                }`}
              >
                <DollarSign className="w-4 h-4 mr-2" />
                Billing Management
              </button>
            )}

            {settings.modules.reports && (
              <button 
                onClick={() => setActiveTab('reports')}
                className={`flex items-center px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all whitespace-nowrap ${
                  activeTab === 'reports' 
                    ? 'bg-[#058A8A] text-white shadow font-semibold' 
                    : 'text-cyan-50 hover:bg-[#07B2B2] hover:text-white'
                }`}
              >
                <FileText className="w-4 h-4 mr-2" />
                Reports & Analytics
              </button>
            )}
            
            <button 
              onClick={() => setActiveTab('settings')}
              className={`flex items-center px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all whitespace-nowrap ${
                activeTab === 'settings' 
                  ? 'bg-[#058A8A] text-white shadow font-semibold' 
                  : 'text-cyan-50 hover:bg-[#07B2B2] hover:text-white'
              }`}
            >
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </button>
          </div>
        </nav>

        {/* Main Content Area */}
        <main className="flex-1 p-5 overflow-y-auto">
          
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-fadeIn max-w-5xl mx-auto">
              <h2 className="text-xl font-extrabold text-slate-800">System Telemetry</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between">
                  <div>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Server Uptime</p>
                    <p className="text-2xl font-black text-slate-800">99.98%</p>
                  </div>
                  <div className="bg-green-100 text-green-700 p-2 rounded-lg">
                    <Server className="w-5 h-5" />
                  </div>
                </div>
                
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between">
                  <div>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Database Load</p>
                    <p className="text-2xl font-black text-slate-800">12%</p>
                  </div>
                  <div className="bg-cyan-50 text-[#07B2B2] p-2 rounded-lg">
                    <Database className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between">
                  <div>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Active Sessions</p>
                    <p className="text-2xl font-black text-slate-800">4</p>
                  </div>
                  <div className="bg-amber-100 text-amber-700 p-2 rounded-lg">
                    <Users className="w-5 h-5" />
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-4">Audit Logs</h3>
                <div className="space-y-3 font-mono text-xs text-slate-600">
                  <div className="flex items-center gap-4 border-b border-slate-100 pb-2">
                    <span className="text-slate-400">10:45 AM</span>
                    <span className="text-[#07B2B2] font-bold">INFO</span>
                    <span>System backup completed successfully (420MB).</span>
                  </div>
                  <div className="flex items-center gap-4 border-b border-slate-100 pb-2">
                    <span className="text-slate-400">09:12 AM</span>
                    <span className="text-amber-500 font-bold">WARN</span>
                    <span>High latency detected on NIDCS API gateway endpoint.</span>
                  </div>
                  <div className="flex items-center gap-4 border-b border-slate-100 pb-2">
                    <span className="text-slate-400">08:00 AM</span>
                    <span className="text-emerald-600 font-bold">AUTH</span>
                    <span>Dr. Sarah (Staff ID: 101) authenticated successfully.</span>
                  </div>
                </div>
              </div>
            </div>
          )}

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
            <div className="animate-fadeIn max-w-5xl mx-auto space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Reports Module</h2>
                  <p className="text-xs text-slate-500">Generate operational, clinical, and financial analytics reports.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { title: 'Clinical ICD-10 Demographics', desc: 'Patient diagnosis distribution by month', type: 'Clinical' },
                  { title: 'Pharmacy Dispensation Log', desc: 'Full audit trail of all dispensed medications', type: 'Inventory' },
                  { title: 'TPA Reconciliation Report', desc: 'Unpaid and paid claims from insurance panels', type: 'Financial' },
                  { title: 'MOH NIDCS Weekly Audit', desc: 'Data transmitted to the Ministry of Health', type: 'Compliance' },
                  { title: 'Staff Performance & Loads', desc: 'Consultation times and patient volume per doctor', type: 'Operational' }
                ].map((rep, i) => (
                  <div key={i} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-[#07B2B2] bg-cyan-50 px-2 py-1 rounded">{rep.type}</span>
                    <h3 className="font-bold text-slate-800 mt-3 group-hover:text-[#07B2B2] transition-colors">{rep.title}</h3>
                    <p className="text-xs text-slate-500 mt-1">{rep.desc}</p>
                    <div className="mt-4 flex items-center text-xs font-bold text-[#07B2B2]">
                      Generate PDF &rarr;
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <SettingsModule />
          )}
          
        </main>
      </div>
    </div>
  );
}
