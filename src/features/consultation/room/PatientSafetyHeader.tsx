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
  /** Drug allergies, vitals recorded at triage and the room, kept in view while the doctor scrolls. */
  allergies?: string[];
  vitalsText?: string;
  roomText?: string;
  /** The visit's queue ticket, for example "#014". */
  ticketText?: string;
}

export default function PatientSafetyHeader({
  ticketText,
  allergies = [],
  vitalsText,
  roomText,
  currentPatient,
  patientAge,
  patientAgeDisplay,
  maskedIC,
  setIsPiiRevealed,
  isPiiRevealed,
  maskedPhone,
  lastSavedTime,
  completedStepsCount,
  soapProgressPercent,
  setIsLocked,
  setShowShortcutsHelp,
  showShortcutsHelp
}: PatientSafetyHeaderProps) {
  const hasAllergies = allergies.length > 0;

  return (
    <div className={`sticky top-0 z-20 bg-surface border border-line rounded-none p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3 ${hasAllergies ? '' : ''}`}>
      
      {/* Patient Demographics & PII Controls */}
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-none bg-primary text-white flex items-center justify-center font-bold text-sm shrink-0 border border-primary font-mono tabular-nums">
          {currentPatient.fullName.substring(0, 2).toUpperCase()}
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="type-card-title text-ink font-bold">
              {ticketText && <span className="font-mono tabular-nums text-accent mr-2">{ticketText}</span>}
              {currentPatient.fullName}
            </h2>
            <span className="text-xs text-muted dark:text-slate-300 font-bold">
              (<span className="font-mono tabular-nums">{patientAgeDisplay || `${patientAge} Yrs`}</span>, {currentPatient.gender})
            </span>
            <span id="patient-banner-status" className="bg-surface-accent text-accent border border-line text-2xs uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-none flex items-center justify-center gap-1.5 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Consultation Active
            </span>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted dark:text-slate-300 font-medium mt-1">
            {/* Masked IC Number */}
            <span className="flex items-center justify-center gap-1.5 bg-surface border border-line px-2 py-0.5 rounded-none">
              <span className="font-bold text-accent font-mono">IC:</span>
              <strong className="font-mono tabular-nums text-ink dark:text-slate-100">{maskedIC}</strong>
              <button
                type="button"
                onClick={() => setIsPiiRevealed(!isPiiRevealed)}
                className="text-accent hover:text-accent transition-colors ml-1 cursor-pointer"
                title={isPiiRevealed ? 'Mask PII IC Number' : 'Click to Reveal PII IC Number'}
              >
                {isPiiRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </span>
    
            {/* Masked Phone */}
            <span className="flex items-center justify-center gap-1.5 bg-surface border border-line px-2 py-0.5 rounded-none">
              <span className="font-bold text-accent font-mono">Phone:</span>
              <strong className="font-mono tabular-nums text-ink dark:text-slate-100">{maskedPhone}</strong>
            </span>
    
            <span>Coverage: <strong className="text-accent font-bold">{currentPatient.panelEmployer === 'None (Self-Pay)' ? 'Self-Pay' : currentPatient.panelEmployer}</strong></span>
          </div>

          {/* Always in view: allergies, triage vitals and room */}
          <div className="flex flex-wrap items-center gap-2 mt-2" aria-label="Safety summary">
            {hasAllergies ? (
              <>
                <span className="chip-danger px-2.5 py-1 text-xs font-bold inline-flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" aria-hidden="true" />
                  CRITICAL ALLERGY
                </span>
                {allergies.map((a) => (
                  <span key={a} className="chip-danger px-2.5 py-1 text-xs font-bold uppercase inline-flex items-center">
                    {a}
                  </span>
                ))}
              </>
            ) : (
              <span className="chip-neutral px-2.5 py-1 text-xs font-bold inline-flex items-center">
                No known drug allergies
              </span>
            )}
            {vitalsText && <span className="chip-brand px-2.5 py-1 text-xs font-bold inline-flex items-center font-mono tabular-nums">{vitalsText}</span>}
            {roomText && <span className="chip-info px-2.5 py-1 text-xs font-bold inline-flex items-center font-mono tabular-nums">{roomText}</span>}
          </div>
        </div>
      </div>

      {/* Header Right Toolbar: Single Authoritative Progress + Auto-Save State + Lock Screen */}
      <div className="flex flex-wrap items-center gap-2.5 shrink-0">
        
        {/* Auto-Save Indicator */}
        <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 px-2.5 py-1 rounded-none font-bold font-mono tabular-nums">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>{lastSavedTime ? `Draft saved ${lastSavedTime}` : 'Draft not saved yet'}</span>
        </div>
    
        {/* Single Authoritative Progress Indicator */}
        <div className="bg-surface border border-line rounded-none px-3 py-1 flex items-center justify-center gap-2">
          <Activity className="w-4 h-4 text-accent" />
          <div className="text-left">
            <span className="text-2xs text-subtle font-bold uppercase block leading-none font-mono">Progress</span>
            <span className="text-xs font-mono tabular-nums font-bold text-accent leading-tight block">
              Step {completedStepsCount} of 4 ({soapProgressPercent}%)
            </span>
          </div>
        </div>
    
        {/* Quick Lock Screen */}
        <button
          type="button"
          onClick={() => setIsLocked(true)}
          className="px-3 py-1.5 border border-line bg-surface text-ink dark:text-slate-200 hover:bg-surface-accent dark:hover:bg-night-800 rounded-none text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          title="Lock Screen"
        >
          <Lock className="w-3.5 h-3.5 text-accent" />
          <span className="hidden sm:inline">Lock Screen</span>
        </button>
    
        {/* Shortcuts Help Button */}
        <button
          type="button"
          onClick={() => setShowShortcutsHelp(!showShortcutsHelp)}
          className="p-1.5 border border-line bg-surface text-ink dark:text-slate-200 hover:bg-surface-accent dark:hover:bg-night-800 rounded-none text-xs font-bold transition-colors cursor-pointer"
          title="Keyboard Shortcuts (Alt+?)"
        >
          <HelpCircle className="w-4 h-4 text-accent" />
        </button>
      </div>
    </div>
  );
}
