import React, { useState, useEffect, useMemo } from 'react';
import {
  X, CheckCircle2, AlertTriangle, ShieldCheck, Download, Plus,
  FileText, Clock, UserCheck, DollarSign, Building, Phone, AlertOctagon, Check
} from 'lucide-react';
import {
  LocumDoctorProfile,
  LocumShiftSession,
  DEFAULT_LOCUM_PROFILES,
  DEFAULT_LOCUM_SHIFTS,
  validateLocumCredentials,
  calculateLocumShiftPayout,
  exportCKAPSLocumAttendanceLedger,
} from '../../domain/locumDoctorSession';

interface LocumDoctorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShiftStarted?: (session: LocumShiftSession) => void;
}

const STORAGE_KEY_PROFILES = 'mediclinic_locum_profiles_v1';
const STORAGE_KEY_SHIFTS = 'mediclinic_locum_shifts_v1';

export default function LocumDoctorModal({
  isOpen,
  onClose,
  onShiftStarted,
}: LocumDoctorModalProps) {
  const [activeTab, setActiveTab] = useState<'active_shift' | 'quick_register' | 'directory' | 'ckaps_ledger'>('active_shift');

  // State
  const [profiles, setProfiles] = useState<LocumDoctorProfile[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PROFILES);
    return saved ? JSON.parse(saved) : DEFAULT_LOCUM_PROFILES;
  });

  const [shifts, setShifts] = useState<LocumShiftSession[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_SHIFTS);
    return saved ? JSON.parse(saved) : DEFAULT_LOCUM_SHIFTS;
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Check-In Form State
  const [selectedLocumId, setSelectedLocumId] = useState<string>(profiles[0]?.id || '');
  const [scheduledHours, setScheduledHours] = useState('4.0');
  const [staffVerifier, setStaffVerifier] = useState('Staff Nurse Aisyah');

  // New Locum Registration State
  const [regName, setRegName] = useState('');
  const [regIc, setRegIc] = useState('');
  const [regMmc, setRegMmc] = useState('MMC-');
  const [regApcYear, setRegApcYear] = useState('2026');
  const [regIndemnityProvider, setRegIndemnityProvider] = useState<'Medefend (MMA)' | 'Medical Protection Society (MPS)' | 'The MDU' | 'Other'>('Medefend (MMA)');
  const [regIndemnityPolicy, setRegIndemnityPolicy] = useState('');
  const [regIndemnityExpiry, setRegIndemnityExpiry] = useState('2026-12-31');
  const [regHourlyRate, setRegHourlyRate] = useState('55.00');
  const [regHospital, setRegHospital] = useState('Hospital Selayang (Medical Officer)');
  const [regPhone, setRegPhone] = useState('+60 12-');
  const [regJpaApproval, setRegJpaApproval] = useState(true);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PROFILES, JSON.stringify(profiles));
  }, [profiles]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SHIFTS, JSON.stringify(shifts));
  }, [shifts]);

  // Find Active Shift
  const activeShift = useMemo(() => shifts.find((s) => s.activeShift), [shifts]);

  // Selected Profile
  const selectedProfile = useMemo(
    () => profiles.find((p) => p.id === selectedLocumId) || profiles[0],
    [profiles, selectedLocumId]
  );

  // Credential validation of selected locum
  const selectedCredCheck = useMemo(() => {
    if (!selectedProfile) return { isValid: false, issues: ['No profile selected'] };
    return validateLocumCredentials(selectedProfile);
  }, [selectedProfile]);

  // Live registration validation check
  const regCredCheck = useMemo(() => {
    const dummy: LocumDoctorProfile = {
      id: 'TEMP',
      fullName: regName,
      icPassport: regIc,
      mmcNumber: regMmc,
      apcYear: parseInt(regApcYear, 10) || 2020,
      apcVerified: true,
      indemnityProvider: regIndemnityProvider,
      indemnityPolicyNo: regIndemnityPolicy,
      indemnityExpiryDate: regIndemnityExpiry,
      hourlyRateMyr: parseFloat(regHourlyRate) || 0,
      primaryPracticePlace: regHospital,
      hasHospitalHeadApproval: regJpaApproval,
      status: 'active',
      phone: regPhone,
    };
    return validateLocumCredentials(dummy);
  }, [regName, regIc, regMmc, regApcYear, regIndemnityProvider, regIndemnityPolicy, regIndemnityExpiry, regHourlyRate, regHospital, regJpaApproval, regPhone]);

  // Handle Start Shift
  const handleStartShift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProfile || !selectedCredCheck.isValid) return;

    const newShift: LocumShiftSession = {
      id: `LSHIFT-${Date.now()}`,
      locumDoctorId: selectedProfile.id,
      doctorName: selectedProfile.fullName,
      mmcNumber: selectedProfile.mmcNumber,
      checkInTime: new Date().toISOString(),
      scheduledHours: parseFloat(scheduledHours) || 4.0,
      actualHoursWorked: parseFloat(scheduledHours) || 4.0,
      hourlyRateMyr: selectedProfile.hourlyRateMyr,
      patientsConsultedCount: 0,
      incentivePerPatientMyr: 0,
      totalPayoutMyr: calculateLocumShiftPayout(parseFloat(scheduledHours) || 4.0, selectedProfile.hourlyRateMyr).totalPayoutMyr,
      paymentStatus: 'pending_approval',
      verifiedByStaff: staffVerifier.trim(),
      activeShift: true,
    };

    setShifts([newShift, ...shifts]);
    if (onShiftStarted) onShiftStarted(newShift);

    setToastMessage(`✓ ${selectedProfile.fullName} checked in for shift (${scheduledHours} hrs)`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Handle End Shift
  const handleEndShift = () => {
    if (!activeShift) return;
    const hours = activeShift.actualHoursWorked;
    const rate = activeShift.hourlyRateMyr;
    const payout = calculateLocumShiftPayout(hours, rate, activeShift.patientsConsultedCount);

    const updatedShifts = shifts.map((s) => {
      if (s.id === activeShift.id) {
        return {
          ...s,
          activeShift: false,
          checkOutTime: new Date().toISOString(),
          totalPayoutMyr: payout.totalPayoutMyr,
          paymentStatus: 'paid_petty_cash' as const,
          paymentReference: `PC-VOUCHER-${Date.now().toString().slice(-6)}`,
        };
      }
      return s;
    });

    setShifts(updatedShifts);
    setToastMessage(`✓ Shift ended for ${activeShift.doctorName}. Payout: RM ${payout.totalPayoutMyr.toFixed(2)} (Petty Cash Voucher generated)`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Handle Register New Locum
  const handleRegisterLocum = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regCredCheck.isValid) return;

    const newProfile: LocumDoctorProfile = {
      id: `LOC-00${profiles.length + 1}`,
      fullName: regName.trim(),
      icPassport: regIc.trim(),
      mmcNumber: regMmc.trim(),
      apcYear: parseInt(regApcYear, 10) || 2026,
      apcVerified: true,
      indemnityProvider: regIndemnityProvider,
      indemnityPolicyNo: regIndemnityPolicy.trim(),
      indemnityExpiryDate: regIndemnityExpiry,
      hourlyRateMyr: parseFloat(regHourlyRate) || 50.0,
      primaryPracticePlace: regHospital.trim(),
      hasHospitalHeadApproval: regJpaApproval,
      status: 'active',
      phone: regPhone.trim(),
    };

    setProfiles([...profiles, newProfile]);
    setSelectedLocumId(newProfile.id);
    setToastMessage(`✓ Registered and credentialed ${newProfile.fullName} (${newProfile.mmcNumber})`);
    setTimeout(() => setToastMessage(null), 4000);
    setActiveTab('active_shift');
  };

  // Export CSV
  const handleExportCsv = () => {
    const csv = exportCKAPSLocumAttendanceLedger(shifts, profiles);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `CKAPS_Locum_Attendance_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-canvas border border-line shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col rounded-none overflow-hidden text-ink">
        {/* Header */}
        <div className="px-6 py-4 bg-canvas-subtle border-b border-line flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand/10 border border-brand/20 text-brand">
              <UserCheck className="w-5 h-5 text-brand" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold tracking-tight text-ink">
                  Locum Doctor MMC Session &amp; Credential Governance
                </h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-brand/15 text-brand border border-brand/30">
                  MMC Guidelines &bull; Act 586 § 14
                </span>
              </div>
              <p className="text-xs text-ink-muted">
                Statutory check-in &bull; Prescriber identity protection &bull; Hourly shift payout calculator
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCsv}
              className="px-2.5 py-1 text-xs font-medium border border-line hover:bg-canvas-subtle text-ink-muted hover:text-ink flex items-center gap-1.5 transition-colors"
              title="Download CKAPS Locum Attendance CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CKAPS Locum CSV</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-ink-muted hover:text-ink hover:bg-canvas-subtle border border-transparent hover:border-line transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Toast */}
        {toastMessage && (
          <div className="bg-brand text-white px-6 py-2 text-xs font-medium flex items-center gap-2 border-b border-brand-accent animate-in slide-in-from-top-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex border-b border-line bg-canvas px-6 gap-2">
          <button
            onClick={() => setActiveTab('active_shift')}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'active_shift'
                ? 'border-brand text-brand'
                : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Active Shift &amp; Sign-In</span>
            {activeShift && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Locum On Duty" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('quick_register')}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'quick_register'
                ? 'border-brand text-brand'
                : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Onboard Visiting Locum</span>
          </button>
          <button
            onClick={() => setActiveTab('directory')}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'directory'
                ? 'border-brand text-brand'
                : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Credentialed Locum Vault ({profiles.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('ckaps_ledger')}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'ckaps_ledger'
                ? 'border-brand text-brand'
                : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>CKAPS Attendance Ledger</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: ACTIVE SHIFT & SIGN-IN */}
          {activeTab === 'active_shift' && (
            <div className="space-y-6">
              {/* If Locum is currently on duty */}
              {activeShift ? (
                <div className="border border-emerald-500/30 bg-emerald-500/10 p-5 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-500/20 px-2 py-0.5 border border-emerald-500/30">
                        Active Consulting Locum On-Duty
                      </span>
                      <h3 className="text-base font-bold text-ink mt-1.5">{activeShift.doctorName}</h3>
                      <p className="text-xs text-ink-muted font-mono">
                        MMC Reg: {activeShift.mmcNumber} &bull; Check-in: {new Date(activeShift.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-ink-muted block uppercase font-mono">Hourly Remuneration</span>
                      <span className="text-lg font-bold font-mono text-ink">RM {activeShift.hourlyRateMyr.toFixed(2)}/hr</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-canvas border border-line text-xs">
                    <div>
                      <span className="text-ink-muted block text-[10px] uppercase">Session Length</span>
                      <span className="font-bold text-ink font-mono">{activeShift.scheduledHours} Hours</span>
                    </div>
                    <div>
                      <span className="text-ink-muted block text-[10px] uppercase">Patients Consulted</span>
                      <span className="font-bold text-ink font-mono">{activeShift.patientsConsultedCount} Patients</span>
                    </div>
                    <div>
                      <span className="text-ink-muted block text-[10px] uppercase">Session Payout</span>
                      <span className="font-bold text-brand font-mono text-sm">RM {activeShift.totalPayoutMyr.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <p className="text-xs text-emerald-800 font-medium">
                      ✓ Prescriptions &amp; MCs are signed under {activeShift.mmcNumber}.
                    </p>
                    <button
                      onClick={handleEndShift}
                      className="px-4 py-2 text-xs font-bold bg-rose-700 text-white hover:bg-rose-800 transition-colors flex items-center gap-1.5"
                    >
                      <DollarSign className="w-4 h-4" />
                      <span>End Shift &amp; Issue Payout Voucher</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* No locum on duty: Quick Check-in form */
                <form onSubmit={handleStartShift} className="border border-line p-5 bg-canvas space-y-4">
                  <div className="border-b border-line pb-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-ink">
                      Check-In Visiting Locum Doctor for Current Shift
                    </h3>
                    <p className="text-xs text-ink-muted mt-0.5">
                      Ensures statutory compliance before the relief doctor opens consultation room doors.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-ink mb-1">
                        Select Approved Locum Doctor
                      </label>
                      <select
                        value={selectedLocumId}
                        onChange={(e) => setSelectedLocumId(e.target.value)}
                        className="w-full text-xs p-2 border border-line bg-canvas text-ink rounded-none focus:outline-none focus:border-brand"
                      >
                        {profiles.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.fullName} ({p.mmcNumber}) &bull; RM {p.hourlyRateMyr}/hr
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-ink mb-1">
                        Scheduled Shift Duration (Hours)
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        value={scheduledHours}
                        onChange={(e) => setScheduledHours(e.target.value)}
                        className="w-full text-xs p-2 border border-line bg-canvas text-ink font-mono rounded-none focus:outline-none focus:border-brand"
                        required
                      />
                    </div>
                  </div>

                  {/* Real-time credential status box */}
                  {selectedProfile && (
                    <div className="p-3 bg-canvas-subtle border border-line text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-ink">Statutory Credential Verification:</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 border ${
                          selectedCredCheck.isValid
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800'
                            : 'bg-rose-500/10 border-rose-500/30 text-rose-800'
                        }`}>
                          {selectedCredCheck.isValid ? '✓ MMC & APC COMPLIANT' : '⚠ CREDENTIALS INVALID'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px] text-ink-muted">
                        <div>
                          <span>APC Year: </span>
                          <span className="font-mono text-ink font-semibold">{selectedProfile.apcYear}</span>
                        </div>
                        <div>
                          <span>Indemnity: </span>
                          <span className="text-ink font-semibold">{selectedProfile.indemnityProvider}</span>
                        </div>
                        <div>
                          <span>Policy Expiry: </span>
                          <span className="font-mono text-ink font-semibold">{selectedProfile.indemnityExpiryDate}</span>
                        </div>
                        <div>
                          <span>Primary Hospital: </span>
                          <span className="text-ink font-semibold truncate block">{selectedProfile.primaryPracticePlace}</span>
                        </div>
                      </div>

                      {selectedCredCheck.issues.length > 0 && (
                        <div className="p-2 bg-rose-50 border border-rose-200 text-rose-800 text-[11px] space-y-1">
                          {selectedCredCheck.issues.map((iss, i) => (
                            <p key={i}>&bull; {iss}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-ink mb-1">
                      Supervising Staff Nurse / Clinic Assistant On Duty
                    </label>
                    <input
                      type="text"
                      value={staffVerifier}
                      onChange={(e) => setStaffVerifier(e.target.value)}
                      className="w-full text-xs p-2 border border-line bg-canvas text-ink rounded-none focus:outline-none focus:border-brand"
                      required
                    />
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={!selectedCredCheck.isValid}
                      className="px-5 py-2 text-xs font-semibold bg-brand text-white hover:bg-brand/90 disabled:opacity-50 transition-colors flex items-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      <span>Start Locum Consulting Session</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* TAB 2: QUICK REGISTER NEW LOCUM */}
          {activeTab === 'quick_register' && (
            <form onSubmit={handleRegisterLocum} className="space-y-6">
              <div className="border border-line bg-canvas-subtle p-4 space-y-1">
                <h3 className="text-xs font-bold uppercase tracking-wider text-ink">
                  Quick 60-Second Visiting Locum Doctor Onboarding
                </h3>
                <p className="text-xs text-ink-muted">
                  Captures mandatory statutory data without cluttering monthly permanent staff payroll or EPF records.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-ink mb-1">Full Legal Name (as per MMC)</label>
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="e.g. Dr. Audrey Lim Pei Shan"
                    className="w-full text-xs p-2 border border-line bg-canvas text-ink rounded-none focus:outline-none focus:border-brand"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">IC / Passport Number</label>
                  <input
                    type="text"
                    value={regIc}
                    onChange={(e) => setRegIc(e.target.value)}
                    placeholder="e.g. 920311-14-6102"
                    className="w-full text-xs p-2 border border-line bg-canvas text-ink font-mono rounded-none focus:outline-none focus:border-brand"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">MMC Registration Number</label>
                  <input
                    type="text"
                    value={regMmc}
                    onChange={(e) => setRegMmc(e.target.value)}
                    placeholder="e.g. MMC-65490"
                    className="w-full text-xs p-2 border border-line bg-canvas text-ink font-mono rounded-none focus:outline-none focus:border-brand"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Current APC Year</label>
                  <input
                    type="number"
                    value={regApcYear}
                    onChange={(e) => setRegApcYear(e.target.value)}
                    className="w-full text-xs p-2 border border-line bg-canvas text-ink font-mono rounded-none focus:outline-none focus:border-brand"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Agreed Hourly Rate (MYR)</label>
                  <input
                    type="number"
                    step="5"
                    value={regHourlyRate}
                    onChange={(e) => setRegHourlyRate(e.target.value)}
                    className="w-full text-xs p-2 border border-line bg-canvas text-ink font-mono rounded-none focus:outline-none focus:border-brand"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Indemnity Provider</label>
                  <select
                    value={regIndemnityProvider}
                    onChange={(e) => setRegIndemnityProvider(e.target.value as any)}
                    className="w-full text-xs p-2 border border-line bg-canvas text-ink rounded-none focus:outline-none focus:border-brand"
                  >
                    <option value="Medefend (MMA)">Medefend (MMA Insurance)</option>
                    <option value="Medical Protection Society (MPS)">Medical Protection Society (MPS)</option>
                    <option value="The MDU">The MDU</option>
                    <option value="Other">Other Approved Insurer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Indemnity Policy Number</label>
                  <input
                    type="text"
                    value={regIndemnityPolicy}
                    onChange={(e) => setRegIndemnityPolicy(e.target.value)}
                    placeholder="e.g. MPS-MY-99210-26"
                    className="w-full text-xs p-2 border border-line bg-canvas text-ink font-mono rounded-none focus:outline-none focus:border-brand"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Policy Expiry Date</label>
                  <input
                    type="date"
                    value={regIndemnityExpiry}
                    onChange={(e) => setRegIndemnityExpiry(e.target.value)}
                    className="w-full text-xs p-2 border border-line bg-canvas text-ink font-mono rounded-none focus:outline-none focus:border-brand"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Primary Hospital / Practice Place</label>
                  <input
                    type="text"
                    value={regHospital}
                    onChange={(e) => setRegHospital(e.target.value)}
                    className="w-full text-xs p-2 border border-line bg-canvas text-ink rounded-none focus:outline-none focus:border-brand"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Contact Phone Number</label>
                  <input
                    type="text"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    className="w-full text-xs p-2 border border-line bg-canvas text-ink font-mono rounded-none focus:outline-none focus:border-brand"
                    required
                  />
                </div>
              </div>

              <div className="border border-line p-3 bg-canvas-subtle">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={regJpaApproval}
                    onChange={(e) => setRegJpaApproval(e.target.checked)}
                    className="rounded-none text-brand focus:ring-0"
                  />
                  <div>
                    <span className="text-xs font-bold text-ink block">Public Sector HOD Permission Verified</span>
                    <span className="text-[10px] text-ink-muted">
                      Confirms *Kebenaran Berkhidmat di Luar Waktu Pejabat* under JPA regulations if serving in a government hospital.
                    </span>
                  </div>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="submit"
                  disabled={!regCredCheck.isValid}
                  className="px-5 py-2 text-xs font-semibold bg-brand text-white hover:bg-brand/90 disabled:opacity-50 transition-colors flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Locum to Approved Vault</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: CREDENTIALED LOCUM VAULT */}
          {activeTab === 'directory' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-ink">
                  Approved Locum Practitioners ({profiles.length})
                </h3>
                <button
                  onClick={() => setActiveTab('quick_register')}
                  className="px-3 py-1 text-xs font-semibold bg-brand text-white hover:bg-brand/90 transition-colors flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Locum</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {profiles.map((doc) => {
                  const check = validateLocumCredentials(doc);
                  return (
                    <div key={doc.id} className="border border-line bg-canvas p-4 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-xs font-bold text-ink">{doc.fullName}</h4>
                          <span className="text-[10px] text-ink-muted font-mono">{doc.mmcNumber} &bull; APC {doc.apcYear}</span>
                        </div>
                        <span className={`text-[10px] font-bold px-1.5 py-0.2 border ${
                          check.isValid
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800'
                            : 'bg-rose-500/10 border-rose-500/30 text-rose-800'
                        }`}>
                          {check.isValid ? 'ACTIVE' : 'EXPIRED'}
                        </span>
                      </div>

                      <div className="text-[11px] text-ink-muted space-y-0.5 pt-1 border-t border-line">
                        <div><span>Indemnity: </span><span className="text-ink font-medium">{doc.indemnityProvider} (Exp: {doc.indemnityExpiryDate})</span></div>
                        <div><span>Hospital: </span><span className="text-ink font-medium">{doc.primaryPracticePlace}</span></div>
                        <div><span>Rate: </span><span className="text-brand font-bold font-mono">RM {doc.hourlyRateMyr.toFixed(2)}/hr</span></div>
                      </div>

                      <div className="pt-2 flex justify-end">
                        <button
                          onClick={() => {
                            setSelectedLocumId(doc.id);
                            setActiveTab('active_shift');
                          }}
                          className="px-3 py-1 text-xs font-medium border border-line bg-canvas hover:bg-canvas-subtle text-ink"
                        >
                          Check In to Shift
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: CKAPS ATTENDANCE LEDGER */}
          {activeTab === 'ckaps_ledger' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-ink">
                    CKAPS Locum Attendance &amp; Shift Register
                  </h3>
                  <p className="text-xs text-ink-muted">
                    Official log demanded by Ministry of Health inspectors during Act 586 clinic audits.
                  </p>
                </div>
                <button
                  onClick={handleExportCsv}
                  className="px-3 py-1.5 text-xs font-semibold bg-brand text-white hover:bg-brand/90 transition-colors flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download CKAPS CSV</span>
                </button>
              </div>

              <div className="border border-line overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-canvas-subtle border-b border-line text-ink-muted font-medium text-[11px]">
                      <th className="p-2.5">Session ID</th>
                      <th className="p-2.5">Locum Doctor</th>
                      <th className="p-2.5">Check-In</th>
                      <th className="p-2.5 text-right">Hours</th>
                      <th className="p-2.5 text-right">Rate</th>
                      <th className="p-2.5 text-right">Patients</th>
                      <th className="p-2.5 text-right">Payout (MYR)</th>
                      <th className="p-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line font-mono text-[11px]">
                    {shifts.map((s) => (
                      <tr key={s.id} className="hover:bg-canvas-subtle/50">
                        <td className="p-2.5 text-ink-muted">{s.id}</td>
                        <td className="p-2.5 font-sans font-medium text-ink">
                          {s.doctorName}
                          <span className="block text-[10px] text-ink-muted font-mono">{s.mmcNumber}</span>
                        </td>
                        <td className="p-2.5 font-sans text-ink-muted">{new Date(s.checkInTime).toLocaleString()}</td>
                        <td className="p-2.5 text-right text-ink">{s.actualHoursWorked.toFixed(1)}</td>
                        <td className="p-2.5 text-right text-ink">RM {s.hourlyRateMyr.toFixed(2)}</td>
                        <td className="p-2.5 text-right text-ink font-bold">{s.patientsConsultedCount}</td>
                        <td className="p-2.5 text-right font-bold text-brand">RM {s.totalPayoutMyr.toFixed(2)}</td>
                        <td className="p-2.5 font-sans">
                          <span className={`px-2 py-0.5 border text-[10px] font-bold ${
                            s.activeShift
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 animate-pulse'
                              : 'bg-canvas-subtle border-line text-ink-muted'
                          }`}>
                            {s.activeShift ? 'ON DUTY' : s.paymentStatus.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-canvas-subtle border-t border-line flex items-center justify-between text-xs text-ink-muted">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-brand" />
            <span>MMC Ethical Code &bull; Private Healthcare Facilities &amp; Services Act 1998 (Act 586)</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold border border-line bg-canvas hover:bg-canvas-subtle text-ink transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
