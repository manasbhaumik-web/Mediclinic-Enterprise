import React from 'react';
import { Save, ArrowRight, Check, Undo2, Clock } from 'lucide-react';

type Tab = 'subjective' | 'objective' | 'assessment' | 'plan';

interface WorkflowToolbarProps {
  onCancel: () => void;
  onSaveDraft: () => void;
  onHoldForResults?: () => void;
  activeTab: Tab;
  setActiveTab: React.Dispatch<React.SetStateAction<Tab>>;
  handleOpenReviewModal: () => void;
  /** What the doctor should do next, or why the primary button will not finish yet. */
  hint: string;
  /** When the draft was last kept on this device, if it has been. */
  savedLabel: string;
}

const NEXT: Record<Exclude<Tab, 'plan'>, { to: Tab; label: string }> = {
  subjective: { to: 'objective', label: 'Next: vitals' },
  objective: { to: 'assessment', label: 'Next: diagnosis' },
  assessment: { to: 'plan', label: 'Next: prescription' },
};

/**
 * One sticky bar: what to do next, then Return to queue, Save draft and a single primary action
 * that always moves the consultation forward (the last step is review and sign-off).
 */
export default function WorkflowToolbar({ onCancel, onSaveDraft, onHoldForResults, activeTab, setActiveTab, handleOpenReviewModal, hint, savedLabel }: WorkflowToolbarProps) {
  return (
    <div className="sticky bottom-0 z-10 -mx-5 -mb-5 px-5 py-4 bg-surface border-t border-line flex flex-col xl:flex-row xl:items-center justify-between gap-3">
      <div className="min-w-0">
        <p id="consult-next-hint" role="status" className="text-sm font-semibold text-ink">{hint}</p>
        <p className="text-xs text-muted tabular-nums mt-0.5">{savedLabel}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto">
        <button type="button" onClick={onCancel} className="btn-secondary min-h-12 px-3 text-sm text-ink" title="Puts the patient back in the queue and discards this draft">
          <Undo2 className="w-4 h-4" aria-hidden="true" />
          Return to queue
        </button>
        <button type="button" onClick={onSaveDraft} className="btn-secondary min-h-12 px-3 text-sm text-ink" title="Save draft locally on this workstation (Drafts auto-restore on page reload)">
          <Save className="w-4 h-4" aria-hidden="true" />
          Save draft
        </button>

        {onHoldForResults && (
          <button
            type="button"
            onClick={onHoldForResults}
            className="btn-secondary min-h-12 px-3 text-sm text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/40"
            title="Put encounter on hold while patient undergoes in-clinic rapid diagnostic testing or nursing procedures"
          >
            <Clock className="w-4 h-4" aria-hidden="true" />
            <span>Hold for results</span>
          </button>
        )}

        {activeTab === 'plan' ? (
          <button type="button" onClick={handleOpenReviewModal} aria-describedby="consult-next-hint" className="btn-primary min-h-12 px-5 text-sm ml-auto" title="Open final review modal to verify SOAP notes, prescriptions, and complete clinical sign-off">
            <Check className="w-4 h-4" aria-hidden="true" />
            Review &amp; sign off
          </button>
        ) : (
          <button type="button" onClick={() => setActiveTab(NEXT[activeTab].to)} aria-describedby="consult-next-hint" className="btn-primary min-h-12 px-5 text-sm ml-auto" title={`Advance to the next clinical stage: ${NEXT[activeTab].label}`}>
            {NEXT[activeTab].label}
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}
