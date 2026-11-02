import React, { useState, useEffect, useMemo } from 'react';
import {
  X, AlertTriangle, CheckCircle2, Siren, PhoneCall, Printer,
  Copy, HeartPulse, Activity, ShieldAlert, ArrowRight, Clock,
  FileText, Ambulance, Sparkles, User, ExternalLink
} from 'lucide-react';
import {
  SBARTransferRecord,
  TransferPriority,
  TransferVitalSigns,
  EmergencyMedicationGiven,
  calculateShockIndex,
  formatSBARVerbalSummary,
  validateSBARCompleteness,
  MALAYSIAN_TERTIARY_HOSPITALS,
  AMBULANCE_PROVIDERS,
  INITIAL_SBAR_RECORDS,
} from '../../domain/emergencyTransferSBAR';
import { Patient, Visit } from '../../types';

interface EmergencySBARModalProps {
  isOpen: boolean;
  onClose: () => void;
  activePatient?: Patient | null;
  activeVisit?: Visit | null;
  onTransferDispatched?: (record: SBARTransferRecord) => void;
}

const STORAGE_KEY = 'mediclinic_sbar_transfers_v1';

export default function EmergencySBARModal({
  isOpen,
  onClose,
  activePatient,
  activeVisit,
  onTransferDispatched,
}: EmergencySBARModalProps) {
  const [activeTab, setActiveTab] = useState<'sbar_editor' | 'dispatch' | 'print_preview'>('sbar_editor');
  const [transfers, setTransfers] = useState<SBARTransferRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : INITIAL_SBAR_RECORDS;
  });

  // Current Working Record State
  const [priority, setPriority] = useState<TransferPriority>('Red');
  const [chiefComplaint, setChiefComplaint] = useState(
    typeof activeVisit?.soap?.subjective === 'string' && activeVisit.soap.subjective.trim()
      ? activeVisit.soap.subjective
      : 'Acute severe retrosternal chest pain with diaphoresis'
  );
  const [acuteDiagnosis, setAcuteDiagnosis] = useState(
    activeVisit?.soap?.assessment?.description || 'Acute Coronary Syndrome / Suspected STEMI'
  );
  const [doctorName, setDoctorName] = useState(activeVisit?.doctorName || 'Dr. Sarah Farhana');
  const [doctorMMC, setDoctorMMC] = useState('MMC-58291');

  // Background
  const [pmhx, setPmhx] = useState('Hypertension, Dyslipidemia');
  const [allergies, setAllergies] = useState(
    activePatient?.drugAllergies?.join(', ') || 'Penicillin'
  );
  const [resuscitationStatus, setResuscitationStatus] = useState<'Full Code / CPR' | 'DNR'>('Full Code / CPR');

  // Assessment & Vitals
  const [sbp, setSbp] = useState('100');
  const [dbp, setDbp] = useState('65');
  const [hr, setHr] = useState('108');
  const [rr, setRr] = useState('24');
  const [spo2, setSpo2] = useState('94');
  const [o2Support, setO2Support] = useState('High-Flow NRBM 15L/min');
  const [gcs, setGcs] = useState('15');
  const [buse, setBuse] = useState('8.4');
  const [clinicalFindings, setClinicalFindings] = useState(
    'Pale, diaphoretic, cold extremities, bibasal crackles on auscultation.'
  );
  const [ecgFindings, setEcgFindings] = useState('3mm ST elevation in V2-V4, reciprocal ST depression in III, aVF');

  // Recommendation & Interventions
  const [destinationHospital, setDestinationHospital] = useState(MALAYSIAN_TERTIARY_HOSPITALS[3]); // Serdang
  const [ambulanceProvider, setAmbulanceProvider] = useState(AMBULANCE_PROVIDERS[0]); // MECC 999
  const [ivAccess, setIvAccess] = useState('Right Antecubital 18G Cannula (Patent, Running Normal Saline TKO)');
  const [receivingDoctor, setReceivingDoctor] = useState('Emergency Department Medical Officer');
  const [receivingContact, setReceivingContact] = useState('03-8947 5555 (Ext 2100)');
  const [escortStaff, setEscortStaff] = useState('Clinic Assistant / Staff Nurse');

  // Emergency Meds Table
  const [medsGiven, setMedsGiven] = useState<EmergencyMedicationGiven[]>([
    { time: '09:35 AM', drugName: 'Aspirin (Dispersible)', dose: '300 mg', route: 'Oral (Chewed)', administeredBy: 'Nurse Aisyah' },
    { time: '09:36 AM', drugName: 'Ticagrelor', dose: '180 mg', route: 'Oral', administeredBy: 'Nurse Aisyah' },
    { time: '09:40 AM', drugName: 'Glyceryl Trinitrate (GTN)', dose: '0.5 mg', route: 'Sublingual', administeredBy: 'Doctor' },
  ]);

  const [newMedName, setNewMedName] = useState('');
  const [newMedDose, setNewMedDose] = useState('');
  const [newMedRoute, setNewMedRoute] = useState('IV');

  // Timing
  const [decisionTime] = useState(() => new Date().toISOString());
  const [callOutTime, setCallOutTime] = useState(() => new Date().toISOString());
  const [ambulanceArrivalTime, setAmbulanceArrivalTime] = useState('');
  const [departureTime, setDepartureTime] = useState('');

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transfers));
  }, [transfers]);

  // Real-time Shock Index Calculation
  const numHr = parseInt(hr) || 0;
  const numSbp = parseInt(sbp) || 0;
  const shockEval = useMemo(() => calculateShockIndex(numHr, numSbp), [numHr, numSbp]);

  const currentRecord: SBARTransferRecord = useMemo(() => {
    return {
      id: `SBAR-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`,
      encounterId: activeVisit?.id || 'ENC-ACUTE-01',
      patientId: activePatient?.id || 'PT-CURRENT',
      patientName: activePatient?.fullName || 'Tan Sri Dato Ahmad Razif',
      patientIC: activePatient?.icNumber || '620815-10-5421',
      gender: activePatient?.gender || 'Male',
      age: activePatient?.dob ? `${new Date().getFullYear() - new Date(activePatient.dob).getFullYear()}y` : '64y',
      knownAllergies: allergies.split(',').map((s) => s.trim()).filter(Boolean),
      situation: {
        chiefComplaint,
        acuteDiagnosis,
        transferPriority: priority,
        referringDoctorName: doctorName,
        referringDoctorMMC: doctorMMC,
      },
      background: {
        pastMedicalHistory: pmhx.split(',').map((s) => s.trim()).filter(Boolean),
        currentMedications: [],
        resuscitationStatus,
        relevantNotes: 'Transferred via rapid pre-hospital clinical handover pathway.',
      },
      assessment: {
        vitalsTrend: [
          {
            timestamp: new Date().toISOString(),
            bloodPressure: `${sbp}/${dbp}`,
            systolicBp: numSbp,
            diastolicBp: parseInt(dbp) || 0,
            heartRate: numHr,
            respiratoryRate: parseInt(rr) || 0,
            spo2: parseInt(spo2) || 0,
            oxygenSupport: o2Support,
            gcs: parseInt(gcs) || 15,
            bloodGlucoseMmol: parseFloat(buse) || null,
          },
        ],
        ecgFindings,
        clinicalSummary: clinicalFindings,
        gcsAvpu: `GCS ${gcs}/15`,
        shockIndex: shockEval.shockIndex,
        isShockIndexElevated: shockEval.isElevated,
      },
      recommendation: {
        destinationHospital,
        ambulanceProvider,
        ivAccess,
        airwayBreathingSupport: o2Support,
        medicationsGiven: medsGiven,
        receivingDoctorName: receivingDoctor,
        receivingDoctorContact: receivingContact,
        escortStaffName: escortStaff,
      },
      timestamps: {
        transferDecisionAt: decisionTime,
        ambulanceCalledAt: callOutTime,
        ambulanceArrivedAt: ambulanceArrivalTime || undefined,
        departedClinicAt: departureTime || undefined,
      },
      status: 'Active Transfer',
    };
  }, [
    activeVisit, activePatient, priority, chiefComplaint, acuteDiagnosis,
    doctorName, doctorMMC, pmhx, allergies, resuscitationStatus,
    sbp, dbp, numSbp, hr, numHr, rr, spo2, o2Support, gcs, buse,
    clinicalFindings, ecgFindings, shockEval, destinationHospital,
    ambulanceProvider, ivAccess, medsGiven, receivingDoctor,
    receivingContact, escortStaff, decisionTime, callOutTime,
    ambulanceArrivalTime, departureTime
  ]);

  const completeness = useMemo(() => validateSBARCompleteness(currentRecord), [currentRecord]);

  const handleAddMed = () => {
    if (!newMedName.trim() || !newMedDose.trim()) return;
    const nowTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    setMedsGiven((prev) => [
      ...prev,
      {
        time: nowTime,
        drugName: newMedName.trim(),
        dose: newMedDose.trim(),
        route: newMedRoute,
        administeredBy: doctorName || 'Attending Staff',
      },
    ]);
    setNewMedName('');
    setNewMedDose('');
  };

  const handleSaveAndDispatch = () => {
    setTransfers((prev) => [currentRecord, ...prev]);
    if (onTransferDispatched) {
      onTransferDispatched(currentRecord);
    }
    setToastMessage(`✓ Emergency Transfer ${currentRecord.id} to ${destinationHospital} logged successfully.`);
    setTimeout(() => setToastMessage(null), 4000);
    setActiveTab('print_preview');
  };

  const verbalScript = useMemo(() => formatSBARVerbalSummary(currentRecord), [currentRecord]);

  const handleCopyVerbalScript = () => {
    navigator.clipboard.writeText(verbalScript);
    setToastMessage('✓ SBAR Phone Handover script copied to clipboard.');
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="sbar-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
    >
      <div className="bg-surface text-ink w-full max-w-5xl max-h-[92vh] flex flex-col rounded-none border border-line shadow-2xl animate-fadeIn">
        {/* Header */}
        <div className="p-5 border-b border-line bg-surface flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-none">
              <Siren className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="sbar-modal-title" className="type-modal-title text-ink font-bold">
                  Emergency Hospital Transfer &amp; SBAR Handover
                </h2>
                <span
                  className={`px-2 py-0.5 text-2xs font-bold uppercase tracking-wider border ${
                    priority === 'Red'
                      ? 'bg-rose-100 text-rose-900 border-rose-300 dark:bg-rose-950 dark:text-rose-200'
                      : 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-200'
                  }`}
                >
                  {priority} Priority Transfer
                </span>
                <span className="px-2 py-0.5 text-2xs font-bold uppercase tracking-wider bg-slate-100 text-slate-800 border border-slate-300 dark:bg-slate-800 dark:text-slate-300">
                  MMC Standard
                </span>
              </div>
              <p className="text-xs text-muted mt-0.5">
                Statutory pre-hospital structured communication: Situation, Background, Assessment (Shock Index), and Recommendations.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-muted hover:text-ink hover:bg-surface-accent rounded-none border border-transparent hover:border-line transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-line bg-slate-50 dark:bg-slate-900/40 px-5 pt-2 gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('sbar_editor')}
            className={`px-4 py-2 text-xs font-bold border-b-2 rounded-none transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'sbar_editor'
                ? 'border-accent text-accent bg-surface border-t border-x border-line -mb-px'
                : 'border-transparent text-muted hover:text-ink'
            }`}
          >
            <HeartPulse className="w-3.5 h-3.5" />
            <span>SBAR Clinical Handover Record</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('dispatch')}
            className={`px-4 py-2 text-xs font-bold border-b-2 rounded-none transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'dispatch'
                ? 'border-accent text-accent bg-surface border-t border-x border-line -mb-px'
                : 'border-transparent text-muted hover:text-ink'
            }`}
          >
            <Ambulance className="w-3.5 h-3.5" />
            <span>Ambulance Dispatch &amp; Timestamps</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('print_preview')}
            className={`px-4 py-2 text-xs font-bold border-b-2 rounded-none transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'print_preview'
                ? 'border-accent text-accent bg-surface border-t border-x border-line -mb-px'
                : 'border-transparent text-muted hover:text-ink'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Transfer Sheet &amp; Phone Script</span>
          </button>
        </div>

        {/* Toast alert */}
        {toastMessage && (
          <div className="bg-emerald-50 dark:bg-emerald-950/40 border-b border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 px-5 py-2.5 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {activeTab === 'sbar_editor' && (
            <div className="space-y-6">
              {/* Patient Banner */}
              <div className="bg-slate-50 dark:bg-slate-900/40 border border-line p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div>
                  <span className="text-2xs text-muted font-bold uppercase tracking-wider">Patient</span>
                  <p className="text-sm font-bold text-ink mt-0.5">
                    {currentRecord.patientName} ({currentRecord.gender}, {currentRecord.age})
                  </p>
                  <p className="text-2xs font-mono text-muted">IC: {currentRecord.patientIC}</p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-2xs text-muted font-bold">Transfer Priority:</span>
                  <button
                    type="button"
                    onClick={() => setPriority('Red')}
                    className={`px-3 py-1 text-xs font-bold border rounded-none cursor-pointer ${
                      priority === 'Red'
                        ? 'bg-rose-700 text-white border-rose-800 shadow-2xs'
                        : 'bg-surface text-muted border-line'
                    }`}
                  >
                    Red (Resuscitation / Immediate)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPriority('Yellow')}
                    className={`px-3 py-1 text-xs font-bold border rounded-none cursor-pointer ${
                      priority === 'Yellow'
                        ? 'bg-amber-600 text-white border-amber-700 shadow-2xs'
                        : 'bg-surface text-muted border-line'
                    }`}
                  >
                    Yellow (Urgent / Unstable)
                  </button>
                </div>
              </div>

              {/* SECTION S: Situation */}
              <div className="border border-line bg-surface p-4 space-y-4 shadow-2xs">
                <div className="flex items-center gap-2 border-b border-line pb-2">
                  <span className="w-5 h-5 bg-teal-800 text-white text-xs font-bold flex items-center justify-center font-mono">
                    S
                  </span>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-ink">
                    Situation (Reason for Emergency Transfer)
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-ink">Chief Presenting Complaint *</label>
                    <input
                      type="text"
                      value={chiefComplaint}
                      onChange={(e) => setChiefComplaint(e.target.value)}
                      className="w-full bg-surface border border-line text-ink text-xs p-2.5 rounded-none focus:outline-hidden focus:border-primary"
                      placeholder="e.g. Crushing retrosternal chest pain x 45 mins radiating to left arm"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-ink">Provisional Acute Diagnosis *</label>
                    <input
                      type="text"
                      value={acuteDiagnosis}
                      onChange={(e) => setAcuteDiagnosis(e.target.value)}
                      className="w-full bg-surface border border-line text-ink text-xs p-2.5 rounded-none font-bold text-rose-800 dark:text-rose-300 focus:outline-hidden focus:border-primary"
                      placeholder="e.g. Acute Anterolateral STEMI / Anaphylaxis"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-ink">Referring Doctor Name *</label>
                    <input
                      type="text"
                      value={doctorName}
                      onChange={(e) => setDoctorName(e.target.value)}
                      className="w-full bg-surface border border-line text-ink text-xs p-2.5 rounded-none focus:outline-hidden focus:border-primary"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-ink">Doctor MMC Registration Number *</label>
                    <input
                      type="text"
                      value={doctorMMC}
                      onChange={(e) => setDoctorMMC(e.target.value)}
                      className="w-full bg-surface border border-line text-ink text-xs p-2.5 rounded-none font-mono focus:outline-hidden focus:border-primary"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION B: Background */}
              <div className="border border-line bg-surface p-4 space-y-4 shadow-2xs">
                <div className="flex items-center gap-2 border-b border-line pb-2">
                  <span className="w-5 h-5 bg-teal-800 text-white text-xs font-bold flex items-center justify-center font-mono">
                    B
                  </span>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-ink">
                    Background (Medical History &amp; Baseline)
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-ink">Past Medical History</label>
                    <input
                      type="text"
                      value={pmhx}
                      onChange={(e) => setPmhx(e.target.value)}
                      className="w-full bg-surface border border-line text-ink text-xs p-2.5 rounded-none focus:outline-hidden focus:border-primary"
                      placeholder="Comma separated: HTN, DM, IHD"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-ink">Drug Allergies</label>
                    <input
                      type="text"
                      value={allergies}
                      onChange={(e) => setAllergies(e.target.value)}
                      className="w-full bg-surface border border-line text-ink text-xs p-2.5 rounded-none font-semibold text-rose-700 dark:text-rose-300 focus:outline-hidden focus:border-primary"
                      placeholder="e.g. Penicillin, NSAIDs (or NKDA)"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-ink">Resuscitation Status</label>
                    <select
                      value={resuscitationStatus}
                      onChange={(e) => setResuscitationStatus(e.target.value as any)}
                      className="w-full bg-surface border border-line text-ink text-xs p-2.5 rounded-none focus:outline-hidden focus:border-primary"
                    >
                      <option value="Full Code / CPR">Full Code / CPR (Active Resuscitation)</option>
                      <option value="DNR">Do Not Resuscitate (DNR / Palliative)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION A: Assessment & Shock Index */}
              <div className="border border-line bg-surface p-4 space-y-4 shadow-2xs">
                <div className="flex items-center justify-between border-b border-line pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 bg-teal-800 text-white text-xs font-bold flex items-center justify-center font-mono">
                      A
                    </span>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-ink">
                      Assessment (Pre-Transfer Vitals &amp; Shock Index)
                    </h3>
                  </div>

                  {/* Shock Index Indicator Card */}
                  <div
                    className={`px-3 py-1 border text-xs font-bold flex items-center gap-2 ${
                      shockEval.isElevated
                        ? 'bg-rose-100 text-rose-900 border-rose-300 dark:bg-rose-950 dark:text-rose-200'
                        : 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200'
                    }`}
                  >
                    <span>Shock Index (HR/SBP): {shockEval.shockIndex}</span>
                    <span className="uppercase text-2xs">({shockEval.riskGrade})</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                  <div>
                    <label className="text-2xs font-bold text-muted">SBP (mmHg)</label>
                    <input
                      type="number"
                      value={sbp}
                      onChange={(e) => setSbp(e.target.value)}
                      className="w-full bg-surface border border-line text-ink text-xs font-mono p-2 rounded-none"
                    />
                  </div>
                  <div>
                    <label className="text-2xs font-bold text-muted">DBP (mmHg)</label>
                    <input
                      type="number"
                      value={dbp}
                      onChange={(e) => setDbp(e.target.value)}
                      className="w-full bg-surface border border-line text-ink text-xs font-mono p-2 rounded-none"
                    />
                  </div>
                  <div>
                    <label className="text-2xs font-bold text-muted">Heart Rate (bpm)</label>
                    <input
                      type="number"
                      value={hr}
                      onChange={(e) => setHr(e.target.value)}
                      className="w-full bg-surface border border-line text-ink text-xs font-mono p-2 rounded-none"
                    />
                  </div>
                  <div>
                    <label className="text-2xs font-bold text-muted">Resp Rate (/min)</label>
                    <input
                      type="number"
                      value={rr}
                      onChange={(e) => setRr(e.target.value)}
                      className="w-full bg-surface border border-line text-ink text-xs font-mono p-2 rounded-none"
                    />
                  </div>
                  <div>
                    <label className="text-2xs font-bold text-muted">SpO2 (%)</label>
                    <input
                      type="number"
                      value={spo2}
                      onChange={(e) => setSpo2(e.target.value)}
                      className="w-full bg-surface border border-line text-ink text-xs font-mono p-2 rounded-none"
                    />
                  </div>
                  <div>
                    <label className="text-2xs font-bold text-muted">GCS (3-15)</label>
                    <input
                      type="number"
                      value={gcs}
                      onChange={(e) => setGcs(e.target.value)}
                      className="w-full bg-surface border border-line text-ink text-xs font-mono p-2 rounded-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-ink">Oxygen Therapy / Respiratory Support</label>
                    <input
                      type="text"
                      value={o2Support}
                      onChange={(e) => setO2Support(e.target.value)}
                      className="w-full bg-surface border border-line text-ink text-xs p-2.5 rounded-none"
                      placeholder="e.g. Non-Rebreather Mask (NRBM) 15L/min"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-ink">ECG &amp; Diagnostic Findings</label>
                    <input
                      type="text"
                      value={ecgFindings}
                      onChange={(e) => setEcgFindings(e.target.value)}
                      className="w-full bg-surface border border-line text-ink text-xs p-2.5 rounded-none font-mono"
                      placeholder="e.g. Sinus tach, ST elevation in V2-V4"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-ink">Clinical Examination Summary *</label>
                  <textarea
                    rows={2}
                    value={clinicalFindings}
                    onChange={(e) => setClinicalFindings(e.target.value)}
                    className="w-full bg-surface border border-line text-ink text-xs p-2.5 rounded-none focus:outline-hidden focus:border-primary"
                    placeholder="Physical signs, heart sounds, chest auscultation, peripheral pulses"
                  />
                </div>
              </div>

              {/* SECTION R: Recommendation & Emergency Medications */}
              <div className="border border-line bg-surface p-4 space-y-4 shadow-2xs">
                <div className="flex items-center gap-2 border-b border-line pb-2">
                  <span className="w-5 h-5 bg-teal-800 text-white text-xs font-bold flex items-center justify-center font-mono">
                    R
                  </span>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-ink">
                    Recommendation &amp; Pre-Hospital Interventions Given
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-ink">Target Tertiary Referral Hospital *</label>
                    <select
                      value={destinationHospital}
                      onChange={(e) => setDestinationHospital(e.target.value)}
                      className="w-full bg-surface border border-line text-ink text-xs p-2.5 rounded-none font-bold focus:outline-hidden focus:border-primary"
                    >
                      {MALAYSIAN_TERTIARY_HOSPITALS.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-ink">Ambulance Service Provider *</label>
                    <select
                      value={ambulanceProvider}
                      onChange={(e) => setAmbulanceProvider(e.target.value)}
                      className="w-full bg-surface border border-line text-ink text-xs p-2.5 rounded-none focus:outline-hidden focus:border-primary"
                    >
                      {AMBULANCE_PROVIDERS.map((a) => (
                        <option key={a} value={a}>
                          {a}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-ink">IV Access &amp; Fluids Running</label>
                    <input
                      type="text"
                      value={ivAccess}
                      onChange={(e) => setIvAccess(e.target.value)}
                      className="w-full bg-surface border border-line text-ink text-xs p-2.5 rounded-none"
                      placeholder="e.g. Left Forearm 18G Cannula with Normal Saline TKO"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-ink">Escorting Staff / Paramedic</label>
                    <input
                      type="text"
                      value={escortStaff}
                      onChange={(e) => setEscortStaff(e.target.value)}
                      className="w-full bg-surface border border-line text-ink text-xs p-2.5 rounded-none"
                      placeholder="e.g. Clinic Assistant / Paramedic"
                    />
                  </div>
                </div>

                {/* Emergency Meds Given Prior to Transfer */}
                <div className="space-y-2 pt-2 border-t border-line">
                  <span className="text-xs font-bold uppercase tracking-wider text-ink block">
                    Emergency Medications Administered Prior to Transfer
                  </span>

                  {medsGiven.length > 0 && (
                    <div className="border border-line overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-line text-2xs uppercase tracking-wider text-muted font-bold">
                          <tr>
                            <th className="p-2.5">Time</th>
                            <th className="p-2.5">Medication</th>
                            <th className="p-2.5">Dose</th>
                            <th className="p-2.5">Route</th>
                            <th className="p-2.5">Administered By</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-line">
                          {medsGiven.map((m, idx) => (
                            <tr key={idx}>
                              <td className="p-2.5 font-mono text-2xs">{m.time}</td>
                              <td className="p-2.5 font-bold text-ink">{m.drugName}</td>
                              <td className="p-2.5 font-mono">{m.dose}</td>
                              <td className="p-2.5">{m.route}</td>
                              <td className="p-2.5 text-2xs text-muted">{m.administeredBy}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Add Med Line */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <input
                      type="text"
                      value={newMedName}
                      onChange={(e) => setNewMedName(e.target.value)}
                      placeholder="Medication name (e.g. Adrenaline)"
                      className="text-xs p-2 border border-line bg-surface text-ink flex-1 min-w-[140px] rounded-none"
                    />
                    <input
                      type="text"
                      value={newMedDose}
                      onChange={(e) => setNewMedDose(e.target.value)}
                      placeholder="Dose (e.g. 0.5 mg)"
                      className="text-xs p-2 border border-line bg-surface text-ink w-28 rounded-none font-mono"
                    />
                    <select
                      value={newMedRoute}
                      onChange={(e) => setNewMedRoute(e.target.value)}
                      className="text-xs p-2 border border-line bg-surface text-ink rounded-none"
                    >
                      <option value="Oral">Oral</option>
                      <option value="Sublingual">Sublingual</option>
                      <option value="IV">IV</option>
                      <option value="IM">IM</option>
                      <option value="SC">SC</option>
                      <option value="Nebulized">Nebulized</option>
                    </select>
                    <button
                      type="button"
                      onClick={handleAddMed}
                      className="px-3 py-2 text-xs font-bold bg-surface hover:bg-surface-accent text-accent border border-line rounded-none cursor-pointer"
                    >
                      + Add Medication
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Bar */}
              <div className="flex items-center justify-between pt-4 border-t border-line">
                {!completeness.isValid && (
                  <span className="text-2xs text-rose-700 dark:text-rose-300 font-medium">
                    Missing required fields: {completeness.missingFields.slice(0, 3).join(', ')}
                  </span>
                )}
                {completeness.isValid && (
                  <span className="text-2xs text-emerald-700 dark:text-emerald-300 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>SBAR Statutory Documentation Complete</span>
                  </span>
                )}

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-xs font-semibold text-muted hover:text-ink border border-line hover:bg-surface-accent rounded-none cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveAndDispatch}
                    disabled={!completeness.isValid}
                    className="bg-primary hover:bg-primary-hover text-white text-xs font-bold px-5 py-2.5 rounded-none border border-primary flex items-center gap-2 cursor-pointer shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Siren className="w-4 h-4 text-white" />
                    <span>Authorize &amp; Dispatch SBAR Transfer</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'dispatch' && (
            <div className="space-y-6">
              <div className="bg-slate-50 dark:bg-slate-900/40 p-4 border border-line">
                <h3 className="text-xs font-bold uppercase tracking-wider text-ink">
                  Ambulance Dispatch &amp; Pre-Hospital Timeline (MOH Standard)
                </h3>
                <p className="text-xs text-muted mt-1 leading-relaxed">
                  Log operational time milestones to ensure clinical audit trail integrity. MECC 999 response times are
                  monitored under the Ministry of Health Malaysia pre-hospital care benchmark.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="border border-line bg-surface p-4 space-y-3">
                  <h4 className="text-xs font-bold text-ink uppercase tracking-wider">Dispatch Coordination</h4>
                  <div className="space-y-1">
                    <label className="text-2xs font-bold text-muted">Ambulance Service Provider</label>
                    <p className="text-xs font-bold text-ink">{ambulanceProvider}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-2xs font-bold text-muted">Target Destination ED</label>
                    <p className="text-xs font-bold text-ink">{destinationHospital}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-2xs font-bold text-muted">Receiving Hospital ED Doctor</label>
                    <input
                      type="text"
                      value={receivingDoctor}
                      onChange={(e) => setReceivingDoctor(e.target.value)}
                      className="w-full bg-surface border border-line text-ink text-xs p-2 rounded-none"
                      placeholder="e.g. Dr. Hisham (ED Registrar on Call)"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-2xs font-bold text-muted">ED Direct Telephone Contact</label>
                    <input
                      type="text"
                      value={receivingContact}
                      onChange={(e) => setReceivingContact(e.target.value)}
                      className="w-full bg-surface border border-line text-ink text-xs p-2 rounded-none font-mono"
                      placeholder="e.g. 03-8947 5555"
                    />
                  </div>
                </div>

                <div className="border border-line bg-surface p-4 space-y-3">
                  <h4 className="text-xs font-bold text-ink uppercase tracking-wider">Time Milestones</h4>
                  <div className="space-y-1">
                    <label className="text-2xs font-bold text-muted">Transfer Decision Time</label>
                    <p className="text-xs font-mono font-semibold text-ink">
                      {new Date(decisionTime).toLocaleTimeString('en-GB')}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-2xs font-bold text-muted">Ambulance Dispatch Call Placed</label>
                    <p className="text-xs font-mono font-semibold text-ink">
                      {new Date(callOutTime).toLocaleTimeString('en-GB')}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-2xs font-bold text-muted">Ambulance Arrived at Clinic</label>
                    <input
                      type="time"
                      value={ambulanceArrivalTime}
                      onChange={(e) => setAmbulanceArrivalTime(e.target.value)}
                      className="w-full bg-surface border border-line text-ink text-xs p-2 rounded-none font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-2xs font-bold text-muted">Ambulance Departed for Hospital</label>
                    <input
                      type="time"
                      value={departureTime}
                      onChange={(e) => setDepartureTime(e.target.value)}
                      className="w-full bg-surface border border-line text-ink text-xs p-2 rounded-none font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'print_preview' && (
            <div className="space-y-6">
              {/* Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900/40 p-3.5 border border-line">
                <div>
                  <h3 className="text-xs font-bold text-ink uppercase tracking-wider">
                    Statutory SBAR Handover Sheet &amp; Verbal Script
                  </h3>
                  <p className="text-2xs text-muted">
                    Print 2 copies: 1 for Ambulance Crew, 1 for Patient Medical Record.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyVerbalScript}
                    className="px-3 py-1.5 text-xs font-bold bg-surface hover:bg-surface-accent text-ink border border-line flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Copy className="w-3.5 h-3.5 text-accent" />
                    <span>Copy Verbal Phone Handover</span>
                  </button>
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="px-3.5 py-1.5 text-xs font-bold bg-primary hover:bg-primary-hover text-white border border-primary flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Transfer Form</span>
                  </button>
                </div>
              </div>

              {/* Printable SBAR Sheet Preview */}
              <div className="border border-line bg-white text-slate-900 p-8 shadow-sm font-sans space-y-6 max-w-4xl mx-auto">
                <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-start">
                  <div>
                    <h1 className="text-lg font-black tracking-tight uppercase text-slate-900">
                      Mediclinic Enterprise · Ambulatory Care Centre
                    </h1>
                    <p className="text-xs text-slate-600 font-medium">
                      Emergency Inter-Facility Transfer &amp; SBAR Handover Document
                    </p>
                    <p className="text-2xs text-slate-500 font-mono mt-0.5">
                      Statutory Compliance: MMC Code of Professional Conduct &amp; PHFSA 1998
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-block px-3 py-1 text-xs font-black uppercase tracking-wider border-2 ${
                        priority === 'Red'
                          ? 'border-rose-700 bg-rose-50 text-rose-800'
                          : 'border-amber-600 bg-amber-50 text-amber-800'
                      }`}
                    >
                      {priority} Priority
                    </span>
                    <p className="text-2xs font-mono text-slate-600 mt-1">Ref: {currentRecord.id}</p>
                  </div>
                </div>

                {/* Patient Bar */}
                <div className="grid grid-cols-4 gap-2 p-3 bg-slate-50 border border-slate-300 text-xs">
                  <div>
                    <span className="text-2xs text-slate-500 block">Patient Name</span>
                    <strong className="text-slate-900 font-bold">{currentRecord.patientName}</strong>
                  </div>
                  <div>
                    <span className="text-2xs text-slate-500 block">NRIC / Passport</span>
                    <span className="font-mono font-semibold text-slate-900">{currentRecord.patientIC}</span>
                  </div>
                  <div>
                    <span className="text-2xs text-slate-500 block">Age / Gender</span>
                    <span className="text-slate-900">{currentRecord.age} · {currentRecord.gender}</span>
                  </div>
                  <div>
                    <span className="text-2xs text-slate-500 block">Allergies</span>
                    <span className="font-bold text-rose-700">{allergies || 'NKDA'}</span>
                  </div>
                </div>

                {/* S */}
                <div className="space-y-1 text-xs">
                  <h4 className="font-bold text-slate-900 uppercase border-b border-slate-200 pb-1">
                    [S] Situation
                  </h4>
                  <p><span className="text-slate-500">Chief Complaint:</span> <strong className="text-slate-900">{chiefComplaint}</strong></p>
                  <p><span className="text-slate-500">Provisional Acute Diagnosis:</span> <strong className="text-rose-800 font-bold">{acuteDiagnosis}</strong></p>
                  <p><span className="text-slate-500">Referring Doctor:</span> Dr. {doctorName} ({doctorMMC})</p>
                </div>

                {/* B */}
                <div className="space-y-1 text-xs">
                  <h4 className="font-bold text-slate-900 uppercase border-b border-slate-200 pb-1">
                    [B] Background
                  </h4>
                  <p><span className="text-slate-500">Past Medical History:</span> {pmhx || 'None known'}</p>
                  <p><span className="text-slate-500">Resuscitation Status:</span> <strong className="text-slate-900">{resuscitationStatus}</strong></p>
                </div>

                {/* A */}
                <div className="space-y-1 text-xs">
                  <h4 className="font-bold text-slate-900 uppercase border-b border-slate-200 pb-1 flex justify-between">
                    <span>[A] Assessment &amp; Hemodynamics</span>
                    <span className="font-mono text-2xs">Shock Index: {shockEval.shockIndex} ({shockEval.riskGrade.toUpperCase()})</span>
                  </h4>
                  <p className="font-mono bg-slate-50 p-2 border border-slate-200">
                    BP: {sbp}/{dbp} mmHg | HR: {hr} bpm | RR: {rr}/min | SpO2: {spo2}% on {o2Support} | GCS: {gcs}/15
                  </p>
                  <p><span className="text-slate-500">Clinical Findings:</span> {clinicalFindings}</p>
                  {ecgFindings && <p><span className="text-slate-500">ECG:</span> <span className="font-mono">{ecgFindings}</span></p>}
                </div>

                {/* R */}
                <div className="space-y-2 text-xs">
                  <h4 className="font-bold text-slate-900 uppercase border-b border-slate-200 pb-1">
                    [R] Recommendation &amp; Interventions
                  </h4>
                  <p><span className="text-slate-500">Target Tertiary Hospital:</span> <strong className="text-slate-900">{destinationHospital}</strong></p>
                  <p><span className="text-slate-500">Ambulance Service:</span> {ambulanceProvider}</p>
                  <p><span className="text-slate-500">IV Access:</span> {ivAccess}</p>

                  <div className="pt-2">
                    <span className="text-2xs font-bold text-slate-500 block uppercase mb-1">Emergency Medications Given</span>
                    <table className="w-full text-left text-2xs border-collapse border border-slate-300">
                      <thead className="bg-slate-100 font-bold border-b border-slate-300">
                        <tr>
                          <th className="p-1.5">Time</th>
                          <th className="p-1.5">Medication</th>
                          <th className="p-1.5">Dose</th>
                          <th className="p-1.5">Route</th>
                          <th className="p-1.5">Given By</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {medsGiven.map((m, idx) => (
                          <tr key={idx}>
                            <td className="p-1.5 font-mono">{m.time}</td>
                            <td className="p-1.5 font-bold">{m.drugName}</td>
                            <td className="p-1.5 font-mono">{m.dose}</td>
                            <td className="p-1.5">{m.route}</td>
                            <td className="p-1.5">{m.administeredBy}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Sign-off footer */}
                <div className="pt-6 border-t border-slate-300 grid grid-cols-2 gap-8 text-2xs">
                  <div>
                    <span className="text-slate-500 block mb-8">Referring Doctor Signature &amp; Stamp:</span>
                    <div className="border-t border-slate-400 pt-1 font-bold">
                      Dr. {doctorName} ({doctorMMC})
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500 block mb-8">Ambulance Paramedic / Receiving ED Handover:</span>
                    <div className="border-t border-slate-400 pt-1">
                      Name &amp; Staff ID: ______________________
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-line bg-slate-50 dark:bg-slate-900/40 flex items-center justify-between text-2xs text-muted shrink-0">
          <span className="flex items-center gap-1.5 font-medium">
            <ShieldAlert className="w-3.5 h-3.5 text-accent" />
            <span>MOH Emergency Transfer Handover Guideline &amp; MMC Statutory Code</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-ink bg-surface border border-line hover:bg-surface-accent rounded-none cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
