import React, { useState } from 'react';
import { StaffMember } from './StaffManagementModule';
import { 
  User, Shield, Briefcase, FileText, CreditCard, ChevronLeft, Save, 
  MapPin, Phone, AlertCircle 
} from 'lucide-react';

interface StaffRegistrationProps {
  initialData?: StaffMember;
  onCancel: () => void;
  onSubmit: (newStaff: StaffMember) => void;
}

export default function StaffRegistration({ initialData, onCancel, onSubmit }: StaffRegistrationProps) {
  // Form State initialized with defaults
  const [formData, setFormData] = useState<Partial<StaffMember>>(initialData || {
    status: 'Active',
    gender: 'Male',
    employmentStatus: 'Full-Time',
    salaryBase: 4000,
    role: 'Physician',
    department: 'General Practice',
    attendanceRate: 100,
    leaveBalance: 14,
    leavesTaken: 0,
    paymentStatus: 'Pending',
    emergencyContact: { name: '', relationship: '', phone: '' },
    bankDetails: { bankName: '', accountHolder: '', accountNumber: '' }
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const parsedValue = type === 'number' ? (value === '' ? 0 : Number(value)) : value;
    
    // Handle nested fields
    if (name.startsWith('emergencyContact.')) {
      const field = name.split('.')[1];
      setFormData({
        ...formData,
        emergencyContact: { ...formData.emergencyContact!, [field]: parsedValue }
      });
      return;
    }
    
    if (name.startsWith('bankDetails.')) {
      const field = name.split('.')[1];
      setFormData({
        ...formData,
        bankDetails: { ...formData.bankDetails!, [field]: parsedValue }
      });
      return;
    }

    setFormData({ ...formData, [name]: parsedValue });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.name || !formData.email || !formData.icNumber) {
      alert('Please fill out all required fields marked with an asterisk (*).');
      return;
    }

    const newStaff: StaffMember = {
      ...formData as StaffMember,
      id: initialData?.id || `S${Math.floor(Math.random() * 9000) + 1000}`, // Keep ID if editing, else generate
    };

    onSubmit(newStaff);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-fadeIn">
      {/* Header */}
      <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={onCancel}
            className="p-2 hover:bg-slate-200 rounded-lg text-slate-500 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <User className="w-5 h-5 text-[#07B2B2]" />
              Staff Registration
            </h2>
            <p className="text-xs text-slate-500">Enter comprehensive personnel details for HR compliance.</p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <button 
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
            Save Record
          </button>
        </div>
      </div>

      <form className="p-6 overflow-y-auto max-h-[75vh] custom-scrollbar space-y-8" onSubmit={handleSubmit}>
        
        {/* Section 1: Primary & Account Details */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Shield className="w-4 h-4 text-[#07B2B2]" />
            <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide">1. Primary & Account Details</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600">Account Status <span className="text-red-500">*</span></label>
              <select name="status" value={formData.status} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#07B2B2] bg-white">
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Suspended">Suspended</option>
                <option value="On Leave">On Leave</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600">Role / Type <span className="text-red-500">*</span></label>
              <select name="role" value={formData.role} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#07B2B2] bg-white">
                <option value="Physician">Doctor / Physician</option>
                <option value="Registered Nurse">Registered Nurse</option>
                <option value="Administration">Administration</option>
                <option value="Lab Technician">Lab Technician</option>
                <option value="Pharmacist">Pharmacist</option>
                <option value="System Admin">System Admin</option>
              </select>
            </div>
            <div className="space-y-1 lg:col-span-2">
              <label className="text-xs font-bold text-slate-600">Department <span className="text-red-500">*</span></label>
              <input type="text" name="department" value={formData.department || ''} onChange={handleChange} placeholder="e.g. General Medicine, Front Desk" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#07B2B2]" required />
            </div>
          </div>
        </section>

        {/* Section 2: Personal Information */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <User className="w-4 h-4 text-[#07B2B2]" />
            <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide">2. Personal Information</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600">Full Name <span className="text-red-500">*</span></label>
              <input type="text" name="name" value={formData.name || ''} onChange={handleChange} placeholder="First Name, Middle Name, Last Name" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#07B2B2]" required />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600">National ID / Passport Number <span className="text-red-500">*</span></label>
              <input type="text" name="icNumber" value={formData.icNumber || ''} onChange={handleChange} placeholder="e.g. 900101-14-5555" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#07B2B2] font-mono" required />
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600">Gender</label>
              <select name="gender" value={formData.gender} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#07B2B2] bg-white">
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600">Date of Birth</label>
              <input type="date" name="dob" value={formData.dob || ''} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#07B2B2]" />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600">Personal Email <span className="text-red-500">*</span></label>
              <input type="email" name="email" value={formData.email || ''} onChange={handleChange} placeholder="personal@email.com" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#07B2B2]" required />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Mobile Phone</label>
                <input type="text" name="phone" value={formData.phone || ''} onChange={handleChange} placeholder="01X-XXXXXXX" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#07B2B2]" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Alt Phone</label>
                <input type="text" name="altPhone" value={formData.altPhone || ''} onChange={handleChange} placeholder="Optional" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#07B2B2]" />
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
            <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 text-amber-500" /> Emergency Contact
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input type="text" name="emergencyContact.name" value={formData.emergencyContact?.name || ''} onChange={handleChange} placeholder="Contact Name" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#07B2B2]" />
              <input type="text" name="emergencyContact.relationship" value={formData.emergencyContact?.relationship || ''} onChange={handleChange} placeholder="Relationship" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#07B2B2]" />
              <input type="text" name="emergencyContact.phone" value={formData.emergencyContact?.phone || ''} onChange={handleChange} placeholder="Phone Number" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#07B2B2]" />
            </div>
          </div>
        </section>

        {/* Section 3: Professional & Clinical Credentials */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#07B2B2]" />
              <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide">3. Clinical Credentials</h3>
            </div>
            <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded font-bold uppercase">Critical for Compliance</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600">Specific Job Title</label>
              <input type="text" name="jobTitle" value={formData.jobTitle || ''} onChange={handleChange} placeholder="e.g. Senior Resident Pediatrician" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#07B2B2]" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600">Specialization</label>
              <input type="text" name="specialization" value={formData.specialization || ''} onChange={handleChange} placeholder="e.g. Cardiology, Dermatology" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#07B2B2]" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600">Medical License / APC Number</label>
              <input type="text" name="licenseNumber" value={formData.licenseNumber || ''} onChange={handleChange} placeholder="MMC/NSR/LJM Number" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#07B2B2]" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600">License Expiry Date</label>
              <input type="date" name="licenseExpiry" value={formData.licenseExpiry || ''} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#07B2B2]" />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-bold text-slate-600">Qualifications / Degrees</label>
              <input type="text" name="qualifications" value={formData.qualifications || ''} onChange={handleChange} placeholder="e.g. MBBS, B.Sc. Nursing" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#07B2B2]" />
            </div>
          </div>
        </section>

        {/* Section 4: Employment & HR Details */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Briefcase className="w-4 h-4 text-[#07B2B2]" />
            <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide">4. Employment & HR Details</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600">Date of Joining</label>
              <input type="date" name="dateJoined" value={formData.dateJoined || ''} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#07B2B2]" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600">Employment Status</label>
              <select name="employmentStatus" value={formData.employmentStatus} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#07B2B2] bg-white">
                <option value="Full-Time">Full-Time</option>
                <option value="Part-Time">Part-Time</option>
                <option value="Contract">Contract</option>
                <option value="Locum">Locum (On-Call)</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600">Date of Resignation (If applicable)</label>
              <input type="date" name="dateResigned" value={formData.dateResigned || ''} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#07B2B2]" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600">Work Schedule / Shift Profile</label>
              <input type="text" name="workSchedule" value={formData.workSchedule || ''} onChange={handleChange} placeholder="e.g. 40 hours/week, Night Shifts" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#07B2B2]" />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-bold text-slate-600">Supervisor / Reporting Manager</label>
              <input type="text" name="supervisorId" value={formData.supervisorId || ''} onChange={handleChange} placeholder="Link to another Staff ID" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#07B2B2]" />
            </div>
          </div>
        </section>

        {/* Section 5: Financial & Statutory Details */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <CreditCard className="w-4 h-4 text-[#07B2B2]" />
            <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide">5. Financial & Statutory Details</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600">Base Salary (Monthly) <span className="text-red-500">*</span></label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400 text-sm font-bold">RM</span>
                <input type="number" name="salaryBase" value={formData.salaryBase || 0} onChange={handleChange} className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#07B2B2] font-mono" required />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600">Income Tax ID</label>
              <input type="text" name="taxId" value={formData.taxId || ''} onChange={handleChange} placeholder="Tax reference number" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#07B2B2] font-mono" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600">Statutory Fund Numbers</label>
              <input type="text" name="statutoryFundNumber" value={formData.statutoryFundNumber || ''} onChange={handleChange} placeholder="e.g. EPF/SOCSO, CPF" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#07B2B2] font-mono" />
            </div>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
            <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1">
              Bank Account Details (For Payroll)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input type="text" name="bankDetails.bankName" value={formData.bankDetails?.bankName || ''} onChange={handleChange} placeholder="Bank Name (e.g. Maybank)" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#07B2B2]" />
              <input type="text" name="bankDetails.accountHolder" value={formData.bankDetails?.accountHolder || ''} onChange={handleChange} placeholder="Account Holder Name" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#07B2B2]" />
              <input type="text" name="bankDetails.accountNumber" value={formData.bankDetails?.accountNumber || ''} onChange={handleChange} placeholder="Account Number" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#07B2B2] font-mono" />
            </div>
          </div>
        </section>

      </form>
    </div>
  );
}
