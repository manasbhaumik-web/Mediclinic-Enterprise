import React, { useState, useEffect, useMemo } from 'react';
import {
  X, CheckCircle2, AlertTriangle, ShieldCheck, ShieldAlert,
  Radio, FileSpreadsheet, Plus, Download, Clock, UserCheck,
  Calendar, Layers, Activity, ChevronRight, Info
} from 'lucide-react';
import {
  RadiationApparatus,
  TLDBadgeReading,
  LeadApronItem,
  XRayExposureRecord,
  DEFAULT_RADIATION_APPARATUS,
  DEFAULT_TLD_READINGS,
  DEFAULT_LEAD_APRONS,
  SAMPLE_XRAY_EXPOSURES,
  evaluateTLDReading,
  calculateRejectRate,
  isLeadApronOverdue,
  evaluateLicenceRenewalStatus,
} from '../../domain/radiationSafety';

interface RadiationSafetyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const STORAGE_KEY_APPARATUS = 'mediclinic_radiation_apparatus_v1';
const STORAGE_KEY_TLD = 'mediclinic_tld_readings_v1';
const STORAGE_KEY_APRONS = 'mediclinic_lead_aprons_v1';
const STORAGE_KEY_EXPOSURES = 'mediclinic_xray_exposures_v1';

export default function RadiationSafetyModal({
  isOpen,
  onClose,
}: RadiationSafetyModalProps) {
  const [activeTab, setActiveTab] = useState<'apparatus' | 'tld' | 'aprons' | 'reject_analysis'>('apparatus');

  // Persistence
  const [apparatusList, setApparatusList] = useState<RadiationApparatus[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_APPARATUS);
    return saved ? JSON.parse(saved) : DEFAULT_RADIATION_APPARATUS;
  });

  const [tldReadings, setTldReadings] = useState<TLDBadgeReading[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_TLD);
    return saved ? JSON.parse(saved) : DEFAULT_TLD_READINGS;
  });

  const [aprons, setAprons] = useState<LeadApronItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_APRONS);
    return saved ? JSON.parse(saved) : DEFAULT_LEAD_APRONS;
  });

  const [exposures, setExposures] = useState<XRayExposureRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_EXPOSURES);
    return saved ? JSON.parse(saved) : SAMPLE_XRAY_EXPOSURES;
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New TLD Reading Form State
  const [newTldStaffName, setNewTldStaffName] = useState('');
  const [newTldBadgeNo, setNewTldBadgeNo] = useState('');
  const [newTldQuarter, setNewTldQuarter] = useState<'1' | '2' | '3' | '4'>('3');
  const [newTldDose, setNewTldDose] = useState('');

  // New Apron Inspection Form State
  const [selectedApronId, setSelectedApronId] = useState(aprons[0]?.id || '');
  const [inspectionResult, setInspectionResult] = useState<'Pass / Intact' | 'Minor Surface Wear' | 'Condemned / Cracked'>('Pass / Intact');
  const [inspectorName, setInspectorName] = useState('Radiographer Farhan bin Zaid');
  const [inspectionNotes, setInspectionNotes] = useState('');

  // New Exposure Form State
  const [newPtName, setNewPtName] = useState('');
  const [newExam, setNewExam] = useState('Chest PA (Erect)');
  const [newKvp, setNewKvp] = useState('110');
  const [newMas, setNewMas] = useState('4.5');
  const [isRetake, setIsRetake] = useState(false);
  const [rejectReason, setRejectReason] = useState<'Patient Motion' | 'Positioning Error' | 'Exposure Factor Error' | 'Artifact'>('Patient Motion');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_APPARATUS, JSON.stringify(apparatusList));
  }, [apparatusList]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_TLD, JSON.stringify(tldReadings));
  }, [tldReadings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_APRONS, JSON.stringify(aprons));
  }, [aprons]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_EXPOSURES, JSON.stringify(exposures));
  }, [exposures]);

  const rejectStats = useMemo(() => calculateRejectRate(exposures), [exposures]);

  const handleLogInspection = (e: React.FormEvent) => {
    e.preventDefault();
    const today = new Date().toISOString().split('T')[0];
    const nextDue = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    setAprons((prev) =>
      prev.map((a) =>
        a.id === selectedApronId
          ? {
              ...a,
              status: inspectionResult,
              lastInspectedDate: today,
              nextInspectionDue: nextDue,
              inspectedByStaff: inspectorName.trim(),
              notes: inspectionNotes.trim() || a.notes,
            }
          : a
      )
    );

    setToastMessage(`✓ 6-Monthly Lead PPE Inspection logged for ${selectedApronId}: ${inspectionResult}. Next due: ${nextDue}.`);
    setTimeout(() => setToastMessage(null), 4000);
    setInspectionNotes('');
  };

  const handleLogExposure = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPtName.trim()) return;

    const newRecord: XRayExposureRecord = {
      id: `XR-EXP-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toISOString(),
      patientId: `PT-${Math.floor(1000 + Math.random() * 9000)}`,
      patientName: newPtName.trim(),
      examination: newExam,
      kVp: parseFloat(newKvp) || 100,
      mAs: parseFloat(newMas) || 2.0,
      isRejectRetake: isRetake,
      rejectReason: isRetake ? rejectReason : undefined,
      operatorStaffName: inspectorName,
    };

    setExposures((prev) => [newRecord, ...prev]);
    setToastMessage(`✓ Radiographic examination recorded: ${newExam} (${newRecord.kVp} kVp, ${newRecord.mAs} mAs).`);
    setTimeout(() => setToastMessage(null), 4000);

    setNewPtName('');
    setIsRetake(false);
  };

  const handleExportCsv = () => {
    const headers = 'Exposure ID,Date Time,Patient Name,Examination,kVp,mAs,Is Retake,Reject Reason,Operator';
    const rows = exposures.map((e) =>
      [
        e.id,
        e.timestamp,
        `"${e.patientName}"`,
        `"${e.examination}"`,
        e.kVp,
        e.mAs,
        e.isRejectRetake ? 'YES' : 'NO',
        `"${e.rejectReason || ''}"`,
        `"${e.operatorStaffName}"`,
      ].join(',')
    );

    const blob = new Blob([[headers, ...rows].join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MOH_Radiation_Safety_Register_Act304_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    setToastMessage('✓ Exported official radiation exposure & quality register.');
    setTimeout(() => setToastMessage(null), 3000);
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="radiation-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
    >
      <div className="bg-surface text-ink w-full max-w-5xl max-h-[92vh] flex flex-col rounded-none border border-line animate-fadeIn">
        {/* Header */}
        <div className="p-5 border-b border-line bg-surface flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-none">
              <Radio className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="radiation-modal-title" className="type-modal-title text-ink font-bold">
                  Radiation Safety &amp; Diagnostic X-Ray Register
                </h2>
                <span className="px-2 py-0.5 text-2xs font-bold bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950 dark:text-amber-200">
                  Akta Tenaga Atom 1984 (Act 304)
                </span>
                <span className="px-2 py-0.5 text-2xs font-bold bg-slate-100 text-slate-800 border border-slate-300 dark:bg-slate-800 dark:text-slate-300">
                  PHFSA 1998 Reg 45-54
                </span>
              </div>
              <p className="text-xs text-muted mt-0.5">
                Class C Radiation apparatus licences, quarterly TLD badge monitoring, 6-monthly lead PPE integrity, and reject exposure analysis.
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
            onClick={() => setActiveTab('apparatus')}
            className={`px-4 py-2 text-xs font-bold border-b-2 rounded-none transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'apparatus'
                ? 'border-accent text-accent bg-surface border-t border-x border-line -mb-px'
                : 'border-transparent text-muted hover:text-ink'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>1. Apparatus &amp; Class C Licences</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tld')}
            className={`px-4 py-2 text-xs font-bold border-b-2 rounded-none transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'tld'
                ? 'border-accent text-accent bg-surface border-t border-x border-line -mb-px'
                : 'border-transparent text-muted hover:text-ink'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>2. TLD Badge Dosimetry</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('aprons')}
            className={`px-4 py-2 text-xs font-bold border-b-2 rounded-none transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'aprons'
                ? 'border-accent text-accent bg-surface border-t border-x border-line -mb-px'
                : 'border-transparent text-muted hover:text-ink'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>3. Lead PPE &amp; Aprons (6-Monthly)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('reject_analysis')}
            className={`px-4 py-2 text-xs font-bold border-b-2 rounded-none transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'reject_analysis'
                ? 'border-accent text-accent bg-surface border-t border-x border-line -mb-px'
                : 'border-transparent text-muted hover:text-ink'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>4. Exposure Log &amp; Reject Rate</span>
          </button>
        </div>

        {/* Toast Alert */}
        {toastMessage && (
          <div className="bg-emerald-50 dark:bg-emerald-950/40 border-b border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 px-5 py-2.5 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: APPARATUS & LICENCES */}
          {activeTab === 'apparatus' && (
            <div className="space-y-6">
              <div className="bg-slate-50 dark:bg-slate-900/40 p-4 border border-line flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xs font-bold text-ink">
                    MOH Radiation Health &amp; Safety Section (CKSP) Licencing
                  </h3>
                  <p className="text-xs text-muted mt-1 leading-relaxed max-w-3xl">
                    Operation of any irradiating apparatus in private clinics requires a valid Class C Licence under the Atomic Energy Licensing Act 1984.
                    Every clinic must retain a designated Radiation Protection Officer (RPO / PPS) and certified Medical Physicist QA reports.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="bg-surface hover:bg-surface-accent text-ink text-xs font-bold px-3 py-1.5 rounded-none border border-line flex items-center gap-1.5 cursor-pointer shadow-2xs shrink-0"
                >
                  <Download className="w-3.5 h-3.5 text-accent" />
                  <span>Export Register CSV</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {apparatusList.map((app) => {
                  const licenceEval = evaluateLicenceRenewalStatus(app.licenceExpiryDate);
                  return (
                    <div key={app.id} className="border border-line bg-surface p-5 space-y-4 shadow-2xs flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-2xs tabular-nums font-bold text-muted uppercase">{app.id}</span>
                            <h4 className="text-sm font-bold text-ink mt-0.5">{app.name}</h4>
                            <p className="text-2xs text-muted">{app.roomLocation}</p>
                          </div>
                          <span
                            className={`px-2 py-0.5 text-2xs font-bold border ${
                              licenceEval.status === 'active'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200'
                                : licenceEval.status === 'expiring_soon'
                                ? 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-200'
                                : 'bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-200'
                            }`}
                          >
                            {licenceEval.status === 'active'
                              ? 'Licence Active'
                              : licenceEval.status === 'expiring_soon'
                              ? 'Renewal Due'
                              : 'Licence Expired'}
                          </span>
                        </div>

                        <div className="p-3 bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-muted">MOH Class C Licence:</span>
                            <span className="tabular-nums font-bold text-ink">{app.licenceClassCNumber}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted">Licence Expiry:</span>
                            <span className="font-semibold text-ink">{app.licenceExpiryDate} ({licenceEval.daysRemaining} days left)</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted">Designated RPO (PPS):</span>
                            <span className="font-semibold text-ink">{app.rpoName} ({app.rpoCertificateNo})</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted">Consultant Physicist:</span>
                            <span>{app.medicalPhysicistName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted">Annual QA Due:</span>
                            <span className="tabular-nums text-ink">{app.nextQaDueDate}</span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-line text-2xs text-muted">
                        Serial: <span className="tabular-nums">{app.serialNumber}</span> · Type: {app.type}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: TLD BADGE DOSIMETRY */}
          {activeTab === 'tld' && (
            <div className="space-y-4">
              <div className="bg-slate-50 dark:bg-slate-900/40 p-4 border border-line">
                <h3 className="text-xs font-bold text-ink">
                  Staff Personal Radiation Dosimetry (Agensi Nuklear Malaysia)
                </h3>
                <p className="text-xs text-muted mt-1 leading-relaxed">
                  Occupational radiation workers must wear an approved Thermoluminescent Dosimeter (TLD) badge at chest level under lead apron.
                  Statutory annual dose limit is 20 mSv/year. Any single quarter reading exceeding 1.0 mSv triggers an investigation.
                </p>
              </div>

              <div className="border border-line overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-line text-2xs text-muted font-bold">
                    <tr>
                      <th className="p-3">Monitoring Period</th>
                      <th className="p-3">Staff Name &amp; Role</th>
                      <th className="p-3">Badge Number</th>
                      <th className="p-3">Quarterly Dose (Hp10)</th>
                      <th className="p-3">Cumulative Annual</th>
                      <th className="p-3">Statutory Evaluation</th>
                      <th className="p-3">Lab Report Ref</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {tldReadings.map((tld) => {
                      const evalRes = evaluateTLDReading(tld.deepDoseHp10Msv, tld.cumulativeAnnualMsv);
                      return (
                        <tr key={tld.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20">
                          <td className="p-3 font-medium whitespace-nowrap">{tld.monitoringPeriod}</td>
                          <td className="p-3">
                            <span className="font-bold text-ink">{tld.staffName}</span>
                            <span className="block text-2xs text-muted">{tld.role}</span>
                          </td>
                          <td className="p-3 tabular-nums text-2xs">{tld.badgeNumber}</td>
                          <td className="p-3 tabular-nums font-bold text-ink">
                            {tld.deepDoseHp10Msv.toFixed(2)} mSv
                          </td>
                          <td className="p-3 tabular-nums">
                            {tld.cumulativeAnnualMsv.toFixed(2)} / 20.0 mSv
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 text-2xs font-bold border ${
                                evalRes.status === 'normal'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200'
                                  : 'bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-200'
                              }`}
                            >
                              {evalRes.status === 'normal' ? 'Normal (<1.0 mSv)' : 'Alert / Investigate'}
                            </span>
                          </td>
                          <td className="p-3 tabular-nums text-2xs text-muted">{tld.laboratoryReportRef}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: LEAD PPE & APRONS */}
          {activeTab === 'aprons' && (
            <div className="space-y-6">
              <div className="bg-slate-50 dark:bg-slate-900/40 p-4 border border-line">
                <h3 className="text-xs font-bold text-ink">
                  Lead Rubber Protective Apparel 6-Monthly Crack Inspection (PHFSA Reg 48)
                </h3>
                <p className="text-xs text-muted mt-1 leading-relaxed">
                  Lead aprons, thyroid shields, and gonad sets must be inspected every 6 months via fluoroscopic screening or tactile inspection.
                  Any shield showing lead rubber tears, cracks, or thinning must be immediately condemned and discarded.
                </p>
              </div>

              {/* Apron Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {aprons.map((apron) => {
                  const isOverdue = isLeadApronOverdue(apron.nextInspectionDue);
                  return (
                    <div key={apron.id} className="border border-line bg-surface p-4 flex flex-col justify-between shadow-2xs space-y-3">
                      <div>
                        <div className="flex items-start justify-between gap-1">
                          <span className="text-2xs tabular-nums font-bold text-muted uppercase">{apron.id}</span>
                          <span
                            className={`px-2 py-0.5 text-2xs font-bold border ${
                              apron.status === 'Pass / Intact' && !isOverdue
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200'
                                : isOverdue
                                ? 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-200'
                                : 'bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-200'
                            }`}
                          >
                            {isOverdue ? 'Inspection Overdue' : apron.status}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-ink mt-1.5">{apron.label}</h4>
                        <p className="text-2xs text-muted">{apron.location}</p>

                        <div className="mt-3 p-2 bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 text-2xs space-y-1">
                          <div className="flex justify-between">
                            <span className="text-muted">Lead Equiv:</span>
                            <span className="tabular-nums font-bold">{apron.leadEquivalenceMm} mm Pb</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted">Last Checked:</span>
                            <span>{apron.lastInspectedDate}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted">Next Due:</span>
                            <span className={isOverdue ? 'text-rose-700 font-bold' : ''}>{apron.nextInspectionDue}</span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedApronId(apron.id)}
                        className="text-xs font-bold text-accent hover:underline flex items-center justify-between pt-2 border-t border-line cursor-pointer"
                      >
                        <span>Re-inspect Apron</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Log Inspection Form */}
              <form onSubmit={handleLogInspection} className="border border-line bg-surface p-5 space-y-4 shadow-2xs">
                <h4 className="text-xs font-bold text-ink ">
                  Record 6-Monthly Shield Quality Inspection
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-ink">Selected PPE Item *</label>
                    <select
                      value={selectedApronId}
                      onChange={(e) => setSelectedApronId(e.target.value)}
                      className="w-full bg-surface border border-line text-ink text-xs p-2 rounded-none font-bold"
                    >
                      {aprons.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.label} ({a.id})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-ink">Inspection Result *</label>
                    <select
                      value={inspectionResult}
                      onChange={(e) => setInspectionResult(e.target.value as any)}
                      className="w-full bg-surface border border-line text-ink text-xs p-2 rounded-none font-bold"
                    >
                      <option value="Pass / Intact">Pass / Intact (No lead cracks)</option>
                      <option value="Minor Surface Wear">Minor Surface Wear (Acceptable for non-direct field)</option>
                      <option value="Condemned / Cracked">Condemned / Cracked (Immediate disposal required)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-ink">Inspector Staff Name *</label>
                    <input
                      type="text"
                      value={inspectorName}
                      onChange={(e) => setInspectorName(e.target.value)}
                      className="w-full bg-surface border border-line text-ink text-xs p-2 rounded-none"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-ink">Fluoroscopic / Tactile Screening Observations</label>
                  <input
                    type="text"
                    value={inspectionNotes}
                    onChange={(e) => setInspectionNotes(e.target.value)}
                    placeholder="e.g. Screened under fluoroscopy 70 kVp. Lead rubber homogenous without breaks."
                    className="w-full bg-surface border border-line text-ink text-xs p-2 rounded-none"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="bg-primary hover:bg-primary-hover text-white text-xs font-bold px-4 py-2 rounded-none border border-primary flex items-center gap-2 cursor-pointer shadow-2xs"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Certify Inspection (Valid 6 Months)</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 4: EXPOSURE LOG & REJECT ANALYSIS */}
          {activeTab === 'reject_analysis' && (
            <div className="space-y-6">
              {/* Reject Rate KPI Banner */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border border-line bg-surface shadow-2xs">
                  <span className="text-2xs font-bold text-muted uppercase">Total Radiographic Exposures</span>
                  <p className="text-xl font-bold text-ink mt-1">{rejectStats.totalExposures}</p>
                  <span className="text-2xs text-muted">All diagnostic procedures logged</span>
                </div>

                <div className="p-4 border border-line bg-surface shadow-2xs">
                  <span className="text-2xs font-bold text-muted uppercase">Retakes / Repeated Films</span>
                  <p className="text-xl font-bold text-rose-700 dark:text-rose-300 mt-1">{rejectStats.retakes}</p>
                  <span className="text-2xs text-muted">Films discarded due to error</span>
                </div>

                <div className="p-4 border border-line bg-surface shadow-2xs">
                  <span className="text-2xs font-bold text-muted uppercase">Reject Rate Benchmark (&lt;5%)</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <p className="text-xl font-bold text-ink">{rejectStats.rejectRatePercent}%</p>
                    <span
                      className={`text-2xs font-bold px-2 py-0.5 border ${
                        rejectStats.isWithinBenchmark
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200'
                          : 'bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-200'
                      }`}
                    >
                      {rejectStats.isWithinBenchmark ? 'Compliant (<5.0%)' : 'Exceeds Benchmark'}
                    </span>
                  </div>
                  <span className="text-2xs text-muted">{rejectStats.message}</span>
                </div>
              </div>

              {/* Log Exposure Form */}
              <form onSubmit={handleLogExposure} className="border border-line bg-surface p-5 space-y-4 shadow-2xs">
                <h4 className="text-xs font-bold text-ink ">
                  Log Radiographic Exposure &amp; Technical Factors
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-ink">Patient Full Name *</label>
                    <input
                      type="text"
                      value={newPtName}
                      onChange={(e) => setNewPtName(e.target.value)}
                      placeholder="e.g. En. Ahmad bin Latif"
                      className="w-full bg-surface border border-line text-ink text-xs p-2 rounded-none"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-ink">Examination *</label>
                    <input
                      type="text"
                      value={newExam}
                      onChange={(e) => setNewExam(e.target.value)}
                      className="w-full bg-surface border border-line text-ink text-xs p-2 rounded-none font-bold"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-ink">Tube Voltage (kVp) *</label>
                    <input
                      type="number"
                      value={newKvp}
                      onChange={(e) => setNewKvp(e.target.value)}
                      className="w-full bg-surface border border-line text-ink text-xs p-2 rounded-none tabular-nums"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-ink">Exposure Product (mAs) *</label>
                    <input
                      type="number"
                      step="0.1"
                      value={newMas}
                      onChange={(e) => setNewMas(e.target.value)}
                      className="w-full bg-surface border border-line text-ink text-xs p-2 rounded-none tabular-nums"
                      required
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-rose-700 dark:text-rose-300">
                    <input
                      type="checkbox"
                      checked={isRetake}
                      onChange={(e) => setIsRetake(e.target.checked)}
                      className="rounded-none border-line"
                    />
                    <span>This film was rejected / repeated (Retake)</span>
                  </label>

                  {isRetake && (
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-muted font-bold">Reject Reason:</span>
                      <select
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value as any)}
                        className="bg-surface border border-line text-ink text-xs p-1.5 rounded-none font-bold"
                      >
                        <option value="Patient Motion">Patient Motion</option>
                        <option value="Positioning Error">Positioning Error</option>
                        <option value="Exposure Factor Error">Exposure Factor Error</option>
                        <option value="Artifact">Artifact</option>
                      </select>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="ml-auto bg-primary hover:bg-primary-hover text-white text-xs font-bold px-4 py-2 rounded-none border border-primary flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Record Exposure</span>
                  </button>
                </div>
              </form>

              {/* Exposure Records Table */}
              <div className="border border-line overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-line text-2xs text-muted font-bold">
                    <tr>
                      <th className="p-3">Time</th>
                      <th className="p-3">Patient</th>
                      <th className="p-3">Examination</th>
                      <th className="p-3">Factors</th>
                      <th className="p-3">Retake / Reject Status</th>
                      <th className="p-3">Operator</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {exposures.map((exp) => (
                      <tr key={exp.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20">
                        <td className="p-3 tabular-nums text-2xs">
                          {new Date(exp.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="p-3 font-bold text-ink">{exp.patientName}</td>
                        <td className="p-3 font-medium">{exp.examination}</td>
                        <td className="p-3 tabular-nums text-2xs">
                          {exp.kVp} kVp · {exp.mAs} mAs
                        </td>
                        <td className="p-3">
                          {exp.isRejectRetake ? (
                            <span className="px-2 py-0.5 text-2xs font-bold bg-rose-100 text-rose-900 border border-rose-300 dark:bg-rose-950 dark:text-rose-200">
                              REJECT: {exp.rejectReason}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 text-2xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200">
                              Accepted
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-2xs text-muted">{exp.operatorStaffName}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-line bg-slate-50 dark:bg-slate-900/40 flex items-center justify-between text-2xs text-muted shrink-0">
          <span className="flex items-center gap-1.5 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-accent" />
            <span>MOH Radiation Protection (Basic Safety Standard) Reg 2010</span>
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
