import React, { useState } from 'react';
import { Patient, Visit, VitalSigns } from '../../types';
import { Activity, CheckCircle2, ArrowRight, AlertTriangle, Siren } from 'lucide-react';
import RedCodeAlarmModal from '../operations/RedCodeAlarmModal';
import ProcedureStationModule from '../operations/ProcedureStationModule';
import { completeVisitProcedure } from '../../domain/procedures';
import { maskICNumber } from '../../utils/piiMasker';
import { calculatePatientAge } from '../../domain/patientAge';
import { calculateMEWS } from '../../domain/aiTriageScore';
import { PageHeading, StationTabs, StatStrip } from '../../components/ui/StationChrome';
import { formatTicket } from '../../domain/ticket';
import { formatWait } from '../../utils/waitTime';
import { useLanguage } from '../../context/LanguageContext';

interface TriageModuleProps {
  triageQueue: Visit[];
  allVisits?: Visit[];
  patientsMap: Record<string, Patient>;
  onTriageComplete: (visitId: string, vitals: Partial<VitalSigns>, chiefComplaint: string) => Promise<boolean> | void;
  onUpdateVisit?: (visit: Visit) => Promise<boolean> | void;
  /** Records a rapid-test result and returns the held patient to the doctor's queue. */
  onClearHold?: (visitId: string, result: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  onReportError?: (message: string) => void;
  currentStaffId?: string;
  currentStaffName?: string;
  onNavigateTab?: (tab: string) => void;
}

const initialsOf = (name: string) => {
  const words = name.split(/\s+/).filter(Boolean);
  const letters = words.length > 1 ? [words[0][0], words[words.length - 1][0]] : [words[0]?.[0] ?? ''];
  return letters.join('').toUpperCase();
};

export default function TriageModule({ triageQueue, allVisits = [], patientsMap, onTriageComplete, onUpdateVisit, onClearHold, onReportError, currentStaffId, currentStaffName, onNavigateTab }: TriageModuleProps) {
  const [activeStationTab, setActiveStationTab] = useState<'vitals' | 'procedures'>('vitals');
  const { activeLanguage, t } = useLanguage();
  const isBM = activeLanguage === 'BM';
  const [activeVisitId, setActiveVisitId] = useState<string | null>(null);
  const [vitalsForm, setVitalsForm] = useState({
    temperature: '',
    bpSystolic: '',
    bpDiastolic: '',
    heartRate: '',
    respiratoryRate: '',
    chiefComplaint: ''
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isRedCodeModalOpen, setIsRedCodeModalOpen] = useState(false);
  const procedureQueueCount = (allVisits || []).filter(v => {
    if (v.status === 'Awaiting Procedure' || v.status === 'Holding for Results') return true;
    const procs = v.soap?.plan?.procedures || [];
    return procs.some(p => p.status === 'Pending' || p.status === 'In Progress');
  }).length;

  const waits = triageQueue.map((v) => (v.registeredTime ? Math.max(0, Math.floor((Date.now() - v.registeredTime) / 60000)) : 0));
  const avgWait = waits.length ? Math.round(waits.reduce((a, b) => a + b, 0) / waits.length) : 0;
  const maxWait = waits.length ? Math.max(...waits) : 0;
  const overSla = waits.filter((m) => m >= 20).length;
  const allergyFlags = triageQueue.filter((v) => (patientsMap[v.patientId]?.drugAllergies?.filter(Boolean).length ?? 0) > 0).length;

  const activeVisit = activeVisitId ? triageQueue.find(v => v.id === activeVisitId) : null;
  const activePatient = activeVisit ? patientsMap[activeVisit.patientId] : null;

  const mewsResult = calculateMEWS({
    bpSystolic: vitalsForm.bpSystolic,
    bpDiastolic: vitalsForm.bpDiastolic,
    heartRate: vitalsForm.heartRate,
    respiratoryRate: vitalsForm.respiratoryRate,
    temperature: vitalsForm.temperature,
  });

  const handleSelectPatient = (visit: Visit) => {
    setActiveVisitId(visit.id);
    setVitalsForm({
      temperature: visit.soap?.objective?.temperature?.toString() || '',
      bpSystolic: visit.soap?.objective?.bpSystolic?.toString() || '',
      bpDiastolic: visit.soap?.objective?.bpDiastolic?.toString() || '',
      heartRate: visit.soap?.objective?.heartRate?.toString() || '',
      respiratoryRate: visit.soap?.objective?.respiratoryRate?.toString() || '',
      chiefComplaint: visit.soap?.subjective === 'Pending Triage' ? '' : (visit.soap?.subjective || '')
    });
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSubmitTriage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeVisitId) return;

    // A reading left blank is recorded as not measured (0), never as a normal-looking value nobody took.
    const parsedVitals = {
      temperature: parseFloat(vitalsForm.temperature) || 0,
      bpSystolic: parseInt(vitalsForm.bpSystolic) || 0,
      bpDiastolic: parseInt(vitalsForm.bpDiastolic) || 0,
      heartRate: parseInt(vitalsForm.heartRate) || 0,
      respiratoryRate: parseInt(vitalsForm.respiratoryRate) || 0,
    };

    const saved = await onTriageComplete(activeVisitId, parsedVitals, vitalsForm.chiefComplaint);
    // The patient stays selected when the save fails, so nothing typed is lost.
    if (saved === false) {
      onReportError?.(isBM ? 'Triaj tidak disimpan. Semak sambungan dan cuba lagi.' : 'The triage was not saved. Check the connection and try again.');
      return;
    }

    showToast(isBM ? `${activePatient?.fullName} telah ditriaj dan dihantar ke Giliran Doktor.` : `${activePatient?.fullName} triaged and sent to Doctor Queue.`);
    setActiveVisitId(null);
  };

  return (
    <div className="space-y-4 animate-fadeIn relative font-sans text-strong">
      <PageHeading eyebrow={`${isBM ? 'Staf' : 'Staff'}: ${currentStaffName || 'Clinic Nurse'}`} title={isBM ? 'Stesen triaj' : 'Triage station'}>
        <button
          type="button"
          onClick={() => setIsRedCodeModalOpen(true)}
          className="min-h-11 px-4 border border-rose-700 bg-surface text-rose-800 hover:bg-rose-700 hover:text-white dark:text-rose-200 text-sm font-bold inline-flex items-center gap-2 cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600"
        >
          <Siren className="w-4 h-4" aria-hidden="true" />
          <span>{isBM ? 'Penggera Kod Merah' : 'Code Red resus alarm'}</span>
        </button>
      </PageHeading>

      <StationTabs<'vitals' | 'procedures'>
        label={isBM ? 'Bahagian triaj' : 'Triage sections'}
        active={activeStationTab}
        onChange={setActiveStationTab}
        tabs={[
          { id: 'vitals', label: isBM ? 'Triaj tanda vital' : 'Vitals triage', count: triageQueue.length, alert: true },
          { id: 'procedures', label: isBM ? 'Bilik rawatan & prosedur' : 'Treatment room and procedures', count: procedureQueueCount },
        ]}
      />

      <StatStrip
        label={isBM ? 'Angka triaj' : 'Triage figures'}
        stats={[
          { label: isBM ? 'Menunggu triaj' : 'Awaiting triage', value: triageQueue.length, note: isBM ? 'Pesakit menunggu tanda vital' : 'Patients waiting for vitals' },
          { label: isBM ? 'Masa menunggu (purata / maks)' : 'Wait time (avg / max)', value: `${formatWait(avgWait)} / ${formatWait(maxWait)}`, note: overSla > 0 ? `${overSla} ${isBM ? 'melebihi sasaran 20 min' : 'over the 20 min target'}` : (isBM ? 'Dalam sasaran' : 'Within target') },
          { label: isBM ? 'Di bilik rawatan' : 'In treatment room', value: procedureQueueCount, note: isBM ? 'Prosedur dan ujian pantas' : 'Procedures and rapid tests' },
          { label: isBM ? 'Bendera alahan' : 'Allergy flags', value: allergyFlags, tone: allergyFlags > 0 ? 'danger' : 'default', note: isBM ? 'Dalam giliran triaj' : 'In the triage queue' },
        ]}
      />


      {activeStationTab === 'procedures' ? (
        <ProcedureStationModule
          visits={allVisits}
          patientsMap={patientsMap}
          onCompleteProcedure={(visitId, procedureId, details) => {
            const visit = allVisits.find((v) => v.id === visitId);
            if (!visit || !onUpdateVisit) return;
            const updated = completeVisitProcedure(visit, procedureId, currentStaffId || 'nurse-1', details);
            onUpdateVisit(updated);
          }}
          onClearHold={async (visitId, resultSummary) => {
            if (!onClearHold) return;
            const result = await onClearHold(visitId, resultSummary);
            if ('error' in result) onReportError?.(`The result was not recorded, so the patient is still on hold. ${result.error}`);
          }}
        />
      ) : (
      <>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-primary text-white px-6 py-4 rounded-none shadow-2xl flex items-center justify-center gap-3 z-50 animate-slideUp border border-line">
          <CheckCircle2 className="w-5 h-5 text-teal-200" />
          <span className="font-bold text-sm tracking-wide">{toastMessage}</span>
        </div>
      )}

      <section className="flex flex-wrap bg-surface border border-line">
        {/* ASSESSMENT: the patient in focus */}
        <article className="flex-[999_1_36rem] min-w-0 p-5 sm:p-7 flex flex-col gap-6" aria-label={isBM ? 'Penilaian triaj' : 'Triage assessment'}>
          {activeVisit && activePatient ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-accent">
                  <span className="w-2 h-2 bg-emerald-600" aria-hidden="true" />
                  {isBM ? 'Sedang ditriaj' : 'Triaging now'}
                </span>
                {activeVisit.ticketNo != null && (
                  <span className="px-3 py-1 bg-surface-strong text-accent text-xs font-semibold">{formatTicket(activeVisit.ticketNo)}</span>
                )}
              </div>

              <div className="flex items-center gap-4 min-w-0">
                <div className="shrink-0 w-14 h-14 bg-surface-strong text-accent flex items-center justify-center text-xl font-bold" aria-hidden="true">
                  {initialsOf(activePatient.fullName)}
                </div>
                <div className="min-w-0">
                  <h2 className="text-2xl font-bold tracking-tight leading-tight text-ink break-words">{activePatient.fullName}</h2>
                  <p className="mt-1 text-sm text-muted">
                    {calculatePatientAge(activePatient.dob).displayAge} · {activePatient.gender} · IC {maskICNumber(activePatient.icNumber, true)}
                  </p>
                </div>
              </div>

              {(activePatient.drugAllergies?.filter(Boolean).length ?? 0) > 0 && (
                <div role="alert" className="flex items-start gap-3 px-4 py-3 bg-rose-50 border border-rose-200 text-rose-900 dark:bg-rose-950/60 dark:border-rose-800 dark:text-rose-100">
                  <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
                  <p className="text-sm leading-snug">
                    <strong>{isBM ? 'Alahan ubat:' : 'Drug allergy:'}</strong> {activePatient.drugAllergies!.filter(Boolean).join(', ')}. {isBM ? 'Sahkan dengan pesakit sebelum diserahkan kepada doktor.' : 'Confirm with the patient before handing over to the doctor.'}
                  </p>
                </div>
              )}

              <form id="triage-form" onSubmit={handleSubmitTriage} className="flex flex-col gap-6">
                <fieldset className="min-w-0">
                  <legend className="pb-3 text-xs font-bold text-accent tracking-wide">{t.vitalsSign || (isBM ? 'Tanda vital' : 'Vital signs')}</legend>
                  <div className="grid grid-cols-[repeat(auto-fit,minmax(8rem,1fr))] gap-px bg-line border border-line">
                    {[
                      { key: 'temperature', label: isBM ? 'Suhu' : 'Temperature', unit: '°C', ph: '36.6', step: '0.1' },
                      { key: 'bpSystolic', label: isBM ? 'BP sistolik' : 'BP systolic', unit: 'mmHg', ph: '120' },
                      { key: 'bpDiastolic', label: isBM ? 'BP diastolik' : 'BP diastolic', unit: 'mmHg', ph: '80' },
                      { key: 'heartRate', label: isBM ? 'Kadar nadi' : 'Heart rate', unit: 'bpm', ph: '72' },
                      { key: 'respiratoryRate', label: isBM ? 'Kadar pernafasan' : 'Respiratory rate', unit: '/min', ph: '16' },
                    ].map((f) => (
                      <div key={f.key} className="bg-surface-muted px-4 py-3">
                        <label htmlFor={`triage-${f.key}`} className="block text-xs font-semibold text-ink mb-1.5">{f.label}</label>
                        <input
                          id={`triage-${f.key}`}
                          type="number"
                          step={f.step}
                          required
                          value={(vitalsForm as Record<string, string>)[f.key]}
                          onChange={(e) => setVitalsForm({ ...vitalsForm, [f.key]: e.target.value })}
                          placeholder={f.ph}
                          className="w-full min-h-11 px-3 bg-surface border border-line text-base font-semibold tabular-nums text-ink rounded-none outline-none focus:border-brand focus:ring-2 focus:ring-accent"
                        />
                        <span className="block text-2xs text-muted mt-1">{f.unit}</span>
                      </div>
                    ))}
                  </div>
                </fieldset>

                {/* Early warning score (MEWS) */}
                {(vitalsForm.bpSystolic || vitalsForm.heartRate) && (
                  <div
                    className={`p-4 border text-xs ${
                      mewsResult.riskLevel === 'High'
                        ? 'bg-rose-50 border-rose-300 text-rose-900 dark:bg-rose-950/60 dark:border-rose-800 dark:text-rose-100'
                        : mewsResult.riskLevel === 'Medium'
                        ? 'bg-amber-50 border-amber-300 text-amber-900 dark:bg-amber-950/60 dark:border-amber-800 dark:text-amber-100'
                        : 'bg-emerald-50 border-emerald-300 text-emerald-900 dark:bg-emerald-950/60 dark:border-emerald-800 dark:text-emerald-100'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-2 text-sm font-bold">
                        <Activity className="w-4 h-4" aria-hidden="true" />
                        {isBM ? 'Skor amaran awal (MEWS)' : 'Early warning score (MEWS)'}
                      </span>
                      <span className={`px-2.5 py-1 text-xs font-bold border ${mewsResult.riskLevel === 'High' ? 'chip-danger' : mewsResult.riskLevel === 'Medium' ? 'chip-warn' : 'chip-ok'}`}>
                        {mewsResult.riskLevel} {isBM ? 'risiko' : 'risk'} · {isBM ? 'skor' : 'score'} {mewsResult.score}
                      </span>
                    </div>
                    {mewsResult.flags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2.5">
                        {mewsResult.flags.map((f, i) => (
                          <span key={i} className="px-2 py-0.5 bg-surface border border-current text-xs font-semibold">{f}</span>
                        ))}
                      </div>
                    )}
                    <p className="mt-2.5 text-sm leading-relaxed">{isBM ? mewsResult.actionPromptBM : mewsResult.actionPrompt}</p>
                  </div>
                )}

                <div>
                  <label htmlFor="triage-chief-complaint" className="block pb-2 text-xs font-bold text-accent tracking-wide">
                    {isBM ? 'Aduan utama' : 'Chief complaint'} <span className="text-rose-600">*</span>
                  </label>
                  <textarea
                    id="triage-chief-complaint"
                    required
                    rows={3}
                    className="w-full bg-surface border border-line rounded-none px-3 py-2.5 text-sm leading-normal text-ink outline-none resize-y focus:border-brand focus:ring-2 focus:ring-accent"
                    value={vitalsForm.chiefComplaint}
                    onChange={(e) => setVitalsForm({ ...vitalsForm, chiefComplaint: e.target.value })}
                    placeholder={isBM ? 'Aduan utama pesakit...' : "Patient's primary complaint..."}
                  />
                </div>
              </form>

              <div className="flex flex-wrap items-center gap-3 pt-5 border-t border-line">
                <button type="submit" form="triage-form" title="Save vital signs and route patient to active doctor consultation queue" className="btn-primary min-h-12 px-6 text-sm max-sm:w-full">
                  {isBM ? 'Hantar ke doktor' : 'Send to doctor'} <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>
                <button type="button" onClick={() => setActiveVisitId(null)} className="btn-secondary min-h-12 px-5 text-sm text-ink max-sm:w-full">
                  {isBM ? 'Batal' : 'Cancel'}
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 min-h-[24rem] flex flex-col items-center justify-center text-center">
              <Activity className="w-10 h-10 text-accent opacity-40 mb-3" aria-hidden="true" />
              <p className="text-sm font-semibold text-ink">{isBM ? 'Pilih pesakit daripada giliran untuk memulakan triaj.' : 'Select a patient from the queue to begin triage.'}</p>
              <p className="text-xs text-muted mt-1">{isBM ? 'Pesakit yang menunggu paling lama berada di atas.' : 'The longest-waiting patient is at the top.'}</p>
            </div>
          )}
        </article>

        {/* QUEUE */}
        <aside className="flex-[1_1_20rem] min-w-0 border-t lg:border-t-0 lg:border-l border-line flex flex-col" aria-labelledby="triage-queue-title">
          <div className="flex items-center justify-between px-5 py-4 border-b border-line">
            <h2 id="triage-queue-title" className="text-base font-bold text-ink">{isBM ? 'Menunggu triaj' : 'Awaiting triage'}</h2>
            <span className="px-2.5 py-1 bg-surface-muted text-muted text-xs font-semibold">
              {triageQueue.length} {isBM ? 'menunggu' : 'waiting'}
            </span>
            <div role="status" aria-live="polite" className="sr-only">
              {triageQueue.length} {isBM ? 'pesakit menunggu penilaian triaj' : 'patients awaiting triage assessment'}
            </div>
          </div>
          {triageQueue.length === 0 ? (
            <p className="px-5 py-6 text-sm text-muted">{isBM ? 'Giliran triaj kosong.' : 'Triage queue empty.'}</p>
          ) : (
            <ol className="flex flex-col">
              {triageQueue.map((visit) => {
                const pt = patientsMap[visit.patientId];
                const isActive = activeVisitId === visit.id;
                const mins = visit.registeredTime ? Math.max(0, Math.floor((Date.now() - visit.registeredTime) / 60000)) : null;
                const long = mins !== null && mins >= 20;
                const pname = pt?.fullName ?? `Visit ${visit.id}`;
                return (
                  <li key={visit.id} className="border-b border-line-subtle">
                    <button
                      type="button"
                      onClick={() => handleSelectPatient(visit)}
                      aria-current={isActive ? 'true' : undefined}
                      title={`Select ${pname} to record triage vital signs`}
                      className={`w-full flex items-center gap-3 px-5 py-3 text-left cursor-pointer transition-colors hover:bg-surface-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent ${
                        isActive ? 'bg-surface-accent shadow-[inset_3px_0_0_var(--color-primary)]' : long ? 'bg-amber-50/70 dark:bg-amber-950/30' : ''
                      }`}
                    >
                      <span className="shrink-0 w-9 h-9 bg-surface-strong text-accent flex items-center justify-center text-xs font-bold" aria-hidden="true">{initialsOf(pname)}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-ink truncate">{pname}</span>
                        <span className="block text-xs text-muted tabular-nums">IC {maskICNumber(pt?.icNumber, true)}</span>
                      </span>
                      <span className={`shrink-0 px-2.5 py-1 text-xs font-bold tabular-nums ${long ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200' : 'bg-surface-strong text-accent'}`}>
                        {mins !== null ? formatWait(mins) : (isBM ? 'Baru' : 'Just in')}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          )}
          <button type="button" onClick={() => onNavigateTab?.('registration')} className="mt-auto min-h-12 border-t border-line text-sm font-semibold text-accent hover:bg-surface-accent transition-colors cursor-pointer">
            {isBM ? 'Buka pendaftaran' : 'Open registration'}
          </button>
        </aside>
      </section>
      </>
      )}

      <RedCodeAlarmModal
        isOpen={isRedCodeModalOpen}
        onClose={() => setIsRedCodeModalOpen(false)}
      />
    </div>
  );
}
