import React, { useState, useEffect, useMemo } from 'react';
import {
  X, CheckCircle2, AlertTriangle, ShieldCheck,
  Clock, Plus, FileText, Download, ShieldAlert,
  Calendar, Info, Thermometer, Snowflake, Flame, RefreshCw, Check
} from 'lucide-react';
import {
  VaccineRefrigerator,
  TwiceDailyTempRecord,
  ColdExcursionRecord,
  ShakeTestRecord,
  DEFAULT_VACCINE_FRIDGES,
  DEFAULT_COLD_CHAIN_RECORDS,
  DEFAULT_EXCURSION_RECORDS,
  evaluateTemperatureExcursion,
  evaluateShakeTestResult,
  isFridgeCheckDueForToday,
  exportColdChainMonthlyCsv,
} from '../../domain/coldChainVaccines';

interface ColdChainVaccineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRecordLogged?: (record: TwiceDailyTempRecord) => void;
}

const STORAGE_KEY_RECORDS = 'mediclinic_coldchain_records_v1';
const STORAGE_KEY_FRIDGES = 'mediclinic_coldchain_fridges_v1';
const STORAGE_KEY_EXCURSIONS = 'mediclinic_coldchain_excursions_v1';
const STORAGE_KEY_SHAKE = 'mediclinic_coldchain_shake_v1';

