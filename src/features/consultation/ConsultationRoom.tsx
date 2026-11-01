import { StructuredSOAPDraft } from '../../domain/aiScribe';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Patient, Visit, ICD10Code, PrescriptionItem, Language, SOAPNotes, ClinicalProcedureItem
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
import CollapsibleQueuePanel from './room/CollapsibleQueuePanel';
import CollapsibleDiagnosisSummaryPanel from './room/CollapsibleDiagnosisSummaryPanel';
import ReviewSignoffModal from './room/ReviewSignoffModal';
import RedCodeAlarmModal from '../operations/RedCodeAlarmModal';
import { visitFromRow } from '../../lib/mappers';
import { formatTicket } from '../../domain/ticket';
import { calculatePatientAge } from '../../domain/patientAge';
import { ConsultationDraft, draftKey, getSavedDraft, parseDraft, saveDraft } from '../../domain/consultationDraft';

interface ConsultationRoomProps {
  currentPatient: Patient | null;
  activeVisit?: Visit | null;
  activeLanguage: Language;
  onConsultationComplete: (soapData: SOAPNotes, issueMc: boolean, mcDuration: number) => void;
  onCancel: () => void;
  onHoldForResults?: (visitId: string, currentSoap: SOAPNotes) => void;
  stationHud?: React.ReactNode;
  doctorQueue?: Visit[];
  holdingQueue?: Visit[];
  patientsMap?: Record<string, Patient>;
  onSelectPatient?: (visitId: string) => void;
  doctorName?: string;
}

