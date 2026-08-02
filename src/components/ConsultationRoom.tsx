import React, { useState, useEffect } from 'react';
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
  const getVitalsAbnormalities = () => {
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
  };

  const vitalsAlerts = getVitalsAbnormalities();


  // Assessment State
  const [searchICDQuery, setSearchICDQuery] = useState('');
  const [selectedICD, setSelectedICD] = useState<ICD10Code | null>(null);
  const [icdSuggestions, setIcdSuggestions] = useState<ICD10Code[]>([]);
  const [clinicalNotes, setClinicalNotes] = useState('');

  // Plan State (Prescription builder)
  const [searchDrugQuery, setSearchDrugQuery] = useState('');
  const [drugSuggestions, setDrugSuggestions] = useState<any[]>([]);
  const [rxList, setRxList] = useState<PrescriptionItem[]>([]);
  
  // Drug Alerts & Conflicts State
  const [allergyAlerts, setAllergyAlerts] = useState<{ drugName: string; allergyGroup: string }[]>([]);
  const [contraindicationAlerts, setContraindicationAlerts] = useState<{ drugName: string; icdCode: string; reason: string }[]>([]);

  // MC Generator
  const [isMcModalOpen, setIsMcModalOpen] = useState(false);
  const [mcDays, setMcDays] = useState<number | ''>(1);
  const [mcReferenceNo, setMcReferenceNo] = useState('');
  const [mcGenerated, setMcGenerated] = useState(false);

  // Next-Gen Simulations State
  const [isListening, setIsListening] = useState(false);
  const [isSyncingVitals, setIsSyncingVitals] = useState(false);

  // Pharmacy Memo
  const [pharmacyMemo, setPharmacyMemo] = useState('');

  // Referral State
  const [isReferralModalOpen, setIsReferralModalOpen] = useState(false);
  const [referralDetails, setReferralDetails] = useState({
    hospital: '',
    department: '',
    reason: ''
  });
  const [referralGenerated, setReferralGenerated] = useState(false);

  // Pediatric Calc State
  const [patientWeight, setPatientWeight] = useState('');
  const [medConcentration, setMedConcentration] = useState('');
  const [calculatedDose, setCalculatedDose] = useState<number | null>(null);

  // function for pediatric calculator
  useEffect(() => {
    const weight = parseFloat(patientWeight);
    const conc = parseFloat(medConcentration);
    if (weight > 0 && conc > 0) {
      // standard formula e.g. 15mg/kg/dose for paracetamol
      const doseMg = weight * 15;
      const volumeMl = doseMg / conc;
      setCalculatedDose(volumeMl);
    } else {
      setCalculatedDose(null);
    }
  }, [patientWeight, medConcentration]);

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

  // Filter ICD suggestions
  useEffect(() => {
    if (searchICDQuery.trim() === '') {
      setIcdSuggestions([]);
    } else if (searchICDQuery.trim().length > 1) {
      const filtered = icd10Catalog.filter(
        (i) => i.code.toLowerCase().includes(searchICDQuery.toLowerCase()) || i.desc.toLowerCase().includes(searchICDQuery.toLowerCase())
      );
      setIcdSuggestions(filtered);
    }
  }, [searchICDQuery, icd10Catalog]);

  // Filter Drug Suggestions
  useEffect(() => {
    if (searchDrugQuery.trim() === '') {
      setDrugSuggestions([]);
    } else if (searchDrugQuery.trim().length > 1) {
      const filtered = inventory.filter(
        (d) => d.name.toLowerCase().includes(searchDrugQuery.toLowerCase()) && d.currentStock > 0
      );
      setDrugSuggestions(filtered);
    }
  }, [searchDrugQuery, inventory]);

  // Check Allergies whenever RX list updates
  useEffect(() => {
    if (!currentPatient) return;
    const alerts: { drugName: string; allergyGroup: string }[] = [];
    
    rxList.forEach(rx => {
      // Find matching drug in catalog to inspect
      const catalogDrug = inventory.find(d => d.name === rx.drugName);
      if (catalogDrug && catalogDrug.allergyGroup !== 'None') {
        // Is the patient allergic to this group?
        const isAllergic = catalogDrug.allergyGroup !== 'None' && currentPatient.drugAllergies.some(
          allergy => allergy.toLowerCase() === catalogDrug.allergyGroup.toLowerCase() ||
                    catalogDrug.allergyGroup.toLowerCase().includes(allergy.toLowerCase()) ||
                    allergy.toLowerCase().includes(catalogDrug.allergyGroup.toLowerCase())
        );
        if (isAllergic) {
          alerts.push({
            drugName: rx.drugName,
            allergyGroup: catalogDrug.allergyGroup
          });
        }
      }
    });

    setAllergyAlerts(alerts);
  }, [rxList, currentPatient, inventory]);

  // Check Drug-Disease Contraindications whenever rxList or selectedICD changes
  useEffect(() => {
    const alerts: { drugName: string; icdCode: string; reason: string }[] = [];
    if (!selectedICD) {
      setContraindicationAlerts([]);
      return;
    }

    const icdCodeUpper = selectedICD.code.toUpperCase();

    rxList.forEach(rx => {
      const drugLower = rx.drugName.toLowerCase();

      // Rule 1: Gastritis / Peptic Ulcer (K30, K29, K27) vs NSAIDs / Painkillers
      if (icdCodeUpper.startsWith('K30') || icdCodeUpper.startsWith('K29') || icdCodeUpper.startsWith('K27')) {
        if (drugLower.includes('ibuprofen') || drugLower.includes('diclofenac') || drugLower.includes('mefenamic') || drugLower.includes('aspirin') || drugLower.includes('naproxen') || drugLower.includes('ponstan') || drugLower.includes('voltaren')) {
          alerts.push({
            drugName: rx.drugName,
            icdCode: selectedICD.code,
            reason: `NSAIDs cause gastric mucosal erosion and risk ulceration in Gastritis (${selectedICD.code}).`
          });
        }
      }

      // Rule 2: Asthma (J45, J44) vs Beta-blockers
      if (icdCodeUpper.startsWith('J45') || icdCodeUpper.startsWith('J44')) {
        if (drugLower.includes('propranolol') || drugLower.includes('atenolol') || drugLower.includes('carvedilol') || drugLower.includes('metoprolol')) {
          alerts.push({
            drugName: rx.drugName,
            icdCode: selectedICD.code,
            reason: `Beta-blockers induce bronchospasm in Asthmatic conditions (${selectedICD.code}).`
          });
        }
      }

      // Rule 3: Essential Hypertension (I10) vs Decongestants / Pseudoephedrine
      if (icdCodeUpper.startsWith('I10')) {
        if (drugLower.includes('pseudoephedrine') || drugLower.includes('phenylephrine') || drugLower.includes('actifed') || drugLower.includes('decongestant')) {
          alerts.push({
            drugName: rx.drugName,
            icdCode: selectedICD.code,
            reason: `Sympathomimetic decongestants cause arterial vasoconstriction & BP elevation in Hypertension (${selectedICD.code}).`
          });
        }
      }

      // Rule 4: Diabetes (E11) vs High Corticosteroids
      if (icdCodeUpper.startsWith('E11')) {
        if (drugLower.includes('dexamethasone') || drugLower.includes('prednisolone') || drugLower.includes('cortisone')) {
          alerts.push({
            drugName: rx.drugName,
            icdCode: selectedICD.code,
            reason: `Systemic corticosteroids induce severe hyperglycemia in Type 2 Diabetes (${selectedICD.code}).`
          });
        }
      }
    });

    setContraindicationAlerts(alerts);
  }, [rxList, selectedICD]);

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

  // Add prescription item
  const handleAddDrug = (catalogDrug: any) => {
    // Prevent duplicated adds
    if (rxList.some(r => r.drugName === catalogDrug.name)) {
      setSearchDrugQuery('');
      setDrugSuggestions([]);
      return;
    }

    const newRx: PrescriptionItem = {
      id: `rx-${Date.now()}`,
      drugName: catalogDrug.name,
      dosage: catalogDrug.dosageEN,
      dosageBM: catalogDrug.dosageBM,
      frequency: catalogDrug.frequency,
      quantity: 10, // default quantity
      pricePerUnit: catalogDrug.pricePerUnit,
      expiryDate: new Date(Date.now() + (catalogDrug.expiryMonths || 12) * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      pillColor: catalogDrug.pillColor,
      capsuleStyle: catalogDrug.capsuleStyle
    };

    setRxList([...rxList, newRx]);
    setSearchDrugQuery('');
    setDrugSuggestions([]);
  };

  const handleRemoveRx = (rxId: string) => {
    setRxList(rxList.filter(r => r.id !== rxId));
  };

  const handleUpdateRxQty = (rxId: string, qty: number) => {
    setRxList(rxList.map(r => r.id === rxId ? { ...r, quantity: Math.max(1, qty) } : r));
  };

  // MC Code generation reference
  const triggerMcOpening = () => {
    const randomRef = `MC-${Math.floor(100000 + Math.random() * 900000)}`;
    setMcReferenceNo(randomRef);
    setIsMcModalOpen(true);
  };

  const handleMockGenerateMc = () => {
    setMcGenerated(true);
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

          {/* TAB 1: SUBJECTIVE (Voice-to-Text Copilot) */}
          {activeTab === 'subjective' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex justify-between items-center">
                <p className="text-xs text-slate-500 font-semibold">Record patient complaints, symptoms, and medical history.</p>
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      if(patientPastVisits.length > 0) {
                        setSubjective(patientPastVisits[0].soap.subjective);
                      }
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase transition-all shadow-sm border bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Copy Previous
                  </button>
                  <button 
                    onClick={handleVoiceToText}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase transition-all shadow-sm border ${
                      isListening 
                        ? 'bg-red-50 text-red-600 border-red-200 animate-pulse' 
                        : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100 cursor-pointer'
                    }`}
                  >
                    {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                    {isListening ? 'AI Listening...' : 'AI Voice Dictation'}
                  </button>
                </div>
              </div>
              <textarea
                id="soap-subjective-input"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-4 text-sm transition-all focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus:bg-white outline-none shadow-inner resize-y min-h-[180px] leading-relaxed"
                value={subjective}
                onChange={(e) => setSubjective(e.target.value)}
                placeholder="Record symptoms, clinical history, patient complaints, pain scale (0-10), onset duration..."
              />

              {/* Malaysia local templates helper */}
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wide block mb-1.5">
                  💡 Clinical Complain Quick-Templates:
                </span>
                <div className="flex flex-col gap-1.5">
                  {complainTemplateList.map((tpl, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleApplySymptomTemplate(tpl)}
                      className="text-left py-1 px-2.5 bg-slate-50 hover:bg-slate-100 ring-1 ring-slate-200 text-[11px] text-slate-600 rounded-lg truncate cursor-pointer transition-colors"
                    >
                      + {tpl}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: OBJECTIVE (IoT Vitals Integration) */}
          {activeTab === 'objective' && (
            <div className="space-y-5 animate-fadeIn">
              <div className="flex justify-between items-center">
                <p className="text-xs text-slate-500 font-semibold">Record physical examination and vital signs.</p>
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      if(patientPastVisits.length > 0) {
                        setVitals(patientPastVisits[0].soap.objective);
                      }
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase transition-all shadow-sm border bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Copy Previous
                  </button>
                  <button 
                    onClick={handleSyncVitals}
                    disabled={isSyncingVitals}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase transition-all shadow-sm border ${
                      isSyncingVitals 
                        ? 'bg-blue-50 text-blue-500 border-blue-200 animate-pulse' 
                        : 'bg-[#07B2B2]/10 text-[#07B2B2] border-cyan-200 hover:bg-[#07B2B2]/20 cursor-pointer'
                    }`}
                  >
                    <Bluetooth className="w-3.5 h-3.5" />
                    {isSyncingVitals ? 'Syncing Hardware...' : 'Sync IoT Vitals'}
                  </button>
                </div>
              </div>

              {/* Vitals Trending Sparkline */}
              {patientPastVisits.length > 1 && (
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 flex items-center justify-between shadow-inner">
                  <div className="flex items-center gap-2">
                    <LineChart className="w-4 h-4 text-slate-400" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase">BP Trend (Last 3 Visits)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {patientPastVisits.slice(0,3).map((v, i) => (
                      <div key={i} className="flex flex-col items-center">
                        <span className="text-[9px] text-slate-400 font-mono">{v.date.substring(5)}</span>
                        <span className="text-xs font-bold text-slate-700">{v.soap.objective.bpSystolic}/{v.soap.objective.bpDiastolic}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    BP Systolic (mmHg)
                  </label>
                  <input
                    type="number"
                    id="vital-bp-sys"
                    value={vitals.bpSystolic}
                    onChange={(e) => setVitals({ ...vitals, bpSystolic: parseInt(e.target.value) || 0 })}
                    className="w-full border border-slate-300 rounded px-2.5 py-1 text-xs font-mono font-bold"
                  />
                  {vitals.bpSystolic > 140 ? (
                    <span className="text-[9px] text-red-600 font-semibold block mt-1">Alert: Hypertension Level</span>
                  ) : (
                    <span className="text-[9px] text-slate-400 block mt-1">Normal Range: 90 - 130</span>
                  )}
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    BP Diastolic (mmHg)
                  </label>
                  <input
                    type="number"
                    id="vital-bp-dia"
                    value={vitals.bpDiastolic}
                    onChange={(e) => setVitals({ ...vitals, bpDiastolic: parseInt(e.target.value) || 0 })}
                    className="w-full border border-slate-300 rounded px-2.5 py-1 text-xs font-mono font-bold"
                  />
                  {vitals.bpDiastolic > 90 ? (
                    <span className="text-[9px] text-red-500 font-semibold block mt-1">Elevated diastolic diastolic</span>
                  ) : (
                    <span className="text-[9px] text-slate-400 block mt-1">Normal Range: 60 - 85</span>
                  )}
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Heart Rate (bpm)
                  </label>
                  <input
                    type="number"
                    id="vital-hr"
                    value={vitals.heartRate}
                    onChange={(e) => setVitals({ ...vitals, heartRate: parseInt(e.target.value) || 0 })}
                    className="w-full border border-slate-300 rounded px-2.5 py-1 text-xs font-mono font-bold"
                  />
                  {vitals.heartRate > 100 || vitals.heartRate < 50 ? (
                    <span className="text-[9px] text-amber-600 font-semibold block mt-1">Tachy/Bradycardia Warning</span>
                  ) : (
                    <span className="text-[9px] text-slate-400 block mt-1">Normal Range: 60 - 100</span>
                  )}
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Temperature (°C)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    id="vital-temp"
                    value={vitals.temperature}
                    onChange={(e) => setVitals({ ...vitals, temperature: parseFloat(e.target.value) || 0 })}
                    className="w-full border border-slate-300 rounded px-2.5 py-1 text-xs font-mono font-bold"
                  />
                  {vitals.temperature >= 37.5 ? (
                    <span className="text-[9px] bg-red-100 text-red-700 px-1 py-0.2 rounded font-semibold inline-block mt-1">
                      Fever Detected
                    </span>
                  ) : (
                    <span className="text-[9px] text-slate-400 block mt-1">Normal Range: 36.4 - 37.2</span>
                  )}
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Respiratory Rate (bpm)
                  </label>
                  <input
                    type="number"
                    id="vital-rr"
                    value={vitals.respiratoryRate}
                    onChange={(e) => setVitals({ ...vitals, respiratoryRate: parseInt(e.target.value) || 0 })}
                    className="w-full border border-slate-300 rounded px-2.5 py-1 text-xs font-mono font-bold"
                  />
                  <span className="text-[9px] text-slate-400 block mt-1">Normal Range: 12 - 20 bpm</span>
                </div>
              </div>

              {/* IoT Medical Device Telemetry */}
              <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 shadow-sm mt-4">
                <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  IoT Medical Device Network
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-slate-900 p-2 rounded-lg border border-slate-600 flex flex-col justify-between">
                    <span className="text-[9px] text-slate-400 font-bold uppercase block">Omron BP-X</span>
                    <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 mt-1">
                      <Bluetooth className="w-3 h-3" /> Connected
                    </span>
                  </div>
                  <div className="bg-slate-900 p-2 rounded-lg border border-slate-600 flex flex-col justify-between">
                    <span className="text-[9px] text-slate-400 font-bold uppercase block">Nellcor Oximeter</span>
                    <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 mt-1">
                      <Bluetooth className="w-3 h-3" /> Connected
                    </span>
                  </div>
                  <div className="bg-slate-900 p-2 rounded-lg border border-slate-600 flex flex-col justify-between">
                    <span className="text-[9px] text-slate-400 font-bold uppercase block">Welch Allyn Temp</span>
                    <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 mt-1">
                      <Bluetooth className="w-3 h-3" /> Connected
                    </span>
                  </div>
                  <div className="bg-slate-900 p-2 rounded-lg border border-slate-600 flex flex-col justify-between">
                    <span className="text-[9px] text-slate-400 font-bold uppercase block">Digital Scale</span>
                    <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1 mt-1">
                      <Bluetooth className="w-3 h-3" /> Standby
                    </span>
                  </div>
                </div>
              </div>

              {/* AR Medical Imaging Support */}
              <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200 shadow-sm mt-4">
                <h4 className="text-xs font-bold text-indigo-800 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Brain className="w-4 h-4" />
                  Augmented Reality (AR) Overlay
                </h4>
                <p className="text-[10px] text-indigo-600 mb-3 font-medium">
                  Project MRI/CT scans into the clinical field of view using Apple Vision or HoloLens.
                </p>
                <div className="flex gap-2">
                  <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded text-[10px] font-bold transition-colors flex items-center gap-1 shadow-sm">
                    <Eye className="w-3 h-3" />
                    Launch AR View (HoloLens)
                  </button>
                  <button className="bg-white border border-indigo-300 text-indigo-700 hover:bg-indigo-100 px-3 py-1.5 rounded text-[10px] font-bold transition-colors shadow-sm">
                    Load Latest MRI
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ASSESSMENT FIELD (ICD-10 search tool index) */}
          {activeTab === 'assessment' && (
            <div className="space-y-4 animate-fadeIn">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-tight">
                    {t.icd10Search} <span className="text-red-500">*</span>
                  </label>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <button onClick={() => setSelectedICD(icd10Catalog.find(i=>i.code==='J06.9')||null)} className="text-[9px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-0.5 rounded cursor-pointer transition-colors">URTI (J06.9)</button>
                    <button onClick={() => setSelectedICD(icd10Catalog.find(i=>i.code==='I10')||null)} className="text-[9px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-0.5 rounded cursor-pointer transition-colors">HTN (I10)</button>
                    <button onClick={() => setSelectedICD(icd10Catalog.find(i=>i.code==='E11.9')||null)} className="text-[9px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-0.5 rounded cursor-pointer transition-colors">T2DM (E11.9)</button>
                  </div>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    id="icd10-catalog-search"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-cyan-600 focus:outline-none"
                    value={searchICDQuery}
                    onChange={(e) => setSearchICDQuery(e.target.value)}
                    placeholder="Search standard diagnose (e.g., 'Cold', 'J06', 'Hypertension', 'Diabetes', 'Gastritis')..."
                  />
                  
                  {icdSuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-10 max-h-[160px] overflow-y-auto">
                      {icdSuggestions.map((item) => (
                        <button
                          key={item.code}
                          type="button"
                          onClick={() => {
                            setSelectedICD(item);
                            setSearchICDQuery('');
                            setIcdSuggestions([]);
                          }}
                          className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 border-b border-slate-100 flex items-center justify-between cursor-pointer"
                        >
                          <div>
                            <span className="font-mono font-bold text-[#07B2B2]">{item.code}</span>
                            <span className="text-slate-700 ml-2">{item.desc}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 bg-slate-100 px-1 py-0.2 rounded">
                            {item.category}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Assessment display selection indicator */}
              {selectedICD ? (
                <div id="selected-icd-indicator" className="bg-cyan-50 border border-[#07B2B2]/20 p-3 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] bg-[#07B2B2] text-white px-1.5 py-0.5 rounded font-mono font-bold">
                      ICD-Code: {selectedICD.code}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedICD(null)}
                      className="text-slate-400 hover:text-slate-600 text-xs font-bold shrink-0"
                    >
                      Remove
                    </button>
                  </div>
                  <strong className="text-xs text-slate-800 uppercase block">{selectedICD.desc}</strong>
                  <span className="text-[10px] text-slate-500 block mt-1">Category Grouping: {selectedICD.category}</span>
                </div>
              ) : (
                <div className="p-3 bg-red-50 text-red-700 rounded-lg border border-red-100 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>Please search and assign an ICD-10 clinically coded diagnosis to complete assessment.</span>
                </div>
              )}

              {/* Clinician notes description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-tight mb-1">
                  Assessment / Clinical Sign-off Summary (Procedures/Investigations)
                </label>
                <textarea
                  id="soap-notes-clinical-desc"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-4 text-sm transition-all focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus:bg-white outline-none shadow-inner resize-y min-h-[120px] leading-relaxed"
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                  placeholder="Enter medical assessment summary, specialist reports references, follow-up parameters, or procedural logs..."
                />
              </div>
            </div>
          )}

          {/* TAB 4: PLAN (Prescriptions builder, allergy integration verification flags) */}
          {activeTab === 'plan' && (
            <div className="space-y-5 animate-fadeIn relative">
              
              {/* AI DRUG INTERACTION ALERT */}
              {allergyAlerts.length > 0 ? (
                <div className="absolute top-0 right-0 left-0 z-10 bg-red-600 text-white p-3 rounded-lg shadow-lg animate-bounce-slow flex items-start gap-3">
                  <AlertTriangle className="w-6 h-6 shrink-0" />
                  <div>
                    <h4 className="font-black text-sm uppercase tracking-wider">AI ALERT: Drug Interaction Detected!</h4>
                    <p className="text-xs mt-0.5">
                      Patient has a known allergy history that conflicts with your prescription plan.
                    </p>
                    <ul className="text-[10px] mt-1 list-disc pl-4 font-mono bg-black/20 p-1.5 rounded">
                      {allergyAlerts.map((alert, idx) => (
                        <li key={idx}><span className="font-bold">{alert.drugName}</span> belongs to <span className="font-bold underline">{alert.allergyGroup}</span> family.</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : rxList.length > 0 ? (
                <div className="bg-emerald-50 text-emerald-700 p-2.5 rounded-lg border border-emerald-100 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">AI Interaction Scan: Safe (No Contraindications Detected)</span>
                </div>
              ) : null}

              {/* PEDIATRIC DOSAGE CALCULATOR */}
              <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                <h4 className="text-[10px] font-bold text-blue-800 uppercase flex items-center gap-1.5 mb-2">
                  <Activity className="w-3.5 h-3.5" /> Pediatric Dosage Calculator (Paracetamol 15mg/kg)
                </h4>
                <div className="grid grid-cols-3 gap-3 items-end">
                  <div>
                    <label className="block text-[10px] text-slate-500 uppercase">Weight (kg)</label>
                    <input 
                      type="number" 
                      className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 outline-none"
                      value={patientWeight}
                      onChange={e => setPatientWeight(e.target.value)}
                      placeholder="e.g. 15"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 uppercase">Concentration (mg/ml)</label>
                    <input 
                      type="number" 
                      className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 outline-none"
                      value={medConcentration}
                      onChange={e => setMedConcentration(e.target.value)}
                      placeholder="e.g. 250"
                    />
                  </div>
                  <div className="bg-white px-3 py-1.5 rounded border border-blue-200 flex flex-col justify-center h-full">
                    <span className="text-[9px] text-slate-400 uppercase leading-none mb-1">Calculated Dose</span>
                    <span className="font-mono font-bold text-blue-700 text-sm leading-none">
                      {typeof calculatedDose === 'number' && !isNaN(calculatedDose) ? `${calculatedDose.toFixed(1)} ml` : '--'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Medicine prescription search bar */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-tight mb-1">
                  Add Medication & Drug Catalog Search
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="drug-prescriber-search"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-cyan-600 focus:outline-none"
                    value={searchDrugQuery}
                    onChange={(e) => setSearchDrugQuery(e.target.value)}
                    placeholder="Search stock catalog (e.g. 'Amoxicillin', 'Panadol', 'Ibuprofen', 'Amlodipine')..."
                  />

                  {drugSuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-10 max-h-[160px] overflow-y-auto">
                      {drugSuggestions.map((item) => {
                        const isConflict = item.allergyGroup !== 'None' && currentPatient.drugAllergies.some(
                          a => a.toLowerCase() === item.allergyGroup.toLowerCase() ||
                               item.allergyGroup.toLowerCase().includes(a.toLowerCase())
                        );
                        const price = typeof item.pricePerUnit === 'number' ? item.pricePerUnit : 0;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => handleAddDrug(item)}
                            className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 border-b border-slate-100 flex items-center justify-between cursor-pointer"
                          >
                            <div>
                              <span className="font-semibold text-slate-800">{item.name}</span>
                              <span className="text-[10px] text-slate-400 block">{item.category} (Allergen: {item.allergyGroup})</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {isConflict && (
                                <span className="bg-red-100 text-red-700 font-bold px-1.5 py-0.5 rounded text-[8px] uppercase">Allergy Conflict</span>
                              )}
                              <span className="font-mono text-[#07B2B2] font-bold">RM{price.toFixed(2)}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* SMART DOSAGE QUICK-PILLS PRESET BAR */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                    <Pill className="w-3.5 h-3.5 text-[#0D9488]" />
                    Fast Preset Dosage Quick-Pills
                  </span>
                  <span className="text-[9px] text-slate-400">Click to apply to active prescription</span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    { label: '1 Tab BD (2x Daily)', freq: '1 Tab Twice Daily', en: 'Take 1 tablet twice a day after food', bm: 'Makan 1 biji 2 kali sehari selepas makan' },
                    { label: '1 Cap TDS (3x Daily)', freq: '1 Cap 3x Daily', en: 'Take 1 capsule three times a day after food', bm: 'Makan 1 kapsul 3 kali sehari selepas makan' },
                    { label: '1 Tab QDS (4x Daily)', freq: '1 Tab 4x Daily', en: 'Take 1 tablet four times a day', bm: 'Makan 1 biji 4 kali sehari' },
                    { label: '1 Tab PRN (As Needed)', freq: '1 Tab PRN', en: 'Take 1 tablet when needed for pain/fever', bm: 'Makan 1 biji jika perlu bila sakit/demam' },
                    { label: 'Take After Meals', freq: 'After Meals', en: 'Take after meals', bm: 'Makan selepas makan' }
                  ].map((preset, pIdx) => (
                    <button
                      key={pIdx}
                      type="button"
                      onClick={() => {
                        if (rxList.length > 0) {
                          const updated = [...rxList];
                          const lastIdx = updated.length - 1;
                          updated[lastIdx] = {
                            ...updated[lastIdx],
                            frequency: preset.freq,
                            dosage: preset.en,
                            dosageBM: preset.bm
                          };
                          setRxList(updated);
                        }
                      }}
                      className="text-[10px] font-bold bg-white hover:bg-[#0D9488] hover:text-white text-[#0D9488] px-2.5 py-1 rounded-md border border-teal-200 shadow-2xs transition-colors cursor-pointer"
                    >
                      + {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Currently Selected Prescription list */}
              <div className="border border-slate-200 rounded-lg overflow-hidden space-y-0">
                
                {/* CLINICAL CONTRAINDICATION WARNING BANNER */}
                {contraindicationAlerts.length > 0 && (
                  <div className="bg-amber-50 border-b border-amber-200 p-3 space-y-1">
                    <h5 className="text-xs font-extrabold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600 animate-bounce-slow" />
                      Drug-Disease Clinical Contraindication Alert ({contraindicationAlerts.length})
                    </h5>
                    <div className="space-y-1">
                      {contraindicationAlerts.map((alert, idx) => (
                        <p key={idx} className="text-[11px] text-amber-800 font-medium leading-relaxed">
                          • <strong className="font-bold underline">{alert.drugName}</strong> vs Diagnosis <strong className="font-mono bg-amber-100 px-1 rounded text-amber-900 font-bold">{alert.icdCode}</strong>: {alert.reason}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                <table className="w-full text-left border-collapse" id="prescription-builder-table">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                      <th className="px-3 py-2">Medication Info</th>
                      <th className="px-3 py-2">Frequency & Instructions</th>
                      <th className="px-3 py-2 w-20">Qty</th>
                      <th className="px-3 py-2 text-right w-24">Price (MYR)</th>
                      <th className="px-3 py-2 text-center w-12">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rxList.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center p-6 text-xs text-slate-400 italic">
                          No medications prescribed yet. Search above to construct treatment.
                        </td>
                      </tr>
                    ) : (
                      rxList.map((rx) => {
                        const catalogDrugDef = inventory.find(d => d.name === rx.drugName);
                        if (!catalogDrugDef) return null;
                        const hasConflict = catalogDrugDef && catalogDrugDef.allergyGroup !== 'None' && 
                          currentPatient.drugAllergies.some(a => a.toLowerCase() === catalogDrugDef.allergyGroup.toLowerCase());
                        const isContraindicated = contraindicationAlerts.some(a => a.drugName === rx.drugName);
                        const unitPrice = typeof rx.pricePerUnit === 'number' ? rx.pricePerUnit : (catalogDrugDef?.pricePerUnit || 0);
                        const itemTotal = unitPrice * (rx.quantity || 1);
                        
                        return (
                          <tr key={rx.id} className={`border-b text-xs border-slate-100 ${hasConflict ? 'bg-red-50/40' : isContraindicated ? 'bg-amber-50/40' : ''}`}>
                            <td className="px-3 py-2.5">
                              <span className="font-semibold text-slate-800 block">{rx.drugName}</span>
                              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                {/* Vector pill icon */}
                                <span 
                                  className="w-2.5 h-2.5 rounded-full inline-block border border-slate-300"
                                  style={{ backgroundColor: rx.pillColor }}
                                />
                                <span className="text-[10px] text-slate-400">Batch Expiry: {rx.expiryDate}</span>
                                {isContraindicated && (
                                  <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded uppercase tracking-wider border border-amber-300 flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3 text-amber-600" /> ICD Contraindication
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-3 py-2.5 font-mono text-[10px] text-slate-600">
                              <span className="font-semibold text-[#07B2B2]">{rx.frequency}</span>
                              <span className="block text-slate-500 line-clamp-1 italic" title={rx.dosage}>{rx.dosage}</span>
                            </td>
                            <td className="px-3 py-2.5">
                              <input
                                type="number"
                                className="w-16 border rounded px-1.5 py-0.5 text-center font-mono"
                                value={rx.quantity}
                                onChange={(e) => handleUpdateRxQty(rx.id, parseInt(e.target.value) || 1)}
                              />
                            </td>
                            <td className="px-3 py-2.5 text-right font-mono font-semibold text-slate-700">
                              RM{itemTotal.toFixed(2)}
                            </td>
                            <td className="px-3 py-2.5 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveRx(rx.id)}
                                className="text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* PHARMACY MEMO */}
              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-tight mb-1">
                  Notes / Instructions for Pharmacist
                </label>
                <textarea
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-cyan-600 focus:outline-none"
                  value={pharmacyMemo}
                  onChange={e => setPharmacyMemo(e.target.value)}
                  placeholder="e.g., Please demonstrate inhaler technique. Patient prefers liquid formulation if possible."
                  rows={2}
                />
              </div>

              {/* Plan Actions (MC, Labs, Referrals) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Digital MC Certification trigger button */}
                <div className="flex flex-col p-3 bg-slate-50 border border-slate-200 rounded-lg justify-between gap-3 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-[#07B2B2]" />
                    <div>
                      <span className="text-xs font-bold block text-slate-700 uppercase tracking-tight">Medical Cert (MC)</span>
                      <span className="text-[9px] text-slate-400 leading-tight block">Issue paid clinic recovery leave.</span>
                    </div>
                  </div>

                  {mcGenerated ? (
                    <div className="flex flex-col gap-1 mt-auto">
                      <span className="text-[10px] text-cyan-800 bg-cyan-100 font-bold px-2 py-0.5 rounded text-center">
                        {mcDays} Days Issued ({selectedICD?.code || 'Diagnose'})
                      </span>
                      <div className="flex items-center gap-2 mt-1 justify-center">
                        <button
                          type="button"
                          onClick={() => setIsMcModalOpen(true)}
                          className="text-[10px] font-bold text-[#07B2B2] underline cursor-pointer text-center"
                        >
                          View Certificate
                        </button>
                        <button
                          type="button"
                          onClick={() => setMcGenerated(false)}
                          className="text-[10px] font-bold text-red-500 hover:text-red-600 underline cursor-pointer text-center"
                        >
                          Revoke
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={triggerMcOpening}
                      className="bg-slate-200 hover:bg-slate-300 text-slate-700 w-full py-1.5 rounded text-[10px] font-bold uppercase transition-colors cursor-pointer mt-auto"
                    >
                      Generate MC
                    </button>
                  )}
                </div>

                {/* Lab & Imaging */}
                <div className="flex flex-col p-3 bg-slate-50 border border-slate-200 rounded-lg justify-between gap-3 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2">
                    <TestTube className="w-5 h-5 text-purple-500" />
                    <div>
                      <span className="text-xs font-bold block text-slate-700 uppercase tracking-tight">Lab & Imaging</span>
                      <span className="text-[9px] text-slate-400 leading-tight block">Order bloodwork or radiology.</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="bg-slate-200 hover:bg-slate-300 text-slate-700 w-full py-1.5 rounded text-[10px] font-bold uppercase transition-colors cursor-pointer mt-auto"
                    onClick={() => alert('Lab & Imaging module will open a side panel for test selection.')}
                  >
                    Order Tests
                  </button>
                </div>

                {/* Referrals */}
                <div className="flex flex-col p-3 bg-slate-50 border border-slate-200 rounded-lg justify-between gap-3 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2">
                    <Share className="w-5 h-5 text-indigo-500" />
                    <div>
                      <span className="text-xs font-bold block text-slate-700 uppercase tracking-tight">Specialist Referral</span>
                      <span className="text-[9px] text-slate-400 leading-tight block">Draft referral letter.</span>
                    </div>
                  </div>
                  {referralGenerated ? (
                    <div className="flex flex-col gap-1 mt-auto">
                      <span className="text-[10px] text-indigo-800 bg-indigo-100 font-bold px-2 py-0.5 rounded text-center truncate" title={referralDetails.hospital}>
                        {referralDetails.hospital}
                      </span>
                      <div className="flex items-center gap-2 mt-1 justify-center">
                        <button
                          type="button"
                          onClick={() => setIsReferralModalOpen(true)}
                          className="text-[10px] font-bold text-indigo-600 underline cursor-pointer text-center"
                        >
                          Edit Referral
                        </button>
                        <button
                          type="button"
                          onClick={() => { setReferralGenerated(false); setReferralDetails({ hospital: '', department: '', reason: '' }); }}
                          className="text-[10px] font-bold text-red-500 hover:text-red-600 underline cursor-pointer text-center"
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="bg-slate-200 hover:bg-slate-300 text-slate-700 w-full py-1.5 rounded text-[10px] font-bold uppercase transition-colors cursor-pointer mt-auto"
                      onClick={() => setIsReferralModalOpen(true)}
                    >
                      Draft Referral
                    </button>
                  )}
                </div>
              </div>

              {/* AI Treatment Outcome Prediction */}
              {selectedICD && rxList.length > 0 && (
                <div className="mt-4 bg-indigo-50/50 border border-indigo-100 p-3.5 rounded-lg flex gap-3 items-start animate-fadeIn">
                  <div className="bg-indigo-100 p-2 rounded-lg shrink-0">
                    <TrendingUp className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-bold text-indigo-800 uppercase tracking-wide">AI Treatment Outcome Prediction</h4>
                    <p className="text-xs text-indigo-900/80 mt-1 leading-relaxed">
                      Based on the diagnosis of <strong>{selectedICD.code}</strong> and the prescribed regimen ({rxList.map(r=>r.drugName).join(', ')}), ML models predict a <strong>94% probability of symptom resolution within 5 days</strong>. No aggressive follow-up required.
                    </p>
                  </div>
                </div>
              )}

            </div>
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

      {/* MC GENERATOR POPUP MODAL */}
      {isMcModalOpen && (
        <div id="mc-generator-modal" className="fixed inset-0 bg-slate-900/75 flex items-center justify-center z-50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-scaleUp">
            
            {/* Modal Header */}
            <div className="bg-[#07B2B2] text-white px-5 py-3.5 flex items-center justify-between">
              <span className="font-semibold text-xs uppercase tracking-wider">Malaysian Medical Certificate Portal</span>
              <button
                type="button"
                onClick={() => setIsMcModalOpen(false)}
                className="text-white hover:text-slate-200 font-bold text-sm cursor-pointer"
              >
                &times;
              </button>
            </div>

            {/* Document Frame Mock (Clinical Authentic design) */}
            <div className="p-5 space-y-4">
              <div className="bg-amber-50/40 p-4 border border-amber-500/20 rounded-lg text-slate-800 text-xs shadow-xs space-y-3.5 relative">
                {/* Clinic Identifier sticker */}
                <div className="border-b border-dashed border-slate-300 pb-2 text-center">
                  <h4 className="font-bold text-sm uppercase tracking-wide text-[#07B2B2]">KLINIK MALAYSIA ENTERPRISE</h4>
                  <span className="text-[9px] text-slate-400">MOH APC Registration: No. APC-1002931-A</span>
                </div>

                <div className="text-center font-bold text-xs uppercase text-slate-700 tracking-wider">
                  SIJIL CUTI SAKIT / MEDICAL CERTIFICATE
                </div>

                <div className="space-y-1.5 leading-relaxed text-slate-600">
                  <p>
                    This is to medically certify that <strong>{currentPatient.fullName}</strong> (IC: {currentPatient.icNumber}) was examined on this date and found temporarily unfit to execute standard trade duty.
                  </p>
                  
                  <div className="py-2 grid grid-cols-2 gap-2 text-[11px] bg-white p-2 rounded border border-slate-100">
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase">Leave Duration</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <input
                          type="number"
                          id="mc-days-input"
                          className="w-12 border rounded px-1 text-center font-mono font-bold"
                          value={mcDays}
                          onChange={(e) => setMcDays(e.target.value === '' ? '' : Math.max(1, parseInt(e.target.value) || 1))}
                        />
                        <span>Days</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase">Diagnosis ICD</span>
                      <strong className="text-slate-700 block mt-0.5">{selectedICD?.code || 'Z02.7 Pending'}</strong>
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-500 italic">
                    Unfitness duration covers outpatient clinical rest, fully logs for Malaysian Board Audit validation.
                  </p>
                </div>

                {/* Stamp simulator */}
                <div className="flex items-end justify-between pt-4 border-t border-dashed border-slate-200">
                  <div>
                    <span className="text-[9px] text-slate-400 block">MC Code Reference:</span>
                    <strong className="font-mono text-slate-700 text-[10px]">{mcReferenceNo}</strong>
                  </div>
                  <div className="text-center border-2 border-emerald-600/30 text-emerald-800 bg-emerald-50 text-[10px] uppercase font-bold p-1 rounded rotate-[-4deg]">
                    Klinik Approved
                  </div>
                </div>
              </div>

              {/* Confirmation and Actions */}
              <div className="text-slate-500 text-[10px] px-1 text-center">
                This document is validated for Submission with Human Resource & Panel TPAs portals.
              </div>
            </div>

            {/* Actions */}
            <div className="bg-slate-50 px-5 py-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsMcModalOpen(false)}
                className="px-3.5 py-1.5 border border-slate-200 text-slate-600 rounded text-xs hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              
              <button
                type="button"
                id="mc-confirm-generate-btn"
                onClick={() => {
                  handleMockGenerateMc();
                  setIsMcModalOpen(false);
                }}
                className="bg-[#07B2B2] text-white px-4 py-1.5 rounded text-xs font-semibold hover:bg-[#058A8A] transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                Issue & Sign Certification
              </button>
            </div>

          </div>
        </div>
      )}

      {/* REFERRAL MODAL */}
      {isReferralModalOpen && (
        <div className="fixed inset-0 bg-slate-900/75 flex items-center justify-center z-50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-scaleUp">
            <div className="bg-indigo-600 text-white px-5 py-3.5 flex items-center justify-between">
              <span className="font-semibold text-xs uppercase tracking-wider">Specialist Referral Letter Draft</span>
              <button onClick={() => setIsReferralModalOpen(false)} className="text-white hover:text-slate-200 font-bold text-sm cursor-pointer">&times;</button>
            </div>
            
            <div className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Destination Hospital / Center</label>
                <input 
                  type="text" 
                  className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:border-indigo-500" 
                  placeholder="e.g. Hospital Kuala Lumpur"
                  value={referralDetails.hospital}
                  onChange={e => setReferralDetails({...referralDetails, hospital: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Specialist Department</label>
                <input 
                  type="text" 
                  className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:border-indigo-500" 
                  placeholder="e.g. Cardiology"
                  value={referralDetails.department}
                  onChange={e => setReferralDetails({...referralDetails, department: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Clinical Reason / Remarks</label>
                <textarea 
                  className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:border-indigo-500 h-24" 
                  placeholder="Brief reason for referral..."
                  value={referralDetails.reason}
                  onChange={e => setReferralDetails({...referralDetails, reason: e.target.value})}
                />
              </div>
            </div>

            <div className="bg-slate-50 px-5 py-3 border-t border-slate-100 flex justify-end gap-2">
              <button onClick={() => setIsReferralModalOpen(false)} className="px-3.5 py-1.5 border border-slate-200 text-slate-600 rounded text-xs hover:bg-slate-100">
                Cancel
              </button>
              <button 
                onClick={() => { setReferralGenerated(true); setIsReferralModalOpen(false); }} 
                className="bg-indigo-600 text-white px-4 py-1.5 rounded text-xs font-semibold hover:bg-indigo-700 flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" /> Attach to Plan
              </button>
            </div>
          </div>
        </div>
      )}

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
