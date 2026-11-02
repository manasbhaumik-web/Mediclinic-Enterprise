import React from 'react';
import { CheckCircle2, Activity, Lock, HelpCircle, Siren } from 'lucide-react';
import { Patient } from '../../../types';

interface PatientSafetyHeaderProps {
  currentPatient: Patient;
  patientAge: number;
  patientAgeDisplay?: string;
  maskedIC: string;
  setIsPiiRevealed: React.Dispatch<React.SetStateAction<boolean>>;
  isPiiRevealed: boolean;
  maskedPhone: string;
  lastSavedTime: string;
  completedStepsCount: number;
  soapProgressPercent: number;
  setIsLocked: React.Dispatch<React.SetStateAction<boolean>>;
  setShowShortcutsHelp: React.Dispatch<React.SetStateAction<boolean>>;
  showShortcutsHelp: boolean;
  allergies?: string[];
  vitalsText?: string;
  roomText?: string;
  ticketText?: string;
  onTriggerRedCode?: () => void;
}

/**
 * The page header: date and room above the title, with the draft status and the safety controls on the right.
 * Who the patient is, and their allergies, sit at the top of the patient panel beside the workspace.
 */
export default function PatientSafetyHeader({
  lastSavedTime,
  completedStepsCount,
  soapProgressPercent,
  setIsLocked,
  setShowShortcutsHelp,
  showShortcutsHelp,
  roomText,
  onTriggerRedCode
}: PatientSafetyHeaderProps) {
  const date = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted">{[date, roomText].filter(Boolean).join(' · ')}</p>
        <h3 className="mt-1 type-section-title text-ink font-bold">Consultation</h3>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 min-h-11 px-3 text-xs font-semibold text-accent bg-surface border border-line tabular-nums">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
          <span>{lastSavedTime ? `Draft saved ${lastSavedTime}` : 'Draft not saved'}</span>
        </span>

        <span className="inline-flex items-center gap-1.5 min-h-11 px-3 text-xs font-semibold text-accent bg-surface border border-line tabular-nums">
          <Activity className="w-3.5 h-3.5" aria-hidden="true" />
          <span>{completedStepsCount}/4 steps ({soapProgressPercent}%)</span>
        </span>

        {onTriggerRedCode && (
          <button
            type="button"
            onClick={onTriggerRedCode}
            className="min-h-11 px-3.5 bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold border border-rose-900 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Trigger Red-Code Resuscitation Alarm (MOH Part V Emergency Bay 1)"
          >
            <Siren className="w-4 h-4" aria-hidden="true" />
            <span className="hidden sm:inline">Code red resus</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setIsLocked(true)}
          className="min-h-11 min-w-11 inline-flex items-center justify-center border border-line bg-surface text-accent hover:bg-surface-accent transition-colors cursor-pointer"
          title="Lock Screen"
          aria-label="Lock consultation screen"
        >
          <Lock className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => setShowShortcutsHelp(!showShortcutsHelp)}
          className="min-h-11 min-w-11 inline-flex items-center justify-center border border-line bg-surface text-accent hover:bg-surface-accent transition-colors cursor-pointer"
          title="Keyboard Shortcuts (Alt+?)"
          aria-label="Keyboard Shortcuts"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
