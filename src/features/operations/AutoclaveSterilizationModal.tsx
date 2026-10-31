import React, { useState } from 'react';
import { 
  X, 
  Flame, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Gauge, 
  Package, 
  Plus, 
  Check, 
  Calendar 
} from 'lucide-react';
import { 
  AutoclaveCycleRecord, 
  AutoclaveCycleProgram, 
  logAutoclaveCycle, 
  validateAutoclaveCycle,
  SterilePack 
} from '../../domain/autoclaveSterilization';

interface AutoclaveSterilizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStaffName?: string;
  onSelectPackForProcedure?: (pack: SterilePack) => void;
}

const INITIAL_CYCLES: AutoclaveCycleRecord[] = [
  {
    id: 'cycle-01',
    cycleNumber: 'CYCLE-20261101-01',
    timestamp: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
    autoclaveUnitId: 'AUTOCLAVE-01 (Tuttnauer 2540M)',
    program: '134C_Porous_2.1bar',
    achievedTemperatureC: 134.8,
    achievedPressureBar: 2.15,
    holdingTimeMinutes: 4.0,
    chemicalIndicatorPassed: true,
    biologicalSporeTestValid: true,
    operatorNurseId: 'nurse-02',
    operatorNurseName: 'Staff Nurse Fadhilah',
    isCycleCompliant: true,
    packsGenerated: [
      {
        packId: 'PACK-SUT-20261101-01-01',
        packType: 'SutureSet',
        sterilizedAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
        expiryDate: new Date(Date.now() + 29 * 86400 * 1000).toISOString().split('T')[0],
        isUsed: false
      },
      {
        packId: 'PACK-INC-20261101-01-02',
        packType: 'IncisionDrainageSet',
        sterilizedAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
        expiryDate: new Date(Date.now() + 29 * 86400 * 1000).toISOString().split('T')[0],
        isUsed: false
      },
      {
        packId: 'PACK-BIO-20261101-01-03',
        packType: 'BiopsyExcisionSet',
        sterilizedAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
        expiryDate: new Date(Date.now() + 29 * 86400 * 1000).toISOString().split('T')[0],
        isUsed: false
      }
    ]
  }
];