export default function ConsultationRoom({
  currentPatient,
  activeVisit,
  activeLanguage,
  onConsultationComplete,
  onCancel,
  onHoldForResults,
  stationHud,
  doctorQueue = [],
  holdingQueue = [],
  patientsMap = {},
  onSelectPatient,
  doctorName = 'Consulting Medical Officer'
}: ConsultationRoomProps) {
  const [procedures, setProcedures] = useState<ClinicalProcedureItem[]>(() => activeVisit?.soap?.plan?.procedures || []);
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
  const [isRedCodeModalOpen, setIsRedCodeModalOpen] = useState(false);

  // Interactive past history view
  const [selectedPastVisit, setSelectedPastVisit] = useState<Visit | null>(null);
  const [showContextPanel, setShowContextPanel] = useState(false);

  // Collapsible 3-Panel State
  const [isLeftQueueOpen, setIsLeftQueueOpen] = useState(true);
  const [isRightSummaryOpen, setIsRightSummaryOpen] = useState(true);

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

  // Initial visit seeding & full draft restoration is unified in the effect below.

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

  // Calculate Patient Age with Clinical Precision
  const patientAgeDetails = useMemo(() => {
    return calculatePatientAge(currentPatient?.dob);
  }, [currentPatient?.dob]);
  const patientAge = patientAgeDetails.years;

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

  // Unified consultation draft restoration & persistent local autosave
  const restoredFor = useRef<string | null>(null);
  const clock = (t: number) => new Date(t).toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit' });
  const [draftToast, setDraftToast] = useState<string | null>(null);

  useEffect(() => {
    const id = activeVisit?.id;
    if (!id) return;
    restoredFor.current = null;
    let d: ConsultationDraft | null = null;
    try { d = getSavedDraft(id); } catch { /* storage unavailable */ }

    if (d) {
      if (d.activeTab) setActiveTab(d.activeTab);
      setSubjective(d.subjective);
      // Merge saved draft vitals with authoritative triage vitals:
      // Any vital recorded at triage is locked and always authoritative.
      const triageObj = activeVisit?.soap?.objective;
      const mergedVitals = {
        bpSystolic: (triageObj?.bpSystolic && triageObj.bpSystolic > 0) ? triageObj.bpSystolic : (d.vitals.bpSystolic || 0),
        bpDiastolic: (triageObj?.bpDiastolic && triageObj.bpDiastolic > 0) ? triageObj.bpDiastolic : (d.vitals.bpDiastolic || 0),
        heartRate: (triageObj?.heartRate && triageObj.heartRate > 0) ? triageObj.heartRate : (d.vitals.heartRate || 0),
        temperature: (triageObj?.temperature && triageObj.temperature > 0) ? triageObj.temperature : (d.vitals.temperature || 0),
        respiratoryRate: (triageObj?.respiratoryRate && triageObj.respiratoryRate > 0) ? triageObj.respiratoryRate : (d.vitals.respiratoryRate || 0),
      };
      setVitals(mergedVitals);
      setSelectedICD(d.icd);
      setClinicalNotes(d.clinicalNotes);
      setRxList(d.rx);
      setMcDays(d.mcDays);
      setMcGenerated(d.mcGenerated);
      setPharmacyMemo(d.pharmacyMemo);
      setReferralDetails(d.referralDetails);
      setReferralGenerated(d.referralGenerated);
      setLabOrders(d.labOrders ?? []);
      setLabReason(d.labReason ?? '');
      setMcReason(d.mcReason ?? '');
      setFollowUpWeeks(d.followUpWeeks ?? 0);
      if (d.procedures) setProcedures(d.procedures);
      setLastSavedTime(clock(d.savedAt));
    } else if (activeVisit?.soap) {
      // No saved draft yet: pre-fill from visit record
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
      if (activeVisit.soap.assessment) {
        if (activeVisit.soap.assessment.icdCode) {
          setSelectedICD({
            code: activeVisit.soap.assessment.icdCode,
            desc: activeVisit.soap.assessment.description || '',
            category: 'Assessment'
          });
        }
        if (activeVisit.soap.assessment.clinicalNotes) {
          setClinicalNotes(activeVisit.soap.assessment.clinicalNotes);
        }
      }
      if (activeVisit.soap.plan) {
        if (activeVisit.soap.plan.prescription) setRxList(activeVisit.soap.plan.prescription);
        if (activeVisit.soap.plan.procedures) setProcedures(activeVisit.soap.plan.procedures);
        if (activeVisit.soap.plan.mcDays) setMcDays(activeVisit.soap.plan.mcDays);
        if (activeVisit.soap.plan.pharmacyMemo) setPharmacyMemo(activeVisit.soap.plan.pharmacyMemo);
        if (activeVisit.soap.plan.referralDetails) {
          setReferralDetails(activeVisit.soap.plan.referralDetails);
          setReferralGenerated(Boolean(activeVisit.soap.plan.requiresReferral));
        }
        if (activeVisit.soap.plan.labOrders) setLabOrders(activeVisit.soap.plan.labOrders);
        if (activeVisit.soap.plan.labReason) setLabReason(activeVisit.soap.plan.labReason);
        if (activeVisit.soap.plan.mcReason) setMcReason(activeVisit.soap.plan.mcReason);
        if (activeVisit.soap.plan.followUpWeeks) setFollowUpWeeks(activeVisit.soap.plan.followUpWeeks);
      }
    }
    restoredFor.current = id;
  }, [activeVisit?.id]);

  const saveDraftNow = (isManual = false) => {
    const id = activeVisit?.id;
    if (!id || restoredFor.current !== id) return;
    const savedAt = Date.now();
    const draft: ConsultationDraft = {
      v: 1,
      activeTab,
      subjective,
      vitals,
      icd: selectedICD,
      clinicalNotes,
      rx: rxList,
      mcDays,
      mcGenerated,
      pharmacyMemo,
      referralDetails,
      referralGenerated,
      labOrders,
      labReason,
      mcReason,
      followUpWeeks,
      procedures,
      savedAt
    };
    saveDraft(id, draft);
    setLastSavedTime(clock(savedAt));
    if (isManual) {
      setDraftToast(`✓ Consultation draft saved at ${clock(savedAt)} (${activeTab.toUpperCase()}: ${selectedICD ? selectedICD.code : 'Diagnosis & notes preserved'})`);
      setTimeout(() => setDraftToast(null), 4000);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => saveDraftNow(false), 800);
    return () => clearTimeout(t);
  }, [activeTab, subjective, vitals, selectedICD, clinicalNotes, rxList, mcDays, mcGenerated, pharmacyMemo, referralDetails, referralGenerated, labOrders, labReason, mcReason, followUpWeeks]);

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
  const handleApplyAIScribe = (draft: StructuredSOAPDraft) => {
    setSubjective(draft.subjective);
    if (!clinicalNotes) {
      setClinicalNotes(draft.objectiveObservation);
    }
    if (!selectedICD && draft.suggestedICD10.length > 0) {
      setSelectedICD({
        code: draft.suggestedICD10[0].code,
        desc: draft.suggestedICD10[0].description,
        category: draft.suggestedICD10[0].category,
      });
    }
    setDraftToast(`✨ AI Scribe: Structured SOAP notes & ${draft.suggestedICD10[0]?.code || 'ICD-10'} synthesized from consultation speech.`);
  };

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
        procedures,
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

  const handleHoldForResults = () => {
    if (!activeVisit) return;
    saveDraftNow(true);
    const soapData: SOAPNotes = {
      subjective,
      objective: vitals,
      assessment: {
        icdCode: selectedICD?.code || 'N/A',
        description: selectedICD?.desc || 'N/A',
        clinicalNotes: clinicalNotes || 'N/A'
      },
      plan: {
        prescription: rxList,
        procedures,
        followUpWeeks,
        mcDays: mcGenerated ? (parseInt(mcDays.toString()) || 1) : 0,
        requiresReferral: referralGenerated,
        pharmacyMemo,
        mcReason: mcGenerated ? mcReason.trim() : undefined,
        labOrders,
        labReason: labOrders.length > 0 ? labReason.trim() : undefined,
        referralDetails: referralGenerated ? referralDetails : undefined
      }
    };
    if (onHoldForResults) {
      onHoldForResults(activeVisit.id, soapData);
    }
  };

  // Keyboard Shortcuts: Alt+1..4 for tabs, Ctrl+Enter opens Review Checklist Modal, Alt+? for Help
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key === '1') { e.preventDefault(); setActiveTab('subjective'); }
      if (e.altKey && e.key === '2') { e.preventDefault(); setActiveTab('objective'); }
      if (e.altKey && e.key === '3') { e.preventDefault(); setActiveTab('assessment'); }
      if (e.altKey && e.key === '4') { e.preventDefault(); setActiveTab('plan'); }
      if (e.altKey && (e.key === 'q' || e.key === 'Q')) { e.preventDefault(); setIsLeftQueueOpen(prev => !prev); }
      if (e.altKey && (e.key === 's' || e.key === 'S')) { e.preventDefault(); setIsRightSummaryOpen(prev => !prev); }
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
      <div className="bg-surface border-2 border-brand p-12 text-center rounded-none max-w-md mx-auto my-12 animate-fadeIn">
        <Lock className="w-12 h-12 text-accent mx-auto mb-4" />
        <h3 className="type-section-title text-ink">Privacy Lock Screen</h3>
        <p className="text-xs text-subtle dark:text-slate-400 mt-2 leading-relaxed">
          Clinician privacy screen is locked. Click unlock to resume encounter for <strong>{currentPatient.fullName}</strong>.
        </p>
        <button
          type="button"
          onClick={() => setIsLocked(false)}
          className="mt-6 w-full bg-primary hover:bg-primary-hover text-white py-2.5 font-bold text-xs uppercase tracking-wider rounded-none transition-all cursor-pointer"
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
    <div className="-mx-3 sm:-mx-5 -my-3 sm:-my-5 h-[calc(100vh-104px)] min-h-[500px] flex flex-col bg-surface text-ink dark:text-slate-50 overflow-hidden relative animate-fadeIn">
      
      {/* ========================================================================= */}
      {/* AREA 1: PERSISTENT PATIENT SAFETY HEADER WITH PII MASKING & AUTO-SAVE     */}
      {/* ========================================================================= */}
      <PatientSafetyHeader 
        ticketText={formatTicket(activeVisit?.ticketNo)} 
        allergies={currentPatient.drugAllergies} 
        vitalsText={triageVitals} 
        roomText={roomText} 
        currentPatient={currentPatient} 
        patientAge={patientAge} 
        patientAgeDisplay={patientAgeDetails.displayAge} 
        maskedIC={maskedIC} 
        setIsPiiRevealed={setIsPiiRevealed} 
        isPiiRevealed={isPiiRevealed} 
        maskedPhone={maskedPhone} 
        lastSavedTime={lastSavedTime} 
        completedStepsCount={completedStepsCount} 
        soapProgressPercent={soapProgressPercent} 
        setIsLocked={setIsLocked} 
        setShowShortcutsHelp={setShowShortcutsHelp} 
        showShortcutsHelp={showShortcutsHelp} 
        onTriggerRedCode={() => setIsRedCodeModalOpen(true)}
        isLeftQueueOpen={isLeftQueueOpen}
        onToggleLeftQueue={() => setIsLeftQueueOpen(prev => !prev)}
        isRightSummaryOpen={isRightSummaryOpen}
        onToggleRightSummary={() => setIsRightSummaryOpen(prev => !prev)}
      />

      {/* DRAFT SAVED NOTIFICATION TOAST BANNER */}
      {draftToast && (
        <div role="status" className="bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-400 text-emerald-900 dark:text-emerald-200 px-4 py-2.5 rounded-none text-xs font-mono font-bold flex items-center justify-between shadow-none animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{draftToast}</span>
          </div>
          <button type="button" onClick={() => setDraftToast(null)} className="p-1 hover:text-emerald-950 cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* KEYBOARD SHORTCUTS OVERLAY BANNER */}
      {showShortcutsHelp && (
        <div className="bg-surface-accent border border-line p-3 rounded-none flex items-center justify-between text-xs text-accent font-mono animate-fadeIn">
          <div className="flex flex-wrap items-center gap-4">
            <span><kbd className="bg-surface px-1.5 py-0.5 border border-line text-deep font-bold">Alt+1</kbd> Subjective</span>
            <span><kbd className="bg-surface px-1.5 py-0.5 border border-line text-deep font-bold">Alt+2</kbd> Objective Vitals</span>
            <span><kbd className="bg-surface px-1.5 py-0.5 border border-line text-deep font-bold">Alt+3</kbd> ICD-10 Diagnosis</span>
            <span><kbd className="bg-surface px-1.5 py-0.5 border border-line text-deep font-bold">Alt+4</kbd> Plan &amp; Rx</span>
            <span><kbd className="bg-surface px-1.5 py-0.5 border border-line text-deep font-bold">Alt+Q</kbd> Queue Panel</span>
            <span><kbd className="bg-surface px-1.5 py-0.5 border border-line text-deep font-bold">Alt+S</kbd> Summary Panel</span>
            <span><kbd className="bg-surface px-1.5 py-0.5 border border-line text-deep font-bold">Ctrl+Enter</kbd> Review &amp; Sign Off</span>
          </div>
          <button type="button" onClick={() => setShowShortcutsHelp(false)} className="text-slate-400 hover:text-muted">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3-PANEL FLEXIBLE CONSULTATION ARCHITECTURE                                */}
      {/* Panel 1 (Left): Collapsible Patient Queue (Sorted by Serial No)           */}
      {/* Section 2 (Center): Main SOAP Consultation Workspace                      */}
      {/* Panel 3 (Right): Collapsible Diagnosis Session Summary                    */}
      {/* ========================================================================= */}
      <div className="flex-1 flex overflow-hidden min-h-0 w-full relative">
        
        {/* 1. LEFT COLLAPSIBLE PATIENT QUEUE (Outside Content Section) */}
        <CollapsibleQueuePanel
          isOpen={isLeftQueueOpen}
          onToggle={() => setIsLeftQueueOpen(prev => !prev)}
          queue={doctorQueue}
          patientsMap={patientsMap}
          activeVisitId={activeVisit?.id}
          onSelectVisit={onSelectPatient}
          doctorName={doctorName}
        />

        {/* 2. CENTRAL SECTION: MAIN CONSULTATION ENCOUNTER WORKSPACE */}
        <main className="flex-1 min-w-0 h-full overflow-y-auto p-4 sm:p-6 flex flex-col justify-between space-y-5 bg-surface">
          
          <div className="space-y-4">
            
            {/* Quick Toggle for Patient Longitudinal History / Chronic Flowsheet */}
            <div className="flex items-center justify-between border-b border-line pb-2">
              <button
                type="button"
                onClick={() => setShowContextPanel(prev => !prev)}
                className={`px-2.5 py-1 text-2xs font-mono font-bold border rounded-none flex items-center gap-1.5 transition-colors cursor-pointer ${
                  showContextPanel 
                    ? 'bg-primary text-white border-primary' 
                    : 'bg-surface text-muted hover:text-ink border-line'
                }`}
                title="Toggle Patient Longitudinal History & Chronic Flowsheet"
              >
                <History className="w-3.5 h-3.5" />
                <span>{showContextPanel ? 'Hide Past History & Flowsheet' : `View Past History (${patientPastVisits.length} Visits)`}</span>
              </button>

              {stationHud && <div className="shrink-0">{stationHud}</div>}
            </div>

            {/* Embedded Expandable Context Panel (History & Flowsheet) */}
            {showContextPanel && (
              <div className="border border-line bg-surface-muted/30 p-3 rounded-none animate-fadeIn">
                <ContextPanel 
                  vitals={vitals} 
                  t={t} 
                  patientPastVisits={patientPastVisits} 
                  selectedPastVisit={selectedPastVisit} 
                  setSelectedPastVisit={setSelectedPastVisit} 
                />
              </div>
            )}

            {/* SINGLE UNIFIED CLINICAL COMMAND & STEPPER BAR */}
            <ConsultationStepper 
              activeTab={activeTab} 
              setActiveTab={setActiveTab} 
              subjective={subjective} 
              vitals={vitals} 
              selectedICD={selectedICD} 
              rxList={rxList}
              lastSavedTime={lastSavedTime}
            />

            {/* TAB CONTENT AREA */}
            <div className="min-h-[360px]">
              {activeTab === 'subjective' && (
                <SubjectiveTab 
                  subjective={subjective}
                  setSubjective={setSubjective}
                  patientPastVisits={patientPastVisits}
                  activeLanguage={activeLanguage}
                  onApplyAIScribe={handleApplyAIScribe}
                />
              )}

              {activeTab === 'objective' && (
                <ObjectiveTab
                  triageVitals={activeVisit?.soap?.objective}
                  vitals={vitals}
                  setVitals={setVitals}
                  patientPastVisits={patientPastVisits}
                  clinicalNotes={clinicalNotes}
                  setClinicalNotes={setClinicalNotes}
                />
              )}

              {activeTab === 'assessment' && (
                <AssessmentTab 
                  selectedICD={selectedICD}
                  setSelectedICD={setSelectedICD}
                  clinicalNotes={clinicalNotes}
                  setClinicalNotes={setClinicalNotes}
                  activeLanguage={activeLanguage}
                  onProceedToPlan={() => setActiveTab('plan')}
                  subjectiveSymptoms={subjective}
                />
              )}

              {activeTab === 'plan' && (
                <PlanTab
                  rxList={rxList}
                  setRxList={setRxList}
                  procedures={procedures}
                  setProcedures={setProcedures}
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
          <WorkflowToolbar 
            onCancel={handleReturn} 
            onSaveDraft={() => saveDraftNow(true)} 
            onHoldForResults={handleHoldForResults} 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
            handleOpenReviewModal={handleOpenReviewModal} 
            hint={getActionableStatusText()} 
            savedLabel={lastSavedTime ? `Draft kept on this device at ${lastSavedTime}` : 'Draft not saved yet'} 
          />

        </main>

        {/* 3. RIGHT COLLAPSIBLE DIAGNOSIS SESSION SUMMARY (Outside Content Section) */}
        <CollapsibleDiagnosisSummaryPanel
          isOpen={isRightSummaryOpen}
          onToggle={() => setIsRightSummaryOpen(prev => !prev)}
          subjective={subjective}
          vitals={vitals}
          selectedICD={selectedICD}
          clinicalNotes={clinicalNotes}
          rxList={rxList}
          procedures={procedures}
          mcDays={mcDays}
          mcReason={mcReason}
          mcGenerated={mcGenerated}
          referralGenerated={referralGenerated}
          referralDetails={referralDetails}
          labOrders={labOrders}
          onReviewSignoff={handleOpenReviewModal}
        />

      </div>

      {confirmReturn && (
      <div role="region" aria-label="Return patient modal overlay" onKeyDown={(e) => { if (e.key === 'Escape') setConfirmReturn(false); }} className="fixed inset-0 z-50 bg-night-950/70 backdrop-blur-xs flex items-center justify-center p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) setConfirmReturn(false); }}>
        <div role="alertdialog" aria-modal="true" aria-labelledby="return-title" aria-describedby="return-desc" className="bg-surface border-2 border-line w-full max-w-md p-5 space-y-3">
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

      <RedCodeAlarmModal
        isOpen={isRedCodeModalOpen}
        onClose={() => setIsRedCodeModalOpen(false)}
        defaultPatientName={currentPatient.fullName}
        defaultLocation="Consultation Room"
        defaultStaff="Consulting Medical Officer"
      />

    </div>
  );
}
