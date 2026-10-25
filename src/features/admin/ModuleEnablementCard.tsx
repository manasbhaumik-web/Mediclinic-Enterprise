import React, { useState } from 'react';
import { 
  LayoutDashboard, Users, Pill, Stethoscope, DollarSign, FileSpreadsheet, 
  Check, CheckCircle2, ShieldCheck, AlertCircle 
} from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';

export default function ModuleEnablementCard() {
  const { settings, updateSettings } = useSettings();
  const [savedToast, setSavedToast] = useState(false);

  const handleModuleToggle = (moduleName: keyof typeof settings.modules) => {
    updateSettings({
      ...settings,
      modules: {
        ...settings.modules,
        [moduleName]: !settings.modules[moduleName]
      }
    });
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2000);
  };

  const activeModulesCount = Object.values(settings.modules).filter(Boolean).length;

  const moduleDefinitions = [
    {
      id: 'staff' as const,
      name: 'Staff & HR Management',
      icon: Users,
      desc: 'Doctor credentialing, nurse scheduling, duty rosters, and leave approvals.',
      roleBadge: 'Admin / HR'
    },
    {
      id: 'medicine' as const,
      name: 'Medicine Inventory & Dispensary',
      icon: Pill,
      desc: 'Real-time stock valuation, reorder alerts, drug batches, and barcode dispensing.',
      roleBadge: 'Admin / Pharmacy'
    },
    {
      id: 'equipment' as const,
      name: 'Asset & Equipment Governance',
      icon: Stethoscope,
      desc: 'Biomedical device maintenance cycles, calibration logs, and safety tests.',
      roleBadge: 'Admin'
    },
    {
      id: 'billing' as const,
      name: 'Billing & Corporate TPA Claims',
      icon: DollarSign,
      desc: 'Point-of-sale cashier desk, split insurance payments, and panel GL reconciliation.',
      roleBadge: 'Admin / Billing'
    },
    {
      id: 'reports' as const,
      name: 'Reports & MOH Analytics',
      icon: FileSpreadsheet,
      desc: 'Ministry of Health statutory returns, revenue breakdowns, and clinical data exports.',
      roleBadge: 'Admin'
    }
  ];

  return (
    <section className="bg-surface rounded-none border border-line shadow-2xs overflow-hidden">
      {/* HEADER BANNER */}
      <div className="bg-surface-muted px-5 py-3.5 border-b border-line flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-brand/10 text-accent rounded-none border border-brand/20">
            <LayoutDashboard className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h3 className="type-card-title text-ink">Administration Module Governance</h3>
            <p className="text-2xs text-subtle mt-0.5">
              Control workspace availability and sidebar module visibility across the enterprise console.
            </p>
          </div>
        </div>
        <span className="text-xs text-subtle font-mono px-2 py-0.5 bg-teal-50 text-accent border border-teal-200">
          {activeModulesCount} of {moduleDefinitions.length} modules active
        </span>
      </div>

      <div className="p-5 space-y-4">
        <p className="text-xs text-subtle">
          Disabled modules are immediately hidden from the staff workspace navigation sidebar to simplify workstation workflows.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {moduleDefinitions.map((mod) => {
            const isEnabled = settings.modules[mod.id];
            const Icon = mod.icon;
            return (
              <div 
                key={mod.id}
                className={`p-4 border transition-all flex items-start justify-between gap-3 ${
                  isEnabled 
                    ? 'border-line bg-surface hover:border-brand/50' 
                    : 'border-line-subtle bg-surface-muted/50 opacity-70'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2.5 rounded-none border ${
                    isEnabled 
                      ? 'bg-teal-50 text-accent border-line-subtle' 
                      : 'bg-slate-200 text-slate-400 border-slate-300'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-ink">{mod.name}</p>
                      <span className="text-3xs font-mono px-1.5 py-0.2 bg-surface-accent border border-line-subtle text-subtle">
                        {mod.roleBadge}
                      </span>
                    </div>
                    <p className="text-2xs text-subtle mt-1 leading-relaxed">{mod.desc}</p>
                  </div>
                </div>

                <label className="relative inline-flex items-center justify-center cursor-pointer shrink-0 mt-1">
                  <input 
                    type="checkbox" 
                    checked={isEnabled} 
                    onChange={() => handleModuleToggle(mod.id)} 
                    className="sr-only peer" 
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-none peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
            );
          })}
        </div>

        {savedToast && (
          <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="font-bold">Module visibility configuration synced with role permissions.</span>
          </div>
        )}
      </div>
    </section>
  );
}
