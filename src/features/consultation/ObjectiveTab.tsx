import React from 'react';
import { LineChart, Activity, Copy, Lock, Stethoscope, PlusCircle } from 'lucide-react';
import { Visit } from '../../types';

type Vitals = { bpSystolic: number; bpDiastolic: number; heartRate: number; temperature: number; respiratoryRate: number };

interface ObjectiveTabProps {
  vitals: Vitals;
  setVitals: React.Dispatch<React.SetStateAction<Vitals>>;
  /** Vitals recorded at triage. A value of 0 means "not recorded". Recorded values are locked; the rest can be entered here. */
  triageVitals?: Partial<Vitals>;
  patientPastVisits: Visit[];
  clinicalNotes?: string;
  setClinicalNotes?: React.Dispatch<React.SetStateAction<string>>;
}

type Field = { key: keyof Vitals; id: string; label: string; step?: string; note: (v: number) => { text: string; tone: 'ok' | 'warn' | 'danger' } };

const FIELDS: Field[] = [
  { key: 'bpSystolic', id: 'vital-bp-sys', label: 'BP systolic (mmHg)', note: (v) => v > 140 ? { text: 'Stage 2 hypertension range', tone: 'danger' } : v >= 130 ? { text: 'Elevated systolic', tone: 'warn' } : { text: 'Normal range: 90 to 130', tone: 'ok' } },
  { key: 'bpDiastolic', id: 'vital-bp-dia', label: 'BP diastolic (mmHg)', note: (v) => v > 90 ? { text: 'High diastolic', tone: 'danger' } : { text: 'Normal range: 60 to 85', tone: 'ok' } },
  { key: 'heartRate', id: 'vital-hr', label: 'Heart rate (bpm)', note: (v) => v > 100 || v < 50 ? { text: 'Outside 50 to 100 bpm', tone: 'warn' } : { text: 'Normal range: 60 to 100', tone: 'ok' } },
  { key: 'temperature', id: 'vital-temp', label: 'Temperature (°C)', step: '0.1', note: (v) => v >= 37.5 ? { text: `Fever (${v}°C)`, tone: 'danger' } : { text: 'Normal range: 36.4 to 37.2', tone: 'ok' } },
  { key: 'respiratoryRate', id: 'vital-rr', label: 'Respiratory rate (/min)', note: (v) => v > 20 ? { text: 'Fast breathing', tone: 'warn' } : { text: 'Normal range: 12 to 20', tone: 'ok' } },
];
const CHIP = { ok: 'chip-ok', warn: 'chip-warn', danger: 'chip-danger' } as const;

