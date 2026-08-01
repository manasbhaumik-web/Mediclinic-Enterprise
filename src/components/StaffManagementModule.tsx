import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Trash2, Edit2, Shield, User, X, 
  DollarSign, CheckCircle, Clock, Calendar, AlertCircle 
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
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);

  useEffect(() => {
    const fetchStaff = async () => {
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
    };
    
    fetchStaff();
    
    const channel = supabase.channel('staff_sync_' + Math.random().toString(36).substring(2, 9))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'staff' }, fetchStaff)
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredStaff = staffList.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeCount = staffList.filter(s => s.status === 'Active').length;
  const totalPayroll = staffList.filter(s => s.status === 'Active').reduce((acc, curr) => acc + Number(curr.salaryBase), 0);
  const pendingPayments = staffList.filter(s => s.paymentStatus === 'Pending').length;

  const handleAddStaffSubmit = async (newStaff: StaffMember) => {
    try {
      if (editingStaffId) {
        // Upsert uses id
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
    } catch (err) {
      console.error(err);
    }
  };

  const toggleStatus = async (id: string) => {
    const staff = staffList.find(s => s.id === id);
    if (!staff) return;
    const newStatus = staff.status === 'Active' ? 'Suspended' : 'Active';
    await supabase.from('staff').update({ status: newStatus }).eq('id', id);
  };

  const deleteStaff = async (id: string) => {
    if (confirm('Are you sure you want to permanently delete this staff record?')) {
      await supabase.from('staff').delete().eq('id', id);
    }
  };

  const processPayroll = async (id: string) => {
    await supabase.from('staff').update({ payment_status: 'Paid' }).eq('id', id);
  };

  const revertPayroll = async (id: string) => {
    await supabase.from('staff').update({ payment_status: 'Pending' }).eq('id', id);
  };

  const approveLeave = async (id: string) => {
    const staff = staffList.find(s => s.id === id);
    if (staff && staff.leaveBalance > 0) {
      await supabase.from('staff').update({ 
        leave_balance: staff.leaveBalance - 1, 
        leaves_taken: staff.leavesTaken + 1 
      }).eq('id', id);
    }
  };

  const markAbsent = async (id: string) => {
    const staff = staffList.find(s => s.id === id);
    if (staff) {
      await supabase.from('staff').update({ 
        attendance_rate: Math.max(0, staff.attendanceRate - 2) 
      }).eq('id', id);
    }
  };

  return (
    <div className="animate-fadeIn max-w-5xl mx-auto space-y-6">
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
              onClick={() => {
                setEditingStaffId(null);
                setCurrentView('registration');
              }}
              className="bg-[#07B2B2] text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-[#058A8A] cursor-pointer shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Staff
            </button>
          )}
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
                            <p className="text-[10px] font-mono text-slate-400">{staff.email}</p>
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
                          <button 
                            onClick={() => {
                              setEditingStaffId(staff.id);
                              setCurrentView('registration');
                            }}
                            className="p-2 text-slate-400 hover:text-[#07B2B2] bg-white hover:bg-cyan-50 rounded-lg border border-transparent hover:border-cyan-100 transition-all cursor-pointer"
                          >
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

          {activeTab === 'payroll' && (
            <div className="space-y-4 animate-fadeIn">
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
                      const base = Number(staff.salaryBase) || 0;
                      const deductions = base * 0.15; // Mock 15% deduction
                      const netPay = base - deductions;

                      return (
                        <tr key={staff.id} className="hover:bg-slate-50">
                          <td className="px-6 py-4 font-bold text-slate-800">{staff.name}</td>
                          <td className="px-6 py-4 font-mono text-slate-600">RM {base.toLocaleString()}</td>
                          <td className="px-6 py-4 font-mono text-red-500">-RM {deductions.toLocaleString()}</td>
                          <td className="px-6 py-4 font-mono font-bold text-[#07B2B2]">RM {netPay.toLocaleString()}</td>
                          <td className="px-6 py-4">
                            {staff.paymentStatus === 'Paid' ? (
                              <div className="flex items-center gap-2">
                                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                                  <CheckCircle className="w-3 h-3" /> Paid
                                </span>
                                <button 
                                  onClick={() => revertPayroll(staff.id)}
                                  className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-amber-500 cursor-pointer"
                                  title="Revert to Pending"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
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
