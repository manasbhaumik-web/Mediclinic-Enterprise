import React from 'react';
import { 
  Building, DoorOpen, Bot, Percent, LayoutDashboard, Smartphone, 
  ChevronRight, CheckCircle2, ShieldCheck, Activity, ArrowUpRight,
  Server, Cpu, Database
} from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';

interface SettingsOverviewCardProps {
  onSelectCategory: (category: 'profile' | 'facilities' | 'ai_gateway' | 'billing' | 'modules' | 'hardware') => void;
}

export default function SettingsOverviewCard({ onSelectCategory }: SettingsOverviewCardProps) {
  const { settings, clinic } = useSettings();

  const activeModulesCount = Object.values(settings.modules).filter(Boolean).length;
  const activeHardwareCount = Object.values(settings.hardware).filter(Boolean).length;
  const aiProvider = settings.aiConfig?.provider?.toUpperCase() || 'GEMINI';
  const aiModel = settings.aiConfig?.modelName || 'gemini-1.5-flash';
  const aiActive = settings.aiConfig?.enabled ?? true;

  const categories = [
    {
      id: 'profile' as const,
      title: 'Clinic Identity & License',
      icon: Building,
      badge: clinic.name ? 'Configured' : 'Setup Required',
      badgeTone: clinic.name ? 'ok' : 'warn',
      summary: clinic.name ? `${clinic.name} (${clinic.branch || 'Main Branch'})` : 'No clinic profile saved yet.',
      detail: clinic.licenseNo ? `KKM: ${clinic.licenseNo} • Exp: ${clinic.licenseExpiry || 'N/A'}` : 'MOH operating license not recorded.',
    },
    {
      id: 'facilities' as const,
      title: 'Rooms & Services',
      icon: DoorOpen,
      badge: 'Active Hub',
      badgeTone: 'ok',
      summary: 'Consultation suites & specialty booking routes',
      detail: 'Rooms 1–4 configured with doctor assignment routing.',
    },
    {
      id: 'ai_gateway' as const,
      title: 'AI & Generative LLM Gateway',
      icon: Bot,
      badge: aiActive ? `${aiProvider} Active` : 'Disabled',
      badgeTone: aiActive ? 'ok' : 'neutral',
      summary: `${aiModel} • Tier-1/Tier-2 Hybrid`,
      detail: 'Ambient Scribe, MEWS Triage, Drug Safety, Claims & Stock AI.',
    },
    {
      id: 'billing' as const,
      title: 'Financial Parameters & SST',
      icon: Percent,
      badge: `${settings.billing.taxRate}% SST Active`,
      badgeTone: 'ok',
      summary: `Base RM ${settings.billing.consultationFee.toFixed(2)} / RM ${settings.billing.procedureFee.toFixed(2)}`,
      detail: 'Automatic SST calculation applied to all checkout invoices.',
    },
    {
      id: 'modules' as const,
      title: 'Administration Modules',
      icon: LayoutDashboard,
      badge: `${activeModulesCount} of 5 Active`,
      badgeTone: 'ok',
      summary: 'Staff, Medicine, Equipment, Billing & Reports',
      detail: 'Role-based access controls and navigation visibility.',
    },
    {
      id: 'hardware' as const,
      title: 'Hardware Peripherals',
      icon: Smartphone,
      badge: `${activeHardwareCount} of 3 Online`,
      badgeTone: activeHardwareCount > 0 ? 'ok' : 'warn',
      summary: 'MyKad IC Reader, Thermal Printer, Barcode Scanner',
      detail: 'Direct USB, ESC/POS, and HID device communication drivers.',
    },
  ];

  return (
    <div className="space-y-6">
      {/* SECTION TITLE & DESCRIPTION */}
      <div className="bg-surface rounded-none border border-line p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="type-section-title text-ink flex items-center gap-2">
              <Activity className="w-5 h-5 text-accent" />
              Console Settings Overview & Categorized Control Hub
            </h2>
            <p className="text-xs text-muted mt-1 max-w-3xl leading-relaxed">
              Select a specialized category below to fine-tune individual configuration domains without scrolling through an undivided screen.
            </p>
          </div>
          <span className="text-2xs font-mono font-bold px-2.5 py-1 bg-teal-50 text-accent border border-teal-200">
            Enterprise Schema v2.4
          </span>
        </div>
      </div>

      {/* CATEGORY GRID CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {categories.map((c) => {
          const Icon = c.icon;
          return (
            <div
              key={c.id}
              className="bg-surface rounded-none border border-line p-5 shadow-2xs flex flex-col justify-between hover:border-brand/60 transition-all group"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="p-2.5 bg-teal-50 text-accent border border-line-subtle rounded-none group-hover:bg-primary group-hover:text-white transition-colors">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={`text-2xs font-mono font-bold px-2 py-0.5 border ${
                    c.badgeTone === 'ok' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' :
                    c.badgeTone === 'warn' ? 'bg-amber-50 text-amber-800 border-amber-300' :
                    'bg-slate-100 text-slate-600 border-slate-300'
                  }`}>
                    {c.badge}
                  </span>
                </div>

                <h3 className="type-card-title text-ink group-hover:text-accent transition-colors">
                  {c.title}
                </h3>
                <p className="text-xs font-bold text-ink/80 mt-1">
                  {c.summary}
                </p>
                <p className="text-2xs text-subtle mt-1.5 leading-relaxed">
                  {c.detail}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-line-subtle">
                <button
                  type="button"
                  onClick={() => onSelectCategory(c.id)}
                  className="w-full py-2 px-3 bg-surface hover:bg-surface-accent text-accent border border-line text-xs font-bold flex items-center justify-between cursor-pointer transition-all"
                >
                  <span>Configure Settings</span>
                  <ChevronRight className="w-4 h-4 text-accent transition-transform group-hover:translate-x-0.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* SYSTEM DIAGNOSTICS BANNER */}
      <div className="bg-surface-muted border border-line p-4 rounded-none flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <Server className="w-4 h-4 text-accent shrink-0" />
          <div>
            <p className="font-bold text-ink">System Governance & Client-Side State Synchronization</p>
            <p className="text-2xs text-subtle">
              Clinic settings are persistently bound to your local environment and synced real-time via PostgreSQL Supabase listeners.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 text-2xs font-mono">
          <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Sync Active
          </span>
          <span className="text-subtle bg-surface px-2 py-0.5 border border-line">
            UTF-8 Multi-lingual
          </span>
        </div>
      </div>
    </div>
  );
}
