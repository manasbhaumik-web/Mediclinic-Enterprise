import { useColorTheme } from '../../hooks/useColorTheme';
import MicroSparkline from './MicroSparkline';
import type { KpiId } from './types';
import { Pill, Users, Clock, CreditCard, ShieldCheck } from 'lucide-react';
import { seriesColors, palette } from '../../theme/palette';
import { Visit } from '../../types';

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
}

export default function KpiCards({
  showKpi,
  pharmacyQueue,
  completedVisits,
  totalEncountersToday,
  activeQueueCount,
  cashierQueue,
  hasThroughput,
  hourlyTrafficData,
  doctorQueue,
  longestDoctorWait,
  triageQueue,
  calculatedRevenue,
  avgWaitMinutes,
  waitingTimes,
}: KpiCardsProps) {
  useColorTheme(); // re-render when the colour theme changes so palette colours refresh

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {/* KPI: Pending Prescriptions */}
      {showKpi('prescriptions') && (
        <div className="bg-surface border border-line rounded-none p-3.5 shadow-none hover:bg-surface-muted/50 transition-colors relative overflow-hidden">
          <div className="flex items-center justify-between text-2xs font-mono font-bold uppercase tracking-wider text-muted">
            <span>Pending Prescriptions</span>
            <span className="p-1.5 bg-teal-50 dark:bg-teal-950/60 border border-teal-300 dark:border-teal-800 text-teal-700 dark:text-teal-300 rounded-none">
              <Pill className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div>
              <span className="text-2xl font-black font-mono tabular-nums text-ink tracking-tight block">{pharmacyQueue.length}</span>
              <span className="text-xs font-semibold text-muted mt-1 block">
                Est. fulfilment: <strong className="text-accent font-mono tabular-nums font-bold">{pharmacyQueue.length > 0 ? `${pharmacyQueue.length * 3 + 2} min` : '0 min'}</strong>
              </span>
            </div>
            <MicroSparkline data={[1, 3, 4, 2, 5, 3, 2, 4]} color={seriesColors.emeraldDark} />
          </div>
          <div className="mt-2 pt-2 border-t border-line-subtle flex items-center justify-between text-2xs font-mono text-muted font-semibold">
            <span>Dispensed today: <strong className="font-mono tabular-nums text-ink">{completedVisits.length}</strong></span>
            <span className="text-teal-700 dark:text-teal-300 font-bold uppercase tracking-wider">FIFO Active</span>
          </div>
        </div>
      )}

      {/* KPI 1: Today's Encounters */}
      {showKpi('encounters') && (
        <div className="bg-surface border border-line rounded-none p-3.5 shadow-none hover:bg-surface-muted/50 transition-colors relative overflow-hidden">
          <div className="flex items-center justify-between text-2xs font-mono font-bold uppercase tracking-wider text-muted">
            <span>Today's Encounters</span>
            <span className="p-1.5 bg-surface-muted border border-line text-primary rounded-none">
              <Users className="w-4 h-4" />
            </span>
          </div>

          <div className="mt-2 flex items-baseline justify-between">
            <div>
              <span className="text-2xl font-black font-mono tabular-nums text-ink tracking-tight block">
                {totalEncountersToday}
              </span>
              <span className="text-xs font-semibold text-muted mt-1 block">
                <strong className="font-mono tabular-nums text-ink">{completedVisits.length}</strong> completed · <strong className="font-mono tabular-nums text-ink">{activeQueueCount + cashierQueue.length}</strong> active
              </span>
            </div>

            {hasThroughput && <MicroSparkline data={hourlyTrafficData.map((d) => d.encounters)} color={palette.brand} />}
          </div>

          <div className="mt-2 pt-2 border-t border-line-subtle flex items-center justify-between text-2xs font-mono text-muted font-semibold">
            <span>Registered since opening</span>
            <span className="text-accent font-bold uppercase tracking-wider">Live Flow</span>
          </div>
        </div>
      )}

      {/* KPI 2: Active Waiting Queue */}
      {showKpi('waiting') && (
        <div className="bg-surface border border-line rounded-none p-3.5 shadow-none hover:bg-surface-muted/50 transition-colors relative overflow-hidden">
          <div className="flex items-center justify-between text-2xs font-mono font-bold uppercase tracking-wider text-muted">
            <span>Waiting for Doctor</span>
            <span className="p-1.5 bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300 rounded-none">
              <Clock className="w-4 h-4" />
            </span>
          </div>

          <div className="mt-2 flex items-baseline justify-between">
            <div>
              <span className="text-2xl font-black font-mono tabular-nums text-ink tracking-tight block">
                {doctorQueue.length}
              </span>
              <span className="text-xs font-semibold text-muted mt-1 block">
                Longest wait: <strong className="text-accent font-mono tabular-nums font-bold">{longestDoctorWait} min</strong>
              </span>
            </div>
          </div>

          <div className="mt-2 pt-2 border-t border-line-subtle flex items-center justify-between text-2xs font-mono text-muted font-semibold">
            <span>Triage queue: <strong className="font-mono tabular-nums text-ink">{triageQueue.length}</strong></span>
            <span
              className={`font-mono text-2xs font-bold px-1.5 py-0.5 border ${
                longestDoctorWait >= 30
                  ? 'border-amber-400 bg-amber-50 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200'
                  : 'border-line bg-surface-accent text-accent'
              }`}
            >
              {longestDoctorWait >= 30 ? 'LONG WAIT' : doctorQueue.length > 0 ? 'WITHIN TARGET' : 'NO WAIT'}
            </span>
          </div>
        </div>
      )}

      {/* KPI 3: Today's Financial Billing */}
      {showKpi('collections') && (
        <div className="bg-surface border border-line rounded-none p-3.5 shadow-none hover:bg-surface-muted/50 transition-colors relative overflow-hidden">
          <div className="flex items-center justify-between text-2xs font-mono font-bold uppercase tracking-wider text-muted">
            <span>Today's Collections</span>
            <span className="p-1.5 bg-sky-50 dark:bg-sky-950/60 border border-sky-300 dark:border-sky-800 text-sky-700 dark:text-sky-300 rounded-none">
              <CreditCard className="w-4 h-4" />
            </span>
          </div>

          <div className="mt-2 flex items-baseline justify-between">
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-xs font-mono font-bold text-muted">RM</span>
                <span className="text-2xl font-black font-mono tabular-nums text-ink tracking-tight">
                  {calculatedRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <span className="text-xs font-semibold text-muted mt-1 block">
                Settled & verified claims
              </span>
            </div>
          </div>

          <div className="mt-2 pt-2 border-t border-line-subtle flex items-center justify-between text-2xs font-mono text-muted font-semibold">
            <span>Awaiting payment: <strong className="font-mono tabular-nums text-ink">{cashierQueue.length}</strong> visit{cashierQueue.length === 1 ? '' : 's'}</span>
            <span className="text-sky-700 dark:text-sky-300 font-bold uppercase tracking-wider">100% Panel Audit</span>
          </div>
        </div>
      )}

      {/* KPI 4: Clinic Operational Efficiency */}
      {showKpi('efficiency') && (
        <div className="bg-surface border border-line rounded-none p-3.5 shadow-none hover:bg-surface-muted/50 transition-colors relative overflow-hidden">
          <div className="flex items-center justify-between text-2xs font-mono font-bold uppercase tracking-wider text-muted">
            <span>Average Wait Time</span>
            <span className="p-1.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-none">
              <ShieldCheck className="w-4 h-4" />
            </span>
          </div>

          <div className="mt-2 flex items-baseline justify-between">
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black font-mono tabular-nums text-ink tracking-tight">
                  {avgWaitMinutes}
                </span>
                <span className="text-sm font-mono font-bold text-muted">min</span>
              </div>
              <span className="text-xs font-semibold text-muted mt-1 block">
                Across <strong className="font-mono tabular-nums text-ink">{waitingTimes.length}</strong> waiting patient{waitingTimes.length === 1 ? '' : 's'}
              </span>
            </div>
          </div>

          <div className="mt-2 pt-2 border-t border-line-subtle flex items-center justify-between text-2xs font-mono text-muted font-semibold">
            <span>Benchmark: 20 min</span>
            <span className="font-mono text-2xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 border border-emerald-300 dark:border-emerald-800">
              SLA OPTIMAL
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
