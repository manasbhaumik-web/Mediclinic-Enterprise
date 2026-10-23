import React, { useState, useEffect } from 'react';
import PayrollStatusList from '../payroll/PayrollStatusList';
import LeaveStatusList from '../leave/LeaveStatusList';
import { 
  Plus, Search, Trash2, Edit2, Shield, User, Users, X, 
  DollarSign, Calendar, AlertCircle,
  FileSpreadsheet, Upload, UserPlus, Filter, RefreshCw, CheckCircle2, ArrowRight, Activity
} from 'lucide-react';
import StaffRegistration from './StaffRegistration';
import { supabase } from '../../lib/supabase';
import StaffAccessCell from './StaffAccessCell';
import { AccessState, SystemRole, normalizeRoleSet } from '../../domain/staffAccess';
import { CSV_TEMPLATE, CsvParseResult, parseStaffCsv } from '../../domain/staffCsv';
import {
  StaffIdentity, duplicateMessage, duplicateMessageFromDbError, findStaffDuplicate,
} from '../../../supabase/functions/_shared/staffIdentity';
import {
  changeRoles, createStaff, grantAccess, loadAccessStatus, restoreAccess, resendInvite, revokeAccess, sendPasswordReset,
} from '../../lib/staffOnboarding';

import ProgressBar from '../../components/ui/ProgressBar';
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

  /** Application access role of this person's login, if they have one. */
  systemRole?: SystemRole | null;
  systemRoles?: SystemRole[];
  hasLogin?: boolean;

  /** Extra HR fields captured by the registration form. */
  altPhone?: string;
  jobTitle?: string;
  specialization?: string;
  licenseNumber?: string;
  licenseExpiry?: string;
  qualifications?: string;
  dateJoined?: string;
  dateResigned?: string;
  employmentStatus?: string;
  workSchedule?: string;
  supervisorId?: string;
  taxId?: string;
  statutoryFundNumber?: string;
  emergencyContact?: { name: string; relationship: string; phone: string };
  bankDetails?: { bankName: string; accountHolder: string; accountNumber: string };
}

type StaffViewTab = 'directory' | 'payroll' | 'attendance';

