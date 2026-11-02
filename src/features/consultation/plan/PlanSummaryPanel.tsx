import { PrescriptionItem } from '../../../types';

interface PlanSummaryPanelProps {
  rxList: PrescriptionItem[];
  selectedLabs: string[];
  mcGenerated: boolean;
  mcDays: number | '';
  referralGenerated: boolean;
  referralDetails: { hospital: string; department: string; reason: string; };
  pharmacyMemo: string;
}

export default function PlanSummaryPanel({ rxList, selectedLabs, mcGenerated, mcDays, referralGenerated, referralDetails, pharmacyMemo }: PlanSummaryPanelProps) {
  return (
    <div className="space-y-4 animate-fadeIn">
      
      <div className="border border-line bg-surface p-4 rounded-none space-y-3">
        <h4 className="type-label text-ink flex items-center justify-between border-b border-line pb-2">
          <span>Full Order &amp; Plan Verification Summary</span>
          <span className="font-mono text-emerald-600 font-bold">Ready for Final Sign-Off</span>
        </h4>
    
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          
          {/* Prescribed Drugs List Summary */}
          <div className="bg-surface p-3 border border-line dark:border-teal-800/40 rounded-none">
            <span className="font-bold text-2xs text-ink uppercase block mb-1.5">
              1. Prescribed Medications ({rxList.length})
            </span>
            {rxList.length === 0 ? (
              <p className="text-slate-400 text-2xs italic">No medications prescribed.</p>
            ) : (
              <ul className="space-y-1 font-mono text-2xs">
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
          <div className="bg-surface p-3 border border-line dark:border-teal-800/40 rounded-none">
            <span className="font-bold text-2xs text-ink uppercase block mb-1.5">
              2. Diagnostic Investigations ({selectedLabs.length})
            </span>
            {selectedLabs.length === 0 ? (
              <p className="text-slate-400 text-2xs italic">No lab tests ordered.</p>
            ) : (
              <ul className="space-y-1 text-2xs font-mono">
                {selectedLabs.map((lab, i) => (
                  <li key={i} className="flex items-center gap-1.5 text-muted dark:text-slate-300">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                    <span>{lab}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
    
          {/* Certificates & Notes Summary */}
          <div className="bg-surface p-3 border border-line dark:border-teal-800/40 rounded-none">
            <span className="font-bold text-2xs text-ink uppercase block mb-1.5">
              3. Certificates &amp; Referrals
            </span>
            <p className="text-2xs text-muted dark:text-slate-300">
              MC Status: <strong>{mcGenerated ? `Issued (${mcDays} Days)` : 'None'}</strong>
            </p>
            <p className="text-2xs text-muted dark:text-slate-300 mt-1">
              Referral: <strong>{referralGenerated ? `Specialist Note attached for ${referralDetails.hospital}` : 'None'}</strong>
            </p>
          </div>
    
          {/* Dispensing Notes Summary */}
          <div className="bg-surface p-3 border border-line dark:border-teal-800/40 rounded-none">
            <span className="font-bold text-2xs text-ink uppercase block mb-1.5">
              4. Dispensing Memo
            </span>
            <p className="text-2xs font-mono text-muted dark:text-slate-300">
              {pharmacyMemo || 'No additional dispensing notes.'}
            </p>
          </div>
    
        </div>
      </div>
    
    </div>
  );
}
