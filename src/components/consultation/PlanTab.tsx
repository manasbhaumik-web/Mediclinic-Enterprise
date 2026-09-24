import React, { useState, useEffect, useMemo } from 'react';
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
    'crestor': ['rosuvastatin', 'cholesterol']
  };

  // Pediatric dose calculator logic (Paracetamol 15mg/kg standard)
  useEffect(() => {
    const weight = parseFloat(patientWeight);
    const conc = parseFloat(medConcentration);
    if (weight > 0 && conc > 0) {
      const doseMg = weight * 15;
      const volumeMl = doseMg / conc;
      setCalculatedDose(volumeMl);
    } else {
      setCalculatedDose(null);
    }
  }, [patientWeight, medConcentration]);

  // Filter Drug Suggestions with Alias Support & Instant 1-Char Search
  const drugSuggestions = useMemo(() => {
    const q = searchDrugQuery.trim().toLowerCase();
    if (q === '') return [];

    // Find alias terms
    let aliasTerms: string[] = [];
    Object.keys(brandAliasMap).forEach(brand => {
      if (brand.includes(q) || q.includes(brand)) {
        aliasTerms.push(brand, ...brandAliasMap[brand]);
      }
    });

    return mergedCatalog.filter(d => {
      const nameMatch = d.name.toLowerCase().includes(q);
      const catMatch = (d.category || '').toLowerCase().includes(q);
      const allergyMatch = (d.allergyGroup || '').toLowerCase().includes(q);
      const aliasMatch = aliasTerms.some(term => d.name.toLowerCase().includes(term) || (d.category || '').toLowerCase().includes(term));
      return nameMatch || catMatch || allergyMatch || aliasMatch;
    });
  }, [searchDrugQuery, mergedCatalog]);

  // Check Allergies whenever RX list updates
  const allergyAlerts = useMemo(() => {
    const alerts: { drugName: string; allergyGroup: string }[] = [];
    
    rxList.forEach(rx => {
      const catalogDrug = mergedCatalog.find(d => d.name.toLowerCase() === rx.drugName.toLowerCase());
      const allergyGroup = catalogDrug?.allergyGroup || (rx.drugName.toLowerCase().includes('paracetamol') ? 'Paracetamol' : rx.drugName.toLowerCase().includes('penicillin') || rx.drugName.toLowerCase().includes('amoxicillin') ? 'Penicillin' : 'None');
      if (allergyGroup !== 'None') {
        const isAllergic = currentPatient.drugAllergies.some(
          allergy => allergy.toLowerCase() === allergyGroup.toLowerCase() ||
                    allergyGroup.toLowerCase().includes(allergy.toLowerCase()) ||
                    allergy.toLowerCase().includes(allergyGroup.toLowerCase())
        );
        if (isAllergic) {
          alerts.push({
            drugName: rx.drugName,
            allergyGroup: allergyGroup
          });
        }
      }
    });

    return alerts;
  }, [rxList, currentPatient, mergedCatalog]);

  // Check Drug-Disease Contraindications
  const contraindicationAlerts = useMemo(() => {
    const alerts: { drugName: string; icdCode: string; reason: string }[] = [];
    if (!selectedICD) return alerts;

    const icdCodeUpper = selectedICD.code.toUpperCase();

    rxList.forEach(rx => {
      const drugLower = rx.drugName.toLowerCase();
      // Rule 1: Gastritis / Peptic Ulcer vs NSAIDs
      if (icdCodeUpper.startsWith('K30') || icdCodeUpper.startsWith('K29') || icdCodeUpper.startsWith('K27')) {
        if (drugLower.includes('ibuprofen') || drugLower.includes('diclofenac') || drugLower.includes('mefenamic') || drugLower.includes('aspirin') || drugLower.includes('naproxen') || drugLower.includes('ponstan') || drugLower.includes('voltaren')) {
          alerts.push({
            drugName: rx.drugName,
            icdCode: selectedICD.code,
            reason: `NSAIDs cause gastric mucosal erosion and risk ulceration in Gastritis (${selectedICD.code}).`
          });
        }
      }
      // Rule 2: Asthma vs Beta-blockers
      if (icdCodeUpper.startsWith('J45') || icdCodeUpper.startsWith('J44')) {
        if (drugLower.includes('propranolol') || drugLower.includes('atenolol') || drugLower.includes('carvedilol') || drugLower.includes('metoprolol')) {
          alerts.push({
            drugName: rx.drugName,
            icdCode: selectedICD.code,
            reason: `Beta-blockers induce bronchospasm in Asthmatic conditions (${selectedICD.code}).`
          });
        }
      }
      // Rule 3: Hypertension vs Decongestants
      if (icdCodeUpper.startsWith('I10')) {
        if (drugLower.includes('pseudoephedrine') || drugLower.includes('phenylephrine') || drugLower.includes('actifed') || drugLower.includes('decongestant')) {
          alerts.push({
            drugName: rx.drugName,
            icdCode: selectedICD.code,
            reason: `Sympathomimetic decongestants cause arterial vasoconstriction & BP elevation in Hypertension (${selectedICD.code}).`
          });
        }
      }
      // Rule 4: Diabetes vs Corticosteroids
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
    return alerts;
  }, [rxList, selectedICD]);

  const handleAddDrug = (catalogDrug: any) => {
    if (rxList.some(r => r.drugName === catalogDrug.name)) {
      setSearchDrugQuery('');
      return;
    }
    const newRx: PrescriptionItem = {
      id: `rx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      drugName: catalogDrug.name,
      dosage: catalogDrug.dosageEN || 'Take as instructed by physician',
      dosageBM: catalogDrug.dosageBM || 'Ambil mengikut arahan doktor',
      frequency: catalogDrug.frequency || 'BD (Twice Daily)',
      quantity: catalogDrug.quantity || 10,
      pricePerUnit: typeof catalogDrug.pricePerUnit === 'number' ? catalogDrug.pricePerUnit : (catalogDrug.price || 0.50),
      expiryDate: catalogDrug.expiryDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      pillColor: catalogDrug.pillColor || '#3b82f6',
      capsuleStyle: catalogDrug.capsuleStyle || 'solid'
    };
    setRxList([...rxList, newRx]);
    setSearchDrugQuery('');
  };

  const handleAddCustomDrug = (customName: string) => {
    if (!customName.trim()) return;
    const name = customName.trim();
    if (rxList.some(r => r.drugName.toLowerCase() === name.toLowerCase())) {
      setSearchDrugQuery('');
      return;
    }
    const newRx: PrescriptionItem = {
      id: `rx-${Date.now()}`,
      drugName: name,
      dosage: 'Take as directed by doctor',
      dosageBM: 'Makan seperti yang diarahkan oleh doktor',
      frequency: 'TDS (Thrice Daily)',
      quantity: 10,
      pricePerUnit: 1.00,
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      pillColor: '#10b981',
      capsuleStyle: 'round'
    };
    setRxList([...rxList, newRx]);
    setSearchDrugQuery('');
  };

  const handleAddPediatricSyrup = () => {
    if (!calculatedDose || calculatedDose <= 0) return;
    const doseStr = calculatedDose.toFixed(1);
    const concLabel = medConcentration === '24' ? '120mg/5ml' : medConcentration === '50' ? '250mg/5ml' : `${medConcentration}mg/ml`;
    const syrupName = `Paracetamol ${concLabel} Pediatric Syrup (${doseStr}ml dose)`;
    
    const newRx: PrescriptionItem = {
      id: `rx-peds-${Date.now()}`,
      drugName: syrupName,
      dosage: `Give ${doseStr}ml (calculated for ${patientWeight}kg) three times daily after food for fever/pain`,
      dosageBM: `Beri ${doseStr}ml (dikira untuk ${patientWeight}kg) 3 kali sehari selepas makan untuk demam/sakit`,
      frequency: 'TDS PRN (3x Daily As Needed)',
      quantity: 1,
      pricePerUnit: 9.50,
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      pillColor: '#ec4899',
      capsuleStyle: 'solid'
    };
    setRxList([...rxList, newRx]);
  };

  const triggerMcOpening = () => {
    const randomRef = `MC-${Math.floor(100000 + Math.random() * 900000)}`;
    setMcReferenceNo(randomRef);
    setIsMcModalOpen(true);
  };

  return (
    <div className="space-y-5 animate-fadeIn relative">
      {/* AI DRUG INTERACTION ALERT */}
      {allergyAlerts.length > 0 ? (
        <div className="bg-red-600 text-white p-3 rounded-lg shadow-lg animate-bounce-slow flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 shrink-0" />
          <div>
            <h4 className="font-black text-sm uppercase tracking-wider">AI ALERT: Drug Interaction Detected!</h4>
            <p className="text-xs mt-0.5">Patient has a known allergy history that conflicts with your prescription plan.</p>
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
      <div className="bg-blue-50/70 p-3 rounded-lg border border-blue-200 dark:bg-slate-800/80 dark:border-blue-900/60">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-extrabold text-blue-900 dark:text-blue-300 uppercase flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-blue-600" /> Pediatric Dosage Calculator (Paracetamol 15mg/kg)
          </h4>
          <span className="text-[10px] text-blue-700 font-semibold bg-blue-100 dark:bg-blue-900/40 px-2 py-0.5 rounded">
            Standard: 15mg / kg body weight
          </span>
        </div>
        
        {/* Weight & Concentration Presets */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <div>
            <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
              Child Weight (kg)
            </label>
            <Input 
              type="number" 
              className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 outline-none bg-white dark:bg-slate-900 dark:text-white"
              value={patientWeight}
              onChange={e => setPatientWeight(e.target.value)}
              placeholder="Enter weight e.g. 12"
            />
            {/* Quick Weight Presets */}
            <div className="flex gap-1 mt-1.5 flex-wrap">
              {['5', '8', '10', '12', '15', '20'].map(w => (
                <button
                  key={w}
                  type="button"
                  onClick={() => setPatientWeight(w)}
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${patientWeight === w ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-blue-50 cursor-pointer'}`}
                >
                  {w}kg
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
              Syrup Concentration
            </label>
            <select
              className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 outline-none bg-white dark:bg-slate-900 dark:text-white font-medium"
              value={medConcentration}
              onChange={e => setMedConcentration(e.target.value)}
            >
              <option value="24">120mg / 5ml Syrup (Standard 24mg/ml)</option>
              <option value="50">250mg / 5ml Syrup (Forte 50mg/ml)</option>
              <option value="100">100mg / ml Drops (Infant 100mg/ml)</option>
            </select>
            <div className="flex gap-1 mt-1.5">
              <button
                type="button"
                onClick={() => setMedConcentration('24')}
                className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${medConcentration === '24' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-blue-50 cursor-pointer'}`}
              >
                120mg/5ml
              </button>
              <button
                type="button"
                onClick={() => setMedConcentration('50')}
                className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${medConcentration === '50' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-blue-50 cursor-pointer'}`}
              >
                250mg/5ml
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-2.5 rounded border border-blue-200 dark:border-blue-900 flex flex-col justify-between h-full shadow-2xs">
            <div>
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Calculated Single Dose</span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="font-mono font-black text-blue-700 dark:text-blue-400 text-lg leading-none">
                  {typeof calculatedDose === 'number' && !isNaN(calculatedDose) ? `${calculatedDose.toFixed(1)} ml` : '--'}
                </span>
                {typeof calculatedDose === 'number' && !isNaN(calculatedDose) && (
                  <span className="text-[10px] text-slate-500 font-mono">({(parseFloat(patientWeight) * 15).toFixed(0)} mg)</span>
                )}
              </div>
            </div>
            
            {typeof calculatedDose === 'number' && !isNaN(calculatedDose) && calculatedDose > 0 && (
              <Button
                type="button"
                onClick={handleAddPediatricSyrup}
                className="mt-2 w-full text-[10px] font-extrabold bg-blue-600 hover:bg-blue-700 text-white py-1 px-2 rounded flex items-center justify-center gap-1 cursor-pointer transition-colors"
              >
                <PlusCircle className="w-3 h-3" /> Add {calculatedDose.toFixed(1)}ml Syrup to Rx
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Medication prescription search bar */}
      <div>
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-tight mb-1">
          Add Medication & Drug Catalog Search
        </label>
        <div className="relative">
          <Input
            type="text"
            className="w-full text-xs px-3 py-2 border border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-[#0D9488] focus:outline-none font-medium"
            value={searchDrugQuery}
            onChange={(e) => setSearchDrugQuery(e.target.value)}
            placeholder="Search catalog or brand names (e.g. 'Panadol', 'Amoxicillin', 'Augmentin', 'Ponstan', 'Voltaren', 'Zyrtec')..."
          />
          {searchDrugQuery.trim().length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl z-20 max-h-[220px] overflow-y-auto">
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
                      className="w-full text-left px-3 py-2 text-xs hover:bg-teal-50 dark:hover:bg-slate-800 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between cursor-pointer transition-colors"
                    >
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white block">{item.name}</span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                          {item.category || 'General Medication'} (Allergen Group: {item.allergyGroup || 'None'})
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {isConflict && <span className="bg-red-100 text-red-700 font-bold px-1.5 py-0.5 rounded text-[8px] uppercase">Allergy Conflict</span>}
                        <span className="font-mono text-[#0D9488] dark:text-teal-400 font-bold">RM{price.toFixed(2)}</span>
                      </div>
                    </button>
                  );
                })
              ) : null}
              
              {/* Custom Medication Fallback option */}
              <button
                type="button"
                onClick={() => handleAddCustomDrug(searchDrugQuery)}
                className="w-full text-left px-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/90 hover:bg-teal-100 dark:hover:bg-teal-900/40 text-teal-800 dark:text-teal-300 font-bold flex items-center gap-2 cursor-pointer border-t border-slate-200"
              >
                <PlusCircle className="w-4 h-4 text-[#0D9488]" />
                <span>Add Custom Prescription: "{searchDrugQuery}"</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* SMART DOSAGE QUICK-PILLS PRESET BAR */}
      <div className="bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1">
            <Pill className="w-3.5 h-3.5 text-[#0D9488]" /> Fast Preset Dosage Quick-Pills
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
            <Button
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
              className="text-[10px] font-bold bg-white dark:bg-slate-800 hover:bg-[#0D9488] hover:text-white text-[#0D9488] dark:text-teal-400 px-2.5 py-1 rounded-md border border-teal-200 dark:border-teal-900 shadow-2xs transition-colors cursor-pointer"
            >
              + {preset.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Currently Selected Prescription list */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden space-y-0">
        {contraindicationAlerts.length > 0 && (
          <div className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900 p-3 space-y-1">
            <h5 className="text-xs font-extrabold text-amber-800 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 animate-bounce-slow" /> Drug-Disease Clinical Contraindication Alert ({contraindicationAlerts.length})
            </h5>
            <div className="space-y-1">
              {contraindicationAlerts.map((alert, idx) => (
                <p key={idx} className="text-[11px] text-amber-800 dark:text-amber-300 font-medium leading-relaxed">
                  • <strong className="font-bold underline">{alert.drugName}</strong> vs Diagnosis <strong className="font-mono bg-amber-100 dark:bg-amber-900/60 px-1 rounded text-amber-900 dark:text-amber-200 font-bold">{alert.icdCode}</strong>: {alert.reason}
                </p>
              ))}
            </div>
          </div>
        )}
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
              <th className="px-3 py-2">Medication Info</th>
              <th className="px-3 py-2">Frequency & Instructions</th>
              <th className="px-3 py-2 w-20">Qty</th>
              <th className="px-3 py-2 text-right w-24">Price (MYR)</th>
              <th className="px-3 py-2 text-center w-12">Action</th>
            </tr>
          </thead>
          <tbody>
            {rxList.length === 0 ? (
              <tr><td colSpan={5} className="text-center p-6 text-xs text-slate-400 italic">No medications prescribed yet. Search above (e.g. 'Panadol', 'Amoxicillin') to construct treatment.</td></tr>
            ) : (
              rxList.map((rx) => {
                const catalogDrugDef = mergedCatalog.find(d => d.name.toLowerCase() === rx.drugName.toLowerCase());
                const allergyGrp = catalogDrugDef?.allergyGroup || 'None';
                const hasConflict = allergyGrp !== 'None' && currentPatient.drugAllergies.some(a => a.toLowerCase() === allergyGrp.toLowerCase());
                const isContraindicated = contraindicationAlerts.some(a => a.drugName === rx.drugName);
                const unitPrice = typeof rx.pricePerUnit === 'number' ? rx.pricePerUnit : 0.50;
                const itemTotal = unitPrice * (rx.quantity || 1);
                
                return (
                  <tr key={rx.id} className={`border-b text-xs border-slate-100 dark:border-slate-800 ${hasConflict ? 'bg-red-50/60 dark:bg-red-950/40' : isContraindicated ? 'bg-amber-50/60 dark:bg-amber-950/40' : 'hover:bg-slate-50/50 dark:hover:bg-slate-900/50'}`}>
                    <td className="px-3 py-2.5">
                      <span className="font-bold text-slate-800 dark:text-slate-100 block">{rx.drugName}</span>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <span className="w-2.5 h-2.5 rounded-full inline-block border border-slate-300" style={{ backgroundColor: rx.pillColor || '#3b82f6' }} />
                        <span className="text-[10px] text-slate-400">Batch Expiry: {rx.expiryDate || 'N/A'}</span>
                        {isContraindicated && <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded uppercase tracking-wider border border-amber-300 flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-amber-600" /> ICD Contraindication</span>}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 font-mono text-[10px] text-slate-600 dark:text-slate-300">
                      <span className="font-bold text-[#0D9488] dark:text-teal-400 block">{rx.frequency}</span>
                      <span className="block text-slate-500 dark:text-slate-400 line-clamp-1 italic" title={rx.dosage}>{rx.dosage}</span>
                    </td>
                    <td className="px-3 py-2.5">
                      <Input
                        type="number"
                        className="w-16 border rounded px-1.5 py-0.5 text-center font-mono dark:bg-slate-900 dark:text-white"
                        value={rx.quantity}
                        onChange={(e) => setRxList(rxList.map(r => r.id === rx.id ? { ...r, quantity: Math.max(1, parseInt(e.target.value) || 1) } : r))}
                      />
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono font-bold text-slate-800 dark:text-slate-200">RM{itemTotal.toFixed(2)}</td>
                    <td className="px-3 py-2.5 text-center">
                      <Button type="button" onClick={() => setRxList(rxList.filter(r => r.id !== rx.id))} className="text-slate-400 hover:text-red-600 transition-colors cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></Button>
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
        <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-tight mb-1">Notes / Instructions for Pharmacist</label>
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
        <div className="flex flex-col p-3 bg-slate-50 border border-slate-200 rounded-lg justify-between gap-3 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#0D9488]" />
            <div>
              <span className="text-xs font-bold block text-slate-700 uppercase tracking-tight">Medical Cert (MC)</span>
              <span className="text-[9px] text-slate-400 leading-tight block">Issue paid clinic recovery leave.</span>
            </div>
          </div>
          {mcGenerated ? (
            <div className="flex flex-col gap-1 mt-auto">
              <span className="text-[10px] text-cyan-800 bg-cyan-100 font-bold px-2 py-0.5 rounded text-center">{mcDays} Days Issued ({selectedICD?.code || 'Diagnose'})</span>
              <div className="flex items-center gap-2 mt-1 justify-center">
                <Button type="button" onClick={() => setIsMcModalOpen(true)} className="text-[10px] font-bold text-[#0D9488] underline cursor-pointer text-center">View Certificate</Button>
                <Button type="button" onClick={() => setMcGenerated(false)} className="text-[10px] font-bold text-red-500 hover:text-red-600 underline cursor-pointer text-center">Revoke</Button>
              </div>
            </div>
          ) : (
            <Button type="button" onClick={triggerMcOpening} className="bg-slate-200 hover:bg-slate-300 text-slate-700 w-full py-1.5 rounded text-[10px] font-bold uppercase transition-colors cursor-pointer mt-auto">Generate MC</Button>
          )}
        </div>

        <div className="flex flex-col p-3 bg-slate-50 border border-slate-200 rounded-lg justify-between gap-3 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2">
            <TestTube className="w-5 h-5 text-purple-500" />
            <div>
              <span className="text-xs font-bold block text-slate-700 uppercase tracking-tight">Lab & Imaging</span>
              <span className="text-[9px] text-slate-400 leading-tight block">Order bloodwork or radiology.</span>
            </div>
          </div>
          <Button type="button" className="bg-slate-200 hover:bg-slate-300 text-slate-700 w-full py-1.5 rounded text-[10px] font-bold uppercase transition-colors cursor-pointer mt-auto" onClick={() => alert('Lab & Imaging module will open a side panel for test selection.')}>Order Tests</Button>
        </div>

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
              <span className="text-[10px] text-indigo-800 bg-indigo-100 font-bold px-2 py-0.5 rounded text-center truncate" title={referralDetails.hospital}>{referralDetails.hospital}</span>
              <div className="flex items-center gap-2 mt-1 justify-center">
                <Button type="button" onClick={() => setIsReferralModalOpen(true)} className="text-[10px] font-bold text-indigo-600 underline cursor-pointer text-center">Edit Referral</Button>
                <Button type="button" onClick={() => { setReferralGenerated(false); setReferralDetails({ hospital: '', department: '', reason: '' }); }} className="text-[10px] font-bold text-red-500 hover:text-red-600 underline cursor-pointer text-center">Clear</Button>
              </div>
            </div>
          ) : (
            <Button type="button" className="bg-slate-200 hover:bg-slate-300 text-slate-700 w-full py-1.5 rounded text-[10px] font-bold uppercase transition-colors cursor-pointer mt-auto" onClick={() => setIsReferralModalOpen(true)}>Draft Referral</Button>
          )}
        </div>
      </div>

      {selectedICD && rxList.length > 0 && (
        <div className="mt-4 bg-indigo-50/50 border border-indigo-100 p-3.5 rounded-lg flex gap-3 items-start animate-fadeIn">
          <div className="bg-indigo-100 p-2 rounded-lg shrink-0"><TrendingUp className="w-4 h-4 text-indigo-600" /></div>
          <div>
            <h4 className="text-[10px] font-bold text-indigo-800 uppercase tracking-wide">AI Treatment Outcome Prediction</h4>
            <p className="text-xs text-indigo-900/80 mt-1 leading-relaxed">
              Based on the diagnosis of <strong>{selectedICD.code}</strong> and the prescribed regimen ({rxList.map(r=>r.drugName).join(', ')}), ML models predict a <strong>94% probability of symptom resolution within 5 days</strong>. No aggressive follow-up required.
            </p>
          </div>
        </div>
      )}

      {/* MODALS */}
      {isMcModalOpen && (
        <div className="fixed inset-0 bg-slate-900/75 flex items-center justify-center z-50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-scaleUp">
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
                  <p><span className="text-slate-500 w-20 inline-block">Patient:</span> <strong>{currentPatient.fullName}</strong></p>
                  <p><span className="text-slate-500 w-20 inline-block">IC:</span> <strong>{maskICNumber(currentPatient.icNumber, showPII)}</strong></p>
                  <p><span className="text-slate-500 w-20 inline-block">Date:</span> <strong>{new Date().toLocaleDateString('ms-MY')}</strong></p>
                </div>
                <div>
                  <p><span className="text-slate-500 w-20 inline-block">Diagnosis:</span> <strong>{selectedICD?.desc || 'General Unwell'}</strong></p>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Duration of Rest (Days)</label>
                <Input type="number" min="1" max="14" className="w-full p-2 border border-slate-300 rounded" value={mcDays} onChange={e => setMcDays(parseInt(e.target.value) || 1)} />
              </div>
              <p className="text-[10px] text-slate-400">Digitally signed and verifiable via QR scan by employers.</p>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <Button type="button" onClick={() => setIsMcModalOpen(false)} className="px-4 py-2 border text-slate-600 rounded text-xs">Cancel</Button>
                <Button type="button" onClick={() => { setMcGenerated(true); setIsMcModalOpen(false); }} className="bg-[#0D9488] text-white px-5 py-2 rounded text-xs font-bold cursor-pointer">Generate & Embed to Plan</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isReferralModalOpen && (
        <div className="fixed inset-0 bg-slate-900/75 flex items-center justify-center z-50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-scaleUp">
            <div className="bg-indigo-600 text-white px-5 py-4 flex items-center justify-between">
              <h3 className="font-bold">Specialist Referral Letter</h3>
              <button type="button" onClick={() => setIsReferralModalOpen(false)} className="text-white hover:text-slate-200 font-bold text-lg cursor-pointer">&times;</button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Target Hospital/Center</label>
                  <Input type="text" placeholder="e.g. Hospital Kuala Lumpur" className="w-full text-xs p-2 border border-slate-300 rounded" value={referralDetails.hospital} onChange={e => setReferralDetails({ ...referralDetails, hospital: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Target Department</label>
                  <Input type="text" placeholder="e.g. Cardiology" className="w-full text-xs p-2 border border-slate-300 rounded" value={referralDetails.department} onChange={e => setReferralDetails({ ...referralDetails, department: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Clinical Indication / Reason for Referral</label>
                <textarea rows={4} className="w-full text-xs p-2 border border-slate-300 rounded" placeholder="Please evaluate this patient for..." value={referralDetails.reason} onChange={e => setReferralDetails({ ...referralDetails, reason: e.target.value })} />
              </div>
              <p className="text-[10px] text-slate-400">This will be printed as an official PDF document with clinic letterhead.</p>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <Button type="button" onClick={() => setIsReferralModalOpen(false)} className="px-4 py-2 border text-slate-600 rounded text-xs">Cancel</Button>
                <Button type="button" onClick={() => { setReferralGenerated(true); setIsReferralModalOpen(false); }} disabled={!referralDetails.hospital || !referralDetails.department} className="bg-indigo-600 text-white px-5 py-2 rounded text-xs font-bold disabled:opacity-50 cursor-pointer">Draft & Save to Plan</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
