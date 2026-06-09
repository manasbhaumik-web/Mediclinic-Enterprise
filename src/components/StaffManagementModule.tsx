import React, { useState } from 'react';
import { 
  Plus, Search, Trash2, Edit2, Shield, User, X, 
  DollarSign, CheckCircle, Clock, Calendar, AlertCircle 
} from 'lucide-react';
import StaffRegistration from './StaffRegistration';

export interface StaffMember {
  id: string;
  name: string;
  department: string;
  role: string;
  status: 'Active' | 'Inactive' | 'Suspended' | 'On Leave';
  email: string;
  
  // 2. Personal Information
  gender?: 'Male' | 'Female' | 'Other';
  dob?: string;
  icNumber?: string;
  phone?: string;
  altPhone?: string;
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };

  // 3. Professional & Clinical Credentials
  jobTitle?: string;
  licenseNumber?: string;
  licenseExpiry?: string;
  specialization?: string;
  qualifications?: string;

  // 4. Employment & HR Details
  dateJoined?: string;
  dateResigned?: string;
  employmentStatus?: 'Full-Time' | 'Part-Time' | 'Contract' | 'Locum';
  workSchedule?: string;
  supervisorId?: string;

  // 5. Financial & Statutory Details
  salaryBase: number;
  paymentStatus: 'Paid' | 'Pending';
  attendanceRate: number; // percentage 0-100
  leaveBalance: number; // days
  leavesTaken: number; // days
  bankDetails?: {
    bankName: string;
    accountHolder: string;
    accountNumber: string;
  };
  taxId?: string;
  statutoryFundNumber?: string;
}

const INITIAL_STAFF: StaffMember[] = [
  { id: 'S101', name: 'Dr. Sarah Ahmad', department: 'General Practice', role: 'Physician', status: 'Active', email: 'sarah.ahmad@mediclinic.local', salaryBase: 12000, paymentStatus: 'Paid', attendanceRate: 98, leaveBalance: 14, leavesTaken: 2 },
  { id: 'S102', name: 'Nurse Wong', department: 'Triage', role: 'Registered Nurse', status: 'Active', email: 'wong.ly@mediclinic.local', salaryBase: 4500, paymentStatus: 'Pending', attendanceRate: 100, leaveBalance: 20, leavesTaken: 0 },
  { id: 'S103', name: 'Ahmad Faizal', department: 'Administration', role: 'System Admin', status: 'Active', email: 'admin@mediclinic.local', salaryBase: 5000, paymentStatus: 'Pending', attendanceRate: 95, leaveBalance: 12, leavesTaken: 4 },
  { id: 'S104', name: 'Dr. Ramesh Kumar', department: 'Pediatrics', role: 'Physician', status: 'Suspended', email: 'ramesh.k@mediclinic.local', salaryBase: 13500, paymentStatus: 'Paid', attendanceRate: 40, leaveBalance: 0, leavesTaken: 15 }
];

type StaffViewTab = 'directory' | 'payroll' | 'attendance';

