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
              <Stethoscope className="w-5 h-5 text-[#07B2B2]" />
              Register New Equipment
            </h2>
            <p className="text-xs text-slate-500">Enter comprehensive asset, financial, operational, and calibration data.</p>
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
            Save Equipment
          </button>
        </div>
      </div>

      <form className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-8" onSubmit={handleSubmit}>
        
        {/* Section 1: Asset Identification & Classification */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Cpu className="w-4 h-4 text-[#07B2B2]" />
            <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide">1. Asset Identification & Classification</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1 lg:col-span-2">
              <label className="text-xs font-bold text-slate-600">Equipment Name <span className="text-red-500">*</span></label>
              <input type="text" name="name" value={formData.name || ''} onChange={handleChange} placeholder="e.g. Digital ECG Machine" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#07B2B2]" required />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600">Category / Type <span className="text-red-500">*</span></label>
              <select name="type" value={formData.type || 'Diagnostic'} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#07B2B2] bg-white">
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
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600">Manufacturer / Brand</label>
              <input type="text" name="manufacturer" value={formData.manufacturer || ''} onChange={handleChange} placeholder="e.g. Philips, GE Healthcare" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#07B2B2]" />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-bold text-slate-600">Model Number</label>
              <input type="text" name="modelNumber" value={formData.modelNumber || ''} onChange={handleChange} placeholder="e.g. CX-5000" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#07B2B2] font-mono" />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-bold text-slate-600">Serial Number <span className="text-red-500">*</span></label>
              <input type="text" name="serialNumber" value={formData.serialNumber || ''} onChange={handleChange} placeholder="Manufacturer Serial Number" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#07B2B2] font-mono text-[#07B2B2] font-bold" required />
            </div>
          </div>
        </section>

        {/* Section 2: Purchase & Financial Details */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <DollarSign className="w-4 h-4 text-[#07B2B2]" />
            <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide">2. Purchase & Financial Details</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600">Purchase Date</label>
              <input type="date" name="purchaseDate" value={formData.purchaseDate || ''} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#07B2B2]" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600">Cost Price (RM)</label>
              <input type="number" name="costPrice" step="0.01" min="0" value={formData.costPrice} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#07B2B2] font-mono" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600">Warranty Expiry Date</label>
              <input type="date" name="warrantyExpiryDate" value={formData.warrantyExpiryDate || ''} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#07B2B2]" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600">Vendor / Supplier Details</label>
              <input type="text" name="vendor" value={formData.vendor || ''} onChange={handleChange} placeholder="Supplier name or contact" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#07B2B2]" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600">Depreciation Rate (%)</label>
              <input type="number" name="depreciationRate" step="0.1" min="0" value={formData.depreciationRate} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#07B2B2] font-mono" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600">Depreciation Method</label>
              <select name="depreciationMethod" value={formData.depreciationMethod || 'Straight-Line'} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#07B2B2] bg-white">
                <option value="Straight-Line">Straight-Line</option>
                <option value="Declining Balance">Declining Balance</option>
                <option value="Sum-of-the-Years-Digits">Sum-of-the-Years-Digits</option>
                <option value="Units of Production">Units of Production</option>
                <option value="None">None</option>
              </select>
            </div>
          </div>
        </section>

        {/* Section 3: Location & Operational Status */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <MapPin className="w-4 h-4 text-[#07B2B2]" />
            <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide">3. Location & Operational Status</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600">Current Status <span className="text-red-500">*</span></label>
              <select name="status" value={formData.status || 'Operational'} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#07B2B2] bg-white font-bold text-slate-700">
                <option value="Operational">Operational</option>
                <option value="Maintenance">Under Maintenance</option>
                <option value="Decommissioned">Decommissioned / Disposed</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600">Assigned Room / Department</label>
              <input type="text" name="assignedRoom" value={formData.assignedRoom || ''} onChange={handleChange} placeholder="e.g. Consultation Room 2, Lab Area" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#07B2B2]" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600">Custodian / Responsible Person</label>
              <input type="text" name="custodian" value={formData.custodian || ''} onChange={handleChange} placeholder="e.g. Staff ID or Name" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#07B2B2]" />
            </div>
          </div>
        </section>

        {/* Section 4: Calibration & Preventive Maintenance */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <Wrench className="w-4 h-4 text-[#07B2B2]" />
              <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide">4. Calibration & Preventive Maintenance</h3>
            </div>
            <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold uppercase border border-amber-200 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Auditable
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600">Last Calibration Date</label>
              <input type="date" name="lastCalibrationDate" value={formData.lastCalibrationDate || ''} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#07B2B2]" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600">Next Calibration / Maintenance Due <span className="text-red-500">*</span></label>
              <input type="date" name="nextMaintenance" value={formData.nextMaintenance || ''} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#07B2B2] font-bold text-amber-700" required />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600">Maintenance Frequency</label>
              <select name="maintenanceFrequency" value={formData.maintenanceFrequency || 'Annually'} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#07B2B2] bg-white">
                <option value="Weekly">Weekly</option>
                <option value="Monthly">Monthly</option>
                <option value="Quarterly">Quarterly</option>
                <option value="Bi-Annually">Bi-Annually</option>
                <option value="Annually">Annually</option>
                <option value="Biennially (Every 2 Years)">Biennially (Every 2 Years)</option>
                <option value="As Needed (PRN)">As Needed (PRN)</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600">Safety Certification Number</label>
              <input type="text" name="safetyCertification" value={formData.safetyCertification || ''} onChange={handleChange} placeholder="e.g. Health Board ID / QA Sticker" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#07B2B2] font-mono" />
            </div>
          </div>
        </section>

      </form>
    </div>
  );
}