export default function ColdChainVaccineModal({
  isOpen,
  onClose,
  onRecordLogged,
}: ColdChainVaccineModalProps) {
  const [activeTab, setActiveTab] = useState<'status' | 'log_temp' | 'shake_test' | 'ledger'>('status');

  // Fridges & Records state
  const [fridges] = useState<VaccineRefrigerator[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_FRIDGES);
    return saved ? JSON.parse(saved) : DEFAULT_VACCINE_FRIDGES;
  });

  const [records, setRecords] = useState<TwiceDailyTempRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_RECORDS);
    return saved ? JSON.parse(saved) : DEFAULT_COLD_CHAIN_RECORDS;
  });

  const [excursions, setExcursions] = useState<ColdExcursionRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_EXCURSIONS);
    return saved ? JSON.parse(saved) : DEFAULT_EXCURSION_RECORDS;
  });

  const [shakeTests, setShakeTests] = useState<ShakeTestRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_SHAKE);
    return saved
      ? JSON.parse(saved)
      : [
          {
            id: 'ST-20261015-01',
            vaccineCode: 'HEXA-01',
            vaccineName: 'Hexaxim 6-in-1 (DTaP-IPV-HepB-Hib)',
            batchNo: 'HX9921A',
            testedAt: '2026-10-15T09:00:00.000Z',
            sedimentationTimeMinutes: 45,
            result: 'Pass',
            disposition: 'Approved for Use',
            testedByStaff: 'Dr. Siti / SN Aisyah',
            notes: 'Suspension maintained uniform cloudiness comparable to control vial after 45 mins. No clumping.',
          },
        ];
  });

  // Logging Form State
  const [selectedFridgeId, setSelectedFridgeId] = useState<string>(fridges[0]?.id || 'FRIDGE-VACC-01');
  const [logShift, setLogShift] = useState<'Morning (08:00)' | 'Evening (17:00)'>('Morning (08:00)');
  const [currentTemp, setCurrentTemp] = useState<string>('4.2');
  const [minTemp, setMinTemp] = useState<string>('3.5');
  const [maxTemp, setMaxTemp] = useState<string>('5.1');
  const [operatorName, setOperatorName] = useState<string>('Staff Nurse Aisyah');
  const [operatorId, setOperatorId] = useState<string>('STF-CA-01');
  const [logNotes, setLogNotes] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Shake Test Form State
  const [stVaccineName, setStVaccineName] = useState('Hexaxim 6-in-1 (DTaP-IPV-HepB-Hib)');
  const [stBatchNo, setStBatchNo] = useState('HX2026-B81');
  const [stSedimentationMin, setStSedimentationMin] = useState('45');
  const [stRapidSedimentation, setStRapidSedimentation] = useState(false);
  const [stStaff, setStStaff] = useState('Staff Nurse Aisyah');
  const [stNotes, setStNotes] = useState('Control vial compared side-by-side.');

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(records));
  }, [records]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_EXCURSIONS, JSON.stringify(excursions));
  }, [excursions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SHAKE, JSON.stringify(shakeTests));
  }, [shakeTests]);

  // Today check status
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const todayDueStatus = useMemo(() => isFridgeCheckDueForToday(records, todayStr), [records, todayStr]);

  // Dynamic evaluation of temperature inputs
  const numCurrent = parseFloat(currentTemp);
  const numMin = parseFloat(minTemp);
  const numMax = parseFloat(maxTemp);

  const evalResult = useMemo(() => {
    if (isNaN(numCurrent) || isNaN(numMin) || isNaN(numMax)) return null;
    return evaluateTemperatureExcursion(numCurrent, numMin, numMax);
  }, [numCurrent, numMin, numMax]);

  const isFormValid =
    !isNaN(numCurrent) &&
    !isNaN(numMin) &&
    !isNaN(numMax) &&
    operatorName.trim().length > 0 &&
    operatorId.trim().length > 0;

  // Handle logging temperature
  const handleLogTemperature = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || !evalResult) return;

    const newRecord: TwiceDailyTempRecord = {
      id: `CC-LOG-${Date.now()}`,
      fridgeId: selectedFridgeId,
      date: todayStr,
      shift: logShift,
      loggedAt: new Date().toISOString(),
      currentTempC: numCurrent,
      minTempC: numMin,
      maxTempC: numMax,
      isCompliant: evalResult.isCompliant,
      excursionType: evalResult.excursionType,
      operatorStaffName: operatorName.trim(),
      operatorStaffId: operatorId.trim(),
      notes: logNotes.trim() || undefined,
    };

    setRecords([newRecord, ...records]);

    if (!evalResult.isCompliant) {
      // Auto-register excursion incident
      const newExcursion: ColdExcursionRecord = {
        id: `EXC-${Date.now()}`,
        fridgeId: selectedFridgeId,
        occurredAt: new Date().toISOString(),
        detectedAt: new Date().toISOString(),
        excursionType: evalResult.excursionType || 'Freeze Hazard (<2°C)',
        lowestTempRecordedC: numMin,
        highestTempRecordedC: numMax,
        durationHours: 0.5,
        cause: evalResult.severity === 'freeze_hazard' ? 'Compressor Defect' : 'Door Ajar / Gasket Failure',
        actionTaken: evalResult.severity === 'freeze_hazard' ? 'Quarantined & Shake Test Run' : 'Transferred to Cold Box with Ice Packs',
        investigationReportRef: `INC-CC-${todayStr}`,
        reportedByStaff: operatorName,
        isResolved: false,
      };
      setExcursions([newExcursion, ...excursions]);
    }

    if (onRecordLogged) {
      onRecordLogged(newRecord);
    }

    setToastMessage(`Logged ${logShift} temperature: ${numCurrent}°C (${evalResult.isCompliant ? 'Compliant' : 'EXCURSION FLAGGED'})`);
    setTimeout(() => setToastMessage(null), 4000);
    setActiveTab('status');
  };

  // Handle logging shake test
  const handleLogShakeTest = (e: React.FormEvent) => {
    e.preventDefault();
    const evaluation = evaluateShakeTestResult(stRapidSedimentation, stVaccineName, stBatchNo);

    const newShake: ShakeTestRecord = {
      id: `ST-${Date.now()}`,
      vaccineCode: stVaccineName.split(' ')[0] || 'VACC',
      vaccineName: stVaccineName,
      batchNo: stBatchNo,
      testedAt: new Date().toISOString(),
      sedimentationTimeMinutes: parseInt(stSedimentationMin, 10) || 30,
      result: evaluation.result,
      disposition: evaluation.disposition,
      testedByStaff: stStaff,
      notes: `${stNotes} - ${evaluation.message}`,
    };

    setShakeTests([newShake, ...shakeTests]);
    setToastMessage(`Shake test logged: ${evaluation.result} - ${evaluation.disposition}`);
    setTimeout(() => setToastMessage(null), 4000);
    setStBatchNo('');
    setStNotes('');
  };

  // CSV export handler
  const handleExportCsv = () => {
    const csvContent = exportColdChainMonthlyCsv(records);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `KKM_Cold_Chain_Log_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-canvas border border-line w-full max-w-4xl max-h-[92vh] flex flex-col rounded-none overflow-hidden text-ink">
        {/* Header */}
        <div className="px-6 py-4 bg-canvas-subtle border-b border-line flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand/10 border border-brand/20 text-brand">
              <Thermometer className="w-5 h-5 text-brand" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold tracking-tight text-ink">
                  Vaccine Cold Chain & Refrigerator Log
                </h2>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-emerald-500/15 text-emerald-700 border border-emerald-500/30">
                  +2.0°C to +8.0°C Statutory Range
                </span>
              </div>
              <p className="text-xs text-ink-muted">
                PHFSA 1998 (Act 586) Reg. 38 &bull; KKM NIP Cold Chain Protocol &bull; Twice-Daily Verification
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCsv}
              className="px-2.5 py-1 text-xs font-medium border border-line hover:bg-canvas-subtle text-ink-muted hover:text-ink flex items-center gap-1.5 transition-colors"
              title="Export CSV formatted for Pejabat Kesihatan Daerah (PKD)"
            >
              <Download className="w-3.5 h-3.5" />
              <span>PKD Audit CSV</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-ink-muted hover:text-ink hover:bg-canvas-subtle border border-transparent hover:border-line transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Toast Notification */}
        {toastMessage && (
          <div className="bg-brand text-white px-6 py-2 text-xs font-medium flex items-center gap-2 border-b border-brand-accent animate-in slide-in-from-top-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-line bg-canvas px-6 gap-2">
          <button
            onClick={() => setActiveTab('status')}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'status'
                ? 'border-brand text-brand'
                : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Refrigerator Status</span>
            {todayDueStatus.isCheckDue && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" title="Check Due" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('log_temp')}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'log_temp'
                ? 'border-brand text-brand'
                : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Log Twice-Daily Check</span>
          </button>
          <button
            onClick={() => setActiveTab('shake_test')}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'shake_test'
                ? 'border-brand text-brand'
                : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            <Snowflake className="w-3.5 h-3.5" />
            <span>WHO Shake Test (Ujian Goncang)</span>
            {shakeTests.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 bg-canvas-subtle border border-line text-ink-muted">
                {shakeTests.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('ledger')}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'ledger'
                ? 'border-brand text-brand'
                : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>PKD Inspection Ledger</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: STATUS & DASHBOARD */}
          {activeTab === 'status' && (
            <div className="space-y-6">
              {/* Daily Shift Status Banner */}
              <div className="p-4 border border-line bg-canvas-subtle flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-brand" />
                    <span className="text-xs font-bold text-ink">
                      Today&apos;s Monitoring Checklist ({todayStr})
                    </span>
                  </div>
                  <p className="text-xs text-ink-muted">
                    MOH regulations mandate two manual checks per day at opening (08:00) and closing (17:00).
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 border text-xs font-medium ${
                    todayDueStatus.morningDone
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800'
                      : 'bg-amber-500/10 border-amber-500/30 text-amber-800'
                  }`}>
                    {todayDueStatus.morningDone ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Clock className="w-3.5 h-3.5 text-amber-600" />}
                    <span>Morning Check (08:00): {todayDueStatus.morningDone ? 'Logged' : 'Pending'}</span>
                  </div>

                  <div className={`flex items-center gap-1.5 px-3 py-1.5 border text-xs font-medium ${
                    todayDueStatus.eveningDone
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800'
                      : 'bg-amber-500/10 border-amber-500/30 text-amber-800'
                  }`}>
                    {todayDueStatus.eveningDone ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Clock className="w-3.5 h-3.5 text-amber-600" />}
                    <span>Evening Check (17:00): {todayDueStatus.eveningDone ? 'Logged' : 'Pending'}</span>
                  </div>

                  {todayDueStatus.isCheckDue && (
                    <button
                      onClick={() => setActiveTab('log_temp')}
                      className="px-3 py-1.5 text-xs font-semibold bg-brand text-white hover:bg-brand/90 transition-colors flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Log Now</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Refrigerator Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {fridges.map((fridge) => {
                  const latestLog = records.find((r) => r.fridgeId === fridge.id);
                  const isSafe = latestLog?.isCompliant ?? true;

                  return (
                    <div key={fridge.id} className="border border-line bg-canvas p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-ink">{fridge.name}</span>
                            <span className="text-[10px] px-1.5 py-0.5 bg-canvas-subtle border border-line tabular-nums text-ink-muted">
                              {fridge.id}
                            </span>
                          </div>
                          <p className="text-xs text-ink-muted mt-0.5">{fridge.location} &bull; S/N: {fridge.serialNumber}</p>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 border ${
                          isSafe
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700'
                            : 'bg-rose-500/10 border-rose-500/30 text-rose-700 animate-pulse'
                        }`}>
                          {isSafe ? 'Normal (+2°C to +8°C)' : 'EXCURSION ALERT'}
                        </span>
                      </div>

                      {/* Live gauge simulation */}
                      <div className="p-3 bg-canvas-subtle border border-line flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-ink-muted block uppercase tabular-nums">Last Logged Temp</span>
                          <span className="text-2xl font-bold tabular-nums tracking-tight text-ink">
                            {latestLog ? `${latestLog.currentTempC.toFixed(1)}°C` : '4.0°C'}
                          </span>
                        </div>

                        <div className="text-right text-xs">
                          <span className="text-ink-muted block text-[10px]">Min / Max Recorded</span>
                          <span className="tabular-nums font-medium text-ink">
                            {latestLog ? `${latestLog.minTempC.toFixed(1)}°C / ${latestLog.maxTempC.toFixed(1)}°C` : '3.2°C / 5.0°C'}
                          </span>
                        </div>
                      </div>

                      {/* Technical Specs */}
                      <div className="grid grid-cols-2 gap-2 text-[11px] text-ink-muted pt-1 border-t border-line">
                        <div>
                          <span>Cal. Cert: </span>
                          <span className="tabular-nums text-ink font-medium">{fridge.calibrationCertificateNo}</span>
                        </div>
                        <div>
                          <span>Next Cal: </span>
                          <span className="tabular-nums text-ink font-medium">{fridge.nextCalibrationDue}</span>
                        </div>
                        <div>
                          <span>Emergency Power: </span>
                          <span className="text-emerald-700 font-medium">Backup UPS Connected</span>
                        </div>
                        <div>
                          <span>Logged By: </span>
                          <span className="text-ink font-medium">{latestLog ? latestLog.operatorStaffName : 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Excursions Summary Card */}
                <div className="border border-line bg-canvas p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-amber-600" />
                      <span className="text-xs font-bold text-ink">Excursion Incident History</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 bg-canvas-subtle border border-line tabular-nums text-ink-muted">
                      Total: {excursions.length}
                    </span>
                  </div>

                  <p className="text-xs text-ink-muted">
                    Cold chain breaches must have a documented Root Cause Analysis (RCA) and vaccine disposition record for MOH inspection.
                  </p>

                  <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                    {excursions.map((exc) => (
                      <div key={exc.id} className="p-2 border border-line bg-canvas-subtle text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-rose-700">{exc.excursionType}</span>
                          <span className="text-[10px] tabular-nums text-ink-muted">{new Date(exc.occurredAt).toLocaleDateString()}</span>
                        </div>
                        <div className="text-[11px] text-ink-muted flex items-center justify-between">
                          <span>Cause: {exc.cause}</span>
                          <span className="tabular-nums">{exc.lowestTempRecordedC}°C - {exc.highestTempRecordedC}°C</span>
                        </div>
                        <div className="text-[10px] text-ink flex items-center gap-1 font-medium">
                          <span>Action:</span>
                          <span className="text-brand">{exc.actionTaken}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LOG TWICE-DAILY TEMPERATURE */}
          {activeTab === 'log_temp' && (
            <form onSubmit={handleLogTemperature} className="space-y-6">
              <div className="border border-line p-4 bg-canvas-subtle space-y-2">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-brand" />
                  <span className="text-xs font-bold uppercase text-ink">MOH Standard Operating Procedure</span>
                </div>
                <p className="text-xs text-ink-muted leading-relaxed">
                  Read thermometer current, minimum, and maximum display. Log the values without opening the refrigerator door if external digital thermometer is equipped. Reset min/max memories after recording.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">
                    Select Refrigerator
                  </label>
                  <select
                    value={selectedFridgeId}
                    onChange={(e) => setSelectedFridgeId(e.target.value)}
                    className="w-full text-xs p-2 border border-line bg-canvas text-ink rounded-none focus:outline-none focus:border-brand"
                  >
                    {fridges.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name} ({f.location})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">
                    Shift
                  </label>
                  <select
                    value={logShift}
                    onChange={(e) => setLogShift(e.target.value as any)}
                    className="w-full text-xs p-2 border border-line bg-canvas text-ink rounded-none focus:outline-none focus:border-brand"
                  >
                    <option value="Morning (08:00)">Morning Opening Shift (08:00)</option>
                    <option value="Evening (17:00)">Evening Closing Shift (17:00)</option>
                  </select>
                </div>
              </div>

              {/* Temperature Inputs with Real-time evaluation */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">
                    Current Temp (°C)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={currentTemp}
                    onChange={(e) => setCurrentTemp(e.target.value)}
                    className="w-full text-xs p-2 border border-line bg-canvas text-ink tabular-nums font-medium rounded-none focus:outline-none focus:border-brand"
                    placeholder="e.g. 4.2"
                    required
                  />
                  <span className="text-[10px] text-ink-muted mt-1 block">Instantaneous reading</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">
                    Min Temp (°C)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={minTemp}
                    onChange={(e) => setMinTemp(e.target.value)}
                    className="w-full text-xs p-2 border border-line bg-canvas text-ink tabular-nums font-medium rounded-none focus:outline-none focus:border-brand"
                    placeholder="e.g. 3.5"
                    required
                  />
                  <span className="text-[10px] text-ink-muted mt-1 block">Lowest since last reset</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">
                    Max Temp (°C)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={maxTemp}
                    onChange={(e) => setMaxTemp(e.target.value)}
                    className="w-full text-xs p-2 border border-line bg-canvas text-ink tabular-nums font-medium rounded-none focus:outline-none focus:border-brand"
                    placeholder="e.g. 5.1"
                    required
                  />
                  <span className="text-[10px] text-ink-muted mt-1 block">Highest since last reset</span>
                </div>
              </div>

              {/* Live Excursion Alert Preview */}
              {evalResult && (
                <div
                  className={`p-3 border text-xs flex items-start gap-3 ${
                    evalResult.isCompliant
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800'
                      : evalResult.severity === 'freeze_hazard'
                      ? 'bg-blue-500/10 border-blue-500/30 text-blue-900'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-900'
                  }`}
                >
                  {evalResult.isCompliant ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  ) : evalResult.severity === 'freeze_hazard' ? (
                    <Snowflake className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  ) : (
                    <Flame className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="font-bold block ">
                      {evalResult.isCompliant ? 'Compliant (+2.0°C to +8.0°C)' : evalResult.excursionType}
                    </span>
                    <p className="mt-0.5 leading-relaxed">{evalResult.message}</p>
                  </div>
                </div>
              )}

              {/* Staff Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">
                    Operator Staff Name
                  </label>
                  <input
                    type="text"
                    value={operatorName}
                    onChange={(e) => setOperatorName(e.target.value)}
                    className="w-full text-xs p-2 border border-line bg-canvas text-ink rounded-none focus:outline-none focus:border-brand"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">
                    Staff ID
                  </label>
                  <input
                    type="text"
                    value={operatorId}
                    onChange={(e) => setOperatorId(e.target.value)}
                    className="w-full text-xs p-2 border border-line bg-canvas text-ink tabular-nums rounded-none focus:outline-none focus:border-brand"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Notes / Observations (Optional)
                </label>
                <input
                  type="text"
                  value={logNotes}
                  onChange={(e) => setLogNotes(e.target.value)}
                  placeholder="e.g. Door gasket verified intact, min/max thermometer reset."
                  className="w-full text-xs p-2 border border-line bg-canvas text-ink rounded-none focus:outline-none focus:border-brand"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-line">
                <button
                  type="button"
                  onClick={() => setActiveTab('status')}
                  className="px-4 py-2 text-xs font-semibold border border-line hover:bg-canvas-subtle text-ink"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!isFormValid}
                  className="px-5 py-2 text-xs font-semibold bg-brand text-white hover:bg-brand/90 disabled:opacity-50 transition-colors flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Submit Log Entry</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: WHO SHAKE TEST PROTOCOL (UJIAN GONCANG) */}
          {activeTab === 'shake_test' && (
            <div className="space-y-6">
              {/* Educational Protocol Card */}
              <div className="p-4 border border-line bg-canvas-subtle space-y-2">
                <div className="flex items-center gap-2">
                  <Snowflake className="w-4 h-4 text-brand" />
                  <span className="text-xs font-bold uppercase text-ink">
                    WHO / MOH Shake Test Protocol (*Ujian Goncang*)
                  </span>
                </div>
                <p className="text-xs text-ink-muted leading-relaxed">
                  Adsorbed vaccines (Hexaxim, Pentaxim, DTaP, Hepatitis B, PCV, HPV) contain aluminum adjuvant lattices that are irreversibly denatured and clustered upon freezing. The Shake Test compares a suspected frozen vial against an intentionally frozen control vial: if the suspect vial sediments quickly (&lt;15-30 mins) with a clear liquid above, it is damaged and must be condemned.
                </p>
              </div>

              {/* Log Shake Test Form */}
              <form onSubmit={handleLogShakeTest} className="border border-line p-4 bg-canvas space-y-4">
                <h3 className="text-xs font-bold text-ink border-b border-line pb-2">
                  Log New Shake Test Record
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-ink mb-1">Vaccine Name</label>
                    <input
                      type="text"
                      value={stVaccineName}
                      onChange={(e) => setStVaccineName(e.target.value)}
                      className="w-full text-xs p-2 border border-line bg-canvas text-ink rounded-none focus:outline-none focus:border-brand"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink mb-1">Batch Number</label>
                    <input
                      type="text"
                      value={stBatchNo}
                      onChange={(e) => setStBatchNo(e.target.value)}
                      className="w-full text-xs p-2 border border-line bg-canvas text-ink tabular-nums rounded-none focus:outline-none focus:border-brand"
                      placeholder="e.g. HX2026-B81"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-ink mb-1">Sedimentation Time (Minutes)</label>
                    <input
                      type="number"
                      value={stSedimentationMin}
                      onChange={(e) => setStSedimentationMin(e.target.value)}
                      className="w-full text-xs p-2 border border-line bg-canvas text-ink tabular-nums rounded-none focus:outline-none focus:border-brand"
                      required
                    />
                  </div>
                  <div className="md:col-span-2 flex flex-col justify-end">
                    <label className="flex items-center gap-2 cursor-pointer p-2 border border-line bg-canvas-subtle hover:bg-canvas">
                      <input
                        type="checkbox"
                        checked={stRapidSedimentation}
                        onChange={(e) => setStRapidSedimentation(e.target.checked)}
                        className="rounded-none text-brand focus:ring-0"
                      />
                      <span className="text-xs font-semibold text-ink">
                        Rapid sedimentation observed (Flakes settled with clear liquid layer in &lt;15-30m)
                      </span>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-ink mb-1">Tested By (Staff / MMC)</label>
                    <input
                      type="text"
                      value={stStaff}
                      onChange={(e) => setStStaff(e.target.value)}
                      className="w-full text-xs p-2 border border-line bg-canvas text-ink rounded-none focus:outline-none focus:border-brand"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink mb-1">Visual Observation Notes</label>
                    <input
                      type="text"
                      value={stNotes}
                      onChange={(e) => setStNotes(e.target.value)}
                      className="w-full text-xs p-2 border border-line bg-canvas text-ink rounded-none focus:outline-none focus:border-brand"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold bg-brand text-white hover:bg-brand/90 transition-colors flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Record Shake Test Result</span>
                  </button>
                </div>
              </form>

              {/* Past Shake Tests History */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-ink">
                  Documented Shake Test Evaluations
                </h3>
                <div className="border border-line overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-canvas-subtle border-b border-line text-ink-muted font-medium text-[11px]">
                        <th className="p-2.5">Date & Time</th>
                        <th className="p-2.5">Vaccine & Batch</th>
                        <th className="p-2.5">Time (min)</th>
                        <th className="p-2.5">Result</th>
                        <th className="p-2.5">Clinical Disposition</th>
                        <th className="p-2.5">Staff</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line tabular-nums text-[11px]">
                      {shakeTests.map((st) => (
                        <tr key={st.id} className="hover:bg-canvas-subtle/50">
                          <td className="p-2.5">{new Date(st.testedAt).toLocaleDateString()}</td>
                          <td className="p-2.5 font-sans font-medium text-ink">
                            {st.vaccineName} <span className="tabular-nums text-ink-muted text-[10px]">({st.batchNo})</span>
                          </td>
                          <td className="p-2.5">{st.sedimentationTimeMinutes}m</td>
                          <td className="p-2.5">
                            <span className={`px-2 py-0.5 border text-[10px] font-bold ${
                              st.result === 'Pass'
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700'
                                : 'bg-rose-500/10 border-rose-500/30 text-rose-700'
                            }`}>
                              {st.result}
                            </span>
                          </td>
                          <td className="p-2.5 font-sans font-semibold text-ink">{st.disposition}</td>
                          <td className="p-2.5 font-sans text-ink-muted">{st.testedByStaff}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PKD AUDIT LEDGER */}
          {activeTab === 'ledger' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-ink">
                    Twice-Daily Temperature Audit Ledger
                  </h3>
                  <p className="text-xs text-ink-muted">
                    Certified archive required by Pejabat Kesihatan Daerah (PKD) during biennial Form B license renewals.
                  </p>
                </div>
                <button
                  onClick={handleExportCsv}
                  className="px-3 py-1.5 text-xs font-semibold bg-brand text-white hover:bg-brand/90 transition-colors flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PKD CSV</span>
                </button>
              </div>

              <div className="border border-line overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-canvas-subtle border-b border-line text-ink-muted font-medium text-[11px]">
                      <th className="p-2.5">Log ID</th>
                      <th className="p-2.5">Date</th>
                      <th className="p-2.5">Shift</th>
                      <th className="p-2.5 text-right">Current</th>
                      <th className="p-2.5 text-right">Min</th>
                      <th className="p-2.5 text-right">Max</th>
                      <th className="p-2.5">Compliance</th>
                      <th className="p-2.5">Logged By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line tabular-nums text-[11px]">
                    {records.map((r) => (
                      <tr key={r.id} className="hover:bg-canvas-subtle/50">
                        <td className="p-2.5 text-ink-muted">{r.id}</td>
                        <td className="p-2.5 text-ink font-sans">{r.date}</td>
                        <td className="p-2.5 font-sans font-medium text-ink">{r.shift}</td>
                        <td className="p-2.5 text-right font-bold text-ink">{r.currentTempC.toFixed(1)}°C</td>
                        <td className="p-2.5 text-right text-ink-muted">{r.minTempC.toFixed(1)}°C</td>
                        <td className="p-2.5 text-right text-ink-muted">{r.maxTempC.toFixed(1)}°C</td>
                        <td className="p-2.5">
                          <span className={`px-2 py-0.5 border text-[10px] font-bold ${
                            r.isCompliant
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700'
                              : 'bg-rose-500/10 border-rose-500/30 text-rose-700'
                          }`}>
                            {r.isCompliant ? 'COMPLIANT' : r.excursionType || 'EXCURSION'}
                          </span>
                        </td>
                        <td className="p-2.5 font-sans text-ink-muted">{r.operatorStaffName}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-canvas-subtle border-t border-line flex items-center justify-between text-xs text-ink-muted">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-brand" />
            <span>Statutory Compliance: PHFSA 1998 &bull; MOH Cold Chain Manual &bull; WHO PQS</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold border border-line bg-canvas hover:bg-canvas-subtle text-ink transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
