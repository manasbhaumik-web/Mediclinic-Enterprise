import React from 'react';
import { Visit, VitalSigns } from '../../../types';
import { extractChronicFlowsheet } from '../../../domain/chronicFlowsheet';
import { Heart, Activity, AlertCircle, CheckCircle2, Calendar, TrendingDown, Sparkles } from 'lucide-react';

interface ChronicDiseaseFlowsheetProps {
  pastVisits: Visit[];
  currentVitals?: Partial<VitalSigns>;
}

export default function ChronicDiseaseFlowsheet({ pastVisits, currentVitals }: ChronicDiseaseFlowsheetProps) {
  const data = extractChronicFlowsheet(pastVisits, currentVitals);

  return (
    <div className="space-y-3 font-sans text-xs animate-fadeIn">
      {/* Conditions Banner */}
      <div className="p-2.5 bg-surface-muted border border-line rounded-none flex items-center justify-between">
        <div className="flex items-center gap-1.5 font-bold text-ink">
          <Heart className="w-3.5 h-3.5 text-rose-500" />
          <span>Cardiometabolic Flowsheet</span>
        </div>
        <div className="flex flex-wrap gap-1">
          {data.conditionsIdentified.length > 0 ? (
            data.conditionsIdentified.map(c => (
              <span key={c} className="px-1.5 py-0.2 bg-surface text-accent border border-line font-mono text-2xs font-bold">
                {c}
              </span>
            ))
          ) : (
            <span className="text-2xs text-muted font-mono">Routine Outpatient Tracking</span>
          )}
        </div>
      </div>

      {/* 1. Blood Pressure Trend Tracker */}
      <div className="border border-line bg-surface p-2.5 space-y-2">
        <div className="flex items-center justify-between border-b border-line pb-1.5">
          <span className="type-heading-caps text-ink flex items-center gap-1">
            <Activity className="w-3.5 h-3.5 text-accent" />
            BP Trend History
          </span>
          <span className="text-2xs font-mono text-muted">Target: &lt; 130/80 mmHg</span>
        </div>

        {data.bpHistory.length === 0 ? (
          <p className="text-2xs text-muted py-2 text-center">No blood pressure readings recorded.</p>
        ) : (
          <div className="space-y-1.5">
            {data.bpHistory.map((bp, idx) => {
              const isNormal = bp.status === 'Normal';
              const isElevated = bp.status === 'Elevated';
              const isStage1 = bp.status === 'Stage 1 HTN';
              return (
                <div key={idx} className="flex items-center justify-between p-1.5 bg-surface-muted/30 border border-line/60 font-mono text-2xs">
                  <span className="font-bold text-ink">{bp.date}</span>
                  <span className="text-ink font-bold">
                    {bp.systolic}/{bp.diastolic} <span className="text-muted font-normal">mmHg</span>
                  </span>
                  <span className={`px-1.5 py-0.2 font-bold ${
                    isNormal 
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' 
                      : isElevated 
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' 
                        : isStage1 
                          ? 'bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300' 
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                  }`}>
                    {bp.status}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. Glycemic & Lipid Biomarkers */}
      {(data.glycemicHistory.length > 0 || data.lipidHistory.length > 0) && (
        <div className="border border-line bg-surface p-2.5 space-y-2">
          <span className="type-heading-caps text-ink block border-b border-line pb-1">
            Laboratory Biomarkers
          </span>
          <div className="space-y-1 font-mono text-2xs">
            {data.glycemicHistory.map((g, idx) => (
              <div key={idx} className="flex justify-between py-0.5 border-b border-line/40">
                <span className="text-muted">{g.date}:</span>
                <span className="font-bold text-ink">
                  {g.hba1c ? `HbA1c ${g.hba1c}%` : ''} {g.fbg ? `· FBG ${g.fbg} mmol/L` : ''}
                </span>
              </div>
            ))}
            {data.lipidHistory.map((l, idx) => (
              <div key={idx} className="flex justify-between py-0.5 border-b border-line/40">
                <span className="text-muted">{l.date}:</span>
                <span className="font-bold text-ink">
                  {l.ldl ? `LDL ${l.ldl} mmol/L` : ''} {l.totalChol ? `· Total Chol ${l.totalChol}` : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Annual Chronic Screening Milestones */}
      <div className="border border-line bg-surface p-2.5 space-y-2">
        <div className="flex items-center justify-between border-b border-line pb-1.5">
          <span className="type-heading-caps text-ink flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-accent" />
            Annual CPG Milestones
          </span>
          <span className="text-2xs font-mono text-muted">12-Mo Cycle</span>
        </div>

        <div className="space-y-1.5">
          {data.milestones.map(m => (
            <div key={m.id} className="p-1.5 bg-surface-muted/30 border border-line/60 flex items-start justify-between gap-1 text-2xs">
              <div>
                <div className="font-bold text-ink">{m.name}</div>
                <div className="text-muted mt-0.5">
                  Last: {m.lastCompletedDate || 'Not recorded in system'}
                </div>
              </div>
              <span className={`px-1.5 py-0.2 font-mono font-bold shrink-0 ${
                m.isOverdue
                  ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200'
                  : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200'
              }`}>
                {m.isOverdue ? 'Overdue' : 'Current'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