export default function AutoclaveSterilizationModal({
  isOpen,
  onClose,
  currentStaffName = 'Sister Noraini',
  onSelectPackForProcedure
}: AutoclaveSterilizationModalProps) {
  const [cycles, setCycles] = useState<AutoclaveCycleRecord[]>(INITIAL_CYCLES);
  const [viewMode, setViewMode] = useState<'packs' | 'cycles' | 'log'>('packs');

  // New Cycle Form State
  const [program, setProgram] = useState<AutoclaveCycleProgram>('134C_Porous_2.1bar');
  const [temperature, setTemperature] = useState('134.5');
  const [pressure, setPressure] = useState('2.15');
  const [holdTime, setHoldTime] = useState('4.0');
  const [chemicalPassed, setChemicalPassed] = useState(true);
  const [sporeTestValid, setSporeTestValid] = useState(true);
  const [packSutureCount, setPackSutureCount] = useState(2);
  const [packInciseCount, setPackInciseCount] = useState(1);
  const [packBiopsyCount, setPackBiopsyCount] = useState(1);

  if (!isOpen) return null;

  // Real-time compliance check for form
  const previewEval = validateAutoclaveCycle({
    program,
    achievedTemperatureC: parseFloat(temperature) || 0,
    achievedPressureBar: parseFloat(pressure) || 0,
    holdingTimeMinutes: parseFloat(holdTime) || 0,
    chemicalIndicatorPassed: chemicalPassed,
    biologicalSporeTestValid: sporeTestValid
  });

  const handleLogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cycleSeq = (cycles.length + 1).toString().padStart(2, '0');
    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const cycleNum = `CYCLE-${todayStr}-${cycleSeq}`;

    const packTypes: SterilePack['packType'][] = [];
    for (let i = 0; i < packSutureCount; i++) packTypes.push('SutureSet');
    for (let i = 0; i < packInciseCount; i++) packTypes.push('IncisionDrainageSet');
    for (let i = 0; i < packBiopsyCount; i++) packTypes.push('BiopsyExcisionSet');

    const newRecord = logAutoclaveCycle({
      cycleNumber: cycleNum,
      autoclaveUnitId: 'AUTOCLAVE-01 (Tuttnauer 2540M)',
      program,
      achievedTemperatureC: parseFloat(temperature) || 0,
      achievedPressureBar: parseFloat(pressure) || 0,
      holdingTimeMinutes: parseFloat(holdTime) || 0,
      chemicalIndicatorPassed: chemicalPassed,
      biologicalSporeTestValid: sporeTestValid,
      operatorNurseId: 'nurse-active',
      operatorNurseName: currentStaffName,
      packTypes
    });

    setCycles([newRecord, ...cycles]);
    setViewMode('packs');
  };

  const allAvailablePacks = cycles.flatMap(c => c.packsGenerated).filter(p => !p.isUsed);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-surface border border-line w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl rounded-none">
        
        {/* HEADER */}
        <div className="bg-surface-accent border-b border-line p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-teal-100 dark:bg-teal-900/60 text-accent border border-teal-300 rounded-none">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h3 className="type-section-title text-ink flex items-center gap-2">
                Autoclave Sterilization & Instrument Pack Register
                <span className="text-2xs font-mono font-bold px-2 py-0.5 chip-neutral">PHFSA Part XVI</span>
              </h3>
              <p className="text-2xs text-subtle">
                Statutory steam sterilization cycle validation, biological spore tests, and sterile pack batch tracking.
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="text-subtle hover:text-ink p-1 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* TABS */}
        <div className="px-5 py-3 border-b border-line bg-surface flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setViewMode('packs')}
              className={`px-3 py-1.5 text-xs font-bold rounded-none border cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'packs' ? 'bg-primary text-white border-primary' : 'bg-surface text-ink border-line hover:bg-surface-accent'
              }`}
            >
              <Package className="w-3.5 h-3.5" /> Sterile Instrument Packs ({allAvailablePacks.length})
            </button>
            <button
              type="button"
              onClick={() => setViewMode('cycles')}
              className={`px-3 py-1.5 text-xs font-bold rounded-none border cursor-pointer ${
                viewMode === 'cycles' ? 'bg-primary text-white border-primary' : 'bg-surface text-ink border-line hover:bg-surface-accent'
              }`}
            >
              Autoclave Cycle Logs ({cycles.length})
            </button>
            <button
              type="button"
              onClick={() => setViewMode('log')}
              className={`px-3 py-1.5 text-xs font-bold rounded-none border cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'log' ? 'bg-primary text-white border-primary' : 'bg-surface text-ink border-line hover:bg-surface-accent'
              }`}
            >
              <Plus className="w-3.5 h-3.5" /> Run & Log New Cycle
            </button>
          </div>

          <span className="text-2xs font-mono font-bold text-subtle">
            Autoclave #1: 134°C Porous Certified
          </span>
        </div>

        {/* BODY */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          
          {/* VIEW: PACKS */}
          {viewMode === 'packs' && (
            <div className="space-y-3">
              <div className="p-3 bg-surface-accent border border-line rounded-none flex items-center justify-between text-xs">
                <span className="text-subtle font-medium">Sterile instrument packs packaged in medical-grade Tyvek pouches (30-day validity from cycle).</span>
                <span className="font-mono font-bold text-accent">{allAvailablePacks.length} Ready for Clinical Use</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {allAvailablePacks.map((pack) => (
                  <div key={pack.packId} className="border border-line bg-surface p-3.5 rounded-none space-y-2.5 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs text-ink">{pack.packId}</span>
                      <span className="chip chip-ok text-2xs">STERILE</span>
                    </div>

                    <p className="text-xs font-bold text-accent">{pack.packType}</p>

                    <div className="text-2xs text-subtle space-y-0.5 font-mono pt-1 border-t border-line-subtle">
                      <p>Sterilized: {new Date(pack.sterilizedAt).toLocaleDateString()}</p>
                      <p className="font-bold text-ink">Expiry: {pack.expiryDate}</p>
                    </div>

                    {onSelectPackForProcedure && (
                      <button
                        type="button"
                        onClick={() => {
                          onSelectPackForProcedure(pack);
                          onClose();
                        }}
                        className="w-full mt-2 py-1.5 px-3 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-none cursor-pointer flex items-center justify-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" /> Select for Current Procedure
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VIEW: CYCLES */}
          {viewMode === 'cycles' && (
            <div className="space-y-3">
              {cycles.map((c) => (
                <div key={c.id} className="border border-line bg-surface p-4 rounded-none space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-ink">{c.cycleNumber}</span>
                      <span className="chip chip-brand text-2xs">{c.program}</span>
                      <span className={`text-2xs font-bold px-2 py-0.5 rounded-none border ${c.isCycleCompliant ? 'chip-ok' : 'chip-danger'}`}>
                        {c.isCycleCompliant ? 'CYCLE COMPLIANT (PASS)' : 'NON-COMPLIANT (FAILED)'}
                      </span>
                    </div>
                    <span className="text-2xs text-subtle font-mono">{new Date(c.timestamp).toLocaleString()}</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-surface-accent p-2.5 rounded-none font-mono text-2xs">
                    <div>
                      <span className="text-subtle block">Temperature:</span>
                      <span className="font-bold text-ink">{c.achievedTemperatureC}°C</span>
                    </div>
                    <div>
                      <span className="text-subtle block">Pressure:</span>
                      <span className="font-bold text-ink">{c.achievedPressureBar} bar</span>
                    </div>
                    <div>
                      <span className="text-subtle block">Hold Time:</span>
                      <span className="font-bold text-ink">{c.holdingTimeMinutes} mins</span>
                    </div>
                    <div>
                      <span className="text-subtle block">Chemical Strip:</span>
                      <span className="font-bold text-emerald-700">{c.chemicalIndicatorPassed ? 'Pass' : 'Fail'}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-2xs text-subtle pt-1 font-mono">
                    <span>Operator: {c.operatorNurseName}</span>
                    <span>Packs generated: {c.packsGenerated.length} set(s)</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* VIEW: LOG NEW CYCLE */}
          {viewMode === 'log' && (
            <form onSubmit={handleLogSubmit} className="space-y-4 max-w-2xl mx-auto">
              
              {/* Compliance Preview Banner */}
              <div className={`p-3 rounded-none border flex items-center justify-between text-xs ${
                previewEval.isCompliant ? 'chip-ok' : 'chip-danger'
              }`}>
                <div className="flex items-center gap-2">
                  {previewEval.isCompliant ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                  <span className="font-bold">
                    {previewEval.isCompliant 
                      ? 'Autoclave parameters conform to PHFSA 1998 Part XVI specifications.' 
                      : previewEval.error}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-2xs font-bold text-subtle uppercase mb-1">Sterilization Program *</label>
                  <select
                    value={program}
                    onChange={e => setProgram(e.target.value as AutoclaveCycleProgram)}
                    className="w-full text-xs p-2 border border-line bg-surface text-ink rounded-none"
                  >
                    <option value="134C_Porous_2.1bar">134°C Porous & Hollow Cycle (2.1 bar, ≥ 3.5 min)</option>
                    <option value="121C_Rubber_1.1bar">121°C Rubber / Unwrapped Cycle (1.1 bar, ≥ 15 min)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-2xs font-bold text-subtle uppercase mb-1">Achieved Temperature (°C) *</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={temperature}
                    onChange={e => setTemperature(e.target.value)}
                    className="w-full text-xs p-2 border border-line bg-surface text-ink rounded-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-2xs font-bold text-subtle uppercase mb-1">Achieved Chamber Pressure (bar) *</label>
                  <input
                    type="number"
                    step="0.05"
                    required
                    value={pressure}
                    onChange={e => setPressure(e.target.value)}
                    className="w-full text-xs p-2 border border-line bg-surface text-ink rounded-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-2xs font-bold text-subtle uppercase mb-1">Holding Sterilization Time (Minutes) *</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={holdTime}
                    onChange={e => setHoldTime(e.target.value)}
                    className="w-full text-xs p-2 border border-line bg-surface text-ink rounded-none font-mono"
                  />
                </div>
              </div>

              {/* Physical / Biological Indicators */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-surface-accent border border-line-subtle rounded-none">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-ink">
                  <input
                    type="checkbox"
                    checked={chemicalPassed}
                    onChange={e => setChemicalPassed(e.target.checked)}
                    className="rounded-none border-line"
                  />
                  <span>Class 5/6 Chemical Indicator Strip passed color transition</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-ink">
                  <input
                    type="checkbox"
                    checked={sporeTestValid}
                    onChange={e => setSporeTestValid(e.target.checked)}
                    className="rounded-none border-line"
                  />
                  <span>Weekly Biological Spore Test (G. stearothermophilus) verified</span>
                </label>
              </div>

              {/* Pack Generation Counter */}
              <div className="space-y-2 border-t border-line pt-3">
                <h4 className="text-2xs font-bold text-subtle uppercase">Packs to Generate in this Batch:</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-3xs font-mono text-muted mb-1">Suture Sets</label>
                    <input
                      type="number"
                      min={0}
                      value={packSutureCount}
                      onChange={e => setPackSutureCount(parseInt(e.target.value) || 0)}
                      className="w-full text-xs p-1.5 border border-line bg-surface rounded-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-3xs font-mono text-muted mb-1">Incision & Drainage</label>
                    <input
                      type="number"
                      min={0}
                      value={packInciseCount}
                      onChange={e => setPackInciseCount(parseInt(e.target.value) || 0)}
                      className="w-full text-xs p-1.5 border border-line bg-surface rounded-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-3xs font-mono text-muted mb-1">Biopsy / Excision</label>
                    <input
                      type="number"
                      min={0}
                      value={packBiopsyCount}
                      onChange={e => setPackBiopsyCount(parseInt(e.target.value) || 0)}
                      className="w-full text-xs p-1.5 border border-line bg-surface rounded-none font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-line">
                <button
                  type="button"
                  onClick={() => setViewMode('packs')}
                  className="px-4 py-2 text-xs font-bold bg-surface border border-line text-ink hover:bg-surface-accent rounded-none cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!previewEval.isCompliant}
                  className="px-4 py-2 text-xs font-bold bg-primary hover:bg-primary-hover text-white rounded-none cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Record Validated Cycle & Generate Packs
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
