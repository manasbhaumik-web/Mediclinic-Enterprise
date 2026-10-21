import type { DrugItem } from '../../../context/InventoryContext';
import { Activity, X, Pill, Trash2 } from 'lucide-react';
import Input from '../../ui/Input';
import { buttonProps, focusRing } from '../../../lib/a11y';
import { PrescriptionItem } from '../../../types';

interface PrescriptionPanelProps {
  showPediatricCalc: boolean;
  patientAge: number;
  setShowPediatricCalc: React.Dispatch<React.SetStateAction<boolean>>;
  isPediatricPatient: boolean;
  patientWeight: string;
  setPatientWeight: React.Dispatch<React.SetStateAction<string>>;
  medConcentration: string;
  setMedConcentration: React.Dispatch<React.SetStateAction<string>>;
  calculatedDose: number;
  handleAddPediatricSyrup: () => void;
  searchDrugQuery: string;
  setSearchDrugQuery: React.Dispatch<React.SetStateAction<string>>;
  drugSuggestions: DrugItem[];
  handleAddDrug: (drug: any) => void;
  rxList: PrescriptionItem[];
  setRxList: React.Dispatch<React.SetStateAction<PrescriptionItem[]>>;
  pharmacyMemo: string;
  setPharmacyMemo: React.Dispatch<React.SetStateAction<string>>;
}

