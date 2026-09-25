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
  Mic, MicOff, Bluetooth, Zap, Eye, TrendingUp, Brain, CheckCircle2, TestTube, Share, LineChart, Copy
} from 'lucide-react';
import SubjectiveTab from './consultation/SubjectiveTab';
import ObjectiveTab from './consultation/ObjectiveTab';
import AssessmentTab from './consultation/AssessmentTab';
import PlanTab from './consultation/PlanTab';
import DiagnosticModal from './consultation/DiagnosticModal';

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

  // Tab State
  const [activeTab, setActiveTab] = useState<'subjective' | 'objective' | 'assessment' | 'plan'>('subjective');

  // Diagnostic Popup Window Modal State
  const [isDiagnosticModalOpen, setIsDiagnosticModalOpen] = useState(false);

  // Interactive past history view
  const [selectedPastVisit, setSelectedPastVisit] = useState<Visit | null>(null);

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

  // Next-Gen Simulations State
  const [isListening, setIsListening] = useState(false);
  const [isSyncingVitals, setIsSyncingVitals] = useState(false);

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

  // Quick complain suggestions
  const complainTemplateList = [
    activeLanguage === 'EN' ? 'Fever and runny nose for 2 days' : 'Demam dan selesema selama 2 hari',
    activeLanguage === 'EN' ? 'Productive cough with white sputum, sore throat' : 'Batuk berkahak putih dengan sakit tekak',
    activeLanguage === 'EN' ? 'Epigastric gastric discomfort, worse after tea' : 'Sakit perut epigastrik, selepas minum teh',
    activeLanguage === 'EN' ? 'Muscle sorenesses and joint stiffness post exercise' : 'Lengu-lengu otot dan sendi selepas bersenam',
  ];


  if (!currentPatient) {
    return (
      <div className="bg-white p-12 text-center rounded-lg border border-slate-200">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-800">No Patient Loaded</h3>
        <p className="text-slate-500 text-xs mt-1">Please select or register a patient from the patient Registration screen first.</p>
      </div>
    );
  }

  // Prepopulate form if we click standard complain
  const handleApplySymptomTemplate = (txt: string) => {
    setSubjective(prev => prev ? `${prev}. ${txt}` : txt);
  };



  // Submit Consultation Notes Form
  const handleSubmitConsultation = () => {
    if (!selectedICD) {
      alert(activeLanguage === 'EN' ? 'Please select a Diagnostic Classification code (ICD-10) before clinical sign-off.' : 'Sila pilih kod Pengelasan Diagnostik (ICD-10) sebelum menandatangani kes.');
      setActiveTab('assessment');
      return;
    }

    const soapData = {
      subjective,
      objective: vitals,
      assessment: {
        icdCode: selectedICD.code,
        description: selectedICD.desc,
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

    onConsultationComplete(soapData, mcGenerated, parseInt(mcDays.toString()) || 1);
  };

  // SOAP Step Completion Progress
  const soapSteps = [
    { key: 'subjective', step: '1', title: 'Subjective', isDone: subjective.trim().length > 0 },
    { key: 'objective', step: '2', title: 'Objective', isDone: vitals.temperature > 0 },
    { key: 'assessment', step: '3', title: 'Assessment', isDone: selectedICD !== null },
    { key: 'plan', step: '4', title: 'Plan (Rx)', isDone: rxList.length > 0 || (clinicalNotes && clinicalNotes.trim().length > 0) }
  ];
  const completedStepsCount = soapSteps.filter(s => s.isDone).length;
  const soapProgressPercent = Math.round((completedStepsCount / 4) * 100);

  // Keyboard Hotkeys: Alt+1..4 for tabs, Ctrl+Enter to submit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key === '1') { e.preventDefault(); setActiveTab('subjective'); }
      if (e.altKey && e.key === '2') { e.preventDefault(); setActiveTab('objective'); }
      if (e.altKey && e.key === '3') { e.preventDefault(); setActiveTab('assessment'); }
      if (e.altKey && e.key === '4') { e.preventDefault(); setActiveTab('plan'); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSubmitConsultation();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [subjective, vitals, selectedICD, clinicalNotes, rxList, activeLanguage]);

  // --- Next-Gen Feature Handlers ---
  const handleVoiceToText = () => {
    if (isListening) return;
    setIsListening(true);
    // Simulate 3 seconds of AI listening and transcribing
    setTimeout(() => {
      setSubjective(prev => prev 
        ? `${prev}\n[AI Transcribed]: Patient reports severe throbbing headache localized to frontal lobe, onset 24 hours ago. Denies nausea, photophobia, or aura.`
        : `[AI Transcribed]: Patient reports severe throbbing headache localized to frontal lobe, onset 24 hours ago. Denies nausea, photophobia, or aura.`
      );
      setIsListening(false);
    }, 3000);
  };

  const handleSyncVitals = () => {
    if (isSyncingVitals) return;
    setIsSyncingVitals(true);
    // Simulate Bluetooth sync with hardware IoT
    setTimeout(() => {
      setVitals({
        bpSystolic: 122,
        bpDiastolic: 78,
        heartRate: 84,
        temperature: 37.1,
        respiratoryRate: 18
      });
      setIsSyncingVitals(false);
    }, 2500);
  };

  return (
    <div className="space-y-4 pb-16 relative animate-fadeIn text-[#0f3c4c]">
      
      {/* 📊 1. UNIFIED SUITE HEADER BAR */}
      <div className="bg-white border border-slate-200 rounded-none p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 border-l-4 border-l-[#0d9488]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-none bg-[#e0f5f2] border border-[#b2f5ea] flex items-center justify-center text-[#0d9488] font-black text-sm shrink-0">
            {currentPatient.fullName.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-[#0f3c4c] uppercase tracking-tight">{currentPatient.fullName}</h2>
              <span id="patient-banner-status" className="bg-[#e0f5f2] text-[#0f766e] border border-[#b2f5ea] text-[10px] uppercase font-extrabold tracking-wider px-2.5 py-0.5 rounded-none flex items-center gap-1">
                <span className="w-2 h-2 rounded-none bg-emerald-500 animate-pulse"></span>
                In Consultation
              </span>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-slate-500 font-medium mt-0.5">
              <span>IC: <strong className="font-mono text-slate-700">{currentPatient.icNumber}</strong></span>
              <span>•</span>
              <span>Gender: <strong className="text-slate-700">{currentPatient.gender}</strong></span>
              <span>•</span>
              <span>Coverage: <strong className="text-[#0d9488] font-bold">{currentPatient.panelEmployer === 'None (Self-Pay)' ? 'Self-Pay' : currentPatient.panelEmployer}</strong></span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            type="button"
            id="start-diagnosis-modal-btn"
            onClick={() => {
              setActiveTab('assessment');
              setIsDiagnosticModalOpen(true);
            }}
            className="bg-[#0d9488] hover:bg-[#0f766e] text-white text-xs font-black px-4 py-2.5 rounded-none uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-xs transition-all border border-[#5eead4]/30"
          >
            <Stethoscope className="w-4 h-4 text-[#5eead4] animate-pulse" />
            <span>Start Diagnosis</span>
            {selectedICD && (
              <span className="bg-white text-[#0d9488] font-mono text-[10px] px-1.5 py-0.5 rounded-none font-bold">
                {selectedICD.code}
              </span>
            )}
          </button>

          <div className="bg-slate-50 border border-slate-200 rounded-none px-3 py-1.5 flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#0d9488]" />
            <div className="text-left">
              <span className="text-[10px] text-slate-400 font-bold uppercase block leading-none">SOAP Completion</span>
              <span className="text-xs font-mono font-extrabold text-[#0f766e] leading-tight block">{completedStepsCount}/4 Steps ({soapProgressPercent}%)</span>
            </div>
          </div>
          <span className="text-[10px] text-slate-400 font-mono hidden lg:block bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-none">
            Hotkeys: <kbd className="bg-white border px-1 rounded-none text-slate-700 font-bold">Alt+1..4</kbd> Tabs | <kbd className="bg-white border px-1 rounded-none text-slate-700 font-bold">Ctrl+Enter</kbd> Sign-off
          </span>
        </div>
      </div>

      {/* MAIN CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch min-h-[520px]">
        
        {/* LEFT COLUMN: Patient Overview Brief & Longitudinal Clinical History (35%) */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Dynamic Patient Info & Alerts Card */}
          <div className="bg-white p-4 rounded-none border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-bold text-[#0f3c4c] uppercase tracking-wider">Patient Clinical Profile</h3>
              <span className="text-[10px] text-slate-400 font-mono">ID: {currentPatient.id.substring(0, 8)}...</span>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
              <div>
                <span className="text-slate-400 text-[10px] block uppercase font-medium">Date of Birth</span>
                <strong className="font-mono text-slate-800">{currentPatient.dob}</strong>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block uppercase font-medium">Phone Contact</span>
                <strong className="font-mono text-slate-800">{currentPatient.phone || 'N/A'}</strong>
              </div>
            </div>

            {/* Vitals Abnormality Alerts */}
            {vitalsAlerts.length > 0 && (
              <div className="pt-2 border-t border-amber-200">
                <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wide flex items-center gap-1.5 mb-1.5">
                  <Activity className="w-3.5 h-3.5 text-amber-600" />
                  Triage Vitals Alerts ({vitalsAlerts.length})
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {vitalsAlerts.map((alert, idx) => (
                    <span key={idx} className="bg-amber-50 text-amber-900 border border-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-none flex items-center gap-1">
                      {alert.label}: <strong className="font-mono text-amber-950">{alert.value}</strong>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Drug Allergies Section */}
            {currentPatient.drugAllergies.length > 0 ? (
              <div className="pt-2 border-t border-slate-100">
                <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wide flex items-center gap-1 mb-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {t.activeAllergies} ({currentPatient.drugAllergies.length})
                </span>
                <div id="allergy-tags-pill" className="flex flex-wrap gap-1.5">
                  {currentPatient.drugAllergies.map((allergy) => (
                    <span key={allergy} className="bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-extrabold px-2 py-0.5 rounded-none uppercase tracking-wide">
                      {allergy}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-400 italic">
                ✓ No known medication allergies registered (NKDA).
              </div>
            )}

            {/* AI Patient Readmission Risk Scoring */}
            <div className="pt-2 border-t border-slate-100">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-bold text-slate-600 uppercase flex items-center gap-1">
                  <Brain className="w-3.5 h-3.5 text-[#0d9488]" /> AI Readmission Risk
                </span>
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-none">Low (8%)</span>
              </div>
              <div className="w-full bg-slate-100 rounded-none h-1.5 overflow-hidden">
                <div className="bg-[#0d9488] h-1.5 rounded-none" style={{ width: '8%' }}></div>
              </div>
            </div>
          </div>

          {/* Longitudinal clinical history section */}
          <div className="bg-white p-4 rounded-none border border-slate-200 shadow-xs space-y-3 flex-1 flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-bold text-[#0f3c4c] uppercase tracking-wider flex items-center gap-1.5">
                <History className="w-4 h-4 text-[#0d9488]" />
                {t.longitudinalHistory}
              </h3>
              <span className="bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded-none text-[10px] font-mono font-bold">
                {patientPastVisits.length} Visits
              </span>
            </div>

            {patientPastVisits.length === 0 ? (
              <div className="p-6 text-center text-slate-400 flex-1 flex flex-col items-center justify-center">
                <Clock className="w-8 h-8 text-slate-300 mb-2" />
                <span className="text-xs text-slate-600 font-semibold">First-Time Patient Consultation</span>
                <span className="text-[10px] text-slate-400 mt-0.5">This session initiates the master clinical EHR timeline.</span>
              </div>
            ) : (
              <div className="space-y-2 overflow-y-auto max-h-[360px] pr-1">
                {patientPastVisits.map((visit) => {
                  const isSelected = selectedPastVisit?.id === visit.id;
                  return (
                    <div
                      key={visit.id}
                      onClick={() => setSelectedPastVisit(isSelected ? null : visit)}
                      className={`p-3 rounded-none border transition-all text-left cursor-pointer hover:bg-slate-50 bg-white ${
                        isSelected 
                          ? 'border-[#0d9488] bg-[#f0fdfa] shadow-xs' 
                          : 'border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-mono font-bold text-slate-500">{visit.date}</span>
                        <span className="text-[#0f766e] bg-[#e0f5f2] border border-[#b2f5ea] font-extrabold text-[9px] px-1.5 py-0.5 rounded-none">
                          {visit.soap.assessment.icdCode}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-[#0f3c4c] truncate mt-1">
                        {visit.soap.assessment.description}
                      </p>
                      <p className="text-[10px] text-slate-500 line-clamp-2 mt-0.5" title={visit.soap.subjective}>
                        S: {visit.soap.subjective}
                      </p>

                      <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-500 font-mono">
                        <span className="flex items-center gap-1 text-rose-600 font-semibold">
                          <Heart className="w-3 h-3 text-rose-500" /> {visit.soap.objective.heartRate} bpm
                        </span>
                        <span className="flex items-center gap-1 text-amber-600 font-semibold">
                          <Thermometer className="w-3 h-3 text-amber-500" /> {visit.soap.objective.temperature}°C
                        </span>
                      </div>

                      {/* Extended Details panel when clicked */}
                      {isSelected && (
                        <div className="mt-3 pt-2 border-t border-slate-200 text-[10px] space-y-1.5 text-slate-700 animate-fadeIn">
                          <div>
                            <strong>Objective Findings:</strong> BP {visit.soap.objective.bpSystolic}/{visit.soap.objective.bpDiastolic} mmHg | RR {visit.soap.objective.respiratoryRate} bpm.
                          </div>
                          <div>
                            <strong>Assessment Notes:</strong> {visit.soap.assessment.clinicalNotes}
                          </div>
                          <div>
                            <strong>Prescription Plan:</strong>
                            <ul className="list-disc list-inside mt-0.5 text-slate-600 space-y-0.5 pl-1">
                              {visit.soap.plan.prescription.map((rx, idx) => (
                                <li key={idx}>
                                  {rx.drugName} (Qty: {rx.quantity})
                                </li>
                              ))}
                            </ul>
                          </div>
                          {visit.soap.plan.mcDays > 0 && (
                            <div className="text-[#0f766e] bg-[#e0f5f2] border border-[#b2f5ea] rounded-none px-2 py-0.5 text-[9px] font-bold w-fit mt-1">
                              MC Issued: {visit.soap.plan.mcDays} Days
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: Modern Unified SOAP Workspace (65%) */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-none p-5 flex flex-col justify-between shadow-xs">
          
          <div className="space-y-4">
            {/* SINGLE UNIFIED SOAP TABS HEADER */}
            <div className="flex border border-slate-200 bg-slate-50 p-1.5 rounded-none gap-1.5 shadow-2xs" role="tablist" aria-label="SOAP Clinical Notes Navigation">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'subjective'}
                id="subjective-tab-trigger"
                onClick={() => setActiveTab('subjective')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-none text-xs font-bold transition-all cursor-pointer focus-visible:outline-none ${
                  activeTab === 'subjective' 
                    ? 'bg-[#0d9488] text-white shadow-xs font-extrabold' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                }`}
              >
                <ClipboardList className="w-4 h-4" />
                Subjective (S)
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'objective'}
                id="objective-tab-trigger"
                onClick={() => setActiveTab('objective')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-none text-xs font-bold transition-all cursor-pointer focus-visible:outline-none ${
                  activeTab === 'objective' 
                    ? 'bg-[#0d9488] text-white shadow-xs font-extrabold' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                }`}
              >
                <Activity className="w-4 h-4" />
                Objective (O)
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'assessment'}
                id="assessment-tab-trigger"
                onClick={() => setActiveTab('assessment')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-none text-xs font-bold transition-all cursor-pointer focus-visible:outline-none ${
                  activeTab === 'assessment' 
                    ? 'bg-[#0d9488] text-white shadow-xs font-extrabold' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                }`}
              >
                <Stethoscope className="w-4 h-4" />
                Assessment (A)
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'plan'}
                id="plan-tab-trigger"
                onClick={() => setActiveTab('plan')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-none text-xs font-bold transition-all cursor-pointer focus-visible:outline-none ${
                  activeTab === 'plan' 
                    ? 'bg-[#0d9488] text-white shadow-xs font-extrabold' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                }`}
              >
                <Pill className="w-4 h-4" />
                Plan &amp; Rx (P)
                {rxList.length > 0 && (
                  <span className="bg-white text-[#0d9488] font-mono text-[10px] px-1.5 rounded-none font-black">{rxList.length}</span>
                )}
              </button>
            </div>

            {/* TAB 1: SUBJECTIVE */}
            {activeTab === 'subjective' && (
              <SubjectiveTab 
                subjective={subjective}
                setSubjective={setSubjective}
                patientPastVisits={patientPastVisits}
                activeLanguage={activeLanguage}
              />
            )}

            {/* TAB 2: OBJECTIVE */}
            {activeTab === 'objective' && (
              <ObjectiveTab
                vitals={vitals}
                setVitals={setVitals}
                patientPastVisits={patientPastVisits}
              />
            )}

            {/* TAB 3: ASSESSMENT FIELD */}
            {activeTab === 'assessment' && (
              <AssessmentTab 
                selectedICD={selectedICD}
                setSelectedICD={setSelectedICD}
                clinicalNotes={clinicalNotes}
                setClinicalNotes={setClinicalNotes}
                activeLanguage={activeLanguage}
                onOpenDiagnosticModal={() => setIsDiagnosticModalOpen(true)}
              />
            )}

            {/* TAB 4: PLAN */}
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

          {/* AI Clinical Decision Support Summary Banner */}
          <div className="bg-slate-50 p-3.5 rounded-none border border-slate-200 shadow-2xs relative overflow-hidden group mt-4">
            <div className="flex items-center justify-between">
              <h4 className="text-[11px] font-bold text-[#0f3c4c] uppercase flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-[#0d9488]" /> AI Clinical Decision Support Summary
              </h4>
              <span className="text-[10px] text-slate-400 font-mono">ICD-10 Active</span>
            </div>
            <ul className="text-xs text-slate-600 space-y-1 mt-1 pl-4 list-disc marker:text-[#0d9488]">
              {currentPatient.drugAllergies.length > 0 ? (
                <li><strong className="text-rose-600">Allergy Warning:</strong> Patient allergic to {currentPatient.drugAllergies.join(', ')}.</li>
              ) : (
                <li>No active drug allergy alerts on file.</li>
              )}
              {selectedICD ? (
                <li>Primary Diagnosis Code Assigned: <strong className="font-mono text-[#0d9488]">{selectedICD.code}</strong> ({selectedICD.desc}).</li>
              ) : (
                <li>Diagnose code pending selection in Assessment tab.</li>
              )}
            </ul>
          </div>

          {/* Global Form Sign-off Controls */}
          <div className="border-t border-slate-200 pt-4 mt-5 flex items-center justify-between">
            <div className="text-xs text-slate-500 font-mono">
              {rxList.length > 0 && (
                <span>Prescription Total: <strong className="text-[#0d9488] font-bold text-sm">RM {(rxList.reduce((acc, r) => acc + ((r.pricePerUnit || 0.5) * (r.quantity || 1)), 0)).toFixed(2)}</strong></span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 border border-slate-300 text-slate-600 rounded-none text-xs font-bold hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel Consultation
              </button>
              
              <button
                type="button"
                id="clinical-save-signoff-btn"
                onClick={handleSubmitConsultation}
                className="bg-[#0d9488] text-white px-5 py-2.5 rounded-none text-xs font-extrabold hover:bg-[#0f766e] transition-all flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <Check className="w-4 h-4 text-white" />
                <span>Complete &amp; Route to Dispensary</span>
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* 🩺 DEDICATED DIAGNOSTIC SUITE POPUP WINDOW MODAL */}
      <DiagnosticModal
        isOpen={isDiagnosticModalOpen}
        onClose={() => setIsDiagnosticModalOpen(false)}
        selectedICD={selectedICD}
        setSelectedICD={setSelectedICD}
        clinicalNotes={clinicalNotes}
        setClinicalNotes={setClinicalNotes}
        activeLanguage={activeLanguage}
        currentPatient={currentPatient}
        subjectiveSymptoms={subjective}
        vitals={vitals}
      />
    </div>
  );
}