export default function ObjectiveTab({ vitals, setVitals, triageVitals = {}, patientPastVisits, clinicalNotes = "", setClinicalNotes }: ObjectiveTabProps) {
  const examTokens = [
    { label: "+ Alert & NAD", phrase: "NAD (Patient alert, conscious, no acute distress)" },
    { label: "+ Lungs Clear", phrase: "Chest clear bilaterally, good equal air entry, no rhonchi/wheeze" },
    { label: "+ Normal Abdomen", phrase: "Abdomen soft, non-tender, no organomegaly or guarding" },
    { label: "+ Pharynx Normal", phrase: "Pharynx normal, tonsils not enlarged, no exudates" },
    { label: "+ Throat Injected", phrase: "Pharynx mildly injected, tonsils grade 1, no purulent exudate" },
    { label: "+ Heart Sounds Normal", phrase: "Dual rhythm S1 S2 heard, no murmurs" },
  ];
  const locked = (k: keyof Vitals) => (triageVitals[k] ?? 0) > 0;
  const anyUnrecorded = FIELDS.some((f) => !locked(f.key));
  const anyLocked = FIELDS.some((f) => locked(f.key));
  const last = patientPastVisits[0]?.soap?.objective;

  // Fill only the values nobody has recorded for this visit, from the patient's last visit.
  const copyFromLastVisit = () => {
    if (!last) return;
    setVitals((v) => {
      const next = { ...v };
      for (const f of FIELDS) if (!locked(f.key) && !(v[f.key] > 0) && last[f.key] > 0) next[f.key] = last[f.key];
      return next;
    });
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface p-3.5 rounded-none border border-line">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="type-label text-ink flex items-center gap-1.5 font-bold">
              <Activity className="w-4 h-4 text-accent" aria-hidden="true" />
              Objective: Clinical Vitals
            </h4>
            {anyLocked && <span className="chip-warn px-2 py-0.5 text-2xs inline-flex items-center gap-1"><Lock className="w-3 h-3" aria-hidden="true" />Recorded at triage</span>}
          </div>
          <p className="text-xs text-muted font-medium mt-0.5">
            {anyUnrecorded ? 'Values not taken at triage show "Not recorded". Enter them here if you measure them.' : 'All readings were captured at the check-in station.'}
          </p>
        </div>
        {anyUnrecorded && last && (
          <button type="button" onClick={copyFromLastVisit} className="btn-secondary shrink-0" title="Fills only the empty fields, from the patient's last visit">
            <Copy className="w-4 h-4" aria-hidden="true" />
            Fill empty from last visit
          </button>
        )}
      </div>

      {patientPastVisits.length > 1 && (
        <div className="bg-surface rounded-none p-3 border border-line flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <LineChart className="w-4 h-4 text-accent" aria-hidden="true" />
            <span className="text-xs font-bold text-ink uppercase tracking-wider font-mono">Blood pressure, last 3 visits</span>
          </div>
          <div className="flex items-center gap-3">
            {patientPastVisits.slice(0, 3).map((v) => (
              <div key={v.id} className="flex flex-col items-center bg-surface-muted px-2.5 py-1 rounded-none border border-line">
                <span className="text-xs text-subtle font-mono tabular-nums">{v.date.substring(5)}</span>
                <span className="text-xs font-bold font-mono tabular-nums text-accent">{v.soap.objective.bpSystolic > 0 ? `${v.soap.objective.bpSystolic}/${v.soap.objective.bpDiastolic}` : 'Not recorded'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5">
        {FIELDS.map((f) => {
          const value = vitals[f.key];
          const recorded = value > 0;
          const isLocked = locked(f.key);
          const note = recorded ? f.note(value) : null;
          
          const stripeClass = !recorded 
            ? ''
            : note?.tone === 'danger'
              ? ''
              : note?.tone === 'warn'
                ? ''
                : '';

          return (
            <div key={f.key} className={`p-3.5 bg-surface border border-line rounded-none ${stripeClass}`}>
              <label htmlFor={f.id} className="block text-xs font-bold text-subtle uppercase tracking-wider mb-1">{f.label}</label>
              <input
                id={f.id}
                type="number"
                inputMode="decimal"
                step={f.step}
                min="0"
                readOnly={isLocked}
                value={recorded ? value : ''}
                placeholder="Not recorded"
                onChange={(e) => setVitals({ ...vitals, [f.key]: e.target.value === '' ? 0 : Number(e.target.value) })}
                className={`w-full min-h-11 px-3 text-sm font-mono tabular-nums font-bold text-ink border border-line-strong ${isLocked ? 'bg-surface-muted' : 'bg-surface'}`}
              />
              {note ? <span className={`${CHIP[note.tone]} mt-1.5 px-2 py-0.5 text-xs inline-flex items-center font-mono tabular-nums`}>{note.text}</span>
                : <span className="chip-neutral mt-1.5 px-2 py-0.5 text-xs inline-flex items-center font-mono">Not recorded</span>}
            </div>
          );
        })}
      </div>

      {/* 2. PHYSICAL EXAMINATION FINDINGS (STANDARD OBJECTIVE CLINICAL EXAM) */}
      <div className="bg-surface border border-line p-4 rounded-none space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-line pb-2">
          <div className="flex items-center gap-2">
            <Stethoscope className="w-4 h-4 text-accent" />
            <h4 className="type-label text-ink font-bold">Physical Examination (PE)</h4>
          </div>
          <span className="text-2xs font-mono text-muted">Document physical signs, chest, throat, abdomen</span>
        </div>

        {/* Quick Normal Stamp Tokens */}
        <div className="flex flex-wrap items-center gap-1.5 p-2 bg-surface-muted border border-line">
          <span className="text-2xs font-mono uppercase font-bold text-muted mr-1">Normal Stamps:</span>
          {examTokens.map((token, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                if (!setClinicalNotes) return;
                setClinicalNotes(prev => {
                  const trimmed = prev.trim();
                  if (!trimmed) return token.phrase;
                  return `${trimmed}\n• ${token.phrase}`;
                });
              }}
              className="text-2xs bg-surface hover:bg-surface-accent text-ink border border-line px-2.5 py-1 rounded-none cursor-pointer font-sans transition-colors flex items-center gap-1"
              title={`Append "${token.phrase}" to examination findings`}
            >
              <PlusCircle className="w-3 h-3 text-accent" />
              <span>{token.label}</span>
            </button>
          ))}
        </div>

        {setClinicalNotes && (
          <textarea
            id="objective-physical-exam-input"
            className="w-full bg-surface border border-line focus:border-primary focus:ring-1 focus:ring-primary rounded-none px-4 py-3 text-xs text-ink transition-all outline-none resize-y min-h-[110px] leading-relaxed placeholder:text-muted font-sans"
            value={clinicalNotes}
            onChange={(e) => setClinicalNotes(e.target.value)}
            placeholder="Record physical examination findings (e.g., alert/NAD, chest clear, pharynx normal, soft abdomen)..."
          />
        )}
      </div>
    </div>
  );
}
