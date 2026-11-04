import React from 'react';
import { History, Clock, ChevronLeft, AlertTriangle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import ChronicDiseaseFlowsheet from './ChronicDiseaseFlowsheet';
import { buttonProps, focusRing } from '../../../lib/a11y';
import { Patient, Visit } from '../../../types';

interface ContextPanelProps {
  vitals: { bpSystolic: number; bpDiastolic: number; heartRate: number; temperature: number; respiratoryRate: number; };
  t: { [key: string]: string };
  patientPastVisits: Visit[];
  /** The patient's earlier visits could not be loaded: an empty list does not mean a first visit. */
  historyError?: boolean;
  selectedPastVisit: Visit | null;
  setSelectedPastVisit: React.Dispatch<React.SetStateAction<Visit | null>>;
  stationHud?: React.ReactNode;
  onToggleCollapse?: () => void;
  /** Who is in the room: shown at the top of the panel. */
  patient?: Patient;
  patientAgeDisplay?: string;
  ticketText?: string;
  roomText?: string;
  maskedIC?: string;
  isPiiRevealed?: boolean;
  setIsPiiRevealed?: React.Dispatch<React.SetStateAction<boolean>>;
}

const initialsOf = (name: string) => {
  const words = name.split(/\s+/).filter(Boolean);
  return (words.length > 1 ? [words[0][0], words[words.length - 1][0]] : [words[0]?.[0] ?? '']).join('').toUpperCase();
};

export default function ContextPanel({
  vitals,
  t,
  patientPastVisits,
  historyError = false,
  selectedPastVisit,
  setSelectedPastVisit,
  stationHud,
  onToggleCollapse,
  patient,
  patientAgeDisplay,
  ticketText,
  roomText,
  maskedIC,
  isPiiRevealed = false,
  setIsPiiRevealed,
}: ContextPanelProps) {
  const [panelMode, setPanelMode] = React.useState<'timeline' | 'flowsheet'>('timeline');
  const allergies = patient?.drugAllergies?.filter(Boolean) ?? [];
  const coverage = patient ? (!patient.panelEmployer || /^none/i.test(patient.panelEmployer) ? 'Self-pay' : patient.panelEmployer) : '';
  const meta = patient ? [patientAgeDisplay, patient.gender, coverage].filter(Boolean).join(' · ') : '';

  const cells = [
    { label: 'Temperature', value: vitals.temperature > 0 ? vitals.temperature : null, unit: '°C', warn: vitals.temperature >= 38 },
    { label: 'Heart rate', value: vitals.heartRate > 0 ? vitals.heartRate : null, unit: 'bpm', warn: vitals.heartRate > 110 },
    { label: 'Blood pressure', value: vitals.bpSystolic > 0 ? `${vitals.bpSystolic}/${vitals.bpDiastolic}` : null, unit: 'mmHg', warn: vitals.bpSystolic >= 160 },
    { label: 'Respiratory rate', value: vitals.respiratoryRate > 0 ? vitals.respiratoryRate : null, unit: '/min', warn: vitals.respiratoryRate > 24 },
  ];

  return (
    <div className="w-full flex flex-col">
      {/* Who is in the room */}
      {patient && (
        <section aria-label="Patient" className="p-5 flex flex-col gap-4 border-b border-line">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-accent">
              <span className="w-2 h-2 bg-emerald-600" aria-hidden="true" />
              Now seeing
            </span>
            {onToggleCollapse && (
              <button
                type="button"
                onClick={onToggleCollapse}
                className="inline-flex items-center gap-1 min-h-9 px-2.5 text-xs font-semibold text-accent border border-line bg-surface hover:bg-surface-accent cursor-pointer transition-colors"
                title="Collapse history & vitals panel (Alt+H)"
                aria-label="Collapse patient context panel"
              >
                <ChevronLeft className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Collapse</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-4 min-w-0">
            <div className="shrink-0 w-14 h-14 bg-surface-strong text-accent flex items-center justify-center text-xl font-bold" aria-hidden="true">
              {initialsOf(patient.fullName)}
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-bold tracking-tight leading-tight text-ink break-words">{patient.fullName}</h2>
              {meta && <p className="mt-1 text-sm text-muted">{meta}</p>}
              {(ticketText || roomText) && (
                <p className="mt-0.5 text-sm text-muted tabular-nums">{[ticketText, roomText].filter(Boolean).join(' · ')}</p>
              )}
            </div>
          </div>

          {maskedIC && setIsPiiRevealed && (
            <p className="flex items-center gap-1.5 text-xs text-muted">
              <span className="font-medium">IC</span>
              <strong className="text-ink tabular-nums">{maskedIC}</strong>
              <button
                type="button"
                onClick={() => setIsPiiRevealed(!isPiiRevealed)}
                className="min-h-9 min-w-9 inline-flex items-center justify-center text-accent hover:text-ink cursor-pointer transition-colors"
                title={isPiiRevealed ? 'Mask PII IC Number' : 'Click to Reveal PII IC Number'}
                aria-label={isPiiRevealed ? 'Mask IC' : 'Reveal IC'}
              >
                {isPiiRevealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </p>
          )}

          {allergies.length > 0 ? (
            <div role="alert" className="flex items-start gap-3 px-4 py-3 bg-rose-50 border border-rose-200 text-rose-900 dark:bg-rose-950/60 dark:border-rose-800 dark:text-rose-100">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-sm leading-snug"><strong>Drug allergy:</strong> {allergies.join(', ')}. Check before prescribing.</p>
            </div>
          ) : (
            <p className="inline-flex items-center gap-2 text-sm text-muted">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" aria-hidden="true" />
              No known drug allergies
            </p>
          )}
        </section>
      )}

      {/* Vitals for this visit */}
      <section aria-label="Vitals for this visit" className="p-5 border-b border-line">
        <div className="flex items-baseline justify-between gap-2 mb-3">
          <h3 className="text-base font-bold text-ink">Vitals</h3>
          <span className="text-xs text-subtle">Blank = unrecorded</span>
        </div>
        <dl className="grid grid-cols-2 gap-px bg-line border border-line">
          {cells.map((c) => (
            <div key={c.label} className="bg-surface-muted px-3.5 py-2.5">
              <dt className="text-xs font-medium text-muted">{c.label}</dt>
              <dd className={`mt-0.5 text-lg font-bold tabular-nums ${c.warn ? 'text-amber-700 dark:text-amber-300' : 'text-ink'}`}>
                {c.value ?? <span className="text-sm font-medium text-subtle">Not recorded</span>}
                {c.value !== null && <span className="ml-1 text-xs font-medium text-muted">{c.unit}</span>}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Longitudinal history and chronic flowsheet */}
      <section aria-label="History" className="p-5 flex-1 flex flex-col gap-3">
        <div className="flex gap-1.5" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={panelMode === 'timeline'}
            onClick={() => setPanelMode('timeline')}
            className={`flex-1 min-h-11 px-3 border text-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              panelMode === 'timeline' ? 'bg-surface-strong border-surface-strong text-ink font-bold' : 'bg-surface border-line text-muted font-semibold hover:bg-surface-accent'
            }`}
          >
            <History className="w-4 h-4" aria-hidden="true" />
            <span>Visits ({patientPastVisits.length})</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={panelMode === 'flowsheet'}
            onClick={() => setPanelMode('flowsheet')}
            className={`flex-1 min-h-11 px-3 border text-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              panelMode === 'flowsheet' ? 'bg-surface-strong border-surface-strong text-ink font-bold' : 'bg-surface border-line text-muted font-semibold hover:bg-surface-accent'
            }`}
          >
            <span>Chronic flowsheet</span>
          </button>
        </div>

        {panelMode === 'flowsheet' ? (
          <ChronicDiseaseFlowsheet pastVisits={patientPastVisits} currentVitals={vitals} />
        ) : (
          <>
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="text-base font-bold text-ink">{t.longitudinalHistory}</h3>
              <span className="text-xs text-muted tabular-nums">{patientPastVisits.length} visits</span>
            </div>

            {patientPastVisits.length === 0 ? (
              <div className="py-6 text-center flex-1 flex flex-col items-center justify-center">
                <Clock className="w-8 h-8 text-accent opacity-50 mb-2" aria-hidden="true" />
                <span className="text-sm text-ink font-semibold">{historyError ? 'Previous visits could not be loaded' : 'First outpatient encounter'}</span>
                <span className="text-xs text-subtle mt-0.5">{historyError ? 'Do not assume this is a first visit. Check the connection and reopen the patient.' : "This session starts the patient's clinical timeline."}</span>
              </div>
            ) : (
              <div className="overflow-y-auto max-h-[320px] custom-scrollbar border-t border-line-subtle">
                {patientPastVisits.map((visit) => {
                  const isSelected = selectedPastVisit?.id === visit.id;
                  return (
                    <div
                      key={visit.id}
                      {...buttonProps(() => setSelectedPastVisit(isSelected ? null : visit), isSelected)}
                      className={`py-3 px-2 -mx-2 border-b border-line-subtle text-left cursor-pointer transition-colors ${focusRing} ${isSelected ? 'bg-surface-accent' : 'hover:bg-surface-muted'}`}
                    >
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="font-semibold text-accent tabular-nums">{visit.date}</span>
                        <span className="text-muted tabular-nums">{visit.soap.assessment.icdCode}</span>
                      </div>
                      <p className="text-sm font-semibold text-ink truncate mt-0.5">{visit.soap.assessment.description}</p>
                      <p className="text-xs text-muted line-clamp-2 mt-0.5">S: {visit.soap.subjective}</p>

                      {isSelected && (
                        <div className="mt-2 pt-2 border-t border-line text-xs space-y-1 text-muted animate-fadeIn">
                          <div className="tabular-nums"><strong>Objective:</strong> BP {visit.soap.objective.bpSystolic}/{visit.soap.objective.bpDiastolic} mmHg.</div>
                          <div><strong>Notes:</strong> {visit.soap.assessment.clinicalNotes}</div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </section>

      {/* Consultation station and queue telemetry */}
      {stationHud && (
        <section aria-label="Station" className="p-5 border-t border-line">
          {stationHud}
        </section>
      )}
    </div>
  );
}
