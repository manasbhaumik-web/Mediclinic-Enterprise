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

import { palette, seriesColors } from '../../theme/palette';
import { buttonProps, focusRing } from '../../lib/a11y';
import PrescriptionPanel from './plan/PrescriptionPanel';
import LabOrdersPanel from './plan/LabOrdersPanel';
import CertificatesAndReferralPanel from './plan/CertificatesAndReferralPanel';
import PlanSummaryPanel from './plan/PlanSummaryPanel';
import ContraindicationModal from './plan/ContraindicationModal';
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
      dosage: drug.dosageEN || drug.suggestedDosage?.adults || 'Take as instructed',
      dosageBM: drug.dosageBM || 'Makan mengikut arahan',
      frequency: drug.frequency || '1 Tab BD',
      quantity: 10,
      pricePerUnit: drug.pricePerUnit ?? drug.price ?? 0.50,
      expiryDate: `${new Date().getFullYear() + 2}-12-31`,
      pillColor: drug.pillColor || palette.brand,
      capsuleStyle: drug.capsuleStyle || 'solid',
      // Link the line to the stock item (not to a name) when the drug comes from inventory.
      inventoryId: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(drug.id)) ? String(drug.id) : null,
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
      pillColor: seriesColors.rose,
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
    <div className="space-y-4 animate-fadeIn relative text-ink dark:text-slate-100">
      
      {/* ------------------------------------------------------------------------- */}
      {/* PERSISTENT AI DRUG INTERACTION SAFETY BANNER                             */}
      {/* ------------------------------------------------------------------------- */}
      {allergyAlerts.length > 0 ? (
        <div className="bg-rose-600 text-white p-3 rounded-none shadow-sm flex items-start gap-3 border border-rose-700">
          <AlertTriangle className="w-5 h-5 shrink-0 text-white mt-0.5" />
          <div>
            <h4 className="type-label">AI SAFETY ALERT: Drug Contraindication Conflict Detected!</h4>
            <p className="text-2xs mt-0.5 opacity-95">Patient registered allergies conflict with active prescription choices.</p>
            <ul className="text-2xs mt-1 list-disc pl-4 font-mono bg-black/20 p-1.5 rounded-none">
              {allergyAlerts.map((alert, idx) => (
                <li key={idx}><span className="font-bold">{alert.drugName}</span> belongs to <span className="font-bold underline uppercase">{alert.allergyGroup}</span> family.</li>
              ))}
            </ul>
          </div>
        </div>
      ) : rxList.length > 0 ? (
        <div className="bg-surface-accent dark:bg-night-800 text-accent dark:text-teal-300 p-2.5 rounded-none border border-line dark:border-teal-800/50 flex items-center justify-between text-xs font-bold shadow-2xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-accent dark:text-teal-400" />
            <span>AI Interaction Check: Pass (Zero Drug-Allergy Contraindications)</span>
          </div>
          <span className="font-mono text-2xs bg-white dark:bg-night-900 px-2 py-0.5 border border-line text-accent">
            {rxList.length} Items Prescribed
          </span>
        </div>
      ) : null}

      {/* ------------------------------------------------------------------------- */}
      {/* 4 STRUCTURED SUB-TABS NAVIGATION BAR                                      */}
      {/* ------------------------------------------------------------------------- */}
      <div className="flex border border-line dark:border-teal-800/40 bg-surface dark:bg-night-900 p-1 rounded-none gap-1" role="tablist">
        
        <button
          type="button"
          onClick={() => setSubTab('medication')}
          className={`flex-1 py-2 px-3 text-xs font-bold flex items-center justify-center gap-1.5 rounded-none transition-all cursor-pointer ${
            subTab === 'medication'
              ? 'bg-primary text-white shadow-2xs'
              : 'text-ink dark:text-slate-300 hover:bg-surface-accent dark:hover:bg-night-800'
          }`}
        >
          <Pill className="w-4 h-4" />
          <span>1. Medication Prescribing</span>
          {rxList.length > 0 && <span className="bg-white text-accent px-1 font-mono text-2xs font-bold">{rxList.length}</span>}
        </button>

        <button
          type="button"
          onClick={() => setSubTab('investigations')}
          className={`flex-1 py-2 px-3 text-xs font-bold flex items-center justify-center gap-1.5 rounded-none transition-all cursor-pointer ${
            subTab === 'investigations'
              ? 'bg-primary text-white shadow-2xs'
              : 'text-ink dark:text-slate-300 hover:bg-surface-accent dark:hover:bg-night-800'
          }`}
        >
          <TestTube className="w-4 h-4" />
          <span>2. Lab &amp; Investigations</span>
          {selectedLabs.length > 0 && <span className="bg-surface-accent text-accent px-1 font-mono text-2xs font-bold">{selectedLabs.length}</span>}
        </button>

        <button
          type="button"
          onClick={() => setSubTab('documents')}
          className={`flex-1 py-2 px-3 text-xs font-bold flex items-center justify-center gap-1.5 rounded-none transition-all cursor-pointer ${
            subTab === 'documents'
              ? 'bg-primary text-white shadow-2xs'
              : 'text-ink dark:text-slate-300 hover:bg-surface-accent dark:hover:bg-night-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>3. Documents &amp; Certificates</span>
          {(mcGenerated || referralGenerated) && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />}
        </button>

        <button
          type="button"
          onClick={() => setSubTab('summary')}
          className={`flex-1 py-2 px-3 text-xs font-bold flex items-center justify-center gap-1.5 rounded-none transition-all cursor-pointer ${
            subTab === 'summary'
              ? 'bg-primary text-white shadow-2xs'
              : 'text-ink dark:text-slate-300 hover:bg-surface-accent dark:hover:bg-night-800'
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
        <PrescriptionPanel showPediatricCalc={showPediatricCalc} patientAge={patientAge} setShowPediatricCalc={setShowPediatricCalc} isPediatricPatient={isPediatricPatient} patientWeight={patientWeight} setPatientWeight={setPatientWeight} medConcentration={medConcentration} setMedConcentration={setMedConcentration} calculatedDose={calculatedDose} handleAddPediatricSyrup={handleAddPediatricSyrup} searchDrugQuery={searchDrugQuery} setSearchDrugQuery={setSearchDrugQuery} drugSuggestions={drugSuggestions} handleAddDrug={handleAddDrug} rxList={rxList} setRxList={setRxList} pharmacyMemo={pharmacyMemo} setPharmacyMemo={setPharmacyMemo} />
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: DIAGNOSTIC INVESTIGATIONS (LAB / IMAGING ORDERS)              */}
      {/* ========================================================================= */}
      {subTab === 'investigations' && (
        <LabOrdersPanel selectedLabs={selectedLabs} availableLabTests={availableLabTests} toggleLabSelection={toggleLabSelection} labReason={labReason} setLabReason={setLabReason} />
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 3: DOCUMENTS & CERTIFICATES (MC & REFERRAL)                       */}
      {/* ========================================================================= */}
      {subTab === 'documents' && (
        <CertificatesAndReferralPanel mcGenerated={mcGenerated} mcDays={mcDays} setMcDays={setMcDays} mcReason={mcReason} setMcReason={setMcReason} setMcGenerated={setMcGenerated} referralGenerated={referralGenerated} referralDetails={referralDetails} setReferralDetails={setReferralDetails} setReferralGenerated={setReferralGenerated} />
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 4: PRESCRIPTION & ORDER SUMMARY                                   */}
      {/* ========================================================================= */}
      {subTab === 'summary' && (
        <PlanSummaryPanel rxList={rxList} selectedLabs={selectedLabs} mcGenerated={mcGenerated} mcDays={mcDays} referralGenerated={referralGenerated} referralDetails={referralDetails} pharmacyMemo={pharmacyMemo} />
      )}

      {/* ========================================================================= */}
      {/* INTERRUPTIVE CONTRAINDICATION OVERRIDE MODAL                              */}
      {/* ========================================================================= */}
      {pendingAllergyDrug && (
        <ContraindicationModal currentPatient={currentPatient} pendingAllergyDrug={pendingAllergyDrug} overrideRationale={overrideRationale} setOverrideRationale={setOverrideRationale} setPendingAllergyDrug={setPendingAllergyDrug} confirmAddDrug={confirmAddDrug} />
      )}

    </div>
  );
}
