import React, { useState } from 'react';
import { EquipmentItem } from './EquipmentManagementModule';
import { 
  Stethoscope, Cpu, DollarSign, MapPin, Wrench, ChevronLeft, Save, 
  ShieldCheck, FileText, CheckCircle 
} from 'lucide-react';

interface EquipmentRegistrationProps {
  onCancel: () => void;
  onSubmit: (newEq: Omit<EquipmentItem, 'id'>) => void;
}

export default function EquipmentRegistration({ onCancel, onSubmit }: EquipmentRegistrationProps) {
  const [formData, setFormData] = useState<Partial<EquipmentItem>>({
    name: '',
    type: 'Diagnostic',
    modelNumber: '',
    serialNumber: '',
    manufacturer: '',
    purchaseDate: '',
    costPrice: 0.00,
    warrantyExpiryDate: '',
    vendor: '',
    depreciationRate: 0,
    depreciationMethod: 'Straight-Line',
    status: 'Operational',
    assignedRoom: '',
    custodian: '',
    lastCalibrationDate: '',
    nextMaintenance: '',
    maintenanceFrequency: 'Annually',
    safetyCertification: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const target = e.target as HTMLInputElement;
    const { name, value, type, checked } = target;
    
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
    
    if (!formData.name || !formData.serialNumber || !formData.nextMaintenance) {
      alert('Please fill out all required fields marked with an asterisk (*).');
      return;
    }

    onSubmit(formData as Omit<EquipmentItem, 'id'>);
  };

  return (
    <div className="bg-white rounded-none shadow-md border border-line overflow-hidden animate-fadeIn flex flex-col max-h-[calc(100vh-140px)]">
      {/* Header Banner */}
      <div className="bg-surface-accent border-b border-line px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={onCancel}
            className="p-2 bg-white/80 border border-line text-deep hover:bg-chrome hover:text-white rounded-none transition-all cursor-pointer"
            title="Go Back"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="type-section-title text-ink flex items-center gap-2.5">
              <Stethoscope className="w-6 h-6 text-accent" />
              Register New Equipment Asset
            </h2>
            <p className="text-xs text-accent font-semibold mt-0.5">Enter comprehensive asset, financial, operational, and calibration data.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
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
            className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white bg-chrome hover:bg-primary-hover rounded-none transition-all cursor-pointer shadow-md"
          >
            <Save className="w-4 h-4" />
            Save Equipment
          </button>
        </div>
      </div>

      <form className="p-6 md:p-8 overflow-y-auto custom-scrollbar flex-1 space-y-6 bg-slate-50/50" onSubmit={handleSubmit}>
        
        {/* Section 1: Asset Identification & Classification */}
        <section className="bg-white border border-line shadow-xs rounded-none overflow-hidden">
          <div className="bg-surface-accent px-5 py-3.5 border-b border-line flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Cpu className="w-4 h-4 text-accent" />
              <h3 className="type-label text-ink">1. Asset Identification & Specification</h3>
            </div>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="lg:col-span-2">
              <label className="block text-2xs font-bold uppercase tracking-wider text-ink mb-1.5">Equipment Name <span className="text-red-500 font-bold">*</span></label>
              <input type="text" name="name" value={formData.name || ''} onChange={handleChange} placeholder="e.g. Digital 12-Lead ECG Machine" className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-300 rounded-none text-xs text-slate-900 font-semibold focus:bg-white focus:border-brand focus:ring-1 focus:ring-brand transition-all shadow-2xs placeholder:text-slate-400 placeholder:font-normal" required />
            </div>
            <div>
              <label className="block text-2xs font-bold uppercase tracking-wider text-ink mb-1.5">Category / Type <span className="text-red-500 font-bold">*</span></label>
              <select name="type" value={formData.type || 'Diagnostic'} onChange={handleChange} className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-300 rounded-none text-xs text-slate-900 font-semibold focus:bg-white focus:border-brand focus:ring-1 focus:ring-brand transition-all shadow-2xs">
                <option>Diagnostic</option>
                <option>Imaging</option>
                <option>Surgical</option>
                <option>Laboratory</option>
                <option>Sanitization</option>
                <option>Furniture</option>
                <option>IT/Office</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className="block text-2xs font-bold uppercase tracking-wider text-ink mb-1.5">Manufacturer / Brand</label>
              <input type="text" name="manufacturer" value={formData.manufacturer || ''} onChange={handleChange} placeholder="e.g. Philips Medical, GE" className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-300 rounded-none text-xs text-slate-900 font-semibold focus:bg-white focus:border-brand focus:ring-1 focus:ring-brand transition-all shadow-2xs placeholder:text-slate-400 placeholder:font-normal" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-2xs font-bold uppercase tracking-wider text-ink mb-1.5">Model Number</label>
              <input type="text" name="modelNumber" value={formData.modelNumber || ''} onChange={handleChange} placeholder="e.g. CX-5000 Series" className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-300 rounded-none text-xs text-slate-900 font-mono font-bold focus:bg-white focus:border-brand focus:ring-1 focus:ring-brand transition-all shadow-2xs placeholder:text-slate-400 placeholder:font-normal" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-2xs font-bold uppercase tracking-wider text-ink mb-1.5">Serial Number / Asset Barcode <span className="text-red-500 font-bold">*</span></label>
              <input type="text" name="serialNumber" value={formData.serialNumber || ''} onChange={handleChange} placeholder="Manufacturer Serial Number" className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-300 rounded-none text-xs text-accent font-mono font-bold focus:bg-white focus:border-brand focus:ring-1 focus:ring-brand transition-all shadow-2xs placeholder:text-slate-400 placeholder:font-normal" required />
            </div>
          </div>
        </section>

        {/* Section 2: Purchase & Financial Details */}
        <section className="bg-white border border-line shadow-xs rounded-none overflow-hidden">
          <div className="bg-surface-accent px-5 py-3.5 border-b border-line flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <DollarSign className="w-4 h-4 text-accent" />
              <h3 className="type-label text-ink">2. Acquisition & Financial Valuation</h3>
            </div>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <div>
              <label className="block text-2xs font-bold uppercase tracking-wider text-ink mb-1.5">Purchase Date</label>
              <input type="date" name="purchaseDate" value={formData.purchaseDate || ''} onChange={handleChange} className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-300 rounded-none text-xs text-slate-900 font-semibold focus:bg-white focus:border-brand focus:ring-1 focus:ring-brand transition-all shadow-2xs" />
            </div>
            <div>
              <label className="block text-2xs font-bold uppercase tracking-wider text-ink mb-1.5">Capital Purchase Cost (MYR)</label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-accent text-xs font-bold">RM</span>
                <input type="number" name="costPrice" step="0.01" min="0" value={formData.costPrice} onChange={handleChange} className="w-full pl-11 pr-3.5 py-2.5 bg-slate-50/50 border border-slate-300 rounded-none text-xs text-slate-900 font-mono font-bold focus:bg-white focus:border-brand focus:ring-1 focus:ring-brand transition-all shadow-2xs" />
              </div>
            </div>
            <div>
              <label className="block text-2xs font-bold uppercase tracking-wider text-ink mb-1.5">Warranty Expiry Date</label>
              <input type="date" name="warrantyExpiryDate" value={formData.warrantyExpiryDate || ''} onChange={handleChange} className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-300 rounded-none text-xs text-slate-900 font-semibold focus:bg-white focus:border-brand focus:ring-1 focus:ring-brand transition-all shadow-2xs" />
            </div>
            <div>
              <label className="block text-2xs font-bold uppercase tracking-wider text-ink mb-1.5">Vendor / Vendor Contact</label>
              <input type="text" name="vendor" value={formData.vendor || ''} onChange={handleChange} placeholder="Vendor name or contact details" className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-300 rounded-none text-xs text-slate-900 font-semibold focus:bg-white focus:border-brand focus:ring-1 focus:ring-brand transition-all shadow-2xs placeholder:text-slate-400 placeholder:font-normal" />
            </div>
            <div>
              <label className="block text-2xs font-bold uppercase tracking-wider text-ink mb-1.5">Depreciation Rate (%)</label>
              <input type="number" name="depreciationRate" step="0.1" min="0" value={formData.depreciationRate} onChange={handleChange} className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-300 rounded-none text-xs text-slate-900 font-mono font-bold focus:bg-white focus:border-brand focus:ring-1 focus:ring-brand transition-all shadow-2xs" />
            </div>
            <div>
              <label className="block text-2xs font-bold uppercase tracking-wider text-ink mb-1.5">Depreciation Method</label>
              <select name="depreciationMethod" value={formData.depreciationMethod || 'Straight-Line'} onChange={handleChange} className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-300 rounded-none text-xs text-slate-900 font-semibold focus:bg-white focus:border-brand focus:ring-1 focus:ring-brand transition-all shadow-2xs">
                <option value="Straight-Line">Straight-Line Method</option>
                <option value="Declining Balance">Declining Balance</option>
                <option value="Sum-of-the-Years-Digits">Sum-of-the-Years-Digits</option>
                <option value="Units of Production">Units of Production</option>
                <option value="None">None</option>
              </select>
            </div>
          </div>
        </section>

        {/* Section 3: Location & Operational Status */}
        <section className="bg-white border border-line shadow-xs rounded-none overflow-hidden">
          <div className="bg-surface-accent px-5 py-3.5 border-b border-line flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <MapPin className="w-4 h-4 text-accent" />
              <h3 className="type-label text-ink">3. Location & Custody Tracking</h3>
            </div>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-2xs font-bold uppercase tracking-wider text-ink mb-1.5">Operational Status <span className="text-red-500 font-bold">*</span></label>
              <select name="status" value={formData.status || 'Operational'} onChange={handleChange} className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-300 rounded-none text-xs text-slate-900 font-bold focus:bg-white focus:border-brand focus:ring-1 focus:ring-brand transition-all shadow-2xs">
                <option value="Operational">Operational</option>
                <option value="Maintenance">Under Maintenance</option>
                <option value="Decommissioned">Decommissioned / Disposed</option>
              </select>
            </div>
            <div>
              <label className="block text-2xs font-bold uppercase tracking-wider text-ink mb-1.5">Assigned Room / Location</label>
              <input type="text" name="assignedRoom" value={formData.assignedRoom || ''} onChange={handleChange} placeholder="e.g. Consultation Room 2, Triage Bay" className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-300 rounded-none text-xs text-slate-900 font-semibold focus:bg-white focus:border-brand focus:ring-1 focus:ring-brand transition-all shadow-2xs placeholder:text-slate-400 placeholder:font-normal" />
            </div>
            <div>
              <label className="block text-2xs font-bold uppercase tracking-wider text-ink mb-1.5">Asset Custodian / Supervisor</label>
              <input type="text" name="custodian" value={formData.custodian || ''} onChange={handleChange} placeholder="e.g. Chief Medical Officer, Nurse Supervisor" className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-300 rounded-none text-xs text-slate-900 font-semibold focus:bg-white focus:border-brand focus:ring-1 focus:ring-brand transition-all shadow-2xs placeholder:text-slate-400 placeholder:font-normal" />
            </div>
          </div>
        </section>

        {/* Section 4: Calibration & Preventive Maintenance */}
        <section className="bg-white border border-line shadow-xs rounded-none overflow-hidden">
          <div className="bg-surface-accent px-5 py-3.5 border-b border-line flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Wrench className="w-4 h-4 text-accent" />
              <h3 className="type-label text-ink">4. Calibration & Preventive Maintenance</h3>
            </div>
            <span className="text-2xs font-bold uppercase tracking-wider bg-chrome text-white px-2.5 py-1 rounded-none flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> KKM Compliance Auditable
            </span>
          </div>
          
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-2xs font-bold uppercase tracking-wider text-ink mb-1.5">Last Calibration Date</label>
              <input type="date" name="lastCalibrationDate" value={formData.lastCalibrationDate || ''} onChange={handleChange} className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-300 rounded-none text-xs text-slate-900 font-semibold focus:bg-white focus:border-brand focus:ring-1 focus:ring-brand transition-all shadow-2xs" />
            </div>
            <div>
              <label className="block text-2xs font-bold uppercase tracking-wider text-ink mb-1.5">Next Maintenance / Calibration Due <span className="text-red-500 font-bold">*</span></label>
              <input type="date" name="nextMaintenance" value={formData.nextMaintenance || ''} onChange={handleChange} className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-300 rounded-none text-xs text-accent font-bold focus:bg-white focus:border-brand focus:ring-1 focus:ring-brand transition-all shadow-2xs" required />
            </div>
            <div>
              <label className="block text-2xs font-bold uppercase tracking-wider text-ink mb-1.5">Maintenance Interval</label>
              <select name="maintenanceFrequency" value={formData.maintenanceFrequency || 'Annually'} onChange={handleChange} className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-300 rounded-none text-xs text-slate-900 font-semibold focus:bg-white focus:border-brand focus:ring-1 focus:ring-brand transition-all shadow-2xs">
                <option value="Weekly">Weekly</option>
                <option value="Monthly">Monthly</option>
                <option value="Quarterly">Quarterly</option>
                <option value="Bi-Annually">Bi-Annually</option>
                <option value="Annually">Annually</option>
                <option value="Biennially (Every 2 Years)">Biennially (Every 2 Years)</option>
                <option value="As Needed (PRN)">As Needed (PRN)</option>
              </select>
            </div>
            <div>
              <label className="block text-2xs font-bold uppercase tracking-wider text-ink mb-1.5">Safety Certificate / Sticker ID</label>
              <input type="text" name="safetyCertification" value={formData.safetyCertification || ''} onChange={handleChange} placeholder="e.g. MOH-SAFETY-2026-904" className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-300 rounded-none text-xs text-slate-900 font-mono font-bold focus:bg-white focus:border-brand focus:ring-1 focus:ring-brand transition-all shadow-2xs placeholder:text-slate-400 placeholder:font-normal" />
            </div>
          </div>
        </section>

      </form>
    </div>
  );
}
