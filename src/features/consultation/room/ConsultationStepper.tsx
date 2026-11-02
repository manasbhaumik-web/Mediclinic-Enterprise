import React from 'react';
import { ClipboardList, Activity, Stethoscope, Pill } from 'lucide-react';
import { ICD10Code, PrescriptionItem } from '../../../types';

interface ConsultationStepperProps {
  activeTab: 'subjective' | 'objective' | 'assessment' | 'plan';
  setActiveTab: React.Dispatch<React.SetStateAction<'subjective' | 'objective' | 'assessment' | 'plan'>>;
  subjective: string;
  vitals: { bpSystolic: number; bpDiastolic: number; heartRate: number; temperature: number; respiratoryRate: number; };
  selectedICD: ICD10Code | null;
  rxList: PrescriptionItem[];
  lastSavedTime?: string;
}

export default function ConsultationStepper({ activeTab, setActiveTab, subjective, vitals, selectedICD, rxList, lastSavedTime }: ConsultationStepperProps) {
  const isSubjectiveDone = Boolean(subjective.trim());
  const isObjectiveDone = vitals.temperature > 0 || vitals.bpSystolic > 0 || vitals.heartRate > 0;
  const isAssessmentDone = Boolean(selectedICD);
  const isPlanReady = rxList.length > 0;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between border border-line bg-surface p-1 rounded-none gap-2">
      <div className="flex flex-1 gap-1" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'subjective'}
          onClick={() => setActiveTab('subjective')}
          title={isSubjectiveDone ? "1. Subjective History: Patient presenting complaints recorded (Complete ✓)" : "1. Subjective History: Enter presenting complaints and symptoms"}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-none text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'subjective' 
              ? 'bg-primary text-white border-b-2 border-accent' 
              : 'text-ink dark:text-slate-200 bg-surface hover:bg-surface-accent dark:hover:bg-night-800 border border-transparent'
          }`}
        >
          <ClipboardList className="w-4 h-4 shrink-0" />
          <span>1. Subjective</span>
          <span className={`w-2 h-2 rounded-full shrink-0 ${isSubjectiveDone ? 'bg-emerald-400' : 'bg-amber-400 opacity-60'}`} />
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'objective'}
          onClick={() => setActiveTab('objective')}
          title={isObjectiveDone ? "2. Objective: Vitals and examination recorded (Complete ✓)" : "2. Objective: Vitals & Physical Examination"}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-none text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'objective' 
              ? 'bg-primary text-white border-b-2 border-accent' 
              : 'text-ink dark:text-slate-200 bg-surface hover:bg-surface-accent dark:hover:bg-night-800 border border-transparent'
          }`}
        >
          <Activity className="w-4 h-4 shrink-0" />
          <span>2. Objective</span>
          <span className={`w-2 h-2 rounded-full shrink-0 ${isObjectiveDone ? 'bg-emerald-400' : 'bg-amber-400 opacity-60'}`} />
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'assessment'}
          onClick={() => setActiveTab('assessment')}
          title={isAssessmentDone ? `3. Assessment: Diagnosis confirmed (${selectedICD?.code})` : "3. Assessment: ICD-10 clinical diagnosis required"}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-none text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'assessment' 
              ? 'bg-primary text-white border-b-2 border-accent' 
              : 'text-ink dark:text-slate-200 bg-surface hover:bg-surface-accent dark:hover:bg-night-800 border border-transparent'
          }`}
        >
          <Stethoscope className="w-4 h-4 shrink-0" />
          <span>3. Assessment</span>
          <span className={`w-2 h-2 rounded-full shrink-0 ${isAssessmentDone ? 'bg-emerald-400' : 'bg-rose-500'}`} />
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'plan'}
          onClick={() => setActiveTab('plan')}
          title={isPlanReady ? `4. Plan & Rx: ${rxList.length} items prescribed` : "4. Plan & Rx: Prescribe medications and management plan"}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-none text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'plan' 
              ? 'bg-primary text-white border-b-2 border-accent' 
              : 'text-ink dark:text-slate-200 bg-surface hover:bg-surface-accent dark:hover:bg-night-800 border border-transparent'
          }`}
        >
          <Pill className="w-4 h-4 shrink-0" />
          <span>4. Plan &amp; Rx</span>
          <span className={`w-2 h-2 rounded-full shrink-0 ${isPlanReady ? 'bg-emerald-400' : 'bg-slate-400 opacity-50'}`} />
        </button>
      </div>

      {lastSavedTime && (
        <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 text-2xs text-muted font-mono shrink-0 bg-surface-muted border border-line">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>Autosaved {lastSavedTime}</span>
        </div>
      )}
    </div>
  );
}
