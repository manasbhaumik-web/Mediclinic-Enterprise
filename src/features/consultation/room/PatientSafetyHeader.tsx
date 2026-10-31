import React from 'react';
import { EyeOff, Eye, CheckCircle2, Activity, Lock, HelpCircle, AlertTriangle } from 'lucide-react';
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
}

export default function PatientSafetyHeader({
  ticketText,
  allergies = [],
  currentPatient,
  patientAge,
  patientAgeDisplay,
  maskedIC,
  setIsPiiRevealed,
  isPiiRevealed,
  lastSavedTime,
  completedStepsCount,
  soapProgressPercent,
  setIsLocked,
  setShowShortcutsHelp,
  showShortcutsHelp
}: PatientSafetyHeaderProps) {
  const hasAllergies = allergies.length > 0;
  const coverage = currentPatient.panelEmployer === 'None (Self-Pay)' ? 'Self-Pay' : currentPatient.panelEmployer;

  return (
    <div className="sticky top-0 z-20 bg-surface border border-line rounded-none px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-none">
      
      {/* Left: Essential Clinical Demographics & Safety Badges */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 min-w-0">
        {/* Patient Avatar Initials */}
        <div className="w-8 h-8 rounded-none bg-primary text-white flex items-center justify-center font-bold text-xs shrink-0 border border-primary font-mono tabular-nums">
          {currentPatient.fullName.substring(0, 2).toUpperCase()}
        </div>

        {/* Ticket & Full Name */}
        <div className="flex items-center gap-2">
          {ticketText && (
            <span className="font-mono tabular-nums font-bold text-accent text-sm">
              {ticketText}
            </span>
          )}
          <h2 className="type-card-title text-ink font-bold text-sm tracking-tight truncate">
            {currentPatient.fullName}
          </h2>
          <span className="text-xs text-muted font-bold whitespace-nowrap">
            (<span className="font-mono tabular-nums">{patientAgeDisplay || `${patientAge} Yrs`}</span>, {currentPatient.gender})
          </span>
        </div>

        <div className="h-3.5 w-px bg-line hidden sm:block" />

        {/* Coverage Badge */}
        <span className="text-2xs font-bold px-2 py-0.5 border border-line bg-surface-muted text-accent whitespace-nowrap font-mono">
          {coverage}
        </span>

        {/* Critical Allergy or NKDA Badge */}
        {hasAllergies ? (
          <span className="chip-danger px-2.5 py-0.5 text-2xs font-bold inline-flex items-center gap-1 uppercase tracking-wider">
            <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Allergy: {allergies.join(', ')}</span>
          </span>
        ) : (
          <span className="text-2xs font-medium px-2 py-0.5 border border-emerald-300 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 whitespace-nowrap font-sans">
            ✓ No known drug allergies
          </span>
        )}

        <div className="h-3.5 w-px bg-line hidden md:block" />

        {/* Masked IC with Reveal toggle */}
        <div className="flex items-center gap-1.5 text-2xs text-muted font-mono whitespace-nowrap">
          <span className="font-bold text-subtle font-sans">IC:</span>
          <strong className="text-ink font-mono tabular-nums">{maskedIC}</strong>
          <button
            type="button"
            onClick={() => setIsPiiRevealed(!isPiiRevealed)}
            className="text-accent hover:text-ink cursor-pointer p-0.5 transition-colors"
            title={isPiiRevealed ? 'Mask PII IC Number' : 'Click to Reveal PII IC Number'}
            aria-label={isPiiRevealed ? 'Mask IC' : 'Reveal IC'}
          >
            {isPiiRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Right Toolbar: Auto-save + Progress + Lock */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Auto-Save Indicator */}
        <div className="flex items-center gap-1.5 text-2xs text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 px-2.5 py-1 rounded-none font-bold font-mono tabular-nums">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span className="hidden sm:inline">{lastSavedTime ? `Draft saved ${lastSavedTime}` : 'Draft not saved'}</span>
        </div>

        {/* Compact Progress */}
        <div className="bg-surface border border-line rounded-none px-2.5 py-1 flex items-center gap-1.5 font-mono text-2xs font-bold text-accent">
          <Activity className="w-3.5 h-3.5 text-accent" />
          <span>{completedStepsCount}/4 ({soapProgressPercent}%)</span>
        </div>

        {/* Quick Lock Screen */}
        <button
          type="button"
          onClick={() => setIsLocked(true)}
          className="p-1.5 border border-line bg-surface text-accent hover:bg-surface-accent rounded-none transition-colors cursor-pointer"
          title="Lock Screen"
          aria-label="Lock consultation screen"
        >
          <Lock className="w-3.5 h-3.5" />
        </button>

        {/* Shortcuts Help Button */}
        <button
          type="button"
          onClick={() => setShowShortcutsHelp(!showShortcutsHelp)}
          className="p-1.5 border border-line bg-surface text-accent hover:bg-surface-accent rounded-none transition-colors cursor-pointer"
          title="Keyboard Shortcuts (Alt+?)"
          aria-label="Keyboard Shortcuts"
        >
          <HelpCircle className="w-3.5 h-3.5" />
        </button>
      </div>

    </div>
  );
}
