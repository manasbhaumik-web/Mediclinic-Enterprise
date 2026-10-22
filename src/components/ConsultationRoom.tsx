import React, { useState, useEffect, useMemo } from 'react';
import {
  Patient, Visit, ICD10Code, PrescriptionItem, Language, SOAPNotes
} from '../types';
import { 
  TRANSLATIONS 
} from '../data';
import { useInventory } from '../context/InventoryContext';
import { useAuxiliary } from '../context/AuxiliaryContext';
import { supabase } from '../lib/supabase';
import { 
  History, Stethoscope, Activity, ClipboardList, Pill, Plus, Trash2, 
  AlertTriangle, Check, FileText, Printer, Clock, Heart, Thermometer, Info, ChevronRight, UserMinus,
  Mic, MicOff, Bluetooth, Zap, Eye, EyeOff, TrendingUp, Brain, CheckCircle2, TestTube, Share, LineChart, Copy,
  X, Lock, ShieldAlert, Sparkles, ChevronDown, HelpCircle, ArrowRight, Save
} from 'lucide-react';
import SubjectiveTab from './consultation/SubjectiveTab';
import ObjectiveTab from './consultation/ObjectiveTab';
import AssessmentTab from './consultation/AssessmentTab';
import PlanTab from './consultation/PlanTab';
import { buttonProps, focusRing } from '../lib/a11y';
import PatientSafetyHeader from './consultation/room/PatientSafetyHeader';
import ConsultationStepper from './consultation/room/ConsultationStepper';
import WorkflowToolbar from './consultation/room/WorkflowToolbar';
import ContextPanel from './consultation/room/ContextPanel';
import ReviewSignoffModal from './consultation/room/ReviewSignoffModal';

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
  const [lastSavedTime, setLastSavedTime] = useState<string>('Just now');

  // Keyboard Hotkeys Help Overlay
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);

  // Final Consultation Review Checklist Modal
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  // Interactive past history view
  const [selectedPastVisit, setSelectedPastVisit] = useState<Visit | null>(null);

  // AI Decision Support Acceptance State
  const [aiDraftAccepted, setAiDraftAccepted] = useState(false);
  const [aiDraftDismissed, setAiDraftDismissed] = useState(false);

  // SOAP Inputs
  const [subjective, setSubjective] = useState('');
  
  // Vitals State
  const [vitals, setVitals] = useState({
    bpSystolic: 120,
    bpDiastolic: 80,
    heartRate: 72,
    temperature: 36.8,
    respiratoryRate: 16
  });

  // Pre-fill vitals and chief complaint from initial triage registration
  useEffect(() => {
    if (activeVisit?.soap) {
      if (activeVisit.soap.subjective) setSubjective(activeVisit.soap.subjective);
      if (activeVisit.soap.objective) {
        setVitals({
          bpSystolic: activeVisit.soap.objective.bpSystolic || 120,
          bpDiastolic: activeVisit.soap.objective.bpDiastolic || 80,
          heartRate: activeVisit.soap.objective.heartRate || 72,
          temperature: activeVisit.soap.objective.temperature || 36.8,
          respiratoryRate: activeVisit.soap.objective.respiratoryRate || 16
        });
      }
    }
  }, [activeVisit]);

  // Automated Vitals Abnormality Helper
  const vitalsAlerts = useMemo(() => {
    const alerts: { label: string; value: string; isHigh: boolean; type: string }[] = [];
    if (vitals.temperature >= 37.5) {
      alerts.push({
        label: vitals.temperature >= 38.5 ? '⚠️ High Fever' : '⚠️ Mild Fever',
        value: `${vitals.temperature}°C`,
        isHigh: true,
        type: 'temp'
      });
    }
    if (vitals.bpSystolic >= 130 || vitals.bpDiastolic >= 85) {
      alerts.push({
        label: vitals.bpSystolic >= 140 || vitals.bpDiastolic >= 90 ? '⚠️ Stage 2 HTN' : '⚠️ Elevated BP',
        value: `${vitals.bpSystolic}/${vitals.bpDiastolic} mmHg`,
        isHigh: true,
        type: 'bp'
      });
    }
    if (vitals.heartRate >= 100) {
      alerts.push({
        label: '⚠️ Tachycardia',
        value: `${vitals.heartRate} bpm`,
        isHigh: true,
        type: 'hr'
      });
    } else if (vitals.heartRate > 0 && vitals.heartRate < 60) {
      alerts.push({
        label: '⚠️ Bradycardia',
        value: `${vitals.heartRate} bpm`,
        isHigh: false,
        type: 'hr'
      });
    }
    if (vitals.respiratoryRate >= 20) {
      alerts.push({
        label: '⚠️ Tachypnea',
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

  // Populate longitudinal history for active patient
  const [patientPastVisits, setPatientPastVisits] = useState<Visit[]>([]);

  useEffect(() => {
    if (currentPatient) {
      supabase.from('visits')
        .select('*')
        .eq('patientId', currentPatient.id)
        .neq('status', 'Consultation')
        .order('createdAt', { ascending: false })
        .then(({ data }) => {
          if (data) setPatientPastVisits(data as any[]);
        });
    }
  }, [currentPatient]);

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

  if (!currentPatient) {
    return (
      <div className="bg-white dark:bg-night-850 p-12 text-center rounded-none border border-line-subtle dark:border-teal-800/40">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
        <h3 className="type-section-title text-ink dark:text-teal-300">No Patient Selected</h3>
        <p className="text-subtle dark:text-slate-400 text-xs mt-1">Please select an outpatient from the waiting queue to begin clinical documentation.</p>
      </div>
    );
  }

  // Authoritative Single Progress & Step Requirements
  const soapSteps = [
    { key: 'subjective', title: '1. Subjective History', isDone: subjective.trim().length > 0 },
    { key: 'objective', title: '2. Objective Vitals', isDone: vitals.temperature > 0 },
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
      alert(activeLanguage === 'EN' ? 'Please select an ICD-10 diagnostic code before signing off.' : 'Sila pilih kod Pengelasan Diagnostik (ICD-10) sebelum menandatangani kes.');
      setActiveTab('assessment');
      return;
    }
    setIsReviewModalOpen(true);
  };

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
        followUpWeeks: 1,
        mcDays: mcGenerated ? (parseInt(mcDays.toString()) || 1) : 0,
        requiresReferral: referralGenerated,
        pharmacyMemo: pharmacyMemo,
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
      <div className="bg-white dark:bg-night-900 border-2 border-brand p-12 text-center rounded-none shadow-2xl max-w-md mx-auto my-12 animate-fadeIn">
        <Lock className="w-12 h-12 text-accent mx-auto mb-4" />
        <h3 className="type-section-title text-ink dark:text-teal-300">Privacy Lock Screen</h3>
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

  return (
    <div className="space-y-4 pb-16 relative animate-fadeIn text-ink dark:text-slate-50">
      
      {/* ========================================================================= */}
      {/* AREA 1: PERSISTENT PATIENT SAFETY HEADER WITH PII MASKING & AUTO-SAVE     */}
      {/* ========================================================================= */}
      <PatientSafetyHeader currentPatient={currentPatient} patientAge={patientAge} maskedIC={maskedIC} setIsPiiRevealed={setIsPiiRevealed} isPiiRevealed={isPiiRevealed} maskedPhone={maskedPhone} lastSavedTime={lastSavedTime} completedStepsCount={completedStepsCount} soapProgressPercent={soapProgressPercent} setIsLocked={setIsLocked} setShowShortcutsHelp={setShowShortcutsHelp} showShortcutsHelp={showShortcutsHelp} />

      {/* KEYBOARD SHORTCUTS OVERLAY BANNER */}
      {showShortcutsHelp && (
        <div className="bg-surface-accent dark:bg-night-850 border border-line dark:border-teal-800/50 p-3 rounded-none flex items-center justify-between text-xs text-accent dark:text-teal-300 font-mono animate-fadeIn">
          <div className="flex flex-wrap items-center gap-4">
            <span><kbd className="bg-white dark:bg-night-900 px-1.5 py-0.5 border border-line text-deep font-bold">Alt+1</kbd> Subjective</span>
            <span><kbd className="bg-white dark:bg-night-900 px-1.5 py-0.5 border border-line text-deep font-bold">Alt+2</kbd> Objective Vitals</span>
            <span><kbd className="bg-white dark:bg-night-900 px-1.5 py-0.5 border border-line text-deep font-bold">Alt+3</kbd> ICD-10 Diagnosis</span>
            <span><kbd className="bg-white dark:bg-night-900 px-1.5 py-0.5 border border-line text-deep font-bold">Alt+4</kbd> Plan &amp; Rx</span>
            <span><kbd className="bg-white dark:bg-night-900 px-1.5 py-0.5 border border-line text-deep font-bold">Ctrl+Enter</kbd> Review &amp; Sign Off</span>
          </div>
          <button type="button" onClick={() => setShowShortcutsHelp(false)} className="text-slate-400 hover:text-muted">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* HIGH-PRIORITY PERSISTENT DRUG ALLERGY SAFETY ALERT BANNER                 */}
      {/* ========================================================================= */}
      {currentPatient.drugAllergies.length > 0 && (
        <div className="bg-rose-50/60 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 p-3.5 rounded-none flex items-center justify-between gap-3 text-rose-900 dark:text-rose-200 shadow-2xs animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-none bg-rose-500 text-white flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4.5 h-4.5" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-rose-800 dark:text-rose-300">
                <span>CRITICAL PATIENT SAFETY ALERT: REGISTERED DRUG ALLERGIES</span>
              </div>
              <p className="text-xs mt-0.5 font-medium text-rose-700/90 dark:text-rose-300/90">
                Patient registered allergies: <strong className="font-bold underline uppercase">{currentPatient.drugAllergies.join(', ')}</strong>. Automatic contraindication checks active.
              </p>
            </div>
          </div>
          <span className="bg-rose-500 text-white font-mono text-2xs font-bold uppercase px-2.5 py-1 rounded-none shrink-0">
            SAFETY CHECKS ENFORCED
          </span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* AREA 2 & 3: MAIN ENCOUNTER WORKSPACE + CONTEXTUAL RIGHT PANEL             */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch min-h-[500px]">
        
        {/* AREA 2: MAIN CONSULTATION WORKSPACE (8 COLS / 65%) */}
        <div className="lg:col-span-8 bg-surface dark:bg-night-900 border border-line-subtle dark:border-teal-800/40 p-5 rounded-none flex flex-col justify-between shadow-xs space-y-5">
          
          <div className="space-y-4">
            
            {/* EXPLICIT CLINICAL WORKFLOW STATE SEQUENCE BAR */}
            <div className="bg-surface-muted dark:bg-night-850 border border-line-subtle dark:border-teal-800/40 p-2 rounded-none flex items-center justify-between text-2xs font-mono font-bold">
              <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar">
                <span className="bg-primary text-white px-2 py-0.5 rounded-none flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-300" />
                  1. Draft Saved
                </span>
                <span className="text-slate-400">➔</span>
                <span className={`px-2 py-0.5 rounded-none border ${selectedICD ? 'bg-surface dark:bg-night-800 text-accent dark:text-teal-300 border-brand' : 'bg-surface-accent dark:bg-night-850 text-subtle dark:text-slate-400 border-line dark:border-teal-800/40'}`}>
                  2. Ready for Review
                </span>
                <span className="text-slate-400">➔</span>
                <span className="bg-surface-accent dark:bg-night-850 text-subtle dark:text-slate-400 border border-line dark:border-teal-800/40 px-2 py-0.5 rounded-none">
                  3. Signed Note
                </span>
                <span className="text-slate-400">➔</span>
                <span className="bg-surface-accent dark:bg-night-850 text-subtle dark:text-slate-400 border border-line dark:border-teal-800/40 px-2 py-0.5 rounded-none">
                  4. Prescription Routed
                </span>
                <span className="text-slate-400">➔</span>
                <span className="bg-surface-accent dark:bg-night-850 text-subtle dark:text-slate-400 border border-line dark:border-teal-800/40 px-2 py-0.5 rounded-none">
                  5. Encounter Closed
                </span>
              </div>
              <span className="text-2xs text-accent dark:text-teal-300 shrink-0 font-sans hidden sm:inline">
                Autosaved · {lastSavedTime}
              </span>
            </div>

            {/* STEPPER HEADER TOOLBAR */}
            <div className="bg-surface-muted dark:bg-night-850 p-3.5 border border-line-subtle dark:border-teal-800/40 rounded-none flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-2xs font-bold text-accent uppercase tracking-wider block font-mono">Consultation Draft in Progress</span>
                <h3 className="type-card-title text-ink dark:text-teal-300 flex items-center gap-1.5 mt-0.5">
                  <Stethoscope className="w-4 h-4 text-accent" />
                  <span>Encounter Workspace — {activeTab.toUpperCase()}</span>
                </h3>
              </div>

              {/* Actionable Requirement Status Text */}
              <div className="bg-surface dark:bg-night-900 px-3 py-1.5 border border-line dark:border-teal-800/40 text-2xs font-bold text-accent dark:text-teal-300 rounded-none">
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
                  setReferralDetails={setReferralDetails}
                  referralGenerated={referralGenerated}
                  setReferralGenerated={setReferralGenerated}
                />
              )}
            </div>

          </div>

          {/* SINGLE PRIMARY WORKFLOW CTA TOOLBAR */}
          <WorkflowToolbar onCancel={onCancel} setLastSavedTime={setLastSavedTime} activeTab={activeTab} setActiveTab={setActiveTab} handleOpenReviewModal={handleOpenReviewModal} />

        </div>

        {/* AREA 3: CONTEXTUAL RIGHT PANEL — SUPPORTING DATA & QUICK TOOLS (4 COLS / 35%) */}
        <ContextPanel vitals={vitals} aiDraftDismissed={aiDraftDismissed} setSelectedICD={setSelectedICD} setAiDraftAccepted={setAiDraftAccepted} aiDraftAccepted={aiDraftAccepted} setAiDraftDismissed={setAiDraftDismissed} t={t} patientPastVisits={patientPastVisits} selectedPastVisit={selectedPastVisit} setSelectedPastVisit={setSelectedPastVisit} />

      </div>

      {/* ========================================================================= */}
      {/* AREA 4: SAFE CONSULTATION REVIEW & SIGN-OFF CHECKLIST MODAL DIALOG        */}
      {/* ========================================================================= */}
      {isReviewModalOpen && (
        <ReviewSignoffModal setIsReviewModalOpen={setIsReviewModalOpen} currentPatient={currentPatient} maskedIC={maskedIC} selectedICD={selectedICD} rxList={rxList} handleFinalSignoff={handleFinalSignoff} />
      )}

    </div>
  );
}
