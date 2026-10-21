import { EyeOff, Eye, CheckCircle2, Activity, Lock, HelpCircle } from 'lucide-react';
import { Patient } from '../../../types';

interface PatientSafetyHeaderProps {
  currentPatient: Patient;
  patientAge: number;
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
}

export default function PatientSafetyHeader({ currentPatient, patientAge, maskedIC, setIsPiiRevealed, isPiiRevealed, maskedPhone, lastSavedTime, completedStepsCount, soapProgressPercent, setIsLocked, setShowShortcutsHelp, showShortcutsHelp }: PatientSafetyHeaderProps) {
  return (
    <div className="bg-surface-muted dark:bg-night-850 border border-line-subtle dark:border-teal-800/50 rounded-none p-4 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-l-4 border-l-brand">
      
      {/* Patient Demographics & PII Controls */}
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-none bg-primary text-white flex items-center justify-center font-bold text-sm shrink-0 border border-brand shadow-xs">
          {currentPatient.fullName.substring(0, 2).toUpperCase()}
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="type-card-title text-ink dark:text-teal-300">{currentPatient.fullName}</h2>
            <span className="text-xs text-slate-600 dark:text-slate-300 font-bold">({patientAge} Yrs, {currentPatient.gender})</span>
            <span id="patient-banner-status" className="bg-surface-accent dark:bg-night-800 text-accent dark:text-teal-300 border border-line dark:border-teal-800/50 text-2xs uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-none flex items-center justify-center gap-1 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Consultation Active
            </span>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-slate-300 font-medium mt-1">
            {/* Masked IC Number */}
            <span className="flex items-center justify-center gap-1.5 bg-surface dark:bg-night-900 border border-line dark:border-teal-800/40 px-2 py-0.5 rounded-none">
              <span className="font-bold text-accent dark:text-teal-300 font-mono">IC:</span>
              <strong className="font-mono text-ink dark:text-slate-100">{maskedIC}</strong>
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
            <span className="flex items-center justify-center gap-1.5 bg-surface dark:bg-night-900 border border-line dark:border-teal-800/40 px-2 py-0.5 rounded-none">
              <span className="font-bold text-accent dark:text-teal-300 font-mono">Phone:</span>
              <strong className="font-mono text-ink dark:text-slate-100">{maskedPhone}</strong>
            </span>
    
            <span>Coverage: <strong className="text-accent dark:text-teal-400 font-bold">{currentPatient.panelEmployer === 'None (Self-Pay)' ? 'Self-Pay' : currentPatient.panelEmployer}</strong></span>
          </div>
        </div>
      </div>
    
      {/* Header Right Toolbar: Single Authoritative Progress + Auto-Save State + Lock Screen */}
      <div className="flex flex-wrap items-center gap-2.5 shrink-0">
        
        {/* Auto-Save Indicator */}
        <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 px-2.5 py-1 rounded-none font-bold font-mono">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Saved {lastSavedTime}</span>
        </div>
    
        {/* Single Authoritative Progress Indicator */}
        <div className="bg-surface dark:bg-night-900 border border-line dark:border-teal-800/40 rounded-none px-3 py-1 flex items-center justify-center gap-2">
          <Activity className="w-4 h-4 text-accent dark:text-teal-400" />
          <div className="text-left">
            <span className="text-2xs text-slate-500 font-bold uppercase block leading-none font-mono">Progress</span>
            <span className="text-xs font-mono font-bold text-accent dark:text-teal-300 leading-tight block">Step {completedStepsCount} of 4 ({soapProgressPercent}%)</span>
          </div>
        </div>
    
        {/* Quick Lock Screen */}
        <button
          type="button"
          onClick={() => setIsLocked(true)}
          className="px-3 py-1.5 border border-line dark:border-teal-800/50 bg-surface dark:bg-night-900 text-ink dark:text-slate-200 hover:bg-surface-accent dark:hover:bg-night-800 rounded-none text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          title="Lock Screen"
        >
          <Lock className="w-3.5 h-3.5 text-accent" />
          <span className="hidden sm:inline">Lock Screen</span>
        </button>
    
        {/* Shortcuts Help Button */}
        <button
          type="button"
          onClick={() => setShowShortcutsHelp(!showShortcutsHelp)}
          className="p-1.5 border border-line dark:border-teal-800/50 bg-surface dark:bg-night-900 text-ink dark:text-slate-200 hover:bg-surface-accent dark:hover:bg-night-800 rounded-none text-xs font-bold transition-colors cursor-pointer"
          title="Keyboard Shortcuts (Alt+?)"
        >
          <HelpCircle className="w-4 h-4 text-accent" />
        </button>
      </div>
    </div>
  );
}
