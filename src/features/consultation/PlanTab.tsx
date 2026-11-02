import React, { useState, useMemo } from 'react';
import { 
  AlertTriangle, CheckCircle2, Activity, Pill, Trash2, FileText, 
  TestTube, Share, TrendingUp, PlusCircle, X, Info, ShieldAlert,
  FileCheck, Microscope, Sparkles, Building2
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { Patient, PrescriptionItem, ICD10Code, ClinicalProcedureItem } from '../../types';
import { COMMON_CLINIC_PROCEDURES, createProcedureOrder } from '../../domain/procedures';
import { useInventory } from '../../context/InventoryContext';
import { useAuth } from '../../context/AuthContext';
import { DRUG_DATABASE } from '../../data';

import { palette, seriesColors } from '../../theme/palette';
import { buttonProps, focusRing } from '../../lib/a11y';
import PrescriptionPanel, { CatalogDrug } from './plan/PrescriptionPanel';
import LabOrdersPanel from './plan/LabOrdersPanel';
import CertificatesAndReferralPanel from './plan/CertificatesAndReferralPanel';
import PlanSummaryPanel from './plan/PlanSummaryPanel';
import ContraindicationModal from './plan/ContraindicationModal';
import { calculatePatientAge } from '../../domain/patientAge';
import { auditAntimicrobialPrescription, isAntibioticDrug } from '../../domain/antibioticStewardship';
import { AntibioticStewardshipModal } from './plan/AntibioticStewardshipModal';
import { ProceduralConsentModal } from '../operations/ProceduralConsentModal';
import { SignedConsentRecord } from '../../domain/proceduralConsent';
import { matchAct342Disease } from '../../domain/act342Notification';
import { Act342NotificationModal } from './room/Act342NotificationModal';
import EmergencySBARModal from '../operations/EmergencySBARModal';
interface PlanTabProps {
  rxList: PrescriptionItem[];
  setRxList: React.Dispatch<React.SetStateAction<PrescriptionItem[]>>;
  procedures?: ClinicalProcedureItem[];
  setProcedures?: React.Dispatch<React.SetStateAction<ClinicalProcedureItem[]>>;
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
  labOrders: string[];
  setLabOrders: React.Dispatch<React.SetStateAction<string[]>>;
  labReason: string;
  setLabReason: React.Dispatch<React.SetStateAction<string>>;
  mcReason: string;
  setMcReason: React.Dispatch<React.SetStateAction<string>>;
  followUpWeeks: number;
  setFollowUpWeeks: React.Dispatch<React.SetStateAction<number>>;
}

export default function PlanTab({
  rxList,
  setRxList,
  procedures = [],
  setProcedures,
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
  setReferralGenerated,
  labOrders: selectedLabs,
  setLabOrders: setSelectedLabs,
  labReason,
  setLabReason,
  mcReason,
  setMcReason,
  followUpWeeks,
  setFollowUpWeeks
}: PlanTabProps) {
  const { showPII } = useAuth();
  const { inventory } = useInventory();

  // Active Sub-Tab State
  const [subTab, setSubTab] = useState<'medication' | 'investigations' | 'procedures' | 'documents' | 'summary'>('medication');
  const [procCategory, setProcCategory] = useState<string>('All');
  const [procSearch, setProcSearch] = useState<string>('');

  // Patient Age Context with Clinical Precision
  const patientAgeDetails = useMemo(() => {
    return calculatePatientAge(currentPatient?.dob);
  }, [currentPatient?.dob]);
  const patientAge = patientAgeDetails.years;
  const isPediatricPatient = patientAgeDetails.isPediatric;
  const [showPediatricCalc, setShowPediatricCalc] = useState(isPediatricPatient);
  
  // Local State for Pediatric Calculator
  const [patientWeight, setPatientWeight] = useState('');
  const [medConcentration, setMedConcentration] = useState('24'); // Default 120mg/5ml (24mg/ml)
  const [calculatedDose, setCalculatedDose] = useState<number | null>(null);
  
  const [searchDrugQuery, setSearchDrugQuery] = useState('');

  // Diagnostic Investigations State

  // Document Modal States
  const [isMcModalOpen, setIsMcModalOpen] = useState(false);
  const [isReferralModalOpen, setIsReferralModalOpen] = useState(false);

  // KKM NAG Antibiotic Stewardship Guard States
  const [stewardshipModalOpen, setStewardshipModalOpen] = useState(false);
  const [stewardshipJustifications, setStewardshipJustifications] = useState<Record<string, string>>({});

  // PHFSA 1998 Procedural Consent States
  const [consentModalProc, setConsentModalProc] = useState<ClinicalProcedureItem | null>(null);
  const [signedConsents, setSignedConsents] = useState<Record<string, SignedConsentRecord>>({});

  // Act 342 Communicable Disease Notification State
  const [act342ModalOpen, setAct342ModalOpen] = useState(false);
  const [isEmergencySbarOpen, setIsEmergencySbarOpen] = useState(false);
  const [act342Dispatched, setAct342Dispatched] = useState<string | null>(null);
  const matchedAct342 = selectedICD ? matchAct342Disease(selectedICD.code) : undefined;

  // Interruptive Allergy Override State
  const [pendingAllergyDrug, setPendingAllergyDrug] = useState<any | null>(null);
  const [overrideRationale, setOverrideRationale] = useState('');

  // Unified Drug Catalog
  const mergedCatalog = useMemo(() => {
    const combined: CatalogDrug[] = [...inventory];
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

  // KKM NAG Antimicrobial Stewardship Evaluation
  const stewardshipResult = useMemo(() => {
    if (!selectedICD) return null;
    return auditAntimicrobialPrescription(
      [{ code: selectedICD.code, name: selectedICD.desc }],
      rxList.map(r => r.drugName)
    );
  }, [selectedICD, rxList]);

  const unacknowledgedAntibiotics = useMemo(() => {
    if (!stewardshipResult || !stewardshipResult.requiresStewardshipReview) return [];
    return stewardshipResult.prescribedAntibiotics.filter(ab => !stewardshipJustifications[ab]);
  }, [stewardshipResult, stewardshipJustifications]);

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

    // KKM NAG Stewardship Pre-Check: If antibiotic and viral condition diagnosed
    if (selectedICD && isAntibioticDrug(drug.name)) {
      const audit = auditAntimicrobialPrescription(
        [{ code: selectedICD.code, name: selectedICD.desc }],
        [drug.name]
      );
      if (audit.requiresStewardshipReview && !stewardshipJustifications[drug.name]) {
        // Trigger stewardship notification
        setStewardshipModalOpen(true);
      }
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
        <div className="bg-rose-600 text-white p-3 rounded-none flex items-start gap-3 border border-rose-700">
          <AlertTriangle className="w-5 h-5 shrink-0 text-white mt-0.5" />
          <div>
            <h4 className="type-label">ALLERGY ALERT: a prescribed drug conflicts with a recorded allergy</h4>
            <p className="text-2xs mt-0.5 opacity-95">Patient registered allergies conflict with active prescription choices.</p>
            <ul className="text-2xs mt-1 list-disc pl-4 bg-black/20 p-1.5 rounded-none">
              {allergyAlerts.map((alert, idx) => (
                <li key={idx}><span className="font-bold">{alert.drugName}</span> belongs to <span className="font-bold underline uppercase">{alert.allergyGroup}</span> family.</li>
              ))}
            </ul>
          </div>
        </div>
      ) : rxList.length > 0 ? (
        <div className="bg-surface text-accent p-2.5 rounded-none border border-line flex items-center justify-between text-xs font-bold">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-accent" />
            <span>Allergy check: no conflict with the patient's recorded allergies</span>
          </div>
          <span className="font-mono text-2xs bg-surface px-2 py-0.5 border border-line text-accent">
            {rxList.length} Items Prescribed
          </span>
        </div>
      ) : null}

      {/* KKM NAG ANTIBIOTIC STEWARDSHIP ALERT BANNER */}
      {unacknowledgedAntibiotics.length > 0 && (
        <div className="bg-amber-600 text-white p-3 rounded-none flex items-center justify-between gap-3 border border-amber-700 animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 shrink-0 text-white" />
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider">
                KKM NAG Stewardship Alert: Systemic Antibiotic for Viral Condition
              </h4>
              <p className="text-2xs opacity-95">
                <span className="font-bold underline">{unacknowledgedAntibiotics.join(', ')}</span> prescribed with diagnosis <span className="font-mono font-bold">{selectedICD?.code} - {selectedICD?.desc}</span>.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setStewardshipModalOpen(true)}
            className="px-3 py-1.5 bg-white text-amber-900 text-xs font-bold uppercase tracking-wider hover:bg-amber-100 rounded-none shrink-0 cursor-pointer"
          >
            Review &amp; Justify
          </button>
        </div>
      )}

      {/* ACT 342 STATUTORY NOTIFIABLE DISEASE BANNER */}
      {matchedAct342 && (
        <div className="bg-rose-700 text-white p-3 rounded-none flex items-center justify-between gap-3 border border-rose-800 animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 shrink-0 text-white" />
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider">
                Act 342 Notifiable Disease Mandate: {matchedAct342.diseaseName}
              </h4>
              <p className="text-2xs opacity-95">
                Statutory requirement: Notify PKD {matchedAct342.urgency.toLowerCase()} under Section 10(2) of Act 342.
                {act342Dispatched && <span className="ml-2 font-bold bg-white text-rose-800 px-1.5 py-0.2">✓ Dispatched: {act342Dispatched}</span>}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setAct342ModalOpen(true)}
            className="px-3 py-1.5 bg-white text-rose-900 text-xs font-bold uppercase tracking-wider hover:bg-rose-100 rounded-none shrink-0 cursor-pointer"
          >
            {act342Dispatched ? 'View KKM Form' : 'Dispatch e-Notifikasi'}
          </button>
        </div>
      )}

      {/* ------------------------------------------------------------------------- */}
      {/* 5 STRUCTURED SUB-TABS NAVIGATION BAR (SINGLE-LINE CLINICAL LABELS)        */}
      {/* SUB-NAVIGATION TABS (Guaranteed Single-Line with min-w-fit & whitespace-nowrap) */}
      {/* ------------------------------------------------------------------------- */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-thin pb-1" role="tablist">
        
        <button
          type="button"
          onClick={() => setSubTab('medication')}
          className={`flex-1 min-w-fit min-h-11 px-4 border text-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
            subTab === 'medication'
              ? 'bg-surface-strong border-surface-strong text-ink font-bold'
              : 'bg-surface border-line text-muted font-semibold hover:bg-surface-accent'
          }`}
          title="Medication Prescribing & In-House Inventory"
        >
          <Pill className="w-4 h-4 shrink-0" />
          <span className="whitespace-nowrap">1. Medications</span>
          {rxList.length > 0 && <span className="bg-surface text-accent px-1 text-2xs font-bold shrink-0">{rxList.length}</span>}
        </button>

        <button
          type="button"
          onClick={() => setSubTab('investigations')}
          className={`flex-1 min-w-fit min-h-11 px-4 border text-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
            subTab === 'investigations'
              ? 'bg-surface-strong border-surface-strong text-ink font-bold'
              : 'bg-surface border-line text-muted font-semibold hover:bg-surface-accent'
          }`}
          title="Laboratory & Diagnostic Investigations"
        >
          <TestTube className="w-4 h-4 shrink-0" />
          <span className="whitespace-nowrap">2. Lab &amp; Tests</span>
          {selectedLabs.length > 0 && <span className="bg-surface-accent text-accent px-1 text-2xs font-bold shrink-0">{selectedLabs.length}</span>}
        </button>

        <button
          type="button"
          onClick={() => setSubTab('procedures')}
          className={`flex-1 min-w-fit min-h-11 px-4 border text-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
            subTab === 'procedures'
              ? 'bg-surface-strong border-surface-strong text-ink font-bold'
              : 'bg-surface border-line text-muted font-semibold hover:bg-surface-accent'
          }`}
          title="In-Clinic Injections, Nebulizer, Wound Care & Rapid Tests"
        >
          <Activity className="w-4 h-4 shrink-0" />
          <span className="whitespace-nowrap">3. Procedures</span>
          {procedures.length > 0 && <span className="bg-surface text-accent px-1.5 py-0.5 text-2xs font-bold shrink-0">{procedures.length}</span>}
        </button>

        <button
          type="button"
          onClick={() => setSubTab('documents')}
          className={`flex-1 min-w-fit min-h-11 px-4 border text-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
            subTab === 'documents'
              ? 'bg-surface-strong border-surface-strong text-ink font-bold'
              : 'bg-surface border-line text-muted font-semibold hover:bg-surface-accent'
          }`}
          title="Medical Certificates (MC), Referral Letters & Pharmacy Memos"
        >
          <FileText className="w-4 h-4 shrink-0" />
          <span className="whitespace-nowrap">4. Documents / MC</span>
          {(mcGenerated || referralGenerated) && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
        </button>

        <button
          type="button"
          onClick={() => setSubTab('summary')}
          className={`flex-1 min-w-fit min-h-11 px-4 border text-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
            subTab === 'summary'
              ? 'bg-surface-strong border-surface-strong text-ink font-bold'
              : 'bg-surface border-line text-muted font-semibold hover:bg-surface-accent'
          }`}
          title="Encounter Prescription & Order Summary"
        >
          <FileCheck className="w-4 h-4 shrink-0" />
          <span className="whitespace-nowrap">5. Order Summary</span>
        </button>

      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB 1: MEDICATION PRESCRIBING                                         */}
      {/* ========================================================================= */}
      {subTab === 'medication' && (
        <div className="space-y-3">
          {currentPatient.panelEmployer && currentPatient.panelEmployer !== 'None (Self-Pay)' && (
            <div className="bg-primary/5 border border-primary/20 p-2.5 rounded-none flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary shrink-0" />
                <span className="font-bold text-ink">
                  Corporate Panel Account: {currentPatient.panelEmployer}
                </span>
                <span className="text-2xs text-muted">
                  (Standard Outpatient Limit: RM 65.00 • Non-covered items like vitamins/supplements split to patient excess)
                </span>
              </div>
              <span className="text-2xs font-bold bg-primary/10 text-primary px-2 py-0.5 border border-primary/30">
                GL Active
              </span>
            </div>
          )}
          <PrescriptionPanel 
            showPediatricCalc={showPediatricCalc} 
            patientAge={patientAge} 
            patientAgeDisplay={patientAgeDetails.displayAge} 
            setShowPediatricCalc={setShowPediatricCalc} 
            isPediatricPatient={isPediatricPatient} 
            patientWeight={patientWeight} 
            setPatientWeight={setPatientWeight} 
            medConcentration={medConcentration} 
            setMedConcentration={setMedConcentration} 
            calculatedDose={calculatedDose} 
            handleAddPediatricSyrup={handleAddPediatricSyrup} 
            searchDrugQuery={searchDrugQuery} 
            setSearchDrugQuery={setSearchDrugQuery} 
            drugSuggestions={drugSuggestions} 
            handleAddDrug={handleAddDrug} 
            rxList={rxList} 
            setRxList={setRxList} 
            pharmacyMemo={pharmacyMemo} 
            setPharmacyMemo={setPharmacyMemo} 
            patientAllergies={currentPatient.drugAllergies}
            mcGenerated={mcGenerated}
            setMcGenerated={setMcGenerated}
            mcDays={mcDays}
            setMcDays={setMcDays}
            mcReason={mcReason}
            setMcReason={setMcReason}
            followUpWeeks={followUpWeeks}
            setFollowUpWeeks={setFollowUpWeeks}
            selectedICD={selectedICD}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: DIAGNOSTIC INVESTIGATIONS (LAB / IMAGING ORDERS)              */}
      {/* ========================================================================= */}
      {subTab === 'investigations' && (
        <LabOrdersPanel selectedLabs={selectedLabs} availableLabTests={availableLabTests} toggleLabSelection={toggleLabSelection} labReason={labReason} setLabReason={setLabReason} />
      )}


      {/* ========================================================================= */}
      {/* SUB-TAB 3: IN-CLINIC PROCEDURES & RAPID DIAGNOSTICS                       */}
      {/* ========================================================================= */}
      {subTab === 'procedures' && (
        <div className="space-y-4 animate-fadeIn font-sans">
          <div className="bg-surface-muted/40 border border-line p-3.5 rounded-none flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="type-section-title text-ink font-bold flex items-center gap-2">
                <Activity className="w-4 h-4 text-accent" />
                In-Clinic Procedures, Injections &amp; Rapid Diagnostics
              </h3>
              <p className="text-xs text-muted mt-0.5">
                Orders dispatch directly to the Treatment Room &amp; Nursing Station.
              </p>
            </div>
            <div className="bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 px-3 py-1.5 text-2xs text-amber-900 dark:text-amber-200">
              💡 Need rapid test results before sign-off? Order here, then click <strong>Hold: Rapid Test / Lab</strong> in bottom toolbar.
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            {/* Catalog of Procedures (8 Cols) */}
            <div className="lg:col-span-8 border border-line p-3 bg-surface space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-2">
                <div className="flex flex-wrap gap-1">
                  {['All', 'Injection', 'Nebulizer', 'Wound Care', 'Diagnostic', 'Minor Surgery'].map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setProcCategory(cat)}
                      className={`px-2.5 py-1 text-2xs font-bold rounded-none cursor-pointer transition-colors ${
                        procCategory === cat ? 'bg-surface-strong text-ink' : 'bg-surface-muted text-muted hover:text-ink'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Filter procedures..."
                  value={procSearch}
                  onChange={(e) => setProcSearch(e.target.value)}
                  className="px-2 py-1 text-xs border border-line bg-surface text-ink w-44 rounded-none focus:outline-none focus:border-brand"
                />
              </div>

              <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                {COMMON_CLINIC_PROCEDURES.filter(p => {
                  if (procCategory !== 'All' && p.category !== procCategory) return false;
                  if (procSearch.trim() && !p.name.toLowerCase().includes(procSearch.toLowerCase())) return false;
                  return true;
                }).map(preset => {
                  const isAlreadyOrdered = procedures.some(p => p.name === preset.name && p.status === 'Pending');
                  return (
                    <div key={preset.name} className="flex items-center justify-between p-2.5 border border-line hover:border-brand transition-colors bg-surface-muted/20">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-ink">{preset.name}</span>
                          <span className="text-2xs px-1.5 py-0.2 bg-surface border border-line text-muted">{preset.category}</span>
                        </div>
                        <div className="text-2xs text-muted mt-0.5">{preset.dosageOrDetails}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs font-bold text-ink">RM {preset.price.toFixed(2)}</span>
                        <button
                          type="button"
                          disabled={isAlreadyOrdered}
                          onClick={() => {
                            if (!setProcedures) return;
                            const newOrder = createProcedureOrder(preset, 'current-doc', 'Ordered during consultation');
                            setProcedures(prev => [...prev, newOrder]);
                          }}
                          className={`px-3 py-1 text-2xs font-bold rounded-none cursor-pointer ${
                            isAlreadyOrdered
                              ? 'bg-surface-muted text-muted cursor-not-allowed border border-line'
                              : 'bg-primary hover:bg-primary-hover text-white'
                          }`}
                        >
                          {isAlreadyOrdered ? '✓ Ordered' : '+ Order'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Ordered Procedures in this encounter (4 Cols) */}
            <div className="lg:col-span-4 border border-line p-3 bg-surface space-y-3">
              <div className="flex items-center justify-between border-b border-line pb-2">
                <span className="type-heading-caps text-ink">Active Procedure Orders</span>
                <span className="font-mono text-xs font-bold text-accent">{procedures.length} Items</span>
              </div>

              {procedures.length === 0 ? (
                <div className="py-8 text-center text-muted">
                  <Activity className="w-6 h-6 mx-auto mb-1.5 opacity-40 text-muted" />
                  <p className="text-xs font-bold">No in-clinic procedures ordered</p>
                  <p className="text-2xs text-muted mt-0.5">Select injections, nebulizers, dressings or rapid tests from the left.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {procedures.map((p, idx) => (
                    <div key={p.id || idx} className="p-2.5 border border-line bg-surface-muted/30 space-y-1">
                      <div className="flex items-start justify-between gap-1">
                        <span className="text-xs font-bold text-ink leading-tight">{p.name}</span>
                        {setProcedures && (
                          <button
                            type="button"
                            onClick={() => setProcedures(prev => prev.filter(item => item.id !== p.id))}
                            className="text-muted hover:text-rose-600 text-2xs p-0.5 cursor-pointer"
                            title="Remove procedure order"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-2xs text-muted">
                        <span>Fee: RM {p.price.toFixed(2)}</span>
                        <span className={`px-1.5 py-0.2 font-bold ${
                          p.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {p.status}
                        </span>
                      </div>
                      {p.result && (
                        <div className="mt-1 p-1 bg-surface border border-line text-2xs text-accent">
                          <strong>Result:</strong> {p.result}
                        </div>
                      )}
                      {/* PHFSA 1998 Consent Action Line */}
                      <div className="flex items-center justify-between pt-1 border-t border-line/40 text-2xs">
                        <span className="text-ink-muted">PHFSA Consent:</span>
                        {signedConsents[p.id] ? (
                          <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                            ✓ Signed ({signedConsents[p.id].id})
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConsentModalProc(p)}
                            className="text-primary hover:underline font-bold cursor-pointer"
                          >
                            Review &amp; Sign
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-line flex justify-between text-xs font-bold text-ink">
                    <span>Total Procedure Fees:</span>
                    <span className="text-primary">
                      RM {procedures.reduce((sum, item) => sum + (item.price || 0), 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 3: DOCUMENTS & CERTIFICATES (MC & REFERRAL)                       */}
      {/* ========================================================================= */}
      {subTab === 'documents' && (
        <CertificatesAndReferralPanel mcGenerated={mcGenerated} mcDays={mcDays} setMcDays={setMcDays} mcReason={mcReason} setMcReason={setMcReason} setMcGenerated={setMcGenerated} referralGenerated={referralGenerated} referralDetails={referralDetails} setReferralDetails={setReferralDetails} setReferralGenerated={setReferralGenerated} followUpWeeks={followUpWeeks} setFollowUpWeeks={setFollowUpWeeks} onOpenEmergencySbar={() => setIsEmergencySbarOpen(true)} />
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

      {/* ========================================================================= */}
      {/* KKM NAG ANTIBIOTIC STEWARDSHIP JUSTIFICATION MODAL                        */}
      {/* ========================================================================= */}
      {stewardshipResult && (
        <AntibioticStewardshipModal
          isOpen={stewardshipModalOpen}
          onClose={() => setStewardshipModalOpen(false)}
          stewardshipResult={stewardshipResult}
          onConfirmOverride={(justification) => {
            const updated = { ...stewardshipJustifications };
            stewardshipResult.prescribedAntibiotics.forEach(ab => {
              updated[ab] = justification;
            });
            setStewardshipJustifications(updated);
            setPharmacyMemo(prev => 
              prev ? `${prev}\n[NAG Antibiotic Stewardship Justification: ${justification}]` : `[NAG Antibiotic Stewardship Justification: ${justification}]`
            );
          }}
          onRemoveAntibiotic={(drugName) => {
            setRxList(prev => prev.filter(r => r.drugName !== drugName && !r.drugName.startsWith(drugName)));
          }}
        />
      )}

      {/* ========================================================================= */}
      {/* STATUTORY PHFSA 1998 PROCEDURAL CONSENT MODAL                            */}
      {/* ========================================================================= */}
      {consentModalProc && (
        <ProceduralConsentModal
          isOpen={!!consentModalProc}
          onClose={() => setConsentModalProc(null)}
          procedureName={consentModalProc.name}
          patientId={currentPatient.id}
          patientName={currentPatient.fullName}
          patientIc={currentPatient.icNumber}
          onConsentSigned={(record) => {
            setSignedConsents(prev => ({ ...prev, [consentModalProc.id]: record }));
          }}
        />
      )}

      {/* ========================================================================= */}
      {/* ACT 342 STATUTORY COMMUNICABLE DISEASE NOTIFICATION MODAL                */}
      {/* ========================================================================= */}
      {selectedICD && matchedAct342 && (
        <Act342NotificationModal
          isOpen={act342ModalOpen}
          onClose={() => setAct342ModalOpen(false)}
          icd10Code={selectedICD.code}
          patient={currentPatient}
          onNotificationDispatched={(record) => {
            setAct342Dispatched(record.id);
          }}
        />
      )}

      {/* ========================================================================= */}
      {/* MECC 999 SBAR EMERGENCY HOSPITAL TRANSFER MODAL                           */}
      {/* ========================================================================= */}
      <EmergencySBARModal
        isOpen={isEmergencySbarOpen}
        onClose={() => setIsEmergencySbarOpen(false)}
        activePatient={currentPatient}
        onTransferDispatched={(record) => {
          setReferralGenerated(true);
          setReferralDetails({
            hospital: record.recommendation.destinationHospital,
            department: 'Emergency & Trauma Department',
            reason: `[MECC 999 SBAR Transfer] ${record.situation.acuteDiagnosis || record.situation.chiefComplaint} (SBAR ID: ${record.id})`,
          });
        }}
      />

    </div>
  );
}
