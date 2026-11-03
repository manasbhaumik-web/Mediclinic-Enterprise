import React, { useState, useEffect, useMemo } from 'react';
import {
  X, CheckCircle2, AlertTriangle, ShieldCheck, Microscope,
  RefreshCw, Clock, Plus, FileText, Download, ShieldAlert,
  ChevronRight, Calendar, Info
} from 'lucide-react';
import {
  POCTDevice,
  POCTCalibrationRecord,
  DEFAULT_POCT_DEVICES,
  INITIAL_POCT_QC_RECORDS,
  evaluateDeviceQcStatus,
  createPOCTCalibrationRecord,
  calculateEffectiveExpiry,
  evaluateQCReading,
} from '../../domain/poctCalibration';

interface POCTQualityControlModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCalibrationLogged?: (record: POCTCalibrationRecord) => void;
  initialDeviceId?: string;
}

const STORAGE_KEY_RECORDS = 'mediclinic_poct_records_v1';
const STORAGE_KEY_DEVICES = 'mediclinic_poct_devices_v1';

export default function POCTQualityControlModal({
  isOpen,
  onClose,
  onCalibrationLogged,
  initialDeviceId,
}: POCTQualityControlModalProps) {
  const [activeTab, setActiveTab] = useState<'status' | 'log_qc' | 'audit_history'>('status');

  // State
  const [devices, setDevices] = useState<POCTDevice[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_DEVICES);
    return saved ? JSON.parse(saved) : DEFAULT_POCT_DEVICES;
  });

  const [records, setRecords] = useState<POCTCalibrationRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_RECORDS);
    return saved ? JSON.parse(saved) : INITIAL_POCT_QC_RECORDS;
  });

  // Logging form state
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>(initialDeviceId || DEFAULT_POCT_DEVICES[0].id);
  const [controlLot, setControlLot] = useState('CTL-2026-NOV-01');
  const [operatorName, setOperatorName] = useState('Staff Nurse / CA');
  const [operatorId, setOperatorId] = useState('STF-001');
  const [level1Reading, setLevel1Reading] = useState<string>('');
  const [level2Reading, setLevel2Reading] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (initialDeviceId) {
      setSelectedDeviceId(initialDeviceId);
      setActiveTab('log_qc');
    }
  }, [initialDeviceId]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(records));
  }, [records]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_DEVICES, JSON.stringify(devices));
  }, [devices]);

  const selectedDevice = useMemo(
    () => devices.find((d) => d.id === selectedDeviceId) || devices[0],
    [devices, selectedDeviceId]
  );

  // Live evaluation of entered values
  const numL1 = parseFloat(level1Reading);
  const numL2 = parseFloat(level2Reading);

  const l1Eval = useMemo(() => {
    if (isNaN(numL1)) return null;
    return evaluateQCReading(numL1, selectedDevice.level1Target.min, selectedDevice.level1Target.max);
  }, [numL1, selectedDevice]);

  const l2Eval = useMemo(() => {
    if (isNaN(numL2)) return null;
    return evaluateQCReading(numL2, selectedDevice.level2Target.min, selectedDevice.level2Target.max);
  }, [numL2, selectedDevice]);

  const formValid = !isNaN(numL1) && !isNaN(numL2) && controlLot.trim().length > 0 && operatorName.trim().length > 0;

  const handleSubmitQC = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formValid) return;

    const newRecord = createPOCTCalibrationRecord({
      device: selectedDevice,
      operatorStaffId: operatorId.trim(),
      operatorStaffName: operatorName.trim(),
      controlLot: controlLot.trim(),
      level1Reading: numL1,
      level2Reading: numL2,
      notes: notes.trim(),
    });

    setRecords((prev) => [newRecord, ...prev]);
    if (onCalibrationLogged) {
      onCalibrationLogged(newRecord);
    }

    setToastMessage(
      newRecord.overallStatus === 'pass'
        ? `✓ ${selectedDevice.name} 2-Level QC passed and certified (PHFSA 1998 § 38).`
        : `⚠ Warning: ${selectedDevice.name} failed tolerance limits. Flagged out of service.`
    );
    setTimeout(() => setToastMessage(null), 4000);

    // Reset inputs
    setLevel1Reading('');
    setLevel2Reading('');
    setNotes('');
    setActiveTab('status');
  };

  const handleExportAuditLog = () => {
    const csvRows = [
      'Record ID,Device ID,Device Name,Type,Date Time,Operator,L1 Target,L1 Measured,L1 Status,L2 Target,L2 Measured,L2 Status,Overall Status,Notes',
      ...records.map((r) =>
        [
          r.id,
          r.deviceId,
          `"${r.deviceName}"`,
          r.deviceType,
          r.testedAt,
          `"${r.operatorStaffName} (${r.operatorStaffId})"`,
          `"${r.level1.targetMin}-${r.level1.targetMax} ${r.level1.unit}"`,
          r.level1.measuredValue,
          r.level1.status,
          `"${r.level2.targetMin}-${r.level2.targetMax} ${r.level2.unit}"`,
          r.level2.measuredValue,
          r.level2.status,
          r.overallStatus.toUpperCase(),
          `"${r.notes || ''}"`,
        ].join(',')
      ),
    ];

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `POCT_QC_Audit_Register_PHFSA_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="poct-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
    >
      <div className="bg-surface text-ink w-full max-w-5xl max-h-[92vh] flex flex-col rounded-none border border-line animate-fadeIn">
        {/* Header */}
        <div className="p-5 border-b border-line bg-surface flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-50 dark:bg-teal-950/40 text-accent border border-teal-200 dark:border-teal-800 rounded-none">
              <Microscope className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="poct-modal-title" className="type-modal-title text-ink font-bold">
                  Point-of-Care Testing (POCT) &amp; Calibration Log
                </h2>
                <span className="px-2 py-0.5 text-2xs font-bold bg-teal-100 text-teal-800 border border-teal-300 dark:bg-teal-950 dark:text-teal-300 dark:border-teal-700">
                  PHFSA 1998 § 38
                </span>
                <span className="px-2 py-0.5 text-2xs font-bold bg-slate-100 text-slate-800 border border-slate-300 dark:bg-slate-800 dark:text-slate-300">
                  CKAPS Standard
                </span>
              </div>
              <p className="text-xs text-muted mt-0.5">
                Statutory daily 2-level quality control (Normal &amp; High), reagent open-vial stability, and clinical interlock guards.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-muted hover:text-ink hover:bg-surface-accent rounded-none border border-transparent hover:border-line transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-line bg-slate-50 dark:bg-slate-900/40 px-5 pt-2 gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('status')}
            className={`px-4 py-2 text-xs font-bold border-b-2 rounded-none transition-colors cursor-pointer ${
              activeTab === 'status'
                ? 'border-accent text-accent bg-surface border-t border-x border-line -mb-px'
                : 'border-transparent text-muted hover:text-ink'
            }`}
          >
            Instrument &amp; QC Status Overview
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('log_qc')}
            className={`px-4 py-2 text-xs font-bold border-b-2 rounded-none transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'log_qc'
                ? 'border-accent text-accent bg-surface border-t border-x border-line -mb-px'
                : 'border-transparent text-muted hover:text-ink'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Perform 2-Level QC Log</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('audit_history')}
            className={`px-4 py-2 text-xs font-bold border-b-2 rounded-none transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'audit_history'
                ? 'border-accent text-accent bg-surface border-t border-x border-line -mb-px'
                : 'border-transparent text-muted hover:text-ink'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Audit History &amp; Certificates ({records.length})</span>
          </button>
        </div>

        {/* Toast alert */}
        {toastMessage && (
          <div className="bg-emerald-50 dark:bg-emerald-950/40 border-b border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 px-5 py-2.5 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {activeTab === 'status' && (
            <div className="space-y-6">
              <div className="bg-slate-50 dark:bg-slate-900/40 p-4 border border-line flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xs font-bold text-ink">
                    PHFSA 1998 § 38 Outpatient Lab Standard
                  </h3>
                  <p className="text-xs text-muted mt-1 leading-relaxed max-w-2xl">
                    All point-of-care testing (POCT) instruments used on patients must pass a daily two-level quality control
                    (Level 1 Normal &amp; Level 2 High) prior to clinical reporting. Failure or missed QC locks the device in the Procedure Station.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('log_qc')}
                  className="bg-primary hover:bg-primary-hover text-white text-xs font-bold px-3.5 py-2 rounded-none border border-primary flex items-center gap-2 cursor-pointer shadow-2xs shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Log Daily QC Now</span>
                </button>
              </div>

              {/* Device Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {devices.map((device) => {
                  const evalResult = evaluateDeviceQcStatus(device, records);
                  const effectiveExpiry = calculateEffectiveExpiry(
                    device.reagentOpenedAt,
                    device.openVialShelfLifeDays,
                    device.reagentExpiryDate
                  );

                  return (
                    <div
                      key={device.id}
                      className="bg-surface border border-line p-4.5 flex flex-col justify-between shadow-2xs space-y-4"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-2xs tabular-nums font-bold text-muted uppercase">
                              {device.id}
                            </span>
                            <h4 className="text-sm font-bold text-ink mt-0.5">{device.name}</h4>
                            <p className="text-2xs text-muted">{device.location}</p>
                          </div>
                          <span
                            className={`px-2 py-0.5 text-2xs font-bold border ${
                              evalResult.isValid
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-700'
                                : evalResult.status === 'failed_qc'
                                ? 'bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-700'
                                : 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-700'
                            }`}
                          >
                            {evalResult.isValid
                              ? 'QC Valid Today'
                              : evalResult.status === 'failed_qc'
                              ? 'QC Failed'
                              : evalResult.status === 'expired_lot'
                              ? 'Reagent Expired'
                              : 'QC Due Today'}
                          </span>
                        </div>

                        {/* Reagent Box */}
                        <div className="mt-3 p-2.5 bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 space-y-1 text-2xs">
                          <div className="flex justify-between">
                            <span className="text-muted">Reagent Lot:</span>
                            <span className="tabular-nums font-bold text-ink">{device.reagentLotNumber}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted">Open-Vial Shelf Life:</span>
                            <span>{device.openVialShelfLifeDays} days</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted">Effective Expiry:</span>
                            <span className="font-semibold text-ink">{effectiveExpiry}</span>
                          </div>
                        </div>

                        {/* Last Run Info */}
                        <div className="mt-3 text-2xs text-muted">
                          {evalResult.lastRecord ? (
                            <p>
                              Last QC: <span className="font-semibold text-ink">{new Date(evalResult.lastRecord.testedAt).toLocaleDateString('en-GB')} {new Date(evalResult.lastRecord.testedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span> by {evalResult.lastRecord.operatorStaffName}
                            </p>
                          ) : (
                            <p className="text-amber-700 dark:text-amber-300 font-medium">No prior calibration record found.</p>
                          )}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-line flex items-center justify-between">
                        <span className="text-2xs text-muted">Schedule: {device.qcSchedule}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedDeviceId(device.id);
                            setActiveTab('log_qc');
                          }}
                          className="text-xs font-bold text-accent hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <span>Calibrate</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'log_qc' && (
            <form onSubmit={handleSubmitQC} className="space-y-6">
              <div className="bg-slate-50 dark:bg-slate-900/40 p-4 border border-line flex items-start gap-3">
                <Info className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                <div className="text-xs text-muted leading-relaxed">
                  <p className="font-bold text-ink">Two-Level Quality Control Protocol (MOH CKAPS Section 38)</p>
                  Run both Normal (Level 1) and High/Pathological (Level 2) control solutions. If the measured value deviates outside
                  allowable tolerance limits, do not dispense test results to the patient. Re-clean optical sensors, inspect strip lot expiry, and re-test.
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Device Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-ink">Select POCT Instrument *</label>
                  <select
                    value={selectedDeviceId}
                    onChange={(e) => setSelectedDeviceId(e.target.value)}
                    className="w-full bg-surface border border-line text-ink text-xs p-2.5 rounded-none focus:outline-hidden focus:border-primary"
                  >
                    {devices.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.id}) - {d.location}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Control Solution Lot */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-ink">Control Solution Lot Number *</label>
                  <input
                    type="text"
                    value={controlLot}
                    onChange={(e) => setControlLot(e.target.value)}
                    placeholder="e.g. CTL-GLUC-2026-N1"
                    className="w-full bg-surface border border-line text-ink text-xs p-2.5 rounded-none tabular-nums focus:outline-hidden focus:border-primary"
                    required
                  />
                </div>

                {/* Operator Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-ink">Operator Staff Name *</label>
                  <input
                    type="text"
                    value={operatorName}
                    onChange={(e) => setOperatorName(e.target.value)}
                    className="w-full bg-surface border border-line text-ink text-xs p-2.5 rounded-none focus:outline-hidden focus:border-primary"
                    required
                  />
                </div>

                {/* Operator ID */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-ink">Operator Staff ID *</label>
                  <input
                    type="text"
                    value={operatorId}
                    onChange={(e) => setOperatorId(e.target.value)}
                    className="w-full bg-surface border border-line text-ink text-xs p-2.5 rounded-none tabular-nums focus:outline-hidden focus:border-primary"
                    required
                  />
                </div>
              </div>

              {/* QC Level 1 & Level 2 Testing Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                {/* Level 1: Normal Control */}
                <div className="border border-line bg-surface p-4 space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-ink ">Level 1: Normal Control</h4>
                      <p className="text-2xs text-muted">
                        Acceptable Range: <span className="font-bold text-ink">{selectedDevice.level1Target.min} - {selectedDevice.level1Target.max} {selectedDevice.level1Target.unit}</span>
                      </p>
                    </div>
                    {l1Eval && (
                      <span
                        className={`px-2 py-0.5 text-2xs font-bold border ${
                          l1Eval.status === 'pass'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-700'
                            : 'bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-700'
                        }`}
                      >
                        {l1Eval.status.toUpperCase()}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-2xs font-bold text-muted">Measured Reading ({selectedDevice.level1Target.unit}) *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={level1Reading}
                      onChange={(e) => setLevel1Reading(e.target.value)}
                      placeholder={`e.g. ${((selectedDevice.level1Target.min + selectedDevice.level1Target.max) / 2).toFixed(1)}`}
                      className="w-full bg-surface border border-line text-ink text-sm tabular-nums p-2.5 rounded-none focus:outline-hidden focus:border-primary"
                      required
                    />
                  </div>

                  {l1Eval && (
                    <p className={`text-2xs font-medium ${l1Eval.status === 'pass' ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}`}>
                      {l1Eval.status === 'pass'
                        ? `✓ Within tolerance. Target midpoint variance: ${l1Eval.deviation > 0 ? '+' : ''}${l1Eval.deviation} ${selectedDevice.level1Target.unit}.`
                        : `✗ Out of bounds! Value deviates by ${l1Eval.deviation > 0 ? '+' : ''}${l1Eval.deviation} ${selectedDevice.level1Target.unit}.`}
                    </p>
                  )}
                </div>

                {/* Level 2: High Control */}
                <div className="border border-line bg-surface p-4 space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-ink ">Level 2: High / Pathological Control</h4>
                      <p className="text-2xs text-muted">
                        Acceptable Range: <span className="font-bold text-ink">{selectedDevice.level2Target.min} - {selectedDevice.level2Target.max} {selectedDevice.level2Target.unit}</span>
                      </p>
                    </div>
                    {l2Eval && (
                      <span
                        className={`px-2 py-0.5 text-2xs font-bold border ${
                          l2Eval.status === 'pass'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-700'
                            : 'bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-700'
                        }`}
                      >
                        {l2Eval.status.toUpperCase()}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-2xs font-bold text-muted">Measured Reading ({selectedDevice.level2Target.unit}) *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={level2Reading}
                      onChange={(e) => setLevel2Reading(e.target.value)}
                      placeholder={`e.g. ${((selectedDevice.level2Target.min + selectedDevice.level2Target.max) / 2).toFixed(1)}`}
                      className="w-full bg-surface border border-line text-ink text-sm tabular-nums p-2.5 rounded-none focus:outline-hidden focus:border-primary"
                      required
                    />
                  </div>

                  {l2Eval && (
                    <p className={`text-2xs font-medium ${l2Eval.status === 'pass' ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}`}>
                      {l2Eval.status === 'pass'
                        ? `✓ Within tolerance. Target midpoint variance: ${l2Eval.deviation > 0 ? '+' : ''}${l2Eval.deviation} ${selectedDevice.level2Target.unit}.`
                        : `✗ Out of bounds! Value deviates by ${l2Eval.deviation > 0 ? '+' : ''}${l2Eval.deviation} ${selectedDevice.level2Target.unit}.`}
                    </p>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-ink">Calibration Observations / Strip Tray Inspection Notes</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Optical sensor clean, fresh strip vial opened, control solution stored at 2-8°C"
                  className="w-full bg-surface border border-line text-ink text-xs p-2.5 rounded-none focus:outline-hidden focus:border-primary"
                />
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-line">
                <button
                  type="button"
                  onClick={() => setActiveTab('status')}
                  className="px-4 py-2 text-xs font-semibold text-muted hover:text-ink border border-line hover:bg-surface-accent rounded-none cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!formValid}
                  className="bg-primary hover:bg-primary-hover text-white text-xs font-bold px-5 py-2.5 rounded-none border border-primary flex items-center gap-2 cursor-pointer shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Submit &amp; Certify Calibration Log</span>
                </button>
              </div>
            </form>
          )}

          {activeTab === 'audit_history' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-xs font-bold text-ink ">
                    Statutory POCT Calibration Register (PHFSA 1998 § 38)
                  </h3>
                  <p className="text-2xs text-muted">
                    Maintained for Ministry of Health (MOH) and CKAPS annual surveillance audit inspection.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleExportAuditLog}
                  className="bg-surface hover:bg-surface-accent text-ink text-xs font-bold px-3 py-1.5 rounded-none border border-line flex items-center gap-1.5 cursor-pointer shadow-2xs self-start"
                >
                  <Download className="w-3.5 h-3.5 text-accent" />
                  <span>Export CSV Log</span>
                </button>
              </div>

              {records.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted border border-dashed border-line">
                  No calibration records logged yet.
                </div>
              ) : (
                <div className="border border-line overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-line text-2xs text-muted font-bold">
                      <tr>
                        <th className="p-3">Tested At</th>
                        <th className="p-3">Device / Instrument</th>
                        <th className="p-3">Level 1 (Normal)</th>
                        <th className="p-3">Level 2 (High)</th>
                        <th className="p-3">Operator</th>
                        <th className="p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {records.map((r) => (
                        <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20">
                          <td className="p-3 whitespace-nowrap tabular-nums text-2xs">
                            {new Date(r.testedAt).toLocaleDateString('en-GB')} {new Date(r.testedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="p-3">
                            <span className="font-bold text-ink">{r.deviceName}</span>
                            <span className="block text-2xs text-muted tabular-nums">{r.deviceId}</span>
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            <span className="tabular-nums font-semibold">{r.level1.measuredValue} {r.level1.unit}</span>
                            <span className={`ml-2 text-2xs font-bold uppercase ${r.level1.status === 'pass' ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700'}`}>
                              ({r.level1.status})
                            </span>
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            <span className="tabular-nums font-semibold">{r.level2.measuredValue} {r.level2.unit}</span>
                            <span className={`ml-2 text-2xs font-bold uppercase ${r.level2.status === 'pass' ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700'}`}>
                              ({r.level2.status})
                            </span>
                          </td>
                          <td className="p-3 whitespace-nowrap text-2xs">
                            <span className="font-medium text-ink">{r.operatorStaffName}</span>
                            <span className="block text-muted">{r.operatorStaffId}</span>
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 text-2xs font-bold border ${
                                r.overallStatus === 'pass'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-700'
                                  : 'bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-700'
                              }`}
                            >
                              {r.overallStatus.toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-line bg-slate-50 dark:bg-slate-900/40 flex items-center justify-between text-2xs text-muted shrink-0">
          <span className="flex items-center gap-1.5 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-accent" />
            <span>MOH PHFSA 1998 (Act 586) Regulatory Calibration Lock</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-ink bg-surface border border-line hover:bg-surface-accent rounded-none cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
