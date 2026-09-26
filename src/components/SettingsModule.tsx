import React from 'react';
import { 
  Settings, Percent, Stethoscope, FileText, Smartphone, Printer, ScanLine, 
  LayoutDashboard, Pill, Users, DollarSign, Activity, FileSpreadsheet, 
  CreditCard, CheckCircle2, ShieldCheck, Sliders, Cpu, Save, RotateCcw, Check
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

export default function SettingsModule() {
  const { settings, updateSettings } = useSettings();

  const handleBillingChange = (field: keyof typeof settings.billing, value: string) => {
    const numValue = parseFloat(value) || 0;
    updateSettings({
      ...settings,
      billing: {
        ...settings.billing,
        [field]: numValue
      }
    });
  };

  const handleModuleToggle = (moduleName: keyof typeof settings.modules) => {
    updateSettings({
      ...settings,
      modules: {
        ...settings.modules,
        [moduleName]: !settings.modules[moduleName]
      }
    });
  };

  const handleHardwareToggle = (hardwareName: keyof typeof settings.hardware) => {
    updateSettings({
      ...settings,
      hardware: {
        ...settings.hardware,
        [hardwareName]: !settings.hardware[hardwareName]
      }
    });
  };

  // Count active modules & hardware
  const activeModulesCount = Object.values(settings.modules).filter(Boolean).length;
  const activeHardwareCount = Object.values(settings.hardware).filter(Boolean).length;

  return (
    <div className="animate-fadeIn max-w-6xl mx-auto space-y-6 pb-8">
      {/* STRUCTURED CLINICAL HEADER BANNER */}
      <div className="bg-[#0a837f] text-white p-5 rounded-none shadow-md border-b border-[#086b68] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="bg-white/10 text-teal-100 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-white/20 uppercase tracking-wide">
              System Governance
            </span>
            <span className="flex items-center gap-1 text-[11px] text-teal-200 bg-teal-900/40 px-2 py-0.5 rounded border border-teal-400/20 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Policy v2.4 Active
            </span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Settings className="w-6 h-6 text-teal-200" />
            Global Configuration
          </h1>
          <p className="text-xs text-teal-100/90 font-medium max-w-2xl leading-relaxed">
            Configure financial parameters, tax rates, module enablement, and physical hardware peripherals across the clinic enterprise.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button className="bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-3 py-2 rounded-md flex items-center gap-1.5 border border-white/20 transition-all">
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Defaults
          </button>
          <button className="bg-[#0d9488] hover:bg-[#0f766e] text-white text-xs font-semibold px-3.5 py-2 rounded-md flex items-center gap-1.5 border border-teal-500/30 transition-all shadow-sm">
            <Save className="w-4 h-4" />
            Save Changes
          </button>
        </div>
      </div>

      {/* TOP 4 SUMMARY METRIC CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#e6f4f1] rounded-none border border-[#99f6e4] p-4 shadow-2xs relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#0d9488]"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Modules</span>
            <div className="p-2 bg-teal-50 rounded-lg text-[#0d9488]">
              <LayoutDashboard className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <h3 className="text-2xl font-black text-[#0f3c4c]">{activeModulesCount} / 5</h3>
            <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full inline-flex items-center gap-1 font-medium">
              <Check className="w-3 h-3" /> Enabled
            </span>
          </div>
        </div>

        <div className="bg-[#e6f4f1] rounded-none border border-[#99f6e4] p-4 shadow-2xs relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#0d9488]"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">SST Tax Rate</span>
            <div className="p-2 bg-teal-50 rounded-lg text-[#0d9488]">
              <Percent className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <h3 className="text-2xl font-black text-[#0f3c4c]">{settings.billing.taxRate}%</h3>
            <span className="text-xs text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full inline-flex items-center gap-1 font-medium border border-teal-200">
              Auto-Checkout
            </span>
          </div>
        </div>

        <div className="bg-[#e6f4f1] rounded-none border border-[#99f6e4] p-4 shadow-2xs relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#0d9488]"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Hardware Devices</span>
            <div className="p-2 bg-teal-50 rounded-lg text-[#0d9488]">
              <Smartphone className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <h3 className="text-2xl font-black text-[#0f3c4c]">{activeHardwareCount} / 3</h3>
            <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full inline-flex items-center gap-1 font-medium">
              Ready
            </span>
          </div>
        </div>

        <div className="bg-[#e6f4f1] rounded-none border border-[#99f6e4] p-4 shadow-2xs relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#0d9488]"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Policy Compliance</span>
            <div className="p-2 bg-teal-50 rounded-lg text-[#0d9488]">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <h3 className="text-2xl font-black text-[#0f3c4c]">Synced</h3>
            <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full inline-flex items-center gap-1 font-medium">
              Enterprise Policy
            </span>
          </div>
        </div>
      </div>

      {/* 1. FINANCIAL PARAMETERS */}
      <section className="bg-[#e6f4f1] rounded-none border border-[#99f6e4] shadow-2xs overflow-hidden">
        <div className="bg-[#f0fdfa] px-5 py-3 border-b border-[#ccfbf1] flex items-center gap-2">
          <Percent className="w-4 h-4 text-[#0d9488]" />
          <h3 className="font-bold text-sm text-[#0f3c4c]">Financial Parameters & Billing Rules</h3>
        </div>
        <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#0f3c4c] uppercase tracking-wider">SST Tax Rate (%)</label>
            <input 
              type="number" 
              value={settings.billing.taxRate}
              onChange={(e) => handleBillingChange('taxRate', e.target.value)}
              className="w-full px-3 py-2 bg-[#f0fdfa] border border-[#ccfbf1] rounded-none text-sm focus:ring-2 focus:ring-[#0d9488] focus:border-[#0d9488] outline-none transition-all font-medium text-[#0f3c4c]" 
            />
            <p className="text-[10px] text-slate-500">Applied automatically during checkout receipt generation.</p>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#0f3c4c] uppercase tracking-wider">Base Consultation (RM)</label>
            <input 
              type="number" 
              value={settings.billing.consultationFee}
              onChange={(e) => handleBillingChange('consultationFee', e.target.value)}
              className="w-full px-3 py-2 bg-[#f0fdfa] border border-[#ccfbf1] rounded-none text-sm focus:ring-2 focus:ring-[#0d9488] focus:border-[#0d9488] outline-none transition-all font-medium text-[#0f3c4c]" 
            />
            <p className="text-[10px] text-slate-500">Default standard outpatient consultation fee.</p>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#0f3c4c] uppercase tracking-wider">Base Procedure (RM)</label>
            <input 
              type="number" 
              value={settings.billing.procedureFee}
              onChange={(e) => handleBillingChange('procedureFee', e.target.value)}
              className="w-full px-3 py-2 bg-[#f0fdfa] border border-[#ccfbf1] rounded-none text-sm focus:ring-2 focus:ring-[#0d9488] focus:border-[#0d9488] outline-none transition-all font-medium text-[#0f3c4c]" 
            />
            <p className="text-[10px] text-slate-500">Default clinic minor surgical / diagnostic procedure fee.</p>
          </div>
        </div>
      </section>

      {/* 2. MODULE ENABLEMENT */}
      <section className="bg-[#e6f4f1] rounded-none border border-[#99f6e4] shadow-2xs overflow-hidden">
        <div className="bg-[#f0fdfa] px-5 py-3 border-b border-[#ccfbf1] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LayoutDashboard className="w-4 h-4 text-[#0d9488]" />
            <h3 className="font-bold text-sm text-[#0f3c4c]">Administration Module Enablement</h3>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            {activeModulesCount} of 5 active
          </span>
        </div>
        <div className="p-5">
          <p className="text-xs text-slate-500 mb-4">Toggle module visibility across the Enterprise Administration Sidebar.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3.5 border border-[#ccfbf1] bg-[#f0fdfa] rounded-none hover:border-[#0d9488] transition-all">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-teal-50 text-[#0d9488] rounded-none border border-[#ccfbf1]">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#0f3c4c]">Staff & HR Management</p>
                  <p className="text-[10px] text-slate-500">Manage doctors, nurses, shifts, and rosters.</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={settings.modules.staff} onChange={() => handleModuleToggle('staff')} className="sr-only peer" />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0d9488]"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-3.5 border border-[#ccfbf1] bg-[#f0fdfa] rounded-none hover:border-[#0d9488] transition-all">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-teal-50 text-[#0d9488] rounded-none border border-[#ccfbf1]">
                  <Pill className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#0f3c4c]">Medicine Inventory</p>
                  <p className="text-[10px] text-slate-500">Stock levels, reorder points, and pharmacy catalog.</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={settings.modules.medicine} onChange={() => handleModuleToggle('medicine')} className="sr-only peer" />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0d9488]"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-3.5 border border-[#ccfbf1] bg-[#f0fdfa] rounded-none hover:border-[#0d9488] transition-all">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-teal-50 text-[#0d9488] rounded-none border border-[#ccfbf1]">
                  <Stethoscope className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#0f3c4c]">Asset & Equipment Management</p>
                  <p className="text-[10px] text-slate-500">Device calibration logs and maintenance cycles.</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={settings.modules.equipment} onChange={() => handleModuleToggle('equipment')} className="sr-only peer" />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0d9488]"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-3.5 border border-[#ccfbf1] bg-[#f0fdfa] rounded-none hover:border-[#0d9488] transition-all">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-teal-50 text-[#0d9488] rounded-none border border-[#ccfbf1]">
                  <DollarSign className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#0f3c4c]">Billing & TPA Claims</p>
                  <p className="text-[10px] text-slate-500">Reconcile patient bills and insurance claims.</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={settings.modules.billing} onChange={() => handleModuleToggle('billing')} className="sr-only peer" />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0d9488]"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-3.5 border border-[#ccfbf1] bg-[#f0fdfa] rounded-none hover:border-[#0d9488] transition-all md:col-span-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-teal-50 text-[#0d9488] rounded-none border border-[#ccfbf1]">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#0f3c4c]">Reports & Executive Analytics</p>
                  <p className="text-[10px] text-slate-500">Generate MOH audit reports, revenue breakdowns, and clinical data exports.</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={settings.modules.reports} onChange={() => handleModuleToggle('reports')} className="sr-only peer" />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0d9488]"></div>
              </label>
            </div>
          </div>
        </div>
      </section>

      {/* 3. HARDWARE PERIPHERAL INTEGRATIONS */}
      <section className="bg-[#e6f4f1] rounded-none border border-[#99f6e4] shadow-2xs overflow-hidden">
        <div className="bg-[#f7fdfd] px-5 py-3 border-b border-teal-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-[#0d9488]" />
            <h3 className="font-bold text-sm text-[#0f3c4c]">Physical Hardware Peripheral Bus</h3>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            {activeHardwareCount} of 3 peripherals active
          </span>
        </div>
        <div className="p-5">
          <p className="text-xs text-slate-500 mb-4">Enable hardware communication drivers for physical workstations.</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* MyKad */}
            <div className={`p-4 rounded-none border transition-all ${settings.hardware.mykadScanner ? 'border-[#0d9488] bg-[#f7fdfd]' : 'border-slate-200 bg-slate-50/50'}`}>
              <div className="flex justify-between items-start mb-3">
                <div className={`p-2.5 rounded-md ${settings.hardware.mykadScanner ? 'bg-[#0d9488] text-white' : 'bg-slate-200 text-slate-500'}`}>
                  <CreditCard className="w-5 h-5" />
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={settings.hardware.mykadScanner} onChange={() => handleHardwareToggle('mykadScanner')} className="sr-only peer" />
                  <div className="w-8 h-4.5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-[#0d9488]"></div>
                </label>
              </div>
              <h4 className="font-bold text-sm text-[#0f3c4c]">MyKad Smartcard Reader</h4>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">Direct USB IC reader interface for instant patient identity population.</p>
              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                <span className="text-slate-400 font-mono">USB / PC/SC Driver</span>
                <span className={settings.hardware.mykadScanner ? 'text-emerald-600 font-bold' : 'text-slate-400'}>
                  {settings.hardware.mykadScanner ? 'Online' : 'Disabled'}
                </span>
              </div>
            </div>

            {/* Thermal Receipt Printer */}
            <div className={`p-4 rounded-none border transition-all ${settings.hardware.receiptPrinter ? 'border-[#0d9488] bg-[#f7fdfd]' : 'border-slate-200 bg-slate-50/50'}`}>
              <div className="flex justify-between items-start mb-3">
                <div className={`p-2.5 rounded-md ${settings.hardware.receiptPrinter ? 'bg-[#0d9488] text-white' : 'bg-slate-200 text-slate-500'}`}>
                  <Printer className="w-5 h-5" />
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={settings.hardware.receiptPrinter} onChange={() => handleHardwareToggle('receiptPrinter')} className="sr-only peer" />
                  <div className="w-8 h-4.5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-[#0d9488]"></div>
                </label>
              </div>
              <h4 className="font-bold text-sm text-[#0f3c4c]">Thermal Receipt Printer</h4>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">Cashier counter thermal receipt auto-spooler and queue slip printing.</p>
              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                <span className="text-slate-400 font-mono">ESC/POS Network</span>
                <span className={settings.hardware.receiptPrinter ? 'text-emerald-600 font-bold' : 'text-slate-400'}>
                  {settings.hardware.receiptPrinter ? 'Online' : 'Disabled'}
                </span>
              </div>
            </div>

            {/* Barcode Scanner */}
            <div className={`p-4 rounded-none border transition-all ${settings.hardware.barcodeScanner ? 'border-[#0d9488] bg-[#f7fdfd]' : 'border-slate-200 bg-slate-50/50'}`}>
              <div className="flex justify-between items-start mb-3">
                <div className={`p-2.5 rounded-md ${settings.hardware.barcodeScanner ? 'bg-[#0d9488] text-white' : 'bg-slate-200 text-slate-500'}`}>
                  <ScanLine className="w-5 h-5" />
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={settings.hardware.barcodeScanner} onChange={() => handleHardwareToggle('barcodeScanner')} className="sr-only peer" />
                  <div className="w-8 h-4.5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-[#0d9488]"></div>
                </label>
              </div>
              <h4 className="font-bold text-sm text-[#0f3c4c]">Pharmacy Barcode Scanner</h4>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">Dispensary 2D barcode scanner for medication serial verification.</p>
              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                <span className="text-slate-400 font-mono">HID Keyboard Wedge</span>
                <span className={settings.hardware.barcodeScanner ? 'text-emerald-600 font-bold' : 'text-slate-400'}>
                  {settings.hardware.barcodeScanner ? 'Online' : 'Disabled'}
                </span>
              </div>
            </div>

          </div>
        </div>
      </section>

    </div>
  );
}
