import React from 'react';
import { 
  X, 
  Clock, 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  Users, 
  ChevronRight, 
  TrendingUp, 
  Timer 
} from 'lucide-react';
import { 
  analyzeClinicThroughput, 
  PatientVisitTimestamps,
  CLINIC_SLA_TARGETS 
} from '../../domain/clinicThroughput';

interface ClinicThroughputModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Realistic live day encounters for analysis
const MOCK_PATIENT_JOURNEYS: PatientVisitTimestamps[] = [
  {
    visitId: 'v-101',
    patientName: 'Khor Wei Loon',
    registeredTime: Date.now() - 65 * 60000,
    triageStartTime: Date.now() - 58 * 60000, // 7 min (ok)
    triageEndTime: Date.now() - 55 * 60000,
    consultationStartTime: Date.now() - 32 * 60000, // 23 min wait (slight breach)
    consultationEndTime: Date.now() - 18 * 60000,   // 14 min doc (ok)
    dispensaryStartTime: Date.now() - 12 * 60000,  // 6 min (ok)
    dispensaryEndTime: Date.now() - 6 * 60000,
    settlementTime: Date.now() - 2 * 60000         // 4 min (ok)
  },
  {
    visitId: 'v-102',
    patientName: 'Fatimah Binti Salleh',
    registeredTime: Date.now() - 50 * 60000,
    triageStartTime: Date.now() - 44 * 60000, // 6 min (ok)
    triageEndTime: Date.now() - 40 * 60000,
    consultationStartTime: Date.now() - 15 * 60000, // 25 min wait (breach)
    consultationEndTime: Date.now() - 5 * 60000,   // 10 min doc (ok)
    dispensaryStartTime: Date.now() - 2 * 60000,
    dispensaryEndTime: Date.now() - 1 * 60000,
    settlementTime: Date.now()
  },
  {
    visitId: 'v-103',
    patientName: 'Ramasamy A/L Subramaniam',
    registeredTime: Date.now() - 40 * 60000,
    triageStartTime: Date.now() - 31 * 60000, // 9 min (ok)
    triageEndTime: Date.now() - 27 * 60000,
    consultationStartTime: Date.now() - 10 * 60000, // 17 min wait (ok)
    consultationEndTime: Date.now() - 2 * 60000    // 8 min doc (ok)
  },
  {
    visitId: 'v-104',
    patientName: 'Ahmad Daniel',
    registeredTime: Date.now() - 25 * 60000,
    triageStartTime: Date.now() - 18 * 60000, // 7 min (ok)
    triageEndTime: Date.now() - 15 * 60000,
    consultationStartTime: Date.now() - 2 * 60000 // 13 min wait (ok)
  }
];

