import React, { useState } from 'react';
import { 
  Activity, Stethoscope, ShieldCheck, Heart, Zap, FileText, Pill, 
  CheckCircle2, Dna, Radio, Layers, RefreshCw, Cpu, Database
} from 'lucide-react';

export default function GlobalSpinner() {
  // Allow toggling variants or default to Option 4 (Synchronized Quad-Pulse Matrix)
  const [variant, setVariant] = useState<'matrix' | 'ecg' | 'dna' | 'radar'>('matrix');

  return (
    <div className="flex flex-col items-center justify-center min-h-[65vh] p-6 space-y-6 animate-fadeIn font-sans text-[#0f3c4c] dark:text-slate-100">
      
      {/* MAIN CONTAINER (ICE-MINT FLAT 0PX BORDER SYSTEM) */}
      <div className="relative bg-white dark:bg-[#07252d] border-2 border-[#0d9488] p-6 shadow-2xl rounded-none space-y-5 max-w-xl w-full">
        
        {/* TOP HUD STATUS HEADER */}
        <div className="flex items-center justify-between border-b-2 border-[#b2f5ea] dark:border-teal-800/50 pb-3 text-[10px] font-mono uppercase font-bold text-[#0f766e] dark:text-[#5eead4]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
            <span>CLINICAL TELEMETRY INITIALIZER</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="bg-[#e0f5f2] dark:bg-[#082830] px-2.5 py-0.5 border border-[#0d9488] text-[#0d9488] dark:text-[#2dd4bf] font-black">
              QUAD-MATRIX MODE
            </span>
          </div>
        </div>

        {/* VARIANT 1: SYNCHRONIZED QUAD-PULSE CLINICAL MATRIX (USER SELECTED) */}
        {variant === 'matrix' && (
          <div className="space-y-4">
            {/* 4-BLOCK CLINICAL TELEMETRY GRID */}
            <div className="grid grid-cols-2 gap-3">
              {/* Block 1: Vitals Sync */}
              <div className="bg-[#f0fdfa] dark:bg-[#082830] border border-[#0d9488] p-3.5 rounded-none space-y-2 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold text-[#0f766e] dark:text-[#2dd4bf] flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-[#0d9488]" />
                    1. Vitals Sync
                  </span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <p className="text-[10px] text-slate-600 dark:text-slate-300 font-mono">120/80 BP • 72 BPM</p>
                <div className="w-full h-1.5 bg-emerald-200 dark:bg-emerald-950 border border-emerald-500">
                  <div className="h-full bg-emerald-600 w-full"></div>
                </div>
              </div>

              {/* Block 2: EMR Records */}
              <div className="bg-[#f0fdfa] dark:bg-[#082830] border-2 border-[#0d9488] p-3.5 rounded-none space-y-2 relative overflow-hidden shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold text-[#0d9488] dark:text-[#5eead4] flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-[#0d9488]" />
                    2. EMR Profile
                  </span>
                  <RefreshCw className="w-3.5 h-3.5 text-[#0d9488] animate-spin" />
                </div>
                <p className="text-[10px] text-[#0d9488] dark:text-[#5eead4] font-mono font-bold">Downloading ICD-10...</p>
                <div className="w-full h-1.5 bg-[#e0f5f2] dark:bg-[#07252d] border border-[#0d9488]">
                  <div className="h-full bg-[#0d9488] w-3/4 animate-pulse"></div>
                </div>
              </div>

              {/* Block 3: Rx Safety Check */}
              <div className="bg-[#f7fdfd] dark:bg-[#051e24] border border-[#b2f5ea] dark:border-teal-900 p-3.5 rounded-none space-y-2 relative opacity-95">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#0f766e]" />
                    3. Allergy Index
                  </span>
                  <span className="text-[9px] font-mono bg-[#e0f5f2] dark:bg-[#082830] text-[#0f766e] px-1.5 py-0.5 border border-[#0d9488]">QUEUED</span>
                </div>
                <p className="text-[10px] text-slate-500 font-mono">NSAID Contraindications</p>
                <div className="w-full h-1.5 bg-[#e0f5f2] dark:bg-[#07252d] border border-[#0d9488]/40">
                  <div className="h-full bg-[#0d9488]/50 w-1/3"></div>
                </div>
              </div>

              {/* Block 4: Dispensary Route */}
              <div className="bg-[#f7fdfd] dark:bg-[#051e24] border border-[#b2f5ea] dark:border-teal-900 p-3.5 rounded-none space-y-2 relative opacity-90">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Pill className="w-4 h-4 text-[#0f766e]" />
                    4. Dispensary Sync
                  </span>
                  <span className="text-[9px] font-mono bg-[#e0f5f2] dark:bg-[#082830] text-[#0f766e] px-1.5 py-0.5 border border-[#0d9488]">STANDBY</span>
                </div>
                <p className="text-[10px] text-slate-500 font-mono">Batch & Stock Verification</p>
                <div className="w-full h-1.5 bg-[#e0f5f2] dark:bg-[#07252d] border border-[#0d9488]/40">
                  <div className="h-full bg-[#0d9488]/30 w-1/6"></div>
                </div>
              </div>
            </div>

            {/* OVERALL PROGRESS ADVISORY BAR */}
            <div className="bg-[#082830] border border-[#0d9488] p-3 text-white space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="flex items-center gap-2 font-bold text-[#5eead4]">
                  <Stethoscope className="w-4 h-4 text-[#2dd4bf]" />
                  SYNCHRONIZING CLINICAL MODULES...
                </span>
                <span className="text-[#2dd4bf] font-black">75%</span>
              </div>
              <div className="w-full h-2 bg-[#07252d] border border-[#0d9488] overflow-hidden">
                <div className="h-full bg-[#0d9488] w-[75%] transition-all duration-500"></div>
              </div>
            </div>
          </div>
        )}

        {/* VARIANT 2: ECG TELEMETRY MONITOR */}
        {variant === 'ecg' && (
          <div className="relative bg-[#082830] p-4 border border-[#0d9488] rounded-none overflow-hidden h-40 flex flex-col justify-between shadow-inner">
            <div className="relative z-10 flex items-center justify-between font-mono text-[10px] text-teal-200">
              <div className="flex items-center gap-1.5 bg-[#07252d] px-2 py-0.5 border border-[#0d9488]">
                <Heart className="w-3 h-3 text-rose-400 animate-bounce" />
                <span>HR: <strong className="text-white">72 BPM</strong></span>
              </div>
              <div className="flex items-center gap-1.5 bg-[#07252d] px-2 py-0.5 border border-[#0d9488]">
                <Activity className="w-3 h-3 text-[#2dd4bf]" />
                <span>BP: <strong className="text-white">120/80</strong></span>
              </div>
              <div className="flex items-center gap-1.5 bg-[#07252d] px-2 py-0.5 border border-[#0d9488]">
                <Zap className="w-3 h-3 text-amber-300" />
                <span>SpO2: <strong className="text-white">99%</strong></span>
              </div>
            </div>
            <svg className="w-full h-20 relative z-10" viewBox="0 0 500 120" fill="none">
              <path
                d="M0 60 L100 60 L115 60 L125 20 L135 100 L145 40 L155 75 L165 60 L300 60 L315 60 L325 20 L335 100 L345 40 L355 75 L365 60 L500 60"
                stroke="#0f766e"
                strokeWidth="2"
                strokeOpacity="0.4"
              />
              <path
                d="M0 60 L100 60 L115 60 L125 20 L135 100 L145 40 L155 75 L165 60 L300 60 L315 60 L325 20 L335 100 L345 40 L355 75 L365 60 L500 60"
                stroke="#2dd4bf"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="animate-ecg"
              />
            </svg>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#07252d] border-2 border-[#0d9488] px-3.5 py-1.5 flex items-center gap-2 z-20">
              <span className="text-[11px] font-mono font-black text-[#5eead4] uppercase tracking-wider">
                ECG TELEMETRY MODE
              </span>
            </div>
          </div>
        )}

        {/* VARIANT 3: GENOMIC DNA HELIX SCANNER */}
        {variant === 'dna' && (
          <div className="bg-[#082830] border border-[#0d9488] p-6 text-center space-y-4 relative overflow-hidden">
            <div className="flex items-center justify-center gap-4 py-2">
              <Dna className="w-12 h-12 text-[#2dd4bf] animate-spin" style={{ animationDuration: '6s' }} />
              <div className="text-left font-mono space-y-1">
                <p className="text-xs font-black text-[#5eead4] uppercase">DNA GENOMIC HELIX SCANNER</p>
                <p className="text-[10px] text-teal-200">Sequencing Patient Biomarkers & History...</p>
                <p className="text-[10px] text-emerald-400 font-bold">MATCH SCORE: 99.8% VERIFIED</p>
              </div>
            </div>
            <div className="w-full h-2 bg-[#07252d] border border-[#0d9488] overflow-hidden">
              <div className="h-full bg-[#2dd4bf] w-4/5 animate-pulse"></div>
            </div>
          </div>
        )}

        {/* VARIANT 4: CLINICAL VITAL RADAR SWEEP */}
        {variant === 'radar' && (
          <div className="bg-[#082830] border border-[#0d9488] p-6 flex items-center justify-center gap-6 relative overflow-hidden">
            <div className="relative w-20 h-20 border-2 border-[#0d9488] rounded-full flex items-center justify-center animate-pulse">
              <div className="absolute inset-2 border border-[#2dd4bf]/50 rounded-full"></div>
              <Radio className="w-8 h-8 text-[#2dd4bf]" />
            </div>
            <div className="font-mono text-left space-y-1">
              <p className="text-xs font-black text-[#5eead4] uppercase">CLINICAL VITAL RADAR SWEEP</p>
              <p className="text-[10px] text-teal-200">Scanning IoT Connected Vitals Monitors...</p>
              <p className="text-[10px] text-amber-300 font-bold">DEVICE SYNC: 3 STATIONS LINKED</p>
            </div>
          </div>
        )}

        {/* FOOTER: SELECTOR BUTTONS TO TEST/SWITCH ANIMATED OPTIONS */}
        <div className="border-t border-[#b2f5ea] dark:border-teal-900 pt-3 flex items-center justify-between text-[10px] font-mono">
          <span className="font-bold text-[#0f766e] dark:text-[#2dd4bf] uppercase">ANIMATED IMAGE OPTIONS:</span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setVariant('matrix')}
              className={`px-2 py-1 border transition-colors cursor-pointer ${
                variant === 'matrix' 
                  ? 'bg-[#0d9488] text-white border-[#0d9488] font-bold' 
                  : 'bg-white dark:bg-[#082830] text-[#0f766e] dark:text-[#2dd4bf] border-[#0d9488]'
              }`}
            >
              1. Quad-Pulse Matrix
            </button>
            <button
              onClick={() => setVariant('ecg')}
              className={`px-2 py-1 border transition-colors cursor-pointer ${
                variant === 'ecg' 
                  ? 'bg-[#0d9488] text-white border-[#0d9488] font-bold' 
                  : 'bg-white dark:bg-[#082830] text-[#0f766e] dark:text-[#2dd4bf] border-[#0d9488]'
              }`}
            >
              2. ECG Wave
            </button>
            <button
              onClick={() => setVariant('dna')}
              className={`px-2 py-1 border transition-colors cursor-pointer ${
                variant === 'dna' 
                  ? 'bg-[#0d9488] text-white border-[#0d9488] font-bold' 
                  : 'bg-white dark:bg-[#082830] text-[#0f766e] dark:text-[#2dd4bf] border-[#0d9488]'
              }`}
            >
              3. DNA Helix
            </button>
            <button
              onClick={() => setVariant('radar')}
              className={`px-2 py-1 border transition-colors cursor-pointer ${
                variant === 'radar' 
                  ? 'bg-[#0d9488] text-white border-[#0d9488] font-bold' 
                  : 'bg-white dark:bg-[#082830] text-[#0f766e] dark:text-[#2dd4bf] border-[#0d9488]'
              }`}
            >
              4. Vital Radar
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
