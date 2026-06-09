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
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-fadeIn flex flex-col h-[calc(100vh-140px)]">
      {/* Header */}
      <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={onCancel}
            className="p-2 hover:bg-slate-200 rounded-lg text-slate-500 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Pill className="w-5 h-5 text-[#07B2B2]" />
              Add New Drug / Medication
            </h2>
            <p className="text-xs text-slate-500">Enter comprehensive pharmacological, inventory, safety, and pricing data.</p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <button 
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-[#07B2B2] rounded-lg hover:bg-[#058A8A] transition-colors cursor-pointer shadow-sm"
          >
            <Save className="w-4 h-4" />
            Save to Catalog
          </button>
        </div>
      </div>

      <form className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-8" onSubmit={handleSubmit}>
        
        {/* Section 1: Core Drug Identification */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Info className="w-4 h-4 text-[#07B2B2]" />
            <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide">1. Core Drug Identification</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600">Brand / Trade Name <span className="text-red-500">*</span></label>
              <input type="text" name="name" value={formData.name || ''} onChange={handleChange} placeholder="e.g. Panadol" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#07B2B2]" required />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600">Generic / Active Ingredient <span className="text-red-500">*</span></label>
              <input type="text" name="genericName" value={formData.genericName || ''} onChange={handleChange} placeholder="e.g. Paracetamol" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#07B2B2]" required />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600">Drug Class / Category <span className="text-red-500">*</span></label>
              <input type="text" name="category" value={formData.category || ''} onChange={handleChange} placeholder="e.g. Analgesics" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#07B2B2]" required />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600">Manufacturer</label>
              <input type="text" name="manufacturer" value={formData.manufacturer || ''} onChange={handleChange} placeholder="e.g. GSK" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#07B2B2]" />
            </div>
          </div>
        </section>

        {/* Section 2: Strength & Form */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Pill className="w-4 h-4 text-[#07B2B2]" />
            <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide">2. Strength & Form</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600">Strength (Value)</label>
              <input type="text" name="strength" value={formData.strength || ''} onChange={handleChange} placeholder="e.g. 500, 250/50" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#07B2B2] font-mono" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600">Strength Unit</label>
              <select name="strengthUnit" value={formData.strengthUnit || 'mg'} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#07B2B2] bg-white">
                <option value="mg">mg (milligrams)</option>
                <option value="mcg">mcg (micrograms)</option>
                <option value="g">g (grams)</option>
                <option value="ml">ml (milliliters)</option>
                <option value="IU">IU (International Units)</option>
                <option value="%">% (Percentage)</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600">Dosage Form</label>
              <select name="drugType" value={formData.drugType || 'Tablet'} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#07B2B2] bg-white">
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
        <section className="space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Package className="w-4 h-4 text-[#07B2B2]" />
            <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide">3. Inventory & Packaging Controls</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600">Packaging Type</label>
              <input type="text" name="packagingType" value={formData.packagingType || ''} onChange={handleChange} placeholder="e.g. Box of 100s, 60ml Bottle" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#07B2B2]" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600">UOM for Dispensing</label>
              <input type="text" name="uom" value={formData.uom || ''} onChange={handleChange} placeholder="e.g. Tablet, ML, Tube" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#07B2B2]" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600">Initial Stock</label>
              <input type="number" name="currentStock" min="0" value={formData.currentStock} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#07B2B2] font-mono" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600">Reorder Level (Min Stock)</label>
              <input type="number" name="minThreshold" min="0" value={formData.minThreshold} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#07B2B2] font-mono" />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-bold text-slate-600 flex items-center gap-1">
                <Thermometer className="w-3.5 h-3.5" /> Storage Conditions
              </label>
              <input type="text" name="storageConditions" value={formData.storageConditions || ''} onChange={handleChange} placeholder="e.g. Room Temperature (15-25°C), Refrigerate (2-8°C)" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#07B2B2]" />
            </div>
          </div>
        </section>

        {/* Section 4: Clinical & Safety Flags */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[#07B2B2]" />
              <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide">4. Clinical & Safety Flags</h3>
            </div>
            <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded font-bold uppercase border border-red-200">Critical for EMR</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center bg-purple-50 border border-purple-200 rounded-lg px-4 py-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" name="isControlledDrug" checked={formData.isControlledDrug} onChange={handleChange} className="sr-only peer" />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                <div className="ml-3">
                  <span className="text-sm font-bold text-purple-900">Is Controlled / Dangerous Drug</span>
                  <p className="text-[10px] text-purple-700">Requires separate legal logging and authorization.</p>
                </div>
              </label>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600">Pregnancy Category</label>
              <select name="pregnancyCategory" value={formData.pregnancyCategory || 'N/A'} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#07B2B2] bg-white">
                <option value="A">Category A (Safe)</option>
                <option value="B">Category B (Likely Safe)</option>
                <option value="C">Category C (Risk Cannot Be Ruled Out)</option>
                <option value="D">Category D (Positive Evidence of Risk)</option>
                <option value="X">Category X (Contraindicated)</option>
                <option value="N/A">N/A (Not Applicable)</option>
              </select>
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-bold text-slate-600">Contraindications / Interaction Notes</label>
              <textarea name="contraindications" value={formData.contraindications || ''} onChange={handleChange} placeholder="e.g. Do not take with alcohol. Contraindicated in patients with severe hepatic impairment." className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#07B2B2] min-h-[60px]" />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600">Indications (Used For)</label>
              <input type="text" name="indications" value={formData.indications || ''} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#07B2B2]" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600">Side Effects</label>
              <input type="text" name="sideEffects" value={formData.sideEffects || ''} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#07B2B2]" />
            </div>
          </div>
          
          {/* Suggested Dosage */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
            <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-slate-500" /> Standard Prescribing Defaults
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input type="text" name="suggestedDosage.adults" value={formData.suggestedDosage?.adults || ''} onChange={handleChange} placeholder="Adult Dosage (e.g. 1 tab BD)" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#07B2B2]" />
              <input type="text" name="suggestedDosage.children" value={formData.suggestedDosage?.children || ''} onChange={handleChange} placeholder="Child Dosage (e.g. 5ml TDS)" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#07B2B2]" />
            </div>
          </div>
        </section>

        {/* Section 5: Pricing & Billing Details */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <DollarSign className="w-4 h-4 text-[#07B2B2]" />
            <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide">5. Pricing & Billing Details</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600">Cost Price (RM)</label>
              <input type="number" name="costPrice" step="0.01" min="0" value={formData.costPrice} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#07B2B2] font-mono" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600">Selling Price / Retail (RM) <span className="text-red-500">*</span></label>
              <input type="number" name="price" step="0.01" min="0" value={formData.price} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#07B2B2] font-mono font-bold text-[#07B2B2]" required />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600">Tax Code / Rate (%)</label>
              <input type="number" name="taxRate" step="0.1" min="0" value={formData.taxRate} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#07B2B2] font-mono" />
            </div>
          </div>

          <div className="flex items-center bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 w-fit">
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" name="isInsuranceClaimable" checked={formData.isInsuranceClaimable} onChange={handleChange} className="sr-only peer" />
              <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
              <div className="ml-3">
                <span className="text-sm font-bold text-emerald-900">Is Insurance Claimable</span>
              </div>
            </label>
          </div>
        </section>

      </form>
    </div>
  );
}
