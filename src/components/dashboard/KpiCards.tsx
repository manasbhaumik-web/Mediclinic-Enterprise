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

export default function KpiCards({ showKpi, pharmacyQueue, completedVisits, totalEncountersToday, activeQueueCount, cashierQueue, hasThroughput, hourlyTrafficData, doctorQueue, longestDoctorWait, triageQueue, calculatedRevenue, avgWaitMinutes, waitingTimes }: KpiCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      
      {showKpi('prescriptions') && (
        <div className="bg-surface border border-line-subtle rounded-none p-5 shadow-2xs hover:bg-surface-muted transition-colors relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-600 text-2xs font-bold uppercase tracking-wider">
            <span>Pending prescriptions</span>
            <span className="p-2 bg-purple-50 border border-purple-200 text-purple-600 rounded-none">
              <Pill className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div>
              <span className="type-metric font-mono text-slate-900 block">{pharmacyQueue.length}</span>
              <span className="text-xs font-semibold text-slate-600 mt-1 block">
                Est. fulfilment: <strong className="text-accent font-mono font-bold">{pharmacyQueue.length > 0 ? `${pharmacyQueue.length * 3 + 2} min` : '0 min'}</strong>
              </span>
            </div>
            <MicroSparkline data={[1, 3, 4, 2, 5, 3, 2, 4]} color={seriesColors.emeraldDark} />
          </div>
          <div className="mt-3 pt-2 border-t border-line-subtle text-xs text-slate-600 font-semibold">
            Dispensed today: {completedVisits.length}
          </div>
        </div>
      )}
    
      {/* KPI 1: Today's Encounters */}
      {showKpi('encounters') && (
        <div className="bg-surface border border-line-subtle rounded-none p-5 shadow-2xs hover:bg-surface-muted transition-colors relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-600 text-2xs font-bold uppercase tracking-wider">
            <span>Today's Total Encounters</span>
            <span className="p-2 bg-surface-accent border border-line text-accent rounded-none">
              <Users className="w-4 h-4" />
            </span>
          </div>
    
          <div className="mt-3 flex items-baseline justify-between">
            <div>
              <span className="type-metric font-mono text-slate-900 block">
                {totalEncountersToday}
              </span>
              <span className="text-xs font-semibold text-slate-600 mt-1 block">
                {completedVisits.length} completed · {activeQueueCount + cashierQueue.length} in progress
              </span>
            </div>
            
            {hasThroughput && <MicroSparkline data={hourlyTrafficData.map((d) => d.encounters)} color={palette.brand} />}
          </div>
    
          <div className="mt-3 pt-2 border-t border-line-subtle flex items-center justify-between text-xs text-slate-600 font-semibold">
            <span>Registered since opening</span>
          </div>
        </div>
      )}
    
      {/* KPI 2: Active Waiting Queue */}
      {showKpi('waiting') && (
        <div className="bg-surface border border-line-subtle rounded-none p-5 shadow-2xs hover:bg-surface-muted transition-colors relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-600 text-2xs font-bold uppercase tracking-wider">
            <span>Waiting for doctor</span>
            <span className="p-2 bg-amber-50 border border-amber-200 text-amber-600 rounded-none">
              <Clock className="w-4 h-4" />
            </span>
          </div>
    
          <div className="mt-3 flex items-baseline justify-between">
            <div>
              <span className="type-metric font-mono text-slate-900 block">
                {doctorQueue.length}
              </span>
              <span className="text-xs font-semibold text-slate-600 mt-1 block">
                Longest wait: <strong className="text-accent font-mono font-bold">{longestDoctorWait} min</strong>
              </span>
            </div>
            
          </div>
    
          <div className="mt-3 pt-2 border-t border-line-subtle flex items-center justify-between text-xs text-slate-600 font-semibold">
            <span>Triage queue: {triageQueue.length}</span>
            <span className={`font-bold px-1.5 py-0.5 rounded-none border ${longestDoctorWait >= 30 ? 'text-amber-800 bg-amber-100 border-amber-300' : 'text-accent bg-surface-accent border-line'}`}>
              {longestDoctorWait >= 30 ? 'Long wait' : doctorQueue.length > 0 ? 'Within target' : 'No wait'}
            </span>
          </div>
        </div>
      )}
    
      {/* KPI 3: Today's Financial Billing */}
      {showKpi('collections') && (
        <div className="bg-surface border border-line-subtle rounded-none p-5 shadow-2xs hover:bg-surface-muted transition-colors relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-600 text-2xs font-bold uppercase tracking-wider">
            <span>Today's collections</span>
            <span className="p-2 bg-sky-50 border border-sky-200 text-sky-600 rounded-none">
              <CreditCard className="w-4 h-4" />
            </span>
          </div>
    
          <div className="mt-3 flex items-baseline justify-between">
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-xs font-bold text-slate-600">RM</span>
                <span className="type-metric font-mono text-slate-900">
                  {calculatedRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
    
          </div>
    
          <div className="mt-3 pt-2 border-t border-line-subtle flex items-center justify-between text-xs text-slate-600 font-semibold">
            <span>Awaiting payment: {cashierQueue.length} visit{cashierQueue.length === 1 ? '' : 's'}</span>
          </div>
        </div>
      )}
    
      {/* KPI 4: Clinic Operational Efficiency */}
      {showKpi('efficiency') && (
        <div className="bg-surface border border-line-subtle rounded-none p-5 shadow-2xs hover:bg-surface-muted transition-colors relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-600 text-2xs font-bold uppercase tracking-wider">
            <span>Average wait</span>
            <span className="p-2 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-none">
              <ShieldCheck className="w-4 h-4" />
            </span>
          </div>
    
          <div className="mt-3 flex items-baseline justify-between">
            <div>
              <span className="type-metric font-mono text-slate-900 block">
                {avgWaitMinutes} <span className="text-sm font-bold text-slate-600">min</span>
              </span>
            </div>
    
          </div>
    
          <div className="mt-3 pt-2 border-t border-line-subtle flex items-center justify-between text-xs text-slate-600 font-semibold">
            <span>Across {waitingTimes.length} waiting patient{waitingTimes.length === 1 ? '' : 's'}</span>
          </div>
        </div>
      )}
    
    </div>
  );
}
