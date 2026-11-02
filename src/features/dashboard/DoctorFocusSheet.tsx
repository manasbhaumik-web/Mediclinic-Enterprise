import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { formatTicket } from '../../domain/ticket';
import { calculatePatientAge } from '../../domain/patientAge';
import { formatWait } from '../../utils/waitTime';
import type { Language, Patient, Visit } from '../../types';

interface DoctorFocusSheetProps {
  /** Waiting and in-consultation visits, longest wait first. */
  visits: Visit[];
  patients: Patient[];
  activeLanguage: Language;
  onNavigateTab: (tab: string) => void;
}

const waitOf = (v: Visit) => (v.registeredTime ? Math.max(0, Math.round((Date.now() - v.registeredTime) / 60000)) : null);
const initialsOf = (name: string) => {
  const words = name.split(/\s+/).filter(Boolean);
  const letters = words.length > 1 ? [words[0][0], words[words.length - 1][0]] : [words[0]?.[0] ?? ''];
  return letters.join('').toUpperCase();
};
const recorded = (n: number | undefined) => typeof n === 'number' && Number.isFinite(n) && n > 0;

/**
 * The doctor's dashboard: one patient in focus with a single primary action, and the rest of the queue beside it.
 * Both sit in one ruled sheet, which stacks when there is no room for two columns.
 */
