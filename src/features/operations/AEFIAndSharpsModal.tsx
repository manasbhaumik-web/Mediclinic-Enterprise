import React, { useState, useEffect, useMemo } from 'react';
import {
  X, AlertTriangle, ShieldCheck, Clock, Plus, FileText, Download,
  ShieldAlert, Info, Syringe, HeartPulse, Activity, Check, CheckCircle2,
  AlertOctagon, Flame, ArrowUpRight
} from 'lucide-react';
import {
  AEFIRecord,
  SharpsIncidentRecord,
  SharpsExposureType,
  SourcePatientStatus,
  HCWImmunityStatus,
  DEFAULT_AEFI_RECORDS,
  DEFAULT_SHARPS_RECORDS,
  calculateAdrenalineDose,
  classifyAEFISeverity,
  evaluateSharpsRiskAndPEP,
  exportAefiReportText,
} from '../../domain/aefiAndSharpsProtocol';

interface AEFIAndSharpsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAefiLogged?: (record: AEFIRecord) => void;
  onSharpsLogged?: (record: SharpsIncidentRecord) => void;
}

const STORAGE_KEY_AEFI = 'mediclinic_aefi_records_v1';
const STORAGE_KEY_SHARPS = 'mediclinic_sharps_records_v1';

export default function AEFIAndSharpsModal({
  isOpen,
  onClose,
  onAefiLogged,
  onSharpsLogged,
}: AEFIAndSharpsModalProps) {
  const [activeTab, setActiveTab] = useState<'aefi_surveillance' | 'log_aefi' | 'sharps_pep' | 'statutory_exports'>('aefi_surveillance');

  // State
  const [aefiRecords, setAefiRecords] = useState<AEFIRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_AEFI);
    return saved ? JSON.parse(saved) : DEFAULT_AEFI_RECORDS;
  });

  const [sharpsRecords, setSharpsRecords] = useState<SharpsIncidentRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_SHARPS);
    return saved ? JSON.parse(saved) : DEFAULT_SHARPS_RECORDS;
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // AEFI Form State
  const [patientName, setPatientName] = useState('');
  const [patientIc, setPatientIc] = useState('');
  const [patientAge, setPatientAge] = useState('5');
  const [weightKg, setWeightKg] = useState('18');
  const [vaccineName, setVaccineName] = useState('Hexaxim 6-in-1 (DTaP-IPV-HepB-Hib)');
  const [vaccineBatch, setVaccineBatch] = useState('HX2026-B81');
  const [doseNo, setDoseNo] = useState('1');
  const [fridgeId, setFridgeId] = useState('FRIDGE-VACC-01');
  const [onsetMinutes, setOnsetMinutes] = useState('20');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>(['Generalized Urticaria', 'Stridor / Wheeze']);
  const [adrenalineGiven, setAdrenalineGiven] = useState(false);
  const [hospitalTransferred, setHospitalTransferred] = useState(false);
  const [doctorName, setDoctorName] = useState('Dr. Siti Nurhaliza');
  const [doctorMMC, setDoctorMMC] = useState('MMC-48912');
  const [aefiNotes, setAefiNotes] = useState('');

  // Adrenaline Calculator Widget State
  const [calcWeight, setCalcWeight] = useState('15');

  // Sharps Form State
  const [hcwName, setHcwName] = useState('Staff Nurse Aisyah');
  const [hcwRole, setHcwRole] = useState('Clinic Assistant / Staff Nurse');
  const [exposureType, setExposureType] = useState<SharpsExposureType>('deep_puncture');
  const [deviceInvolved, setDeviceInvolved] = useState<'Hollow-Bore Needle (Phlebotomy/IV)' | 'Solid Suture Needle' | 'Scalpel Blade' | 'Lancet / Glass'>('Hollow-Bore Needle (Phlebotomy/IV)');
  const [sourceStatus, setSourceStatus] = useState<SourcePatientStatus>('unknown_high_risk');
  const [hcwImmunity, setHcwImmunity] = useState<HCWImmunityStatus>('vaccinated_responder');
  const [elapsedHours, setElapsedHours] = useState('2');
  const [firstAidDone, setFirstAidDone] = useState(true);
  const [sharpsNotes, setSharpsNotes] = useState('');

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_AEFI, JSON.stringify(aefiRecords));
  }, [aefiRecords]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SHARPS, JSON.stringify(sharpsRecords));
  }, [sharpsRecords]);

  // Derived Evaluations
  const liveAdrenaline = useMemo(() => {
    const w = parseFloat(calcWeight) || 10;
    return calculateAdrenalineDose(w);
  }, [calcWeight]);

  const formAdrenaline = useMemo(() => {
    const w = parseFloat(weightKg) || 10;
    return calculateAdrenalineDose(w);
  }, [weightKg]);

  const liveAEFIEval = useMemo(() => {
    const mins = parseInt(onsetMinutes, 10) || 15;
    return classifyAEFISeverity(selectedSymptoms, mins);
  }, [selectedSymptoms, onsetMinutes]);

  const liveSharpsEval = useMemo(() => {
    const hrs = parseFloat(elapsedHours) || 0;
    return evaluateSharpsRiskAndPEP(exposureType, deviceInvolved, sourceStatus, hcwImmunity, hrs);
  }, [exposureType, deviceInvolved, sourceStatus, hcwImmunity, elapsedHours]);

  // Symptom toggling helper
  const availableSymptoms = [
    'Generalized Urticaria',
    'Angioedema (Lip/Face Swelling)',
    'Stridor / Wheeze',
    'Hypotension / Shock',
    'Difficulty Breathing',
    'Seizure / Convulsion',
    'High Fever (>39°C)',
    'Injection Site Swelling (>5cm)',
    'Persistent Crying (>3h)',
    'Hypotonic-Hyporesponsive Episode (HHE)',
    'Mild Pain / Tenderness',
    'Low-grade Fever (<38.5°C)',
  ];

  const toggleSymptom = (symptom: string) => {
    if (selectedSymptoms.includes(symptom)) {
      setSelectedSymptoms(selectedSymptoms.filter((s) => s !== symptom));
    } else {
      setSelectedSymptoms([...selectedSymptoms, symptom]);
    }
  };

  // Submit AEFI Incident
  const handleSubmitAEFI = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim()) return;

    const newRecord: AEFIRecord = {
      id: `AEFI-${Date.now()}`,
      patientId: `PAT-${Math.floor(1000 + Math.random() * 9000)}`,
      patientName: patientName.trim(),
      patientIc: patientIc.trim() || 'Pending',
      patientAgeYears: parseFloat(patientAge) || 0,
      weightKg: parseFloat(weightKg) || 10,
      vaccineCode: vaccineName.split(' ')[0] || 'VACC',
      vaccineName,
      batchNo: vaccineBatch.trim(),
      doseNo: parseInt(doseNo, 10) || 1,
      fridgeId,
      administeredAt: new Date(Date.now() - (parseInt(onsetMinutes, 10) || 15) * 60000).toISOString(),
      reactionStartedAt: new Date().toISOString(),
      onsetMinutes: parseInt(onsetMinutes, 10) || 15,
      severity: liveAEFIEval.severity,
      symptoms: selectedSymptoms,
      adrenalineGiven,
      adrenalineDoseMg: adrenalineGiven ? formAdrenaline.doseMg : undefined,
      hospitalTransferred,
      sbarRefId: hospitalTransferred ? `SBAR-${Date.now()}` : undefined,
      outcome: hospitalTransferred ? 'Transferred to Hospital ED' : 'Under Observation',
      reportedToPKD: true,
      pkdReportedAt: new Date().toISOString(),
      reportingDoctorName: doctorName.trim(),
      doctorMMC: doctorMMC.trim(),
      clinicalNotes: aefiNotes.trim() || 'Clinical evaluation completed.',
    };

    setAefiRecords([newRecord, ...aefiRecords]);
    if (onAefiLogged) onAefiLogged(newRecord);

    setToastMessage(`✓ AEFI Incident Logged: ${newRecord.severity.toUpperCase()} (${newRecord.patientName})`);
    setTimeout(() => setToastMessage(null), 4000);
    setActiveTab('aefi_surveillance');
  };

  // Submit Sharps Incident
  const handleSubmitSharps = (e: React.FormEvent) => {
    e.preventDefault();
    const newRecord: SharpsIncidentRecord = {
      id: `SHARPS-${Date.now()}`,
      staffId: `STF-0${Math.floor(1 + Math.random() * 9)}`,
      staffName: hcwName.trim(),
      staffRole: hcwRole.trim(),
      occurredAt: new Date(Date.now() - (parseFloat(elapsedHours) || 0) * 3600000).toISOString(),
      reportedAt: new Date().toISOString(),
      exposureType,
      deviceInvolved,
      sourcePatientStatus: sourceStatus,
      hcwImmunityStatus: hcwImmunity,
      firstAidCompleted: firstAidDone,
      pepRecommended: liveSharpsEval.pepRecommended,
      pepProtocol: liveSharpsEval.pepProtocol,
      pepHourLimitRemaining: liveSharpsEval.hoursRemaining,
      serologyOrdered: true,
      jkkpFormRequired: liveSharpsEval.jkkpFormRequired,
      supervisingDoctorMMC: doctorMMC.trim(),
      clinicalNotes: sharpsNotes.trim() || 'First aid completed. Baseline viral serology ordered.',
    };

    setSharpsRecords([newRecord, ...sharpsRecords]);
    if (onSharpsLogged) onSharpsLogged(newRecord);

    setToastMessage(`✓ Sharps Injury Logged: ${liveSharpsEval.pepRecommended ? 'PEP INITIATED' : 'Monitored'} (${hcwName})`);
    setTimeout(() => setToastMessage(null), 4000);
    setActiveTab('statutory_exports');
  };

  // Export Download
  const handleDownloadAefiReport = (record: AEFIRecord) => {
    const text = exportAefiReportText(record);
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `KKM_AEFI_Report_${record.id}.txt`);
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
            <div className="p-2 bg-rose-500/10 border border-rose-500/20 text-rose-600">
              <HeartPulse className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold tracking-tight text-ink">
                  AEFI Surveillance &amp; Staff Sharps PEP Protocol
                </h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-rose-500/15 text-rose-700 border border-rose-500/30">
                  KKM BPKK &bull; OSHA 1994
                </span>
              </div>
              <p className="text-xs text-ink-muted">
                Adverse Events Following Immunisation Surveillance &bull; 72-Hour Post-Exposure Prophylaxis Window
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-ink-muted hover:text-ink hover:bg-canvas-subtle border border-transparent hover:border-line transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
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
            onClick={() => setActiveTab('aefi_surveillance')}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'aefi_surveillance'
                ? 'border-brand text-brand'
                : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            <HeartPulse className="w-3.5 h-3.5" />
            <span>AEFI Surveillance &amp; Anaphylaxis</span>
          </button>
          <button
            onClick={() => setActiveTab('log_aefi')}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'log_aefi'
                ? 'border-brand text-brand'
                : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Log AEFI Case</span>
          </button>
          <button
            onClick={() => setActiveTab('sharps_pep')}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'sharps_pep'
                ? 'border-brand text-brand'
                : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            <Syringe className="w-3.5 h-3.5" />
            <span>Sharps / Needle-Stick PEP (OSHA)</span>
          </button>
          <button
            onClick={() => setActiveTab('statutory_exports')}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'statutory_exports'
                ? 'border-brand text-brand'
                : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Statutory Registers &amp; JKKP</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: AEFI SURVEILLANCE & ANAPHYLAXIS */}
          {activeTab === 'aefi_surveillance' && (
            <div className="space-y-6">
              {/* Emergency Anaphylaxis Protocol Box */}
              <div className="border border-rose-300 bg-rose-50/60 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertOctagon className="w-5 h-5 text-rose-600 animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-wider text-rose-900">
                      Emergency Vaccine Anaphylaxis Protocol (Immediate Action)
                    </span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-rose-200 text-rose-800 border border-rose-300 uppercase">
                    First-Line: IM Adrenaline Only
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 bg-white border border-rose-200">
                    <span className="font-bold text-rose-800 block mb-1">1. IM Adrenaline (1:1000)</span>
                    <p className="text-ink-muted leading-relaxed text-[11px]">
                      0.01 mg/kg (max 0.5 mg) into anterolateral mid-thigh. Repeat every 5-15 mins if refractory.
                    </p>
                  </div>
                  <div className="p-3 bg-white border border-rose-200">
                    <span className="font-bold text-rose-800 block mb-1">2. Airway &amp; Oxygen</span>
                    <p className="text-ink-muted leading-relaxed text-[11px]">
                      Lay flat with legs raised. High-flow O2 via reservoir mask (10-15 L/min). Maintain patent airway.
                    </p>
                  </div>
                  <div className="p-3 bg-white border border-rose-200">
                    <span className="font-bold text-rose-800 block mb-1">3. MECC 999 SBAR</span>
                    <p className="text-ink-muted leading-relaxed text-[11px]">
                      Activate emergency hospital transfer. Continuous monitoring of BP, HR, SpO2, and respiratory rate.
                    </p>
                  </div>
                  <div className="p-3 bg-white border border-rose-200">
                    <span className="font-bold text-rose-800 block mb-1">4. Statutory Alert</span>
                    <p className="text-ink-muted leading-relaxed text-[11px]">
                      Mandatory phone alert to Pejabat Kesihatan Daerah (PKD) within 24h of severe event.
                    </p>
                  </div>
                </div>
              </div>

              {/* Live Weight-Based Adrenaline Dosage Quick-Calculator */}
              <div className="p-4 border border-line bg-canvas-subtle flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-brand" />
                    <span className="text-xs font-bold text-ink uppercase">Adrenaline 1:1000 Dosage Calculator</span>
                  </div>
                  <p className="text-xs text-ink-muted">Enter patient weight to verify exact dosage prior to injection:</p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <label className="text-xs font-semibold text-ink">Weight (kg):</label>
                    <input
                      type="number"
                      value={calcWeight}
                      onChange={(e) => setCalcWeight(e.target.value)}
                      className="w-16 text-xs p-1.5 border border-line bg-canvas font-mono font-bold text-ink rounded-none"
                    />
                  </div>

                  <div className="px-3 py-1.5 border border-brand/40 bg-brand/10 text-xs text-brand font-bold flex items-center gap-2">
                    <span>Dose: {liveAdrenaline.doseMg} mg</span>
                    <span className="text-ink-muted">({liveAdrenaline.volumeMl} mL)</span>
                    <span className="text-[10px] text-ink-muted uppercase">IM Thigh</span>
                  </div>
                </div>
              </div>

              {/* Recent AEFI Cases Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-ink">Recent Immunisation AEFI Incidents</h3>
                  <button
                    onClick={() => setActiveTab('log_aefi')}
                    className="px-3 py-1 text-xs font-semibold bg-brand text-white hover:bg-brand/90 transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Report New Case</span>
                  </button>
                </div>

                <div className="border border-line overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-canvas-subtle border-b border-line text-ink-muted font-medium text-[11px]">
                        <th className="p-2.5">Date &amp; ID</th>
                        <th className="p-2.5">Patient Details</th>
                        <th className="p-2.5">Vaccine &amp; Batch</th>
                        <th className="p-2.5">Onset</th>
                        <th className="p-2.5">Severity</th>
                        <th className="p-2.5">Adrenaline</th>
                        <th className="p-2.5">Disposition</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line font-mono text-[11px]">
                      {aefiRecords.map((rec) => (
                        <tr key={rec.id} className="hover:bg-canvas-subtle/50">
                          <td className="p-2.5">
                            <span className="block font-bold text-ink font-sans">{rec.id}</span>
                            <span className="text-[10px] text-ink-muted">{new Date(rec.reactionStartedAt).toLocaleDateString()}</span>
                          </td>
                          <td className="p-2.5 font-sans">
                            <span className="font-medium text-ink block">{rec.patientName}</span>
                            <span className="text-[10px] text-ink-muted font-mono">{rec.patientAgeYears}y / {rec.weightKg}kg</span>
                          </td>
                          <td className="p-2.5 font-sans text-ink">
                            <span>{rec.vaccineName}</span>
                            <span className="block text-[10px] font-mono text-ink-muted">Lot: {rec.batchNo}</span>
                          </td>
                          <td className="p-2.5">{rec.onsetMinutes}m post-dose</td>
                          <td className="p-2.5">
                            <span className={`px-2 py-0.5 border text-[10px] font-bold ${
                              rec.severity === 'severe_anaphylaxis'
                                ? 'bg-rose-500/10 border-rose-500/30 text-rose-700'
                                : rec.severity === 'moderate'
                                ? 'bg-amber-500/10 border-amber-500/30 text-amber-700'
                                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700'
                            }`}>
                              {rec.severity.toUpperCase()}
                            </span>
                          </td>
                          <td className="p-2.5 font-sans">
                            {rec.adrenalineGiven ? (
                              <span className="text-rose-700 font-bold">{rec.adrenalineDoseMg} mg IM</span>
                            ) : (
                              <span className="text-ink-muted">Not given</span>
                            )}
                          </td>
                          <td className="p-2.5 font-sans">
                            <span className="text-ink font-medium">{rec.outcome}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LOG AEFI INCIDENT */}
          {activeTab === 'log_aefi' && (
            <form onSubmit={handleSubmitAEFI} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-ink mb-1">Patient Full Name</label>
                  <input
                    type="text"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="e.g. Nurul Huda binti Azman"
                    className="w-full text-xs p-2 border border-line bg-canvas text-ink rounded-none focus:outline-none focus:border-brand"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">IC / Passport</label>
                  <input
                    type="text"
                    value={patientIc}
                    onChange={(e) => setPatientIc(e.target.value)}
                    placeholder="e.g. 190412-14-5522"
                    className="w-full text-xs p-2 border border-line bg-canvas text-ink font-mono rounded-none focus:outline-none focus:border-brand"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-ink mb-1">Age (Y)</label>
                    <input
                      type="number"
                      value={patientAge}
                      onChange={(e) => setPatientAge(e.target.value)}
                      className="w-full text-xs p-2 border border-line bg-canvas text-ink font-mono rounded-none focus:outline-none focus:border-brand"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink mb-1">Weight (kg)</label>
                    <input
                      type="number"
                      value={weightKg}
                      onChange={(e) => setWeightKg(e.target.value)}
                      className="w-full text-xs p-2 border border-line bg-canvas text-ink font-mono rounded-none focus:outline-none focus:border-brand"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-ink mb-1">Vaccine Administered</label>
                  <input
                    type="text"
                    value={vaccineName}
                    onChange={(e) => setVaccineName(e.target.value)}
                    className="w-full text-xs p-2 border border-line bg-canvas text-ink rounded-none focus:outline-none focus:border-brand"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Batch / Lot No</label>
                  <input
                    type="text"
                    value={vaccineBatch}
                    onChange={(e) => setVaccineBatch(e.target.value)}
                    className="w-full text-xs p-2 border border-line bg-canvas text-ink font-mono rounded-none focus:outline-none focus:border-brand"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Onset Minutes Post-Dose</label>
                  <input
                    type="number"
                    value={onsetMinutes}
                    onChange={(e) => setOnsetMinutes(e.target.value)}
                    className="w-full text-xs p-2 border border-line bg-canvas text-ink font-mono rounded-none focus:outline-none focus:border-brand"
                    required
                  />
                </div>
              </div>

              {/* Symptoms Selector */}
              <div>
                <label className="block text-xs font-semibold text-ink mb-2">
                  Select Observed Clinical Symptoms / Signs
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {availableSymptoms.map((sym) => {
                    const isSelected = selectedSymptoms.includes(sym);
                    return (
                      <button
                        type="button"
                        key={sym}
                        onClick={() => toggleSymptom(sym)}
                        className={`text-left text-xs p-2 border transition-colors flex items-center justify-between ${
                          isSelected
                            ? 'bg-brand/10 border-brand text-brand font-bold'
                            : 'bg-canvas-subtle border-line text-ink-muted hover:text-ink'
                        }`}
                      >
                        <span>{sym}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-brand" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Live Severity Guidance Box */}
              <div
                className={`p-3 border text-xs flex items-start gap-3 ${
                  liveAEFIEval.severity === 'severe_anaphylaxis'
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-900'
                    : liveAEFIEval.severity === 'moderate'
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-900'
                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900'
                }`}
              >
                <AlertOctagon className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block uppercase tracking-wide">
                    Evaluated Severity: {liveAEFIEval.severity.toUpperCase()}
                  </span>
                  <p className="mt-0.5 leading-relaxed">{liveAEFIEval.guidance}</p>
                </div>
              </div>

              {/* Treatment Checks */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border border-line p-3 bg-canvas-subtle">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={adrenalineGiven}
                    onChange={(e) => setAdrenalineGiven(e.target.checked)}
                    className="rounded-none text-brand focus:ring-0"
                  />
                  <div>
                    <span className="text-xs font-bold text-ink block">IM Adrenaline 1:1000 Administered</span>
                    <span className="text-[10px] text-ink-muted">
                      Weight-based calculated dose: {formAdrenaline.doseMg} mg ({formAdrenaline.volumeMl} mL) IM Thigh
                    </span>
                  </div>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hospitalTransferred}
                    onChange={(e) => setHospitalTransferred(e.target.checked)}
                    className="rounded-none text-brand focus:ring-0"
                  />
                  <div>
                    <span className="text-xs font-bold text-ink block">MECC 999 Emergency Hospital Transfer Activated</span>
                    <span className="text-[10px] text-ink-muted">Auto-links to SBAR clinical transfer protocol</span>
                  </div>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Attending Doctor Name</label>
                  <input
                    type="text"
                    value={doctorName}
                    onChange={(e) => setDoctorName(e.target.value)}
                    className="w-full text-xs p-2 border border-line bg-canvas text-ink rounded-none focus:outline-none focus:border-brand"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">MMC Number</label>
                  <input
                    type="text"
                    value={doctorMMC}
                    onChange={(e) => setDoctorMMC(e.target.value)}
                    className="w-full text-xs p-2 border border-line bg-canvas text-ink font-mono rounded-none focus:outline-none focus:border-brand"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Clinical Notes &amp; Disposition</label>
                <input
                  type="text"
                  value={aefiNotes}
                  onChange={(e) => setAefiNotes(e.target.value)}
                  placeholder="e.g. Patient stabilized post 0.18mg Adrenaline, vitals normalized, transferred to ED."
                  className="w-full text-xs p-2 border border-line bg-canvas text-ink rounded-none focus:outline-none focus:border-brand"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-line">
                <button
                  type="button"
                  onClick={() => setActiveTab('aefi_surveillance')}
                  className="px-4 py-2 text-xs font-semibold border border-line hover:bg-canvas-subtle text-ink"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold bg-brand text-white hover:bg-brand/90 transition-colors flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Submit AEFI Notification</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: SHARPS / NEEDLE-STICK PROTOCOL (OSHA 1994) */}
          {activeTab === 'sharps_pep' && (
            <form onSubmit={handleSubmitSharps} className="space-y-6">
              {/* Immediate First Aid Protocol */}
              <div className="border border-line bg-canvas-subtle p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-brand" />
                  <span className="text-xs font-bold uppercase text-ink">
                    OSHA 1994 Needle-Stick First Aid Protocol
                  </span>
                </div>
                <p className="text-xs text-ink-muted leading-relaxed">
                  1. Wash puncture site immediately with soap and running water for 5 minutes. <strong>DO NOT SQUEEZE OR SUCK THE WOUND</strong>.
                  <br />
                  2. If eye/mucous splash: Irrigate thoroughly with sterile water or saline for 10 minutes.
                  <br />
                  3. Report immediately to Clinical In-Charge for rapid viral serology and PEP evaluation within 2 hours.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Exposed Staff Member</label>
                  <input
                    type="text"
                    value={hcwName}
                    onChange={(e) => setHcwName(e.target.value)}
                    className="w-full text-xs p-2 border border-line bg-canvas text-ink rounded-none focus:outline-none focus:border-brand"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Staff Role</label>
                  <input
                    type="text"
                    value={hcwRole}
                    onChange={(e) => setHcwRole(e.target.value)}
                    className="w-full text-xs p-2 border border-line bg-canvas text-ink rounded-none focus:outline-none focus:border-brand"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Exposure Type</label>
                  <select
                    value={exposureType}
                    onChange={(e) => setExposureType(e.target.value as any)}
                    className="w-full text-xs p-2 border border-line bg-canvas text-ink rounded-none focus:outline-none focus:border-brand"
                  >
                    <option value="deep_puncture">Deep Percutaneous Puncture (Bleeding)</option>
                    <option value="superficial_cut">Superficial Scratch / Cut</option>
                    <option value="mucous_membrane_splash">Mucous Membrane Splash (Eye/Mouth)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Device Involved</label>
                  <select
                    value={deviceInvolved}
                    onChange={(e) => setDeviceInvolved(e.target.value as any)}
                    className="w-full text-xs p-2 border border-line bg-canvas text-ink rounded-none focus:outline-none focus:border-brand"
                  >
                    <option value="Hollow-Bore Needle (Phlebotomy/IV)">Hollow-Bore Needle (Phlebotomy/IV)</option>
                    <option value="Solid Suture Needle">Solid Suture Needle</option>
                    <option value="Scalpel Blade">Scalpel Blade</option>
                    <option value="Lancet / Glass">Lancet / Broken Glass</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Hours Elapsed Since Incident</label>
                  <input
                    type="number"
                    step="0.5"
                    value={elapsedHours}
                    onChange={(e) => setElapsedHours(e.target.value)}
                    className="w-full text-xs p-2 border border-line bg-canvas text-ink font-mono rounded-none focus:outline-none focus:border-brand"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Source Patient Status</label>
                  <select
                    value={sourceStatus}
                    onChange={(e) => setSourceStatus(e.target.value as any)}
                    className="w-full text-xs p-2 border border-line bg-canvas text-ink rounded-none focus:outline-none focus:border-brand"
                  >
                    <option value="unknown_high_risk">Unknown Source / High Risk Demographic</option>
                    <option value="known_positive_hiv">Known HIV Positive</option>
                    <option value="known_positive_hbv">Known Hepatitis B Positive (HBsAg+)</option>
                    <option value="known_positive_hcv">Known Hepatitis C Positive (Anti-HCV+)</option>
                    <option value="known_negative_all">Verified Negative (HIV, HBV, HCV)</option>
                    <option value="unknown_low_risk">Unknown Source / Low Risk Community Needle</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">HCW Hepatitis B Immunity Status</label>
                  <select
                    value={hcwImmunity}
                    onChange={(e) => setHcwImmunity(e.target.value as any)}
                    className="w-full text-xs p-2 border border-line bg-canvas text-ink rounded-none focus:outline-none focus:border-brand"
                  >
                    <option value="vaccinated_responder">Vaccinated Responder (Anti-HBs &ge; 10 mIU/mL)</option>
                    <option value="vaccinated_non_responder">Vaccinated Non-Responder (Anti-HBs &lt; 10 mIU/mL)</option>
                    <option value="unvaccinated_or_unknown">Unvaccinated / Unknown Titre</option>
                  </select>
                </div>
              </div>

              {/* Live 72-Hour PEP Evaluation Box */}
              <div className="border border-line p-4 bg-canvas space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-ink flex items-center gap-2">
                    <Clock className="w-4 h-4 text-brand" />
                    <span>Post-Exposure Prophylaxis (PEP) Assessment</span>
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 border ${
                    liveSharpsEval.pepRecommended
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-700 animate-pulse'
                      : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700'
                  }`}>
                    {liveSharpsEval.pepRecommended ? 'PEP RECOMMENDED' : 'ROUTINE MONITORING'}
                  </span>
                </div>

                <div className="p-3 bg-canvas-subtle border border-line text-xs space-y-2">
                  <div>
                    <span className="font-semibold text-ink block">HIV Prophylaxis Protocol:</span>
                    <p className="text-ink-muted mt-0.5">{liveSharpsEval.pepProtocol}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-ink block">Hepatitis B Protocol:</span>
                    <p className="text-ink-muted mt-0.5">{liveSharpsEval.hbvManagement}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-ink block">Hepatitis C Protocol:</span>
                    <p className="text-ink-muted mt-0.5">{liveSharpsEval.hcvManagement}</p>
                  </div>
                  <div className="pt-2 border-t border-line flex items-center justify-between text-[11px]">
                    <span className="text-brand font-bold">
                      72-Hour PEP Window Countdown: {liveSharpsEval.hoursRemaining} hours remaining
                    </span>
                    <span className="text-ink-muted">OSHA JKKP 6 Filing: Required</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold bg-brand text-white hover:bg-brand/90 transition-colors flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Log Sharps Incident &amp; Order Serology</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 4: STATUTORY REGISTERS & EXPORTS */}
          {activeTab === 'statutory_exports' && (
            <div className="space-y-6">
              {/* BPKK AEFI Reports */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-ink">
                    BPKK / NPRA Statutory AEFI Incident Reports
                  </h3>
                  <span className="text-xs text-ink-muted">Form 48-Hour Submission</span>
                </div>

                <div className="border border-line overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-canvas-subtle border-b border-line text-ink-muted font-medium text-[11px]">
                        <th className="p-2.5">ID</th>
                        <th className="p-2.5">Patient Name</th>
                        <th className="p-2.5">Vaccine &amp; Batch</th>
                        <th className="p-2.5">Severity</th>
                        <th className="p-2.5">Reporting Doctor</th>
                        <th className="p-2.5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line font-mono text-[11px]">
                      {aefiRecords.map((r) => (
                        <tr key={r.id} className="hover:bg-canvas-subtle/50">
                          <td className="p-2.5 font-bold text-ink">{r.id}</td>
                          <td className="p-2.5 font-sans font-medium text-ink">{r.patientName}</td>
                          <td className="p-2.5 font-sans text-ink-muted">{r.vaccineName} ({r.batchNo})</td>
                          <td className="p-2.5">
                            <span className="px-2 py-0.5 bg-rose-500/10 border border-rose-500/30 text-rose-700 font-bold">
                              {r.severity.toUpperCase()}
                            </span>
                          </td>
                          <td className="p-2.5 font-sans text-ink">{r.reportingDoctorName} ({r.doctorMMC})</td>
                          <td className="p-2.5 text-right">
                            <button
                              onClick={() => handleDownloadAefiReport(r)}
                              className="px-2.5 py-1 text-xs font-medium border border-line bg-canvas hover:bg-canvas-subtle text-ink inline-flex items-center gap-1"
                            >
                              <Download className="w-3 h-3" />
                              <span>Export BPKK</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* OSHA Sharps Incident Registry */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-ink">
                    OSHA 1994 Sharps Exposure Register (JKKP 6)
                  </h3>
                  <span className="text-xs text-ink-muted">Occupational Safety &amp; Health</span>
                </div>

                <div className="border border-line overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-canvas-subtle border-b border-line text-ink-muted font-medium text-[11px]">
                        <th className="p-2.5">Incident ID</th>
                        <th className="p-2.5">Staff Name &amp; Role</th>
                        <th className="p-2.5">Exposure &amp; Device</th>
                        <th className="p-2.5">Source Status</th>
                        <th className="p-2.5">PEP Regimen</th>
                        <th className="p-2.5">Statutory Filing</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line font-mono text-[11px]">
                      {sharpsRecords.map((s) => (
                        <tr key={s.id} className="hover:bg-canvas-subtle/50">
                          <td className="p-2.5 font-bold text-ink">{s.id}</td>
                          <td className="p-2.5 font-sans font-medium text-ink">
                            {s.staffName}
                            <span className="block text-[10px] text-ink-muted">{s.staffRole}</span>
                          </td>
                          <td className="p-2.5 font-sans text-ink-muted">
                            <span className="font-semibold text-ink block">{s.exposureType}</span>
                            <span>{s.deviceInvolved}</span>
                          </td>
                          <td className="p-2.5 font-sans font-medium">{s.sourcePatientStatus}</td>
                          <td className="p-2.5 font-sans">
                            <span className={`px-2 py-0.5 border text-[10px] font-bold ${
                              s.pepRecommended
                                ? 'bg-rose-500/10 border-rose-500/30 text-rose-700'
                                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700'
                            }`}>
                              {s.pepRecommended ? 'PEP Active' : 'Not Required'}
                            </span>
                          </td>
                          <td className="p-2.5 font-sans text-ink-muted">
                            <span className="text-brand font-bold">JKKP 6 Lodged</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-canvas-subtle border-t border-line flex items-center justify-between text-xs text-ink-muted">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-brand" />
            <span>Statutory Compliance: KKM BPKK AEFI Manual &bull; NPRA Pharmacovigilance &bull; OSHA 1994 (Act 514)</span>
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
