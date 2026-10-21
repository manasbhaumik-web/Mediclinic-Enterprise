import { Save, ArrowRight, Check } from 'lucide-react';

interface WorkflowToolbarProps {
  onCancel: () => void;
  setLastSavedTime: React.Dispatch<React.SetStateAction<string>>;
  activeTab: 'subjective' | 'objective' | 'assessment' | 'plan';
  setActiveTab: React.Dispatch<React.SetStateAction<'subjective' | 'objective' | 'assessment' | 'plan'>>;
  handleOpenReviewModal: () => void;
}

export default function WorkflowToolbar({ onCancel, setLastSavedTime, activeTab, setActiveTab, handleOpenReviewModal }: WorkflowToolbarProps) {
  return (
    <div className="border-t border-line-subtle dark:border-teal-800/40 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-line dark:border-teal-800/50 bg-surface dark:bg-night-900 text-ink dark:text-slate-300 rounded-none text-xs font-bold hover:bg-surface-accent dark:hover:bg-night-800 transition-colors cursor-pointer"
        >
          Cancel Encounter
        </button>
    
        <button
          type="button"
          onClick={() => setLastSavedTime('Just now')}
          className="px-3.5 py-2 border border-line dark:border-teal-800/40 bg-surface-muted dark:bg-night-850 text-accent dark:text-teal-300 rounded-none text-xs font-bold hover:bg-surface-accent dark:hover:bg-night-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Save className="w-3.5 h-3.5 text-accent" />
          <span>Save Draft</span>
        </button>
      </div>
    
      <div className="flex items-center gap-3">
        {/* Dynamic Single Primary Action CTA Button */}
        {activeTab === 'subjective' && (
          <button
            type="button"
            onClick={() => setActiveTab('objective')}
            className="bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-none text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <span>Save Symptoms &amp; Proceed to Vitals</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
    
        {activeTab === 'objective' && (
          <button
            type="button"
            onClick={() => setActiveTab('assessment')}
            className="bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-none text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <span>Save Vitals &amp; Proceed to Diagnosis</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
    
        {activeTab === 'assessment' && (
          <button
            type="button"
            onClick={() => setActiveTab('plan')}
            className="bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-none text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <span>Confirm Diagnosis &amp; Proceed to Prescription</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
    
        {activeTab === 'plan' && (
          <button
            type="button"
            onClick={handleOpenReviewModal}
            className="bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-none text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <Check className="w-4 h-4 text-white" />
            <span>Review and Sign Consultation</span>
          </button>
        )}
      </div>
    </div>
  );
}