export default function DoctorFocusSheet({ visits, patients, activeLanguage, onNavigateTab }: DoctorFocusSheetProps) {
  const isBM = activeLanguage === 'BM';

  if (visits.length === 0) {
    return (
      <section className="bg-surface border border-line p-8 text-center" aria-label={isBM ? 'Pesakit' : 'Patients'}>
        <CheckCircle2 className="w-8 h-8 text-accent mx-auto mb-2" aria-hidden="true" />
        <p className="text-sm font-semibold text-ink">{isBM ? 'Tiada pesakit menunggu' : 'No patients waiting'}</p>
        <p className="text-xs text-muted mt-1">{isBM ? 'Pesakit baharu akan muncul di sini.' : 'New patients appear here as they are registered.'}</p>
      </section>
    );
  }

  const [first, ...rest] = visits;
  const patient = patients.find((p) => p.id === first.patientId);
  const name = patient?.fullName ?? `Visit ${first.id}`;
  const seeingNow = first.status === 'Consulting';
  const allergies = patient?.drugAllergies?.filter(Boolean) ?? [];
  const o = first.soap?.objective;
  const waiting = visits.filter((v) => v.status !== 'Consulting').length;
  const registeredAt = first.registeredTime
    ? new Date(first.registeredTime).toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit', hour12: false })
    : null;
  const age = patient?.dob ? calculatePatientAge(patient.dob).displayAge : null;
  const coverage = patient?.panelEmployer && !/^none/i.test(patient.panelEmployer) ? patient.panelEmployer : (isBM ? 'Bayar sendiri' : 'Self-pay');
  const meta = [age, patient?.gender, coverage, registeredAt ? `${isBM ? 'Daftar' : 'Registered'} ${registeredAt}` : null].filter(Boolean).join(' · ');
  const notRecorded = isBM ? 'Tiada rekod' : 'Not recorded';

  const vitals = [
    { label: isBM ? 'Suhu' : 'Temperature', value: recorded(o?.temperature) ? String(o!.temperature) : null, unit: '°C', warn: recorded(o?.temperature) && o!.temperature >= 38 },
    { label: isBM ? 'Kadar nadi' : 'Heart rate', value: recorded(o?.heartRate) ? String(o!.heartRate) : null, unit: 'bpm', warn: recorded(o?.heartRate) && o!.heartRate > 110 },
    { label: isBM ? 'Tekanan darah' : 'Blood pressure', value: recorded(o?.bpSystolic) ? `${o!.bpSystolic}/${o!.bpDiastolic}` : null, unit: 'mmHg', warn: recorded(o?.bpSystolic) && o!.bpSystolic >= 160 },
    { label: isBM ? 'Kadar pernafasan' : 'Respiratory rate', value: recorded(o?.respiratoryRate) ? String(o!.respiratoryRate) : null, unit: '/min', warn: recorded(o?.respiratoryRate) && o!.respiratoryRate > 24 },
  ];

  return (
    <section className="flex flex-wrap bg-surface border border-line" aria-label={isBM ? 'Pesakit' : 'Patients'}>
      <article className="flex-[999_1_30rem] min-w-0 p-5 sm:p-7 flex flex-col gap-5" aria-labelledby="focus-patient-name">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-accent">
            <span className="w-2 h-2 bg-emerald-600" aria-hidden="true" />
            {seeingNow ? (isBM ? 'Sedang dirawat' : 'Now seeing') : (isBM ? 'Seterusnya' : 'Up next')}
          </span>
          <span className="px-3 py-1 bg-surface-strong text-accent text-xs font-semibold">
            {[formatTicket(first.ticketNo), first.consultRoom].filter(Boolean).join(' · ')}
          </span>
        </div>

        <div className="flex items-center gap-4 min-w-0">
          <div className="shrink-0 w-14 h-14 bg-surface-strong text-accent flex items-center justify-center text-xl font-bold" aria-hidden="true">
            {initialsOf(name)}
          </div>
          <div className="min-w-0">
            <h2 id="focus-patient-name" className="text-2xl font-bold tracking-tight leading-tight text-ink break-words">{name}</h2>
            {meta && <p className="mt-1 text-sm text-muted">{meta}</p>}
          </div>
        </div>

        {allergies.length > 0 ? (
          <div role="alert" className="flex items-start gap-3 px-4 py-3 bg-rose-50 border border-rose-200 text-rose-900 dark:bg-rose-950/60 dark:border-rose-800 dark:text-rose-100">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-sm leading-snug">
              <strong>{isBM ? 'Alahan ubat:' : 'Drug allergy:'}</strong> {allergies.join(', ')}. {isBM ? 'Semak sebelum preskripsi.' : 'Check before prescribing.'}
            </p>
          </div>
        ) : (
          <p className="inline-flex items-center gap-2 text-sm text-muted">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" aria-hidden="true" />
            {isBM ? 'Tiada alahan ubat diketahui' : 'No known drug allergies'}
          </p>
        )}

        <dl className="grid grid-cols-[repeat(auto-fit,minmax(8rem,1fr))] gap-px bg-line border border-line">
          {vitals.map((v) => (
            <div key={v.label} className="bg-surface-muted px-4 py-3">
              <dt className="text-xs font-medium text-muted">{v.label}</dt>
              <dd className={`mt-1 text-xl font-bold tabular-nums ${v.warn ? 'text-amber-700 dark:text-amber-300' : 'text-ink'}`}>
                {v.value ?? <span className="text-sm font-medium text-subtle">{notRecorded}</span>}
                {v.value && <span className="ml-1 text-xs font-medium text-muted">{v.unit}</span>}
              </dd>
            </div>
          ))}
        </dl>

        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={() => onNavigateTab(seeingNow ? 'consultation' : 'queue')} className="btn-primary min-h-12 px-6 text-sm max-sm:w-full">
            {seeingNow ? (isBM ? 'Sambung konsultasi' : 'Continue consultation') : (isBM ? 'Pergi ke giliran' : 'Go to queue')}
          </button>
          <button type="button" onClick={() => onNavigateTab('consultation')} className="btn-secondary min-h-12 px-5 text-sm text-ink max-sm:w-full">
            {isBM ? 'Sejarah pesakit' : 'Patient history'}
          </button>
        </div>
      </article>

      <aside className="flex-[1_1_20rem] min-w-0 border-t lg:border-t-0 lg:border-l border-line flex flex-col" aria-labelledby="focus-queue-title">
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <h2 id="focus-queue-title" className="text-base font-bold text-ink">{isBM ? 'Seterusnya' : 'Up next'}</h2>
          <span className="px-2.5 py-1 bg-surface-muted text-muted text-xs font-semibold">
            {waiting} {isBM ? 'menunggu' : 'waiting'}
          </span>
        </div>
        {rest.length === 0 ? (
          <p className="px-5 py-6 text-sm text-muted">{isBM ? 'Tiada pesakit lain menunggu.' : 'No other patients waiting.'}</p>
        ) : (
          <ol className="flex flex-col">
            {rest.map((v) => {
              const p = patients.find((x) => x.id === v.patientId);
              const mins = waitOf(v);
              const long = mins !== null && mins >= 20;
              const pname = p?.fullName ?? `Visit ${v.id}`;
              return (
                <li key={v.id} className={`flex items-center gap-3 px-5 py-3 border-b border-line-subtle ${long ? 'bg-amber-50/70 dark:bg-amber-950/30' : ''}`}>
                  <div className="shrink-0 w-9 h-9 bg-surface-strong text-accent flex items-center justify-center text-xs font-bold" aria-hidden="true">{initialsOf(pname)}</div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink truncate">{pname}</p>
                    <p className="text-xs text-muted truncate">{v.soap?.subjective || (isBM ? 'Tiada aduan dicatat' : 'No complaint recorded')}</p>
                  </div>
                  <span className={`shrink-0 px-2.5 py-1 text-xs font-bold tabular-nums ${long ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200' : 'bg-surface-strong text-accent'}`}>
                    {mins !== null ? formatWait(mins) : (isBM ? 'Baru' : 'Just in')}
                  </span>
                </li>
              );
            })}
          </ol>
        )}
        <button type="button" onClick={() => onNavigateTab('queue')} className="mt-auto min-h-12 border-t border-line text-sm font-semibold text-accent hover:bg-surface-accent transition-colors cursor-pointer">
          {isBM ? 'Buka giliran penuh' : 'Open full queue'}
        </button>
      </aside>
    </section>
  );
}
