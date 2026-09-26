import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Trash2, Edit2, Shield, User, X, 
  DollarSign, CheckCircle, Clock, Calendar, AlertCircle,
  FileSpreadsheet, Upload, UserPlus, Filter, RefreshCw, CheckCircle2, ArrowRight, Activity
} from 'lucide-react';
import StaffRegistration from './StaffRegistration';
import { supabase } from '../lib/supabase';

export interface StaffMember {
  id: string;
  name: string;
  department: string;
  role: string;
  status: 'Active' | 'Inactive' | 'Suspended' | 'On Leave';
  email: string;
  
  gender?: 'Male' | 'Female' | 'Other';
  dob?: string;
  icNumber?: string;
  phone?: string;
  
  salaryBase: number;
  paymentStatus: 'Paid' | 'Pending';
  attendanceRate: number; 
  leaveBalance: number; 
  leavesTaken: number; 
}

type StaffViewTab = 'directory' | 'payroll' | 'attendance';

export default function StaffManagementModule() {
  const [activeTab, setActiveTab] = useState<StaffViewTab>('directory');
  const [currentView, setCurrentView] = useState<'list' | 'registration'>('list');
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fetchStaff = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from('staff').select('*').order('name');
    if (data && !error) {
      setStaffList(data.map(s => ({
        id: s.id,
        name: s.name,
        department: s.department,
        role: s.role,
        status: s.status as any,
        email: s.email,
        gender: s.gender,
        dob: s.dob,
        icNumber: s.ic_number,
        phone: s.phone,
        salaryBase: Number(s.salary_base),
        paymentStatus: s.payment_status as any,
        attendanceRate: s.attendance_rate,
        leaveBalance: s.leave_balance,
        leavesTaken: s.leaves_taken
      })));
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchStaff();
    
    const channel = supabase.channel('staff_sync_' + Math.random().toString(36).substring(2, 9))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'staff' }, fetchStaff)
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredStaff = staffList.filter(s => {
    const matchesSearch = 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDept = departmentFilter === 'All' || s.department.toLowerCase() === departmentFilter.toLowerCase();
    const matchesStatus = statusFilter === 'All' || s.status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesDept && matchesStatus;
  });

  const activeCount = staffList.filter(s => s.status === 'Active').length;
  const totalPayroll = staffList.filter(s => s.status === 'Active').reduce((acc, curr) => acc + Number(curr.salaryBase), 0);
  const pendingPayments = staffList.filter(s => s.paymentStatus === 'Pending').length;

  const handleAddStaffSubmit = async (newStaff: StaffMember) => {
    try {
      if (editingStaffId) {
        await supabase.from('staff').update({
          name: newStaff.name,
          department: newStaff.department,
          role: newStaff.role,
          email: newStaff.email,
          salary_base: newStaff.salaryBase,
          status: newStaff.status
        }).eq('id', editingStaffId);
        setEditingStaffId(null);
      } else {
        await supabase.from('staff').insert([{
          name: newStaff.name,
          department: newStaff.department,
          role: newStaff.role,
          email: newStaff.email,
          salary_base: newStaff.salaryBase || 0
        }]);
      }
      setCurrentView('list');
      fetchStaff();
    } catch (err) {
      console.error(err);
    }
  };

  const handleLoadSampleRoster = async () => {
    setIsLoading(true);
    const sampleStaff = [
      {
        name: 'Dr. Sarah Tan',
        department: 'General Medicine',
        role: 'Senior GP Physician',
        email: 'sarah.tan@mediclinic.my',
        salary_base: 14500,
        status: 'Active'
      },
      {
        name: 'Pharm. Ahmad Razak',
        department: 'Pharmacy',
        role: 'Chief Pharmacist',
        email: 'ahmad.razak@mediclinic.my',
        salary_base: 9200,
        status: 'Active'
      },
      {
        name: 'Nurse Siti Aminah',
        department: 'Clinical Operations',
        role: 'Triage Nurse Supervisor',
        email: 'siti.aminah@mediclinic.my',
        salary_base: 5800,
        status: 'Active'
      },
      {
        name: 'Kavita A/P Ramesh',
        department: 'Administration',
        role: 'Receptionist & Cashier',
        email: 'kavita.ramesh@mediclinic.my',
        salary_base: 3800,
        status: 'Active'
      }
    ];

    try {
      await supabase.from('staff').insert(sampleStaff);
      setIsImportModalOpen(false);
      fetchStaff();
    } catch (err) {
      console.error('Failed to insert sample roster', err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleStatus = async (id: string) => {
    const staff = staffList.find(s => s.id === id);
    if (!staff) return;
    const newStatus = staff.status === 'Active' ? 'Suspended' : 'Active';
    await supabase.from('staff').update({ status: newStatus }).eq('id', id);
    fetchStaff();
  };

  const deleteStaff = async (id: string) => {
    if (confirm('Are you sure you want to permanently delete this staff record?')) {
      await supabase.from('staff').delete().eq('id', id);
      fetchStaff();
    }
  };

  const processPayroll = async (id: string) => {
    await supabase.from('staff').update({ payment_status: 'Paid' }).eq('id', id);
    fetchStaff();
  };

  const revertPayroll = async (id: string) => {
    await supabase.from('staff').update({ payment_status: 'Pending' }).eq('id', id);
    fetchStaff();
  };

  const approveLeave = async (id: string) => {
    const staff = staffList.find(s => s.id === id);
    if (staff && staff.leaveBalance > 0) {
      await supabase.from('staff').update({ 
        leave_balance: staff.leaveBalance - 1, 
        leaves_taken: staff.leavesTaken + 1 
      }).eq('id', id);
      fetchStaff();
    }
  };

  const markAbsent = async (id: string) => {
    const staff = staffList.find(s => s.id === id);
    if (staff) {
      await supabase.from('staff').update({ 
        attendance_rate: Math.max(0, staff.attendanceRate - 2) 
      }).eq('id', id);
      fetchStaff();
    }
  };

  return (
    <div className="animate-fadeIn max-w-6xl mx-auto space-y-6">
      
      {/* 1. STRUCTURED PAGE HEADER BANNER */}
      <div className="bg-[#0a837f] text-white p-5 rounded-none shadow-md border-b border-[#086b68] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="bg-white/10 text-teal-100 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-white/20 uppercase tracking-wide">
              Workforce Governance
            </span>
            <span className="flex items-center gap-1 text-[11px] text-teal-200 bg-teal-900/40 px-2 py-0.5 rounded border border-teal-400/20 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              {activeCount} Active Personnel
            </span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Users className="w-6 h-6 text-teal-200" />
            Staff &amp; HR Management
          </h1>
          <p className="text-xs text-teal-100/90 font-medium max-w-2xl leading-relaxed">
            Personnel Directory, Payroll Disbursements, Workstation Credentials, and Leave Attendance Tracker.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {activeTab === 'directory' && currentView === 'list' && (
            <>
              <button 
                type="button"
                onClick={() => setIsImportModalOpen(true)}
                className="bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-3 py-2 rounded-md flex items-center gap-1.5 border border-white/20 transition-all cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Import Staff CSV</span>
              </button>

              <button 
                type="button"
                onClick={() => {
                  setEditingStaffId(null);
                  setCurrentView('registration');
                }}
                className="bg-[#0d9488] hover:bg-[#0f766e] text-white text-xs font-semibold px-3.5 py-2 rounded-md flex items-center gap-1.5 border border-teal-500/30 transition-all shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Staff Member</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* 2. TOP METRICS CARDS ROW (Gives immediate structure & balance) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-[#e6f4f1] border border-[#99f6e4] p-3.5 rounded-none shadow-2xs">
          <span className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider block">Registered Personnel</span>
          <span className="text-xl font-black font-mono text-[#0f3c4c] block mt-0.5">{staffList.length} Members</span>
        </div>

        <div className="bg-[#e6f4f1] border border-[#99f6e4] p-3.5 rounded-none shadow-2xs">
          <span className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider block">Active Duty Staff</span>
          <span className="text-xl font-black font-mono text-emerald-700 block mt-0.5">{activeCount} Active</span>
        </div>

        <div className="bg-[#e6f4f1] border border-[#99f6e4] p-3.5 rounded-none shadow-2xs">
          <span className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider block">Est. Monthly Payroll</span>
          <span className="text-xl font-black font-mono text-[#0d9488] block mt-0.5">RM {totalPayroll.toLocaleString()}</span>
        </div>

        <div className="bg-[#e6f4f1] border border-[#99f6e4] p-3.5 rounded-none shadow-2xs">
          <span className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider block">Pending Disbursals</span>
          <span className="text-xl font-black font-mono text-amber-700 block mt-0.5">{pendingPayments} Pending</span>
        </div>
      </div>

      {currentView === 'registration' ? (
        <StaffRegistration 
          initialData={editingStaffId ? staffList.find(s => s.id === editingStaffId) : undefined}
          onCancel={() => {
            setCurrentView('list');
            setEditingStaffId(null);
          }} 
          onSubmit={handleAddStaffSubmit} 
        />
      ) : (
        <>
          {/* 3. SUB-TAB NAVIGATION SEGMENTED CONTROL */}
          <div className="flex items-center gap-1.5 border-b border-[#ccfbf1] pb-px text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('directory')}
              className={`px-4 py-2.5 rounded-none border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'directory' 
                  ? 'border-[#0d9488] text-[#0d9488] font-black bg-[#f0fdfa]' 
                  : 'border-transparent text-slate-500 hover:text-[#0f3c4c]'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Staff Directory ({staffList.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('payroll')}
              className={`px-4 py-2.5 rounded-none border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'payroll' 
                  ? 'border-[#0d9488] text-[#0d9488] font-black bg-[#f0fdfa]' 
                  : 'border-transparent text-slate-500 hover:text-[#0f3c4c]'
              }`}
            >
              <DollarSign className="w-4 h-4" />
              <span>Payroll &amp; Salary</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('attendance')}
              className={`px-4 py-2.5 rounded-none border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'attendance' 
                  ? 'border-[#0d9488] text-[#0d9488] font-black bg-[#f0fdfa]' 
                  : 'border-transparent text-slate-500 hover:text-[#0f3c4c]'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Leave &amp; Attendance</span>
            </button>
          </div>

          {/* 4. DIRECTORY VIEW AREA */}
          {activeTab === 'directory' && (
            <div className="space-y-4">
              
              {/* Search & Filter Bar (Only when staff records exist) */}
              {staffList.length > 0 && (
                <div className="bg-[#f0fdfa] border border-[#ccfbf1] p-3.5 rounded-none shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
                  <div className="relative w-full md:w-72">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input 
                      type="text" 
                      placeholder="Search name, role, department..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2 bg-[#e6f4f1] border border-[#99f6e4] text-xs text-[#0f3c4c] placeholder-slate-400 focus:outline-none focus:border-[#0d9488]" 
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    <div className="flex items-center gap-1.5 text-slate-600 font-bold">
                      <Filter className="w-3.5 h-3.5 text-[#0d9488]" />
                      <span>Dept:</span>
                      <select
                        value={departmentFilter}
                        onChange={e => setDepartmentFilter(e.target.value)}
                        className="bg-[#e6f4f1] border border-[#99f6e4] px-2.5 py-1.5 text-xs text-[#0f3c4c] font-bold focus:outline-none"
                      >
                        <option value="All">All Departments</option>
                        <option value="General Medicine">General Medicine</option>
                        <option value="Pharmacy">Pharmacy</option>
                        <option value="Clinical Operations">Clinical Operations</option>
                        <option value="Administration">Administration</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-1.5 text-slate-600 font-bold">
                      <span>Status:</span>
                      <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        className="bg-[#e6f4f1] border border-[#99f6e4] px-2.5 py-1.5 text-xs text-[#0f3c4c] font-bold focus:outline-none"
                      >
                        <option value="All">All Statuses</option>
                        <option value="Active">Active</option>
                        <option value="On Leave">On Leave</option>
                        <option value="Suspended">Suspended</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* 5. REDESIGNED 2-COLUMN ONBOARDING EMPTY STATE (When 0 staff records exist) */}
              {staffList.length === 0 && !isLoading && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 my-2">
                  
                  {/* Left Column: Hero Onboarding Card */}
                  <div className="lg:col-span-7 bg-[#e6f4f1] border border-[#99f6e4] p-8 rounded-none shadow-xs space-y-6 flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="w-14 h-14 rounded-none bg-[#e0f5f2] border border-[#b2f5ea] text-[#0d9488] flex items-center justify-center shadow-md">
                        <UserPlus className="w-7 h-7" />
                      </div>
                      
                      <div className="space-y-2">
                        <h3 className="text-xl font-black text-[#0f3c4c]">Your staff directory is empty</h3>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          Add clinicians, receptionists, pharmacists, and administrators to manage their profiles, payroll, leave balances, and station access.
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingStaffId(null);
                          setCurrentView('registration');
                        }}
                        className="w-full sm:w-auto px-6 py-3 bg-[#0d9488] hover:bg-[#0f766e] text-white font-extrabold text-xs rounded-none shadow-md transition-all hover:scale-105 cursor-pointer flex items-center justify-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add First Staff Member</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleLoadSampleRoster}
                        className="w-full sm:w-auto px-5 py-3 bg-[#e0f5f2] hover:bg-[#d5f0eb] text-[#0d9488] font-bold text-xs border border-[#b2f5ea] rounded-none transition-colors cursor-pointer flex items-center justify-center gap-2"
                      >
                        <FileSpreadsheet className="w-4 h-4 text-[#0d9488]" />
                        <span>Import Sample Roster</span>
                      </button>
                    </div>
                  </div>

                  {/* Right Column: Quick Onboarding Workflow Guide */}
                  <div className="lg:col-span-5 bg-[#f0fdfa] border border-[#ccfbf1] p-6 rounded-none space-y-4 shadow-2xs flex flex-col justify-between">
                    <div className="space-y-3">
                      <h4 className="text-xs font-black uppercase tracking-wider text-[#0d9488] flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-[#0d9488]" />
                        <span>Quick Onboarding Guide</span>
                      </h4>

                      <div className="space-y-3 text-xs">
                        <div className="flex items-start gap-3 p-2.5 bg-[#e6f4f1] border border-[#99f6e4]">
                          <span className="w-5 h-5 bg-[#0d9488] text-white font-mono font-bold text-[10px] flex items-center justify-center shrink-0">1</span>
                          <div>
                            <strong className="text-[#0f3c4c] block font-extrabold">Register Personnel</strong>
                            <span className="text-[11px] text-slate-600">Enter MyKad IC/Passport, contact details &amp; credentials.</span>
                          </div>
                        </div>

                        <div className="flex items-start gap-3 p-2.5 bg-[#f7fdfd] border border-[#ccfbf1]">
                          <span className="w-5 h-5 bg-[#0d9488] text-white font-mono font-bold text-[10px] flex items-center justify-center shrink-0">2</span>
                          <div>
                            <strong className="text-[#0f3c4c] block font-extrabold">Assign Workstation Role</strong>
                            <span className="text-[11px] text-slate-600">Assign Doctor, Pharmacist, Triage Nurse or Cashier suite.</span>
                          </div>
                        </div>

                        <div className="flex items-start gap-3 p-2.5 bg-[#f7fdfd] border border-[#ccfbf1]">
                          <span className="w-5 h-5 bg-[#0d9488] text-white font-mono font-bold text-[10px] flex items-center justify-center shrink-0">3</span>
                          <div>
                            <strong className="text-[#0f3c4c] block font-extrabold">Configure Payroll &amp; Benefits</strong>
                            <span className="text-[11px] text-slate-600">Set base salary, EPF/SOCSO deductions &amp; annual leave.</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#ccfbf1] text-[11px] text-[#0d9488] font-bold flex items-center justify-between">
                      <span>PDPA 2010 Compliant System</span>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    </div>
                  </div>

                </div>
              )}

              {/* SEARCH NO RESULTS STATE */}
              {staffList.length > 0 && filteredStaff.length === 0 && (
                <div className="bg-[#f7fdfd] border border-[#ccfbf1] p-10 text-center space-y-4">
                  <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
                  <h4 className="text-base font-black text-[#0f3c4c]">
                    No staff members found matching &ldquo;{searchQuery}&rdquo;
                  </h4>
                  <p className="text-xs text-slate-500">
                    Try refining your search terms or clearing current department/status filters.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setDepartmentFilter('All');
                      setStatusFilter('All');
                    }}
                    className="px-4 py-2 bg-[#e0f5f2] hover:bg-[#d5f0eb] text-[#0d9488] font-bold text-xs border border-[#b2f5ea] cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Reset All Filters</span>
                  </button>
                </div>
              )}

              {/* STAFF DIRECTORY TABLE (When records exist) */}
              {filteredStaff.length > 0 && (
                <div className="bg-[#e6f4f1] border border-[#99f6e4] rounded-none shadow-xs overflow-hidden animate-fadeIn">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#d5f0eb] text-[#0f3c4c] font-black uppercase text-[10px] tracking-wider border-b border-[#99f6e4]">
                      <tr>
                        <th className="px-6 py-3.5">Staff Member</th>
                        <th className="px-6 py-3.5">Department &amp; Role</th>
                        <th className="px-6 py-3.5">Status</th>
                        <th className="px-6 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#ccfbf1]">
                      {filteredStaff.map((staff) => (
                        <tr key={staff.id} className="hover:bg-[#f0fdfa] transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-none bg-[#e6f4f1] border border-[#ccfbf1] flex items-center justify-center text-[#0d9488] font-black text-xs shrink-0">
                                {staff.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-extrabold text-[#0f3c4c] text-xs">{staff.name}</p>
                                <p className="text-[10px] font-mono text-slate-500">{staff.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-slate-800 font-bold">{staff.department}</p>
                            <div className="flex items-center gap-1 mt-0.5">
                              <Shield className="w-3 h-3 text-[#0d9488]" />
                              <span className="text-[10px] font-extrabold uppercase tracking-wide text-[#0d9488]">{staff.role}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <button 
                              type="button"
                              onClick={() => toggleStatus(staff.id)}
                              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-none text-[10px] font-extrabold uppercase tracking-wider cursor-pointer border transition-colors ${
                                staff.status === 'Active' 
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                                  : staff.status === 'On Leave'
                                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                                  : 'bg-rose-100 text-rose-800 border-rose-300'
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                staff.status === 'Active' ? 'bg-emerald-500' : staff.status === 'On Leave' ? 'bg-amber-500' : 'bg-rose-500'
                              }`}></span>
                              {staff.status}
                            </button>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex justify-end gap-2">
                              <button 
                                type="button"
                                onClick={() => {
                                  setEditingStaffId(staff.id);
                                  setCurrentView('registration');
                                }}
                                className="p-1.5 text-slate-600 hover:text-[#0d9488] bg-[#f0fdfa] border border-[#ccfbf1] hover:border-[#0d9488] rounded-none transition-all cursor-pointer"
                                title="Edit staff record"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                type="button"
                                onClick={() => deleteStaff(staff.id)}
                                className="p-1.5 text-slate-600 hover:text-rose-600 bg-rose-50 border border-rose-200 hover:border-rose-300 rounded-none transition-all cursor-pointer"
                                title="Delete staff record"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Payroll View */}
          {activeTab === 'payroll' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-[#f7fdfd] border border-[#ccfbf1] rounded-none shadow-2xs overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#e0f5f2] text-[#0f3c4c] font-black uppercase text-[10px] tracking-wider border-b border-[#b2f5ea]">
                    <tr>
                      <th className="px-6 py-3.5">Employee</th>
                      <th className="px-6 py-3.5">Base Salary</th>
                      <th className="px-6 py-3.5">Deductions (EPF/SOCSO)</th>
                      <th className="px-6 py-3.5">Net Pay</th>
                      <th className="px-6 py-3.5">Status</th>
                      <th className="px-6 py-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#ccfbf1]">
                    {staffList.map((staff) => {
                      const base = Number(staff.salaryBase) || 0;
                      const deductions = base * 0.13;
                      const netPay = base - deductions;

                      return (
                        <tr key={staff.id} className="hover:bg-[#f0fdfa]">
                          <td className="px-6 py-4 font-bold text-[#0f3c4c]">{staff.name}</td>
                          <td className="px-6 py-4 font-mono text-slate-600">RM {base.toLocaleString()}</td>
                          <td className="px-6 py-4 font-mono text-rose-600">-RM {deductions.toLocaleString()}</td>
                          <td className="px-6 py-4 font-mono font-bold text-[#0d9488]">RM {netPay.toLocaleString()}</td>
                          <td className="px-6 py-4">
                            {staff.paymentStatus === 'Paid' ? (
                              <div className="flex items-center gap-2">
                                <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-emerald-800 bg-emerald-100 px-2 py-0.5 border border-emerald-300">
                                  <CheckCircle className="w-3 h-3" /> Paid
                                </span>
                                <button 
                                  type="button"
                                  onClick={() => revertPayroll(staff.id)}
                                  className="p-1 text-slate-400 hover:text-amber-600 cursor-pointer"
                                  title="Revert to Pending"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-amber-800 bg-amber-100 px-2 py-0.5 border border-amber-300">
                                <Clock className="w-3 h-3" /> Pending
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              type="button"
                              disabled={staff.paymentStatus === 'Paid'}
                              onClick={() => processPayroll(staff.id)}
                              className={`text-xs font-extrabold px-3 py-1.5 rounded-none transition-colors ${
                                staff.paymentStatus === 'Paid' 
                                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                                  : 'bg-[#0d9488] hover:bg-[#0f766e] text-white cursor-pointer shadow-xs'
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

          {/* Attendance View */}
          {activeTab === 'attendance' && (
            <div className="bg-[#f7fdfd] border border-[#ccfbf1] rounded-none shadow-2xs overflow-hidden animate-fadeIn">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#e0f5f2] text-[#0f3c4c] font-black uppercase text-[10px] tracking-wider border-b border-[#b2f5ea]">
                  <tr>
                    <th className="px-6 py-3.5">Employee</th>
                    <th className="px-6 py-3.5">Attendance Rate</th>
                    <th className="px-6 py-3.5">Leaves Taken</th>
                    <th className="px-6 py-3.5">Leave Balance</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ccfbf1]">
                  {staffList.map((staff) => (
                    <tr key={staff.id} className="hover:bg-[#f0fdfa]">
                      <td className="px-6 py-4 font-bold text-[#0f3c4c]">
                        {staff.name}
                        <p className="text-[10px] text-slate-500 font-normal">{staff.role}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-full bg-slate-200 rounded-none h-2 max-w-[80px]">
                            <div 
                              className={`h-2 ${staff.attendanceRate > 90 ? 'bg-[#0d9488]' : staff.attendanceRate > 75 ? 'bg-amber-500' : 'bg-rose-500'}`}
                              style={{ width: `${staff.attendanceRate}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-mono font-bold text-[#0f3c4c]">{staff.attendanceRate}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-600">
                        {staff.leavesTaken} Days
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[11px] font-bold px-2 py-0.5 border ${
                          staff.leaveBalance > 5 ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-rose-100 text-rose-800 border-rose-300'
                        }`}>
                          {staff.leaveBalance} Days Left
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            type="button"
                            onClick={() => markAbsent(staff.id)}
                            className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 px-2 py-1 cursor-pointer transition-colors"
                          >
                            Mark Absent
                          </button>
                          <button 
                            type="button"
                            disabled={staff.leaveBalance <= 0}
                            onClick={() => approveLeave(staff.id)}
                            className={`text-[10px] font-bold px-2 py-1 border transition-colors ${
                              staff.leaveBalance <= 0 
                                ? 'text-slate-400 border-slate-200 bg-slate-50 cursor-not-allowed'
                                : 'text-[#0d9488] bg-[#e0f5f2] border-[#b2f5ea] hover:bg-[#d5f0eb] cursor-pointer'
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

      {/* CSV Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn font-sans">
          <div className="bg-[#f7fdfd] border border-[#ccfbf1] max-w-md w-full p-6 shadow-2xl space-y-5 relative text-[#0f3c4c]">
            <div className="flex items-center justify-between border-b border-[#ccfbf1] pb-3">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-[#0d9488]" />
                <h3 className="text-base font-black">Import Staff Roster (CSV)</h3>
              </div>
              <button 
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Upload a standard personnel spreadsheet containing employee full name, email, department, role, and salary information.
            </p>

            <div className="border-2 border-dashed border-[#ccfbf1] bg-[#f0fdfa] p-6 text-center space-y-3">
              <Upload className="w-8 h-8 text-[#0d9488] mx-auto" />
              <div className="text-xs text-slate-600">
                <span className="font-bold text-[#0d9488]">Click to choose CSV file</span> or drag and drop here
              </div>
              <span className="text-[10px] text-slate-400 block font-mono">Supported formats: .csv, .xlsx</span>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleLoadSampleRoster}
                className="w-full py-2.5 bg-[#0d9488] hover:bg-[#0f766e] text-white text-xs font-black shadow-md cursor-pointer transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Load Sample Malaysian Medical Roster</span>
              </button>

              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="w-full py-2 bg-[#e0f5f2] text-[#0d9488] text-xs font-bold border border-[#b2f5ea] cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
