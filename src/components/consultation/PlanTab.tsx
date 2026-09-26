import React, { useState, useMemo } from 'react';
import { 
  AlertTriangle, CheckCircle2, Activity, Pill, Trash2, FileText, 
  TestTube, Share, TrendingUp, PlusCircle, X, Info, ShieldAlert,
  FileCheck, Microscope, Sparkles
} from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { Patient, PrescriptionItem, ICD10Code } from '../../types';
import { useInventory } from '../../context/InventoryContext';
import { useAuth } from '../../context/AuthContext';
import { DRUG_DATABASE } from '../../data';

interface PlanTabProps {
  rxList: PrescriptionItem[];
  setRxList: React.Dispatch<React.SetStateAction<PrescriptionItem[]>>;
  currentPatient: Patient;
  selectedICD: ICD10Code | null;
  mcDays: number | '';
  setMcDays: React.Dispatch<React.SetStateAction<number | ''>>;
  mcGenerated: boolean;
  setMcGenerated: React.Dispatch<React.SetStateAction<boolean>>;
  pharmacyMemo: string;
  setPharmacyMemo: React.Dispatch<React.SetStateAction<string>>;
  referralDetails: { hospital: string; department: string; reason: string; };
  setReferralDetails: React.Dispatch<React.SetStateAction<{ hospital: string; department: string; reason: string; }>>;
  referralGenerated: boolean;
  setReferralGenerated: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function PlanTab({
  rxList,
  setRxList,
  currentPatient,
  selectedICD,
  mcDays,
  setMcDays,
  mcGenerated,
  setMcGenerated,
  pharmacyMemo,
  setPharmacyMemo,
  referralDetails,
  setReferralDetails,
  referralGenerated,
  setReferralGenerated
}: PlanTabProps) {
  const { showPII } = useAuth();
  const { inventory } = useInventory();

  // Active Sub-Tab State
  const [subTab, setSubTab] = useState<'medication' | 'investigations' | 'documents' | 'summary'>('medication');

  // Patient Age Context
  const patientAge = useMemo(() => {
    if (!currentPatient?.dob) return 36;
    const birthYear = new Date(currentPatient.dob).getFullYear();
    const currentYear = new Date().getFullYear();
    return currentYear - birthYear;
  }, [currentPatient]);

  const isPediatricPatient = patientAge < 12;
  const [showPediatricCalc, setShowPediatricCalc] = useState(isPediatricPatient);
  
  // Local State for Pediatric Calculator
  const [patientWeight, setPatientWeight] = useState('');
  const [medConcentration, setMedConcentration] = useState('24'); // Default 120mg/5ml (24mg/ml)
  const [calculatedDose, setCalculatedDose] = useState<number | null>(null);
  
  const [searchDrugQuery, setSearchDrugQuery] = useState('');

  // Diagnostic Investigations State
  const [selectedLabs, setSelectedLabs] = useState<string[]>([
    'Full Blood Count (FBC)',
    'Renal Function Test (RFT)'
  ]);
  const [labReason, setLabReason] = useState('');

  // Document Modal States
  const [isMcModalOpen, setIsMcModalOpen] = useState(false);
  const [mcReason, setMcReason] = useState('Acute Upper Respiratory Tract Infection');
  const [isReferralModalOpen, setIsReferralModalOpen] = useState(false);

  // Interruptive Allergy Override State
  const [pendingAllergyDrug, setPendingAllergyDrug] = useState<any | null>(null);
  const [overrideRationale, setOverrideRationale] = useState('');

  // Unified Drug Catalog
  const mergedCatalog = useMemo(() => {
    const combined = [...inventory];
    DRUG_DATABASE.forEach(dbDrug => {
      if (!combined.some(c => c.name.toLowerCase() === dbDrug.name.toLowerCase())) {
        combined.push({
          id: dbDrug.id,
          name: dbDrug.name,
          category: dbDrug.category,
          allergyGroup: dbDrug.allergyGroup,
          dosageEN: dbDrug.dosageEN,
          dosageBM: dbDrug.dosageBM,
          frequency: dbDrug.frequency,
          pricePerUnit: dbDrug.pricePerUnit,
          currentStock: dbDrug.currentStock,
          expiryMonths: dbDrug.expiryMonths,
          pillColor: dbDrug.pillColor,
          capsuleStyle: dbDrug.capsuleStyle
        } as any);
      }
    });
    return combined;
  }, [inventory]);

  // Brand Name / Trade Name Alias Map
  const brandAliasMap: Record<string, string[]> = {
    'panadol': ['paracetamol', 'analgesic', 'fever', 'pain'],
    'augmentin': ['amoxicillin', 'clavulanate', 'penicillin'],
    'ponstan': ['mefenamic', 'nsaid', 'pain'],
    'voltaren': ['diclofenac', 'nsaid', 'pain'],
    'synflex': ['naproxen', 'nsaid'],
    'zyrtec': ['cetirizine', 'antihistamine', 'allergy'],
    'piriton': ['chlorpheniramine', 'antihistamine'],
    'actifed': ['pseudoephedrine', 'triprolidine', 'decongestant'],
    'ventolin': ['salbutamol', 'inhaler', 'asthma'],
    'brufen': ['ibuprofen', 'nsaid'],
    'nurofen': ['ibuprofen', 'nsaid'],
    'gaviscon': ['antacid', 'reflux', 'gastritis'],
    'glucophage': ['metformin', 'diabetes'],
    'norvasc': ['amlodipine', 'hypertension'],
    'lipitor': ['atorvastatin', 'cholesterol']
  };

  // Available Lab Tests Catalog
  const availableLabTests = [
    { id: 'fbc', name: 'Full Blood Count (FBC)', category: 'Hematology', estTime: '2 hrs' },
    { id: 'rft', name: 'Renal Function Test (RFT)', category: 'Biochemistry', estTime: '3 hrs' },
    { id: 'lft', name: 'Liver Function Test (LFT)', category: 'Biochemistry', estTime: '3 hrs' },
    { id: 'fbg', name: 'Fasting Blood Glucose & Lipid Profile', category: 'Metabolic', estTime: '4 hrs' },
    { id: 'ecg', name: '12-Lead Electrocardiogram (ECG)', category: 'Diagnostics', estTime: 'Immediate' },
    { id: 'urine', name: 'Urine FEME & Microalbumin', category: 'Urinalysis', estTime: '1 hr' },
    { id: 'cxr', name: 'Chest X-Ray (PA View)', category: 'Radiology', estTime: 'Immediate' },
  ];

  // Recalculate pediatric dose on input change
  useMemo(() => {
    const w = parseFloat(patientWeight);
    const conc = parseFloat(medConcentration);
    if (!isNaN(w) && w > 0 && !isNaN(conc) && conc > 0) {
      const requiredMg = w * 15; // Standard paracetamol 15mg/kg
      const requiredMl = requiredMg / conc;
      setCalculatedDose(requiredMl);
    } else {
      setCalculatedDose(null);
    }
  }, [patientWeight, medConcentration]);

  // Drug Suggestions Filter
  const drugSuggestions = useMemo(() => {
    const q = searchDrugQuery.trim().toLowerCase();
    if (!q) return [];
    
    let aliases: string[] = [];
    Object.keys(brandAliasMap).forEach(brand => {
      if (brand.includes(q) || q.includes(brand)) {
        aliases = [...aliases, ...brandAliasMap[brand]];
      }
    });

    return mergedCatalog.filter(drug => {
      const nameLower = drug.name.toLowerCase();
      const catLower = (drug.category || '').toLowerCase();
      const grpLower = (drug.allergyGroup || '').toLowerCase();
      
      const directMatch = nameLower.includes(q) || catLower.includes(q) || grpLower.includes(q);
      const aliasMatch = aliases.some(alias => nameLower.includes(alias) || catLower.includes(alias));
      
      return directMatch || aliasMatch;
    }).slice(0, 10);
  }, [searchDrugQuery, mergedCatalog]);

  // Check Patient Allergies Against Selected Prescriptions
  const allergyAlerts = useMemo(() => {
    if (!currentPatient || !currentPatient.drugAllergies || currentPatient.drugAllergies.length === 0) return [];
    const alerts: { drugName: string; allergyGroup: string }[] = [];
    
    rxList.forEach(item => {
      const catalogDrug = mergedCatalog.find(d => d.name.toLowerCase() === item.drugName.toLowerCase());
      const grp = catalogDrug?.allergyGroup;
      if (grp && grp !== 'None') {
        const isAllergic = currentPatient.drugAllergies.some(
          a => a.toLowerCase() === grp.toLowerCase() || grp.toLowerCase().includes(a.toLowerCase())
        );
        if (isAllergic) {
          alerts.push({ drugName: item.drugName, allergyGroup: grp });
        }
      }
    });
    return alerts;
  }, [rxList, currentPatient, mergedCatalog]);

  const handleAddDrug = (drug: any) => {
    if (rxList.some(r => r.drugName.toLowerCase() === drug.name.toLowerCase())) {
      setSearchDrugQuery('');
      return;
    }

    // Safety Contraindication Check against Patient Allergies
    const grp = drug.allergyGroup || '';
    const isAllergic = currentPatient.drugAllergies.some(
      a => (grp && grp !== 'None' && (a.toLowerCase() === grp.toLowerCase() || grp.toLowerCase().includes(a.toLowerCase()))) ||
           drug.name.toLowerCase().includes(a.toLowerCase())
    );

    if (isAllergic) {
      setPendingAllergyDrug(drug);
      return;
    }

    confirmAddDrug(drug, '');
  };

  const confirmAddDrug = (drug: any, rationale: string) => {
    const newRx: PrescriptionItem = {
      id: `rx-${Date.now()}-${Math.random()}`,
      drugName: rationale ? `${drug.name} [OVERRIDDEN: ${rationale}]` : drug.name,
      dosage: drug.dosageEN || 'Take as instructed',
      dosageBM: drug.dosageBM || 'Makan mengikut arahan',
      frequency: drug.frequency || '1 Tab BD',
      quantity: 10,
      pricePerUnit: drug.pricePerUnit || 0.50,
      expiryDate: `${new Date().getFullYear() + 2}-12-31`,
      pillColor: drug.pillColor || '#0d9488',
      capsuleStyle: drug.capsuleStyle || 'solid'
    };
    setRxList([...rxList, newRx]);
    setSearchDrugQuery('');
  };

  const handleAddPediatricSyrup = () => {
    if (!calculatedDose || calculatedDose <= 0) return;
    const doseStr = `${calculatedDose.toFixed(1)} ml TDS (3 times daily) after meals`;
    const doseBMStr = `${calculatedDose.toFixed(1)} ml 3 kali sehari selepas makan`;
    const newRx: PrescriptionItem = {
      id: `rx-peds-${Date.now()}`,
      drugName: `Syrup Paracetamol (${medConcentration === '24' ? '120mg/5ml' : medConcentration === '50' ? '250mg/5ml' : '100mg/ml Infant Drops'})`,
      dosage: doseStr,
      dosageBM: doseBMStr,
      frequency: 'TDS (3x Daily)',
      quantity: 1,
      pricePerUnit: 12.00,
      expiryDate: `${new Date().getFullYear() + 1}-12-31`,
      pillColor: '#f43f5e',
      capsuleStyle: 'solid'
    };
    setRxList([...rxList, newRx]);
  };

  const toggleLabSelection = (testName: string) => {
    if (selectedLabs.includes(testName)) {
      setSelectedLabs(selectedLabs.filter(t => t !== testName));
    } else {
      setSelectedLabs([...selectedLabs, testName]);
    }
  };

  return (
    <div className="space-y-4 animate-fadeIn relative text-[#0f3c4c] dark:text-slate-100">
      
      {/* ------------------------------------------------------------------------- */}
      {/* PERSISTENT AI DRUG INTERACTION SAFETY BANNER                             */}
      {/* ------------------------------------------------------------------------- */}
      {allergyAlerts.length > 0 ? (
        <div className="bg-rose-600 text-white p-3 rounded-none shadow-sm flex items-start gap-3 border border-rose-700">
          <AlertTriangle className="w-5 h-5 shrink-0 text-white mt-0.5" />
          <div>
            <h4 className="font-black text-xs uppercase tracking-wider">AI SAFETY ALERT: Drug Contraindication Conflict Detected!</h4>
            <p className="text-[11px] mt-0.5 opacity-95">Patient registered allergies conflict with active prescription choices.</p>
            <ul className="text-[10px] mt-1 list-disc pl-4 font-mono bg-black/20 p-1.5 rounded-none">
              {allergyAlerts.map((alert, idx) => (
                <li key={idx}><span className="font-bold">{alert.drugName}</span> belongs to <span className="font-bold underline uppercase">{alert.allergyGroup}</span> family.</li>
              ))}
            </ul>
          </div>
        </div>
      ) : rxList.length > 0 ? (
        <div className="bg-[#e0f5f2] dark:bg-[#0c3844] text-[#0f766e] dark:text-[#5eead4] p-2.5 rounded-none border border-[#b2f5ea] dark:border-teal-800/50 flex items-center justify-between text-xs font-bold shadow-2xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#0d9488] dark:text-[#2dd4bf]" />
            <span>AI Interaction Check: Pass (Zero Drug-Allergy Contraindications)</span>
          </div>
          <span className="font-mono text-[10px] bg-white dark:bg-[#07252d] px-2 py-0.5 border border-[#b2f5ea] text-[#0d9488]">
            {rxList.length} Items Prescribed
          </span>
        </div>
      ) : null}

      {/* ------------------------------------------------------------------------- */}
      {/* 4 STRUCTURED SUB-TABS NAVIGATION BAR                                      */}
      {/* ------------------------------------------------------------------------- */}
      <div className="flex border border-[#b2f5ea] dark:border-teal-800/40 bg-[#f7fdfd] dark:bg-[#07252d] p-1 rounded-none gap-1" role="tablist">
        
        <button
          type="button"
          onClick={() => setSubTab('medication')}
          className={`flex-1 py-2 px-3 text-xs font-extrabold flex items-center justify-center gap-1.5 rounded-none transition-all cursor-pointer ${
            subTab === 'medication'
              ? 'bg-[#0d9488] text-white shadow-2xs'
              : 'text-[#0f3c4c] dark:text-slate-300 hover:bg-[#e0f5f2] dark:hover:bg-[#0c3844]'
          }`}
        >
          <Pill className="w-4 h-4" />
          <span>1. Medication Prescribing</span>
          {rxList.length > 0 && <span className="bg-white text-[#0d9488] px-1 font-mono text-[10px] font-black">{rxList.length}</span>}
        </button>

        <button
          type="button"
          onClick={() => setSubTab('investigations')}
          className={`flex-1 py-2 px-3 text-xs font-extrabold flex items-center justify-center gap-1.5 rounded-none transition-all cursor-pointer ${
            subTab === 'investigations'
              ? 'bg-[#0d9488] text-white shadow-2xs'
              : 'text-[#0f3c4c] dark:text-slate-300 hover:bg-[#e0f5f2] dark:hover:bg-[#0c3844]'
          }`}
        >
          <TestTube className="w-4 h-4" />
          <span>2. Lab &amp; Investigations</span>
          {selectedLabs.length > 0 && <span className="bg-[#e0f5f2] text-[#0f766e] px-1 font-mono text-[10px] font-bold">{selectedLabs.length}</span>}
        </button>

        <button
          type="button"
          onClick={() => setSubTab('documents')}
          className={`flex-1 py-2 px-3 text-xs font-extrabold flex items-center justify-center gap-1.5 rounded-none transition-all cursor-pointer ${
            subTab === 'documents'
              ? 'bg-[#0d9488] text-white shadow-2xs'
              : 'text-[#0f3c4c] dark:text-slate-300 hover:bg-[#e0f5f2] dark:hover:bg-[#0c3844]'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>3. Documents &amp; Certificates</span>
          {(mcGenerated || referralGenerated) && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />}
        </button>

        <button
          type="button"
          onClick={() => setSubTab('summary')}
          className={`flex-1 py-2 px-3 text-xs font-extrabold flex items-center justify-center gap-1.5 rounded-none transition-all cursor-pointer ${
            subTab === 'summary'
              ? 'bg-[#0d9488] text-white shadow-2xs'
              : 'text-[#0f3c4c] dark:text-slate-300 hover:bg-[#e0f5f2] dark:hover:bg-[#0c3844]'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          <span>4. Order Summary</span>
        </button>

      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB 1: MEDICATION PRESCRIBING                                         */}
      {/* ========================================================================= */}
      {subTab === 'medication' && (
        <div className="space-y-4 animate-fadeIn">
          
          {/* CONTEXT-AWARE PEDIATRIC DOSAGE CALCULATOR ASSIST */}
          {!showPediatricCalc ? (
            <div className="bg-[#f0fdfa] dark:bg-[#07252d] border border-[#b2f5ea] dark:border-teal-800/40 p-2.5 rounded-none flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#0d9488]" />
                <span className="font-bold">Weight-Based Dosing Assist (Hidden for Adult Patient — Age {patientAge})</span>
              </div>
              <button
                type="button"
                onClick={() => setShowPediatricCalc(true)}
                className="text-[10px] font-bold text-[#0d9488] dark:text-[#2dd4bf] border border-[#b2f5ea] dark:border-teal-800/50 px-2.5 py-1 hover:bg-[#e0f5f2] cursor-pointer"
              >
                + Show Pediatric Dose Assist
              </button>
            </div>
          ) : (
            <div className="bg-[#e0f5f2] dark:bg-[#082830] p-3.5 rounded-none border border-[#b2f5ea] dark:border-teal-800/50 shadow-xs space-y-2.5">
              <div className="flex items-center justify-between border-b border-[#b2f5ea] dark:border-teal-800/40 pb-2">
                <h4 className="text-xs font-black text-[#0f3c4c] dark:text-[#5eead4] uppercase flex items-center gap-1.5 tracking-wider">
                  <Activity className="w-4 h-4 text-[#0d9488] dark:text-[#2dd4bf]" /> Pediatric Weight-Based Dosage Calculator
                </h4>
                <div className="flex items-center gap-2 font-mono text-[10px]">
                  <span className="bg-white dark:bg-[#07252d] text-[#0f766e] dark:text-[#5eead4] px-2 py-0.5 border border-[#b2f5ea]">
                    Triage Recorded Today
                  </span>
                  <span className="bg-white dark:bg-[#07252d] text-[#0f766e] dark:text-[#5eead4] px-2 py-0.5 border border-[#b2f5ea]">
                    Range: 10 - 15 mg/kg
                  </span>
                  <span className="bg-rose-50 text-rose-700 px-2 py-0.5 border border-rose-200 font-bold">
                    Max: 60 mg/kg/day
                  </span>
                  {!isPediatricPatient && (
                    <button type="button" onClick={() => setShowPediatricCalc(false)} className="text-slate-400 hover:text-slate-700 ml-2">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                    Patient Body Weight (kg)
                  </label>
                  <Input 
                    type="number" 
                    className="w-full text-xs px-3 py-1.5 border border-[#b2f5ea] dark:border-teal-800/40 rounded-none focus:ring-2 focus:ring-[#0d9488] outline-none bg-white dark:bg-[#07252d] text-[#0f3c4c] dark:text-white font-bold"
                    value={patientWeight}
                    onChange={e => setPatientWeight(e.target.value)}
                    placeholder="e.g. 12"
                  />
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {['5', '8', '10', '12', '15', '20'].map(w => (
                      <button
                        key={w}
                        type="button"
                        onClick={() => setPatientWeight(w)}
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-none border transition-all ${
                          patientWeight === w 
                            ? 'bg-[#0d9488] text-white border-[#0d9488]' 
                            : 'bg-white dark:bg-[#0e4857] text-[#0f766e] dark:text-[#5eead4] border-[#b2f5ea] dark:border-teal-700/50 hover:bg-[#e0f5f2] cursor-pointer'
                        }`}
                      >
                        {w}kg
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                    Liquid Formulation Concentration
                  </label>
                  <select
                    value={medConcentration}
                    onChange={e => setMedConcentration(e.target.value)}
                    className="w-full text-xs px-3 py-1.5 border border-[#b2f5ea] dark:border-teal-800/40 rounded-none focus:ring-2 focus:ring-[#0d9488] outline-none bg-white dark:bg-[#07252d] text-[#0f3c4c] dark:text-white font-bold"
                  >
                    <option value="24">120mg / 5ml (Standard Syrup)</option>
                    <option value="50">250mg / 5ml (Forte Syrup)</option>
                    <option value="100">100mg / 1ml (Infant Drops)</option>
                  </select>
                </div>

                <div>
                  {calculatedDose ? (
                    <div className="bg-white dark:bg-[#07252d] border border-[#0d9488] p-2 rounded-none text-center">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Recommended Single Dose</span>
                      <span className="text-sm font-mono font-black text-[#0d9488] dark:text-[#2dd4bf]">
                        {calculatedDose.toFixed(1)} ml TDS
                      </span>
                      <button
                        type="button"
                        onClick={handleAddPediatricSyrup}
                        className="mt-1 w-full bg-[#0d9488] hover:bg-[#0f766e] text-white font-bold text-[10px] uppercase py-1 rounded-none transition-colors"
                      >
                        + Add Syrup to Rx List
                      </button>
                      <p className="text-[9px] text-amber-700 dark:text-amber-300 font-bold mt-1.5 leading-tight">
                        ⚠️ Requires clinical verification by attending physician.
                      </p>
                    </div>
                  ) : (
                    <div className="p-2.5 text-center text-slate-400 border border-dashed border-slate-300 dark:border-teal-800/40 text-[11px]">
                      Enter child weight to calculate dose.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* SEARCH DRUG CATALOG */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#0f3c4c] dark:text-[#5eead4] uppercase tracking-tight">
              Prescribe Medication (Trade / Generic / Brand Search) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Input 
                type="text"
                className="w-full text-xs px-3 py-2 border border-[#b2f5ea] dark:border-teal-800/50 rounded-none focus:ring-2 focus:ring-[#0d9488] outline-none bg-white dark:bg-[#07252d] text-[#0f3c4c] dark:text-white font-medium"
                value={searchDrugQuery}
                onChange={e => setSearchDrugQuery(e.target.value)}
                placeholder="Type medication name (e.g. Paracetamol, Panadol, Augmentin, Ponstan, Zyrtec)..."
              />

              {/* AUTOCOMPLETE DROPDOWN */}
              {drugSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-30 bg-white dark:bg-[#07252d] border-2 border-[#0d9488] shadow-xl max-h-60 overflow-y-auto rounded-none mt-1">
                  {drugSuggestions.map(drug => (
                    <div
                      key={drug.id}
                      onClick={() => handleAddDrug(drug)}
                      className="p-2.5 border-b border-slate-100 dark:border-teal-800/30 hover:bg-[#f0fdfa] dark:hover:bg-[#0c3844] cursor-pointer flex items-center justify-between text-xs transition-colors"
                    >
                      <div>
                        <strong className="text-[#0f3c4c] dark:text-[#5eead4] font-bold block">{drug.name}</strong>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                          Category: {drug.category} | Class: {drug.allergyGroup || 'General'}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-[#0d9488] dark:text-[#2dd4bf] block">
                          RM {(drug.pricePerUnit || 0.5).toFixed(2)}
                        </span>
                        <span className="text-[10px] text-slate-400">Stock: {drug.currentStock || 100}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* PRESCRIPTION LIST TABLE */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-[#0f3c4c] dark:text-[#5eead4] uppercase tracking-wider flex items-center justify-between">
              <span>Active Prescription Items ({rxList.length})</span>
              {rxList.length > 0 && (
                <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px] font-normal">
                  Subtotal: RM {(rxList.reduce((acc, r) => acc + ((r.pricePerUnit || 0.5) * (r.quantity || 1)), 0)).toFixed(2)}
                </span>
              )}
            </h4>

            {rxList.length === 0 ? (
              <div className="p-6 text-center bg-slate-50 dark:bg-[#082830] border border-dashed border-slate-300 dark:border-teal-800/40 text-slate-400 text-xs">
                <Pill className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <span>No medication items added. Search above to add items to prescription plan.</span>
              </div>
            ) : (
              <div className="border border-[#b2f5ea] dark:border-teal-800/40 overflow-hidden rounded-none">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-[#e0f5f2] dark:bg-[#07252d] text-[#0f3c4c] dark:text-[#5eead4] font-bold border-b border-[#b2f5ea] dark:border-teal-800/40">
                    <tr>
                      <th className="p-2">Medication</th>
                      <th className="p-2">Dosage / Instructions</th>
                      <th className="p-2">Frequency</th>
                      <th className="p-2">Qty</th>
                      <th className="p-2 text-right font-mono">Price</th>
                      <th className="p-2 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-teal-800/30 bg-white dark:bg-[#082830]">
                    {rxList.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-[#0c3844] transition-colors">
                        <td className="p-2 font-bold text-[#0f3c4c] dark:text-white">
                          {item.drugName}
                        </td>
                        <td className="p-2 text-slate-600 dark:text-slate-300">
                          {item.dosage}
                        </td>
                        <td className="p-2 text-slate-600 dark:text-slate-300 font-mono">
                          {item.frequency}
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={e => {
                              const val = parseInt(e.target.value) || 1;
                              setRxList(rxList.map(r => r.id === item.id ? { ...r, quantity: val } : r));
                            }}
                            className="w-14 px-2 py-0.5 border border-slate-300 dark:border-teal-800/40 rounded-none text-xs text-center font-bold"
                          />
                        </td>
                        <td className="p-2 text-right font-mono text-slate-500 dark:text-slate-400">
                          RM {((item.pricePerUnit || 0.5) * (item.quantity || 1)).toFixed(2)}
                        </td>
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => setRxList(rxList.filter(r => r.id !== item.id))}
                            className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                            title="Remove Item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* DISPENSING PHARMACY MEMO */}
          <div>
            <label className="block text-xs font-bold text-[#0f3c4c] dark:text-[#5eead4] uppercase mb-1">
              Internal Pharmacy Memo / Notes for Dispensing Pharmacist
            </label>
            <Input 
              type="text"
              className="w-full text-xs px-3 py-2 border border-[#b2f5ea] dark:border-teal-800/40 rounded-none bg-white dark:bg-[#07252d] text-[#0f3c4c] dark:text-white"
              value={pharmacyMemo}
              onChange={e => setPharmacyMemo(e.target.value)}
              placeholder="e.g. Split tablets into half doses, patient requested original trade pack..."
            />
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: DIAGNOSTIC INVESTIGATIONS (LAB / IMAGING ORDERS)              */}
      {/* ========================================================================= */}
      {subTab === 'investigations' && (
        <div className="space-y-4 animate-fadeIn">
          
          <div className="bg-[#f0fdfa] dark:bg-[#07252d] border border-[#b2f5ea] dark:border-teal-800/40 p-3 rounded-none flex items-center justify-between">
            <div>
              <h4 className="text-xs font-black uppercase text-[#0f3c4c] dark:text-[#5eead4] flex items-center gap-1.5">
                <Microscope className="w-4 h-4 text-[#0d9488]" /> Diagnostic Lab &amp; Imaging Requisition
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Select laboratory investigations to order for this clinical encounter.</p>
            </div>
            <span className="text-xs font-mono font-bold text-[#0d9488] bg-white dark:bg-[#082830] px-2.5 py-1 border border-[#b2f5ea]">
              {selectedLabs.length} Tests Selected
            </span>
          </div>

          {/* LAB SELECTION GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {availableLabTests.map(test => {
              const isSelected = selectedLabs.includes(test.name);
              return (
                <div
                  key={test.id}
                  onClick={() => toggleLabSelection(test.name)}
                  className={`p-3 border rounded-none cursor-pointer transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-[#e0f5f2] dark:bg-[#0c3844] border-[#0d9488] text-[#0f3c4c] dark:text-white shadow-2xs font-bold'
                      : 'bg-white dark:bg-[#07252d] border-slate-200 dark:border-teal-800/40 text-slate-700 dark:text-slate-300 hover:border-[#b2f5ea]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <input 
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}} // Handled by parent div
                      className="w-4 h-4 text-[#0d9488] rounded-none focus:ring-0 cursor-pointer"
                    />
                    <div>
                      <strong className="text-xs block">{test.name}</strong>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                        Category: {test.category} | TAT: {test.estTime}
                      </span>
                    </div>
                  </div>
                  {isSelected && <CheckCircle2 className="w-4 h-4 text-[#0d9488] shrink-0" />}
                </div>
              );
            })}
          </div>

          {/* CLINICAL INDICATIONS / NOTES FOR LAB */}
          <div>
            <label className="block text-xs font-bold text-[#0f3c4c] dark:text-[#5eead4] uppercase mb-1">
              Clinical Rationale &amp; Indications for Investigations
            </label>
            <Input 
              type="text"
              className="w-full text-xs px-3 py-2 border border-[#b2f5ea] dark:border-teal-800/40 rounded-none bg-white dark:bg-[#07252d] text-[#0f3c4c] dark:text-white"
              value={labReason}
              onChange={e => setLabReason(e.target.value)}
              placeholder="e.g. Evaluate fever origin, rule out urinary tract infection..."
            />
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 3: DOCUMENTS & CERTIFICATES (MC & REFERRAL)                       */}
      {/* ========================================================================= */}
      {subTab === 'documents' && (
        <div className="space-y-4 animate-fadeIn">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* MEDICAL CERTIFICATE ISSUANCE CARD */}
            <div className="border border-[#b2f5ea] dark:border-teal-800/40 bg-white dark:bg-[#07252d] p-4 rounded-none space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-teal-800/30 pb-2">
                <h4 className="text-xs font-black text-[#0f3c4c] dark:text-[#5eead4] uppercase flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#0d9488]" /> Digital Medical Certificate (MC)
                </h4>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-none border ${
                  mcGenerated ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-slate-100 text-slate-500 border-slate-200'
                }`}>
                  {mcGenerated ? 'ISSUED' : 'NOT ISSUED'}
                </span>
              </div>

              <div className="space-y-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Duration (Days)</label>
                  <Input 
                    type="number"
                    min="1"
                    max="14"
                    value={mcDays}
                    onChange={e => setMcDays(parseInt(e.target.value) || 1)}
                    className="w-full text-xs p-2 border border-slate-300 rounded-none font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Clinical Diagnosis / Reason</label>
                  <Input 
                    type="text"
                    value={mcReason}
                    onChange={e => setMcReason(e.target.value)}
                    className="w-full text-xs p-2 border border-slate-300 rounded-none"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => setMcGenerated(true)}
                className={`w-full py-2 text-xs font-extrabold uppercase rounded-none border transition-colors cursor-pointer ${
                  mcGenerated
                    ? 'bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700'
                    : 'bg-[#0d9488] text-white border-[#0f766e] hover:bg-[#0f766e]'
                }`}
              >
                {mcGenerated ? '✓ Medical Certificate (MC) Created & Attached' : 'Create medical certificate'}
              </button>
            </div>

            {/* SPECIALIST REFERRAL LETTER CARD */}
            <div className="border border-[#b2f5ea] dark:border-teal-800/40 bg-white dark:bg-[#07252d] p-4 rounded-none space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-teal-800/30 pb-2">
                <h4 className="text-xs font-black text-[#0f3c4c] dark:text-[#5eead4] uppercase flex items-center gap-2">
                  <Share className="w-4 h-4 text-[#0d9488]" /> Specialist Referral Note
                </h4>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-none border ${
                  referralGenerated ? 'bg-indigo-50 text-indigo-700 border-indigo-300' : 'bg-slate-100 text-slate-500 border-slate-200'
                }`}>
                  {referralGenerated ? 'ATTACHED' : 'NONE'}
                </span>
              </div>

              <div className="space-y-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Target Hospital / Clinic</label>
                  <Input 
                    type="text"
                    value={referralDetails.hospital}
                    onChange={e => setReferralDetails({ ...referralDetails, hospital: e.target.value })}
                    placeholder="e.g. Hospital Kuala Lumpur / Pantai Hospital"
                    className="w-full text-xs p-2 border border-slate-300 rounded-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Specialty Department</label>
                  <Input 
                    type="text"
                    value={referralDetails.department}
                    onChange={e => setReferralDetails({ ...referralDetails, department: e.target.value })}
                    placeholder="e.g. ENT / General Medicine / Cardiology"
                    className="w-full text-xs p-2 border border-slate-300 rounded-none"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => setReferralGenerated(true)}
                className={`w-full py-2 text-xs font-extrabold uppercase rounded-none border transition-colors cursor-pointer ${
                  referralGenerated
                    ? 'bg-indigo-600 text-white border-indigo-700 hover:bg-indigo-700'
                    : 'bg-white dark:bg-[#07252d] text-[#0f3c4c] dark:text-slate-200 border-[#b2f5ea] dark:border-teal-800/40 hover:bg-[#e0f5f2]'
                }`}
              >
                {referralGenerated ? '✓ Specialist Referral Created & Attached' : 'Create referral draft'}
              </button>
            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 4: PRESCRIPTION & ORDER SUMMARY                                   */}
      {/* ========================================================================= */}
      {subTab === 'summary' && (
        <div className="space-y-4 animate-fadeIn">
          
          <div className="border border-[#b2f5ea] dark:border-teal-800/40 bg-[#f7fdfd] dark:bg-[#07252d] p-4 rounded-none space-y-3">
            <h4 className="text-xs font-black text-[#0f3c4c] dark:text-[#5eead4] uppercase flex items-center justify-between border-b border-[#b2f5ea] pb-2">
              <span>Full Order &amp; Plan Verification Summary</span>
              <span className="font-mono text-emerald-600 font-bold">Ready for Final Sign-Off</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              
              {/* Prescribed Drugs List Summary */}
              <div className="bg-white dark:bg-[#082830] p-3 border border-slate-200 dark:border-teal-800/40 rounded-none">
                <span className="font-extrabold text-[11px] text-[#0f3c4c] dark:text-[#5eead4] uppercase block mb-1.5">
                  1. Prescribed Medications ({rxList.length})
                </span>
                {rxList.length === 0 ? (
                  <p className="text-slate-400 text-[11px] italic">No medications prescribed.</p>
                ) : (
                  <ul className="space-y-1 font-mono text-[11px]">
                    {rxList.map(r => (
                      <li key={r.id} className="flex justify-between border-b border-slate-100 dark:border-teal-800/20 py-0.5">
                        <span>{r.drugName} ({r.dosage})</span>
                        <span className="font-bold">x{r.quantity}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Lab Requisitions Summary */}
              <div className="bg-white dark:bg-[#082830] p-3 border border-slate-200 dark:border-teal-800/40 rounded-none">
                <span className="font-extrabold text-[11px] text-[#0f3c4c] dark:text-[#5eead4] uppercase block mb-1.5">
                  2. Diagnostic Investigations ({selectedLabs.length})
                </span>
                {selectedLabs.length === 0 ? (
                  <p className="text-slate-400 text-[11px] italic">No lab tests ordered.</p>
                ) : (
                  <ul className="space-y-1 text-[11px] font-mono">
                    {selectedLabs.map((lab, i) => (
                      <li key={i} className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                        <span className="w-1.5 h-1.5 bg-[#0d9488] rounded-full"></span>
                        <span>{lab}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Certificates & Notes Summary */}
              <div className="bg-white dark:bg-[#082830] p-3 border border-slate-200 dark:border-teal-800/40 rounded-none">
                <span className="font-extrabold text-[11px] text-[#0f3c4c] dark:text-[#5eead4] uppercase block mb-1.5">
                  3. Certificates &amp; Referrals
                </span>
                <p className="text-[11px] text-slate-700 dark:text-slate-300">
                  MC Status: <strong>{mcGenerated ? `Issued (${mcDays} Days)` : 'None'}</strong>
                </p>
                <p className="text-[11px] text-slate-700 dark:text-slate-300 mt-1">
                  Referral: <strong>{referralGenerated ? `Specialist Note attached for ${referralDetails.hospital}` : 'None'}</strong>
                </p>
              </div>

              {/* Dispensing Notes Summary */}
              <div className="bg-white dark:bg-[#082830] p-3 border border-slate-200 dark:border-teal-800/40 rounded-none">
                <span className="font-extrabold text-[11px] text-[#0f3c4c] dark:text-[#5eead4] uppercase block mb-1.5">
                  4. Dispensing Memo
                </span>
                <p className="text-[11px] font-mono text-slate-600 dark:text-slate-300">
                  {pharmacyMemo || 'No additional dispensing notes.'}
                </p>
              </div>

            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* INTERRUPTIVE CONTRAINDICATION OVERRIDE MODAL                              */}
      {/* ========================================================================= */}
      {pendingAllergyDrug && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-[#07252d] border-2 border-rose-600 max-w-lg w-full p-6 rounded-none space-y-4 shadow-2xl text-[#0f3c4c] dark:text-white">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="font-black text-sm uppercase tracking-wide">CRITICAL DRUG CONTRAINDICATION ALERT</h3>
            </div>
            
            <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium space-y-2">
              <p>
                Patient <strong className="text-[#0f3c4c] dark:text-[#5eead4]">{currentPatient.fullName}</strong> has registered allergies matching <strong className="text-rose-600 uppercase underline font-extrabold">{pendingAllergyDrug.allergyGroup || pendingAllergyDrug.name}</strong>.
              </p>
              <div className="bg-rose-50 dark:bg-rose-950/60 p-3 border border-rose-200 dark:border-rose-800 font-mono text-[11px] text-rose-900 dark:text-rose-200">
                <p><strong>Drug Class:</strong> {pendingAllergyDrug.allergyGroup || 'NSAID / Anti-inflammatory'}</p>
                <p><strong>Reaction History:</strong> {currentPatient.drugAllergies.join(', ') || 'Severe Bronchospasm & Urticaria'}</p>
              </div>
              <p>
                To prescribe <strong>{pendingAllergyDrug.name}</strong> anyway, you must document a valid clinical rationale for override.
              </p>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                Required Clinical Rationale for Override *
              </label>
              <Input
                type="text"
                value={overrideRationale}
                onChange={e => setOverrideRationale(e.target.value)}
                placeholder="e.g. Desensitization protocol active / benefit outweighs risk"
                className="w-full text-xs p-2 border border-slate-300 dark:border-teal-800/40 rounded-none focus:ring-2 focus:ring-rose-500 bg-white dark:bg-[#082830] text-[#0f3c4c] dark:text-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-teal-800/40">
              <button 
                type="button" 
                onClick={() => { setPendingAllergyDrug(null); setOverrideRationale(''); }} 
                className="px-3.5 py-1.5 border border-slate-300 text-xs font-bold rounded-none hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel Selection
              </button>

              <button
                type="button"
                disabled={!overrideRationale.trim()}
                onClick={() => {
                  confirmAddDrug(pendingAllergyDrug, overrideRationale);
                  setPendingAllergyDrug(null);
                  setOverrideRationale('');
                }}
                className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-1.5 text-xs font-black rounded-none disabled:opacity-50 cursor-pointer shadow-xs"
              >
                Confirm Override &amp; Add Drug
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