export default function PrescriptionPanel({ showPediatricCalc, patientAge, setShowPediatricCalc, isPediatricPatient, patientWeight, setPatientWeight, medConcentration, setMedConcentration, calculatedDose, handleAddPediatricSyrup, searchDrugQuery, setSearchDrugQuery, drugSuggestions, handleAddDrug, rxList, setRxList, pharmacyMemo, setPharmacyMemo }: PrescriptionPanelProps) {
  return (
    <div className="space-y-4 animate-fadeIn">
      
      {/* CONTEXT-AWARE PEDIATRIC DOSAGE CALCULATOR ASSIST */}
      {!showPediatricCalc ? (
        <div className="bg-surface-muted dark:bg-night-900 border border-line dark:border-teal-800/40 p-2.5 rounded-none flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-accent" />
            <span className="font-bold">Weight-Based Dosing Assist (Hidden for Adult Patient — Age {patientAge})</span>
          </div>
          <button
            type="button"
            onClick={() => setShowPediatricCalc(true)}
            className="text-2xs font-bold text-accent dark:text-teal-400 border border-line dark:border-teal-800/50 px-2.5 py-1 hover:bg-surface-accent cursor-pointer"
          >
            + Show Pediatric Dose Assist
          </button>
        </div>
      ) : (
        <div className="bg-surface-accent dark:bg-night-850 p-3.5 rounded-none border border-line dark:border-teal-800/50 shadow-xs space-y-2.5">
          <div className="flex items-center justify-between border-b border-line dark:border-teal-800/40 pb-2">
            <h4 className="type-label text-ink dark:text-teal-300 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-accent dark:text-teal-400" /> Pediatric Weight-Based Dosage Calculator
            </h4>
            <div className="flex items-center gap-2 font-mono text-2xs">
              <span className="bg-white dark:bg-night-900 text-accent dark:text-teal-300 px-2 py-0.5 border border-line">
                Triage Recorded Today
              </span>
              <span className="bg-white dark:bg-night-900 text-accent dark:text-teal-300 px-2 py-0.5 border border-line">
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
              <label className="block text-2xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                Patient Body Weight (kg)
              </label>
              <Input 
                type="number" 
                className="w-full text-xs px-3 py-1.5 border border-line dark:border-teal-800/40 rounded-none focus:ring-2 focus:ring-brand outline-none bg-white dark:bg-night-900 text-ink dark:text-white font-bold"
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
                    className={`text-2xs font-bold px-2 py-0.5 rounded-none border transition-all ${
                      patientWeight === w 
                        ? 'bg-primary text-white border-brand' 
                        : 'bg-white dark:bg-night-700 text-accent dark:text-teal-300 border-line dark:border-teal-700/50 hover:bg-surface-accent cursor-pointer'
                    }`}
                  >
                    {w}kg
                  </button>
                ))}
              </div>
            </div>
    
            <div>
              <label className="block text-2xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                Liquid Formulation Concentration
              </label>
              <select
                value={medConcentration}
                onChange={e => setMedConcentration(e.target.value)}
                className="w-full text-xs px-3 py-1.5 border border-line dark:border-teal-800/40 rounded-none focus:ring-2 focus:ring-brand outline-none bg-white dark:bg-night-900 text-ink dark:text-white font-bold"
              >
                <option value="24">120mg / 5ml (Standard Syrup)</option>
                <option value="50">250mg / 5ml (Forte Syrup)</option>
                <option value="100">100mg / 1ml (Infant Drops)</option>
              </select>
            </div>
    
            <div>
              {calculatedDose ? (
                <div className="bg-white dark:bg-night-900 border border-brand p-2 rounded-none text-center">
                  <span className="text-2xs text-slate-400 font-bold block uppercase">Recommended Single Dose</span>
                  <span className="text-sm font-mono font-bold text-accent dark:text-teal-400">
                    {calculatedDose.toFixed(1)} ml TDS
                  </span>
                  <button
                    type="button"
                    onClick={handleAddPediatricSyrup}
                    className="mt-1 w-full bg-primary hover:bg-primary-hover text-white font-bold text-2xs uppercase py-1 rounded-none transition-colors"
                  >
                    + Add Syrup to Rx List
                  </button>
                  <p className="text-2xs text-amber-700 dark:text-amber-300 font-bold mt-1.5 leading-tight">
                    ⚠️ Requires clinical verification by attending physician.
                  </p>
                </div>
              ) : (
                <div className="p-2.5 text-center text-slate-400 border border-dashed border-slate-300 dark:border-teal-800/40 text-2xs">
                  Enter child weight to calculate dose.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    
      {/* SEARCH DRUG CATALOG */}
      <div className="space-y-1.5">
        <label className="block text-xs font-bold text-ink dark:text-teal-300 uppercase tracking-tight">
          Prescribe Medication (Trade / Generic / Brand Search) <span className="text-rose-500">*</span>
        </label>
        <div className="relative">
          <Input 
            type="text"
            className="w-full text-xs px-3 py-2 border border-line dark:border-teal-800/50 rounded-none focus:ring-2 focus:ring-brand outline-none bg-white dark:bg-night-900 text-ink dark:text-white font-medium"
            value={searchDrugQuery}
            onChange={e => setSearchDrugQuery(e.target.value)}
            placeholder="Type medication name (e.g. Paracetamol, Panadol, Augmentin, Ponstan, Zyrtec)..."
          />
    
          {/* AUTOCOMPLETE DROPDOWN */}
          {drugSuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-30 bg-white dark:bg-night-900 border-2 border-brand shadow-xl max-h-60 overflow-y-auto rounded-none mt-1">
              {drugSuggestions.map(drug => (
                <div
                  key={drug.id}
                  {...buttonProps(() => handleAddDrug(drug))}
                  className={`p-2.5 border-b border-slate-100 dark:border-teal-800/30 hover:bg-surface-muted dark:hover:bg-night-800 cursor-pointer flex items-center justify-between text-xs transition-colors ${focusRing}`}
                >
                  <div>
                    <strong className="text-ink dark:text-teal-300 font-bold block">{drug.name}</strong>
                    <span className="text-2xs text-slate-500 dark:text-slate-400 font-medium">
                      Category: {drug.category} | Class: {drug.allergyGroup || 'General'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-accent dark:text-teal-400 block">
                      RM {(drug.pricePerUnit || 0.5).toFixed(2)}
                    </span>
                    <span className="text-2xs text-slate-400">Stock: {drug.currentStock || 100}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    
      {/* PRESCRIPTION LIST TABLE */}
      <div className="space-y-2">
        <h4 className="type-label text-ink dark:text-teal-300 flex items-center justify-between">
          <span>Active Prescription Items ({rxList.length})</span>
          {rxList.length > 0 && (
            <span className="text-slate-500 dark:text-slate-400 font-mono text-2xs font-normal">
              Subtotal: RM {(rxList.reduce((acc, r) => acc + ((r.pricePerUnit || 0.5) * (r.quantity || 1)), 0)).toFixed(2)}
            </span>
          )}
        </h4>
    
        {rxList.length === 0 ? (
          <div className="p-6 text-center bg-slate-50 dark:bg-night-850 border border-dashed border-slate-300 dark:border-teal-800/40 text-slate-400 text-xs">
            <Pill className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <span>No medication items added. Search above to add items to prescription plan.</span>
          </div>
        ) : (
          <div className="border border-line dark:border-teal-800/40 overflow-hidden rounded-none">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-surface-accent dark:bg-night-900 text-ink dark:text-teal-300 font-bold border-b border-line dark:border-teal-800/40">
                <tr>
                  <th className="p-2">Medication</th>
                  <th className="p-2">Dosage / Instructions</th>
                  <th className="p-2">Frequency</th>
                  <th className="p-2">Qty</th>
                  <th className="p-2 text-right font-mono">Price</th>
                  <th className="p-2 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-teal-800/30 bg-white dark:bg-night-850">
                {rxList.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-night-800 transition-colors">
                    <td className="p-2 font-bold text-ink dark:text-white">
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
        <label className="block text-xs font-bold text-ink dark:text-teal-300 uppercase mb-1">
          Internal Pharmacy Memo / Notes for Dispensing Pharmacist
        </label>
        <Input 
          type="text"
          className="w-full text-xs px-3 py-2 border border-line dark:border-teal-800/40 rounded-none bg-white dark:bg-night-900 text-ink dark:text-white"
          value={pharmacyMemo}
          onChange={e => setPharmacyMemo(e.target.value)}
          placeholder="e.g. Split tablets into half doses, patient requested original trade pack..."
        />
      </div>
    
    </div>
  );
}
