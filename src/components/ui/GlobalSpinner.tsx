import React from 'react';
import { Activity, Stethoscope, ShieldCheck, Heart, Cpu, Zap, Wifi } from 'lucide-react';

export default function GlobalSpinner() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[65vh] p-6 space-y-5 animate-fadeIn font-sans text-[#0f3c4c] dark:text-slate-100">
      
      {/* HIGH-TECH FLAT ICE-MINT TELEMETRY MONITOR CONTAINER */}
      <div className="relative bg-white dark:bg-[#07252d] border-2 border-[#0d9488] p-6 shadow-2xl rounded-none space-y-4 max-w-lg w-full">
        
        {/* TOP HUD STATUS HEADER */}
        <div className="flex items-center justify-between border-b-2 border-[#b2f5ea] dark:border-teal-800/50 pb-2 text-[10px] font-mono uppercase font-bold text-[#0f766e] dark:text-[#5eead4]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
            <span>EMR TELEMETRY STREAM: CONNECTED</span>
          </div>
          <span className="bg-[#e0f5f2] dark:bg-[#082830] px-2.5 py-0.5 border border-[#0d9488] text-[#0d9488] dark:text-[#2dd4bf]">
            24/7 LIVE HUD
          </span>
        </div>

        {/* ECG HEARTBEAT CANVAS WITH VITAL METRICS DISPLAY */}
        <div className="relative bg-[#082830] p-4 border border-[#0d9488] rounded-none overflow-hidden h-36 flex flex-col justify-between shadow-inner">
          
          {/* Flat Grid Background Pattern (NO GRADIENTS) */}
          <div 
            className="absolute inset-0 opacity-25 pointer-events-none" 
            style={{
              backgroundImage: `linear-gradient(#2dd4bf 1px, transparent 1px), linear-gradient(90deg, #2dd4bf 1px, transparent 1px)`,
              backgroundSize: '16px 16px'
            }}
          />

          {/* Top Live Vitals Digital Readout Strip */}
          <div className="relative z-10 flex items-center justify-between font-mono text-[10px] text-teal-200">
            <div className="flex items-center gap-1.5 bg-[#07252d] px-2 py-0.5 border border-[#0d9488]/60">
              <Heart className="w-3 h-3 text-rose-400 animate-bounce" />
              <span>HR: <strong className="text-white">72 BPM</strong></span>
            </div>
            <div className="flex items-center gap-1.5 bg-[#07252d] px-2 py-0.5 border border-[#0d9488]/60">
              <Activity className="w-3 h-3 text-[#2dd4bf]" />
              <span>BP: <strong className="text-white">120/80</strong></span>
            </div>
            <div className="flex items-center gap-1.5 bg-[#07252d] px-2 py-0.5 border border-[#0d9488]/60">
              <Zap className="w-3 h-3 text-amber-300" />
              <span>SpO2: <strong className="text-white">99%</strong></span>
            </div>
          </div>

          {/* SVG ECG Waveform Path Animation */}
          <svg className="w-full h-20 relative z-10" viewBox="0 0 500 120" fill="none">
            {/* Background static baseline */}
            <path
              d="M0 60 L100 60 L115 60 L125 20 L135 100 L145 40 L155 75 L165 60 L300 60 L315 60 L325 20 L335 100 L345 40 L355 75 L365 60 L500 60"
              stroke="#0f766e"
              strokeWidth="2"
              strokeOpacity="0.4"
            />
            {/* Animated ECG Pulse Path */}
            <path
              d="M0 60 L100 60 L115 60 L125 20 L135 100 L145 40 L155 75 L165 60 L300 60 L315 60 L325 20 L335 100 L345 40 L355 75 L365 60 L500 60"
              stroke="#2dd4bf"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="animate-ecg"
            />
          </svg>

          {/* Center Brand Overlay */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#07252d] border-2 border-[#0d9488] px-3.5 py-1.5 flex items-center gap-2 shadow-2xl z-20">
            <img src="./logo_transparent.svg" alt="Mediclinic" className="w-5 h-5 object-contain" />
            <span className="text-[11px] font-mono font-black text-[#5eead4] uppercase tracking-wider">
              MEDICLINIC SUITE
            </span>
          </div>
        </div>

        {/* LOADING PROGRESS & MICROCOPY */}
        <div className="space-y-2 text-center pt-1">
          <div className="flex items-center justify-between text-xs font-bold text-[#0f3c4c] dark:text-[#5eead4]">
            <span className="flex items-center gap-1.5">
              <Stethoscope className="w-4 h-4 text-[#0d9488]" />
              Initializing Encounter Workspace...
            </span>
            <span className="font-mono text-[#0d9488] dark:text-[#2dd4bf] text-xs font-black">ACTIVE</span>
          </div>

          {/* Flat Solid Progress Bar (NO GRADIENTS) */}
          <div className="w-full h-2 bg-[#e0f5f2] dark:bg-[#082830] border border-[#0d9488] rounded-none overflow-hidden relative">
            <div className="h-full bg-[#0d9488] dark:bg-[#2dd4bf] w-3/4 animate-pulse"></div>
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 dark:text-slate-400 font-medium pt-1">
            <span>KKM Standard Security Passed</span>
            <span>24/7 EMR Synchronized</span>
          </div>
        </div>

      </div>

    </div>
  );
}
