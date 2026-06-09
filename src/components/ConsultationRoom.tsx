import React, { useState, useEffect } from 'react';
import { 
  Patient, Visit, ICD10Code, PrescriptionItem, Language 
} from '../types';
import { 
  DRUG_CATALOG, ICD10_CATALOG, PREVIOUS_VISITS, TRANSLATIONS 
} from '../data';
import { 
  History, Stethoscope, Activity, ClipboardList, Pill, Plus, Trash2, 
  AlertTriangle, Check, FileText, Printer, Clock, Heart, Thermometer, Info, ChevronRight, UserMinus
} from 'lucide-react';

interface ConsultationRoomProps {
  currentPatient: Patient | null;
  activeLanguage: Language;
  onConsultationComplete: (soapData: any, issueMc: boolean, mcDuration: number) => void;
  onCancel: () => void;
}

export default function ConsultationRoom({
  currentPatient,
  activeLanguage,
  onConsultationComplete,
  onCancel
}: ConsultationRoomProps) {
  // Translate labels
  const t = TRANSLATIONS[activeLanguage];

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

  // MC Generator
  const [isMcModalOpen, setIsMcModalOpen] = useState(false);
  const [mcDays, setMcDays] = useState(1);
  const [mcReferenceNo, setMcReferenceNo] = useState('');
  const [mcGenerated, setMcGenerated] = useState(false);

  // Populate longitudinal history for active patient
  const patientPastVisits = PREVIOUS_VISITS.filter(v => v.patientId === currentPatient?.id);

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
    } else {
      const query = searchICDQuery.toLowerCase();
      const filtered = ICD10_CATALOG.filter(
        i => i.code.toLowerCase().includes(query) || i.desc.toLowerCase().includes(query)
      );
      setIcdSuggestions(filtered);
    }
  }, [searchICDQuery]);

  // Filter Drug Suggestions
  useEffect(() => {
    if (searchDrugQuery.trim() === '') {
      setDrugSuggestions([]);
    } else {
      const query = searchDrugQuery.toLowerCase();
      const filtered = DRUG_CATALOG.filter(
        d => d.name.toLowerCase().includes(query) || d.category.toLowerCase().includes(query)
      );
      setDrugSuggestions(filtered);
    }
  }, [searchDrugQuery]);

  // Check Allergies whenever RX list updates
  useEffect(() => {
    if (!currentPatient) return;
    const alerts: { drugName: string; allergyGroup: string }[] = [];
    
    rxList.forEach(rx => {
      // Find matching drug in catalog to inspect its allergyGroup
      const catalogDrug = DRUG_CATALOG.find(d => d.name === rx.drugName);
      if (catalogDrug && catalogDrug.allergyGroup !== 'None') {
        // Is the patient allergic to this group?
        const isAllergic = currentPatient.drugAllergies.some(
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
  }, [rxList, currentPatient]);

  if (!currentPatient) {
    return (
      <div className="bg-white p-12 text-center rounded-xl border border-slate-200">
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
      expiryDate: new Date(Date.now() + catalogDrug.expiryMonths * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
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
        mcDays: mcGenerated ? mcDays : 0,
        requiresReferral: false
      }
    };

    onConsultationComplete(soapData, mcGenerated, mcDays);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch min-h-[500px]">
      
      {/* LEFT COLUMN: Patient Profile Brief & Longitudinal History (35%) */}
      <div className="lg:col-span-4 bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col space-y-4">
        
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
      <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
        
        <div>
          {/* Section banner name */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <h3 className="text-[#07B2B2] font-bold text-sm tracking-tight flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-emerald-600" />
              {t.consultationRoom}
            </h3>
            <span className="text-[11px] bg-sky-50 text-sky-800 border border-sky-200 px-2.5 py-0.5 rounded font-mono">
              ICD-10 Diagnostic Class Enabled
            </span>
          </div>

          {/* SOAP Tabs Navigation */}
          <div className="flex border-b border-slate-200 mb-4 bg-slate-50 p-1.5 rounded-lg gap-1">
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

          {/* TAB 1: SUBJECTIVE FIELD */}
          {activeTab === 'subjective' && (
            <div className="space-y-3.5 animate-fadeIn">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-tight mb-1">
                  {t.symptomsNotes}
                </label>
                <textarea
                  id="soap-subjective-input"
                  className="w-full text-xs min-h-[140px] px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-cyan-600 focus:outline-none"
                  value={subjective}
                  onChange={(e) => setSubjective(e.target.value)}
                  placeholder="Record symptoms, clinical history, patient complaints, pain scale (0-10), onset duration..."
                />
              </div>

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

          {/* TAB 2: OBJECTIVE FIELDS (Vitals table with helper alert tags) */}
          {activeTab === 'objective' && (
            <div className="space-y-4 animate-fadeIn">
              <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wide">
                Patient Clinician Vital Signs Sign-off
              </h4>

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

              {/* Digital Vitals status panel */}
              <div className="p-2.5 bg-cyan-50/40 rounded-lg text-slate-700 text-xs flex items-center justify-between">
                <span className="font-mono text-[10px] text-slate-500 uppercase">Interactive Vitals Checksum</span>
                <span className="font-semibold text-cyan-800">
                  {vitals.temperature >= 37.5 ? 'Patient is febrile' : 'Hemodynamically Stable'}
                </span>
              </div>
            </div>
          )}

          {/* TAB 3: ASSESSMENT FIELD (ICD-10 search tool index) */}
          {activeTab === 'assessment' && (
            <div className="space-y-4 animate-fadeIn">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-tight mb-1">
                  {t.icd10Search} <span className="text-red-500">*</span>
                </label>
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
                  className="w-full text-xs min-h-[80px] px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-cyan-600 focus:outline-none"
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                  placeholder="Enter medical assessment summary, specialist reports references, follow-up parameters, or procedural logs..."
                />
              </div>
            </div>
          )}

          {/* TAB 4: PLAN (Prescriptions builder, allergy integration verification flags) */}
          {activeTab === 'plan' && (
            <div className="space-y-4 animate-fadeIn">
              
              {/* Allergy alerts flags overlay */}
              {allergyAlerts.length > 0 && (
                <div id="allergy-alert-banner" className="bg-red-50 border border-red-200 p-3 rounded-lg text-red-800 text-xs space-y-1 animate-pulse">
                  <span className="font-bold uppercase tracking-wide flex items-center gap-1 text-red-700">
                    <AlertTriangle className="w-4 h-4 animate-bounce" />
                    {t.interactionAlert}
                  </span>
                  <div className="pl-5 space-y-1 text-[11px] text-slate-700">
                    {allergyAlerts.map((alert, idx) => (
                      <p key={idx}>
                        • Medication <strong>{alert.drugName}</strong> falls under the <strong>{alert.allergyGroup}</strong> group which conflicts with patient allergies.
                      </p>
                    ))}
                    <p className="text-[10px] font-bold text-red-800 uppercase mt-1">
                      ⚠️ CLINICIAN ALERT: Verify or override with caution under clinical responsibility.
                    </p>
                  </div>
                </div>
              )}

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
                        const isConflict = currentPatient.drugAllergies.some(
                          a => a.toLowerCase() === item.allergyGroup.toLowerCase() ||
                               item.allergyGroup.toLowerCase().includes(a.toLowerCase())
                        );
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
                              <span className="font-mono text-[#07B2B2] font-bold">RM{item.pricePerUnit.toFixed(2)}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Currently Selected Prescription list */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
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
                        const catalogDrugDef = DRUG_CATALOG.find(d => d.name === rx.drugName);
                        const hasConflict = catalogDrugDef && catalogDrugDef.allergyGroup !== 'None' && 
                          currentPatient.drugAllergies.some(a => a.toLowerCase() === catalogDrugDef.allergyGroup.toLowerCase());
                        
                        return (
                          <tr key={rx.id} className={`border-b text-xs border-slate-100 ${hasConflict ? 'bg-red-50/40' : ''}`}>
                            <td className="px-3 py-2.5">
                              <span className="font-semibold text-slate-800 block">{rx.drugName}</span>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                {/* Vector pill icon */}
                                <span 
                                  className="w-2.5 h-2.5 rounded-full inline-block border border-slate-300"
                                  style={{ backgroundColor: rx.pillColor }}
                                />
                                <span className="text-[10px] text-slate-400">Batch Expiry: {rx.expiryDate}</span>
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
                              RM{(rx.pricePerUnit * rx.quantity).toFixed(2)}
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

              {/* Digital MC Certification trigger button */}
              <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#07B2B2]" />
                  <div>
                    <span className="text-xs font-semibold block text-slate-700">Medical Certificate (MC) Module</span>
                    <span className="text-[10px] text-slate-400">Issue paid clinic recovery leave.</span>
                  </div>
                </div>

                {mcGenerated ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-cyan-800 bg-cyan-100 font-semibold px-2 py-0.5 rounded">
                      {mcDays} Days Issued ({selectedICD?.code || 'Diagnose'})
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsMcModalOpen(true)}
                      className="text-xs text-[#07B2B2] underline cursor-pointer"
                    >
                      View Cert
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={triggerMcOpening}
                    className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer"
                  >
                    Generate MC
                  </button>
                )}
              </div>

            </div>
          )}
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
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-scaleUp">
            
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
                          onChange={(e) => setMcDays(Math.max(1, parseInt(e.target.value) || 1))}
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

    </div>
  );
}