const DEFAULT_15_STAFF: StaffMember[] = [
  { id: 'S1001', name: 'Dr. Sarah Tan', department: 'General Practice', role: 'Senior GP Physician', email: 'sarah.tan@mediclinic.my', salaryBase: 14500, status: 'Active', gender: 'Female', dob: '1985-04-12', icNumber: '850412-14-5224', phone: '012-3456789', paymentStatus: 'Paid', attendanceRate: 98, leaveBalance: 14, leavesTaken: 2 },
  { id: 'S1002', name: 'Dr. Marcus Wong', department: 'Pediatrics', role: 'Consultant Pediatrician', email: 'marcus.wong@mediclinic.my', salaryBase: 16800, status: 'Active', gender: 'Male', dob: '1982-08-25', icNumber: '820825-10-6113', phone: '013-9876543', paymentStatus: 'Paid', attendanceRate: 96, leaveBalance: 16, leavesTaken: 4 },
  { id: 'S1003', name: 'Dr. Aisha Rahman', department: 'Cardiology', role: 'Cardiovascular Specialist', email: 'aisha.rahman@mediclinic.my', salaryBase: 18500, status: 'Active', gender: 'Female', dob: '1980-11-19', icNumber: '801119-08-5432', phone: '017-2233445', paymentStatus: 'Paid', attendanceRate: 99, leaveBalance: 18, leavesTaken: 1 },
  { id: 'S1004', name: 'Dr. Kenneth Lee', department: 'Dermatology', role: 'Dermatology Consultant', email: 'kenneth.lee@mediclinic.my', salaryBase: 15500, status: 'Active', gender: 'Male', dob: '1988-03-30', icNumber: '880330-14-7789', phone: '019-5566778', paymentStatus: 'Paid', attendanceRate: 95, leaveBalance: 14, leavesTaken: 3 },
  { id: 'S1005', name: 'Dr. Priya Nair', department: 'Obstetrics & Gynaecology', role: 'O&G Specialist', email: 'priya.nair@mediclinic.my', salaryBase: 17200, status: 'Active', gender: 'Female', dob: '1984-07-08', icNumber: '840708-05-6332', phone: '016-4433221', paymentStatus: 'Paid', attendanceRate: 97, leaveBalance: 15, leavesTaken: 3 },
  { id: 'S1006', name: 'Nurse Siti Aminah', department: 'Clinical Operations', role: 'Triage Nurse Supervisor', email: 'siti.aminah@mediclinic.my', salaryBase: 5800, status: 'Active', gender: 'Female', dob: '1990-01-15', icNumber: '900115-14-6102', phone: '012-9988776', paymentStatus: 'Paid', attendanceRate: 100, leaveBalance: 12, leavesTaken: 2 },
  { id: 'S1007', name: 'Nurse Jessica Lim', department: 'Clinical Operations', role: 'Senior Clinical Nurse', email: 'jessica.lim@mediclinic.my', salaryBase: 4900, status: 'Active', gender: 'Female', dob: '1993-06-22', icNumber: '930622-07-5118', phone: '014-3322110', paymentStatus: 'Paid', attendanceRate: 94, leaveBalance: 14, leavesTaken: 5 },
  { id: 'S1008', name: 'Nurse Azman Kassim', department: 'Emergency & Triage', role: 'Staff Nurse (Emergency)', email: 'azman.kassim@mediclinic.my', salaryBase: 4500, status: 'Active', gender: 'Male', dob: '1995-09-10', icNumber: '950910-10-5897', phone: '018-7766554', paymentStatus: 'Pending', attendanceRate: 92, leaveBalance: 14, leavesTaken: 6 },
  { id: 'S1009', name: 'Nurse Chloe Tay', department: 'General Practice', role: 'Staff Nurse (Shift A)', email: 'chloe.tay@mediclinic.my', salaryBase: 4300, status: 'Active', gender: 'Female', dob: '1996-12-04', icNumber: '961204-14-6334', phone: '011-22334455', paymentStatus: 'Paid', attendanceRate: 96, leaveBalance: 14, leavesTaken: 2 },
  { id: 'S1010', name: 'Pharm. Ahmad Razak', department: 'Pharmacy', role: 'Chief Pharmacist', email: 'ahmad.razak@mediclinic.my', salaryBase: 9200, status: 'Active', gender: 'Male', dob: '1987-05-18', icNumber: '870518-08-5901', phone: '013-4455667', paymentStatus: 'Paid', attendanceRate: 99, leaveBalance: 16, leavesTaken: 1 },
  { id: 'S1011', name: 'Pharm. Nurul Huda', department: 'Pharmacy', role: 'Assistant Pharmacist', email: 'nurul.huda@mediclinic.my', salaryBase: 4800, status: 'Active', gender: 'Female', dob: '1994-10-28', icNumber: '941028-14-5662', phone: '017-8899001', paymentStatus: 'Paid', attendanceRate: 97, leaveBalance: 14, leavesTaken: 3 },
  { id: 'S1012', name: 'Tech. Rajan Pillai', department: 'Diagnostics & Lab', role: 'Senior Lab Technician', email: 'rajan.pillai@mediclinic.my', salaryBase: 5200, status: 'Active', gender: 'Male', dob: '1989-02-14', icNumber: '890214-07-5431', phone: '016-7788990', paymentStatus: 'Paid', attendanceRate: 98, leaveBalance: 14, leavesTaken: 2 },
  { id: 'S1013', name: 'Admin Mei Ling', department: 'Front Desk & Reception', role: 'Senior Patient Registrar', email: 'meiling@mediclinic.my', salaryBase: 3800, status: 'Active', gender: 'Female', dob: '1997-07-19', icNumber: '970719-14-5002', phone: '012-1122334', paymentStatus: 'Paid', attendanceRate: 100, leaveBalance: 14, leavesTaken: 0 },
  { id: 'S1014', name: 'HR Officer Farida Yusof', department: 'Human Resources', role: 'HR & Payroll Specialist', email: 'farida.yusof@mediclinic.my', salaryBase: 6500, status: 'Active', gender: 'Female', dob: '1991-04-03', icNumber: '910403-10-5334', phone: '019-3344556', paymentStatus: 'Paid', attendanceRate: 99, leaveBalance: 15, leavesTaken: 1 },
  { id: 'S1015', name: 'Admin Manager David Chen', department: 'Administration', role: 'Healthcare Operations Manager', email: 'david.chen@mediclinic.my', salaryBase: 11500, status: 'Active', gender: 'Male', dob: '1983-09-12', icNumber: '830912-14-5113', phone: '018-9900112', paymentStatus: 'Paid', attendanceRate: 98, leaveBalance: 18, leavesTaken: 2 }
];

