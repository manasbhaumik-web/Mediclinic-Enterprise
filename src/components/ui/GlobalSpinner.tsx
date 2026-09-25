import React from 'react';
import { Activity, Stethoscope, ShieldCheck } from 'lucide-react';

export default function GlobalSpinner() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 space-y-5 animate-fadeIn font-sans text-[#0f3c4c] dark:text-[#5eead4]">
      
      {/* ANIMATED PULSING LOGO & ECG WAVEFORM CONTAINER */}
      <div className="relative flex items-center justify-center">
        
        {/* Pulsing Outer Rings */}
        <div className="absolute w-24 h-24 rounded-full bg-[#0d9488]/20 animate-ping"></div>
        <div className="absolute w-32 h-32 rounded-full border border-[#0d9488]/30 animate-pulse"></div>

        {/* Central Logo & Icon Card */}
        <div className="relative bg-white dark:bg-[#07252d] border-2 border-[#0d9488] p-4 rounded-none shadow-xl flex items-center justify-center space-x-2">
          <img 
            src="./logo_transparent.svg" 
            alt="Mediclinic Logo" 
            className="w-10 h-10 object-contain animate-pulse" 
          />
          <Activity className="w-6 h-6 text-[#0d9488] dark:text-[#2dd4bf] animate-bounce" />
        </div>
      </div>

      {/* LOADING TEXT & MICROCOPY */}
      <div className="text-center space-y-1.5 max-w-sm">
        <h3 className="text-sm font-black uppercase tracking-wider text-[#0f3c4c] dark:text-[#5eead4] flex items-center justify-center gap-1.5">
          <Stethoscope className="w-4 h-4 text-[#0d9488]" />
          <span>Mediclinic Enterprise</span>
        </h3>
        
        <p className="text-xs font-bold text-[#0d9488] dark:text-[#2dd4bf]">
          Initializing Clinical Encounter Workspace...
        </p>

        {/* ANIMATED INDETERMINATE PROGRESS BAR */}
        <div className="w-48 h-1.5 bg-[#e0f5f2] dark:bg-[#0c3844] border border-[#b2f5ea] dark:border-teal-800/40 rounded-none overflow-hidden mx-auto mt-3">
          <div className="h-full bg-[#0d9488] dark:bg-[#2dd4bf] w-1/2 animate-slide-fast"></div>
        </div>

        <span className="text-[10px] font-mono text-slate-400 dark:text-slate-400 block pt-1">
          Securing EMR Telemetry &amp; Clinical Data...
        </span>
      </div>

    </div>
  );
}
