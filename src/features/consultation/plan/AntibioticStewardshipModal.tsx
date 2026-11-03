import React, { useState } from 'react';
import { 
  ShieldAlert, AlertTriangle, Pill, CheckCircle2, 
  X, ArrowRight, Sparkles, BookOpen 
} from 'lucide-react';
import { 
  StewardshipCheckResult, 
  VALID_CLINICAL_JUSTIFICATIONS 
} from '../../../domain/antibioticStewardship';

interface AntibioticStewardshipModalProps {
  isOpen: boolean;
  onClose: () => void;
  stewardshipResult: StewardshipCheckResult;
  onConfirmOverride: (justification: string) => void;
  onRemoveAntibiotic: (antibioticName: string) => void;
}

export const AntibioticStewardshipModal: React.FC<AntibioticStewardshipModalProps> = ({
  isOpen,
  onClose,
  stewardshipResult,
  onConfirmOverride,
  onRemoveAntibiotic,
}) => {
  const [selectedJustification, setSelectedJustification] = useState<string>('');
  const [customJustification, setCustomJustification] = useState<string>('');

  if (!isOpen || !stewardshipResult.requiresStewardshipReview) return null;

  const currentJustification = customJustification.trim() || selectedJustification;

  const handleApplyOverride = () => {
    if (!currentJustification) return;
    onConfirmOverride(currentJustification);
    onClose();
  };

  const handleDePrescribe = (drugName: string) => {
    onRemoveAntibiotic(drugName);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-fadeIn">
      <div className="bg-surface border border-rose-300 dark:border-rose-800 w-full max-w-2xl max-h-[90vh] flex flex-col rounded-none font-sans">
        
        {/* Header */}
        <div className="bg-rose-50 dark:bg-rose-950/40 border-b border-rose-200 dark:border-rose-800/60 px-5 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-rose-600 text-white rounded-none">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-rose-950 dark:text-rose-100 ">
                KKM National Antimicrobial Guideline (NAG) Guard
              </h3>
              <p className="text-2xs text-rose-700 dark:text-rose-300">
                Antimicrobial Stewardship Protocol for Outpatient Primary Care
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="p-1 hover:bg-rose-100 text-rose-600 dark:text-rose-400 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          
          {/* Warning Banner */}
          <div className="border border-rose-200 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/20 p-3 rounded-none flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-bold text-rose-900 dark:text-rose-200">
                Systemic Antibiotic Detected for Viral or Self-Limiting Condition
              </p>
              <div className="text-ink">
                <strong>Prescribed:</strong>{' '}
                <span className="tabular-nums text-rose-700 dark:text-rose-300 font-bold">
                  {stewardshipResult.prescribedAntibiotics.join(', ')}
                </span>
              </div>
              <div className="text-ink">
                <strong>Diagnosis:</strong>{' '}
                {stewardshipResult.triggeringDiagnoses.map(d => `${d.code} - ${d.name}`).join('; ')}
              </div>
            </div>
          </div>

          {/* KKM NAG Clinical Context */}
          {stewardshipResult.triggeringDiagnoses.map((d, i) => (
            <div key={i} className="border border-line bg-surface-muted/30 p-3 rounded-none text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-primary">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Malaysian CPG / NAG Guideline Note</span>
              </div>
              <p className="text-ink-muted">{d.rule.nagRecommendation}</p>
            </div>
          ))}

          {/* Recommended Symptomatic Alternatives */}
          {stewardshipResult.recommendedAlternatives.length > 0 && (
            <div className="border border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 p-3.5 rounded-none space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900 dark:text-emerald-200">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Recommended First-Line Symptomatic Alternatives</span>
              </div>
              <ul className="text-xs text-ink space-y-1 pl-2">
                {stewardshipResult.recommendedAlternatives.map((alt, idx) => (
                  <li key={idx} className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-none shrink-0" />
                    <span>{alt}</span>
                  </li>
                ))}
              </ul>
              <div className="pt-2 flex flex-wrap gap-2">
                {stewardshipResult.prescribedAntibiotics.map(ab => (
                  <button
                    key={ab}
                    type="button"
                    onClick={() => handleDePrescribe(ab)}
                    className="py-1.5 px-3 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-none flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Cancel {ab} & Switch to Supportive Care
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Mandatory Clinical Justification Override */}
          <div className="border border-line p-3.5 bg-surface rounded-none space-y-3">
            <h4 className="text-xs font-bold text-ink ">
              Or Document Clinical Justification for Antimicrobial Coverage
            </h4>
            <p className="text-2xs text-ink-muted">
              Select an approved clinical rationale per Malaysian CPG standards to defend corporate panel / TPA claim review:
            </p>

            <div className="space-y-1.5">
              {VALID_CLINICAL_JUSTIFICATIONS.map((just, idx) => (
                <label 
                  key={idx}
                  className={`flex items-start gap-2 p-2 border text-xs cursor-pointer transition-colors ${
                    selectedJustification === just 
                      ? 'border-primary bg-primary/5 font-semibold text-primary' 
                      : 'border-line bg-surface hover:bg-surface-accent text-ink'
                  }`}
                >
                  <input
                    type="radio"
                    name="stewardshipJustification"
                    checked={selectedJustification === just}
                    onChange={() => {
                      setSelectedJustification(just);
                      setCustomJustification('');
                    }}
                    className="mt-0.5 text-primary focus:ring-0"
                  />
                  <span className="leading-tight">{just}</span>
                </label>
              ))}
            </div>

            <div className="pt-1">
              <label className="block text-2xs font-bold text-ink-muted mb-1">
                Other Specific Clinical Rationale (Optional)
              </label>
              <input
                type="text"
                value={customJustification}
                onChange={(e) => {
                  setCustomJustification(e.target.value);
                  setSelectedJustification('');
                }}
                placeholder="e.g. Bilateral purulent tonsillar membrane with trismus, penicillin prescribed"
                className="w-full text-xs p-2 border border-line bg-surface text-ink rounded-none focus:outline-hidden"
              />
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-surface-accent border-t border-line px-5 py-3 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 border border-line text-xs font-bold text-ink hover:bg-surface rounded-none cursor-pointer"
          >
            Review Orders
          </button>
          
          <button
            type="button"
            disabled={!currentJustification}
            onClick={handleApplyOverride}
            className="px-4 py-1.5 bg-primary text-white text-xs font-bold hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 rounded-none cursor-pointer"
          >
            <span>Confirm Clinical Justification & Keep Rx</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </div>
  );
};
