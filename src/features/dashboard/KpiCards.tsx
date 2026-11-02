import type { KpiId } from './types';
import { Visit } from '../../types';
import { formatWait } from '../../utils/waitTime';

interface KpiCardsProps {
  showKpi: (id: KpiId) => boolean;
  pharmacyQueue: Visit[];
  completedVisits: Visit[];
  totalEncountersToday: number;
  activeQueueCount: number;
  cashierQueue: Visit[];
  hasThroughput: boolean;
  hourlyTrafficData: { hour: string; encounters: number; }[];
  doctorQueue: Visit[];
  longestDoctorWait: number;
  triageQueue: Visit[];
  calculatedRevenue: number;
  avgWaitMinutes: number;
  waitingTimes: number[];
  allergyFlagCount: number;
}

type Tone = 'ok' | 'warn' | 'danger';
const NOTE_TONE: Record<Tone, string> = {
  ok: 'text-accent',
  warn: 'text-amber-800 dark:text-amber-300',
  danger: 'text-rose-700 dark:text-rose-300',
};

/** One ruled strip of figures: a label, a large value and a one-line note per tile. */
export default function KpiCards({
  showKpi,
  pharmacyQueue,
  completedVisits,
  activeQueueCount,
  cashierQueue,
  doctorQueue,
  longestDoctorWait,
  calculatedRevenue,
  avgWaitMinutes,
  waitingTimes,
  allergyFlagCount,
}: KpiCardsProps) {
  const inProgress = activeQueueCount + cashierQueue.length;
  const slaOk = waitingTimes.length === 0 || avgWaitMinutes <= 20;

  const tiles: { id: KpiId; label: string; value: string; note: string; tone: Tone }[] = [
    {
      id: 'prescriptions', label: 'Pending prescriptions', value: String(pharmacyQueue.length),
      note: pharmacyQueue.length > 0 ? `About ${pharmacyQueue.length * 3 + 2} min to fulfil` : 'Nothing waiting', tone: 'ok',
    },
    {
      id: 'encounters', label: 'Seen today', value: String(completedVisits.length),
      note: `${inProgress} in progress`, tone: 'ok',
    },
    {
      id: 'waiting', label: 'Waiting for doctor', value: String(doctorQueue.length),
      note: doctorQueue.length === 0 ? 'No wait' : `Longest wait ${formatWait(longestDoctorWait)}`,
      tone: longestDoctorWait >= 30 ? 'warn' : 'ok',
    },
    {
      id: 'collections', label: "Today's collections", value: `RM ${calculatedRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      note: `${cashierQueue.length} awaiting payment`, tone: 'ok',
    },
    {
      id: 'efficiency', label: 'Average wait', value: formatWait(avgWaitMinutes),
      note: slaOk ? 'Within 20 min target' : 'Over 20 min target', tone: slaOk ? 'ok' : 'warn',
    },
    {
      id: 'allergies', label: 'Allergy flags', value: String(allergyFlagCount),
      note: allergyFlagCount > 0 ? 'In current queue' : 'None in queue', tone: allergyFlagCount > 0 ? 'danger' : 'ok',
    },
  ];
  const shown = tiles.filter((t) => showKpi(t.id));
  if (shown.length === 0) return null;

  return (
    <section aria-label="Today at a glance" className="grid grid-cols-[repeat(auto-fit,minmax(12rem,1fr))] bg-surface border-l border-t border-line">
      {shown.map((t) => (
        <div key={t.id} className="px-5 py-5 border-r border-b border-line">
          <p className="text-xs font-medium text-muted">{t.label}</p>
          <p className="mt-2 text-3xl font-bold leading-none tracking-tight tabular-nums text-ink break-words">{t.value}</p>
          <p className={`mt-2.5 text-xs font-semibold ${NOTE_TONE[t.tone]}`}>{t.note}</p>
        </div>
      ))}
    </section>
  );
}
