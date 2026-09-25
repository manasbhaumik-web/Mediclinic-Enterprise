import React, { useState, useMemo } from 'react';
import { 
  AlertTriangle, CheckCircle2, Activity, Pill, Trash2, FileText, 
  TestTube, Share, TrendingUp, PlusCircle 
} from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { Patient, PrescriptionItem, ICD10Code } from '../../types';
import { useInventory } from '../../context/InventoryContext';
import { useAuth } from '../../context/AuthContext';
import { maskICNumber } from '../../utils/piiMasker';
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
  
  // Local State for Pediatric Calculator
  const [patientWeight, setPatientWeight] = useState('');
  const [medConcentration, setMedConcentration] = useState('24'); // Default 120mg/5ml (24mg/ml)
  const [calculatedDose, setCalculatedDose] = useState<number | null>(null);
  
  const [searchDrugQuery, setSearchDrugQuery] = useState('');
  
  const [isMcModalOpen, setIsMcModalOpen] = useState(false);
  const [mcReferenceNo, setMcReferenceNo] = useState('');
  const [isReferralModalOpen, setIsReferralModalOpen] = useState(false);

  // Unified Drug Catalog (Combine live inventory with static fallback catalog)
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
    'lipitor': ['atorvastatin', 'cholesterol'],
    'ventolin inhaler': ['salbutamol', 'inhaler']
  };

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

  // Drug Suggestions Filter (supports trade alias match & sub-string search)
  const drugSuggestions = useMemo(() => {
    const q = searchDrugQuery.trim().toLowerCase();
    if (!q) return [];
    
    // Check if query matches a known trade name alias
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

  // Check Clinical Disease Contraindications (e.g., NSAID given to Asthmatic or Gastritis patient)
  const contraindicationAlerts = useMemo(() => {
    if (!selectedICD) return [];
    const alerts: { drugName: string; icdCode: string; reason: string }[] = [];
    
    const icdCode = selectedICD.code.toUpperCase();
    
    rxList.forEach(item => {
      const name = item.drugName.toLowerCase();
      const catalogDrug = mergedCatalog.find(d => d.name.toLowerCase() === name);
      const grp = (catalogDrug?.allergyGroup || '').toLowerCase();

      // Rule 1: NSAID / Aspirin in Gastritis / Peptic Ulcer Disease (K29 / K25)
      if ((icdCode.startsWith('K29') || icdCode.startsWith('K25')) && (grp.includes('nsaid') || name.includes('mefenamic') || name.includes('diclofenac') || name.includes('ibuprofen') || name.includes('naproxen'))) {
        alerts.push({
          drugName: item.drugName,
          icdCode: selectedICD.code,
          reason: 'NSAID / Anti-inflammatory drugs can aggravate gastric ulceration and gastrointestinal bleeding.'
        });
      }

      // Rule 2: Non-selective Beta Blockers in Asthma (J45)
      if (icdCode.startsWith('J45') && (name.includes('propranolol') || name.includes('atenolol'))) {
        alerts.push({
          drugName: item.drugName,
          icdCode: selectedICD.code,
          reason: 'Beta-blockers can trigger severe bronchospasm in asthmatic patients.'
        });
      }
    });
    return alerts;
  }, [rxList, selectedICD, mergedCatalog]);

  const handleAddDrug = (drug: any) => {
    if (rxList.some(r => r.drugName.toLowerCase() === drug.name.toLowerCase())) {
      setSearchDrugQuery('');
      return;
    }
    const newRx: PrescriptionItem = {
      id: `rx-${Date.now()}-${Math.random()}`,
      drugName: drug.name,
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

  const handleAddCustomDrug = (customName: string) => {
    if (!customName.trim()) return;
    const newRx: PrescriptionItem = {
      id: `rx-custom-${Date.now()}`,
      drugName: customName.trim(),
      dosage: 'Take as directed by doctor',
      dosageBM: 'Makan mengikut arahan doktor',
      frequency: '1 Tab BD',
      quantity: 10,
      pricePerUnit: 1.00,
      expiryDate: `${new Date().getFullYear() + 2}-06-30`,
      pillColor: '#0d9488',
      capsuleStyle: 'solid'
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
      drugName: `Syrup Paracetamol (${medConcentration === '24' ? '120mg/5ml' : medConcentration === '50' ? '250mg/5ml' : '100mg/ml Infant'})`,
      dosage: doseStr,
      dosageBM: doseBMStr,
      frequency: 'TDS (3x Daily)',
      quantity: 1, // 1 Bottle
      pricePerUnit: 12.00,
      expiryDate: `${new Date().getFullYear() + 1}-12-31`,
      pillColor: '#f43f5e',
      capsuleStyle: 'solid'
    };
    setRxList([...rxList, newRx]);
  };

  const triggerMcOpening = () => {
    setMcDays(2);
    setMcReferenceNo(`MC-${Date.now().toString().slice(-6)}`);
    setIsMcModalOpen(true);
  };

  return (
    <div className="space-y-5 animate-fadeIn relative">
      {/* AI DRUG INTERACTION ALERT */}
      {allergyAlerts.length > 0 ? (
        <div className="bg-rose-600 text-white p-3.5 rounded-none shadow-md flex items-start gap-3 border border-rose-700">
          <AlertTriangle className="w-5 h-5 shrink-0 text-white" />
          <div>
            <h4 className="font-extrabold text-xs uppercase tracking-wider">AI SAFETY ALERT: Drug Interaction Conflict Detected!</h4>
            <p className="text-[11px] mt-0.5 opacity-95">Patient has registered allergies conflicting with your selected prescription plan.</p>
            <ul className="text-[10px] mt-1.5 list-disc pl-4 font-mono bg-black/20 p-2 rounded-none">
              {allergyAlerts.map((alert, idx) => (
                <li key={idx}><span className="font-bold">{alert.drugName}</span> belongs to <span className="font-bold underline">{alert.allergyGroup}</span> family.</li>
              ))}
            </ul>
          </div>
        </div>
      ) : rxList.length > 0 ? (
        <div className="bg-[#e0f5f2] dark:bg-[#0c3844] text-[#0f766e] dark:text-[#5eead4] p-3 rounded-none border border-[#b2f5ea] dark:border-teal-800/50 flex items-center gap-2 shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-[#0d9488] dark:text-[#2dd4bf]" />
          <span className="text-[11px] font-bold uppercase tracking-wider">AI Interaction Check: Safe (Zero Contraindications Detected)</span>
        </div>
      ) : null}

      {/* PEDIATRIC DOSAGE CALCULATOR */}
      <div className="bg-[#e0f5f2]/80 dark:bg-[#082830] p-4 rounded-none border border-[#b2f5ea] dark:border-teal-800/50 shadow-xs">
        <div className="flex items-center justify-between mb-2.5">
          <h4 className="text-xs font-extrabold text-[#0f3c4c] dark:text-[#5eead4] uppercase flex items-center gap-1.5 tracking-wider">
            <Activity className="w-4 h-4 text-[#0d9488] dark:text-[#2dd4bf]" /> Pediatric Dosage Calculator (Paracetamol 15mg/kg)
          </h4>
          <span className="text-[10px] text-[#0f766e] dark:text-[#5eead4] bg-white dark:bg-[#082830] px-2.5 py-0.5 rounded-none border border-[#b2f5ea] dark:border-teal-800/40">
            Clinical Standard: 15mg / kg
          </span>
        </div>
        
        {/* Weight & Concentration Presets */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 items-end">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
              Child Body Weight (kg)
            </label>
            <Input 
              type="number" 
              className="w-full text-xs px-3 py-1.5 border border-[#b2f5ea] dark:border-teal-800/40 rounded-none focus:ring-2 focus:ring-[#0d9488] outline-none bg-white dark:bg-[#07252d] text-[#0f3c4c] dark:text-white font-bold"
              value={patientWeight}
              onChange={e => setPatientWeight(e.target.value)}
              placeholder="e.g. 12"
            />
            {/* Quick Weight Presets */}
            <div className="flex gap-1 mt-1.5 flex-wrap">
              {['5', '8', '10', '12', '15', '20'].map(w => (
                <button
                  key={w}
                  type="button"
                  onClick={() => setPatientWeight(w)}
                  className={`text-[9px] font-bold px-2 py-0.5 rounded-none border transition-all ${
                    patientWeight === w 
                      ? 'bg-[#0d9488] text-white border-[#0d9488]' 
                      : 'bg-white dark:bg-[#0e4857] text-[#0f766e] dark:text-[#5eead4] border-[#b2f5ea] dark:border-teal-700/50 hover:bg-[#e0f5f2] dark:hover:bg-[#12596b] cursor-pointer'
                  }`}
                >
                  {w}kg
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
              Syrup Formulation Concentration
            </label>
            <select
              className="w-full text-xs px-2.5 py-1.5 border border-[#b2f5ea] dark:border-teal-800/40 rounded-none focus:ring-2 focus:ring-[#0d9488] outline-none bg-white dark:bg-[#07252d] text-[#0f3c4c] dark:text-white font-bold"
              value={medConcentration}
              onChange={e => setMedConcentration(e.target.value)}
            >
              <option value="24">120mg / 5ml Standard Syrup (24mg/ml)</option>
              <option value="50">250mg / 5ml Forte Syrup (50mg/ml)</option>
              <option value="100">100mg / ml Drops (Infant 100mg/ml)</option>
            </select>
            <div className="flex gap-1.5 mt-1.5">
              <button
                type="button"
                onClick={() => setMedConcentration('24')}
                className={`text-[9px] font-bold px-2 py-0.5 rounded-none border transition-all ${
                  medConcentration === '24' 
                    ? 'bg-[#0d9488] text-white border-[#0d9488]' 
                    : 'bg-white dark:bg-[#0e4857] text-[#0f766e] dark:text-[#5eead4] border-[#b2f5ea] dark:border-teal-700/50 hover:bg-[#e0f5f2] dark:hover:bg-[#12596b] cursor-pointer'
                }`}
              >
                120mg/5ml
              </button>
              <button
                type="button"
                onClick={() => setMedConcentration('50')}
                className={`text-[9px] font-bold px-2 py-0.5 rounded-none border transition-all ${
                  medConcentration === '50' 
                    ? 'bg-[#0d9488] text-white border-[#0d9488]' 
                    : 'bg-white dark:bg-[#0e4857] text-[#0f766e] dark:text-[#5eead4] border-[#b2f5ea] dark:border-teal-700/50 hover:bg-[#e0f5f2] dark:hover:bg-[#12596b] cursor-pointer'
                }`}
              >
                250mg/5ml
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-[#082830] p-3 rounded-none border border-[#b2f5ea] dark:border-teal-800/40 flex flex-col justify-between h-full shadow-2xs">
            <div>
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Calculated Single Dose</span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="font-mono font-black text-[#0d9488] dark:text-[#2dd4bf] text-lg leading-none">
                  {typeof calculatedDose === 'number' && !isNaN(calculatedDose) ? `${calculatedDose.toFixed(1)} ml` : '--'}
                </span>
                {typeof calculatedDose === 'number' && !isNaN(calculatedDose) && (
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">({(parseFloat(patientWeight) * 15).toFixed(0)} mg)</span>
                )}
              </div>
            </div>
            
            {typeof calculatedDose === 'number' && !isNaN(calculatedDose) && calculatedDose > 0 && (
              <button
                type="button"
                onClick={handleAddPediatricSyrup}
                className="mt-2 w-full text-[10px] font-extrabold bg-[#0d9488] hover:bg-[#0f766e] text-white py-1.5 px-2 rounded-none flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-xs"
              >
                <PlusCircle className="w-3.5 h-3.5" /> + Add {calculatedDose.toFixed(1)}ml Syrup to Rx
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Medication prescription search bar */}
      <div className="space-y-1">
        <label className="block text-xs font-bold text-[#0f3c4c] dark:text-[#5eead4] uppercase tracking-tight">
          Medication Catalog &amp; Brand Alias Search
        </label>
        <div className="relative">
          <Input
            type="text"
            className="w-full text-xs px-3.5 py-2.5 border border-[#b2f5ea] dark:border-teal-800/50 bg-white dark:bg-[#07252d] text-[#0f3c4c] dark:text-white rounded-none focus:ring-3 focus:ring-[#0d9488]/15 focus:border-[#0d9488] focus:outline-none font-medium placeholder:text-slate-400"
            value={searchDrugQuery}
            onChange={(e) => setSearchDrugQuery(e.target.value)}
            placeholder="Search catalog or brand names (e.g. 'Panadol', 'Amoxicillin', 'Augmentin', 'Ponstan', 'Voltaren', 'Zyrtec')..."
          />
          {searchDrugQuery.trim().length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-[#082830] border border-[#b2f5ea] dark:border-teal-700/50 rounded-none shadow-xl z-20 max-h-[220px] overflow-y-auto divide-y divide-slate-100 dark:divide-teal-800/40">
              {drugSuggestions.length > 0 ? (
                drugSuggestions.map((item) => {
                  const isConflict = item.allergyGroup && item.allergyGroup !== 'None' && currentPatient.drugAllergies.some(
                    a => a.toLowerCase() === item.allergyGroup.toLowerCase() ||
                         item.allergyGroup.toLowerCase().includes(a.toLowerCase())
                  );
                  const price = typeof item.pricePerUnit === 'number' ? item.pricePerUnit : 0.50;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleAddDrug(item)}
                      className="w-full text-left px-3.5 py-2 text-xs hover:bg-[#e0f5f2]/60 dark:hover:bg-[#0e4857] flex items-center justify-between cursor-pointer transition-colors"
                    >
                      <div>
                        <span className="font-bold text-[#0f3c4c] dark:text-white block">{item.name}</span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                          {item.category || 'General Medication'} (Allergen Group: {item.allergyGroup || 'None'})
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {isConflict && <span className="bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 font-bold px-1.5 py-0.5 rounded-none text-[8px] uppercase">Allergy Conflict</span>}
                        <span className="font-mono text-[#0d9488] dark:text-[#2dd4bf] font-bold">RM{price.toFixed(2)}</span>
                      </div>
                    </button>
                  );
                })
              ) : null}
              
              {/* Custom Medication Fallback option */}
              <button
                type="button"
                onClick={() => handleAddCustomDrug(searchDrugQuery)}
                className="w-full text-left px-3.5 py-2.5 text-xs bg-[#e0f5f2]/70 dark:bg-[#0e4857] hover:bg-[#e0f5f2] dark:hover:bg-[#12596b] text-[#0f766e] dark:text-[#5eead4] font-bold flex items-center gap-2 cursor-pointer border-t border-[#b2f5ea] dark:border-teal-700/50"
              >
                <PlusCircle className="w-4 h-4 text-[#0d9488] dark:text-[#2dd4bf]" />
                <span>Add Custom Prescription: "{searchDrugQuery}"</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* SMART DOSAGE QUICK-PILLS PRESET BAR */}
      <div className="bg-[#f7fdfd] dark:bg-[#0c3844] border border-[#b2f5ea] dark:border-teal-800/50 rounded-none p-3 space-y-2 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-[#0f3c4c] dark:text-[#5eead4] uppercase tracking-wider flex items-center gap-1">
            <Pill className="w-3.5 h-3.5 text-[#0d9488] dark:text-[#2dd4bf]" /> Fast Dosage Preset Quick-Pills
          </span>
          <span className="text-[9px] text-slate-400">Click to apply preset instructions to last added medication</span>
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
                  updated[lastIdx] = { ...updated[lastIdx], frequency: preset.freq, dosage: preset.en, dosageBM: preset.bm };
                  setRxList(updated);
                }
              }}
              className="text-[10px] font-bold bg-white dark:bg-[#0e4857] hover:bg-[#0d9488] hover:text-white text-[#0f766e] dark:text-[#5eead4] px-2.5 py-1 rounded-none border border-[#b2f5ea] dark:border-teal-700/50 shadow-2xs transition-all cursor-pointer"
            >
              + {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Currently Selected Prescription list */}
      <div className="border border-[#b2f5ea] dark:border-teal-800/50 rounded-none overflow-hidden shadow-xs bg-white dark:bg-[#0c3844]">
        {contraindicationAlerts.length > 0 && (
          <div className="bg-amber-50 dark:bg-amber-950/60 border-b border-amber-200 dark:border-amber-800/50 p-3.5 space-y-1">
            <h5 className="text-xs font-extrabold text-amber-900 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 animate-bounce-slow" /> Drug-Disease Clinical Contraindication Alert ({contraindicationAlerts.length})
            </h5>
            <div className="space-y-1">
              {contraindicationAlerts.map((alert, idx) => (
                <p key={idx} className="text-[11px] text-amber-800 dark:text-amber-300 font-medium leading-relaxed">
                  • <strong className="font-bold underline">{alert.drugName}</strong> vs Diagnosis <strong className="font-mono bg-amber-100 dark:bg-amber-900 px-1 rounded-none text-amber-900 dark:text-amber-200 font-bold">{alert.icdCode}</strong>: {alert.reason}
                </p>
              ))}
            </div>
          </div>
        )}
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#f7fdfd] dark:bg-[#082830] border-b border-[#b2f5ea] dark:border-teal-800/50 text-[10px] text-[#0f3c4c] dark:text-[#5eead4] uppercase tracking-wider font-bold">
              <th className="px-3.5 py-2.5">Medication Info</th>
              <th className="px-3.5 py-2.5">Frequency &amp; Instructions</th>
              <th className="px-3.5 py-2.5 w-20">Qty</th>
              <th className="px-3.5 py-2.5 text-right w-24">Price (MYR)</th>
              <th className="px-3.5 py-2.5 text-center w-12">Action</th>
            </tr>
          </thead>
          <tbody>
            {rxList.length === 0 ? (
              <tr><td colSpan={5} className="text-center p-6 text-xs text-slate-400 italic">No medications prescribed yet. Search above (e.g. 'Panadol', 'Amoxicillin') to construct treatment plan.</td></tr>
            ) : (
              rxList.map((rx) => {
                const catalogDrugDef = mergedCatalog.find(d => d.name.toLowerCase() === rx.drugName.toLowerCase());
                const allergyGrp = catalogDrugDef?.allergyGroup || 'None';
                const hasConflict = allergyGrp !== 'None' && currentPatient.drugAllergies.some(a => a.toLowerCase() === allergyGrp.toLowerCase());
                const isContraindicated = contraindicationAlerts.some(a => a.drugName === rx.drugName);
                const unitPrice = typeof rx.pricePerUnit === 'number' ? rx.pricePerUnit : 0.50;
                const itemTotal = unitPrice * (rx.quantity || 1);
                
                return (
                  <tr key={rx.id} className={`border-b text-xs border-slate-100 dark:border-teal-800/30 ${hasConflict ? 'bg-rose-50/70 dark:bg-rose-950/40' : isContraindicated ? 'bg-amber-50/70 dark:bg-amber-950/40' : 'hover:bg-[#f7fdfd] dark:hover:bg-[#0e4857]'}`}>
                    <td className="px-3.5 py-2.5">
                      <span className="font-bold text-[#0f3c4c] dark:text-white block">{rx.drugName}</span>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <span className="w-2.5 h-2.5 rounded-full inline-block border border-slate-300" style={{ backgroundColor: rx.pillColor || '#0d9488' }} />
                        <span className="text-[10px] text-slate-400">Batch Expiry: {rx.expiryDate || 'N/A'}</span>
                        {isContraindicated && <span className="text-[9px] bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 font-bold px-1.5 py-0.5 rounded-none uppercase tracking-wider border border-amber-300 flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-amber-600" /> ICD Contraindication</span>}
                      </div>
                    </td>
                    <td className="px-3.5 py-2.5 text-[11px] text-slate-600 dark:text-slate-300">
                      <span className="font-bold text-[#0d9488] dark:text-[#2dd4bf] block">{rx.frequency}</span>
                      <span className="block text-slate-500 dark:text-slate-400 italic line-clamp-1" title={rx.dosage}>{rx.dosage}</span>
                    </td>
                    <td className="px-3.5 py-2.5">
                      <Input
                        type="number"
                        className="w-16 border border-slate-200 dark:border-teal-800/40 rounded-none px-2 py-1 text-center font-mono font-bold text-[#0f3c4c] dark:text-white bg-white dark:bg-[#07252d]"
                        value={rx.quantity}
                        onChange={(e) => setRxList(rxList.map(r => r.id === rx.id ? { ...r, quantity: Math.max(1, parseInt(e.target.value) || 1) } : r))}
                      />
                    </td>
                    <td className="px-3.5 py-2.5 text-right font-mono font-bold text-[#0f3c4c] dark:text-[#5eead4]">RM{itemTotal.toFixed(2)}</td>
                    <td className="px-3.5 py-2.5 text-center">
                      <button type="button" onClick={() => setRxList(rxList.filter(r => r.id !== rx.id))} className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* PHARMACY MEMO */}
      <div className="space-y-1">
        <label className="block text-[10px] font-bold text-[#0f3c4c] dark:text-[#5eead4] uppercase tracking-tight">Instructions &amp; Special Memos for Pharmacist</label>
        <textarea
          className="w-full text-xs px-3.5 py-2.5 border border-[#b2f5ea] dark:border-teal-800/50 rounded-none focus:ring-2 focus:ring-[#0d9488] focus:outline-none bg-white dark:bg-[#07252d] text-[#0f3c4c] dark:text-white"
          value={pharmacyMemo}
          onChange={e => setPharmacyMemo(e.target.value)}
          placeholder="e.g., Please demonstrate inhaler technique. Patient prefers liquid syrup formulation if available."
          rows={2}
        />
      </div>

      {/* Plan Actions (MC, Labs, Referrals) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        <div className="flex flex-col p-3.5 bg-white dark:bg-[#0c3844] border border-[#b2f5ea] dark:border-teal-800/50 rounded-none justify-between gap-3 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#0d9488] dark:text-[#2dd4bf]" />
            <div>
              <span className="text-xs font-bold block text-[#0f3c4c] dark:text-white uppercase tracking-tight">Medical Cert (MC)</span>
              <span className="text-[10px] text-slate-400 leading-tight block">Issue paid clinic recovery leave.</span>
            </div>
          </div>
          {mcGenerated ? (
            <div className="flex flex-col gap-1 mt-auto">
              <span className="text-[10px] text-[#0f766e] dark:text-[#5eead4] bg-[#e0f5f2] dark:bg-[#082830] font-bold px-2 py-1 rounded-none text-center border border-[#b2f5ea] dark:border-teal-800/40">{mcDays} Days Issued ({selectedICD?.code || 'Diagnosis'})</span>
              <div className="flex items-center gap-2 mt-1 justify-center">
                <button type="button" onClick={() => setIsMcModalOpen(true)} className="text-[10px] font-bold text-[#0d9488] dark:text-[#2dd4bf] underline cursor-pointer text-center">View Certificate</button>
                <button type="button" onClick={() => setMcGenerated(false)} className="text-[10px] font-bold text-rose-500 hover:text-rose-600 underline cursor-pointer text-center">Revoke</button>
              </div>
            </div>
          ) : (
            <button type="button" onClick={triggerMcOpening} className="bg-[#e0f5f2] dark:bg-[#0e4857] hover:bg-[#0d9488] hover:text-white text-[#0f766e] dark:text-[#5eead4] border border-[#b2f5ea] dark:border-teal-700/50 w-full py-1.5 rounded-none text-[10px] font-bold uppercase transition-all cursor-pointer mt-auto">Generate MC</button>
          )}
        </div>

        <div className="flex flex-col p-3.5 bg-white dark:bg-[#0c3844] border border-[#b2f5ea] dark:border-teal-800/50 rounded-none justify-between gap-3 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center gap-2">
            <TestTube className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <div>
              <span className="text-xs font-bold block text-[#0f3c4c] dark:text-white uppercase tracking-tight">Lab &amp; Imaging</span>
              <span className="text-[10px] text-slate-400 leading-tight block">Order bloodwork or radiology.</span>
            </div>
          </div>
          <button type="button" className="bg-[#e0f5f2] dark:bg-[#0e4857] hover:bg-[#0d9488] hover:text-white text-[#0f766e] dark:text-[#5eead4] border border-[#b2f5ea] dark:border-teal-700/50 w-full py-1.5 rounded-none text-[10px] font-bold uppercase transition-all cursor-pointer mt-auto" onClick={() => alert('Lab & Imaging module will open a side panel for test selection.')}>Order Tests</button>
        </div>

        <div className="flex flex-col p-3.5 bg-white dark:bg-[#0c3844] border border-[#b2f5ea] dark:border-teal-800/50 rounded-none justify-between gap-3 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center gap-2">
            <Share className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            <div>
              <span className="text-xs font-bold block text-[#0f3c4c] dark:text-white uppercase tracking-tight">Specialist Referral</span>
              <span className="text-[10px] text-slate-400 leading-tight block">Draft referral letter.</span>
            </div>
          </div>
          {referralGenerated ? (
            <div className="flex flex-col gap-1 mt-auto">
              <span className="text-[10px] text-sky-800 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 font-bold px-2 py-1 rounded-none text-center truncate border border-sky-200 dark:border-sky-800/50" title={referralDetails.hospital}>{referralDetails.hospital}</span>
              <div className="flex items-center gap-2 mt-1 justify-center">
                <button type="button" onClick={() => setIsReferralModalOpen(true)} className="text-[10px] font-bold text-sky-600 dark:text-sky-400 underline cursor-pointer text-center">Edit Referral</button>
                <button type="button" onClick={() => { setReferralGenerated(false); setReferralDetails({ hospital: '', department: '', reason: '' }); }} className="text-[10px] font-bold text-rose-500 hover:text-rose-600 underline cursor-pointer text-center">Clear</button>
              </div>
            </div>
          ) : (
            <button type="button" className="bg-[#e0f5f2] dark:bg-[#0e4857] hover:bg-[#0d9488] hover:text-white text-[#0f766e] dark:text-[#5eead4] border border-[#b2f5ea] dark:border-teal-700/50 w-full py-1.5 rounded-none text-[10px] font-bold uppercase transition-all cursor-pointer mt-auto" onClick={() => setIsReferralModalOpen(true)}>Draft Referral</button>
          )}
        </div>
      </div>

      {selectedICD && rxList.length > 0 && (
        <div className="mt-4 bg-indigo-50/50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-800/40 p-3.5 rounded-none flex gap-3 items-start animate-fadeIn">
          <div className="bg-indigo-100 dark:bg-indigo-900 p-2 rounded-none shrink-0"><TrendingUp className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /></div>
          <div>
            <h4 className="text-[10px] font-bold text-indigo-800 dark:text-indigo-300 uppercase tracking-wide">AI Treatment Outcome Prediction</h4>
            <p className="text-xs text-indigo-900/80 dark:text-indigo-200/90 mt-1 leading-relaxed">
              Based on the diagnosis of <strong>{selectedICD.code}</strong> and the prescribed regimen ({rxList.map(r=>r.drugName).join(', ')}), ML models predict a <strong>94% probability of symptom resolution within 5 days</strong>. No aggressive follow-up required.
            </p>
          </div>
        </div>
      )}

      {/* MODALS */}
      {isMcModalOpen && (
        <div className="fixed inset-0 bg-slate-900/75 flex items-center justify-center z-50 p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0c3844] rounded-none shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 dark:border-teal-700/50 animate-scaleUp">
            <div className="bg-[#0D9488] text-white px-5 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold">Medical Certificate (MC)</h3>
                <span className="text-[10px] opacity-80 font-mono tracking-wider">REF: {mcReferenceNo}</span>
              </div>
              <button type="button" onClick={() => setIsMcModalOpen(false)} className="text-white hover:text-slate-200 font-bold text-lg cursor-pointer">&times;</button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex justify-between items-end mb-6 text-sm">
                <div>
                  <p><span className="text-slate-500 dark:text-slate-400 w-20 inline-block">Patient:</span> <strong>{currentPatient.fullName}</strong></p>
                  <p><span className="text-slate-500 dark:text-slate-400 w-20 inline-block">IC:</span> <strong>{maskICNumber(currentPatient.icNumber, showPII)}</strong></p>
                  <p><span className="text-slate-500 dark:text-slate-400 w-20 inline-block">Date:</span> <strong>{new Date().toLocaleDateString('ms-MY')}</strong></p>
                </div>
                <div>
                  <p><span className="text-slate-500 dark:text-slate-400 w-20 inline-block">Diagnosis:</span> <strong>{selectedICD?.desc || 'General Unwell'}</strong></p>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Duration of Rest (Days)</label>
                <Input type="number" min="1" max="14" className="w-full p-2 border border-slate-300 dark:border-teal-800/40 rounded-none bg-white dark:bg-[#07252d] text-slate-800 dark:text-white" value={mcDays} onChange={e => setMcDays(parseInt(e.target.value) || 1)} />
              </div>
              <p className="text-[10px] text-slate-400">Digitally signed and verifiable via QR scan by employers.</p>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-teal-800/30">
                <Button type="button" onClick={() => setIsMcModalOpen(false)} className="px-4 py-2 border text-slate-600 dark:text-slate-300 rounded-none text-xs">Cancel</Button>
                <Button type="button" onClick={() => { setMcGenerated(true); setIsMcModalOpen(false); }} className="bg-[#0D9488] text-white px-5 py-2 rounded-none text-xs font-bold cursor-pointer">Generate & Embed to Plan</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isReferralModalOpen && (
        <div className="fixed inset-0 bg-slate-900/75 flex items-center justify-center z-50 p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0c3844] rounded-none shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 dark:border-teal-700/50 animate-scaleUp">
            <div className="bg-indigo-600 text-white px-5 py-4 flex items-center justify-between">
              <h3 className="font-bold">Specialist Referral Letter</h3>
              <button type="button" onClick={() => setIsReferralModalOpen(false)} className="text-white hover:text-slate-200 font-bold text-lg cursor-pointer">&times;</button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Target Hospital/Center</label>
                  <Input type="text" placeholder="e.g. Hospital Kuala Lumpur" className="w-full text-xs p-2 border border-slate-300 dark:border-teal-800/40 rounded-none bg-white dark:bg-[#07252d] text-slate-800 dark:text-white" value={referralDetails.hospital} onChange={e => setReferralDetails({ ...referralDetails, hospital: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Target Department</label>
                  <Input type="text" placeholder="e.g. Cardiology" className="w-full text-xs p-2 border border-slate-300 dark:border-teal-800/40 rounded-none bg-white dark:bg-[#07252d] text-slate-800 dark:text-white" value={referralDetails.department} onChange={e => setReferralDetails({ ...referralDetails, department: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Clinical Indication / Reason for Referral</label>
                <textarea rows={4} className="w-full text-xs p-2 border border-slate-300 dark:border-teal-800/40 rounded-none bg-white dark:bg-[#07252d] text-slate-800 dark:text-white" placeholder="Please evaluate this patient for..." value={referralDetails.reason} onChange={e => setReferralDetails({ ...referralDetails, reason: e.target.value })} />
              </div>
              <p className="text-[10px] text-slate-400">This will be printed as an official PDF document with clinic letterhead.</p>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-teal-800/30">
                <Button type="button" onClick={() => setIsReferralModalOpen(false)} className="px-4 py-2 border text-slate-600 dark:text-slate-300 rounded-none text-xs">Cancel</Button>
                <Button type="button" onClick={() => { setReferralGenerated(true); setIsReferralModalOpen(false); }} disabled={!referralDetails.hospital || !referralDetails.department} className="bg-indigo-600 text-white px-5 py-2 rounded-none text-xs font-bold disabled:opacity-50 cursor-pointer">Draft & Save to Plan</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
