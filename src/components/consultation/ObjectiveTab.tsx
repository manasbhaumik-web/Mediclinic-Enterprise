import React, { useState } from 'react';
import { Bluetooth, LineChart, Activity, Brain, Eye, Copy, Lock, Cpu } from 'lucide-react';
import Input from '../ui/Input';
import { Visit } from '../../types';

interface ObjectiveTabProps {
  vitals: {
    bpSystolic: number;
    bpDiastolic: number;
    heartRate: number;
    temperature: number;
    respiratoryRate: number;
  };
  setVitals: React.Dispatch<React.SetStateAction<{
    bpSystolic: number;
    bpDiastolic: number;
    heartRate: number;
    temperature: number;
    respiratoryRate: number;
  }>>;
  patientPastVisits: Visit[];
}

export default function ObjectiveTab({
  vitals,
  setVitals,
  patientPastVisits
}: ObjectiveTabProps) {
  const [isSyncingVitals, setIsSyncingVitals] = useState(false);

  const handleSyncVitals = () => {
    if (isSyncingVitals) return;
    setIsSyncingVitals(true);
    // Simulate Bluetooth sync with hardware IoT
    setTimeout(() => {
      setVitals({
        bpSystolic: 122,
        bpDiastolic: 78,
        heartRate: 84,
        temperature: 37.1,
        respiratoryRate: 18
      });
      setIsSyncingVitals(false);
    }, 2500);
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-accent dark:bg-night-850 p-3.5 rounded-none border border-line dark:border-teal-800/50 shadow-xs">
        <div>
          <div className="flex items-center justify-center gap-2">
            <h4 className="type-label text-ink dark:text-teal-300 flex items-center justify-center gap-1.5">
              <Activity className="w-4 h-4 text-accent dark:text-teal-400" />
              Objective Vitals &amp; Hardware Examination
            </h4>
            <span className="flex items-center justify-center gap-1 bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50 px-2 py-0.5 rounded-none text-2xs font-bold">
              <Lock className="w-3 h-3 text-amber-600 dark:text-amber-400" /> Triage Locked
            </span>
          </div>
          <p className="text-2xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Physical examination readings captured at check-in station.</p>
        </div>

        <div className="flex items-center justify-center gap-2 shrink-0">
          <button 
            type="button"
            onClick={() => {
              if (patientPastVisits.length > 0) {
                setVitals(patientPastVisits[0].soap.objective);
              }
            }}
            disabled={patientPastVisits.length === 0}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-none text-2xs font-bold transition-all shadow-xs border bg-white dark:bg-night-700 text-accent dark:text-teal-300 border-line dark:border-teal-700/50 hover:bg-surface-accent dark:hover:bg-night-600 disabled:opacity-40 cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5 text-accent dark:text-teal-400" />
            Copy Previous
          </button>
          <button 
            type="button"
            onClick={handleSyncVitals}
            disabled={isSyncingVitals}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-none text-2xs font-bold transition-all shadow-xs border cursor-pointer ${
              isSyncingVitals 
                ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-300 dark:border-sky-800 animate-pulse' 
                : 'bg-primary dark:bg-primary text-white border-primary dark:border-brand hover:bg-primary dark:hover:bg-teal-500'
            }`}
          >
            <Bluetooth className="w-3.5 h-3.5" />
            {isSyncingVitals ? 'Connecting to device...' : 'Import vitals from connected device'}
          </button>
        </div>
      </div>

      {/* Vitals Trending Sparkline */}
      {patientPastVisits.length > 1 && (
        <div className="bg-surface dark:bg-night-800 rounded-none p-3 border border-line dark:border-teal-800/50 flex items-center justify-between shadow-xs">
          <div className="flex items-center justify-center gap-2">
            <LineChart className="w-4 h-4 text-accent dark:text-teal-400" />
            <span className="text-2xs font-bold text-ink dark:text-teal-300 uppercase tracking-wider">Longitudinal BP Trend (Last 3 Visits)</span>
          </div>
          <div className="flex items-center justify-center gap-3">
            {patientPastVisits.slice(0, 3).map((v, i) => (
              <div key={i} className="flex flex-col items-center bg-white dark:bg-night-850 px-2.5 py-1 rounded-none border border-line dark:border-teal-800/40">
                <span className="text-2xs text-slate-400 dark:text-slate-400 font-mono">{v.date.substring(5)}</span>
                <span className="text-xs font-bold font-mono text-accent dark:text-teal-400">{v.soap.objective.bpSystolic}/{v.soap.objective.bpDiastolic}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Vitals Grid Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5">
        <div className="p-3.5 bg-white dark:bg-night-800 border border-line dark:border-teal-800/50 rounded-none shadow-2xs hover:shadow-xs transition-all">
          <label className="block text-2xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider mb-1">
            BP Systolic (mmHg)
          </label>
          <Input
            type="number"
            id="vital-bp-sys"
            value={vitals.bpSystolic}
            onChange={(e) => setVitals({ ...vitals, bpSystolic: parseInt(e.target.value) || 0 })}
            readOnly
            className="w-full border border-slate-200 dark:border-teal-800/40 rounded-none px-3 py-1.5 text-xs font-mono font-bold bg-slate-50 dark:bg-night-900 text-ink dark:text-teal-200 cursor-not-allowed"
          />
          {vitals.bpSystolic > 140 ? (
            <span className="text-2xs text-rose-600 dark:text-rose-400 font-bold block mt-1.5">⚠️ Alert: Stage 2 Hypertension</span>
          ) : vitals.bpSystolic >= 130 ? (
            <span className="text-2xs text-amber-600 dark:text-amber-400 font-bold block mt-1.5">⚠️ Elevated Systolic</span>
          ) : (
            <span className="text-2xs text-emerald-600 dark:text-emerald-400 font-medium block mt-1.5">✓ Normal Range: 90 - 130</span>
          )}
        </div>

        <div className="p-3.5 bg-white dark:bg-night-800 border border-line dark:border-teal-800/50 rounded-none shadow-2xs hover:shadow-xs transition-all">
          <label className="block text-2xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider mb-1">
            BP Diastolic (mmHg)
          </label>
          <Input
            type="number"
            id="vital-bp-dia"
            value={vitals.bpDiastolic}
            onChange={(e) => setVitals({ ...vitals, bpDiastolic: parseInt(e.target.value) || 0 })}
            readOnly
            className="w-full border border-slate-200 dark:border-teal-800/40 rounded-none px-3 py-1.5 text-xs font-mono font-bold bg-slate-50 dark:bg-night-900 text-ink dark:text-teal-200 cursor-not-allowed"
          />
          {vitals.bpDiastolic > 90 ? (
            <span className="text-2xs text-rose-600 dark:text-rose-400 font-bold block mt-1.5">⚠️ Alert: High Diastolic</span>
          ) : (
            <span className="text-2xs text-emerald-600 dark:text-emerald-400 font-medium block mt-1.5">✓ Normal Range: 60 - 85</span>
          )}
        </div>

        <div className="p-3.5 bg-white dark:bg-night-800 border border-line dark:border-teal-800/50 rounded-none shadow-2xs hover:shadow-xs transition-all">
          <label className="block text-2xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider mb-1">
            Heart Rate (bpm)
          </label>
          <Input
            type="number"
            id="vital-hr"
            value={vitals.heartRate}
            onChange={(e) => setVitals({ ...vitals, heartRate: parseInt(e.target.value) || 0 })}
            readOnly
            className="w-full border border-slate-200 dark:border-teal-800/40 rounded-none px-3 py-1.5 text-xs font-mono font-bold bg-slate-50 dark:bg-night-900 text-ink dark:text-teal-200 cursor-not-allowed"
          />
          {vitals.heartRate > 100 || vitals.heartRate < 50 ? (
            <span className="text-2xs text-amber-600 dark:text-amber-400 font-bold block mt-1.5">⚠️ Tachy/Bradycardia Alert</span>
          ) : (
            <span className="text-2xs text-emerald-600 dark:text-emerald-400 font-medium block mt-1.5">✓ Normal Range: 60 - 100</span>
          )}
        </div>

        <div className="p-3.5 bg-white dark:bg-night-800 border border-line dark:border-teal-800/50 rounded-none shadow-2xs hover:shadow-xs transition-all">
          <label className="block text-2xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider mb-1">
            Body Temperature (°C)
          </label>
          <Input
            type="number"
            step="0.1"
            id="vital-temp"
            value={vitals.temperature}
            onChange={(e) => setVitals({ ...vitals, temperature: parseFloat(e.target.value) || 0 })}
            readOnly
            className="w-full border border-slate-200 dark:border-teal-800/40 rounded-none px-3 py-1.5 text-xs font-mono font-bold bg-slate-50 dark:bg-night-900 text-ink dark:text-teal-200 cursor-not-allowed"
          />
          {vitals.temperature >= 37.5 ? (
            <span className="text-2xs bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 px-2 py-0.5 rounded-none font-bold inline-block mt-1.5">
              🔥 Fever Alert ({vitals.temperature}°C)
            </span>
          ) : (
            <span className="text-2xs text-emerald-600 dark:text-emerald-400 font-medium block mt-1.5">✓ Normal Range: 36.4 - 37.2</span>
          )}
        </div>

        <div className="p-3.5 bg-white dark:bg-night-800 border border-line dark:border-teal-800/50 rounded-none shadow-2xs hover:shadow-xs transition-all">
          <label className="block text-2xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider mb-1">
            Respiratory Rate (bpm)
          </label>
          <Input
            type="number"
            id="vital-rr"
            value={vitals.respiratoryRate}
            onChange={(e) => setVitals({ ...vitals, respiratoryRate: parseInt(e.target.value) || 0 })}
            readOnly
            className="w-full border border-slate-200 dark:border-teal-800/40 rounded-none px-3 py-1.5 text-xs font-mono font-bold bg-slate-50 dark:bg-night-900 text-ink dark:text-teal-200 cursor-not-allowed"
          />
          <span className="text-2xs text-emerald-600 dark:text-emerald-400 font-medium block mt-1.5">✓ Normal Range: 12 - 20 bpm</span>
        </div>
      </div>

      {/* IoT Medical Device Telemetry */}
      <div className="bg-deep dark:bg-night-850 text-white p-4 rounded-none shadow-md border border-brand/40">
        <h4 className="type-label text-teal-200 dark:text-teal-300 mb-3 flex items-center justify-center gap-2">
          <Cpu className="w-4 h-4 text-emerald-400 dark:text-emerald-400" />
          IoT Medical Hardware Telemetry Gateway
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-primary/40 dark:bg-night-800 p-2.5 rounded-none border border-brand/40 flex flex-col justify-between">
            <span className="text-2xs text-teal-100 dark:text-teal-200 font-bold uppercase block">Omron BP-X Reader</span>
            <span className="text-2xs text-emerald-400 dark:text-emerald-400 font-bold flex items-center justify-center gap-1.5 mt-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Connected
            </span>
          </div>
          <div className="bg-primary/40 dark:bg-night-800 p-2.5 rounded-none border border-brand/40 flex flex-col justify-between">
            <span className="text-2xs text-teal-100 dark:text-teal-200 font-bold uppercase block">Nellcor Oximeter</span>
            <span className="text-2xs text-emerald-400 dark:text-emerald-400 font-bold flex items-center justify-center gap-1.5 mt-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Connected
            </span>
          </div>
          <div className="bg-primary/40 dark:bg-night-800 p-2.5 rounded-none border border-brand/40 flex flex-col justify-between">
            <span className="text-2xs text-teal-100 dark:text-teal-200 font-bold uppercase block">Welch Allyn Temp</span>
            <span className="text-2xs text-emerald-400 dark:text-emerald-400 font-bold flex items-center justify-center gap-1.5 mt-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Connected
            </span>
          </div>
          <div className="bg-primary/40 dark:bg-night-800 p-2.5 rounded-none border border-brand/40 flex flex-col justify-between">
            <span className="text-2xs text-teal-100 dark:text-teal-200 font-bold uppercase block">Digital Weight Scale</span>
            <span className="text-2xs text-slate-300 dark:text-slate-400 font-medium flex items-center justify-center gap-1.5 mt-1.5">
              <Bluetooth className="w-3 h-3 text-slate-400" />
              Standby
            </span>
          </div>
        </div>
      </div>

      {/* AR Medical Imaging Support */}
      <div className="bg-surface-accent dark:bg-night-850 p-4 rounded-none border border-line dark:border-teal-800/50 shadow-xs">
        <h4 className="type-label text-ink dark:text-teal-300 mb-1 flex items-center justify-center gap-2">
          <Brain className="w-4 h-4 text-accent dark:text-teal-400" />
          Augmented Reality (AR) Diagnostic Overlay
        </h4>
        <p className="text-2xs text-slate-600 dark:text-slate-300 mb-3 font-medium">
          Project MRI/CT scans directly into the clinician visual field using HoloLens or Apple Vision Pro.
        </p>
        <div className="flex gap-2">
          <button 
            type="button"
            onClick={() => alert('Launching HoloLens AR Diagnostic Spatial Stream...')}
            className="bg-primary dark:bg-primary hover:bg-primary-hover text-white px-3.5 py-1.5 rounded-none text-2xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            Launch AR Spatial View
          </button>
          <button 
            type="button"
            onClick={() => alert('Loading MRI anatomical sequence...')}
            className="bg-white dark:bg-night-700 border border-line dark:border-teal-700/50 text-accent dark:text-teal-300 hover:bg-white/80 dark:hover:bg-night-600 px-3.5 py-1.5 rounded-none text-2xs font-bold transition-all shadow-2xs cursor-pointer"
          >
            Load MRI DICOM Files
          </button>
        </div>
      </div>
    </div>
  );
}
