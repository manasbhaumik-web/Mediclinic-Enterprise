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
    <div className="space-y-4 pb-24 relative animate-fadeIn">
      
      {/* 📊 1. VISUAL 4-STEP SOAP PROGRESS INDICATOR BAR */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 border-l-4 border-l-[#0D9488]">
        <div className="flex items-center gap-3">
          <span className="bg-[#0D9488]/10 text-[#0D9488] text-[11px] font-black uppercase px-3 py-1 rounded-full tracking-wider font-mono flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5" />
            SOAP Progress: {completedStepsCount}/4 ({soapProgressPercent}%)
          </span>
          <span className="text-[10px] text-slate-400 font-mono hidden md:inline">
            Shortcuts: <kbd className="bg-slate-100 border px-1 py-0.5 rounded text-slate-600 font-bold">Alt+1..4</kbd> Switch Tabs | <kbd className="bg-slate-100 border px-1 py-0.5 rounded text-slate-600 font-bold">Ctrl+Enter</kbd> Submit
          </span>
        </div>

        <div className="grid grid-cols-4 gap-1 sm:gap-2 flex-1 max-w-xl">
          {soapSteps.map((stepItem) => {
            const isActive = activeTab === stepItem.key;
            return (
              <button
                key={stepItem.key}
                type="button"
                onClick={() => setActiveTab(stepItem.key as any)}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                  isActive
                    ? 'bg-[#0D9488] text-white border-[#0D9488] shadow-xs'
                    : stepItem.isDone
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                    : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {stepItem.isDone ? (
                  <CheckCircle2 className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-emerald-600'}`} />
                ) : (
                  <span className={`w-4 h-4 rounded-full text-[9px] font-mono flex items-center justify-center font-bold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {stepItem.step}
                  </span>
                )}
                <span className="truncate">{stepItem.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* MAIN CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch min-h-[500px]">
        
        {/* LEFT COLUMN: Patient Profile Brief & Longitudinal History (35%) */}
        <div className="lg:col-span-4 bg-slate-50 border border-slate-200 rounded-lg p-4 flex flex-col space-y-4">
          
          {/* Dynamic Patient Card Info */}
          <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span id="patient-banner-status" className="bg-[#07B2B2]/10 text-[#07B2B2] text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full">
                In-Consultation
              </span>
              <span className="text-[10px] text-slate-400 font-mono">ID: {currentPatient.id}</span>
            </div>
            <h4 id="consultation-patient-name" className="text-sm font-semibold text-slate-800 uppercase tracking-tight">{currentPatient.fullName}</h4>
            
            <div className="grid grid-cols-2 gap-2 mt-2.5 text-xs text-slate-600">
              <div>
                <span className="text-slate-400 text-[10px] block uppercase">MyKad IC</span>
                <strong className="font-mono text-slate-700">{currentPatient.icNumber}</strong>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block uppercase">{t.gender}</span>
                <strong className="text-slate-700">{currentPatient.gender === 'Male' ? t.male : t.female}</strong>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block uppercase">{t.panelEmployer}</span>
                <strong className="text-[#07B2B2] truncate block max-w-[120px]" title={currentPatient.panelEmployer}>
                  {currentPatient.panelEmployer === 'None (Self-Pay)' ? 'Self-Pay' : currentPatient.panelEmployer}
                </strong>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block uppercase">Date of Birth</span>
                <strong className="font-mono text-slate-700">{currentPatient.dob}</strong>
              </div>
            </div>

            {/* 🩸 2. AUTOMATED VITALS ABNORMALITY HIGHLIGHTING IN PATIENT CARD */}
            {vitalsAlerts.length > 0 && (
              <div className="mt-3 pt-2.5 border-t border-amber-200 bg-amber-50/70 p-2.5 rounded-lg">
                <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wide flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-amber-600" />
                  Triage Vitals Alert ({vitalsAlerts.length})
                </span>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {vitalsAlerts.map((alert, idx) => (
                    <span key={idx} className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                      {alert.label}: <strong className="font-mono text-amber-950">{alert.value}</strong>
                    </span>
                  ))}
                </div>
              </div>
            )}

          {/* High-contrast Red Drug Allergy alerts inside patient card */}
          {currentPatient.drugAllergies.length > 0 ? (
            <div className="mt-3 pt-2.5 border-t border-slate-100">
              <span className="text-[10px] font-bold text-red-600 uppercase tracking-wide flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                {t.activeAllergies}
              </span>
              <div id="allergy-tags-pill" className="flex flex-wrap gap-1.5 mt-1.5">
                {currentPatient.drugAllergies.map((allergy) => (
                  <span key={allergy} className="bg-red-50 text-red-700 border border-red-200 text-[10px] font-semibold px-2 py-0.5 rounded uppercase tracking-wide">
                    {allergy}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-2.5 pt-2 border-t border-slate-100 text-[10px] text-slate-400 italic">
              No known medication allergies registered.
            </div>
          )}
        </div>

        {/* AI Patient Readmission Risk Scoring */}
        <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-xs">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1.5">
              <Brain className="w-3.5 h-3.5 text-indigo-500" /> AI Readmission Risk
            </span>
            <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-1.5 rounded">Low (8%)</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mb-1.5 overflow-hidden">
            <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '8%' }}></div>
          </div>
          <p className="text-[9px] text-slate-400 leading-tight">Patient exhibits stable vitals. Post-discharge readmission probability is well below clinical threshold.</p>
        </div>

        {/* Longitudinal clinical history section */}
        <div className="flex-1 flex flex-col min-h-[220px]">
          <div className="flex items-center gap-1.5 text-[#07B2B2] font-semibold text-xs mb-2">
            <History className="w-4 h-4" />
            <span id="longitudinal-history-title">{t.longitudinalHistory}</span>
            <span className="bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-full text-[9px] font-mono">
              {patientPastVisits.length}
            </span>
          </div>

          {patientPastVisits.length === 0 ? (
            <div className="bg-white rounded-lg border border-slate-200/60 p-5 flex-1 flex flex-col items-center justify-center text-center text-slate-400">
              <Clock className="w-8 h-8 text-slate-300 mb-1" />
              <span className="text-xs">No previous electronic health records.</span>
              <span className="text-[10px] text-slate-400 mt-0.5">This session initiates patient's master record timeline.</span>
            </div>
          ) : (
            <div className="space-y-2 flex-1 overflow-y-auto max-h-[350px] pr-1">
              {patientPastVisits.map((visit) => {
                const isSelected = selectedPastVisit?.id === visit.id;
                return (
                  <div
                    key={visit.id}
                    onClick={() => setSelectedPastVisit(isSelected ? null : visit)}
                    className={`p-2.5 rounded-lg border transition-all text-left cursor-pointer hover:border-cyan-500/50 bg-white ${
                      isSelected 
                        ? 'border-[#07B2B2] ring-1 ring-[#07B2B2] bg-cyan-50/20 shadow-xs' 
                        : 'border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-mono font-medium text-slate-500">{visit.date}</span>
                      <span className="text-[#07B2B2] font-bold text-[8px] uppercase tracking-wide">
                        {visit.soap.assessment.icdCode}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-800 truncate mt-1">
                      {visit.soap.assessment.description}
                    </p>
                    <p className="text-[10px] text-slate-500 line-clamp-2 mt-0.5" title={visit.soap.subjective}>
                      S: {visit.soap.subjective}
                    </p>

                    <div className="flex items-center gap-2 mt-1.5 text-[9px] text-slate-400">
                      <span className="flex items-center gap-0.5">
                        <Heart className="w-3 h-3 text-red-500" /> HR: {visit.soap.objective.heartRate}
                      </span>
                      <span className="flex items-center gap-0.5">
                        <Thermometer className="w-3 h-3 text-orange-400" /> T: {visit.soap.objective.temperature}°C
                      </span>
                    </div>

                    {/* Extended Details panel when clicked */}
                    {isSelected && (
                      <div className="mt-3 pt-2.5 border-t border-slate-100 text-[10px] space-y-1.5 text-slate-600 animate-fadeIn">
                        <div>
                          <strong>Objective Findings:</strong> BP {visit.soap.objective.bpSystolic}/{visit.soap.objective.bpDiastolic} mmHg. RR {visit.soap.objective.respiratoryRate} bpm.
                        </div>
                        <div>
                          <strong>Assessment / Clinical Notes:</strong> {visit.soap.assessment.clinicalNotes}
                        </div>
                        <div>
                          <strong>Therapeutic Interventions (Rx):</strong>
                          <ul className="list-disc list-inside mt-0.5 text-slate-500 space-y-0.5 pl-1">
                            {visit.soap.plan.prescription.map((rx, idx) => (
                              <li key={idx}>
                                {rx.drugName} (Qty: {rx.quantity})
                              </li>
                            ))}
                          </ul>
                        </div>
                        {visit.soap.plan.mcDays > 0 && (
                          <div className="text-amber-700 bg-amber-50 rounded px-1.5 py-0.5 text-[9px] font-medium w-fit mt-1">
                            Medical Certificate (MC) Issued: {visit.soap.plan.mcDays} Days
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

      {/* RIGHT COLUMN: Dense SOAP Notes Module & Form Area (65%) */}
      <div className="lg:col-span-8 bg-white border border-slate-200 rounded-lg p-4 flex flex-col justify-between">
        
        <div>
          {/* Section banner name */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <h3 className="text-[#07B2B2] font-bold text-sm tracking-tight flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-emerald-600" />
              {t.consultationRoom}
            </h3>
            <span className="text-[11px] bg-sky-50 text-sky-800 border border-sky-200 px-2.5 py-0.5 rounded font-mono shadow-sm">
              ICD-10 Diagnostic Class Enabled
            </span>
          </div>

          {/* SOAP Tabs Navigation */}
          <div className="flex border-b border-slate-200 mb-4 bg-slate-50 p-1.5 rounded-lg gap-1 shadow-inner">
            <button
              type="button"
              onClick={() => setActiveTab('subjective')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'subjective' 
                  ? 'bg-white text-[#07B2B2] shadow-xs font-semibold' 
                  : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'
              }`}
            >
              <ClipboardList className="w-3.5 h-3.5 text-[#07B2B2]" />
              {t.subjective}
            </button>
            <button
              type="button"
              id="objective-tab-trigger"
              onClick={() => setActiveTab('objective')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'objective' 
                  ? 'bg-white text-[#07B2B2] shadow-xs font-semibold' 
                  : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-rose-500" />
              {t.objective}
            </button>
            <button
              type="button"
              id="assessment-tab-trigger"
              onClick={() => setActiveTab('assessment')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'assessment' 
                  ? 'bg-white text-[#07B2B2] shadow-xs font-semibold' 
                  : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'
              }`}
            >
              <ClipboardList className="w-3.5 h-3.5 text-blue-500" />
              {t.assessment}
            </button>
            <button
              type="button"
              id="plan-tab-trigger"
              onClick={() => setActiveTab('plan')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'plan' 
                  ? 'bg-white text-[#07B2B2] shadow-xs font-semibold' 
                  : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'
              }`}
            >
              <Pill className="w-3.5 h-3.5 text-orange-500" />
              {t.plan}
              {rxList.length > 0 && (
                <span className="bg-orange-500 text-white font-mono text-[9px] px-1 rounded-full">{rxList.length}</span>
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

          {/* TAB 2: OBJECTIVE (IoT Vitals Integration) */}
          {activeTab === 'objective' && (
            <ObjectiveTab
              vitals={vitals}
              setVitals={setVitals}
              patientPastVisits={patientPastVisits}
            />
          )}

          {/* TAB 3: ASSESSMENT FIELD (ICD-10 search tool index) */}
          {activeTab === 'assessment' && (
            <AssessmentTab 
              selectedICD={selectedICD}
              setSelectedICD={setSelectedICD}
              clinicalNotes={clinicalNotes}
              setClinicalNotes={setClinicalNotes}
              activeLanguage={activeLanguage}
            />
          )}

          {/* TAB 4: PLAN (Prescriptions builder, allergy integration verification flags) */}
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

        {/* AI Smart Summary (New Feature) */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-3.5 rounded-lg border border-indigo-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
            <Brain className="w-12 h-12 text-indigo-500" />
          </div>
          <h4 className="text-[10px] font-bold text-indigo-800 uppercase flex items-center gap-1.5 mb-2">
            <Zap className="w-3.5 h-3.5" /> AI Medical Summary
          </h4>
          <ul className="text-xs text-indigo-900 space-y-1.5 pl-4 list-disc marker:text-indigo-300">
            {currentPatient.drugAllergies.length > 0 ? (
              <li><strong>Critical:</strong> Known anaphylaxis/allergy to {currentPatient.drugAllergies.join(', ')}.</li>
            ) : (
              <li>No known drug allergies (NKDA) on record.</li>
            )}
            {patientPastVisits.length > 0 ? (
              <li>{patientPastVisits.length} prior visits. Most recent diagnosis: <span className="font-mono bg-white/50 px-1 rounded">{patientPastVisits[0].soap.assessment.icdCode}</span>.</li>
            ) : (
              <li>First time consultation at this clinic.</li>
            )}
            <li>Predictive: High probability of seasonal flu/viral fever based on current demographic trends.</li>
          </ul>
        </div>

        {/* Global form controls and clinical authorization */}
        <div className="border-t border-slate-100 pt-3.5 mt-5 flex items-center justify-end gap-2 bg-white">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-medium hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Cancel Consult
          </button>
          
          <button
            type="button"
            id="clinical-save-signoff-btn"
            onClick={handleSubmitConsultation}
            className="bg-[#07B2B2] text-white px-5 py-2.5 rounded-lg text-xs font-bold hover:bg-[#058A8A] transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <Check className="w-4 h-4 text-white" />
            Clinical Sign-off (Send to Pharmacy)
          </button>
        </div>

      </div>

      </div>

      {/* 📌 3. FLOATING STICKY ACTION BAR FOR LONG SOAP PAGES */}
      <div className="fixed bottom-4 right-6 z-[60] bg-slate-900/95 backdrop-blur-md text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700/80 flex items-center justify-between gap-4 animate-fadeIn">
        <div className="hidden md:flex flex-col">
          <span className="text-[9px] text-slate-400 font-mono uppercase tracking-wider">Active Patient Encounter</span>
          <span className="text-xs font-extrabold text-teal-300 truncate max-w-[200px]">{currentPatient.fullName}</span>
        </div>

        <div className="hidden lg:flex items-center gap-2 border-l border-slate-700/80 pl-4">
          <span className="text-[10px] text-slate-400">ICD-10:</span>
          <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded ${selectedICD ? 'bg-[#0D9488] text-white' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'}`}>
            {selectedICD ? selectedICD.code : 'No ICD Selected'}
          </span>
        </div>

        <div className="flex items-center gap-2.5 border-l border-slate-700/80 pl-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            id="floating-submit-soap-btn"
            onClick={handleSubmitConsultation}
            className="bg-[#0D9488] hover:bg-teal-600 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 transition-all hover:scale-105 cursor-pointer ring-2 ring-teal-400/30"
          >
            <Stethoscope className="w-4 h-4" />
            <span>Complete & Route to Dispensary</span>
            <span className="hidden sm:inline text-[9px] font-mono opacity-80 bg-black/30 px-1.5 py-0.5 rounded border border-white/10">Ctrl+Enter</span>
          </button>
        </div>
      </div>

    </div>
  );
}
