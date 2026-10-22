import { AlertTriangle } from 'lucide-react';
import Input from '../../ui/Input';
import { Patient } from '../../../types';

interface ContraindicationModalProps {
  currentPatient: Patient;
  pendingAllergyDrug: any;
  overrideRationale: string;
  setOverrideRationale: React.Dispatch<React.SetStateAction<string>>;
  setPendingAllergyDrug: React.Dispatch<any>;
  confirmAddDrug: (drug: any, rationale: string) => void;
}

export default function ContraindicationModal({ currentPatient, pendingAllergyDrug, overrideRationale, setOverrideRationale, setPendingAllergyDrug, confirmAddDrug }: ContraindicationModalProps) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white dark:bg-night-900 border-2 border-rose-600 max-w-lg w-full p-6 rounded-none space-y-4 shadow-2xl text-ink dark:text-white">
        <div className="flex items-center gap-3 text-rose-600">
          <AlertTriangle className="w-6 h-6 shrink-0" />
          <h3 className="type-heading-caps">CRITICAL DRUG CONTRAINDICATION ALERT</h3>
        </div>
        
        <div className="text-xs text-muted dark:text-slate-300 leading-relaxed font-medium space-y-2">
          <p>
            Patient <strong className="text-ink dark:text-teal-300">{currentPatient.fullName}</strong> has registered allergies matching <strong className="text-rose-600 uppercase underline font-bold">{pendingAllergyDrug.allergyGroup || pendingAllergyDrug.name}</strong>.
          </p>
          <div className="bg-rose-50 dark:bg-rose-950/60 p-3 border border-rose-200 dark:border-rose-800 font-mono text-2xs text-rose-900 dark:text-rose-200">
            <p><strong>Drug Class:</strong> {pendingAllergyDrug.allergyGroup || 'NSAID / Anti-inflammatory'}</p>
            <p><strong>Reaction History:</strong> {currentPatient.drugAllergies.join(', ') || 'Severe Bronchospasm & Urticaria'}</p>
          </div>
          <p>
            To prescribe <strong>{pendingAllergyDrug.name}</strong> anyway, you must document a valid clinical rationale for override.
          </p>
        </div>
    
        <div>
          <label className="block text-2xs font-bold uppercase text-subtle dark:text-slate-400 mb-1">
            Required Clinical Rationale for Override *
          </label>
          <Input
            type="text"
            value={overrideRationale}
            onChange={e => setOverrideRationale(e.target.value)}
            placeholder="e.g. Desensitization protocol active / benefit outweighs risk"
            className="w-full text-xs p-2 border border-slate-300 dark:border-teal-800/40 rounded-none focus:ring-2 focus:ring-rose-500 bg-white dark:bg-night-850 text-ink dark:text-white"
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
            className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-1.5 text-xs font-bold rounded-none disabled:opacity-50 cursor-pointer shadow-xs"
          >
            Confirm Override &amp; Add Drug
          </button>
        </div>
      </div>
    </div>
  );
}
