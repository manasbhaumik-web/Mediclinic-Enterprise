import React, { useState } from 'react';
import { Bluetooth, LineChart, Activity, Brain, Eye, Copy } from 'lucide-react';
import Button from '../ui/Button';
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
      <div className="flex justify-between items-center">
        <p className="text-xs text-slate-500 font-semibold">Record physical examination and vital signs.</p>
        <div className="flex gap-2">
          <Button 
            onClick={() => {
              if(patientPastVisits.length > 0) {
                setVitals(patientPastVisits[0].soap.objective);
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase transition-all shadow-sm border bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200 cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5" />
            Copy Previous
          </Button>
          <Button 
            onClick={handleSyncVitals}
            disabled={isSyncingVitals}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase transition-all shadow-sm border ${
              isSyncingVitals 
                ? 'bg-blue-50 text-blue-500 border-blue-200 animate-pulse' 
                : 'bg-[#0D9488]/10 text-[#0D9488] border-cyan-200 hover:bg-[#0D9488]/20 cursor-pointer'
            }`}
          >
            <Bluetooth className="w-3.5 h-3.5" />
            {isSyncingVitals ? 'Syncing Hardware...' : 'Sync IoT Vitals'}
          </Button>
        </div>
      </div>

      {/* Vitals Trending Sparkline */}
      {patientPastVisits.length > 1 && (
        <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 flex items-center justify-between shadow-inner">
          <div className="flex items-center gap-2">
            <LineChart className="w-4 h-4 text-slate-400" />
            <span className="text-[10px] font-bold text-slate-500 uppercase">BP Trend (Last 3 Visits)</span>
          </div>
          <div className="flex items-center gap-3">
            {patientPastVisits.slice(0,3).map((v, i) => (
              <div key={i} className="flex flex-col items-center">
                <span className="text-[9px] text-slate-400 font-mono">{v.date.substring(5)}</span>
                <span className="text-xs font-bold text-slate-700">{v.soap.objective.bpSystolic}/{v.soap.objective.bpDiastolic}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            BP Systolic (mmHg)
          </label>
          <Input
            type="number"
            id="vital-bp-sys"
            value={vitals.bpSystolic}
            onChange={(e) => setVitals({ ...vitals, bpSystolic: parseInt(e.target.value) || 0 })}
            className="w-full border border-slate-300 rounded px-2.5 py-1 text-xs font-mono font-bold"
          />
          {vitals.bpSystolic > 140 ? (
            <span className="text-[9px] text-red-600 font-semibold block mt-1">Alert: Hypertension Level</span>
          ) : (
            <span className="text-[9px] text-slate-400 block mt-1">Normal Range: 90 - 130</span>
          )}
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            BP Diastolic (mmHg)
          </label>
          <Input
            type="number"
            id="vital-bp-dia"
            value={vitals.bpDiastolic}
            onChange={(e) => setVitals({ ...vitals, bpDiastolic: parseInt(e.target.value) || 0 })}
            className="w-full border border-slate-300 rounded px-2.5 py-1 text-xs font-mono font-bold"
          />
          {vitals.bpDiastolic > 90 ? (
            <span className="text-[9px] text-red-500 font-semibold block mt-1">Elevated diastolic diastolic</span>
          ) : (
            <span className="text-[9px] text-slate-400 block mt-1">Normal Range: 60 - 85</span>
          )}
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Heart Rate (bpm)
          </label>
          <Input
            type="number"
            id="vital-hr"
            value={vitals.heartRate}
            onChange={(e) => setVitals({ ...vitals, heartRate: parseInt(e.target.value) || 0 })}
            className="w-full border border-slate-300 rounded px-2.5 py-1 text-xs font-mono font-bold"
          />
          {vitals.heartRate > 100 || vitals.heartRate < 50 ? (
            <span className="text-[9px] text-amber-600 font-semibold block mt-1">Tachy/Bradycardia Warning</span>
          ) : (
            <span className="text-[9px] text-slate-400 block mt-1">Normal Range: 60 - 100</span>
          )}
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Temperature (°C)
          </label>
          <Input
            type="number"
            step="0.1"
            id="vital-temp"
            value={vitals.temperature}
            onChange={(e) => setVitals({ ...vitals, temperature: parseFloat(e.target.value) || 0 })}
            className="w-full border border-slate-300 rounded px-2.5 py-1 text-xs font-mono font-bold"
          />
          {vitals.temperature >= 37.5 ? (
            <span className="text-[9px] bg-red-100 text-red-700 px-1 py-0.2 rounded font-semibold inline-block mt-1">
              Fever Detected
            </span>
          ) : (
            <span className="text-[9px] text-slate-400 block mt-1">Normal Range: 36.4 - 37.2</span>
          )}
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Respiratory Rate (bpm)
          </label>
          <Input
            type="number"
            id="vital-rr"
            value={vitals.respiratoryRate}
            onChange={(e) => setVitals({ ...vitals, respiratoryRate: parseInt(e.target.value) || 0 })}
            className="w-full border border-slate-300 rounded px-2.5 py-1 text-xs font-mono font-bold"
          />
          <span className="text-[9px] text-slate-400 block mt-1">Normal Range: 12 - 20 bpm</span>
        </div>
      </div>

      {/* IoT Medical Device Telemetry */}
      <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 shadow-sm mt-4">
        <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4" />
          IoT Medical Device Network
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-slate-900 p-2 rounded-lg border border-slate-600 flex flex-col justify-between">
            <span className="text-[9px] text-slate-400 font-bold uppercase block">Omron BP-X</span>
            <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 mt-1">
              <Bluetooth className="w-3 h-3" /> Connected
            </span>
          </div>
          <div className="bg-slate-900 p-2 rounded-lg border border-slate-600 flex flex-col justify-between">
            <span className="text-[9px] text-slate-400 font-bold uppercase block">Nellcor Oximeter</span>
            <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 mt-1">
              <Bluetooth className="w-3 h-3" /> Connected
            </span>
          </div>
          <div className="bg-slate-900 p-2 rounded-lg border border-slate-600 flex flex-col justify-between">
            <span className="text-[9px] text-slate-400 font-bold uppercase block">Welch Allyn Temp</span>
            <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 mt-1">
              <Bluetooth className="w-3 h-3" /> Connected
            </span>
          </div>
          <div className="bg-slate-900 p-2 rounded-lg border border-slate-600 flex flex-col justify-between">
            <span className="text-[9px] text-slate-400 font-bold uppercase block">Digital Scale</span>
            <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1 mt-1">
              <Bluetooth className="w-3 h-3" /> Standby
            </span>
          </div>
        </div>
      </div>

      {/* AR Medical Imaging Support */}
      <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200 shadow-sm mt-4">
        <h4 className="text-xs font-bold text-indigo-800 uppercase tracking-wider mb-2 flex items-center gap-2">
          <Brain className="w-4 h-4" />
          Augmented Reality (AR) Overlay
        </h4>
        <p className="text-[10px] text-indigo-600 mb-3 font-medium">
          Project MRI/CT scans into the clinical field of view using Apple Vision or HoloLens.
        </p>
        <div className="flex gap-2">
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded text-[10px] font-bold transition-colors flex items-center gap-1 shadow-sm">
            <Eye className="w-3 h-3" />
            Launch AR View (HoloLens)
          </Button>
          <Button className="bg-white border border-indigo-300 text-indigo-700 hover:bg-indigo-100 px-3 py-1.5 rounded text-[10px] font-bold transition-colors shadow-sm">
            Load Latest MRI
          </Button>
        </div>
      </div>
    </div>
  );
}