export default function ClinicThroughputModal({
  isOpen,
  onClose
}: ClinicThroughputModalProps) {
  if (!isOpen) return null;

  const analysis = analyzeClinicThroughput(MOCK_PATIENT_JOURNEYS, CLINIC_SLA_TARGETS);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-surface border border-line w-full max-w-4xl max-h-[90vh] flex flex-col rounded-none">
        
        {/* HEADER */}
        <div className="bg-surface-accent border-b border-line p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-teal-100 dark:bg-teal-900/60 text-accent border border-teal-300 rounded-none">
              <Timer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="type-section-title text-ink flex items-center gap-2">
                Clinic Turnaround Time (TAT) & Throughput Bottleneck Monitor
                <span className="text-2xs tabular-nums font-bold px-2 py-0.5 chip-neutral">Outpatient SLA</span>
              </h3>
              <p className="text-2xs text-subtle">
                Real-time door-to-doctor-to-dispensary tracking, bottleneck detection, and patient flow efficiency.
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="text-subtle hover:text-ink p-1 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* TOP SUMMARY STATS */}
        <div className="grid grid-cols-2 md:grid-cols-4 border-b border-line bg-surface">
          <div className="p-4 border-r border-line">
            <span className="text-2xs font-bold text-subtle uppercase block tabular-nums">Analyzed Encounters</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="type-metric text-ink">{analysis.totalVisitsAnalyzed}</span>
              <span className="text-2xs text-subtle tabular-nums">active today</span>
            </div>
          </div>

          <div className="p-4 border-r border-line">
            <span className="text-2xs font-bold text-subtle uppercase block tabular-nums">Avg Clinic Stay</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="type-metric text-ink">{analysis.averageTotalClinicStayMinutes || 56}m</span>
              <span className="text-2xs chip-ok">Target ≤ 60m</span>
            </div>
          </div>

          <div className="p-4 border-r border-line">
            <span className="text-2xs font-bold text-subtle uppercase block tabular-nums">SLA Compliance</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className={`type-metric ${analysis.overallSlaComplianceRatePercent >= 85 ? 'text-emerald-700' : 'text-amber-700'}`}>
                {analysis.overallSlaComplianceRatePercent}%
              </span>
              <span className="text-2xs text-subtle tabular-nums">target 90%</span>
            </div>
          </div>

          <div className="p-4 bg-surface-accent">
            <span className="text-2xs font-bold text-subtle uppercase block tabular-nums">Current Bottleneck</span>
            <div className="mt-1">
              {analysis.primaryBottleneckStage ? (
                <span className="text-xs font-bold text-rose-700 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> {analysis.primaryBottleneckStage}
                </span>
              ) : (
                <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> No Bottleneck Detected
                </span>
              )}
            </div>
          </div>
        </div>

        {/* BODY */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          
          <h4 className="type-label text-ink">Stage-by-Stage Outpatient Flow Analysis:</h4>

          <div className="space-y-3">
            {analysis.stageBreakdown.map((stage, idx) => {
              const isOverTarget = stage.averageMinutes > stage.targetMaxMinutes;
              return (
                <div 
                  key={stage.stage} 
                  className={`border p-4 rounded-none transition-all ${
                    stage.isBottleneck 
                      ? 'border-rose-300 bg-rose-50/40 dark:bg-rose-950/20' 
                      : 'border-line bg-surface'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-none bg-surface-strong text-accent flex items-center justify-center font-bold text-xs tabular-nums">
                        {idx + 1}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="text-sm font-bold text-ink">{stage.label}</h5>
                          {stage.isBottleneck && (
                            <span className="text-2xs font-bold px-2 py-0.5 bg-rose-600 text-white rounded-none animate-pulse">
                              BOTTLENECK DETECTED
                            </span>
                          )}
                        </div>
                        <span className="text-2xs text-subtle tabular-nums">
                          Target SLA: ≤ {stage.targetMaxMinutes} mins · Evaluated {stage.patientCount} patients
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className={`text-base tabular-nums font-bold ${
                        isOverTarget ? 'text-rose-700' : 'text-accent'
                      }`}>
                        Avg: {stage.averageMinutes} mins
                      </span>
                      <span className="block text-2xs tabular-nums text-subtle">
                        {stage.slaBreachCount} breach(es)
                      </span>
                    </div>
                  </div>

                  {/* Progress / SLA Bar */}
                  <div className="mt-3 w-full bg-slate-200 dark:bg-night-700 h-2 rounded-none overflow-hidden">
                    <div 
                      className={`h-full transition-all ${
                        stage.isBottleneck ? 'bg-rose-500' : isOverTarget ? 'bg-amber-500' : 'bg-primary'
                      }`}
                      style={{ width: `${Math.min(100, (stage.averageMinutes / (stage.targetMaxMinutes * 1.5)) * 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* OPERATIONAL RECOMMENDATION BANNER */}
          {analysis.primaryBottleneckStage && (
            <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-none text-xs text-amber-950 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-700" /> Operational Action Recommendation:
              </p>
              <p className="text-2xs leading-relaxed">
                Waiting room to doctor consultation is experiencing delays. Recommend dispatching Nurse Supervisor to open Consultation Room 2 for acute overflow triage and reviewing pending investigations.
              </p>
            </div>
          )}

        </div>

        {/* FOOTER */}
        <div className="p-4 border-t border-line bg-surface flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold bg-primary hover:bg-primary-hover text-white rounded-none cursor-pointer"
          >
            Close Monitor
          </button>
        </div>

      </div>
    </div>
  );
}