export default function StaffManagementModule() {
  const [activeTab, setActiveTab] = useState<StaffViewTab>('directory');
  const [currentView, setCurrentView] = useState<'list' | 'registration'>('list');
  const [staffList, setStaffList] = useState<StaffMember[]>(INITIAL_STAFF);
  const [searchQuery, setSearchQuery] = useState('');

  // Derived State
  const filteredStaff = staffList.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeCount = staffList.filter(s => s.status === 'Active').length;
  
  // Payroll Metrics
  const totalPayroll = staffList.filter(s => s.status === 'Active').reduce((acc, curr) => acc + curr.salaryBase, 0);
  const pendingPayments = staffList.filter(s => s.paymentStatus === 'Pending').length;

  const handleAddStaffSubmit = (newStaff: StaffMember) => {
    setStaffList([...staffList, newStaff]);
    setCurrentView('list');
  };

  const toggleStatus = (id: string) => {
    setStaffList(staffList.map(s => {
      if (s.id === id) {
        return { ...s, status: s.status === 'Active' ? 'Suspended' : 'Active' };
      }
      return s;
    }));
  };

  const deleteStaff = (id: string) => {
    if (confirm('Are you sure you want to permanently delete this staff record?')) {
      setStaffList(staffList.filter(s => s.id !== id));
    }
  };

  // HR Actions
  const processPayroll = (id: string) => {
    setStaffList(staffList.map(s => s.id === id ? { ...s, paymentStatus: 'Paid' } : s));
  };

  const approveLeave = (id: string) => {
    setStaffList(staffList.map(s => {
      if (s.id === id && s.leaveBalance > 0) {
        return { ...s, leaveBalance: s.leaveBalance - 1, leavesTaken: s.leavesTaken + 1 };
      }
      return s;
    }));
  };

  const markAbsent = (id: string) => {
    setStaffList(staffList.map(s => {
      if (s.id === id) {
        // Drop attendance by 2% for mock logic
        return { ...s, attendanceRate: Math.max(0, s.attendanceRate - 2) };
      }
      return s;
    }));
  };

  return (
    <div className="animate-fadeIn max-w-5xl mx-auto space-y-6">
      {/* Module Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Staff & HR Management</h2>
          <p className="text-xs text-slate-500">Manage directory, process payroll, and track attendance.</p>
        </div>
        
        <div className="flex gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input 
              type="text" 
              placeholder="Search personnel..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-[#07B2B2] outline-none w-64" 
            />
          </div>
          {activeTab === 'directory' && (
            <button 
              onClick={() => setCurrentView('registration')}
              className="bg-[#07B2B2] text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-[#058A8A] cursor-pointer shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Staff
            </button>
          )}
        </div>
      </div>

      {/* Render the appropriate view */}
      {currentView === 'registration' ? (
        <StaffRegistration 
          onCancel={() => setCurrentView('list')} 
          onSubmit={handleAddStaffSubmit} 
        />
      ) : (
        <>
          {/* Sub Navigation */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-px">
            <button
              onClick={() => setActiveTab('directory')}
              className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors ${
                activeTab === 'directory' ? 'border-[#07B2B2] text-[#07B2B2]' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Staff Directory ({activeCount})
            </button>
            <button
              onClick={() => setActiveTab('payroll')}
              className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors ${
                activeTab === 'payroll' ? 'border-[#07B2B2] text-[#07B2B2]' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Payroll & Salary
            </button>
            <button
              onClick={() => setActiveTab('attendance')}
              className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors ${
                activeTab === 'attendance' ? 'border-[#07B2B2] text-[#07B2B2]' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Leave & Attendance
            </button>
          </div>

          {/* -------------------- TAB: DIRECTORY -------------------- */}
          {activeTab === 'directory' && (
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden animate-fadeIn">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 font-bold text-xs uppercase border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4">Staff Member</th>
                    <th className="px-6 py-4">Department & Role</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStaff.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-slate-400 font-medium">
                        No staff members found matching your search.
                      </td>
                    </tr>
                  ) : filteredStaff.map((staff) => (
                    <tr key={staff.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-cyan-50 flex items-center justify-center text-[#07B2B2] shrink-0">
                            <User className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-800">{staff.name}</p>
                            <p className="text-[10px] font-mono text-slate-400">{staff.email} • ID: {staff.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-slate-800 font-medium">{staff.department}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <Shield className="w-3 h-3 text-[#07B2B2]" />
                          <span className="text-[10px] font-bold uppercase tracking-wide text-[#07B2B2]">{staff.role}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button 
                          onClick={() => toggleStatus(staff.id)}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider cursor-pointer border transition-colors ${
                            staff.status === 'Active' 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                              : staff.status === 'Inactive' || staff.status === 'Suspended'
                              ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                              : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                          }`}
                        >
                          <div className={`w-1.5 h-1.5 rounded-full ${staff.status === 'Active' ? 'bg-emerald-500' : staff.status === 'On Leave' ? 'bg-amber-500' : 'bg-red-500'}`}></div>
                          {staff.status}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <button className="p-2 text-slate-400 hover:text-[#07B2B2] bg-white hover:bg-cyan-50 rounded-lg border border-transparent hover:border-cyan-100 transition-all cursor-pointer">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => deleteStaff(staff.id)}
                            className="p-2 text-slate-400 hover:text-red-500 bg-white hover:bg-red-50 rounded-lg border border-transparent hover:border-red-100 transition-all cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* -------------------- TAB: PAYROLL -------------------- */}
          {activeTab === 'payroll' && (
            <div className="space-y-4 animate-fadeIn">
              {/* Payroll Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-cyan-50 flex items-center justify-center text-[#07B2B2]">
                    <DollarSign className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase">Est. Monthly Payroll Liability</p>
                    <p className="text-2xl font-black text-slate-800">RM {totalPayroll.toLocaleString()}</p>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase">Pending Dispursals</p>
                    <p className="text-2xl font-black text-slate-800">{pendingPayments} Employees</p>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500 font-bold text-xs uppercase border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4">Employee</th>
                      <th className="px-6 py-4">Base Salary</th>
                      <th className="px-6 py-4">Deductions (EPF/Tax)</th>
                      <th className="px-6 py-4">Net Pay</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredStaff.map((staff) => {
                      const deductions = staff.salaryBase * 0.15; // Mock 15% deduction
                      const netPay = staff.salaryBase - deductions;

                      return (
                        <tr key={staff.id} className="hover:bg-slate-50">
                          <td className="px-6 py-4 font-bold text-slate-800">{staff.name}</td>
                          <td className="px-6 py-4 font-mono text-slate-600">RM {staff.salaryBase.toLocaleString()}</td>
                          <td className="px-6 py-4 font-mono text-red-500">-RM {deductions.toLocaleString()}</td>
                          <td className="px-6 py-4 font-mono font-bold text-[#07B2B2]">RM {netPay.toLocaleString()}</td>
                          <td className="px-6 py-4">
                            {staff.paymentStatus === 'Paid' ? (
                              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                                <CheckCircle className="w-3 h-3" /> Paid
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded">
                                <Clock className="w-3 h-3" /> Pending
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              disabled={staff.paymentStatus === 'Paid'}
                              onClick={() => processPayroll(staff.id)}
                              className={`text-xs font-bold px-3 py-1.5 rounded transition-colors ${
                                staff.paymentStatus === 'Paid' 
                                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                  : 'bg-[#07B2B2] hover:bg-[#058A8A] text-white cursor-pointer shadow-sm'
                              }`}
                            >
                              Process
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* -------------------- TAB: ATTENDANCE -------------------- */}
          {activeTab === 'attendance' && (
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden animate-fadeIn">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 font-bold text-xs uppercase border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4">Employee</th>
                    <th className="px-6 py-4">Attendance Rate</th>
                    <th className="px-6 py-4">Leaves Taken</th>
                    <th className="px-6 py-4">Leave Balance</th>
                    <th className="px-6 py-4 text-right">Admin Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStaff.map((staff) => (
                    <tr key={staff.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-bold text-slate-800">
                        {staff.name}
                        <p className="text-[10px] text-slate-400 font-normal">{staff.role}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-full bg-slate-200 rounded-full h-1.5 max-w-[80px]">
                            <div 
                              className={`h-1.5 rounded-full ${staff.attendanceRate > 90 ? 'bg-[#07B2B2]' : staff.attendanceRate > 75 ? 'bg-amber-400' : 'bg-red-500'}`}
                              style={{ width: `${staff.attendanceRate}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-bold text-slate-600">{staff.attendanceRate}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-600">
                        {staff.leavesTaken} Days
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-bold px-2 py-1 rounded ${staff.leaveBalance > 5 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                          {staff.leaveBalance} Days Left
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => markAbsent(staff.id)}
                            className="text-[10px] font-bold text-red-600 border border-red-200 hover:bg-red-50 px-2 py-1 rounded cursor-pointer transition-colors"
                          >
                            Mark Absent
                          </button>
                          <button 
                            disabled={staff.leaveBalance <= 0}
                            onClick={() => approveLeave(staff.id)}
                            className={`text-[10px] font-bold px-2 py-1 rounded border transition-colors ${
                              staff.leaveBalance <= 0 
                                ? 'text-slate-400 border-slate-200 bg-slate-50 cursor-not-allowed'
                                : 'text-[#07B2B2] border-cyan-200 hover:bg-cyan-50 cursor-pointer'
                            }`}
                          >
                            Approve Leave
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
