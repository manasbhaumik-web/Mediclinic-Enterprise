import React from 'react';
import { Activity, Stethoscope, ShieldCheck, Heart, Cpu } from 'lucide-react';

export default function GlobalSpinner() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[65vh] p-6 space-y-6 animate-fadeIn font-sans text-[#0f3c4c] dark:text-slate-100">
      
      {/* HIGH-TECH MEDICAL MONITOR FRAME & ANIMATED ECG SVG */}
      <div className="relative bg-white dark:bg-[#07252d] border-2 border-[#0d9488] p-6 shadow-2xl rounded-none space-y-4 max-w-md w-full animate-pulse-glow">
        
        {/* Top Monitor Status Header */}
        <div className="flex items-center justify-between border-b border-[#b2f5ea] dark:border-teal-800/40 pb-2 text-[10px] font-mono uppercase font-bold text-[#0f766e] dark:text-[#5eead4]">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span>EMR Telemetry Link: Active</span>
          </div>
          <span className="bg-[#e0f5f2] dark:bg-[#082830] px-2 py-0.5 border border-[#b2f5ea] text-[#0d9488]">
            24/7 Monitoring
          </span>
        </div>

        {/* SVG ECG Heartbeat Pulse Line Waveform Canvas */}
        <div className="relative bg-[#082830] p-4 border border-[#0d9488]/50 rounded-none overflow-hidden h-32 flex items-center justify-center shadow-inner">
          
          {/* Background Grid Pattern */}
          <div 
            className="absolute inset-0 opacity-20 pointer-events-none" 
            style={{
              backgroundImage: `linear-gradient(#2dd4bf 1px, transparent 1px), linear-gradient(90deg, #2dd4bf 1px, transparent 1px)`,
              backgroundSize: '16px 16px'
            }}
          />

          {/* Animated Radar Sweep Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#2dd4bf]/10 to-transparent w-full h-full animate-radar opacity-40"></div>

          {/* SVG ECG Waveform Path */}
          <svg className="w-full h-24 relative z-10" viewBox="0 0 500 120" fill="none">
            {/* Background static baseline */}
            <path
              d="M0 60 L120 60 L135 60 L145 20 L155 100 L165 40 L175 75 L185 60 L320 60 L335 60 L345 20 L355 100 L365 40 L375 75 L385 60 L500 60"
              stroke="#0f766e"
              strokeWidth="2"
              strokeOpacity="0.4"
            />
            {/* Glowing animated pulse stroke */}
            <path
              d="M0 60 L120 60 L135 60 L145 20 L155 100 L165 40 L175 75 L185 60 L320 60 L335 60 L345 20 L355 100 L365 40 L375 75 L385 60 L500 60"
              stroke="#2dd4bf"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="animate-ecg"
            />
          </svg>

          {/* Center Brand Badge Overlay */}
          <div className="absolute center bg-[#07252d]/90 border border-[#0d9488] px-3 py-1.5 flex items-center gap-2 shadow-lg backdrop-blur-xs">
            <img src="./logo_transparent.svg" alt="Mediclinic" className="w-5 h-5 object-contain" />
            <span className="text-[11px] font-mono font-black text-[#5eead4] uppercase tracking-wider">Mediclinic Core</span>
          </div>
        </div>

        {/* Loading Progress Bar & Microcopy */}
        <div className="space-y-2 text-center pt-1">
          <div className="flex items-center justify-between text-xs font-bold text-[#0f3c4c] dark:text-[#5eead4]">
            <span className="flex items-center gap-1.5">
              <Stethoscope className="w-4 h-4 text-[#0d9488]" />
              Loading Module Workspace...
            </span>
            <span className="font-mono text-[#0d9488] dark:text-[#2dd4bf] text-[11px]">88%</span>
          </div>

          <div className="w-full h-2 bg-[#e0f5f2] dark:bg-[#082830] border border-[#b2f5ea] dark:border-teal-800/40 rounded-none overflow-hidden">
            <div className="h-full bg-[#0d9488] dark:bg-[#2dd4bf] w-4/5 animate-pulse"></div>
          </div>

          <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400 font-medium">
            Verifying KKM Regulatory Data &amp; Patient Encounters...
          </p>
        </div>

      </div>

    </div>
  );
}
