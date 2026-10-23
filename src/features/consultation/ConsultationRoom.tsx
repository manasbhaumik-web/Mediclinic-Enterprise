import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Patient, Visit, ICD10Code, PrescriptionItem, Language, SOAPNotes
} from '../../types';
import { 
  TRANSLATIONS 
} from '../../data';
import { useInventory } from '../../context/InventoryContext';
import { useAuxiliary } from '../../context/AuxiliaryContext';
import { supabase } from '../../lib/supabase';
import { 
  History, Stethoscope, Activity, ClipboardList, Pill, Plus, Trash2, 
  AlertTriangle, Check, FileText, Printer, Clock, Heart, Thermometer, Info, ChevronRight, UserMinus,
  Zap, Eye, EyeOff, TrendingUp, CheckCircle2, TestTube, Share, LineChart, Copy,
  X, Lock, ShieldAlert, Sparkles, ChevronDown, HelpCircle, ArrowRight, Save
} from 'lucide-react';
import SubjectiveTab from './SubjectiveTab';
import ObjectiveTab from './ObjectiveTab';
import AssessmentTab from './AssessmentTab';
import PlanTab from './PlanTab';
import { buttonProps, focusRing } from '../../lib/a11y';
import PatientSafetyHeader from './room/PatientSafetyHeader';
import ConsultationStepper from './room/ConsultationStepper';
import WorkflowToolbar from './room/WorkflowToolbar';
import ContextPanel from './room/ContextPanel';
import ReviewSignoffModal from './room/ReviewSignoffModal';
import { visitFromRow } from '../../lib/mappers';
import { formatTicket } from '../../domain/ticket';
import { ConsultationDraft, draftKey, parseDraft } from '../../domain/consultationDraft';

interface ConsultationRoomProps {
  currentPatient: Patient | null;
  activeVisit?: Visit | null;
  activeLanguage: Language;
  onConsultationComplete: (soapData: SOAPNotes, issueMc: boolean, mcDuration: number) => void;
  onCancel: () => void;
}

