import React, { useState } from 'react';
import { Visit, Patient, ClinicalProcedureItem } from '../../types';
import { Syringe, CheckCircle2, AlertTriangle, Clock, Activity, FileText, ArrowRight, ShieldAlert, Sparkles, Stethoscope, ShieldCheck, Trash2, Zap } from 'lucide-react';
import { maskICNumber } from '../../utils/piiMasker';
import { calculatePatientAge } from '../../domain/patientAge';
import { formatTicket } from '../../domain/ticket';
import { ProceduralConsentModal } from './ProceduralConsentModal';
import { SignedConsentRecord } from '../../domain/proceduralConsent';
import { ImmunizationModule } from './ImmunizationModule';
import { CrashCartInspectionModal } from './CrashCartInspectionModal';
import { ClinicalWasteModule } from './ClinicalWasteModule';
import { CrashCartInspectionRecord } from '../../domain/crashCart';

interface ProcedureStationModuleProps {
  visits: Visit[];
  patientsMap: Record<string, Patient>;
  onCompleteProcedure: (visitId: string, procedureId: string, details: { adminSite?: string; batchNo?: string; result?: string; clinicalNotes?: string }) => void;
  onClearHold?: (visitId: string, resultSummary: string) => void;
}

export default function ProcedureStationModule({
  visits,
  patientsMap,
  onCompleteProcedure,
  onClearHold
}: ProcedureStationModuleProps) {
  const [activeStationTab, setActiveStationTab] = useState<'procedures' | 'immunization' | 'clinical-waste'>('procedures');
  const [selectedVisitId, setSelectedVisitId] = useState<string | null>(null);
  const [selectedProcedureId, setSelectedProcedureId] = useState<string | null>(null);
  const [adminSite, setAdminSite] = useState('Left Deltoid (IM)');
  const [batchNo, setBatchNo] = useState('');
  const [resultText, setResultText] = useState('');
  const [nurseNotes, setNurseNotes] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Consent Modal State
  const [consentModalProc, setConsentModalProc] = useState<ClinicalProcedureItem | null>(null);
  const [signedConsents, setSignedConsents] = useState<Record<string, SignedConsentRecord>>({});

  // Crash Cart Inspection Modal State
  const [isCrashCartModalOpen, setIsCrashCartModalOpen] = useState(false);
  const [lastCrashCartLog, setLastCrashCartLog] = useState<CrashCartInspectionRecord | null>(null);

  // Filter visits that either have status 'Awaiting Procedure', 'Holding for Results', or have pending procedures
  const procedureQueue = visits.filter(v => {
    if (v.status === 'Awaiting Procedure' || v.status === 'Holding for Results') return true;
    const procs = v.soap?.plan?.procedures || [];
    return procs.some(p => p.status === 'Pending' || p.status === 'In Progress');
  });

  const activeVisit = selectedVisitId ? visits.find(v => v.id === selectedVisitId) : procedureQueue[0] || null;
  const activePatient = activeVisit ? patientsMap[activeVisit.patientId] : null;
  const pendingProcedures = activeVisit?.soap?.plan?.procedures?.filter(p => p.status === 'Pending' || p.status === 'In Progress') || [];

  const handleAdminister = (proc: ClinicalProcedureItem) => {
    if (!activeVisit) return;
    onCompleteProcedure(activeVisit.id, proc.id, {
      adminSite,
      batchNo: batchNo.trim() || `BAT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      result: resultText.trim(),
      clinicalNotes: nurseNotes.trim() || 'Administered according to doctor order. Patient tolerated well, observed for 15 mins post-procedure.'
    });

    if (activeVisit.status === 'Holding for Results' && onClearHold) {
      onClearHold(activeVisit.id, resultText.trim() || 'Test completed');
    }

    setToastMessage(`✓ ${proc.name} completed successfully. Procedure fee recorded to bill.`);
    setTimeout(() => setToastMessage(null), 4000);

    // Reset inputs
    setBatchNo('');
    setResultText('');
    setNurseNotes('');
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-[100] bg-emerald-900 text-white px-5 py-3 border border-emerald-400 rounded-none shadow-xl flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-300" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-surface border border-line p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary text-white flex items-center justify-center">
            <Syringe className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-ink">Treatment Room &amp; Clinical Procedures (Bilik Rawatan)</h2>
            <p className="text-xs text-muted">Administer IM/IV injections, nebulizer therapies, wound dressings, and rapid in-house diagnostics.</p>
          </div>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs">
          <button
            type="button"
            onClick={() => setIsCrashCartModalOpen(true)}
            className={`px-3 py-1.5 border text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
              lastCrashCartLog?.isFullyReady 
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border-emerald-300' 
                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 border-rose-300 animate-pulse'
            }`}
          >
            <Zap className="w-4 h-4 text-amber-500" />
            <span>Emergency Crash Cart: {lastCrashCartLog ? '✓ Verified Daily' : '⚠ Daily Audit Required'}</span>
          </button>

          <span className="bg-surface-accent px-3 py-1.5 border border-line text-accent font-bold">
            {procedureQueue.length} Patients in Queue
          </span>
        </div>
      </div>

      {/* Station Sub-Navigation Tabs */}
      <div className="flex border border-line bg-surface p-1 rounded-none gap-1 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveStationTab('procedures')}
          className={`flex-1 py-2 px-3 text-xs font-bold flex items-center justify-center gap-2 rounded-none transition-all cursor-pointer whitespace-nowrap ${
            activeStationTab === 'procedures'
              ? 'bg-primary text-white'
              : 'text-ink dark:text-slate-300 hover:bg-surface-accent dark:hover:bg-night-800'
          }`}
        >
          <Activity className="w-4 h-4 shrink-0" />
          <span>Procedures &amp; In-Clinic Queue ({procedureQueue.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveStationTab('immunization')}
          className={`flex-1 py-2 px-3 text-xs font-bold flex items-center justify-center gap-2 rounded-none transition-all cursor-pointer whitespace-nowrap ${
            activeStationTab === 'immunization'
              ? 'bg-primary text-white'
              : 'text-ink dark:text-slate-300 hover:bg-surface-accent dark:hover:bg-night-800'
          }`}
        >
          <Syringe className="w-4 h-4 shrink-0" />
          <span>Childhood Immunization &amp; Cold Chain (Jadual KKM)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveStationTab('clinical-waste')}
          className={`flex-1 py-2 px-3 text-xs font-bold flex items-center justify-center gap-2 rounded-none transition-all cursor-pointer whitespace-nowrap ${
            activeStationTab === 'clinical-waste'
              ? 'bg-primary text-white'
              : 'text-ink dark:text-slate-300 hover:bg-surface-accent dark:hover:bg-night-800'
          }`}
        >
          <Trash2 className="w-4 h-4 shrink-0" />
          <span>Clinical Waste &amp; Sharps (SW 404)</span>
        </button>
      </div>

      {/* Clinical Waste Sub-Module */}
      {activeStationTab === 'clinical-waste' ? (
        <ClinicalWasteModule />
      ) : activeStationTab === 'immunization' ? (
        <ImmunizationModule 
          patient={activePatient}
          onAdministerVaccine={(record) => {
            setToastMessage(`✓ ${record.vaccineName} recorded for ${activePatient?.fullName || 'Child'}. Lot #${record.batchNo}`);
            setTimeout(() => setToastMessage(null), 4000);
          }}
        />
      ) : procedureQueue.length === 0 ? (
        <div className="bg-surface border border-line p-12 text-center text-muted">
          <Syringe className="w-12 h-12 text-muted mx-auto mb-3 opacity-40" />
          <h3 className="text-sm font-bold text-ink">No patients currently awaiting procedures</h3>
          <p className="text-xs mt-1">When doctors order injections, nebulizers, dressings or rapid tests in consultation, they will appear here automatically.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch min-h-[520px]">
          {/* Left Roster: Patients Awaiting Procedures (4 cols / 33%) */}
          <div className="lg:col-span-4 bg-surface border border-line p-4 space-y-3 flex flex-col">
            <div className="flex items-center justify-between border-b border-line pb-2">
              <span className="text-2xs font-mono font-bold uppercase tracking-wider text-muted">Awaiting Action</span>
              <span className="text-2xs font-mono font-bold text-accent">{procedureQueue.length} Active</span>
            </div>

            <div className="space-y-2 overflow-y-auto max-h-[600px] flex-1">
              {procedureQueue.map(v => {
                const pt = patientsMap[v.patientId];
                if (!pt) return null;
                const isSelected = activeVisit?.id === v.id;
                const procs = v.soap?.plan?.procedures || [];
                const isHold = v.status === 'Holding for Results';

                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => { setSelectedVisitId(v.id); setSelectedProcedureId(null); }}
                    className={`w-full text-left p-3 border transition-colors cursor-pointer flex flex-col gap-1.5 ${
                      isSelected
                        ? 'bg-primary text-white border-primary'
                        : isHold
                        ? 'bg-amber-500/10 border-amber-300 dark:border-amber-800 text-ink hover:bg-surface-accent'
                        : 'bg-surface border-line hover:bg-surface-accent text-ink'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold">
                        {formatTicket(v.ticketNo) || '#---'} · {pt.fullName}
                      </span>
                      {isHold && (
                        <span className={`text-2xs px-1.5 py-0.2 uppercase font-mono font-bold border ${isSelected ? 'bg-amber-300 text-black border-amber-400' : 'bg-amber-100 text-amber-900 border-amber-300'}`}>
                          Holding for Test
                        </span>
                      )}
                    </div>

                    <div className="text-2xs font-mono flex items-center justify-between opacity-90">
                      <span>{pt.gender} · {calculatePatientAge(pt.dob).displayAge}</span>
                      <span>{procs.length} Order(s)</span>
                    </div>

                    <div className="text-2xs font-medium truncate pt-1 border-t border-white/20">
                      {procs.map(p => p.name).join(' · ')}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Action Canvas: Procedure Administration Panel (8 cols / 67%) */}
          <div className="lg:col-span-8 bg-surface border border-line p-5 space-y-5 flex flex-col justify-between">
            {activeVisit && activePatient ? (
              <div className="space-y-4">
                {/* Active Patient Bar */}
                <div className="bg-surface-muted border border-line p-3 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-ink">
                      {formatTicket(activeVisit.ticketNo) && <span className="font-mono text-accent mr-2">{formatTicket(activeVisit.ticketNo)}</span>}
                      {activePatient.fullName}
                    </h3>
                    <p className="text-2xs text-muted font-mono mt-0.5">
                      IC: {maskICNumber(activePatient.icNumber)} · {activePatient.gender} · {calculatePatientAge(activePatient.dob).displayAge}
                    </p>
                  </div>

                  {activePatient.drugAllergies && activePatient.drugAllergies.length > 0 ? (
                    <span className="bg-rose-100 text-rose-900 border border-rose-300 text-2xs font-bold font-mono px-2.5 py-1 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                      Allergies: {activePatient.drugAllergies.join(', ')}
                    </span>
                  ) : (
                    <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 text-2xs font-bold font-mono px-2 py-1">
                      No Drug Allergies
                    </span>
                  )}
                </div>

                {/* Ordered Procedures List */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted font-mono">
                    Ordered Procedures by Doctor ({activeVisit.doctorName || 'Attending GP'})
                  </h4>

                  {pendingProcedures.length === 0 ? (
                    <div className="p-4 bg-surface-muted text-xs text-muted border border-line">
                      All procedures for this patient encounter have been administered and completed.
                    </div>
                  ) : (
                    pendingProcedures.map(proc => {
                      const isDiagnostic = proc.category === 'Diagnostic';

                      return (
                        <div key={proc.id} className="border border-line bg-surface p-4 space-y-3">
                          <div className="flex items-center justify-between border-b border-line pb-2">
                            <div>
                              <span className="text-2xs font-mono uppercase font-bold text-accent px-2 py-0.5 bg-surface-accent border border-line mr-2">
                                {proc.category}
                              </span>
                              <strong className="text-sm font-bold text-ink">{proc.name}</strong>
                            </div>
                            <span className="text-xs font-mono font-bold text-ink">RM {proc.price.toFixed(2)}</span>
                          </div>

                          <p className="text-xs text-muted font-medium">
                            <span className="font-bold text-ink">Instructions:</span> {proc.dosageOrDetails}
                          </p>

                          {/* Administration Inputs */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                            {!isDiagnostic ? (
                              <div>
                                <label className="block text-2xs font-bold uppercase font-mono text-muted mb-1">
                                  Administration Site
                                </label>
                                <select
                                  value={adminSite}
                                  onChange={e => setAdminSite(e.target.value)}
                                  className="w-full text-xs p-2 border border-line bg-surface text-ink font-medium"
                                >
                                  <option value="Left Deltoid (IM)">Left Deltoid (IM)</option>
                                  <option value="Right Deltoid (IM)">Right Deltoid (IM)</option>
                                  <option value="Left Ventrogluteal (IM)">Left Ventrogluteal (IM)</option>
                                  <option value="Right Gluteal (IM)">Right Gluteal (IM)</option>
                                  <option value="Anterior Thigh (Vastus Lateralis)">Anterior Thigh (Vastus Lateralis)</option>
                                  <option value="Inhalation via Nebulizer Mask">Inhalation via Nebulizer Mask</option>
                                  <option value="Left Forearm (IV Cannula)">Left Forearm (IV Cannula)</option>
                                  <option value="Right Hand Dorsum (IV Cannula)">Right Hand Dorsum (IV Cannula)</option>
                                  <option value="Localized Wound Site">Localized Wound Site</option>
                                </select>
                              </div>
                            ) : (
                              <div>
                                <label className="block text-2xs font-bold uppercase font-mono text-muted mb-1">
                                  Diagnostic Test Result
                                </label>
                                <input
                                  type="text"
                                  value={resultText}
                                  onChange={e => setResultText(e.target.value)}
                                  placeholder="e.g. Dengue NS1: Negative, IgG/IgM: Negative"
                                  className="w-full text-xs p-2 border border-line bg-surface text-ink"
                                />
                              </div>
                            )}

                            <div>
                              <label className="block text-2xs font-bold uppercase font-mono text-muted mb-1">
                                Medication Vial Batch Number
                              </label>
                              <input
                                type="text"
                                value={batchNo}
                                onChange={e => setBatchNo(e.target.value)}
                                placeholder="e.g. BAT-2026-X821"
                                className="w-full text-xs p-2 border border-line bg-surface text-ink font-mono"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-2xs font-bold uppercase font-mono text-muted mb-1">
                              Nurse Clinical Notes &amp; Post-Observation
                            </label>
                            <input
                              type="text"
                              value={nurseNotes}
                              onChange={e => setNurseNotes(e.target.value)}
                              placeholder="e.g. Skin prepped with alcohol swab. Injection administered smoothly without immediate hematoma."
                              className="w-full text-xs p-2 border border-line bg-surface text-ink"
                            />
                          </div>

                          {/* Statutory PHFSA 1998 Consent Check / Trigger */}
                          <div className="border border-line bg-surface-muted/30 p-2.5 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <ShieldAlert className="w-4 h-4 text-primary" />
                              <span className="font-bold text-ink">Informed Procedural Consent (PHFSA 1998):</span>
                              {signedConsents[proc.id] ? (
                                <span className="text-emerald-700 dark:text-emerald-300 font-mono text-2xs font-bold bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 border border-emerald-300">
                                  ✓ Signed &amp; Legally Executed ({signedConsents[proc.id].id})
                                </span>
                              ) : (
                                <span className="text-amber-800 dark:text-amber-300 text-2xs font-medium">
                                  Pending electronic patient / guardian statutory signature
                                </span>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => setConsentModalProc(proc)}
                              className="px-2.5 py-1 bg-surface-accent border border-line text-xs font-bold text-ink hover:bg-surface flex items-center gap-1.5 cursor-pointer"
                            >
                              <FileText className="w-3.5 h-3.5 text-primary" />
                              <span>{signedConsents[proc.id] ? 'View / Print Consent' : 'Review & Sign Consent'}</span>
                            </button>
                          </div>

                          <div className="pt-2 flex justify-end">
                            <button
                              type="button"
                              onClick={() => handleAdminister(proc)}
                              className="px-5 py-2.5 bg-primary hover:bg-deep text-white text-xs font-bold uppercase font-mono tracking-wider flex items-center gap-2 cursor-pointer transition-colors"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Confirm Administration &amp; Bill (RM {proc.price.toFixed(2)})</span>
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Statutory PHFSA 1998 Procedural Consent Modal */}
      {consentModalProc && activePatient && (
        <ProceduralConsentModal
          isOpen={!!consentModalProc}
          onClose={() => setConsentModalProc(null)}
          procedureName={consentModalProc.name}
          patientId={activePatient.id}
          patientName={activePatient.fullName}
          patientIc={activePatient.icNumber}
          doctorName={activeVisit?.doctorName || 'Dr. Consult In-Charge'}
          onConsentSigned={(record) => {
            setSignedConsents(prev => ({ ...prev, [consentModalProc.id]: record }));
            setToastMessage(`✓ PHFSA Consent legally executed for ${consentModalProc.name} (ID: ${record.id})`);
            setTimeout(() => setToastMessage(null), 4000);
          }}
        />
      )}

      {/* PHFSA 1998 Part V Emergency Crash Cart Inspection Modal */}
      <CrashCartInspectionModal
        isOpen={isCrashCartModalOpen}
        onClose={() => setIsCrashCartModalOpen(false)}
        onInspectionSaved={(record) => {
          setLastCrashCartLog(record);
          setToastMessage(`✓ Crash cart daily inspection recorded: ${record.oxygenPsi} PSI (${record.isFullyReady ? '100% Ready' : 'Defects Flagged'})`);
          setTimeout(() => setToastMessage(null), 4000);
          setIsCrashCartModalOpen(false);
        }}
      />
    </div>
  );
}
