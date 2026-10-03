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
              <User className="w-6 h-6 text-accent" />
              Staff Personnel Registration
            </h2>
            <p className="text-xs text-accent font-semibold mt-0.5">Enter comprehensive personnel details for HR, clinical privileges, and statutory compliance.</p>
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
            Save Staff Record
          </button>
        </div>
      </div>

      <form className="p-6 md:p-8 overflow-y-auto custom-scrollbar flex-1 space-y-6 bg-slate-50/50" onSubmit={handleSubmit}>
        
        {/* Section 1: Primary & Account Details */}
        <section className="bg-white border border-line shadow-xs rounded-none overflow-hidden">
          <div className="bg-surface-accent px-5 py-3.5 border-b border-line flex items-center justify-between">
            <div className="flex items-center justify-center gap-2.5">
              <Shield className="w-4 h-4 text-accent" />
              <h3 className="type-label text-ink">1. Primary & Account Details</h3>
            </div>
            <span className="text-2xs font-bold uppercase tracking-wider bg-chrome text-white px-2.5 py-1 rounded-none">Required System Attributes</span>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <div>
              <label className="block text-2xs font-bold uppercase tracking-wider text-ink mb-1.5">Account Status <span className="text-red-500 font-bold">*</span></label>
              <select name="status" value={formData.status} onChange={handleChange} className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-300 rounded-none text-xs text-slate-900 font-semibold focus:bg-white focus:border-brand focus:ring-1 focus:ring-brand transition-all shadow-2xs">
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Suspended">Suspended</option>
                <option value="On Leave">On Leave</option>
              </select>
            </div>
            <div>
              <label className="block text-2xs font-bold uppercase tracking-wider text-ink mb-1.5">Role / Type <span className="text-red-500 font-bold">*</span></label>
              <select name="role" value={formData.role} onChange={handleChange} className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-300 rounded-none text-xs text-slate-900 font-semibold focus:bg-white focus:border-brand focus:ring-1 focus:ring-brand transition-all shadow-2xs">
                <option value="Physician">Doctor / Physician</option>
                <option value="Registered Nurse">Registered Nurse</option>
                <option value="Administration">Administration</option>
                <option value="Lab Technician">Lab Technician</option>
                <option value="Pharmacist">Pharmacist</option>
                <option value="System Admin">System Admin</option>
              </select>
            </div>
            <div className="lg:col-span-2">
              <label className="block text-2xs font-bold uppercase tracking-wider text-ink mb-1.5">Department <span className="text-red-500 font-bold">*</span></label>
              <input type="text" name="department" value={formData.department || ''} onChange={handleChange} placeholder="e.g. General Medicine, Emergency, Pharmacy" className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-300 rounded-none text-xs text-slate-900 font-semibold focus:bg-white focus:border-brand focus:ring-1 focus:ring-brand transition-all shadow-2xs placeholder:text-slate-400 placeholder:font-normal" required />
            </div>
          </div>
        </section>

        {/* Section 2: Personal Information */}
        <section className="bg-white border border-line shadow-xs rounded-none overflow-hidden">
          <div className="bg-surface-accent px-5 py-3.5 border-b border-line flex items-center justify-between">
            <div className="flex items-center justify-center gap-2.5">
              <User className="w-4 h-4 text-accent" />
              <h3 className="type-label text-ink">2. Personal Information</h3>
            </div>
          </div>
          
          <div className="p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-2xs font-bold uppercase tracking-wider text-ink mb-1.5">Full Name <span className="text-red-500 font-bold">*</span></label>
                <input type="text" name="name" value={formData.name || ''} onChange={handleChange} placeholder="Full Name as per NRIC / Passport" className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-300 rounded-none text-xs text-slate-900 font-semibold focus:bg-white focus:border-brand focus:ring-1 focus:ring-brand transition-all shadow-2xs placeholder:text-slate-400 placeholder:font-normal" required />
              </div>
              <div>
                <label className="block text-2xs font-bold uppercase tracking-wider text-ink mb-1.5">National ID / Passport Number <span className="text-red-500 font-bold">*</span></label>
                <input type="text" name="icNumber" value={formData.icNumber || ''} onChange={handleChange} placeholder="e.g. 900101-14-5555" className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-300 rounded-none text-xs text-slate-900 font-mono font-bold focus:bg-white focus:border-brand focus:ring-1 focus:ring-brand transition-all shadow-2xs placeholder:text-slate-400 placeholder:font-normal" required />
              </div>
              
              <div>
                <label className="block text-2xs font-bold uppercase tracking-wider text-ink mb-1.5">Gender</label>
                <select name="gender" value={formData.gender} onChange={handleChange} className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-300 rounded-none text-xs text-slate-900 font-semibold focus:bg-white focus:border-brand focus:ring-1 focus:ring-brand transition-all shadow-2xs">
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-2xs font-bold uppercase tracking-wider text-ink mb-1.5">Date of Birth</label>
                <input type="date" name="dob" value={formData.dob || ''} onChange={handleChange} className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-300 rounded-none text-xs text-slate-900 font-semibold focus:bg-white focus:border-brand focus:ring-1 focus:ring-brand transition-all shadow-2xs" />
              </div>

              <div>
                <label className="block text-2xs font-bold uppercase tracking-wider text-ink mb-1.5">Personal Email <span className="text-red-500 font-bold">*</span></label>
                <input type="email" name="email" value={formData.email || ''} onChange={handleChange} placeholder="staff.name@mediclinic.my" className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-300 rounded-none text-xs text-slate-900 font-semibold focus:bg-white focus:border-brand focus:ring-1 focus:ring-brand transition-all shadow-2xs placeholder:text-slate-400 placeholder:font-normal" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-2xs font-bold uppercase tracking-wider text-ink mb-1.5">Mobile Phone</label>
                  <input type="text" name="phone" value={formData.phone || ''} onChange={handleChange} placeholder="01X-XXXXXXX" className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-300 rounded-none text-xs text-slate-900 font-semibold focus:bg-white focus:border-brand focus:ring-1 focus:ring-brand transition-all shadow-2xs placeholder:text-slate-400 placeholder:font-normal" />
                </div>
                <div>
                  <label className="block text-2xs font-bold uppercase tracking-wider text-ink mb-1.5">Alt Phone</label>
                  <input type="text" name="altPhone" value={formData.altPhone || ''} onChange={handleChange} placeholder="Optional" className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-300 rounded-none text-xs text-slate-900 font-semibold focus:bg-white focus:border-brand focus:ring-1 focus:ring-brand transition-all shadow-2xs placeholder:text-slate-400 placeholder:font-normal" />
                </div>
              </div>
            </div>

            <div className="p-4 bg-surface-accent/40 border border-line rounded-none space-y-3">
              <h4 className="type-label text-ink flex items-center justify-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-600" /> Emergency Contact Details
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input type="text" name="emergencyContact.name" value={formData.emergencyContact?.name || ''} onChange={handleChange} placeholder="Emergency Contact Name" className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-none text-xs text-slate-900 font-semibold focus:border-brand focus:ring-1 focus:ring-brand transition-all shadow-2xs" />
                <input type="text" name="emergencyContact.relationship" value={formData.emergencyContact?.relationship || ''} onChange={handleChange} placeholder="Relationship (e.g. Spouse, Parent)" className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-none text-xs text-slate-900 font-semibold focus:border-brand focus:ring-1 focus:ring-brand transition-all shadow-2xs" />
                <input type="text" name="emergencyContact.phone" value={formData.emergencyContact?.phone || ''} onChange={handleChange} placeholder="Emergency Contact Phone" className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-none text-xs text-slate-900 font-semibold focus:border-brand focus:ring-1 focus:ring-brand transition-all shadow-2xs" />
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Professional & Clinical Credentials */}
        <section className="bg-white border border-line shadow-xs rounded-none overflow-hidden">
          <div className="bg-surface-accent px-5 py-3.5 border-b border-line flex items-center justify-between">
            <div className="flex items-center justify-center gap-2.5">
              <FileText className="w-4 h-4 text-accent" />
              <h3 className="type-label text-ink">3. Clinical & Medical Credentials</h3>
            </div>
            <span className="text-2xs font-bold uppercase tracking-wider bg-amber-500 text-white px-2.5 py-1 rounded-none">KKM / MMC Compliance</span>
          </div>
          
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-2xs font-bold uppercase tracking-wider text-ink mb-1.5">Specific Job Title</label>
              <input type="text" name="jobTitle" value={formData.jobTitle || ''} onChange={handleChange} placeholder="e.g. Senior Resident Medical Officer" className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-300 rounded-none text-xs text-slate-900 font-semibold focus:bg-white focus:border-brand focus:ring-1 focus:ring-brand transition-all shadow-2xs placeholder:text-slate-400 placeholder:font-normal" />
            </div>
            <div>
              <label className="block text-2xs font-bold uppercase tracking-wider text-ink mb-1.5">Specialization</label>
              <input type="text" name="specialization" value={formData.specialization || ''} onChange={handleChange} placeholder="e.g. Family Medicine, Pediatrics, Internal Medicine" className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-300 rounded-none text-xs text-slate-900 font-semibold focus:bg-white focus:border-brand focus:ring-1 focus:ring-brand transition-all shadow-2xs placeholder:text-slate-400 placeholder:font-normal" />
            </div>
            <div>
              <label className="block text-2xs font-bold uppercase tracking-wider text-ink mb-1.5">Medical License / Annual Practising Certificate (APC)</label>
              <input type="text" name="licenseNumber" value={formData.licenseNumber || ''} onChange={handleChange} placeholder="MMC / NSR / LJM Registration Number" className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-300 rounded-none text-xs text-slate-900 font-mono font-bold focus:bg-white focus:border-brand focus:ring-1 focus:ring-brand transition-all shadow-2xs placeholder:text-slate-400 placeholder:font-normal" />
            </div>
            <div>
              <label className="block text-2xs font-bold uppercase tracking-wider text-ink mb-1.5">APC License Expiry Date</label>
              <input type="date" name="licenseExpiry" value={formData.licenseExpiry || ''} onChange={handleChange} className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-300 rounded-none text-xs text-slate-900 font-semibold focus:bg-white focus:border-brand focus:ring-1 focus:ring-brand transition-all shadow-2xs" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-2xs font-bold uppercase tracking-wider text-ink mb-1.5">Academic Qualifications / Degrees</label>
              <input type="text" name="qualifications" value={formData.qualifications || ''} onChange={handleChange} placeholder="e.g. MBBS (Malaya), M.Med (Family Medicine), B.Sc Nursing" className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-300 rounded-none text-xs text-slate-900 font-semibold focus:bg-white focus:border-brand focus:ring-1 focus:ring-brand transition-all shadow-2xs placeholder:text-slate-400 placeholder:font-normal" />
            </div>
          </div>
        </section>

        {/* Section 4: Employment & HR Details */}
        <section className="bg-white border border-line shadow-xs rounded-none overflow-hidden">
          <div className="bg-surface-accent px-5 py-3.5 border-b border-line flex items-center justify-between">
            <div className="flex items-center justify-center gap-2.5">
              <Briefcase className="w-4 h-4 text-accent" />
              <h3 className="type-label text-ink">4. Employment & HR Specifications</h3>
            </div>
          </div>
          
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-2xs font-bold uppercase tracking-wider text-ink mb-1.5">Date of Joining</label>
              <input type="date" name="dateJoined" value={formData.dateJoined || ''} onChange={handleChange} className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-300 rounded-none text-xs text-slate-900 font-semibold focus:bg-white focus:border-brand focus:ring-1 focus:ring-brand transition-all shadow-2xs" />
            </div>
            <div>
              <label className="block text-2xs font-bold uppercase tracking-wider text-ink mb-1.5">Employment Status</label>
              <select name="employmentStatus" value={formData.employmentStatus} onChange={handleChange} className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-300 rounded-none text-xs text-slate-900 font-semibold focus:bg-white focus:border-brand focus:ring-1 focus:ring-brand transition-all shadow-2xs">
                <option value="Full-Time">Full-Time Permanent</option>
                <option value="Part-Time">Part-Time</option>
                <option value="Contract">Fixed Term Contract</option>
                <option value="Locum">Locum (On-Call Specialist)</option>
              </select>
            </div>
            <div>
              <label className="block text-2xs font-bold uppercase tracking-wider text-ink mb-1.5">Resignation / Termination Date</label>
              <input type="date" name="dateResigned" value={formData.dateResigned || ''} onChange={handleChange} className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-300 rounded-none text-xs text-slate-900 font-semibold focus:bg-white focus:border-brand focus:ring-1 focus:ring-brand transition-all shadow-2xs" />
            </div>
            <div>
              <label className="block text-2xs font-bold uppercase tracking-wider text-ink mb-1.5">Work Schedule / Shift Roster</label>
              <input type="text" name="workSchedule" value={formData.workSchedule || ''} onChange={handleChange} placeholder="e.g. Standard 40 hrs/wk, Rotating Roster A" className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-300 rounded-none text-xs text-slate-900 font-semibold focus:bg-white focus:border-brand focus:ring-1 focus:ring-brand transition-all shadow-2xs placeholder:text-slate-400 placeholder:font-normal" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-2xs font-bold uppercase tracking-wider text-ink mb-1.5">Reporting Supervisor / Head of Department</label>
              <input type="text" name="supervisorId" value={formData.supervisorId || ''} onChange={handleChange} placeholder="Supervisor Name or Staff Identifier" className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-300 rounded-none text-xs text-slate-900 font-semibold focus:bg-white focus:border-brand focus:ring-1 focus:ring-brand transition-all shadow-2xs placeholder:text-slate-400 placeholder:font-normal" />
            </div>
          </div>
        </section>

        {/* Section 5: Financial & Statutory Details */}
        <section className="bg-white border border-line shadow-xs rounded-none overflow-hidden">
          <div className="bg-surface-accent px-5 py-3.5 border-b border-line flex items-center justify-between">
            <div className="flex items-center justify-center gap-2.5">
              <CreditCard className="w-4 h-4 text-accent" />
              <h3 className="type-label text-ink">5. Financial & Statutory Remuneration</h3>
            </div>
          </div>
          
          <div className="p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-2xs font-bold uppercase tracking-wider text-ink mb-1.5">Base Monthly Salary (MYR) <span className="text-red-500 font-bold">*</span></label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-accent text-xs font-bold">RM</span>
                  <input type="number" name="salaryBase" value={formData.salaryBase || 0} onChange={handleChange} className="w-full pl-11 pr-3.5 py-2.5 bg-slate-50/50 border border-slate-300 rounded-none text-xs text-slate-900 font-mono font-bold focus:bg-white focus:border-brand focus:ring-1 focus:ring-brand transition-all shadow-2xs" required />
                </div>
              </div>
              <div>
                <label className="block text-2xs font-bold uppercase tracking-wider text-ink mb-1.5">Income Tax Ref Number (LHDN)</label>
                <input type="text" name="taxId" value={formData.taxId || ''} onChange={handleChange} placeholder="e.g. SG 1234567809" className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-300 rounded-none text-xs text-slate-900 font-mono font-bold focus:bg-white focus:border-brand focus:ring-1 focus:ring-brand transition-all shadow-2xs placeholder:text-slate-400 placeholder:font-normal" />
              </div>
              <div>
                <label className="block text-2xs font-bold uppercase tracking-wider text-ink mb-1.5">Statutory Provident Fund (EPF / KWSP / SOCSO)</label>
                <input type="text" name="statutoryFundNumber" value={formData.statutoryFundNumber || ''} onChange={handleChange} placeholder="e.g. EPF: 12345678 / SOCSO: 900101145555" className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-300 rounded-none text-xs text-slate-900 font-mono font-bold focus:bg-white focus:border-brand focus:ring-1 focus:ring-brand transition-all shadow-2xs placeholder:text-slate-400 placeholder:font-normal" />
              </div>
            </div>

            <div className="p-4 bg-surface-accent/40 border border-line rounded-none space-y-3">
              <h4 className="type-label text-ink">
                Direct Salary Disbursement Bank Account
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input type="text" name="bankDetails.bankName" value={formData.bankDetails?.bankName || ''} onChange={handleChange} placeholder="Bank Name (e.g. Maybank, CIMB, Public Bank)" className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-none text-xs text-slate-900 font-semibold focus:border-brand focus:ring-1 focus:ring-brand transition-all shadow-2xs" />
                <input type="text" name="bankDetails.accountHolder" value={formData.bankDetails?.accountHolder || ''} onChange={handleChange} placeholder="Account Holder Name" className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-none text-xs text-slate-900 font-semibold focus:border-brand focus:ring-1 focus:ring-brand transition-all shadow-2xs" />
                <input type="text" name="bankDetails.accountNumber" value={formData.bankDetails?.accountNumber || ''} onChange={handleChange} placeholder="Bank Account Number" className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-none text-xs text-slate-900 font-mono font-bold focus:border-brand focus:ring-1 focus:ring-brand transition-all shadow-2xs" />
              </div>
            </div>
          </div>
        </section>

      </form>
    </div>
  );
}
