import React from 'react';
import { Settings, Percent, Stethoscope, FileText, Smartphone, Printer, ScanLine, LayoutDashboard, Pill, Users, DollarSign, Activity, FileSpreadsheet, CreditCard } from 'lucide-react';
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

  return (
    <div className="animate-fadeIn max-w-4xl mx-auto space-y-8">
      
      {/* Header */}
      <div className="border-b border-slate-200 pb-4">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Settings className="w-6 h-6 text-[#07B2B2]" />
          Global Configuration
        </h2>
        <p className="text-xs text-slate-500 mt-1">Configure billing parameters, tax rates, module enablement, and hardware integrations.</p>
      </div>

      {/* 1. Financial Parameters */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex items-center gap-2">
          <Percent className="w-4 h-4 text-slate-500" />
          <h3 className="font-bold text-sm text-slate-800">Financial Parameters</h3>
        </div>
        <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 uppercase">SST Tax Rate (%)</label>
            <input 
              type="number" 
              value={settings.billing.taxRate}
              onChange={(e) => handleBillingChange('taxRate', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-[#07B2B2] outline-none" 
            />
            <p className="text-[10px] text-slate-400">Applied automatically at checkout.</p>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 uppercase">Base Consultation (RM)</label>
            <input 
              type="number" 
              value={settings.billing.consultationFee}
              onChange={(e) => handleBillingChange('consultationFee', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-[#07B2B2] outline-none" 
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 uppercase">Base Procedure (RM)</label>
            <input 
              type="number" 
              value={settings.billing.procedureFee}
              onChange={(e) => handleBillingChange('procedureFee', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-[#07B2B2] outline-none" 
            />
          </div>
        </div>
      </section>

      {/* 2. Module Enablement */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex items-center gap-2">
          <LayoutDashboard className="w-4 h-4 text-slate-500" />
          <h3 className="font-bold text-sm text-slate-800">Module Enablement</h3>
        </div>
        <div className="p-5">
          <p className="text-xs text-slate-500 mb-4">Toggle which modules are visible and active in the Administration Sidebar.</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 border border-slate-100 rounded-lg hover:bg-slate-50">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-[#07B2B2]" />
                <div>
                  <p className="text-sm font-bold text-slate-800">Staff Management</p>
                  <p className="text-[10px] text-slate-400">Manage doctors, nurses, and rosters.</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={settings.modules.staff} onChange={() => handleModuleToggle('staff')} className="sr-only peer" />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#07B2B2]"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-3 border border-slate-100 rounded-lg hover:bg-slate-50">
              <div className="flex items-center gap-3">
                <Pill className="w-5 h-5 text-[#07B2B2]" />
                <div>
                  <p className="text-sm font-bold text-slate-800">Medicine Management</p>
                  <p className="text-[10px] text-slate-400">Inventory and pharmacy catalog.</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={settings.modules.medicine} onChange={() => handleModuleToggle('medicine')} className="sr-only peer" />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#07B2B2]"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-3 border border-slate-100 rounded-lg hover:bg-slate-50">
              <div className="flex items-center gap-3">
                <Stethoscope className="w-5 h-5 text-[#07B2B2]" />
                <div>
                  <p className="text-sm font-bold text-slate-800">Equipment Management</p>
                  <p className="text-[10px] text-slate-400">Device calibration and disposal logs.</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={settings.modules.equipment} onChange={() => handleModuleToggle('equipment')} className="sr-only peer" />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#07B2B2]"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-3 border border-slate-100 rounded-lg hover:bg-slate-50">
              <div className="flex items-center gap-3">
                <DollarSign className="w-5 h-5 text-[#07B2B2]" />
                <div>
                  <p className="text-sm font-bold text-slate-800">Billing Management</p>
                  <p className="text-[10px] text-slate-400">Reconcile payments and TPA claims.</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={settings.modules.billing} onChange={() => handleModuleToggle('billing')} className="sr-only peer" />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#07B2B2]"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-3 border border-slate-100 rounded-lg hover:bg-slate-50">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="w-5 h-5 text-[#07B2B2]" />
                <div>
                  <p className="text-sm font-bold text-slate-800">Reports Module</p>
                  <p className="text-[10px] text-slate-400">Export analytics and PDF reports.</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={settings.modules.reports} onChange={() => handleModuleToggle('reports')} className="sr-only peer" />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#07B2B2]"></div>
              </label>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Hardware Integrations */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-slate-500" />
          <h3 className="font-bold text-sm text-slate-800">Hardware Integrations</h3>
        </div>
        <div className="p-5">
          <p className="text-xs text-slate-500 mb-4">Enable connections to physical clinic devices. (Mock implementation)</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* MyKad */}
            <div className={`p-4 rounded-xl border transition-colors ${settings.hardware.mykadScanner ? 'border-[#07B2B2] bg-cyan-50/20' : 'border-slate-200 bg-slate-50/50'}`}>
              <div className="flex justify-between items-start mb-2">
                <div className={`p-2 rounded-lg ${settings.hardware.mykadScanner ? 'bg-cyan-100 text-[#07B2B2]' : 'bg-slate-200 text-slate-500'}`}>
                  <CreditCard className="w-5 h-5" />
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={settings.hardware.mykadScanner} onChange={() => handleHardwareToggle('mykadScanner')} className="sr-only peer" />
                  <div className="w-7 h-4 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[#07B2B2]"></div>
                </label>
              </div>
              <h4 className="font-bold text-sm text-slate-800">MyKad Reader</h4>
              <p className="text-[10px] text-slate-500 mt-1">Smart card physical IC reader via USB.</p>
            </div>

            {/* Receipt Printer */}
            <div className={`p-4 rounded-xl border transition-colors ${settings.hardware.receiptPrinter ? 'border-[#07B2B2] bg-cyan-50/20' : 'border-slate-200 bg-slate-50/50'}`}>
              <div className="flex justify-between items-start mb-2">
                <div className={`p-2 rounded-lg ${settings.hardware.receiptPrinter ? 'bg-cyan-100 text-[#07B2B2]' : 'bg-slate-200 text-slate-500'}`}>
                  <Printer className="w-5 h-5" />
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={settings.hardware.receiptPrinter} onChange={() => handleHardwareToggle('receiptPrinter')} className="sr-only peer" />
                  <div className="w-7 h-4 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[#07B2B2]"></div>
                </label>
              </div>
              <h4 className="font-bold text-sm text-slate-800">Thermal Printer</h4>
              <p className="text-[10px] text-slate-500 mt-1">Cashier desk thermal receipt printing.</p>
            </div>

            {/* Barcode Scanner */}
            <div className={`p-4 rounded-xl border transition-colors ${settings.hardware.barcodeScanner ? 'border-[#07B2B2] bg-cyan-50/20' : 'border-slate-200 bg-slate-50/50'}`}>
              <div className="flex justify-between items-start mb-2">
                <div className={`p-2 rounded-lg ${settings.hardware.barcodeScanner ? 'bg-cyan-100 text-[#07B2B2]' : 'bg-slate-200 text-slate-500'}`}>
                  <ScanLine className="w-5 h-5" />
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={settings.hardware.barcodeScanner} onChange={() => handleHardwareToggle('barcodeScanner')} className="sr-only peer" />
                  <div className="w-7 h-4 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[#07B2B2]"></div>
                </label>
              </div>
              <h4 className="font-bold text-sm text-slate-800">Barcode Scanner</h4>
              <p className="text-[10px] text-slate-500 mt-1">Pharmacy inventory scanner.</p>
            </div>

          </div>
        </div>
      </section>

    </div>
  );
}
