import { TrendingUp, Users, DollarSign, Clock, BrainCircuit } from 'lucide-react';

interface ReportKpiGridProps {
  aggregatePatients: number;
  aggregateFees: number;
  avgDuration: number;
}

export default function ReportKpiGrid({ aggregatePatients, aggregateFees, avgDuration }: ReportKpiGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* KPI 1 */}
      <div className="bg-surface dark:bg-night-900 border border-line-subtle dark:border-teal-800/40 p-4 flex items-center justify-between rounded-none shadow-xs">
        <div>
          <span className="text-2xs text-slate-500 dark:text-teal-200/80 font-bold uppercase tracking-wider font-mono block mb-1">Total Encounters</span>
          <div className="flex items-baseline gap-2">
            <span className="type-metric text-ink dark:text-white">{aggregatePatients}</span>
            <span className="text-2xs font-bold text-accent dark:text-teal-300 flex items-center gap-0.5 font-mono">
              <TrendingUp className="w-3 h-3" /> +14.2%
            </span>
          </div>
          <span className="text-2xs text-slate-500 dark:text-slate-400 font-mono block mt-0.5">Completed consultations</span>
        </div>
        <div className="w-10 h-10 bg-surface-accent dark:bg-night-850 flex items-center justify-center text-accent dark:text-teal-300 rounded-none border border-line dark:border-teal-800/40">
          <Users className="w-5 h-5" />
        </div>
      </div>
    
      {/* KPI 2 */}
      <div className="bg-surface dark:bg-night-900 border border-line-subtle dark:border-teal-800/40 p-4 flex items-center justify-between rounded-none shadow-xs">
        <div>
          <span className="text-2xs text-slate-500 dark:text-teal-200/80 font-bold uppercase tracking-wider font-mono block mb-1">Gross Billing (RM)</span>
          <div className="flex items-baseline gap-2">
            <span className="type-metric text-ink dark:text-white">RM {aggregateFees.toFixed(2)}</span>
          </div>
          <span className="text-2xs text-accent dark:text-teal-300 font-bold font-mono block mt-0.5">Avg RM {(aggregatePatients > 0 ? aggregateFees / aggregatePatients : 0).toFixed(2)} / visit</span>
        </div>
        <div className="w-10 h-10 bg-surface-accent dark:bg-night-850 flex items-center justify-center text-accent dark:text-teal-300 rounded-none border border-line dark:border-teal-800/40">
          <DollarSign className="w-5 h-5" />
        </div>
      </div>
    
      {/* KPI 3 */}
      <div className="bg-surface dark:bg-night-900 border border-line-subtle dark:border-teal-800/40 p-4 flex items-center justify-between rounded-none shadow-xs">
        <div>
          <span className="text-2xs text-slate-500 dark:text-teal-200/80 font-bold uppercase tracking-wider font-mono block mb-1">Avg Consult Time</span>
          <div className="flex items-baseline gap-2">
            <span className="type-metric text-ink dark:text-white">{avgDuration} min</span>
          </div>
          <span className="text-2xs text-slate-500 dark:text-slate-400 font-mono block mt-0.5">Target: 15.0 mins/pt</span>
        </div>
        <div className="w-10 h-10 bg-surface-accent dark:bg-night-850 flex items-center justify-center text-accent dark:text-teal-300 rounded-none border border-line dark:border-teal-800/40">
          <Clock className="w-5 h-5" />
        </div>
      </div>
    
      {/* KPI 4 */}
      <div className="bg-surface dark:bg-night-900 border border-line-subtle dark:border-teal-800/40 p-4 flex items-center justify-between rounded-none shadow-xs">
        <div>
          <span className="text-2xs text-slate-500 dark:text-teal-200/80 font-bold uppercase tracking-wider font-mono block mb-1">Top Diagnostic (ICD-10)</span>
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-bold text-ink dark:text-white truncate max-w-[130px]" title="J06.9 Acute Upper Respiratory">
              J06.9 (URTI)
            </span>
          </div>
          <span className="text-2xs text-accent dark:text-teal-300 font-bold font-mono block mt-0.5">38% of monthly visits</span>
        </div>
        <div className="w-10 h-10 bg-surface-accent dark:bg-night-850 flex items-center justify-center text-accent dark:text-teal-300 rounded-none border border-line dark:border-teal-800/40">
          <BrainCircuit className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
