import React from 'react';
import logoUrl from '../../assets/logo_transparent.svg';
import { Activity, Stethoscope, ShieldCheck } from 'lucide-react';

export default function GlobalSpinner() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 space-y-5 animate-fadeIn font-sans text-ink dark:text-teal-300">
      
      {/* ANIMATED PULSING LOGO & ECG WAVEFORM CONTAINER */}
      <div className="relative flex items-center justify-center">
        
        {/* Pulsing Outer Rings */}
        <div className="absolute w-24 h-24 rounded-full bg-primary/20 animate-ping"></div>
        <div className="absolute w-32 h-32 rounded-full border border-brand/30 animate-pulse"></div>

        {/* Central Logo & Icon Card */}
        <div className="relative bg-white dark:bg-night-900 border-2 border-brand p-4 rounded-none shadow-xl flex items-center justify-center space-x-2">
          <img 
            src={logoUrl} 
            alt="Mediclinic Logo" 
            className="w-10 h-10 object-contain animate-pulse" 
          />
          <Activity className="w-6 h-6 text-accent dark:text-teal-400 animate-bounce" />
        </div>
      </div>

      {/* LOADING TEXT & MICROCOPY */}
      <div className="text-center space-y-1.5 max-w-sm">
        <h3 className="type-heading-caps text-ink dark:text-teal-300 flex items-center justify-center gap-1.5">
          <Stethoscope className="w-4 h-4 text-accent" />
          <span>Mediclinic Enterprise</span>
        </h3>
        
        <p className="text-xs font-bold text-accent dark:text-teal-400">
          Initializing Clinical Encounter Workspace...
        </p>

        {/* ANIMATED INDETERMINATE PROGRESS BAR */}
        <div className="w-48 h-1.5 bg-surface-accent dark:bg-night-800 border border-line dark:border-teal-800/40 rounded-none overflow-hidden mx-auto mt-3">
          <div className="h-full bg-primary dark:bg-teal-400 w-1/2 animate-slide-fast"></div>
        </div>

        <span className="text-2xs font-mono text-slate-400 dark:text-slate-400 block pt-1">
          Securing EMR Telemetry &amp; Clinical Data...
        </span>
      </div>

    </div>
  );
}
