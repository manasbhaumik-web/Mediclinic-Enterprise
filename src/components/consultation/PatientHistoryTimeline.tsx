import React from 'react';
import { History, Activity, Calendar } from 'lucide-react';
import { Visit } from '../../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

import { chartTheme } from '../../theme/chartTheme';
import { seriesColors } from '../../theme/palette';
interface PatientHistoryTimelineProps {
  patientPastVisits: Visit[];
}

export default function PatientHistoryTimeline({ patientPastVisits }: PatientHistoryTimelineProps) {
  
  // Transform past visits into chart data (oldest to newest)
  const chartData = [...patientPastVisits].reverse().map(visit => ({
    date: new Date(visit.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
    sys: visit.soap.objective.bpSystolic,
    dia: visit.soap.objective.bpDiastolic,
    hr: visit.soap.objective.heartRate,
    temp: visit.soap.objective.temperature
  }));

  return (
    <div className="md:col-span-1 bg-surface dark:bg-night-900 border-r border-line dark:border-teal-800/40 p-4 h-full overflow-y-auto flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="type-label text-ink dark:text-teal-300 flex items-center justify-center gap-1.5">
          <History className="w-4 h-4 text-accent dark:text-teal-400" />
          Longitudinal Medical Timeline
        </h3>
        <span className="text-2xs bg-white dark:bg-night-800 text-accent dark:text-teal-300 border border-line dark:border-teal-800/40 px-2 py-0.5 rounded-none font-bold">
          {patientPastVisits.length} Records
        </span>
      </div>

      {/* Vitals Trend Chart */}
      {chartData.length > 0 && (
        <div className="bg-white dark:bg-night-800 p-3 rounded-none border border-line dark:border-teal-800/50 shadow-xs">
          <h4 className="type-label text-ink dark:text-teal-300 mb-2 text-center flex items-center justify-center gap-1">
            <Activity className="w-3.5 h-3.5 text-accent dark:text-teal-400" /> Vitals Trend (BP &amp; Pulse)
          </h4>
          <div className="h-40 w-full text-2xs">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartTheme.grid} strokeOpacity={0.2} />
                <XAxis dataKey="date" tick={chartTheme.tickSmall} tickLine={false} axisLine={false} />
                <YAxis yAxisId="left" tick={chartTheme.tickSmall} tickLine={false} axisLine={false} domain={['dataMin - 10', 'dataMax + 10']} />
                <Tooltip 
                  contentStyle={chartTheme.tooltip}
                  itemStyle={chartTheme.tooltipItem}
                />
                <Legend iconType="circle" wrapperStyle={chartTheme.legend} />
                <Line yAxisId="left" type="monotone" dataKey="sys" name="Systolic" stroke={seriesColors.redLight} strokeWidth={2} dot={chartTheme.dot} activeDot={chartTheme.activeDot} />
                <Line yAxisId="left" type="monotone" dataKey="dia" name="Diastolic" stroke={seriesColors.orangeLight} strokeWidth={2} dot={chartTheme.dot} activeDot={chartTheme.activeDot} />
                <Line yAxisId="left" type="monotone" dataKey="hr" name="HR" stroke={seriesColors.teal} strokeWidth={2} dot={chartTheme.dot} activeDot={chartTheme.activeDot} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Timeline List */}
      <div className="relative border-l-2 border-line dark:border-teal-800/40 ml-2.5 space-y-4">
        {patientPastVisits.length === 0 ? (
          <div className="bg-white dark:bg-night-800 p-4 rounded-none border border-line dark:border-teal-800/50 text-center ml-4">
            <Calendar className="w-6 h-6 text-accent dark:text-teal-400 mx-auto mb-1 opacity-60" />
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">No past visit history found.</p>
            <span className="text-2xs text-slate-400 dark:text-slate-500">First-time outpatient consultation</span>
          </div>
        ) : (
          patientPastVisits.map((visit, idx) => (
            <div key={idx} className="relative pl-4 group">
              <div className="absolute w-2.5 h-2.5 bg-primary dark:bg-teal-400 rounded-full -left-[5.5px] top-1.5 animate-pulse" />
              <div className="bg-white dark:bg-night-800 p-3 rounded-none border border-line dark:border-teal-800/50 shadow-2xs group-hover:border-brand transition-all">
                
                <div className="flex justify-between items-start mb-1.5">
                  <span className="text-2xs font-bold text-accent dark:text-teal-300 bg-surface-accent dark:bg-night-850 px-2 py-0.5 rounded-none border border-line dark:border-teal-800/40">
                    {new Date(visit.date).toLocaleDateString('ms-MY', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                
                <h4 className="type-label text-ink dark:text-slate-50 mt-1">
                  <span className="text-accent dark:text-teal-400 font-mono">{visit.soap.assessment.icdCode}</span> - {visit.soap.assessment.description}
                </h4>
                
                <div className="mt-2 space-y-1">
                  <div className="flex gap-1.5 items-start">
                    <span className="text-2xs font-bold text-slate-400 w-3 shrink-0">S:</span>
                    <p className="text-2xs text-slate-600 dark:text-slate-300 leading-tight line-clamp-2" title={visit.soap.subjective}>{visit.soap.subjective}</p>
                  </div>
                  <div className="flex gap-1.5 items-start">
                    <span className="text-2xs font-bold text-slate-400 w-3 shrink-0">O:</span>
                    <p className="text-2xs text-slate-600 dark:text-slate-300 leading-tight font-mono">
                      BP:{visit.soap.objective.bpSystolic}/{visit.soap.objective.bpDiastolic} HR:{visit.soap.objective.heartRate} T:{visit.soap.objective.temperature}
                    </p>
                  </div>
                  <div className="flex gap-1.5 items-start">
                    <span className="text-2xs font-bold text-slate-400 w-3 shrink-0">P:</span>
                    <p className="text-2xs text-slate-600 dark:text-slate-300 leading-tight line-clamp-2 font-medium">
                      {visit.soap.plan.prescription.map(m=>m.drugName).join(', ')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