export default function StaffManagementModule() {
  const [activeTab, setActiveTab] = useState<StaffViewTab>('directory');
  const [currentView, setCurrentView] = useState<'list' | 'registration'>('list');
  const [staffList, setStaffList] = useState<StaffMember[]>(DEFAULT_15_STAFF);
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [accessMap, setAccessMap] = useState<Record<string, { state: AccessState; role: SystemRole | null; roles: SystemRole[] }>>({});
  const [accessBusy, setAccessBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const [csvPreview, setCsvPreview] = useState<{ fileName: string; result: CsvParseResult } | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const fetchStaff = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from('staff').select('*').order('name');
    if (data && data.length > 0 && !error) {
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
        attendanceRate: s.attendance_rate ?? 100,
        leaveBalance: s.leave_balance ?? 0,
        leavesTaken: s.leaves_taken ?? 0,
        systemRole: s.system_role ?? null,
        systemRoles: normalizeRoleSet(s.system_roles ?? (s.system_role ? [s.system_role] : [])),
        hasLogin: !!s.auth_id
      })));
    } else {
      setStaffList(DEFAULT_15_STAFF);
    }
    setIsLoading(false);
    refreshAccess();
  };

  // Login state (invited / active / revoked) lives in the auth system, so it comes from the onboarding function.
  const refreshAccess = async () => {
    try {
      const res = await loadAccessStatus();
      if (res.access) setAccessMap(res.access);
    } catch {
      /* the access column simply shows no state if the function is unavailable */
    }
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

  // Everyone already in the directory, for duplicate checks (the database enforces the same rules).
  const knownPeople = (): StaffIdentity[] =>
    staffList.map((s) => ({ id: s.id, name: s.name, email: s.email, icNumber: s.icNumber, dob: s.dob }));

  const handleAddStaffSubmit = async (newStaff: StaffMember, systemRoles: SystemRole[]) => {
    setNotice(null);

    // No duplicate records: refuse the same email or ID number, and ask before adding the same name + birth date.
    const duplicate = findStaffDuplicate(
      { id: editingStaffId ?? undefined, name: newStaff.name, email: newStaff.email, icNumber: newStaff.icNumber, dob: newStaff.dob },
      knownPeople(),
    );
    if (duplicate?.blocking) {
      setNotice({ ok: false, text: duplicateMessage(duplicate) });
      return;
    }
    if (duplicate && !confirm(`${duplicateMessage(duplicate)}

Add anyway?`)) return;

    try {
      if (editingStaffId) {
        const { error } = await supabase.from('staff').update({
          name: newStaff.name,
          department: newStaff.department,
          role: newStaff.role,
          email: newStaff.email,
          salary_base: newStaff.salaryBase,
          status: newStaff.status,
          gender: newStaff.gender ?? null,
          dob: newStaff.dob || null,
          ic_number: newStaff.icNumber ?? null,
          phone: newStaff.phone ?? null
        }).eq('id', editingStaffId);
        if (error) {
          setNotice({ ok: false, text: duplicateMessageFromDbError(error.message) ?? error.message });
          return;
        }
        setEditingStaffId(null);
        setNotice({ ok: true, text: 'Staff record updated.' });
      } else {
        // Creating goes through the server: it saves the record, grants the access, then emails a notification (access stands even if that email fails).
        const payload = {
          name: newStaff.name, email: newStaff.email, role: newStaff.role, department: newStaff.department,
          status: newStaff.status, gender: newStaff.gender, dob: newStaff.dob, icNumber: newStaff.icNumber,
          phone: newStaff.phone, salaryBase: newStaff.salaryBase || 0,
        };
        let res = await createStaff(payload, systemRoles, !!duplicate);
        // The server may know of a probable duplicate this screen's list did not (for example, just added by someone else).
        if (res.possibleDuplicate) {
          if (!confirm(`${res.message}\n\nAdd anyway?`)) return;
          res = await createStaff(payload, systemRoles, true);
        }
        if (!res.ok) {
          setNotice({ ok: false, text: res.message ?? 'Could not create the staff member.' });
          return;
        }
        // A notification that could not be sent is a warning, not a failure: the access was given.
        setNotice({ ok: res.accessGranted !== false || !res.warning, text: res.warning ?? res.message ?? 'Staff member created.' });
      }
      setCurrentView('list');
      fetchStaff();
    } catch (err) {
      console.error(err);
      setNotice({ ok: false, text: err instanceof Error ? err.message : 'Could not save the staff member.' });
    }
  };

  /** Run an access action, show its outcome and refresh the list. */
  const runAccess = async (staffId: string, action: () => Promise<{ ok?: boolean; message?: string }>) => {
    setAccessBusy(staffId);
    setNotice(null);
    try {
      const res = await action();
      setNotice({ ok: res.ok !== false, text: res.message ?? (res.ok === false ? 'That did not work.' : 'Done.') });
      await fetchStaff();
    } catch (err) {
      setNotice({ ok: false, text: err instanceof Error ? err.message : 'Request failed.' });
    } finally {
      setAccessBusy(null);
    }
  };

  const handleCsvFile = async (file: File | undefined) => {
    if (!file) return;
    setNotice(null);
    if (!/\.csv$/i.test(file.name)) {
      setNotice({ ok: false, text: 'Please choose a .csv file. Excel files must be saved as CSV first.' });
      return;
    }
    const text = await file.text();
    setCsvPreview({ fileName: file.name, result: parseStaffCsv(text, knownPeople()) });
  };

  const confirmCsvImport = async () => {
    if (!csvPreview) return;
    const { rows } = csvPreview.result;
    setIsImporting(true);
    const { error } = await supabase.from('staff').insert(rows.map((r) => ({
      name: r.name, email: r.email, department: r.department || null, role: r.role, status: r.status,
      gender: r.gender || null, dob: r.dob || null, ic_number: r.icNumber || null, phone: r.phone || null,
      salary_base: r.salaryBase,
    })));
    setIsImporting(false);
    if (error) {
      setNotice({ ok: false, text: `Import failed, nothing was saved: ${duplicateMessageFromDbError(error.message) ?? error.message}` });
      return;
    }
    setNotice({ ok: true, text: `Imported ${rows.length} staff record${rows.length === 1 ? '' : 's'}. No logins were created: grant access per person from the Access column.` });
    setCsvPreview(null);
    setIsImportModalOpen(false);
    fetchStaff();
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
    // Suspending a person also blocks their login; reactivating restores it if it was blocked.
    if (staff.hasLogin) {
      try {
        if (newStatus === 'Suspended') await revokeAccess(id);
        else if (accessMap[id]?.state === 'revoked') await restoreAccess(id);
      } catch { /* the status change still applies; access can be managed from the Access column */ }
    }
    fetchStaff();
  };

  const deleteStaff = async (id: string) => {
    const target = staffList.find(s => s.id === id);
    if (target?.hasLogin && accessMap[id]?.state !== 'revoked') {
      alert('This person still has a login. Revoke their access first, then delete the record.');
      return;
    }
    if (confirm('Are you sure you want to permanently delete this staff record?')) {
      await supabase.from('staff').delete().eq('id', id);
      fetchStaff();
    }
  };

  return (
    <div className="animate-fadeIn w-full space-y-6 pb-8">
      
      {notice && (
        <p role="status" className={`text-xs font-bold px-4 py-3 border ${notice.ok ? 'chip-ok' : 'chip-danger'}`}>
          {notice.text}
        </p>
      )}

      {/* 1. STRUCTURED PAGE HEADER BANNER */}
      <div className="bg-surface text-ink p-5 rounded-none shadow-2xs border border-line flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="bg-primary/10 text-accent text-2xs font-bold px-2.5 py-0.5 rounded-none border border-brand/20 uppercase tracking-wider">
              Workforce Governance
            </span>
            <span className="flex items-center justify-center gap-1 text-2xs text-accent bg-teal-50 px-2 py-0.5 rounded-none border border-line font-mono font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              {activeCount} Active Personnel
            </span>
          </div>
          <h1 className="type-page-title text-ink flex items-center gap-2.5">
            <Users className="w-6 h-6 text-accent" />
            Staff &amp; HR Management
          </h1>
          <p className="text-xs text-muted font-medium max-w-2xl leading-relaxed">
            Personnel Directory, Payroll Disbursements, Workstation Credentials, and Leave Attendance Tracker.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {activeTab === 'directory' && currentView === 'list' && (
            <>
              <button 
                type="button"
                onClick={() => setIsImportModalOpen(true)}
                className="bg-white hover:bg-teal-50 text-deep text-xs font-bold px-3 py-2 rounded-none flex items-center justify-center gap-1.5 border border-line transition-all cursor-pointer shadow-2xs"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-accent" />
                <span>Import Staff CSV</span>
              </button>

              <button 
                type="button"
                onClick={() => {
                  setEditingStaffId(null);
                  setCurrentView('registration');
                }}
                className="bg-primary hover:bg-primary-hover text-white text-xs font-bold px-3.5 py-2 rounded-none flex items-center justify-center gap-1.5 border border-teal-500/30 transition-all shadow-xs cursor-pointer"
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
        <div className="bg-surface border border-line p-3.5 rounded-none shadow-2xs">
          <span className="text-2xs font-bold uppercase text-subtle tracking-wider block">Registered Personnel</span>
          <span className="text-xl font-bold font-mono text-ink block mt-0.5">{staffList.length} Members</span>
        </div>

        <div className="bg-surface border border-line p-3.5 rounded-none shadow-2xs">
          <span className="text-2xs font-bold uppercase text-subtle tracking-wider block">Active Duty Staff</span>
          <span className="text-xl font-bold font-mono text-emerald-700 block mt-0.5">{activeCount} Active</span>
        </div>

        <div className="bg-surface border border-line p-3.5 rounded-none shadow-2xs">
          <span className="text-2xs font-bold uppercase text-subtle tracking-wider block">Est. Monthly Payroll</span>
          <span className="text-xl font-bold font-mono text-accent block mt-0.5">RM {totalPayroll.toLocaleString()}</span>
        </div>

        <div className="bg-surface border border-line p-3.5 rounded-none shadow-2xs">
          <span className="text-2xs font-bold uppercase text-subtle tracking-wider block">Pending Disbursals</span>
          <span className="text-xl font-bold font-mono text-amber-700 block mt-0.5">{pendingPayments} Pending</span>
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
          <div className="flex items-stretch gap-0 bg-surface-strong border-b border-line text-xs font-bold h-10 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab('directory')}
              className={`px-4 h-full border-0 rounded-none transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'directory' 
                  ? 'bg-chrome text-white font-bold' 
                  : 'bg-transparent text-ink hover:bg-surface-strong font-bold'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Staff Directory ({staffList.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('payroll')}
              className={`px-4 h-full border-0 rounded-none transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'payroll' 
                  ? 'bg-chrome text-white font-bold' 
                  : 'bg-transparent text-ink hover:bg-surface-strong font-bold'
              }`}
            >
              <DollarSign className="w-4 h-4" />
              <span>Payroll &amp; Salary</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('attendance')}
              className={`px-4 h-full border-0 rounded-none transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'attendance' 
                  ? 'bg-chrome text-white font-bold' 
                  : 'bg-transparent text-ink hover:bg-surface-strong font-bold'
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
                <div className="bg-surface border border-line-subtle p-3.5 rounded-none shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
                  <div className="relative w-full md:w-72">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input 
                      type="text" 
                      placeholder="Search name, role, department..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2 bg-surface-accent border border-line text-xs text-ink placeholder-slate-400 focus:outline-none focus:border-brand" 
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    <div className="flex items-center gap-1.5 text-muted font-bold">
                      <Filter className="w-3.5 h-3.5 text-accent" />
                      <span>Dept:</span>
                      <select
                        value={departmentFilter}
                        onChange={e => setDepartmentFilter(e.target.value)}
                        className="bg-surface-accent border border-line px-2.5 py-1.5 text-xs text-ink font-bold focus:outline-none"
                      >
                        <option value="All">All Departments</option>
                        <option value="General Medicine">General Medicine</option>
                        <option value="Pharmacy">Pharmacy</option>
                        <option value="Clinical Operations">Clinical Operations</option>
                        <option value="Administration">Administration</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-1.5 text-muted font-bold">
                      <span>Status:</span>
                      <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        className="bg-surface-accent border border-line px-2.5 py-1.5 text-xs text-ink font-bold focus:outline-none"
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
                  <div className="lg:col-span-7 bg-surface border border-line p-8 rounded-none shadow-xs space-y-6 flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="w-14 h-14 rounded-none bg-surface border border-line text-accent flex items-center justify-center shadow-md">
                        <UserPlus className="w-7 h-7" />
                      </div>
                      
                      <div className="space-y-2">
                        <h3 className="type-section-title text-ink">Your staff directory is empty</h3>
                        <p className="text-xs text-muted leading-relaxed">
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
                        className="w-full sm:w-auto px-6 py-3 bg-primary hover:bg-primary-hover text-white font-bold text-xs rounded-none shadow-md transition-all hover:scale-105 cursor-pointer flex items-center justify-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add First Staff Member</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleLoadSampleRoster}
                        className="w-full sm:w-auto px-5 py-3 bg-surface-accent hover:bg-surface-strong text-accent font-bold text-xs border border-line rounded-none transition-colors cursor-pointer flex items-center justify-center gap-2"
                      >
                        <FileSpreadsheet className="w-4 h-4 text-accent" />
                        <span>Import Sample Roster</span>
                      </button>
                    </div>
                  </div>

                  {/* Right Column: Quick Onboarding Workflow Guide */}
                  <div className="lg:col-span-5 bg-surface border border-line-subtle p-6 rounded-none space-y-4 shadow-2xs flex flex-col justify-between">
                    <div className="space-y-3">
                      <h4 className="type-label text-accent flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-accent" />
                        <span>Quick Onboarding Guide</span>
                      </h4>

                      <div className="space-y-3 text-xs">
                        <div className="flex items-start gap-3 p-2.5 bg-surface-accent border border-line">
                          <span className="w-5 h-5 bg-primary text-white font-mono font-bold text-2xs flex items-center justify-center shrink-0">1</span>
                          <div>
                            <strong className="text-ink block font-bold">Register Personnel</strong>
                            <span className="text-2xs text-muted">Enter MyKad IC/Passport, contact details &amp; credentials.</span>
                          </div>
                        </div>

                        <div className="flex items-start gap-3 p-2.5 bg-surface border border-line-subtle">
                          <span className="w-5 h-5 bg-primary text-white font-mono font-bold text-2xs flex items-center justify-center shrink-0">2</span>
                          <div>
                            <strong className="text-ink block font-bold">Assign Workstation Role</strong>
                            <span className="text-2xs text-muted">Assign Doctor, Pharmacist, Triage Nurse or Cashier suite.</span>
                          </div>
                        </div>

                        <div className="flex items-start gap-3 p-2.5 bg-surface border border-line-subtle">
                          <span className="w-5 h-5 bg-primary text-white font-mono font-bold text-2xs flex items-center justify-center shrink-0">3</span>
                          <div>
                            <strong className="text-ink block font-bold">Configure Payroll &amp; Benefits</strong>
                            <span className="text-2xs text-muted">Set base salary, EPF/SOCSO deductions &amp; annual leave.</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-line-subtle text-2xs text-accent font-bold flex items-center justify-between">
                      <span>PDPA 2010 Compliant System</span>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    </div>
                  </div>

                </div>
              )}

              {/* SEARCH NO RESULTS STATE */}
              {staffList.length > 0 && filteredStaff.length === 0 && (
                <div className="bg-surface border border-line-subtle p-10 text-center space-y-4">
                  <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
                  <h4 className="type-card-title text-ink">
                    No staff members found matching &ldquo;{searchQuery}&rdquo;
                  </h4>
                  <p className="text-xs text-subtle">
                    Try refining your search terms or clearing current department/status filters.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setDepartmentFilter('All');
                      setStatusFilter('All');
                    }}
                    className="px-4 py-2 bg-surface-accent hover:bg-surface-strong text-accent font-bold text-xs border border-line cursor-pointer inline-flex items-center justify-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Reset All Filters</span>
                  </button>
                </div>
              )}

              {/* STAFF DIRECTORY TABLE (When records exist) */}
              {filteredStaff.length > 0 && (
                <div className="bg-surface-accent border border-line rounded-none shadow-xs overflow-hidden animate-fadeIn">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-surface-strong text-ink font-bold uppercase text-2xs tracking-wider border-b border-line">
                      <tr>
                        <th className="px-6 py-3.5">Staff Member</th>
                        <th className="px-6 py-3.5">Department &amp; Role</th>
                        <th className="px-6 py-3.5">Status</th>
                        <th className="px-6 py-3.5">System access</th>
                        <th className="px-6 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line-subtle">
                      {filteredStaff.map((staff) => (
                        <tr key={staff.id} className="hover:bg-surface-muted transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-none bg-surface-accent border border-line-subtle flex items-center justify-center text-accent font-bold text-xs shrink-0">
                                {staff.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-bold text-ink text-xs">{staff.name}</p>
                                <p className="text-2xs font-mono text-subtle">{staff.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-strong font-bold">{staff.department}</p>
                            <div className="flex items-center gap-1 mt-0.5">
                              <Shield className="w-3 h-3 text-accent" />
                              <span className="text-2xs font-bold uppercase tracking-wider text-accent">{staff.role}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <button 
                              type="button"
                              onClick={() => toggleStatus(staff.id)}
                              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-none text-2xs font-bold uppercase tracking-wider cursor-pointer border transition-colors ${
                                staff.status === 'Active' 
                                  ? 'chip-ok' 
                                  : staff.status === 'On Leave'
                                  ? 'chip-warn'
                                  : 'chip-danger'
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                staff.status === 'Active' ? 'bg-emerald-500' : staff.status === 'On Leave' ? 'bg-amber-500' : 'bg-rose-500'
                              }`}></span>
                              {staff.status}
                            </button>
                          </td>
                          <td className="px-6 py-4 min-w-[220px]">
                            <StaffAccessCell
                              hasLogin={!!staff.hasLogin}
                              systemRoles={accessMap[staff.id]?.roles ?? staff.systemRoles ?? (staff.systemRole ? [staff.systemRole] : [])}
                              state={accessMap[staff.id]?.state}
                              busy={accessBusy === staff.id}
                              onGrant={(roles) => runAccess(staff.id, () => grantAccess(staff.id, roles))}
                              onResend={() => runAccess(staff.id, () => resendInvite(staff.id))}
                              onReset={() => runAccess(staff.id, () => sendPasswordReset(staff.id))}
                              onChangeRoles={(roles) => runAccess(staff.id, () => changeRoles(staff.id, roles))}
                              onRevoke={() => { if (confirm(`Revoke ${staff.name}'s access? They will no longer be able to sign in.`)) runAccess(staff.id, () => revokeAccess(staff.id)); }}
                              onRestore={() => runAccess(staff.id, () => restoreAccess(staff.id))}
                            />
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex justify-end gap-2">
                              <button 
                                type="button"
                                onClick={() => {
                                  setEditingStaffId(staff.id);
                                  setCurrentView('registration');
                                }}
                                className="p-1.5 text-muted hover:text-accent bg-surface-muted border border-line-subtle hover:border-brand rounded-none transition-all cursor-pointer"
                                title="Edit staff record"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                type="button"
                                onClick={() => deleteStaff(staff.id)}
                                className="p-1.5 text-muted hover:text-rose-600 bg-rose-50 border border-rose-200 hover:border-rose-300 rounded-none transition-all cursor-pointer"
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

          {/* Payroll View: the real monthly payroll module */}
          {activeTab === 'payroll' && <PayrollStatusList />}

          {/* Leave & Attendance: calculated from approved leave and daily records */}
          {activeTab === 'attendance' && <LeaveStatusList />}
        </>
      )}

      {/* CSV Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn font-sans">
          <div className="bg-surface border border-line-subtle max-w-md w-full p-6 shadow-2xl space-y-5 relative text-ink">
            <div className="flex items-center justify-between border-b border-line-subtle pb-3">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-accent" />
                <h3 className="type-card-title">Import Staff Roster (CSV)</h3>
              </div>
              <button 
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="text-slate-400 hover:text-muted font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-muted leading-relaxed">
              Upload a standard personnel spreadsheet containing employee full name, email, department, role, and salary information.
            </p>

            <label className="block border-2 border-dashed border-line-subtle bg-surface-muted p-6 text-center space-y-3 cursor-pointer hover:bg-surface-accent">
              <Upload className="w-8 h-8 text-accent mx-auto" />
              <div className="text-xs text-muted">
                <span className="font-bold text-accent">Click to choose a CSV file</span>
              </div>
              <span className="text-2xs text-slate-400 block font-mono">Supported format: .csv (save Excel files as CSV first)</span>
              <input
                type="file"
                accept=".csv,text/csv"
                className="sr-only"
                onChange={(e) => { void handleCsvFile(e.target.files?.[0]); e.target.value = ''; }}
              />
            </label>

            <a
              href={`data:text/csv;charset=utf-8,${encodeURIComponent(CSV_TEMPLATE)}`}
              download="staff_import_template.csv"
              className="text-2xs font-bold text-accent underline"
            >
              Download the CSV template
            </a>

            {csvPreview && (
              <div className="border border-line-subtle bg-surface p-3 space-y-2 text-xs" aria-live="polite">
                <p className="font-bold text-ink">{csvPreview.fileName}</p>
                {csvPreview.result.missingColumns.length > 0 ? (
                  <p className="text-rose-700 font-bold">Missing required column{csvPreview.result.missingColumns.length > 1 ? 's' : ''}: {csvPreview.result.missingColumns.join(', ')}.</p>
                ) : (
                  <>
                    <p className="text-emerald-700 font-bold">{csvPreview.result.rows.length} ready to import</p>
                    {csvPreview.result.duplicates.length > 0 && (
                      <p className="text-amber-700">{csvPreview.result.duplicates.length} skipped as duplicates ({csvPreview.result.duplicates.slice(0, 3).map((d) => `${d.email}: ${d.reason === 'email' ? 'same email' : d.reason === 'id_number' ? 'same ID number' : 'same name and date of birth'}`).join('; ')}{csvPreview.result.duplicates.length > 3 ? '; …' : ''})</p>
                    )}
                    {csvPreview.result.errors.length > 0 && (
                      <div className="text-rose-700">
                        <p className="font-bold">{csvPreview.result.errors.length} row{csvPreview.result.errors.length > 1 ? 's have' : ' has'} problems and will be skipped:</p>
                        <ul className="list-disc pl-5 max-h-24 overflow-y-auto">
                          {csvPreview.result.errors.slice(0, 8).map((e) => <li key={e.line}>Line {e.line} ({e.name}): {e.problems.join('; ')}</li>)}
                        </ul>
                      </div>
                    )}
                  </>
                )}
                <button
                  type="button"
                  disabled={isImporting || csvPreview.result.rows.length === 0}
                  onClick={confirmCsvImport}
                  className="w-full py-2 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white text-xs font-bold cursor-pointer"
                >
                  {isImporting ? 'Importing…' : `Import ${csvPreview.result.rows.length} staff record${csvPreview.result.rows.length === 1 ? '' : 's'}`}
                </button>
                <p className="text-2xs text-subtle">Imports create staff records only. No logins or emails are created.</p>
              </div>
            )}

            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleLoadSampleRoster}
                className="w-full py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-md cursor-pointer transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Load Sample Malaysian Medical Roster</span>
              </button>

              <button
                type="button"
                onClick={() => { setIsImportModalOpen(false); setCsvPreview(null); }}
                className="w-full py-2 bg-surface-accent text-accent text-xs font-bold border border-line cursor-pointer"
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
