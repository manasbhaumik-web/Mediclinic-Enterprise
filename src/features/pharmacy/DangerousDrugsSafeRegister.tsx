import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldAlert, ShieldCheck, Lock, Key, AlertTriangle, FileSpreadsheet,
  Plus, CheckCircle2, Search, Filter, ArrowUpRight, ArrowDownLeft,
  Trash2, RefreshCw, Scale, History, UserCheck, ExternalLink, Info
} from 'lucide-react';
import {
  DDADrugItem,
  DDALedgerTransaction,
  DEFAULT_DDA_DRUGS,
  INITIAL_DDA_TRANSACTIONS,
  calculateRunningBalance,
  validateDualAuthorization,
  evaluatePhysicalDiscrepancy,
  exportDDALedgerCsv,
} from '../../domain/dangerousDrugsDDA';
import { maskICNumber } from '../../utils/piiMasker';
import { useAuth } from '../../context/AuthContext';
import { StationTabs } from '../../components/ui/StationChrome';

interface DangerousDrugsSafeRegisterProps {
  clinicName?: string;
  currentStaffName?: string;
}

const STORAGE_KEY_DRUGS = 'mediclinic_dda_drugs_v1';
const STORAGE_KEY_TX = 'mediclinic_dda_tx_v1';

export default function DangerousDrugsSafeRegister({
  clinicName = 'Mediclinic Enterprise',
  currentStaffName = 'Pharm. Ahmad Razak',
}: DangerousDrugsSafeRegisterProps) {
  const { showPII } = useAuth();
  const [activeTab, setActiveTab] = useState<'balance' | 'withdraw' | 'inward' | 'ledger' | 'physical_audit'>('balance');

  // Persistence State
  const [drugs, setDrugs] = useState<DDADrugItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_DRUGS);
    return saved ? JSON.parse(saved) : DEFAULT_DDA_DRUGS;
  });

  const [transactions, setTransactions] = useState<DDALedgerTransaction[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_TX);
    return saved ? JSON.parse(saved) : INITIAL_DDA_TRANSACTIONS;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_DRUGS, JSON.stringify(drugs));
  }, [drugs]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_TX, JSON.stringify(transactions));
  }, [transactions]);

  // Form State: Outward Patient Withdrawal (Dual-Auth)
  const [selectedDrugId, setSelectedDrugId] = useState(drugs[0]?.id || '');
  const [patientName, setPatientName] = useState('');
  const [patientIc, setPatientIc] = useState('');
  const [encounterRef, setEncounterRef] = useState('');
  const [qtyOut, setQtyOut] = useState('1');
  const [qtyWastage, setQtyWastage] = useState('0');
  const [batchNo, setBatchNo] = useState('BAT-2026-X01');
  const [expiryDate, setExpiryDate] = useState('2028-12-31');
  const [prescribingDoctorName, setPrescribingDoctorName] = useState('Dr. Sarah Farhana');
  const [prescribingDoctorMMC, setPrescribingDoctorMMC] = useState('MMC-58291');
  const [custodianName, setCustodianName] = useState(currentStaffName);
  const [dualWitnessName, setDualWitnessName] = useState('Staff Nurse Aisyah');
  const [dualWitnessId, setDualWitnessId] = useState('STF-CA-01');
  const [clinicalReason, setClinicalReason] = useState('Acute severe analgesia / procedural sedation.');

  // Form State: Inward Supplier Receipt
  const [inwardDrugId, setInwardDrugId] = useState(drugs[0]?.id || '');
  const [inwardInvoice, setInwardInvoice] = useState('');
  const [inwardBatch, setInwardBatch] = useState('');
  const [inwardExpiry, setInwardExpiry] = useState('2028-12-31');
  const [inwardQty, setInwardQty] = useState('10');
  const [inwardSupplier, setInwardSupplier] = useState('DKSH Malaysia Sdn Bhd');

  // Form State: Physical Count Audit
  const [auditDrugId, setAuditDrugId] = useState(drugs[0]?.id || '');
  const [physicalCountInput, setPhysicalCountInput] = useState('');
  const [auditNotes, setAuditNotes] = useState('');
  const [auditResult, setAuditResult] = useState<{
    discrepancy: number;
    isDiscrepancy: boolean;
    severity: 'ok' | 'minor' | 'statutory_alert';
    message: string;
  } | null>(null);

  const selectedDrug = useMemo(() => drugs.find((d) => d.id === selectedDrugId) || drugs[0], [drugs, selectedDrugId]);
  const auditTargetDrug = useMemo(() => drugs.find((d) => d.id === auditDrugId) || drugs[0], [drugs, auditDrugId]);

  // Handle Outward Withdrawal
  const handleWithdrawal = (e: React.FormEvent) => {
    e.preventDefault();
    const numOut = parseInt(qtyOut) || 0;
    const numWaste = parseInt(qtyWastage) || 0;

    const dualAuth = validateDualAuthorization({
      doctorName: prescribingDoctorName,
      doctorMMC: prescribingDoctorMMC,
      custodianName,
      dualWitnessName,
    });

    if (!dualAuth.isValid) {
      alert(dualAuth.error);
      return;
    }

    const calc = calculateRunningBalance(selectedDrug.currentStock, 'OUTWARD_PATIENT', 0, numOut, numWaste);
    if (!calc.isValid) {
      alert(calc.error);
      return;
    }

    const newTx: DDALedgerTransaction = {
      id: `DDA-TX-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`,
      drugId: selectedDrug.id,
      drugName: selectedDrug.drugName,
      transactionType: 'OUTWARD_PATIENT',
      timestamp: new Date().toISOString(),
      referenceNo: encounterRef.trim() || `ENC-${Date.now().toString(36).toUpperCase()}`,
      batchNo: batchNo.trim(),
      expiryDate,
      quantityIn: 0,
      quantityOut: numOut,
      quantityWastage: numWaste,
      runningBalance: calc.newBalance,
      patientName: patientName.trim(),
      patientIc: patientIc.trim(),
      prescribingDoctorName: prescribingDoctorName.trim(),
      prescribingDoctorMMC: prescribingDoctorMMC.trim(),
      custodianStaffName: custodianName.trim(),
      custodianStaffRole: 'pharmacist',
      dualWitnessStaffName: dualWitnessName.trim(),
      dualWitnessStaffId: dualWitnessId.trim(),
      reasonOrNotes: clinicalReason.trim(),
    };

    // Update drug stock
    setDrugs((prev) =>
      prev.map((d) => (d.id === selectedDrug.id ? { ...d, currentStock: calc.newBalance } : d))
    );

    setTransactions((prev) => [newTx, ...prev]);
    setToastMessage(`✓ Dispensed ${numOut} ${selectedDrug.unit} of ${selectedDrug.drugName}. Running Safe Balance: ${calc.newBalance}.`);
    setTimeout(() => setToastMessage(null), 4000);

    // Reset fields
    setPatientName('');
    setPatientIc('');
    setEncounterRef('');
    setActiveTab('ledger');
  };

  // Handle Inward Stock Receipt
  const handleInwardReceipt = (e: React.FormEvent) => {
    e.preventDefault();
    const numIn = parseInt(inwardQty) || 0;
    const targetDrug = drugs.find((d) => d.id === inwardDrugId) || drugs[0];

    const calc = calculateRunningBalance(targetDrug.currentStock, 'INWARD_PURCHASE', numIn, 0, 0);
    if (!calc.isValid) {
      alert(calc.error);
      return;
    }

    const newTx: DDALedgerTransaction = {
      id: `DDA-TX-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`,
      drugId: targetDrug.id,
      drugName: targetDrug.drugName,
      transactionType: 'INWARD_PURCHASE',
      timestamp: new Date().toISOString(),
      referenceNo: inwardInvoice.trim() || `INV-${Date.now().toString().slice(-6)}`,
      batchNo: inwardBatch.trim() || 'BAT-RESTOCK',
      expiryDate: inwardExpiry,
      quantityIn: numIn,
      quantityOut: 0,
      quantityWastage: 0,
      runningBalance: calc.newBalance,
      prescribingDoctorName: prescribingDoctorName.trim(),
      prescribingDoctorMMC: prescribingDoctorMMC.trim(),
      custodianStaffName: custodianName.trim(),
      custodianStaffRole: 'pharmacist',
      dualWitnessStaffName: dualWitnessName.trim(),
      dualWitnessStaffId: dualWitnessId.trim(),
      reasonOrNotes: `Received from wholesale distributor ${inwardSupplier.trim()} under Poison Wholesale License.`,
    };

    setDrugs((prev) =>
      prev.map((d) => (d.id === targetDrug.id ? { ...d, currentStock: calc.newBalance } : d))
    );

    setTransactions((prev) => [newTx, ...prev]);
    setToastMessage(`✓ Received +${numIn} ${targetDrug.unit} of ${targetDrug.drugName}. New Balance: ${calc.newBalance}.`);
    setTimeout(() => setToastMessage(null), 4000);

    setInwardInvoice('');
    setInwardBatch('');
    setActiveTab('balance');
  };

  // Handle Physical Audit Check
  const handlePhysicalAuditEvaluate = (e: React.FormEvent) => {
    e.preventDefault();
    const count = parseInt(physicalCountInput);
    if (isNaN(count) || count < 0) return;

    const evaluation = evaluatePhysicalDiscrepancy(auditTargetDrug.currentStock, count);
    setAuditResult(evaluation);
  };

  const handleApplyPhysicalReconciliation = () => {
    if (!auditResult) return;
    const count = parseInt(physicalCountInput);

    const calc = calculateRunningBalance(auditTargetDrug.currentStock, 'PHYSICAL_ADJUSTMENT', count, 0, 0);
    const newTx: DDALedgerTransaction = {
      id: `DDA-AUDIT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`,
      drugId: auditTargetDrug.id,
      drugName: auditTargetDrug.drugName,
      transactionType: 'PHYSICAL_ADJUSTMENT',
      timestamp: new Date().toISOString(),
      referenceNo: `AUDIT-REG18-${new Date().toISOString().slice(0, 10)}`,
      batchNo: 'AUDIT-COUNT',
      expiryDate: '2028-12-31',
      quantityIn: count,
      quantityOut: 0,
      quantityWastage: 0,
      runningBalance: count,
      prescribingDoctorName: prescribingDoctorName.trim(),
      prescribingDoctorMMC: prescribingDoctorMMC.trim(),
      custodianStaffName: custodianName.trim(),
      custodianStaffRole: 'pharmacist',
      dualWitnessStaffName: dualWitnessName.trim(),
      dualWitnessStaffId: dualWitnessId.trim(),
      reasonOrNotes: `Routine physical safe stocktake reconciliation (DDA Reg 18). ${auditResult.message} ${auditNotes.trim()}`,
    };

    setDrugs((prev) =>
      prev.map((d) => (d.id === auditTargetDrug.id ? { ...d, currentStock: count } : d))
    );

    setTransactions((prev) => [newTx, ...prev]);
    setToastMessage(`✓ Reconciled physical stock for ${auditTargetDrug.drugName} to ${count} ${auditTargetDrug.unit}.`);
    setTimeout(() => setToastMessage(null), 4000);
    setAuditResult(null);
    setPhysicalCountInput('');
    setAuditNotes('');
    setActiveTab('ledger');
  };

  const handleExportCsv = () => {
    const csv = exportDDALedgerCsv(transactions);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `DDA_Safe_Register_MOH_BPF_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setToastMessage(`✓ Exported ${transactions.length} DDA Safe transactions in official MOH BPF inspection format.`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const filteredTransactions = useMemo(() => {
    if (!searchQuery.trim()) return transactions;
    const q = searchQuery.toLowerCase();
    return transactions.filter(
      (t) =>
        t.drugName.toLowerCase().includes(q) ||
        (t.patientName && t.patientName.toLowerCase().includes(q)) ||
        (t.patientIc && t.patientIc.toLowerCase().includes(q)) ||
        t.referenceNo.toLowerCase().includes(q) ||
        t.prescribingDoctorName.toLowerCase().includes(q)
    );
  }, [transactions, searchQuery]);

  return (
    <div className="space-y-4 animate-fadeIn font-sans">
      {/* Toast Alert */}
      {toastMessage && (
        <div role="status" className="fixed top-20 right-6 z-50 bg-primary text-white px-5 py-3 border border-line rounded-none flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-teal-200" aria-hidden="true" />
          <span className="text-sm font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Title block */}
      <section aria-labelledby="dda-title" className="bg-surface border border-line px-6 py-5 flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0 flex-[1_1_28rem]">
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 id="dda-title" className="text-xl font-bold tracking-tight text-ink">Dangerous drugs safe register</h2>
            <span className="px-2.5 py-0.5 bg-surface-strong text-accent text-xs font-bold">Akta Dadah Berbahaya 1952 (Act 234)</span>
          </div>
          <p className="mt-1.5 text-sm text-muted leading-relaxed max-w-3xl">
            Perpetual inventory of dangerous drugs, with two-person sign-off on withdrawals, wastage logging and physical count checks.
          </p>
          <p className="mt-1.5 text-xs text-muted">This register is kept on this device only. For the audited database register, use Controlled register under Inventory.</p>
        </div>
        <button type="button" onClick={handleExportCsv} className="btn-primary min-h-12 px-6 text-sm" title="Export official ledger in MOH Pharmacy Enforcement Division format">
          <FileSpreadsheet className="w-4 h-4" aria-hidden="true" />
          Export MOH audit CSV
        </button>
      </section>

      <StationTabs<'balance' | 'withdraw' | 'inward' | 'ledger' | 'physical_audit'>
        label="Dangerous drugs register sections"
        active={activeTab}
        onChange={setActiveTab}
        tabs={[
          { id: 'balance', label: 'Safe inventory' },
          { id: 'withdraw', label: 'Withdrawal (two-person)' },
          { id: 'inward', label: 'Stock receipt' },
          { id: 'ledger', label: 'Ledger', count: transactions.length },
          { id: 'physical_audit', label: 'Physical count audit' },
        ]}
      />

      {/* TAB 1: SAFE BALANCE */}
      {activeTab === 'balance' && (
        <div className="space-y-4">
          <div className="bg-surface-muted p-4 border border-line flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-ink">
                Dangerous Drugs Storage Compliance (Regulation 8, DDA 1952)
              </h3>
              <p className="text-xs text-muted mt-1 leading-relaxed max-w-3xl">
                All scheduled dangerous drugs must be kept in a locked receptacle or steel safe securely affixed to the floor or wall.
                Keys are restricted to the registered medical practitioner or licensed pharmacist.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('withdraw')}
              className="bg-primary hover:bg-primary-hover text-white text-xs font-bold px-4 py-2 rounded-none border border-primary flex items-center gap-2 cursor-pointer  shrink-0"
            >
              <Key className="w-3.5 h-3.5" />
              <span>Unlock &amp; Withdraw Drug</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {drugs.map((drug) => {
              const isLow = drug.currentStock <= drug.minThreshold;
              return (
                <div key={drug.id} className="border border-line bg-surface p-4 flex flex-col justify-between  space-y-3">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-2xs tabular-nums font-bold text-muted uppercase">{drug.id}</span>
                        <h4 className="text-sm font-bold text-ink mt-0.5">{drug.drugName}</h4>
                        <p className="text-2xs text-muted tabular-nums">{drug.schedule}</p>
                      </div>
                      <span
                        className={`px-2 py-0.5 text-xs font-bold border ${
                          isLow
                            ? 'bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-200'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200'
                        }`}
                      >
                        {isLow ? 'Low Stock Warning' : 'Safe Stock OK'}
                      </span>
                    </div>

                    <div className="mt-4 p-3 bg-surface-muted border border-slate-200 dark:border-slate-800 space-y-1.5 text-xs">
                      <div className="flex justify-between items-baseline">
                        <span className="text-muted text-2xs font-bold uppercase">Safe Balance:</span>
                        <span className="tabular-nums text-base font-black text-ink">
                          {drug.currentStock} <span className="text-xs font-medium text-muted">{drug.unit}</span>
                        </span>
                      </div>
                      <div className="flex justify-between text-2xs">
                        <span className="text-muted">Safe Location:</span>
                        <span className="font-medium text-ink truncate max-w-[170px]">{drug.safeCabinetLocation}</span>
                      </div>
                      <div className="flex justify-between text-2xs">
                        <span className="text-muted">Min Threshold:</span>
                        <span className="tabular-nums">{drug.minThreshold} {drug.unit}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-line flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDrugId(drug.id);
                        setActiveTab('withdraw');
                      }}
                      className="text-xs font-bold text-accent hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>Withdraw Out</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setInwardDrugId(drug.id);
                        setActiveTab('inward');
                      }}
                      className="text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>Restock In</span>
                      <ArrowDownLeft className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: WITHDRAW DRUG (DUAL-AUTH) */}
      {activeTab === 'withdraw' && (
        <form onSubmit={handleWithdrawal} className="border border-line bg-surface p-6 space-y-6 ">
          <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 p-4 flex items-start gap-3">
            <Lock className="w-5 h-5 text-rose-700 shrink-0 mt-0.5" />
            <div className="text-xs text-rose-900 dark:text-rose-200 leading-relaxed">
              <p className="font-bold">Dangerous Drugs Statutory Dual-Authorization Lock (DDA 1952 § 12)</p>
              Under Malaysian law, no dangerous drug may be removed from the safe without a verified medical prescription
              and dual sign-off from both the attending Registered Medical Practitioner and the dispensing custodian.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-ink">Select Controlled Drug *</label>
              <select
                value={selectedDrugId}
                onChange={(e) => setSelectedDrugId(e.target.value)}
                className="w-full bg-surface border border-line text-ink min-h-11 text-sm px-3 rounded-none outline-none focus:border-brand focus:ring-2 focus:ring-accent font-bold "
              >
                {drugs.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.drugName} (Available: {d.currentStock} {d.unit})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-ink">Quantity Administered to Patient *</label>
              <input
                type="number"
                min="1"
                max={selectedDrug.currentStock}
                value={qtyOut}
                onChange={(e) => setQtyOut(e.target.value)}
                className="w-full bg-surface border border-line text-ink min-h-11 text-sm tabular-nums px-3 rounded-none outline-none focus:border-brand focus:ring-2 focus:ring-accent"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-ink">Partial Dose Wastage / Discarded Quantity</label>
              <input
                type="number"
                min="0"
                value={qtyWastage}
                onChange={(e) => setQtyWastage(e.target.value)}
                className="w-full bg-surface border border-line text-ink min-h-11 text-sm tabular-nums px-3 rounded-none outline-none focus:border-brand focus:ring-2 focus:ring-accent"
                placeholder="e.g. 0 if full ampoule used"
              />
              <span className="text-2xs text-muted">e.g. Residual dose discarded in sharps container.</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-ink">Patient Full Name *</label>
              <input
                type="text"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                className="w-full bg-surface border border-line text-ink min-h-11 text-sm px-3 rounded-none outline-none focus:border-brand focus:ring-2 focus:ring-accent"
                placeholder="e.g. En. Kamal bin Hassan"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-ink">Patient NRIC / Passport *</label>
              <input
                type="text"
                value={patientIc}
                onChange={(e) => setPatientIc(e.target.value)}
                className="w-full bg-surface border border-line text-ink min-h-11 text-sm px-3 rounded-none outline-none focus:border-brand focus:ring-2 focus:ring-accent tabular-nums"
                placeholder="YYMMDD-XX-XXXX"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-ink">Encounter / Case Reference</label>
              <input
                type="text"
                value={encounterRef}
                onChange={(e) => setEncounterRef(e.target.value)}
                className="w-full bg-surface border border-line text-ink min-h-11 text-sm px-3 rounded-none outline-none focus:border-brand focus:ring-2 focus:ring-accent tabular-nums"
                placeholder="e.g. ENC-20261101-081"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-ink">Batch / Lot Number *</label>
              <input
                type="text"
                value={batchNo}
                onChange={(e) => setBatchNo(e.target.value)}
                className="w-full bg-surface border border-line text-ink min-h-11 text-sm px-3 rounded-none outline-none focus:border-brand focus:ring-2 focus:ring-accent tabular-nums"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-ink">Expiry Date *</label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full bg-surface border border-line text-ink min-h-11 text-sm px-3 rounded-none outline-none focus:border-brand focus:ring-2 focus:ring-accent tabular-nums"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-ink">Clinical Indication / Diagnosis *</label>
              <input
                type="text"
                value={clinicalReason}
                onChange={(e) => setClinicalReason(e.target.value)}
                className="w-full bg-surface border border-line text-ink min-h-11 text-sm px-3 rounded-none outline-none focus:border-brand focus:ring-2 focus:ring-accent"
                placeholder="e.g. Acute renal colic / post-op pain"
                required
              />
            </div>
          </div>

          {/* DUAL AUTHORIZATION SIGN-OFF BOX */}
          <div className="border-2 border-line bg-surface-muted p-4 space-y-3">
            <h4 className="text-base font-bold text-ink flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-accent" />
              <span>Mandatory Dual Electronic Authentication</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-2xs font-bold text-muted">Authorizing Medical Practitioner (Doctor) *</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={prescribingDoctorName}
                    onChange={(e) => setPrescribingDoctorName(e.target.value)}
                    className="w-full bg-surface border border-line text-ink min-h-11 text-sm px-3 rounded-none outline-none focus:border-brand focus:ring-2 focus:ring-accent"
                    placeholder="Doctor Name"
                    required
                  />
                  <input
                    type="text"
                    value={prescribingDoctorMMC}
                    onChange={(e) => setPrescribingDoctorMMC(e.target.value)}
                    className="w-full bg-surface border border-line text-ink min-h-11 text-sm px-3 rounded-none outline-none focus:border-brand focus:ring-2 focus:ring-accent tabular-nums"
                    placeholder="MMC Number"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-2xs font-bold text-muted">Dispensing Custodian / Witness *</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={custodianName}
                    onChange={(e) => setCustodianName(e.target.value)}
                    className="w-full bg-surface border border-line text-ink min-h-11 text-sm px-3 rounded-none outline-none focus:border-brand focus:ring-2 focus:ring-accent"
                    placeholder="Custodian Name"
                    required
                  />
                  <input
                    type="text"
                    value={dualWitnessName}
                    onChange={(e) => setDualWitnessName(e.target.value)}
                    className="w-full bg-surface border border-line text-ink min-h-11 text-sm px-3 rounded-none outline-none focus:border-brand focus:ring-2 focus:ring-accent"
                    placeholder="Witness Name"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-line">
            <button
              type="button"
              onClick={() => setActiveTab('balance')}
              className="btn-secondary px-5 text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary min-h-12 px-6 text-sm "
            >
              <Key className="w-4 h-4" />
              <span>Authorize &amp; Record Safe Withdrawal</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 3: INWARD STOCK RECEIPT */}
      {activeTab === 'inward' && (
        <form onSubmit={handleInwardReceipt} className="border border-line bg-surface p-6 space-y-6 ">
          <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-4 flex items-start gap-3">
            <ArrowDownLeft className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-900 dark:text-emerald-200 leading-relaxed">
              <p className="font-bold">Dangerous Drugs Wholesale Inward Intake (DDA 1952 § 14)</p>
              Record newly delivered controlled substances from licensed pharmaceutical wholesalers. Verify wholesale delivery invoice,
              batch seals, and tamper-evident packaging before updating the perpetual safe ledger.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-ink">Controlled Drug *</label>
              <select
                value={inwardDrugId}
                onChange={(e) => setInwardDrugId(e.target.value)}
                className="w-full bg-surface border border-line text-ink min-h-11 text-sm px-3 rounded-none outline-none focus:border-brand focus:ring-2 focus:ring-accent font-bold"
              >
                {drugs.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.drugName} (Current: {d.currentStock} {d.unit})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-ink">Quantity Received *</label>
              <input
                type="number"
                min="1"
                value={inwardQty}
                onChange={(e) => setInwardQty(e.target.value)}
                className="w-full bg-surface border border-line text-ink min-h-11 text-sm tabular-nums px-3 rounded-none outline-none focus:border-brand focus:ring-2 focus:ring-accent"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-ink">Licensed Wholesaler / Distributor *</label>
              <input
                type="text"
                value={inwardSupplier}
                onChange={(e) => setInwardSupplier(e.target.value)}
                className="w-full bg-surface border border-line text-ink min-h-11 text-sm px-3 rounded-none outline-none focus:border-brand focus:ring-2 focus:ring-accent"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-ink">Supplier Wholesale Invoice Number *</label>
              <input
                type="text"
                value={inwardInvoice}
                onChange={(e) => setInwardInvoice(e.target.value)}
                placeholder="e.g. INV-DKSH-99201"
                className="w-full bg-surface border border-line text-ink min-h-11 text-sm px-3 rounded-none outline-none focus:border-brand focus:ring-2 focus:ring-accent tabular-nums"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-ink">Manufacturer Batch / Lot Number *</label>
              <input
                type="text"
                value={inwardBatch}
                onChange={(e) => setInwardBatch(e.target.value)}
                placeholder="e.g. BAT-MOR-2026C"
                className="w-full bg-surface border border-line text-ink min-h-11 text-sm px-3 rounded-none outline-none focus:border-brand focus:ring-2 focus:ring-accent tabular-nums"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-ink">Expiration Date *</label>
              <input
                type="date"
                value={inwardExpiry}
                onChange={(e) => setInwardExpiry(e.target.value)}
                className="w-full bg-surface border border-line text-ink min-h-11 text-sm px-3 rounded-none outline-none focus:border-brand focus:ring-2 focus:ring-accent tabular-nums"
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-line">
            <button
              type="button"
              onClick={() => setActiveTab('balance')}
              className="btn-secondary px-5 text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary min-h-12 px-6 text-sm "
            >
              <ArrowDownLeft className="w-4 h-4" />
              <span>Record Wholesaler Inward Stock</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 4: PERPETUAL LEDGER TRANSACTIONS */}
      {activeTab === 'ledger' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-muted absolute left-3.5 top-3.5 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search drug, patient, doctor, or invoice..."
                className="w-full min-h-11 pl-10 pr-3 text-sm border border-line bg-surface text-ink rounded-none outline-none focus:border-brand focus:ring-2 focus:ring-accent"
              />
            </div>

            <button
              type="button"
              onClick={handleExportCsv}
              className="px-3.5 py-2 text-xs font-bold bg-surface hover:bg-surface-accent text-ink border border-line flex items-center gap-1.5 cursor-pointer  self-start"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-accent" />
              <span>Export CSV</span>
            </button>
          </div>

          <div className="border border-line overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-line text-2xs uppercase tracking-wider text-muted font-bold">
                <tr>
                  <th className="p-3">Date Time</th>
                  <th className="p-3">Drug Name</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Ref / Invoice / Case</th>
                  <th className="p-3">Qty In</th>
                  <th className="p-3">Qty Out</th>
                  <th className="p-3">Wastage</th>
                  <th className="p-3">Running Balance</th>
                  <th className="p-3">Patient / Doctor / Signatures</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20">
                    <td className="p-3 whitespace-nowrap tabular-nums text-2xs">
                      {new Date(tx.timestamp).toLocaleDateString('en-GB')} {new Date(tx.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="p-3">
                      <span className="font-bold text-ink">{tx.drugName}</span>
                      <span className="block text-2xs text-muted tabular-nums">{tx.batchNo} (Exp: {tx.expiryDate})</span>
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 text-xs font-bold border ${
                          tx.transactionType === 'INWARD_PURCHASE'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300'
                            : tx.transactionType === 'OUTWARD_PATIENT'
                            ? 'bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300'
                            : 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        {tx.transactionType.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-3 tabular-nums text-2xs">{tx.referenceNo}</td>
                    <td className="p-3 tabular-nums font-semibold text-emerald-700 dark:text-emerald-300">
                      {tx.quantityIn > 0 ? `+${tx.quantityIn}` : '-'}
                    </td>
                    <td className="p-3 tabular-nums font-semibold text-rose-700 dark:text-rose-300">
                      {tx.quantityOut > 0 ? `-${tx.quantityOut}` : '-'}
                    </td>
                    <td className="p-3 tabular-nums text-2xs text-amber-700 dark:text-amber-300">
                      {tx.quantityWastage > 0 ? `${tx.quantityWastage}` : '-'}
                    </td>
                    <td className="p-3 tabular-nums font-bold text-ink bg-slate-50/50 dark:bg-slate-900/30">
                      {tx.runningBalance}
                    </td>
                    <td className="p-3 text-2xs">
                      {tx.patientName && (
                        <div className="font-medium text-ink">
                          Pt: {tx.patientName} {tx.patientIc && `(${showPII ? tx.patientIc : maskICNumber(tx.patientIc)})`}
                        </div>
                      )}
                      <div className="text-muted">
                        Doc: Dr. {tx.prescribingDoctorName} ({tx.prescribingDoctorMMC})
                      </div>
                      <div className="text-muted">
                        Auth: {tx.custodianStaffName} {tx.dualWitnessStaffName && `· Wit: ${tx.dualWitnessStaffName}`}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: PHYSICAL COUNT AUDIT & DISCREPANCY */}
      {activeTab === 'physical_audit' && (
        <div className="border border-line bg-surface p-6 space-y-6 ">
          <div className="bg-surface-muted p-4 border border-line">
            <h3 className="text-base font-bold text-ink">
              Statutory Stocktake &amp; Physical Discrepancy Audit (DDA 1952 Regulation 18)
            </h3>
            <p className="text-xs text-muted mt-1 leading-relaxed">
              Regular physical safe inspections must be performed by the registered doctor and pharmacist.
              Any negative discrepancy (missing ampoules or tablets) triggers a mandatory internal clinical investigation
              and statutory notification to the MOH Pharmacy Enforcement Division.
            </p>
          </div>

          <form onSubmit={handlePhysicalAuditEvaluate} className="grid grid-cols-1 md:grid-cols-3 gap-5 items-end">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-ink">Select Drug to Audit *</label>
              <select
                value={auditDrugId}
                onChange={(e) => {
                  setAuditDrugId(e.target.value);
                  setAuditResult(null);
                }}
                className="w-full bg-surface border border-line text-ink min-h-11 text-sm px-3 rounded-none outline-none focus:border-brand focus:ring-2 focus:ring-accent font-bold"
              >
                {drugs.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.drugName} (Theoretical: {d.currentStock} {d.unit})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-ink">Physical Count Counted in Safe *</label>
              <input
                type="number"
                min="0"
                value={physicalCountInput}
                onChange={(e) => {
                  setPhysicalCountInput(e.target.value);
                  setAuditResult(null);
                }}
                className="w-full bg-surface border border-line text-ink min-h-11 text-sm tabular-nums px-3 rounded-none outline-none focus:border-brand focus:ring-2 focus:ring-accent"
                placeholder="Counted units in safe"
                required
              />
            </div>

            <button
              type="submit"
              className="bg-primary hover:bg-primary-hover text-white text-xs font-bold px-5 py-2.5 rounded-none border border-primary flex items-center justify-center gap-2 cursor-pointer  h-10"
            >
              <Scale className="w-4 h-4" />
              <span>Evaluate Count vs Ledger</span>
            </button>
          </form>

          {/* Audit Result Display */}
          {auditResult && (
            <div
              className={`p-5 border-2 rounded-none space-y-3 animate-fadeIn ${
                auditResult.severity === 'ok'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 text-emerald-950 dark:text-emerald-200'
                  : auditResult.severity === 'statutory_alert'
                  ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-950 dark:text-rose-200'
                  : 'bg-amber-50 dark:bg-amber-950/40 border-amber-400 text-amber-950 dark:text-amber-200'
              }`}
            >
              <div className="flex items-center gap-2">
                {auditResult.severity === 'ok' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-rose-600 animate-pulse" />
                )}
                <h4 className="text-sm font-bold uppercase tracking-wider">
                  {auditResult.severity === 'ok'
                    ? 'Safe Balance Verified Compliant'
                    : auditResult.severity === 'statutory_alert'
                    ? 'Critical Statutory Discrepancy Detected'
                    : 'Surplus Discrepancy Detected'}
                </h4>
              </div>

              <div className="grid grid-cols-3 gap-3 tabular-nums text-xs border-y border-current/20 py-2">
                <div>
                  <span className="text-2xs opacity-80 block">Theoretical Ledger:</span>
                  <span className="font-bold">{auditTargetDrug.currentStock} {auditTargetDrug.unit}</span>
                </div>
                <div>
                  <span className="text-2xs opacity-80 block">Physical Count:</span>
                  <span className="font-bold">{physicalCountInput} {auditTargetDrug.unit}</span>
                </div>
                <div>
                  <span className="text-2xs opacity-80 block">Variance:</span>
                  <span className="font-bold">{auditResult.discrepancy > 0 ? `+${auditResult.discrepancy}` : auditResult.discrepancy}</span>
                </div>
              </div>

              <p className="text-xs leading-relaxed">{auditResult.message}</p>

              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-bold block">
                  Audit Findings &amp; Corrective Action Notes (CAPA)
                </label>
                <input
                  type="text"
                  value={auditNotes}
                  onChange={(e) => setAuditNotes(e.target.value)}
                  placeholder="e.g. Visual verification by Dr. Sarah & Pharm. Ahmad. Broken ampoule reported."
                  className="w-full bg-surface border border-line text-ink min-h-11 text-sm px-3 rounded-none outline-none focus:border-brand focus:ring-2 focus:ring-accent"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleApplyPhysicalReconciliation}
                  className="bg-primary hover:bg-primary-hover text-white text-xs font-bold px-4 py-2 rounded-none border border-primary flex items-center gap-2 cursor-pointer "
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Certify &amp; Apply Stock Reconciliation</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
