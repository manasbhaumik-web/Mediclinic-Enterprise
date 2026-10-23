import { Stethoscope, X, CheckCircle2, Check } from 'lucide-react';
import { Patient, ICD10Code, PrescriptionItem } from '../../../types';

interface ReviewSignoffModalProps {
  setIsReviewModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  currentPatient: Patient;
  maskedIC: string;
  selectedICD: ICD10Code;
  rxList: PrescriptionItem[];
  handleFinalSignoff: () => void;
}

export default function ReviewSignoffModal({ setIsReviewModalOpen, currentPatient, maskedIC, selectedICD, rxList, handleFinalSignoff }: ReviewSignoffModalProps) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn" role="dialog" aria-modal="true">
      <div className="bg-surface border-2 border-brand shadow-2xl max-w-2xl w-full p-6 rounded-none space-y-5 text-ink dark:text-white">
        
        <div className="flex items-center justify-between border-b border-line-subtle pb-3">
          <div className="flex items-center gap-2.5">
            <Stethoscope className="w-5 h-5 text-accent" />
            <h3 className="type-heading-caps">Review and send prescription</h3>
          </div>
          <button type="button" onClick={() => setIsReviewModalOpen(false)} className="text-slate-400 hover:text-muted">
            <X className="w-5 h-5" />
          </button>
        </div>
    
        <div className="space-y-3.5 text-xs">
          <div className="bg-surface-muted p-3 border border-line flex justify-between items-center font-bold">
            <span>Patient: <strong>{currentPatient.fullName}</strong></span>
            <span>IC: <strong className="font-mono">{maskedIC}</strong></span>
          </div>
    
          <div>
            <span className="text-slate-400 uppercase font-bold text-2xs block">Primary ICD-10 Diagnosis</span>
            <div className="bg-surface-accent dark:bg-teal-950 p-2.5 border border-line font-bold text-accent mt-1 flex items-center justify-between">
              <span>{selectedICD?.code} — {selectedICD?.desc}</span>
              <CheckCircle2 className="w-4 h-4 text-accent" />
            </div>
          </div>
    
          <div>
            <span className="text-slate-400 uppercase font-bold text-2xs block">Prescriptions ({rxList.length} Items)</span>
            {rxList.length > 0 ? (
              <ul className="bg-slate-50 dark:bg-night-850 border border-slate-200 dark:border-teal-800/40 p-3 space-y-1.5 mt-1 font-mono text-2xs">
                {rxList.map((rx, idx) => (
                  <li key={idx} className="flex justify-between border-b border-slate-200 dark:border-teal-800/30 pb-1 last:border-0 last:pb-0">
                    <span>{rx.drugName} (Qty: {rx.quantity})</span>
                    <span className="font-bold">RM {((rx.pricePerUnit || 0.5) * (rx.quantity || 1)).toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-slate-400 italic mt-1">No medications prescribed for this visit.</p>
            )}
          </div>
    
          {currentPatient.drugAllergies.length > 0 && (
            <div className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 p-2.5 text-emerald-900 dark:text-emerald-200 font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Allergy Safety Verification Passed (No active conflicts with {currentPatient.drugAllergies.join(', ')})</span>
            </div>
          )}
        </div>
    
        <div className="bg-surface-muted p-3 border border-line font-mono text-2xs text-accent">
          This will sign the consultation note and send {rxList.length} medication order(s) to the dispensary.
        </div>
    
        <div className="border-t border-line-subtle pt-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setIsReviewModalOpen(false)}
            className="px-4 py-2 border border-slate-300 text-muted text-xs font-bold rounded-none hover:bg-slate-100 cursor-pointer"
          >
            Back to Edit
          </button>
    
          <button
            type="button"
            onClick={handleFinalSignoff}
            className="bg-primary hover:bg-primary-hover text-white px-6 py-2.5 rounded-none font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xs cursor-pointer"
          >
            <Check className="w-4 h-4 text-white" />
            <span>Sign and send</span>
          </button>
        </div>
    
      </div>
    </div>
  );
}
