import React, { useState, useMemo } from 'react';
import { 
  Settings, Percent, Stethoscope, Smartphone, Printer, ScanLine, 
  LayoutDashboard, Pill, Users, DollarSign, Activity, FileSpreadsheet, 
  CreditCard, CheckCircle2, ShieldCheck, Sliders, Cpu, Save, RotateCcw, Check,
  Bot, Building, DoorOpen, Search, ArrowLeft, ChevronRight
} from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import ClinicProfileCard from './ClinicProfileCard';
import RoomsAndServicesCard from './RoomsAndServicesCard';
import AIGatewayCard from './AIGatewayCard';
import BillingParametersCard from './BillingParametersCard';
import ModuleEnablementCard from './ModuleEnablementCard';
import HardwarePeripheralsCard from './HardwarePeripheralsCard';
import SettingsOverviewCard from './SettingsOverviewCard';

export type SettingsCategory = 
  | 'overview' 
  | 'profile' 
  | 'facilities' 
  | 'ai_gateway' 
  | 'billing' 
  | 'modules' 
  | 'hardware';

export default function SettingsModule() {
  const { settings } = useSettings();
  const [activeCategory, setActiveCategory] = useState<SettingsCategory>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [saveBanner, setSaveBanner] = useState(false);

  // Active module & hardware counts
  const activeModulesCount = Object.values(settings.modules).filter(Boolean).length;
  const activeHardwareCount = Object.values(settings.hardware).filter(Boolean).length;
  const aiEnabled = settings.aiConfig?.enabled ?? true;
  const aiProviderName = settings.aiConfig?.provider?.toUpperCase() || 'GEMINI';

  // Category definitions with search keywords
  const categoryList: Array<{
    id: SettingsCategory;
    label: string;
    shortLabel: string;
    icon: React.ComponentType<{ className?: string }>;
    description: string;
    badge: string;
    keywords: string[];
  }> = [
    {
      id: 'overview',
      label: 'System Overview',
      shortLabel: 'Overview',
      icon: Activity,
      description: 'Control hub and diagnostics across all clinic settings domains',
      badge: 'All Domains',
      keywords: ['all', 'overview', 'dashboard', 'summary', 'health', 'system']
    },
    {
      id: 'profile',
      label: 'Clinic Identity & License',
      shortLabel: 'Profile',
      icon: Building,
      description: 'Facility name, branch, MOH licence no., phone, and address',
      badge: 'MOH License',
      keywords: ['clinic', 'profile', 'name', 'branch', 'address', 'phone', 'hotline', 'kkm', 'license', 'expiry', 'moh']
    },
    {
      id: 'facilities',
      label: 'Rooms & Services',
      shortLabel: 'Rooms & Services',
      icon: DoorOpen,
      description: 'Consultation rooms, doctor assignments, and booking services',
      badge: 'Rooms 1–4',
      keywords: ['room', 'rooms', 'services', 'doctor', 'allocation', 'booking', 'specialty', 'department']
    },
    {
      id: 'ai_gateway',
      label: 'AI & Generative LLM Gateway',
      shortLabel: 'AI Gateway',
      icon: Bot,
      description: 'Multi-modal LLM routing, Gemini/OpenAI/Ollama, API keys & temperature',
      badge: aiEnabled ? `${aiProviderName} Active` : 'Disabled',
      keywords: ['ai', 'llm', 'gemini', 'openai', 'claude', 'ollama', 'scribe', 'speech', 'mews', 'triage', 'safety', 'ddi', 'audit', 'model', 'api key']
    },
    {
      id: 'billing',
      label: 'Financial & Billing Rules',
      shortLabel: 'Billing',
      icon: Percent,
      description: 'SST rate %, base consultation fee, and procedure tariffs',
      badge: `${settings.billing.taxRate}% SST`,
      keywords: ['billing', 'tax', 'sst', 'consultation fee', 'procedure fee', 'rate', 'price', 'tariff', 'invoice', 'checkout']
    },
    {
      id: 'modules',
      label: 'Module Governance',
      shortLabel: 'Modules',
      icon: LayoutDashboard,
      description: 'Sidebar module visibility for staff, inventory, equipment, and billing',
      badge: `${activeModulesCount}/5 Active`,
      keywords: ['modules', 'module', 'staff', 'hr', 'medicine', 'inventory', 'equipment', 'assets', 'reports', 'analytics', 'enablement']
    },
    {
      id: 'hardware',
      label: 'Hardware Peripherals',
      shortLabel: 'Hardware',
      icon: Smartphone,
      description: 'MyKad smartcard reader, thermal receipt printer, and barcode scanner',
      badge: `${activeHardwareCount}/3 Online`,
      keywords: ['hardware', 'mykad', 'smartcard', 'reader', 'printer', 'receipt', 'barcode', 'scanner', 'peripherals', 'usb', 'pos']
    }
  ];

  // Filter categories by search
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categoryList;
    const q = searchQuery.toLowerCase().trim();
    return categoryList.filter(c => 
      c.label.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q) ||
      c.keywords.some(k => k.includes(q))
    );
  }, [searchQuery, categoryList]);

  const activeCategoryMeta = categoryList.find(c => c.id === activeCategory) || categoryList[0];
  const ActiveIcon = activeCategoryMeta.icon;

  const handleGlobalSave = () => {
    setSaveBanner(true);
    setTimeout(() => setSaveBanner(false), 2500);
  };

  return (
    <div className="animate-fadeIn w-full space-y-6 pb-8">
      {/* 1. STRUCTURED CLINICAL HEADER BANNER */}
      <div className="bg-surface text-ink p-5 rounded-none shadow-2xs border border-line flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="bg-primary/10 text-accent text-2xs font-bold px-2.5 py-0.5 rounded-none border border-brand/20 uppercase tracking-wider">
              System Governance
            </span>
            <span className="flex items-center justify-center gap-1 text-2xs text-accent bg-teal-50 px-2 py-0.5 rounded-none border border-line font-mono font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Policy v2.4 Active
            </span>
          </div>
          <h1 className="type-page-title text-ink flex items-center gap-2.5">
            <Settings className="w-6 h-6 text-accent" />
            Global Console Configuration
          </h1>
          <p className="text-xs text-muted font-medium max-w-2xl leading-relaxed">
            Manage enterprise parameters across distinct operational categories: identity, clinical facilities, generative AI gateway, financial billing, module governance, and peripheral hardware.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={() => setActiveCategory('overview')}
            className="bg-surface hover:bg-surface-accent text-ink text-xs font-bold px-3 py-2 rounded-none flex items-center justify-center gap-1.5 border border-line transition-all cursor-pointer shadow-none"
          >
            <RotateCcw className="w-3.5 h-3.5 text-accent" />
            Reset View
          </button>
          <button 
            type="button"
            onClick={handleGlobalSave}
            className="bg-primary hover:bg-primary-hover text-white text-xs font-bold px-3.5 py-2 rounded-none flex items-center justify-center gap-1.5 border border-teal-500/30 transition-all shadow-xs cursor-pointer"
          >
            <Save className="w-4 h-4" />
            Save Changes
          </button>
        </div>
      </div>

      {saveBanner && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span className="font-bold">Clinic settings synchronized and saved to local environment!</span>
        </div>
      )}

      {/* 2. TOP 4 SUMMARY METRIC CARDS (CLICKABLE CATEGORY SHORTCUTS) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          type="button"
          onClick={() => setActiveCategory('modules')}
          className="text-left bg-surface rounded-none border border-line p-4 shadow-2xs relative overflow-hidden hover:border-brand cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-subtle uppercase tracking-wider">Active Modules</span>
            <div className="p-2 bg-teal-50 rounded-none text-accent">
              <LayoutDashboard className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <h3 className="type-metric text-ink">{activeModulesCount} / 5</h3>
            <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full inline-flex items-center justify-center gap-1 font-medium">
              <Check className="w-3 h-3" /> Enabled
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveCategory('ai_gateway')}
          className="text-left bg-surface rounded-none border border-line p-4 shadow-2xs relative overflow-hidden hover:border-brand cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-subtle uppercase tracking-wider">AI LLM Gateway</span>
            <div className="p-2 bg-teal-50 rounded-none text-accent">
              <Bot className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <h3 className="type-metric text-ink">{aiProviderName}</h3>
            <span className={`text-xs px-2 py-0.5 rounded-full inline-flex items-center justify-center gap-1 font-medium ${
              aiEnabled ? 'text-emerald-700 bg-emerald-50 border border-emerald-200' : 'text-slate-500 bg-slate-100'
            }`}>
              {aiEnabled ? 'Online' : 'Standby'}
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveCategory('billing')}
          className="text-left bg-surface rounded-none border border-line p-4 shadow-2xs relative overflow-hidden hover:border-brand cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-subtle uppercase tracking-wider">SST Tax Rate</span>
            <div className="p-2 bg-teal-50 rounded-none text-accent">
              <Percent className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <h3 className="type-metric text-ink">{settings.billing.taxRate}%</h3>
            <span className="text-xs text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full inline-flex items-center justify-center gap-1 font-medium border border-teal-200">
              Auto-Checkout
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveCategory('hardware')}
          className="text-left bg-surface rounded-none border border-line p-4 shadow-2xs relative overflow-hidden hover:border-brand cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-subtle uppercase tracking-wider">Hardware Devices</span>
            <div className="p-2 bg-teal-50 rounded-none text-accent">
              <Smartphone className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <h3 className="type-metric text-ink">{activeHardwareCount} / 3</h3>
            <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full inline-flex items-center justify-center gap-1 font-medium">
              Ready
            </span>
          </div>
        </button>
      </div>

      {/* 3. HORIZONTAL QUICK CATEGORY TABS (RESPONSIVE RIBBON) */}
      <div className="bg-surface rounded-none border border-line p-2 shadow-2xs overflow-x-auto custom-scrollbar flex items-center gap-1.5">
        {categoryList.map((c) => {
          const Icon = c.icon;
          const isSelected = activeCategory === c.id;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setActiveCategory(c.id)}
              className={`px-3.5 py-2 text-xs font-bold flex items-center gap-2 whitespace-nowrap cursor-pointer transition-all border ${
                isSelected
                  ? 'bg-primary text-white border-primary shadow-xs'
                  : 'bg-surface hover:bg-surface-accent text-ink border-line-subtle'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-accent'}`} />
              <span>{c.shortLabel}</span>
              <span className={`text-3xs font-mono px-1.5 py-0.2 rounded-none ${
                isSelected ? 'bg-white/20 text-white' : 'bg-surface-accent text-subtle border border-line-subtle'
              }`}>
                {c.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* 4. MAIN CATEGORIZED MASTER-DETAIL LAYOUT */}
      <div className="flex flex-col lg:flex-row items-start gap-6">
        {/* LEFT COLUMN: CATEGORY NAVIGATION RAIL */}
        <aside className="w-full lg:w-72 shrink-0 space-y-4">
          {/* SEARCH BOX */}
          <div className="bg-surface rounded-none border border-line p-3 shadow-2xs space-y-2">
            <label className="text-2xs font-bold text-ink uppercase tracking-wider flex items-center gap-1">
              <Search className="w-3.5 h-3.5 text-accent" />
              Filter Settings
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search parameter, AI, tax, room..."
                className="w-full pl-8 pr-3 py-1.5 bg-surface-muted border border-line-subtle rounded-none text-xs text-ink focus:ring-1 focus:ring-brand outline-none"
              />
              <Search className="w-3.5 h-3.5 text-subtle absolute left-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* CATEGORY LIST ITEMS */}
          <div className="bg-surface rounded-none border border-line shadow-2xs divide-y divide-line-subtle overflow-hidden">
            <div className="bg-surface-muted px-4 py-2.5 border-b border-line flex items-center justify-between">
              <span className="text-2xs font-mono font-bold uppercase text-subtle tracking-wider">
                Configuration Domains
              </span>
              <span className="text-3xs text-accent font-bold">
                {filteredCategories.length} Categories
              </span>
            </div>

            {filteredCategories.map((cat) => {
              const Icon = cat.icon;
              const isSelected = activeCategory === cat.id;

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={`w-full p-3.5 text-left flex items-start gap-3 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-primary/10 border-l-4 border-l-brand'
                      : 'hover:bg-surface-accent border-l-4 border-l-transparent'
                  }`}
                >
                  <div className={`p-2 rounded-none shrink-0 ${
                    isSelected ? 'bg-primary text-white' : 'bg-teal-50 text-accent border border-line-subtle'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <p className={`text-xs font-bold truncate ${isSelected ? 'text-accent' : 'text-ink'}`}>
                        {cat.label}
                      </p>
                      <ChevronRight className={`w-3.5 h-3.5 shrink-0 ${
                        isSelected ? 'text-accent' : 'text-subtle'
                      }`} />
                    </div>
                    <p className="text-2xs text-subtle line-clamp-1 mt-0.5">
                      {cat.description}
                    </p>
                    <span className="inline-block text-3xs font-mono mt-1 text-accent font-medium">
                      {cat.badge}
                    </span>
                  </div>
                </button>
              );
            })}

            {filteredCategories.length === 0 && (
              <div className="p-4 text-center text-xs text-subtle">
                No categories matched "{searchQuery}".
              </div>
            )}
          </div>
        </aside>

        {/* RIGHT COLUMN: ACTIVE CATEGORY WORKSPACE (ONE CATEGORY AT A TIME) */}
        <main className="flex-1 min-w-0 space-y-4">
          {/* CATEGORY WORKSPACE BREADCRUMB & CONTEXT HEADER */}
          <div className="bg-surface rounded-none border border-line p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand/10 text-accent rounded-none border border-brand/20">
                <ActiveIcon className="w-5 h-5 text-accent" />
              </div>
              <div>
                <div className="flex items-center gap-2 text-2xs text-subtle font-mono uppercase">
                  <span>Console Settings</span>
                  <span>/</span>
                  <span className="text-accent font-bold">{activeCategoryMeta.label}</span>
                </div>
                <h2 className="type-card-title text-ink mt-0.5">
                  {activeCategoryMeta.label}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {activeCategory !== 'overview' && (
                <button
                  type="button"
                  onClick={() => setActiveCategory('overview')}
                  className="px-3 py-1.5 bg-surface hover:bg-surface-accent text-accent border border-line text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to Overview
                </button>
              )}
            </div>
          </div>

          {/* DYNAMIC CATEGORY COMPONENT RENDERING */}
          <div className="animate-fadeIn">
            {activeCategory === 'overview' && (
              <SettingsOverviewCard onSelectCategory={(cat) => setActiveCategory(cat)} />
            )}

            {activeCategory === 'profile' && (
              <ClinicProfileCard />
            )}

            {activeCategory === 'facilities' && (
              <RoomsAndServicesCard />
            )}

            {activeCategory === 'ai_gateway' && (
              <AIGatewayCard />
            )}

            {activeCategory === 'billing' && (
              <BillingParametersCard />
            )}

            {activeCategory === 'modules' && (
              <ModuleEnablementCard />
            )}

            {activeCategory === 'hardware' && (
              <HardwarePeripheralsCard />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
