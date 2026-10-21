import { ClipboardList, Activity, Stethoscope, Pill } from 'lucide-react';
import { ICD10Code, PrescriptionItem } from '../../../types';

interface ConsultationStepperProps {
  activeTab: 'subjective' | 'objective' | 'assessment' | 'plan';
  setActiveTab: React.Dispatch<React.SetStateAction<'subjective' | 'objective' | 'assessment' | 'plan'>>;
  subjective: string;
  vitals: { bpSystolic: number; bpDiastolic: number; heartRate: number; temperature: number; respiratoryRate: number; };
  selectedICD: ICD10Code;
  rxList: PrescriptionItem[];
}

export default function ConsultationStepper({ activeTab, setActiveTab, subjective, vitals, selectedICD, rxList }: ConsultationStepperProps) {
  return (
    <div className="flex border border-line-subtle dark:border-teal-800/40 bg-surface-accent dark:bg-night-850 p-1 rounded-none gap-1" role="tablist">
      <button
        type="button"
        role="tab"
        aria-selected={activeTab === 'subjective'}
        onClick={() => setActiveTab('subjective')}
        className={`flex-1 flex flex-col items-center justify-center py-2 px-2 rounded-none text-xs font-bold transition-all cursor-pointer ${
          activeTab === 'subjective' 
            ? 'bg-primary text-white shadow-xs font-bold' 
            : 'text-accent dark:text-slate-200 hover:bg-surface-strong dark:hover:bg-night-800'
        }`}
      >
        <div className="flex items-center gap-1">
          <ClipboardList className="w-4 h-4" />
          <span>1. Subjective</span>
        </div>
        <span className="text-2xs font-mono mt-0.5 opacity-90">
          {subjective.trim() ? 'Complete ✓' : 'In Progress'}
        </span>
      </button>
    
      <button
        type="button"
        role="tab"
        aria-selected={activeTab === 'objective'}
        onClick={() => setActiveTab('objective')}
        className={`flex-1 flex flex-col items-center justify-center py-2 px-2 rounded-none text-xs font-bold transition-all cursor-pointer ${
          activeTab === 'objective' 
            ? 'bg-primary text-white shadow-xs font-bold' 
            : 'text-accent dark:text-slate-200 hover:bg-surface-strong dark:hover:bg-night-800'
        }`}
      >
        <div className="flex items-center gap-1">
          <Activity className="w-4 h-4" />
          <span>2. Objective</span>
        </div>
        <span className="text-2xs font-mono mt-0.5 opacity-90">
          {vitals.temperature > 0 ? 'Complete ✓' : 'Required'}
        </span>
      </button>
    
      <button
        type="button"
        role="tab"
        aria-selected={activeTab === 'assessment'}
        onClick={() => setActiveTab('assessment')}
        className={`flex-1 flex flex-col items-center justify-center py-2 px-2 rounded-none text-xs font-bold transition-all cursor-pointer ${
          activeTab === 'assessment' 
            ? 'bg-primary text-white shadow-xs font-bold' 
            : 'text-accent dark:text-slate-200 hover:bg-surface-strong dark:hover:bg-night-800'
        }`}
      >
        <div className="flex items-center gap-1">
          <Stethoscope className="w-4 h-4" />
          <span>3. Assessment</span>
        </div>
        <span className="text-2xs font-mono mt-0.5 opacity-90">
          {selectedICD ? 'Complete ✓' : 'Required Next ➔'}
        </span>
      </button>
    
      <button
        type="button"
        role="tab"
        aria-selected={activeTab === 'plan'}
        onClick={() => setActiveTab('plan')}
        className={`flex-1 flex flex-col items-center justify-center py-2 px-2 rounded-none text-xs font-bold transition-all cursor-pointer ${
          activeTab === 'plan' 
            ? 'bg-primary text-white shadow-xs font-bold' 
            : 'text-accent dark:text-slate-200 hover:bg-surface-strong dark:hover:bg-night-800'
        }`}
      >
        <div className="flex items-center gap-1">
          <Pill className="w-4 h-4" />
          <span>4. Plan &amp; Rx</span>
        </div>
        <span className="text-2xs font-mono mt-0.5 opacity-90">
          {selectedICD ? (rxList.length > 0 ? `${rxList.length} Items` : 'Ready') : 'Locked until ICD'}
        </span>
      </button>
    </div>
  );
}