export default function ConsultationRoom({
  currentPatient,
  activeVisit,
  activeLanguage,
  onConsultationComplete,
  onCancel
}: ConsultationRoomProps) {
  // Translate labels
  const t = TRANSLATIONS[activeLanguage];
  const { inventory } = useInventory();
  const { icd10Catalog } = useAuxiliary();

  // Single Authoritative Stepper Workflow State: 1: Subjective -> 2: Objective -> 3: Assessment -> 4: Plan
  const [activeTab, setActiveTab] = useState<'subjective' | 'objective' | 'assessment' | 'plan'>('subjective');

  // PII Privacy Masking State
  const [isPiiRevealed, setIsPiiRevealed] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string>('');

  // Keyboard Hotkeys Help Overlay
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);

  // Final Consultation Review Checklist Modal
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  // Interactive past history view
  const [selectedPastVisit, setSelectedPastVisit] = useState<Visit | null>(null);

  // SOAP Inputs
  const [subjective, setSubjective] = useState('');
  
  // Vitals State
  // 0 means "not recorded". Nothing is assumed: the form starts empty and takes triage values when there are some.
  const [vitals, setVitals] = useState({
    bpSystolic: 0,
    bpDiastolic: 0,
    heartRate: 0,
    temperature: 0,
    respiratoryRate: 0
  });

  // Pre-fill vitals and chief complaint from initial triage registration
  useEffect(() => {
    if (activeVisit?.soap) {
      if (activeVisit.soap.subjective) setSubjective(activeVisit.soap.subjective);
      if (activeVisit.soap.objective) {
        setVitals({
          bpSystolic: activeVisit.soap.objective.bpSystolic || 0,
          bpDiastolic: activeVisit.soap.objective.bpDiastolic || 0,
          heartRate: activeVisit.soap.objective.heartRate || 0,
          temperature: activeVisit.soap.objective.temperature || 0,
          respiratoryRate: activeVisit.soap.objective.respiratoryRate || 0
        });
      }
    }
    // Seed once per visit: a live refresh of the visit must not overwrite what the doctor has typed.
  }, [activeVisit?.id]);

  // Automated Vitals Abnormality Helper
  const vitalsAlerts = useMemo(() => {
    const alerts: { label: string; value: string; isHigh: boolean; type: string }[] = [];
    if (vitals.temperature >= 37.5) {
      alerts.push({
        label: vitals.temperature >= 38.5 ? 'High Fever' : 'Mild Fever',
        value: `${vitals.temperature}°C`,
        isHigh: true,
        type: 'temp'
      });
    }
    if (vitals.bpSystolic >= 130 || vitals.bpDiastolic >= 85) {
      alerts.push({
        label: vitals.bpSystolic >= 140 || vitals.bpDiastolic >= 90 ? 'Stage 2 HTN' : 'Elevated BP',
        value: `${vitals.bpSystolic}/${vitals.bpDiastolic} mmHg`,
        isHigh: true,
        type: 'bp'
      });
    }
    if (vitals.heartRate >= 100) {
      alerts.push({
        label: 'Tachycardia',
        value: `${vitals.heartRate} bpm`,
        isHigh: true,
        type: 'hr'
      });
    } else if (vitals.heartRate > 0 && vitals.heartRate < 60) {
      alerts.push({
        label: 'Bradycardia',
        value: `${vitals.heartRate} bpm`,
        isHigh: false,
        type: 'hr'
      });
    }
    if (vitals.respiratoryRate >= 20) {
      alerts.push({
        label: 'Tachypnea',
        value: `${vitals.respiratoryRate} bpm`,
        isHigh: true,
        type: 'rr'
      });
    }
    return alerts;
  }, [vitals]);

  // Assessment State
  const [selectedICD, setSelectedICD] = useState<ICD10Code | null>(null);
  const [clinicalNotes, setClinicalNotes] = useState('');

  // Plan State (Prescription builder)
  const [rxList, setRxList] = useState<PrescriptionItem[]>([]);

  // MC Generator
  const [mcDays, setMcDays] = useState<number | ''>(1);
  const [mcGenerated, setMcGenerated] = useState(false);

  // Pharmacy Memo
  const [pharmacyMemo, setPharmacyMemo] = useState('');

  // Referral State
  const [referralDetails, setReferralDetails] = useState({
    hospital: '',
    department: '',
    reason: ''
  });
  const [referralGenerated, setReferralGenerated] = useState(false);

  // Plan details the doctor enters; nothing is pre-selected or pre-filled.
  const [labOrders, setLabOrders] = useState<string[]>([]);
  const [labReason, setLabReason] = useState('');
  const [mcReason, setMcReason] = useState('');
  const [followUpWeeks, setFollowUpWeeks] = useState<number>(0);

  // Populate longitudinal history for active patient
  const [patientPastVisits, setPatientPastVisits] = useState<Visit[]>([]);

  useEffect(() => {
    if (!currentPatient) return;
    let live = true;
    supabase.from('visits')
      .select('*, soap_notes(*), prescriptions(*)')
      .eq('patient_id', currentPatient.id)
      .in('status', ['Awaiting Dispensation', 'Dispensing', 'Awaiting Billing', 'Paid'])
      .order('created_at', { ascending: false })
      .limit(10)
      .then(({ data }) => {
        if (live && data) setPatientPastVisits(data.map(visitFromRow).filter((v) => v.id !== activeVisit?.id));
      });
    return () => { live = false; };
  }, [currentPatient?.id, activeVisit?.id]);

  // Calculate Patient Age
  const patientAge = useMemo(() => {
    if (!currentPatient?.dob) return 30;
    const birthYear = new Date(currentPatient.dob).getFullYear();
    const currentYear = new Date().getFullYear();
    return currentYear - birthYear;
  }, [currentPatient]);

  // PII Masking Utilities
  const maskedIC = useMemo(() => {
    if (!currentPatient?.icNumber) return 'N/A';
    if (isPiiRevealed) return currentPatient.icNumber;
    return `${currentPatient.icNumber.slice(0, 6)}-${currentPatient.icNumber.slice(6, 8)}-****`;
  }, [currentPatient, isPiiRevealed]);

  const maskedPhone = useMemo(() => {
    if (!currentPatient?.phone) return 'N/A';
    if (isPiiRevealed) return currentPatient.phone;
    return `${currentPatient.phone.slice(0, 4)}***${currentPatient.phone.slice(-2)}`;
  }, [currentPatient, isPiiRevealed]);

  // A consultation in progress is kept for this browser session; restoring it wins over the triage pre-fill.
  const restoredFor = useRef<string | null>(null);
  const clock = (t: number) => new Date(t).toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit' });
  useEffect(() => {
    const id = activeVisit?.id;
    if (!id) return;
    restoredFor.current = null;
    let d: ConsultationDraft | null = null;
    try { d = parseDraft(sessionStorage.getItem(draftKey(id))); } catch { /* storage unavailable */ }
    if (d) {
      setSubjective(d.subjective); setVitals(d.vitals); setSelectedICD(d.icd); setClinicalNotes(d.clinicalNotes);
      setRxList(d.rx); setMcDays(d.mcDays); setMcGenerated(d.mcGenerated); setPharmacyMemo(d.pharmacyMemo);
      setReferralDetails(d.referralDetails); setReferralGenerated(d.referralGenerated);
      setLabOrders(d.labOrders ?? []); setLabReason(d.labReason ?? ''); setMcReason(d.mcReason ?? ''); setFollowUpWeeks(d.followUpWeeks ?? 0);
      setLastSavedTime(clock(d.savedAt));
    }
    restoredFor.current = id;
  }, [activeVisit?.id]);

  const saveDraftNow = () => {
    const id = activeVisit?.id;
    if (!id || restoredFor.current !== id) return;
    const savedAt = Date.now();
    const draft: ConsultationDraft = { v: 1, subjective, vitals, icd: selectedICD, clinicalNotes, rx: rxList, mcDays, mcGenerated, pharmacyMemo, referralDetails, referralGenerated, labOrders, labReason, mcReason, followUpWeeks, savedAt };
    try { sessionStorage.setItem(draftKey(id), JSON.stringify(draft)); setLastSavedTime(clock(savedAt)); } catch { /* storage full or unavailable */ }
  };
  useEffect(() => {
    const t = setTimeout(saveDraftNow, 800);
    return () => clearTimeout(t);
  }, [subjective, vitals, selectedICD, clinicalNotes, rxList, mcDays, mcGenerated, pharmacyMemo, referralDetails, referralGenerated, labOrders, labReason, mcReason, followUpWeeks]);

  if (!currentPatient) {
    return (
      <div className="bg-surface p-12 text-center rounded-none border border-line-subtle">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
        <h3 className="type-section-title text-ink">No Patient Selected</h3>
        <p className="text-subtle dark:text-slate-400 text-xs mt-1">Please select an outpatient from the waiting queue to begin clinical documentation.</p>
      </div>
    );
  }

  // Authoritative Single Progress & Step Requirements
  const soapSteps = [
    { key: 'subjective', title: '1. Subjective History', isDone: subjective.trim().length > 0 },
    { key: 'objective', title: '2. Objective Vitals', isDone: vitals.temperature > 0 || vitals.bpSystolic > 0 || vitals.heartRate > 0 || vitals.respiratoryRate > 0 },
    { key: 'assessment', title: '3. ICD-10 Diagnosis', isDone: selectedICD !== null },
    { key: 'plan', title: '4. Plan & Prescribe', isDone: rxList.length > 0 || (clinicalNotes && clinicalNotes.trim().length > 0) }
  ];
  const completedStepsCount = soapSteps.filter(s => s.isDone).length;
  const soapProgressPercent = Math.round((completedStepsCount / 4) * 100);

  // Actionable Status Requirement Text
  const getActionableStatusText = () => {
    if (!subjective.trim()) return 'Action Required: Record Subjective Symptoms';
    if (!selectedICD) return 'Action Required: Assign ICD-10 Diagnosis';
    if (rxList.length === 0) return 'Optional: Prescribe medications or proceed to review';
    return 'Ready for final consultation review and sign-off';
  };

  // Open Final Review Checklist Modal
  const handleOpenReviewModal = () => {
    if (!selectedICD) {
      // The hint beside the button says what is missing; take the doctor to the step that needs it.
      setActiveTab('assessment');
      return;
    }
    setIsReviewModalOpen(true);
  };

  // Leaving puts the patient back in the queue and discards the draft, so confirm only when there is something to lose.
  const [confirmReturn, setConfirmReturn] = useState(false);
  const hasWork = !!selectedICD || rxList.length > 0 || clinicalNotes.trim().length > 0 || pharmacyMemo.trim().length > 0
    || subjective.trim() !== (activeVisit?.soap?.subjective ?? '').trim();
  const handleReturn = () => (hasWork ? setConfirmReturn(true) : onCancel());

  // Final Signoff Action
  const handleFinalSignoff = () => {
    const soapData = {
      subjective,
      objective: vitals,
      assessment: {
        icdCode: selectedICD?.code || 'N/A',
        description: selectedICD?.desc || 'N/A',
        clinicalNotes: clinicalNotes || 'N/A'
      },
      plan: {
        prescription: rxList,
        followUpWeeks,
        mcDays: mcGenerated ? (parseInt(mcDays.toString()) || 1) : 0,
        requiresReferral: referralGenerated,
        pharmacyMemo: pharmacyMemo,
        mcReason: mcGenerated ? mcReason.trim() : undefined,
        labOrders,
        labReason: labOrders.length > 0 ? labReason.trim() : undefined,
        referralDetails: referralGenerated ? referralDetails : undefined
      }
    };

    setIsReviewModalOpen(false);
    onConsultationComplete(soapData, mcGenerated, parseInt(mcDays.toString()) || 1);
  };

  // Keyboard Shortcuts: Alt+1..4 for tabs, Ctrl+Enter opens Review Checklist Modal, Alt+? for Help
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key === '1') { e.preventDefault(); setActiveTab('subjective'); }
      if (e.altKey && e.key === '2') { e.preventDefault(); setActiveTab('objective'); }
      if (e.altKey && e.key === '3') { e.preventDefault(); setActiveTab('assessment'); }
      if (e.altKey && e.key === '4') { e.preventDefault(); setActiveTab('plan'); }
      if (e.altKey && (e.key === '?' || e.key === '/')) { e.preventDefault(); setShowShortcutsHelp(prev => !prev); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleOpenReviewModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [subjective, vitals, selectedICD, clinicalNotes, rxList, activeLanguage]);

  if (isLocked) {
    return (
      <div className="bg-surface border-2 border-brand p-12 text-center rounded-none shadow-2xl max-w-md mx-auto my-12 animate-fadeIn">
        <Lock className="w-12 h-12 text-accent mx-auto mb-4" />
        <h3 className="type-section-title text-ink">Privacy Lock Screen</h3>
        <p className="text-xs text-subtle dark:text-slate-400 mt-2 leading-relaxed">
          Clinician privacy screen is locked. Click unlock to resume encounter for <strong>{currentPatient.fullName}</strong>.
        </p>
        <button
          type="button"
          onClick={() => setIsLocked(false)}
          className="mt-6 w-full bg-primary hover:bg-primary-hover text-white py-2.5 font-bold text-xs uppercase tracking-wider rounded-none shadow-xs transition-all cursor-pointer"
        >
          Unlock Consultation Room
        </button>
      </div>
    );
  }

  // Vitals as recorded at triage (not the editable form defaults), and where the patient was called to.
  const triage = activeVisit?.soap?.objective;
  const triageVitals = triage && (triage.bpSystolic || triage.temperature || triage.heartRate)
    ? [triage.bpSystolic ? `BP ${triage.bpSystolic}/${triage.bpDiastolic}` : '', triage.temperature ? `Temp ${triage.temperature}` : '', triage.heartRate ? `HR ${triage.heartRate}` : ''].filter(Boolean).join(' · ')
    : undefined;
  const roomText = activeVisit?.consultRoom ? `${activeVisit.consultRoom}${activeVisit.calledAt ? `, called ${new Date(activeVisit.calledAt).toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit' })}` : ''}` : undefined;

  return (
    <div className="space-y-4 pb-16 relative animate-fadeIn text-ink dark:text-slate-50">
      
      {/* ========================================================================= */}
      {/* AREA 1: PERSISTENT PATIENT SAFETY HEADER WITH PII MASKING & AUTO-SAVE     */}
      {/* ========================================================================= */}
      <PatientSafetyHeader ticketText={formatTicket(activeVisit?.ticketNo)} allergies={currentPatient.drugAllergies} vitalsText={triageVitals} roomText={roomText} currentPatient={currentPatient} patientAge={patientAge} maskedIC={maskedIC} setIsPiiRevealed={setIsPiiRevealed} isPiiRevealed={isPiiRevealed} maskedPhone={maskedPhone} lastSavedTime={lastSavedTime} completedStepsCount={completedStepsCount} soapProgressPercent={soapProgressPercent} setIsLocked={setIsLocked} setShowShortcutsHelp={setShowShortcutsHelp} showShortcutsHelp={showShortcutsHelp} />

      {/* KEYBOARD SHORTCUTS OVERLAY BANNER */}
      {showShortcutsHelp && (
        <div className="bg-surface-accent border border-line p-3 rounded-none flex items-center justify-between text-xs text-accent font-mono animate-fadeIn">
          <div className="flex flex-wrap items-center gap-4">
            <span><kbd className="bg-surface px-1.5 py-0.5 border border-line text-deep font-bold">Alt+1</kbd> Subjective</span>
            <span><kbd className="bg-surface px-1.5 py-0.5 border border-line text-deep font-bold">Alt+2</kbd> Objective Vitals</span>
            <span><kbd className="bg-surface px-1.5 py-0.5 border border-line text-deep font-bold">Alt+3</kbd> ICD-10 Diagnosis</span>
            <span><kbd className="bg-surface px-1.5 py-0.5 border border-line text-deep font-bold">Alt+4</kbd> Plan &amp; Rx</span>
            <span><kbd className="bg-surface px-1.5 py-0.5 border border-line text-deep font-bold">Ctrl+Enter</kbd> Review &amp; Sign Off</span>
          </div>
          <button type="button" onClick={() => setShowShortcutsHelp(false)} className="text-slate-400 hover:text-muted">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* AREA 2 & 3: MAIN ENCOUNTER WORKSPACE + CONTEXTUAL RIGHT PANEL             */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch min-h-[500px]">
        
        {/* AREA 2: MAIN CONSULTATION WORKSPACE (8 COLS / 65%) */}
        <div className="lg:col-span-8 bg-surface border border-line-subtle p-5 rounded-none flex flex-col justify-between shadow-xs space-y-5">
          
          <div className="space-y-4">
            
            {/* EXPLICIT CLINICAL WORKFLOW STATE SEQUENCE BAR */}
            <div className="bg-surface-muted border border-line-subtle p-2 rounded-none flex items-center justify-between text-2xs font-mono font-bold">
              <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar">
                <span className="bg-primary text-white px-2 py-0.5 rounded-none flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-300" />
                  1. Draft Saved
                </span>
                <span className="text-slate-400">➔</span>
                <span className={`px-2 py-0.5 rounded-none border ${selectedICD ? 'bg-surface text-accent border-brand' : 'bg-surface-accent text-subtle dark:text-slate-400 border-line'}`}>
                  2. Ready for Review
                </span>
                <span className="text-slate-400">➔</span>
                <span className="bg-surface-accent text-subtle dark:text-slate-400 border border-line px-2 py-0.5 rounded-none">
                  3. Signed Note
                </span>
                <span className="text-slate-400">➔</span>
                <span className="bg-surface-accent text-subtle dark:text-slate-400 border border-line px-2 py-0.5 rounded-none">
                  4. Prescription Routed
                </span>
                <span className="text-slate-400">➔</span>
                <span className="bg-surface-accent text-subtle dark:text-slate-400 border border-line px-2 py-0.5 rounded-none">
                  5. Encounter Closed
                </span>
              </div>
              <span className="text-2xs text-accent shrink-0 font-sans hidden sm:inline">
                Autosaved · {lastSavedTime}
              </span>
            </div>

            {/* STEPPER HEADER TOOLBAR */}
            <div className="bg-surface p-3.5 border border-line-subtle rounded-none flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-2xs font-bold text-accent uppercase tracking-wider block font-mono">Consultation Draft in Progress</span>
                <h3 className="type-card-title text-ink flex items-center gap-1.5 mt-0.5">
                  <Stethoscope className="w-4 h-4 text-accent" />
                  <span>Encounter Workspace — {activeTab.toUpperCase()}</span>
                </h3>
              </div>

              {/* Actionable Requirement Status Text */}
              <div className="bg-surface px-3 py-1.5 border border-line text-2xs font-bold text-accent rounded-none">
                {activeTab === 'subjective' && (subjective.trim() ? 'Subjective: Complete ✓' : 'Subjective: Enter Symptoms')}
                {activeTab === 'objective' && (vitals.temperature > 0 ? 'Objective: Vitals Complete ✓' : 'Objective: Check Vitals')}
                {activeTab === 'assessment' && (selectedICD ? `Assessment: ${selectedICD.code} Selected ✓` : 'Required Next: Select ICD-10 Diagnosis')}
                {activeTab === 'plan' && (rxList.length > 0 ? `Plan: ${rxList.length} Rx Items Ready` : 'Plan: Add Prescriptions / Lab Orders')}
              </div>
            </div>

            {/* SINGLE UNIFIED STEPPER NAVIGATION TABS */}
            <ConsultationStepper activeTab={activeTab} setActiveTab={setActiveTab} subjective={subjective} vitals={vitals} selectedICD={selectedICD} rxList={rxList} />

            {/* TAB CONTENT AREA */}
            <div className="min-h-[360px]">
              {activeTab === 'subjective' && (
                <SubjectiveTab 
                  subjective={subjective}
                  setSubjective={setSubjective}
                  patientPastVisits={patientPastVisits}
                  activeLanguage={activeLanguage}
                />
              )}

              {activeTab === 'objective' && (
                <ObjectiveTab
                  triageVitals={activeVisit?.soap?.objective}
                  vitals={vitals}
                  setVitals={setVitals}
                  patientPastVisits={patientPastVisits}
                />
              )}

              {activeTab === 'assessment' && (
                <AssessmentTab 
                  selectedICD={selectedICD}
                  setSelectedICD={setSelectedICD}
                  clinicalNotes={clinicalNotes}
                  setClinicalNotes={setClinicalNotes}
                  activeLanguage={activeLanguage}
                />
              )}

              {activeTab === 'plan' && (
                <PlanTab
                  rxList={rxList}
                  setRxList={setRxList}
                  currentPatient={currentPatient}
                  selectedICD={selectedICD}
                  mcDays={mcDays}
                  setMcDays={setMcDays}
                  mcGenerated={mcGenerated}
                  setMcGenerated={setMcGenerated}
                  pharmacyMemo={pharmacyMemo}
                  setPharmacyMemo={setPharmacyMemo}
                  referralDetails={referralDetails}
                  labOrders={labOrders} setLabOrders={setLabOrders}
                  labReason={labReason} setLabReason={setLabReason}
                  mcReason={mcReason} setMcReason={setMcReason}
                  followUpWeeks={followUpWeeks} setFollowUpWeeks={setFollowUpWeeks}
                  setReferralDetails={setReferralDetails}
                  referralGenerated={referralGenerated}
                  setReferralGenerated={setReferralGenerated}
                />
              )}
            </div>

          </div>

          {/* SINGLE PRIMARY WORKFLOW CTA TOOLBAR */}
          <WorkflowToolbar onCancel={handleReturn} onSaveDraft={saveDraftNow} activeTab={activeTab} setActiveTab={setActiveTab} handleOpenReviewModal={handleOpenReviewModal} hint={getActionableStatusText()} savedLabel={lastSavedTime ? `Draft kept on this device at ${lastSavedTime}` : 'Draft not saved yet'} />

        </div>

        {/* AREA 3: CONTEXTUAL RIGHT PANEL — SUPPORTING DATA & QUICK TOOLS (4 COLS / 35%) */}
        <ContextPanel vitals={vitals} t={t} patientPastVisits={patientPastVisits} selectedPastVisit={selectedPastVisit} setSelectedPastVisit={setSelectedPastVisit} />

      </div>

      {confirmReturn && (
      <div className="fixed inset-0 z-50 bg-night-950/70 backdrop-blur-xs flex items-center justify-center p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) setConfirmReturn(false); }}>
        <div role="alertdialog" aria-modal="true" aria-labelledby="return-title" aria-describedby="return-desc" className="bg-surface border border-line w-full max-w-md p-5 space-y-3 shadow-2xl">
          <h3 id="return-title" className="type-heading-caps text-ink">Return patient to the queue?</h3>
          <p id="return-desc" className="text-xs text-muted">Your notes for this consultation will be discarded and {currentPatient.fullName} goes back to the waiting list for anyone to call.</p>
          <div className="flex justify-end gap-2">
            <button type="button" autoFocus className="btn-secondary" onClick={() => setConfirmReturn(false)}>Keep working</button>
            <button type="button" className="btn-danger" onClick={() => { setConfirmReturn(false); onCancel(); }}>Return patient</button>
          </div>
        </div>
      </div>
    )}

      {/* ========================================================================= */}
      {/* AREA 4: SAFE CONSULTATION REVIEW & SIGN-OFF CHECKLIST MODAL DIALOG        */}
      {/* ========================================================================= */}
      {isReviewModalOpen && (
      <ReviewSignoffModal setIsReviewModalOpen={setIsReviewModalOpen} currentPatient={currentPatient} maskedIC={maskedIC} selectedICD={selectedICD} rxList={rxList} handleFinalSignoff={handleFinalSignoff} />
      )}

    </div>
  );
}
