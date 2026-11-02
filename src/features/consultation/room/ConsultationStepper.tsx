import React from 'react';
import { ICD10Code, PrescriptionItem } from '../../../types';

type Tab = 'subjective' | 'objective' | 'assessment' | 'plan';

interface ConsultationStepperProps {
  activeTab: Tab;
  setActiveTab: React.Dispatch<React.SetStateAction<Tab>>;
  subjective: string;
  vitals: { bpSystolic: number; bpDiastolic: number; heartRate: number; temperature: number; respiratoryRate: number; };
  selectedICD: ICD10Code | null;
  rxList: PrescriptionItem[];
  lastSavedTime?: string;
}

export default function ConsultationStepper({ activeTab, setActiveTab, subjective, vitals, selectedICD, rxList, lastSavedTime }: ConsultationStepperProps) {
  const steps: { id: Tab; label: string; title: string; done: boolean; required?: boolean }[] = [
    { id: 'subjective', label: '1. Subjective', done: Boolean(subjective.trim()), title: 'Presenting complaints and symptoms' },
    { id: 'objective', label: '2. Objective', done: vitals.temperature > 0 || vitals.bpSystolic > 0 || vitals.heartRate > 0, title: 'Vitals and physical examination' },
    { id: 'assessment', label: '3. Assessment', done: Boolean(selectedICD), required: true, title: selectedICD ? `Diagnosis confirmed (${selectedICD.code})` : 'ICD-10 diagnosis required' },
    { id: 'plan', label: '4. Plan & Rx', done: rxList.length > 0, title: rxList.length > 0 ? `${rxList.length} items prescribed` : 'Medication and management plan' },
  ];

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-line">
      <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Consultation steps">
        {steps.map((s) => {
          const active = activeTab === s.id;
          return (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setActiveTab(s.id)}
              title={s.title}
              className={`min-h-11 px-4 border text-sm inline-flex items-center gap-2 transition-colors cursor-pointer ${
                active ? 'bg-surface-strong border-surface-strong text-ink font-bold' : 'bg-surface border-line text-muted font-semibold hover:bg-surface-accent'
              }`}
            >
              <span>{s.label}</span>
              <span
                className={`w-2 h-2 shrink-0 ${s.done ? 'bg-emerald-600' : s.required ? 'bg-rose-500' : 'bg-amber-500'}`}
                role="img"
                aria-label={s.done ? 'Complete' : 'Not complete'}
              />
            </button>
          );
        })}
      </div>

      {lastSavedTime && (
        <p className="hidden lg:block text-xs text-muted">Autosaved {lastSavedTime}</p>
      )}
    </div>
  );
}
