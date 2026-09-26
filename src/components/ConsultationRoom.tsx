import React, { useState, useEffect, useMemo } from 'react';
import { 
  Patient, Visit, ICD10Code, PrescriptionItem, Language 
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

interface ConsultationRoomProps {
  currentPatient: Patient | null;
  activeVisit?: Visit | null;
  activeLanguage: Language;
  onConsultationComplete: (soapData: any, issueMc: boolean, mcDuration: number) => void;
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
      <div className="bg-white dark:bg-[#082830] p-12 text-center rounded-none border border-[#ccfbf1] dark:border-teal-800/40">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-[#0f3c4c] dark:text-[#5eead4]">No Patient Selected</h3>
        <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">Please select an outpatient from the waiting queue to begin clinical documentation.</p>
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
      <div className="bg-white dark:bg-[#07252d] border-2 border-[#0d9488] p-12 text-center rounded-none shadow-2xl max-w-md mx-auto my-12 animate-fadeIn">
        <Lock className="w-12 h-12 text-[#0d9488] mx-auto mb-4" />
        <h3 className="text-lg font-black text-[#0f3c4c] dark:text-[#5eead4]">Privacy Lock Screen</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
          Clinician privacy screen is locked. Click unlock to resume encounter for <strong>{currentPatient.fullName}</strong>.
        </p>
        <button
          type="button"
          onClick={() => setIsLocked(false)}
          className="mt-6 w-full bg-[#0d9488] hover:bg-[#0f766e] text-white py-2.5 font-bold text-xs uppercase tracking-wider rounded-none shadow-xs transition-all cursor-pointer"
        >
          Unlock Consultation Room
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-16 relative animate-fadeIn text-[#0f3c4c] dark:text-[#f8fafc]">
      
      {/* ========================================================================= */}
      {/* AREA 1: PERSISTENT PATIENT SAFETY HEADER WITH PII MASKING & AUTO-SAVE     */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-[#082830] border border-[#ccfbf1] dark:border-teal-800/50 rounded-none p-4 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-l-4 border-l-[#0d9488]">
        
        {/* Patient Demographics & PII Controls */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-none bg-[#0d9488] text-white flex items-center justify-center font-black text-sm shrink-0 shadow-xs">
            {currentPatient.fullName.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-black text-[#0f3c4c] dark:text-[#5eead4] tracking-tight">{currentPatient.fullName}</h2>
              <span className="text-xs text-slate-600 dark:text-slate-300 font-bold">({patientAge} Yrs, {currentPatient.gender})</span>
              <span id="patient-banner-status" className="bg-[#e0f5f2] dark:bg-teal-950/80 text-[#0f766e] dark:text-[#5eead4] border border-[#b2f5ea] dark:border-teal-800/50 text-[10px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded-none flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Consultation Active
              </span>
            </div>
            
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-slate-300 font-medium mt-1">
              {/* Masked IC Number */}
              <span className="flex items-center gap-1.5 bg-[#f0fdfa] dark:bg-[#07252d] border border-[#b2f5ea] dark:border-teal-800/40 px-2 py-0.5 rounded-none">
                <span>IC:</span>
                <strong className="font-mono text-[#0f3c4c] dark:text-slate-100">{maskedIC}</strong>
                <button
                  type="button"
                  onClick={() => setIsPiiRevealed(!isPiiRevealed)}
                  className="text-[#0d9488] hover:text-[#0f766e] transition-colors ml-1 cursor-pointer"
                  title={isPiiRevealed ? 'Mask PII IC Number' : 'Click to Reveal PII IC Number'}
                >
                  {isPiiRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </span>

              {/* Masked Phone */}
              <span className="flex items-center gap-1.5 bg-[#f0fdfa] dark:bg-[#07252d] border border-[#b2f5ea] dark:border-teal-800/40 px-2 py-0.5 rounded-none">
                <span>Phone:</span>
                <strong className="font-mono text-[#0f3c4c] dark:text-slate-100">{maskedPhone}</strong>
              </span>

              <span>Coverage: <strong className="text-[#0d9488] dark:text-[#2dd4bf] font-bold">{currentPatient.panelEmployer === 'None (Self-Pay)' ? 'Self-Pay' : currentPatient.panelEmployer}</strong></span>
            </div>
          </div>
        </div>

        {/* Header Right Toolbar: Single Authoritative Progress + Auto-Save State + Lock Screen */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          
          {/* Auto-Save Indicator */}
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 rounded-none font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Saved {lastSavedTime}</span>
          </div>

          {/* Single Authoritative Progress Indicator */}
          <div className="bg-[#f0fdfa] dark:bg-[#07252d] border border-[#b2f5ea] dark:border-teal-800/40 rounded-none px-3 py-1 flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#0d9488] dark:text-[#2dd4bf]" />
            <div className="text-left">
              <span className="text-[9px] text-slate-400 font-bold uppercase block leading-none">Progress</span>
              <span className="text-xs font-mono font-extrabold text-[#0f766e] dark:text-[#5eead4] leading-tight block">Step {completedStepsCount} of 4 ({soapProgressPercent}%)</span>
            </div>
          </div>

          {/* Quick Lock Screen */}
          <button
            type="button"
            onClick={() => setIsLocked(true)}
            className="px-3 py-1.5 border border-slate-300 dark:border-teal-800/50 bg-slate-50 dark:bg-[#07252d] text-slate-700 dark:text-slate-300 hover:bg-slate-100 rounded-none text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Lock Screen"
          >
            <Lock className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Lock Screen</span>
          </button>

          {/* Shortcuts Help Button */}
          <button
            type="button"
            onClick={() => setShowShortcutsHelp(!showShortcutsHelp)}
            className="p-1.5 border border-slate-300 dark:border-teal-800/50 bg-slate-50 dark:bg-[#07252d] text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-none text-xs font-bold transition-colors cursor-pointer"
            title="Keyboard Shortcuts (Alt+?)"
          >
            <HelpCircle className="w-4 h-4 text-[#0d9488]" />
          </button>
        </div>
      </div>

      {/* KEYBOARD SHORTCUTS OVERLAY BANNER */}
      {showShortcutsHelp && (
        <div className="bg-[#e0f5f2] dark:bg-[#082830] border border-[#b2f5ea] dark:border-teal-800/50 p-3 rounded-none flex items-center justify-between text-xs text-[#0f766e] dark:text-[#5eead4] font-mono animate-fadeIn">
          <div className="flex flex-wrap items-center gap-4">
            <span><kbd className="bg-white dark:bg-[#07252d] px-1.5 py-0.5 border border-[#b2f5ea] text-[#0f3c4c] font-bold">Alt+1</kbd> Subjective</span>
            <span><kbd className="bg-white dark:bg-[#07252d] px-1.5 py-0.5 border border-[#b2f5ea] text-[#0f3c4c] font-bold">Alt+2</kbd> Objective Vitals</span>
            <span><kbd className="bg-white dark:bg-[#07252d] px-1.5 py-0.5 border border-[#b2f5ea] text-[#0f3c4c] font-bold">Alt+3</kbd> ICD-10 Diagnosis</span>
            <span><kbd className="bg-white dark:bg-[#07252d] px-1.5 py-0.5 border border-[#b2f5ea] text-[#0f3c4c] font-bold">Alt+4</kbd> Plan &amp; Rx</span>
            <span><kbd className="bg-white dark:bg-[#07252d] px-1.5 py-0.5 border border-[#b2f5ea] text-[#0f3c4c] font-bold">Ctrl+Enter</kbd> Review &amp; Sign Off</span>
          </div>
          <button type="button" onClick={() => setShowShortcutsHelp(false)} className="text-slate-400 hover:text-slate-700">
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
              <div className="text-xs font-bold uppercase tracking-wide flex items-center gap-2 text-rose-800 dark:text-rose-300">
                <span>CRITICAL PATIENT SAFETY ALERT: REGISTERED DRUG ALLERGIES</span>
              </div>
              <p className="text-xs mt-0.5 font-medium text-rose-700/90 dark:text-rose-300/90">
                Patient registered allergies: <strong className="font-extrabold underline uppercase">{currentPatient.drugAllergies.join(', ')}</strong>. Automatic contraindication checks active.
              </p>
            </div>
          </div>
          <span className="bg-rose-500 text-white font-mono text-[10px] font-bold uppercase px-2.5 py-1 rounded-none shrink-0">
            SAFETY CHECKS ENFORCED
          </span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* AREA 2 & 3: MAIN ENCOUNTER WORKSPACE + CONTEXTUAL RIGHT PANEL             */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch min-h-[500px]">
        
        {/* AREA 2: MAIN CONSULTATION WORKSPACE (8 COLS / 65%) */}
        <div className="lg:col-span-8 bg-white dark:bg-[#082830] border border-[#ccfbf1] dark:border-teal-800/40 p-5 rounded-none flex flex-col justify-between shadow-xs space-y-5">
          
          <div className="space-y-4">
            
            {/* EXPLICIT CLINICAL WORKFLOW STATE SEQUENCE BAR */}
            <div className="bg-[#e0f5f2] dark:bg-[#07252d] border border-[#b2f5ea] dark:border-teal-800/40 p-2 rounded-none flex items-center justify-between text-[10px] font-mono font-bold">
              <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar">
                <span className="bg-[#0d9488] text-white px-2 py-0.5 rounded-none flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-300" />
                  1. Draft Saved
                </span>
                <span className="text-slate-400">➔</span>
                <span className={`px-2 py-0.5 rounded-none border ${selectedICD ? 'bg-white text-[#0f766e] border-[#0d9488]' : 'bg-slate-100 dark:bg-[#082830] text-slate-400 border-slate-200 dark:border-teal-800/40'}`}>
                  2. Ready for Review
                </span>
                <span className="text-slate-400">➔</span>
                <span className="bg-slate-100 dark:bg-[#082830] text-slate-400 border border-slate-200 dark:border-teal-800/40 px-2 py-0.5 rounded-none">
                  3. Signed Note
                </span>
                <span className="text-slate-400">➔</span>
                <span className="bg-slate-100 dark:bg-[#082830] text-slate-400 border border-slate-200 dark:border-teal-800/40 px-2 py-0.5 rounded-none">
                  4. Prescription Routed
                </span>
                <span className="text-slate-400">➔</span>
                <span className="bg-slate-100 dark:bg-[#082830] text-slate-400 border border-slate-200 dark:border-teal-800/40 px-2 py-0.5 rounded-none">
                  5. Encounter Closed
                </span>
              </div>
              <span className="text-[10px] text-[#0f766e] dark:text-[#5eead4] shrink-0 font-sans hidden sm:inline">
                Autosaved · {lastSavedTime}
              </span>
            </div>

            {/* STEPPER HEADER TOOLBAR */}
            <div className="bg-[#f0fdfa] dark:bg-[#07252d] p-3.5 border border-[#b2f5ea] dark:border-teal-800/40 rounded-none flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold text-[#0d9488] uppercase tracking-wider block">Consultation Draft in Progress</span>
                <h3 className="text-sm font-black text-[#0f3c4c] dark:text-[#5eead4] flex items-center gap-1.5 mt-0.5">
                  <Stethoscope className="w-4 h-4 text-[#0d9488]" />
                  <span>Encounter Workspace — {activeTab.toUpperCase()}</span>
                </h3>
              </div>

              {/* Actionable Requirement Status Text */}
              <div className="bg-white dark:bg-[#082830] px-3 py-1.5 border border-[#b2f5ea] dark:border-teal-800/40 text-[11px] font-bold text-[#0f766e] dark:text-[#5eead4] rounded-none">
                {activeTab === 'subjective' && (subjective.trim() ? 'Subjective: Complete ✓' : 'Subjective: Enter Symptoms')}
                {activeTab === 'objective' && (vitals.temperature > 0 ? 'Objective: Vitals Complete ✓' : 'Objective: Check Vitals')}
                {activeTab === 'assessment' && (selectedICD ? `Assessment: ${selectedICD.code} Selected ✓` : 'Required Next: Select ICD-10 Diagnosis')}
                {activeTab === 'plan' && (rxList.length > 0 ? `Plan: ${rxList.length} Rx Items Ready` : 'Plan: Add Prescriptions / Lab Orders')}
              </div>
            </div>

            {/* SINGLE UNIFIED STEPPER NAVIGATION TABS */}
            <div className="flex border border-[#ccfbf1] dark:border-teal-800/40 bg-[#f7fdfd] dark:bg-[#07252d] p-1.5 rounded-none gap-1.5" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'subjective'}
                onClick={() => setActiveTab('subjective')}
                className={`flex-1 flex flex-col items-center justify-center py-2 px-2 rounded-none text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'subjective' 
                    ? 'bg-[#0d9488] text-white shadow-xs font-extrabold' 
                    : 'text-[#0f3c4c] dark:text-slate-300 hover:bg-[#e0f5f2]'
                }`}
              >
                <div className="flex items-center gap-1">
                  <ClipboardList className="w-4 h-4" />
                  <span>1. Subjective</span>
                </div>
                <span className="text-[9px] font-mono mt-0.5 opacity-90">
                  {subjective.trim() ? 'Complete ✓' : 'In Progress'}
                </span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'objective'}
                onClick={() => setActiveTab('objective')}
                className={`flex-1 flex flex-col items-center justify-center py-2 px-2 rounded-none text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'objective' 
                    ? 'bg-[#0d9488] text-white shadow-xs font-extrabold' 
                    : 'text-[#0f3c4c] dark:text-slate-300 hover:bg-[#e0f5f2]'
                }`}
              >
                <div className="flex items-center gap-1">
                  <Activity className="w-4 h-4" />
                  <span>2. Objective</span>
                </div>
                <span className="text-[9px] font-mono mt-0.5 opacity-90">
                  {vitals.temperature > 0 ? 'Complete ✓' : 'Required'}
                </span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'assessment'}
                onClick={() => setActiveTab('assessment')}
                className={`flex-1 flex flex-col items-center justify-center py-2 px-2 rounded-none text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'assessment' 
                    ? 'bg-[#0d9488] text-white shadow-xs font-extrabold' 
                    : 'text-[#0f3c4c] dark:text-slate-300 hover:bg-[#e0f5f2]'
                }`}
              >
                <div className="flex items-center gap-1">
                  <Stethoscope className="w-4 h-4" />
                  <span>3. Assessment</span>
                </div>
                <span className="text-[9px] font-mono mt-0.5 opacity-90">
                  {selectedICD ? 'Complete ✓' : 'Required Next ➔'}
                </span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'plan'}
                onClick={() => setActiveTab('plan')}
                className={`flex-1 flex flex-col items-center justify-center py-2 px-2 rounded-none text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'plan' 
                    ? 'bg-[#0d9488] text-white shadow-xs font-extrabold' 
                    : 'text-[#0f3c4c] dark:text-slate-300 hover:bg-[#e0f5f2]'
                }`}
              >
                <div className="flex items-center gap-1">
                  <Pill className="w-4 h-4" />
                  <span>4. Plan &amp; Rx</span>
                </div>
                <span className="text-[9px] font-mono mt-0.5 opacity-90">
                  {selectedICD ? (rxList.length > 0 ? `${rxList.length} Items` : 'Ready') : 'Locked until ICD'}
                </span>
              </button>
            </div>

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
          <div className="border-t border-[#ccfbf1] dark:border-teal-800/40 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 border border-slate-300 dark:border-teal-800/50 text-slate-600 dark:text-slate-300 rounded-none text-xs font-bold hover:bg-slate-100 dark:hover:bg-[#0c3844] transition-colors cursor-pointer"
              >
                Cancel Encounter
              </button>

              <button
                type="button"
                onClick={() => setLastSavedTime('Just now')}
                className="px-3.5 py-2 border border-[#b2f5ea] dark:border-teal-800/40 bg-[#f0fdfa] text-[#0f766e] rounded-none text-xs font-bold hover:bg-[#e0f5f2] transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5 text-[#0d9488]" />
                <span>Save Draft</span>
              </button>
            </div>

            <div className="flex items-center gap-3">
              {/* Dynamic Single Primary Action CTA Button */}
              {activeTab === 'subjective' && (
                <button
                  type="button"
                  onClick={() => setActiveTab('objective')}
                  className="bg-[#0d9488] hover:bg-[#0f766e] text-white px-5 py-2.5 rounded-none text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  <span>Save Symptoms &amp; Proceed to Vitals</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              {activeTab === 'objective' && (
                <button
                  type="button"
                  onClick={() => setActiveTab('assessment')}
                  className="bg-[#0d9488] hover:bg-[#0f766e] text-white px-5 py-2.5 rounded-none text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  <span>Save Vitals &amp; Proceed to Diagnosis</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              {activeTab === 'assessment' && (
                <button
                  type="button"
                  onClick={() => setActiveTab('plan')}
                  className="bg-[#0d9488] hover:bg-[#0f766e] text-white px-5 py-2.5 rounded-none text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  <span>Confirm Diagnosis &amp; Proceed to Prescription</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              {activeTab === 'plan' && (
                <button
                  type="button"
                  onClick={handleOpenReviewModal}
                  className="bg-[#0d9488] hover:bg-[#0f766e] text-white px-5 py-2.5 rounded-none text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  <Check className="w-4 h-4 text-white" />
                  <span>Review and sign consultation</span>
                </button>
              )}
            </div>
          </div>

        </div>

        {/* AREA 3: CONTEXTUAL RIGHT PANEL — SUPPORTING DATA & QUICK TOOLS (4 COLS / 35%) */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Contextual Recent Vitals Card */}
          <div className="bg-white dark:bg-[#082830] p-4 rounded-none border border-[#ccfbf1] dark:border-teal-800/40 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-teal-800/30 pb-2">
              <h3 className="text-xs font-bold text-[#0f3c4c] dark:text-[#5eead4] uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-[#0d9488]" />
                Recent Outpatient Vitals
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">Triage Recorded</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="bg-[#f7fdfd] dark:bg-[#07252d] p-2 border border-[#ccfbf1] dark:border-teal-800/40">
                <span className="text-[9px] text-slate-400 block font-sans">BP</span>
                <strong className="text-[#0f3c4c] dark:text-white">{vitals.bpSystolic}/{vitals.bpDiastolic} mmHg</strong>
              </div>
              <div className="bg-[#f7fdfd] dark:bg-[#07252d] p-2 border border-[#ccfbf1] dark:border-teal-800/40">
                <span className="text-[9px] text-slate-400 block font-sans">Heart Rate</span>
                <strong className="text-[#0f3c4c] dark:text-white">{vitals.heartRate} bpm</strong>
              </div>
              <div className="bg-[#f7fdfd] dark:bg-[#07252d] p-2 border border-[#ccfbf1] dark:border-teal-800/40">
                <span className="text-[9px] text-slate-400 block font-sans">Temperature</span>
                <strong className="text-[#0f3c4c] dark:text-white">{vitals.temperature}°C</strong>
              </div>
              <div className="bg-[#f7fdfd] dark:bg-[#07252d] p-2 border border-[#ccfbf1] dark:border-teal-800/40">
                <span className="text-[9px] text-slate-400 block font-sans">Resp. Rate</span>
                <strong className="text-[#0f3c4c] dark:text-white">{vitals.respiratoryRate} bpm</strong>
              </div>
            </div>
          </div>

          {/* Contextual AI Decision Support Draft Card */}
          <div className="bg-white dark:bg-[#082830] p-4 rounded-none border border-[#ccfbf1] dark:border-teal-800/40 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-teal-800/30 pb-2">
              <h3 className="text-xs font-bold text-[#0f3c4c] dark:text-[#5eead4] uppercase tracking-wider flex items-center gap-1.5">
                <Brain className="w-4 h-4 text-[#0d9488]" />
                AI Decision Support
              </h3>
              <span className="bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-none text-[9px] font-bold">
                Draft — Not a Diagnosis
              </span>
            </div>

            {!aiDraftDismissed ? (
              <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                <p className="leading-relaxed">
                  Based on symptoms and prior gastritis history, AI suggests considering <strong>ICD-10 K29.7 (Gastritis, unspecified)</strong> or <strong>K21.9 (GERD)</strong>.
                </p>

                <div className="flex gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedICD({ code: 'K29.7', desc: 'Gastritis, unspecified', category: 'Digestive' });
                      setAiDraftAccepted(true);
                    }}
                    className="flex-1 bg-[#0d9488] text-white py-1 rounded-none text-[10px] font-bold hover:bg-[#0f766e]"
                  >
                    {aiDraftAccepted ? '✓ Accepted' : 'Accept K29.7'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setAiDraftDismissed(true)}
                    className="px-2.5 bg-slate-100 text-slate-600 border border-slate-300 py-1 rounded-none text-[10px] font-bold hover:bg-slate-200"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-[10px] text-slate-400 italic">
                AI draft suggestion dismissed by clinician.
              </div>
            )}
          </div>

          {/* Longitudinal Clinical History Timeline */}
          <div className="bg-white dark:bg-[#082830] p-4 rounded-none border border-[#ccfbf1] dark:border-teal-800/40 shadow-xs space-y-3 flex-1 flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-teal-800/30 pb-2">
              <h3 className="text-xs font-bold text-[#0f3c4c] dark:text-[#5eead4] uppercase tracking-wider flex items-center gap-1.5">
                <History className="w-4 h-4 text-[#0d9488]" />
                {t.longitudinalHistory}
              </h3>
              <span className="bg-[#e0f5f2] dark:bg-teal-950 text-[#0f766e] dark:text-[#5eead4] border border-[#b2f5ea] dark:border-teal-800/50 px-2 py-0.5 rounded-none text-[10px] font-mono font-bold">
                {patientPastVisits.length} Visits
              </span>
            </div>

            {patientPastVisits.length === 0 ? (
              <div className="p-6 text-center text-slate-400 flex-1 flex flex-col items-center justify-center">
                <Clock className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
                <span className="text-xs text-slate-600 dark:text-slate-300 font-semibold">First Outpatient Encounter</span>
                <span className="text-[10px] text-slate-400 mt-0.5">This session initiates the master clinical EHR timeline.</span>
              </div>
            ) : (
              <div className="space-y-2 overflow-y-auto max-h-[300px] pr-1 custom-scrollbar">
                {patientPastVisits.map((visit) => {
                  const isSelected = selectedPastVisit?.id === visit.id;
                  return (
                    <div
                      key={visit.id}
                      onClick={() => setSelectedPastVisit(isSelected ? null : visit)}
                      className={`p-3 rounded-none border transition-all text-left cursor-pointer hover:bg-[#f0fdfa] dark:hover:bg-[#0c3844] bg-[#f7fdfd] dark:bg-[#07252d] ${
                        isSelected 
                          ? 'border-[#0d9488] dark:border-[#2dd4bf] bg-[#f0fdfa] dark:bg-[#0c3844] shadow-xs' 
                          : 'border-[#ccfbf1] dark:border-teal-800/40'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-mono font-bold text-slate-500 dark:text-slate-400">{visit.date}</span>
                        <span className="text-[#0f766e] dark:text-[#5eead4] bg-[#e0f5f2] dark:bg-teal-950 border border-[#b2f5ea] dark:border-teal-800/50 font-extrabold text-[9px] px-1.5 py-0.5 rounded-none">
                          {visit.soap.assessment.icdCode}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-[#0f3c4c] dark:text-[#5eead4] truncate mt-1">
                        {visit.soap.assessment.description}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                        S: {visit.soap.subjective}
                      </p>

                      {isSelected && (
                        <div className="mt-3 pt-2 border-t border-slate-200 dark:border-teal-800/40 text-[10px] space-y-1.5 text-slate-700 dark:text-slate-300 animate-fadeIn">
                          <div><strong>Objective:</strong> BP {visit.soap.objective.bpSystolic}/{visit.soap.objective.bpDiastolic} mmHg.</div>
                          <div><strong>Notes:</strong> {visit.soap.assessment.clinicalNotes}</div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* ========================================================================= */}
      {/* AREA 4: SAFE CONSULTATION REVIEW & SIGN-OFF CHECKLIST MODAL DIALOG        */}
      {/* ========================================================================= */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn" role="dialog" aria-modal="true">
          <div className="bg-white dark:bg-[#07252d] border-2 border-[#0d9488] shadow-2xl max-w-2xl w-full p-6 rounded-none space-y-5 text-[#0f3c4c] dark:text-white">
            
            <div className="flex items-center justify-between border-b border-[#ccfbf1] dark:border-teal-800/40 pb-3">
              <div className="flex items-center gap-2.5">
                <Stethoscope className="w-5 h-5 text-[#0d9488]" />
                <h3 className="text-base font-black uppercase tracking-tight">Review and send prescription</h3>
              </div>
              <button type="button" onClick={() => setIsReviewModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="bg-[#f0fdfa] dark:bg-[#082830] p-3 border border-[#b2f5ea] dark:border-teal-800/40 flex justify-between items-center font-bold">
                <span>Patient: <strong>{currentPatient.fullName}</strong></span>
                <span>IC: <strong className="font-mono">{maskedIC}</strong></span>
              </div>

              <div>
                <span className="text-slate-400 uppercase font-bold text-[10px] block">Primary ICD-10 Diagnosis</span>
                <div className="bg-[#e0f5f2] dark:bg-teal-950 p-2.5 border border-[#b2f5ea] dark:border-teal-800/50 font-bold text-[#0f766e] dark:text-[#5eead4] mt-1 flex items-center justify-between">
                  <span>{selectedICD?.code} — {selectedICD?.desc}</span>
                  <CheckCircle2 className="w-4 h-4 text-[#0d9488]" />
                </div>
              </div>

              <div>
                <span className="text-slate-400 uppercase font-bold text-[10px] block">Prescriptions ({rxList.length} Items)</span>
                {rxList.length > 0 ? (
                  <ul className="bg-slate-50 dark:bg-[#082830] border border-slate-200 dark:border-teal-800/40 p-3 space-y-1.5 mt-1 font-mono text-[11px]">
                    {rxList.map((rx, idx) => (
                      <li key={idx} className="flex justify-between border-b border-slate-200 dark:border-teal-800/30 pb-1 last:border-0 last:pb-0">
                        <span>{rx.drugName} (Qty: {rx.quantity})</span>
                        <span className="font-bold">RM {((rx.pricePerUnit || 0.5) * (rx.quantity || 1)).toFixed(2)}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-slate-400 italic mt-1">No medications prescribed for this visit.</p>
                )}
              </div>

              {currentPatient.drugAllergies.length > 0 && (
                <div className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 p-2.5 text-emerald-900 dark:text-emerald-200 font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Allergy Safety Verification Passed (No active conflicts with {currentPatient.drugAllergies.join(', ')})</span>
                </div>
              )}
            </div>

            <div className="bg-[#f0fdfa] dark:bg-[#07252d] p-3 border border-[#b2f5ea] dark:border-teal-800/40 font-mono text-[11px] text-[#0f766e] dark:text-[#5eead4]">
              This will sign the consultation note and send {rxList.length} medication order(s) to the dispensary.
            </div>

            <div className="border-t border-[#ccfbf1] dark:border-teal-800/40 pt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsReviewModalOpen(false)}
                className="px-4 py-2 border border-slate-300 text-slate-600 text-xs font-bold rounded-none hover:bg-slate-100 cursor-pointer"
              >
                Back to Edit
              </button>

              <button
                type="button"
                onClick={handleFinalSignoff}
                className="bg-[#0d9488] hover:bg-[#0f766e] text-white px-6 py-2.5 rounded-none font-extrabold text-xs uppercase tracking-wider flex items-center gap-2 shadow-sm cursor-pointer"
              >
                <Check className="w-4 h-4 text-white" />
                <span>Sign and send</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
