import React, { useState } from 'react';
import { Percent, DollarSign, Calculator, CheckCircle2, ShieldCheck, HelpCircle } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';

export default function BillingParametersCard() {
  const { settings, updateSettings } = useSettings();
  const [savedToast, setSavedToast] = useState(false);

  const handleBillingChange = (field: keyof typeof settings.billing, value: string) => {
    const numValue = parseFloat(value) || 0;
    updateSettings({
      ...settings,
      billing: {
        ...settings.billing,
        [field]: numValue
      }
    });
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2000);
  };

  // Sample calculation for preview
  const sampleConsult = settings.billing.consultationFee;
  const sampleProc = settings.billing.procedureFee;
  const sampleSubtotal = sampleConsult + sampleProc;
  const sampleTax = (sampleSubtotal * (settings.billing.taxRate / 100));
  const sampleTotal = sampleSubtotal + sampleTax;

  return (
    <section className="bg-surface rounded-none border border-line shadow-2xs overflow-hidden">
      {/* CARD HEADER */}
      <div className="bg-surface-muted px-5 py-3.5 border-b border-line flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-brand/10 text-accent rounded-none border border-brand/20">
            <Percent className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h3 className="type-card-title text-ink">Financial Parameters & Billing Rules</h3>
            <p className="text-2xs text-subtle mt-0.5">
              Configure clinic-wide Sales & Services Tax (SST), baseline consultation tariffs, and default procedure charges.
            </p>
          </div>
        </div>
        <span className="text-2xs font-mono font-bold px-2 py-0.5 bg-teal-50 text-accent border border-teal-200">
          Auto-Checkout Enabled
        </span>
      </div>

      <div className="p-5 space-y-6">
        {/* INPUT FIELDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-ink uppercase tracking-wider flex items-center justify-between">
              <span>SST Tax Rate (%)</span>
              <span className="text-2xs text-accent font-mono font-bold">{settings.billing.taxRate}%</span>
            </label>
            <div className="relative">
              <input 
                type="number" 
                step="0.1"
                min="0"
                max="100"
                value={settings.billing.taxRate}
                onChange={(e) => handleBillingChange('taxRate', e.target.value)}
                className="w-full pl-3 pr-8 py-2 bg-surface-muted border border-line-subtle rounded-none text-sm focus:ring-1 focus:ring-brand outline-none transition-all font-medium text-ink" 
              />
              <span className="absolute right-3 top-2.5 text-xs text-subtle font-bold">%</span>
            </div>
            <p className="text-2xs text-subtle">Statutory Malaysian SST automatically applied at checkout invoices.</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-ink uppercase tracking-wider flex items-center justify-between">
              <span>Base Consultation</span>
              <span className="text-2xs text-accent font-mono font-bold">RM {settings.billing.consultationFee.toFixed(2)}</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs text-subtle font-bold">RM</span>
              <input 
                type="number" 
                step="1"
                min="0"
                value={settings.billing.consultationFee}
                onChange={(e) => handleBillingChange('consultationFee', e.target.value)}
                className="w-full pl-10 pr-3 py-2 bg-surface-muted border border-line-subtle rounded-none text-sm focus:ring-1 focus:ring-brand outline-none transition-all font-medium text-ink" 
              />
            </div>
            <p className="text-2xs text-subtle">Default general practitioner outpatient consultation tariff.</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-ink uppercase tracking-wider flex items-center justify-between">
              <span>Base Procedure Fee</span>
              <span className="text-2xs text-accent font-mono font-bold">RM {settings.billing.procedureFee.toFixed(2)}</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs text-subtle font-bold">RM</span>
              <input 
                type="number" 
                step="1"
                min="0"
                value={settings.billing.procedureFee}
                onChange={(e) => handleBillingChange('procedureFee', e.target.value)}
                className="w-full pl-10 pr-3 py-2 bg-surface-muted border border-line-subtle rounded-none text-sm focus:ring-1 focus:ring-brand outline-none transition-all font-medium text-ink" 
              />
            </div>
            <p className="text-2xs text-subtle">Baseline fee for minor procedures (e.g. wound dressing, nebulizer).</p>
          </div>
        </div>

        {/* LIVE INVOICE SIMULATION PREVIEW */}
        <div className="bg-surface-accent border border-line-subtle p-4 rounded-none">
          <div className="flex items-center justify-between mb-3 border-b border-line pb-2">
            <span className="text-xs font-bold text-ink flex items-center gap-1.5">
              <Calculator className="w-4 h-4 text-accent" />
              Live Bill Formulation Simulation
            </span>
            <span className="text-2xs text-subtle font-mono">Invoice Breakdown</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-2xs text-subtle block">Consultation Tariff</span>
              <span className="font-mono font-bold text-ink">RM {sampleConsult.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-2xs text-subtle block">Standard Procedure</span>
              <span className="font-mono font-bold text-ink">RM {sampleProc.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-2xs text-subtle block">SST ({settings.billing.taxRate}%)</span>
              <span className="font-mono font-bold text-accent">RM {sampleTax.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-2xs text-subtle block font-bold text-accent">Total Patient Payable</span>
              <span className="font-mono font-bold text-base text-ink">RM {sampleTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {savedToast && (
          <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="font-bold">Billing parameters updated across cash desk and checkout engine.</span>
          </div>
        )}
      </div>
    </section>
  );
}
