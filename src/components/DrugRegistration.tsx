import React, { useState } from 'react';
import { DrugItem } from '../context/InventoryContext';
import { 
  Package, Pill, Box, AlertTriangle, DollarSign, ChevronLeft, Save, 
  Info, Thermometer, ShieldAlert, FileText 
} from 'lucide-react';

interface DrugRegistrationProps {
  onCancel: () => void;
  onSubmit: (newDrug: Omit<DrugItem, 'id'>) => void;
}

export default function DrugRegistration({ onCancel, onSubmit }: DrugRegistrationProps) {
  const [formData, setFormData] = useState<Partial<DrugItem>>({
    name: '',
    brandName: '',
    genericName: '',
    category: 'Antibiotics',
    manufacturer: '',
    strength: '',
    strengthUnit: 'mg',
    drugType: 'Tablet',
    packagingType: '',
    uom: 'Tablet',
    currentStock: 0,
    minThreshold: 50,
    storageConditions: '',
    isControlledDrug: false,
    contraindications: '',
    pregnancyCategory: 'N/A',
    indications: '',
    sideEffects: '',
    suggestedDosage: { adults: '', children: '' },
    costPrice: 0.00,
    price: 0.00,
    taxRate: 0,
    isInsuranceClaimable: true,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const target = e.target as HTMLInputElement;
    const { name, value, type, checked } = target;
    
    if (name.startsWith('suggestedDosage.')) {
      const field = name.split('.')[1];
      setFormData({
        ...formData,
        suggestedDosage: { ...formData.suggestedDosage!, [field]: value }
      });
      return;
    }
    
    if (type === 'checkbox') {
      setFormData({ ...formData, [name]: checked });
    } else if (type === 'number') {
      setFormData({ ...formData, [name]: parseFloat(value) || 0 });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.category) {
      alert('Please fill out all required fields marked with an asterisk (*).');
      return;
    }

    onSubmit(formData as Omit<DrugItem, 'id'>);
  };

  return (
    <div className="bg-white rounded-none shadow-md border border-line overflow-hidden animate-fadeIn flex flex-col max-h-[calc(100vh-140px)]">
      {/* Header Banner */}
      <div className="bg-surface-accent border-b border-line px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center justify-center gap-3">
          <button 
            type="button"
            onClick={onCancel}
            className="p-2 bg-white/80 border border-line text-deep hover:bg-chrome hover:text-white rounded-none transition-all cursor-pointer"
            title="Go Back"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="type-section-title text-ink flex items-center justify-center gap-2.5">
              <Pill className="w-6 h-6 text-accent" />
              Add New Medication / Drug Registration
            </h2>
            <p className="text-xs text-accent font-semibold mt-0.5">Enter comprehensive pharmacological, inventory, safety, and pricing data.</p>
          </div>
        </div>
        
        <div className="flex items-center justify-center gap-3">
          <button 
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-700 bg-white border border-slate-300 rounded-none hover:bg-slate-100 transition-all cursor-pointer shadow-2xs"
          >
            Cancel
          </button>
          <button 
            type="button"
            onClick={handleSubmit}
            className="flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white bg-chrome hover:bg-primary-hover rounded-none transition-all cursor-pointer shadow-md"
          >
            <Save className="w-4 h-4" />
            Save to Catalog
          </button>
        </div>
      </div>

      <form className="p-6 md:p-8 overflow-y-auto custom-scrollbar flex-1 space-y-6 bg-slate-50/50" onSubmit={handleSubmit}>
        
        {/* Section 1: Core Drug Identification */}
        <section className="bg-white border border-line shadow-xs rounded-none overflow-hidden">
          <div className="bg-surface-accent px-5 py-3.5 border-b border-line flex items-center justify-between">
            <div className="flex items-center justify-center gap-2.5">
              <Info className="w-4 h-4 text-accent" />
              <h3 className="type-label text-ink">1. Core Drug Identification</h3>
            </div>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <div>
              <label className="block text-2xs font-bold uppercase tracking-wider text-ink mb-1.5">Brand / Trade Name <span className="text-red-500 font-bold">*</span></label>
              <input type="text" name="name" value={formData.name || ''} onChange={handleChange} placeholder="e.g. Panadol Extra" className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-300 rounded-none text-xs text-slate-900 font-semibold focus:bg-white focus:border-brand focus:ring-1 focus:ring-brand transition-all shadow-2xs placeholder:text-slate-400 placeholder:font-normal" required />
            </div>
            <div>
              <label className="block text-2xs font-bold uppercase tracking-wider text-ink mb-1.5">Generic / Active Ingredient <span className="text-red-500 font-bold">*</span></label>
              <input type="text" name="genericName" value={formData.genericName || ''} onChange={handleChange} placeholder="e.g. Paracetamol + Caffeine" className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-300 rounded-none text-xs text-slate-900 font-semibold focus:bg-white focus:border-brand focus:ring-1 focus:ring-brand transition-all shadow-2xs placeholder:text-slate-400 placeholder:font-normal" required />
            </div>
            <div>
              <label className="block text-2xs font-bold uppercase tracking-wider text-ink mb-1.5">Drug Class / Category <span className="text-red-500 font-bold">*</span></label>
              <input type="text" name="category" value={formData.category || ''} onChange={handleChange} placeholder="e.g. Analgesics" className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-300 rounded-none text-xs text-slate-900 font-semibold focus:bg-white focus:border-brand focus:ring-1 focus:ring-brand transition-all shadow-2xs placeholder:text-slate-400 placeholder:font-normal" required />
            </div>
            <div>
              <label className="block text-2xs font-bold uppercase tracking-wider text-ink mb-1.5">Manufacturer / Supplier</label>
              <input type="text" name="manufacturer" value={formData.manufacturer || ''} onChange={handleChange} placeholder="e.g. GSK, Duopharma" className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-300 rounded-none text-xs text-slate-900 font-semibold focus:bg-white focus:border-brand focus:ring-1 focus:ring-brand transition-all shadow-2xs placeholder:text-slate-400 placeholder:font-normal" />
            </div>
          </div>
        </section>

        {/* Section 2: Strength & Form */}
        <section className="bg-white border border-line shadow-xs rounded-none overflow-hidden">
          <div className="bg-surface-accent px-5 py-3.5 border-b border-line flex items-center justify-between">
            <div className="flex items-center justify-center gap-2.5">
              <Pill className="w-4 h-4 text-accent" />
              <h3 className="type-label text-ink">2. Strength & Dosage Specifications</h3>
            </div>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-2xs font-bold uppercase tracking-wider text-ink mb-1.5">Strength (Value)</label>
              <input type="text" name="strength" value={formData.strength || ''} onChange={handleChange} placeholder="e.g. 500, 250/50" className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-300 rounded-none text-xs text-slate-900 font-mono font-bold focus:bg-white focus:border-brand focus:ring-1 focus:ring-brand transition-all shadow-2xs placeholder:text-slate-400 placeholder:font-normal" />
            </div>
            <div>
              <label className="block text-2xs font-bold uppercase tracking-wider text-ink mb-1.5">Strength Unit</label>
              <select name="strengthUnit" value={formData.strengthUnit || 'mg'} onChange={handleChange} className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-300 rounded-none text-xs text-slate-900 font-semibold focus:bg-white focus:border-brand focus:ring-1 focus:ring-brand transition-all shadow-2xs">
                <option value="mg">mg (milligrams)</option>
                <option value="mcg">mcg (micrograms)</option>
                <option value="g">g (grams)</option>
                <option value="ml">ml (milliliters)</option>
                <option value="IU">IU (International Units)</option>
                <option value="%">% (Percentage)</option>
              </select>
            </div>
            <div>
              <label className="block text-2xs font-bold uppercase tracking-wider text-ink mb-1.5">Dosage Form</label>
              <select name="drugType" value={formData.drugType || 'Tablet'} onChange={handleChange} className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-300 rounded-none text-xs text-slate-900 font-semibold focus:bg-white focus:border-brand focus:ring-1 focus:ring-brand transition-all shadow-2xs">
                <option>Tablet</option>
                <option>Capsule</option>
                <option>Syrup</option>
                <option>Injection / Vial</option>
                <option>Inhaler</option>
                <option>Topical Cream / Ointment</option>
                <option>Drops (Eye/Ear)</option>
                <option>Suppository</option>
                <option>Other</option>
              </select>
            </div>
          </div>
        </section>

        {/* Section 3: Inventory & Packaging Controls */}
        <section className="bg-white border border-line shadow-xs rounded-none overflow-hidden">
          <div className="bg-surface-accent px-5 py-3.5 border-b border-line flex items-center justify-between">
            <div className="flex items-center justify-center gap-2.5">
              <Package className="w-4 h-4 text-accent" />
              <h3 className="type-label text-ink">3. Inventory & Stock Controls</h3>
            </div>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <div>
              <label className="block text-2xs font-bold uppercase tracking-wider text-ink mb-1.5">Packaging Type</label>
              <input type="text" name="packagingType" value={formData.packagingType || ''} onChange={handleChange} placeholder="e.g. Box of 100s, 60ml Bottle" className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-300 rounded-none text-xs text-slate-900 font-semibold focus:bg-white focus:border-brand focus:ring-1 focus:ring-brand transition-all shadow-2xs placeholder:text-slate-400 placeholder:font-normal" />
            </div>
            <div>
              <label className="block text-2xs font-bold uppercase tracking-wider text-ink mb-1.5">Dispensing UOM</label>
              <input type="text" name="uom" value={formData.uom || ''} onChange={handleChange} placeholder="e.g. Tablet, ML, Tube" className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-300 rounded-none text-xs text-slate-900 font-semibold focus:bg-white focus:border-brand focus:ring-1 focus:ring-brand transition-all shadow-2xs placeholder:text-slate-400 placeholder:font-normal" />
            </div>
            <div>
              <label className="block text-2xs font-bold uppercase tracking-wider text-ink mb-1.5">Initial Stock Level</label>
              <input type="number" name="currentStock" min="0" value={formData.currentStock} onChange={handleChange} className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-300 rounded-none text-xs text-slate-900 font-mono font-bold focus:bg-white focus:border-brand focus:ring-1 focus:ring-brand transition-all shadow-2xs" />
            </div>
            <div>
              <label className="block text-2xs font-bold uppercase tracking-wider text-ink mb-1.5">Minimum Safety Threshold</label>
              <input type="number" name="minThreshold" min="0" value={formData.minThreshold} onChange={handleChange} className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-300 rounded-none text-xs text-slate-900 font-mono font-bold focus:bg-white focus:border-brand focus:ring-1 focus:ring-brand transition-all shadow-2xs" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-2xs font-bold uppercase tracking-wider text-ink mb-1.5 flex items-center justify-center gap-1.5">
                <Thermometer className="w-3.5 h-3.5 text-accent" /> Storage Conditions & Temperature
              </label>
              <input type="text" name="storageConditions" value={formData.storageConditions || ''} onChange={handleChange} placeholder="e.g. Room Temp (15-25°C), Cold Chain Refrigerated (2-8°C)" className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-300 rounded-none text-xs text-slate-900 font-semibold focus:bg-white focus:border-brand focus:ring-1 focus:ring-brand transition-all shadow-2xs placeholder:text-slate-400 placeholder:font-normal" />
            </div>
          </div>
        </section>

        {/* Section 4: Clinical & Safety Flags */}
        <section className="bg-white border border-line shadow-xs rounded-none overflow-hidden">
          <div className="bg-surface-accent px-5 py-3.5 border-b border-line flex items-center justify-between">
            <div className="flex items-center justify-center gap-2.5">
              <ShieldAlert className="w-4 h-4 text-accent" />
              <h3 className="type-label text-ink">4. Clinical & Safety Flags</h3>
            </div>
            <span className="text-2xs font-bold uppercase tracking-wider bg-red-600 text-white px-2.5 py-1 rounded-none">Critical for EMR Alerts</span>
          </div>
          
          <div className="p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="flex items-center justify-center bg-purple-50 border border-purple-200 rounded-none px-4 py-3">
                <label className="relative inline-flex items-center justify-center cursor-pointer">
                  <input type="checkbox" name="isControlledDrug" checked={formData.isControlledDrug} onChange={handleChange} className="sr-only peer" />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-none peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-none after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  <div className="ml-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-purple-950">Controlled / Dangerous Drug</span>
                    <p className="text-2xs text-purple-700 font-semibold">Requires poison register logging & specialist sign-off.</p>
                  </div>
                </label>
              </div>

              <div>
                <label className="block text-2xs font-bold uppercase tracking-wider text-ink mb-1.5">Pregnancy Category</label>
                <select name="pregnancyCategory" value={formData.pregnancyCategory || 'N/A'} onChange={handleChange} className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-300 rounded-none text-xs text-slate-900 font-semibold focus:bg-white focus:border-brand focus:ring-1 focus:ring-brand transition-all shadow-2xs">
                  <option value="A">Category A (Controlled studies show no risk)</option>
                  <option value="B">Category B (No evidence of human risk)</option>
                  <option value="C">Category C (Risk cannot be ruled out)</option>
                  <option value="D">Category D (Positive evidence of risk)</option>
                  <option value="X">Category X (Contraindicated in pregnancy)</option>
                  <option value="N/A">N/A (Not Applicable)</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-2xs font-bold uppercase tracking-wider text-ink mb-1.5">Contraindications & Drug Interactions</label>
                <textarea name="contraindications" value={formData.contraindications || ''} onChange={handleChange} placeholder="e.g. Do not co-administer with MAO inhibitors. Contraindicated in severe renal failure." className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-300 rounded-none text-xs text-slate-900 font-semibold focus:bg-white focus:border-brand focus:ring-1 focus:ring-brand transition-all shadow-2xs min-h-[60px]" />
              </div>

              <div>
                <label className="block text-2xs font-bold uppercase tracking-wider text-ink mb-1.5">Approved Indications</label>
                <input type="text" name="indications" value={formData.indications || ''} onChange={handleChange} placeholder="e.g. Acute pain, pyrexia, mild inflammation" className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-300 rounded-none text-xs text-slate-900 font-semibold focus:bg-white focus:border-brand focus:ring-1 focus:ring-brand transition-all shadow-2xs" />
              </div>
              <div>
                <label className="block text-2xs font-bold uppercase tracking-wider text-ink mb-1.5">Common Side Effects</label>
                <input type="text" name="sideEffects" value={formData.sideEffects || ''} onChange={handleChange} placeholder="e.g. Nausea, dizziness, drowsiness" className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-300 rounded-none text-xs text-slate-900 font-semibold focus:bg-white focus:border-brand focus:ring-1 focus:ring-brand transition-all shadow-2xs" />
              </div>
            </div>
            
            {/* Prescribing Defaults */}
            <div className="p-4 bg-surface-accent/40 border border-line rounded-none space-y-3">
              <h4 className="type-label text-ink flex items-center justify-center gap-1.5">
                <FileText className="w-4 h-4 text-accent" /> Standard EMR Prescribing Defaults
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input type="text" name="suggestedDosage.adults" value={formData.suggestedDosage?.adults || ''} onChange={handleChange} placeholder="Adult Dosage (e.g. 1 tab BD after meals)" className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-none text-xs text-slate-900 font-semibold focus:border-brand focus:ring-1 focus:ring-brand transition-all shadow-2xs" />
                <input type="text" name="suggestedDosage.children" value={formData.suggestedDosage?.children || ''} onChange={handleChange} placeholder="Pediatric Dosage (e.g. 5ml TDS PC)" className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-none text-xs text-slate-900 font-semibold focus:border-brand focus:ring-1 focus:ring-brand transition-all shadow-2xs" />
              </div>
            </div>
          </div>
        </section>

        {/* Section 5: Pricing & Tariff Details */}
        <section className="bg-white border border-line shadow-xs rounded-none overflow-hidden">
          <div className="bg-surface-accent px-5 py-3.5 border-b border-line flex items-center justify-between">
            <div className="flex items-center justify-center gap-2.5">
              <DollarSign className="w-4 h-4 text-accent" />
              <h3 className="type-label text-ink">5. Financial & Tariff Pricing</h3>
            </div>
          </div>
          
          <div className="p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-2xs font-bold uppercase tracking-wider text-ink mb-1.5">Acquisition Cost Price (MYR)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-accent text-xs font-bold">RM</span>
                  <input type="number" name="costPrice" step="0.01" min="0" value={formData.costPrice} onChange={handleChange} className="w-full pl-11 pr-3.5 py-2.5 bg-slate-50/50 border border-slate-300 rounded-none text-xs text-slate-900 font-mono font-bold focus:bg-white focus:border-brand focus:ring-1 focus:ring-brand transition-all shadow-2xs" />
                </div>
              </div>
              <div>
                <label className="block text-2xs font-bold uppercase tracking-wider text-ink mb-1.5">Retail Selling Price (MYR) <span className="text-red-500 font-bold">*</span></label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-accent text-xs font-bold">RM</span>
                  <input type="number" name="price" step="0.01" min="0" value={formData.price} onChange={handleChange} className="w-full pl-11 pr-3.5 py-2.5 bg-slate-50/50 border border-slate-300 rounded-none text-xs text-accent font-mono font-bold text-sm focus:bg-white focus:border-brand focus:ring-1 focus:ring-brand transition-all shadow-2xs" required />
                </div>
              </div>
              <div>
                <label className="block text-2xs font-bold uppercase tracking-wider text-ink mb-1.5">SST / Tax Code (%)</label>
                <input type="number" name="taxRate" step="0.1" min="0" value={formData.taxRate} onChange={handleChange} className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-300 rounded-none text-xs text-slate-900 font-mono font-bold focus:bg-white focus:border-brand focus:ring-1 focus:ring-brand transition-all shadow-2xs" />
              </div>
            </div>

            <div className="flex items-center justify-center bg-emerald-50 border border-emerald-200 rounded-none px-4 py-3 w-fit">
              <label className="relative inline-flex items-center justify-center cursor-pointer">
                <input type="checkbox" name="isInsuranceClaimable" checked={formData.isInsuranceClaimable} onChange={handleChange} className="sr-only peer" />
                <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-none peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-none after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                <div className="ml-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-950">Panel Insurance Claimable Item</span>
                </div>
              </label>
            </div>
          </div>
        </section>

      </form>
    </div>
  );
}
