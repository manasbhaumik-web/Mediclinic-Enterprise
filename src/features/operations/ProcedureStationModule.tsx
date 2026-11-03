import React, { useState } from 'react';
import { Visit, Patient, ClinicalProcedureItem } from '../../types';
import { Syringe, CheckCircle2, AlertTriangle, Clock, Activity, FileText, ArrowRight, ShieldAlert, Sparkles, Stethoscope, ShieldCheck, Trash2, Zap, Microscope, Siren, Radio, Thermometer, HeartPulse } from 'lucide-react';
import { maskICNumber } from '../../utils/piiMasker';
import { calculatePatientAge } from '../../domain/patientAge';
import { formatTicket } from '../../domain/ticket';
import { ProceduralConsentModal } from './ProceduralConsentModal';
import { SignedConsentRecord } from '../../domain/proceduralConsent';
import { ImmunizationModule } from './ImmunizationModule';
import { CrashCartInspectionModal } from './CrashCartInspectionModal';
import { ClinicalWasteModule } from './ClinicalWasteModule';
import { CrashCartInspectionRecord } from '../../domain/crashCart';
import AutoclaveSterilizationModal from './AutoclaveSterilizationModal';
import POCTQualityControlModal from './POCTQualityControlModal';
import EmergencySBARModal from './EmergencySBARModal';
import RadiationSafetyModal from './RadiationSafetyModal';
import ColdChainVaccineModal from './ColdChainVaccineModal';
import AEFIAndSharpsModal from './AEFIAndSharpsModal';
import RedCodeAlarmModal from './RedCodeAlarmModal';
import { SterilePack } from '../../domain/autoclaveSterilization';
import { StationTabs } from '../../components/ui/StationChrome';

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
  const [isAutoclaveModalOpen, setIsAutoclaveModalOpen] = useState(false);
  const [selectedSterilePack, setSelectedSterilePack] = useState<SterilePack | null>(null);
  const [isPOCTModalOpen, setIsPOCTModalOpen] = useState(false);
  const [isSBARModalOpen, setIsSBARModalOpen] = useState(false);
  const [isRadiationModalOpen, setIsRadiationModalOpen] = useState(false);
  const [isColdChainModalOpen, setIsColdChainModalOpen] = useState(false);
  const [isAefiModalOpen, setIsAefiModalOpen] = useState(false);
  const [isRedCodeModalOpen, setIsRedCodeModalOpen] = useState(false);

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

    setToastMessage(`${proc.name} completed successfully. Procedure fee recorded to bill.`);
    setTimeout(() => setToastMessage(null), 4000);

    // Reset inputs
    setBatchNo('');
    setResultText('');
    setNurseNotes('');
  };

  const fieldClass = 'w-full min-h-11 px-3 text-sm bg-surface border border-line rounded-none text-ink outline-none focus:border-brand focus:ring-2 focus:ring-accent';
  const labelClass = 'block text-xs font-semibold text-ink mb-1.5';
  const initialsOf = (name: string) => {
    const words = name.split(/\s+/).filter(Boolean);
    return (words.length > 1 ? words[0][0] + words[words.length - 1][0] : words[0]?.[0] ?? '').toUpperCase();
  };

  return (
    <div className="space-y-4 animate-fadeIn font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div role="status" className="fixed top-20 right-6 z-[100] bg-primary text-white px-5 py-3 border border-line rounded-none flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-teal-200" aria-hidden="true" />
          <span className="text-sm font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Station tools and compliance logs */}
      <section aria-labelledby="treatment-room-title" className="bg-surface border border-line">
        <div className="px-6 py-5 border-b border-line">
          <h2 id="treatment-room-title" className="text-xl font-bold tracking-tight text-ink">Treatment room and clinical procedures</h2>
          <p className="mt-1.5 text-sm text-muted leading-relaxed max-w-3xl">Give injections, nebulizer therapy, wound dressings and rapid in-house tests ordered by the doctor.</p>
        </div>
        <div className="px-6 py-4 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-muted mr-1">Logs and safety</span>
          <button type="button" onClick={() => setIsAutoclaveModalOpen(true)} className="btn-secondary px-3 text-xs">
            <ShieldCheck className="w-4 h-4 text-accent" aria-hidden="true" /> Autoclave sterilization
          </button>
          <button type="button" onClick={() => setIsPOCTModalOpen(true)} className="btn-secondary px-3 text-xs">
            <Microscope className="w-4 h-4 text-accent" aria-hidden="true" /> POCT quality control
          </button>
          <button type="button" onClick={() => setIsColdChainModalOpen(true)} className="btn-secondary px-3 text-xs">
            <Thermometer className="w-4 h-4 text-accent" aria-hidden="true" /> Vaccine fridge log
          </button>
          <button type="button" onClick={() => setIsRadiationModalOpen(true)} className="btn-secondary px-3 text-xs">
            <Radio className="w-4 h-4 text-accent" aria-hidden="true" /> Radiation safety
          </button>
          <button type="button" onClick={() => setIsAefiModalOpen(true)} className="btn-secondary px-3 text-xs">
            <HeartPulse className="w-4 h-4 text-accent" aria-hidden="true" /> AEFI and sharps
          </button>
          <button
            type="button"
            onClick={() => setIsCrashCartModalOpen(true)}
            className={`min-h-11 px-3 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer border ${lastCrashCartLog?.isFullyReady ? 'chip-ok' : 'chip-warn'}`}
          >
            <Zap className="w-4 h-4" aria-hidden="true" /> Crash cart: {lastCrashCartLog ? 'verified today' : 'daily audit due'}
          </button>
          <button type="button" onClick={() => setIsSBARModalOpen(true)} className="btn-secondary px-3 text-xs !text-rose-800 !border-rose-200">
            <Siren className="w-4 h-4" aria-hidden="true" /> Emergency SBAR transfer
          </button>
        </div>
      </section>

      <StationTabs<'procedures' | 'immunization' | 'clinical-waste'>
        label="Treatment room sections"
        active={activeStationTab}
        onChange={setActiveStationTab}
        tabs={[
          { id: 'procedures', label: 'Procedures and queue', count: procedureQueue.length, alert: true },
          { id: 'immunization', label: 'Childhood immunization and cold chain' },
          { id: 'clinical-waste', label: 'Clinical waste and sharps' },
        ]}
      />

      {/* Clinical Waste Sub-Module */}
      {activeStationTab === 'clinical-waste' ? (
        <ClinicalWasteModule />
      ) : activeStationTab === 'immunization' ? (
        <ImmunizationModule
          patient={activePatient}
          onAdministerVaccine={(record) => {
            setToastMessage(`${record.vaccineName} recorded for ${activePatient?.fullName || 'Child'}. Lot #${record.batchNo}`);
            setTimeout(() => setToastMessage(null), 4000);
          }}
        />
      ) : procedureQueue.length === 0 ? (
        <div className="bg-surface border border-line p-12 text-center">
          <Syringe className="w-10 h-10 text-accent mx-auto mb-3 opacity-40" aria-hidden="true" />
          <h3 className="text-sm font-semibold text-ink">No patients awaiting procedures</h3>
          <p className="text-xs text-muted mt-1">When a doctor orders injections, nebulizers, dressings or rapid tests, they appear here automatically.</p>
        </div>
      ) : (
        <section className="flex flex-wrap bg-surface border border-line">
          {/* Procedure administration for the patient in focus */}
          <article className="flex-[999_1_36rem] min-w-0 p-5 sm:p-7 flex flex-col gap-6" aria-label="Procedure administration">
            {activeVisit && activePatient ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-2 text-sm font-semibold text-accent">
                    <span className="w-2 h-2 bg-emerald-600" aria-hidden="true" />
                    {activeVisit.status === 'Holding for Results' ? 'Holding for a test result' : 'Procedures now'}
                  </span>
                  {formatTicket(activeVisit.ticketNo) && <span className="px-3 py-1 bg-surface-strong text-accent text-xs font-semibold">{formatTicket(activeVisit.ticketNo)}</span>}
                </div>

                <div className="flex items-center gap-4 min-w-0">
                  <div className="shrink-0 w-14 h-14 bg-surface-strong text-accent flex items-center justify-center text-xl font-bold" aria-hidden="true">
                    {initialsOf(activePatient.fullName)}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-2xl font-bold tracking-tight leading-tight text-ink break-words">{activePatient.fullName}</h3>
                    <p className="mt-1 text-sm text-muted">
                      {activePatient.gender} · {calculatePatientAge(activePatient.dob).displayAge} · IC {maskICNumber(activePatient.icNumber)}
                    </p>
                  </div>
                </div>

                {activePatient.drugAllergies && activePatient.drugAllergies.length > 0 ? (
                  <div role="alert" className="flex items-start gap-3 px-4 py-3 bg-rose-50 border border-rose-200 text-rose-900 dark:bg-rose-950/60 dark:border-rose-800 dark:text-rose-100">
                    <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
                    <p className="text-sm leading-snug"><strong>Drug allergy:</strong> {activePatient.drugAllergies.join(', ')}. Check before giving any medication.</p>
                  </div>
                ) : (
                  <p className="inline-flex items-center gap-2 text-sm text-muted">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" aria-hidden="true" /> No known drug allergies
                  </p>
                )}

                <div className="flex flex-col gap-4">
                  <h4 className="text-xs font-bold text-accent tracking-wide">
                    Ordered by {activeVisit.doctorName || 'the attending doctor'}
                  </h4>

                  {pendingProcedures.length === 0 ? (
                    <p className="px-4 py-3 bg-surface-muted border border-line text-sm text-muted">
                      All procedures for this encounter have been given and completed.
                    </p>
                  ) : (
                    pendingProcedures.map((proc) => {
                      const isDiagnostic = proc.category === 'Diagnostic';

                      return (
                        <div key={proc.id} className="border border-line bg-surface">
                          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-surface-muted border-b border-line">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="px-2 py-0.5 bg-surface-strong text-accent text-xs font-bold">{proc.category}</span>
                              <strong className="text-base font-bold text-ink">{proc.name}</strong>
                            </div>
                            <span className="text-sm font-bold tabular-nums text-ink">RM {proc.price.toFixed(2)}</span>
                          </div>

                          <div className="p-4 flex flex-col gap-4">
                            <p className="text-sm text-muted leading-relaxed">
                              <strong className="text-ink">Instructions</strong> {proc.dosageOrDetails}
                            </p>

                            <div className="grid grid-cols-[repeat(auto-fit,minmax(15rem,1fr))] gap-4">
                              {!isDiagnostic ? (
                                <div>
                                  <label htmlFor={`site-${proc.id}`} className={labelClass}>Administration site</label>
                                  <select id={`site-${proc.id}`} value={adminSite} onChange={(e) => setAdminSite(e.target.value)} className={fieldClass}>
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
                                  <label htmlFor={`result-${proc.id}`} className={labelClass}>Diagnostic test result</label>
                                  <input id={`result-${proc.id}`} type="text" value={resultText} onChange={(e) => setResultText(e.target.value)} placeholder="e.g. Dengue NS1: Negative, IgG/IgM: Negative" className={fieldClass} />
                                </div>
                              )}

                              <div>
                                <label htmlFor={`batch-${proc.id}`} className={labelClass}>Vial batch number</label>
                                <input id={`batch-${proc.id}`} type="text" value={batchNo} onChange={(e) => setBatchNo(e.target.value)} placeholder="e.g. BAT-2026-X821" className={`${fieldClass} tabular-nums`} />
                              </div>
                            </div>

                            <div>
                              <label htmlFor={`notes-${proc.id}`} className={labelClass}>Nurse notes and observation</label>
                              <input id={`notes-${proc.id}`} type="text" value={nurseNotes} onChange={(e) => setNurseNotes(e.target.value)} placeholder="e.g. Skin prepped with alcohol swab. Given smoothly, no hematoma." className={fieldClass} />
                            </div>

                            {/* Statutory PHFSA 1998 POCT quality control */}
                            {isDiagnostic && (
                              <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-surface-muted border border-line text-sm">
                                <div className="flex items-center gap-2 min-w-0">
                                  <Microscope className="w-4 h-4 text-accent shrink-0" aria-hidden="true" />
                                  <span><strong className="text-ink">POCT quality control (PHFSA § 38)</strong> <span className="text-muted">Daily two-level calibration</span></span>
                                </div>
                                <button type="button" onClick={() => setIsPOCTModalOpen(true)} className="btn-secondary px-3 text-xs">View or calibrate</button>
                              </div>
                            )}

                            {/* Statutory PHFSA 1998 consent */}
                            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-surface-muted border border-line text-sm">
                              <div className="flex items-start gap-2 min-w-0">
                                <ShieldAlert className="w-4 h-4 text-accent shrink-0 mt-0.5" aria-hidden="true" />
                                <span>
                                  <strong className="text-ink">Informed procedural consent (PHFSA 1998)</strong>{' '}
                                  {signedConsents[proc.id] ? (
                                    <span className="chip-ok px-2 py-0.5 text-xs font-bold">Signed ({signedConsents[proc.id].id})</span>
                                  ) : (
                                    <span className="text-amber-800 dark:text-amber-300">Waiting for the patient or guardian's signature</span>
                                  )}
                                </span>
                              </div>
                              <button type="button" onClick={() => setConsentModalProc(proc)} className="btn-secondary px-3 text-xs">
                                <FileText className="w-3.5 h-3.5 text-accent" aria-hidden="true" />
                                {signedConsents[proc.id] ? 'View or print consent' : 'Review and sign'}
                              </button>
                            </div>

                            <div className="flex justify-end pt-1">
                              <button type="button" onClick={() => handleAdminister(proc)} className="btn-primary min-h-12 px-6 text-sm max-sm:w-full">
                                <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                                Confirm and bill (RM {proc.price.toFixed(2)})
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            ) : null}
          </article>

          {/* Patients awaiting procedures */}
          <aside className="flex-[1_1_20rem] min-w-0 border-t lg:border-t-0 lg:border-l border-line flex flex-col" aria-labelledby="procedure-queue-title">
            <div className="flex items-center justify-between px-5 py-4 border-b border-line">
              <h3 id="procedure-queue-title" className="text-base font-bold text-ink">Awaiting action</h3>
              <span className="px-2.5 py-1 bg-surface-muted text-muted text-xs font-semibold">{procedureQueue.length} active</span>
            </div>
            <ol className="overflow-y-auto max-h-[40rem]">
              {procedureQueue.map((v) => {
                const pt = patientsMap[v.patientId];
                if (!pt) return null;
                const isSelected = activeVisit?.id === v.id;
                const procs = v.soap?.plan?.procedures || [];
                const isHold = v.status === 'Holding for Results';

                return (
                  <li key={v.id} className="border-b border-line-subtle">
                    <button
                      type="button"
                      onClick={() => { setSelectedVisitId(v.id); setSelectedProcedureId(null); }}
                      aria-current={isSelected ? 'true' : undefined}
                      className={`w-full flex items-start gap-3 px-5 py-3 text-left cursor-pointer transition-colors hover:bg-surface-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent ${
                        isSelected ? 'bg-surface-accent shadow-[inset_3px_0_0_var(--color-primary)]' : isHold ? 'bg-amber-50/70 dark:bg-amber-950/30' : ''
                      }`}
                    >
                      <span className="shrink-0 w-9 h-9 bg-surface-strong text-accent flex items-center justify-center text-xs font-bold" aria-hidden="true">{initialsOf(pt.fullName)}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-ink truncate">{formatTicket(v.ticketNo) ? `${formatTicket(v.ticketNo)} · ` : ''}{pt.fullName}</span>
                        <span className="block text-xs text-muted">{pt.gender} · {calculatePatientAge(pt.dob).displayAge} · {procs.length} {procs.length === 1 ? 'order' : 'orders'}</span>
                        <span className="block text-xs text-muted truncate mt-0.5">{procs.map((p) => p.name).join(' · ')}</span>
                      </span>
                      {isHold && <span className="chip-warn shrink-0 px-2 py-0.5 text-xs font-bold">Holding</span>}
                    </button>
                  </li>
                );
              })}
            </ol>
          </aside>
        </section>
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
            setToastMessage(`PHFSA Consent legally executed for ${consentModalProc.name} (ID: ${record.id})`);
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
          setToastMessage(`Crash cart daily inspection recorded: ${record.oxygenPsi} PSI (${record.isFullyReady ? '100% Ready' : 'Defects Flagged'})`);
          setTimeout(() => setToastMessage(null), 4000);
          setIsCrashCartModalOpen(false);
        }}
      />
      <EmergencySBARModal
        isOpen={isSBARModalOpen}
        onClose={() => setIsSBARModalOpen(false)}
        activePatient={activePatient}
        activeVisit={activeVisit}
      />

      <RadiationSafetyModal
        isOpen={isRadiationModalOpen}
        onClose={() => setIsRadiationModalOpen(false)}
      />

      <ColdChainVaccineModal
        isOpen={isColdChainModalOpen}
        onClose={() => setIsColdChainModalOpen(false)}
      />

      <AEFIAndSharpsModal
        isOpen={isAefiModalOpen}
        onClose={() => setIsAefiModalOpen(false)}
      />

      <RedCodeAlarmModal
        isOpen={isRedCodeModalOpen}
        onClose={() => setIsRedCodeModalOpen(false)}
      />
    </div>
  );
}
