import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { calculatePatientAge } from '../../domain/patientAge';
import { conflictsWithAllergy, recordedAllergies } from '../../domain/allergy';
import { formatWait } from '../../utils/waitTime';
import type { Language, Patient, Visit } from '../../types';

interface PharmacistDispenseSheetProps {
  /** Signed-off prescriptions waiting at the counter, longest wait first. */
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

/**
 * The pharmacist's dashboard: the next prescription in focus with one primary action, and the rest of the
 * dispensing queue beside it. Same ruled sheet as the doctor's focus sheet.
 */
export default function PharmacistDispenseSheet({ visits, patients, activeLanguage, onNavigateTab }: PharmacistDispenseSheetProps) {
  const isBM = activeLanguage === 'BM';

  if (visits.length === 0) {
    return (
      <section className="bg-surface border border-line p-8 text-center" aria-label={isBM ? 'Dispens' : 'Dispensing'}>
        <CheckCircle2 className="w-8 h-8 text-accent mx-auto mb-2" aria-hidden="true" />
        <p className="text-sm font-semibold text-ink">{isBM ? 'Tiada preskripsi menunggu' : 'No prescriptions waiting'}</p>
        <p className="text-xs text-muted mt-1">{isBM ? 'Preskripsi yang disahkan doktor akan muncul di sini.' : 'Prescriptions signed off by the doctor appear here.'}</p>
      </section>
    );
  }

  const [first, ...rest] = visits;
  const patient = patients.find((p) => p.id === first.patientId);
  const name = patient?.fullName ?? `Visit ${first.id}`;
  const allergies = recordedAllergies(patient?.drugAllergies);
  const lines = first.soap?.plan?.prescription ?? [];
  const memo = first.soap?.plan?.pharmacyMemo;
  const age = patient?.dob ? calculatePatientAge(patient.dob).displayAge : null;
  const coverage = patient?.panelEmployer && !/^none/i.test(patient.panelEmployer) ? patient.panelEmployer : (isBM ? 'Bayar sendiri' : 'Self-pay');
  const meta = [age, patient?.gender, coverage].filter(Boolean).join(' · ');
  const conflicts = lines.filter((rx) => conflictsWithAllergy(rx.drugName, allergies)).length;

  return (
    <section className="flex flex-wrap bg-surface border border-line" aria-label={isBM ? 'Dispens' : 'Dispensing'}>
      <article className="flex-[999_1_30rem] min-w-0 p-5 sm:p-7 flex flex-col gap-5" aria-labelledby="dispense-patient-name">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-accent">
            <span className="w-2 h-2 bg-emerald-600" aria-hidden="true" />
            {isBM ? 'Seterusnya untuk didispens' : 'Up next to dispense'}
          </span>
          <span className="px-3 py-1 bg-surface-strong text-accent text-xs font-semibold">
            {lines.length} {lines.length === 1 ? (isBM ? 'item' : 'item') : (isBM ? 'item' : 'items')}
          </span>
        </div>

        <div className="flex items-center gap-4 min-w-0">
          <div className="shrink-0 w-14 h-14 bg-surface-strong text-accent flex items-center justify-center text-xl font-bold" aria-hidden="true">
            {initialsOf(name)}
          </div>
          <div className="min-w-0">
            <h2 id="dispense-patient-name" className="text-2xl font-bold tracking-tight leading-tight text-ink break-words">{name}</h2>
            {meta && <p className="mt-1 text-sm text-muted">{meta}</p>}
          </div>
        </div>

        {allergies.length > 0 ? (
          <div role="alert" className="flex items-start gap-3 px-4 py-3 bg-rose-50 border border-rose-200 text-rose-900 dark:bg-rose-950/60 dark:border-rose-800 dark:text-rose-100">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-sm leading-snug">
              <strong>{isBM ? 'Alahan ubat:' : 'Drug allergy:'}</strong> {allergies.join(', ')}.{' '}
              {conflicts > 0
                ? (isBM ? `${conflicts} baris preskripsi bercanggah. Semak sebelum mendispens.` : `${conflicts} prescribed ${conflicts === 1 ? 'line conflicts' : 'lines conflict'}. Check before dispensing.`)
                : (isBM ? 'Semak sebelum mendispens.' : 'Check before dispensing.')}
            </p>
          </div>
        ) : (
          <p className="inline-flex items-center gap-2 text-sm text-muted">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" aria-hidden="true" />
            {isBM ? 'Tiada alahan ubat diketahui' : 'No known drug allergies'}
          </p>
        )}

        {memo && (
          <div className="px-4 py-3 bg-amber-50 border border-amber-300 text-amber-900 dark:bg-amber-950/60 dark:border-amber-800 dark:text-amber-100">
            <p className="text-xs font-bold">{isBM ? 'Arahan doktor' : "Doctor's instructions"}</p>
            <p className="mt-1 text-sm leading-relaxed">{memo}</p>
          </div>
        )}

        {lines.length > 0 && (
          <ul className="border border-line flex flex-col">
            {lines.map((rx) => {
              const conflict = conflictsWithAllergy(rx.drugName, allergies);
              return (
                <li key={rx.id} className={`flex items-center justify-between gap-3 px-4 py-3 border-b border-line-subtle last:border-b-0 ${conflict ? 'bg-rose-50 dark:bg-rose-950/40' : ''}`}>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink truncate">{rx.drugName}</p>
                    <p className="text-xs text-muted truncate">{rx.dosage}</p>
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-surface-strong text-accent text-xs font-bold tabular-nums">{isBM ? 'Kuantiti' : 'Qty'} {rx.quantity}</span>
                    {conflict && <span className="chip-danger px-2 py-0.5 text-xs font-bold">{isBM ? 'Semak alahan' : 'Allergy check'}</span>}
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={() => onNavigateTab('dispensary')} className="btn-primary min-h-12 px-6 text-sm max-sm:w-full">
            {isBM ? 'Buka dispensari' : 'Open dispensary'}
          </button>
        </div>
      </article>

      <aside className="flex-[1_1_20rem] min-w-0 border-t lg:border-t-0 lg:border-l border-line flex flex-col" aria-labelledby="dispense-queue-title">
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <h2 id="dispense-queue-title" className="text-base font-bold text-ink">{isBM ? 'Preskripsi untuk didispens' : 'Prescriptions to dispense'}</h2>
          <span className="px-2.5 py-1 bg-surface-muted text-muted text-xs font-semibold">
            {visits.length} {isBM ? 'menunggu' : 'waiting'}
          </span>
        </div>
        {rest.length === 0 ? (
          <p className="px-5 py-6 text-sm text-muted">{isBM ? 'Tiada preskripsi lain menunggu.' : 'No other prescriptions waiting.'}</p>
        ) : (
          <ol className="flex flex-col">
            {rest.map((v) => {
              const p = patients.find((x) => x.id === v.patientId);
              const mins = waitOf(v);
              const long = mins !== null && mins >= 20;
              const pname = p?.fullName ?? `Visit ${v.id}`;
              const count = v.soap?.plan?.prescription?.length ?? 0;
              const flagged = recordedAllergies(p?.drugAllergies).length > 0;
              return (
                <li key={v.id} className={`flex items-center gap-3 px-5 py-3 border-b border-line-subtle ${long ? 'bg-amber-50/70 dark:bg-amber-950/30' : ''}`}>
                  <div className="shrink-0 w-9 h-9 bg-surface-strong text-accent flex items-center justify-center text-xs font-bold" aria-hidden="true">{initialsOf(pname)}</div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink truncate">{pname}</p>
                    <p className={`text-xs truncate ${flagged ? 'text-rose-700 dark:text-rose-300 font-semibold' : 'text-muted'}`}>
                      {count} {isBM ? 'item' : count === 1 ? 'item' : 'items'} · {flagged ? (isBM ? 'Amaran alahan' : 'Allergy alert') : (isBM ? 'Menunggu dispens' : 'Awaiting dispense')}
                    </p>
                  </div>
                  <span className={`shrink-0 px-2.5 py-1 text-xs font-bold tabular-nums ${long ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200' : 'bg-surface-strong text-accent'}`}>
                    {mins !== null ? formatWait(mins) : (isBM ? 'Baru' : 'Just in')}
                  </span>
                </li>
              );
            })}
          </ol>
        )}
        <button type="button" onClick={() => onNavigateTab('dispensary')} className="mt-auto min-h-12 border-t border-line text-sm font-semibold text-accent hover:bg-surface-accent transition-colors cursor-pointer">
          {isBM ? 'Buka dispensari' : 'Open dispensary'}
        </button>
      </aside>
    </section>
  );
}
