import { useColorTheme } from '../../hooks/useColorTheme';
import type { PanelId } from './types';
import { BarChart3, PieChart as PieChartIcon } from 'lucide-react';
import { ResponsiveContainer, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, Area, PieChart, Pie, Cell } from 'recharts';
import { palette } from '../../theme/palette';
import { chartTheme } from '../../theme/chartTheme';
import LegendSwatch from '../ui/LegendSwatch';

interface FlowAndDiagnosisChartsProps {
  showPanel: (id: PanelId) => boolean;
  hasThroughput: boolean;
  throughputSummary: string;
  hourlyTrafficData: { hour: string; encounters: number; }[];
  icdSummary: string;
  icdBreakdownData: { color: string; name: string; count: number; }[];
  icdTotal: number;
}

export default function FlowAndDiagnosisCharts({ showPanel, hasThroughput, throughputSummary, hourlyTrafficData, icdSummary, icdBreakdownData, icdTotal }: FlowAndDiagnosisChartsProps) {
  useColorTheme(); // re-render when the colour theme changes so palette colours refresh
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      
      {/* Hourly Patient Flow Area Chart (8 Cols) */}
      {showPanel('throughput') && (
        <div className={`${showPanel('icd') ? 'lg:col-span-8' : 'lg:col-span-12'} bg-surface-muted border border-line-subtle rounded-none p-6 shadow-xs`}>
          <div className="flex items-center justify-between pb-4 border-b border-line-subtle mb-5">
            <div>
              <h3 className="type-card-title text-ink flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-accent" />
                Hourly Outpatient Throughput Trend
              </h3>
              <p className="text-xs text-muted mt-0.5">Patients registered per hour today.</p>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-2xs bg-surface-accent text-accent font-mono px-2.5 py-1 rounded-none border border-line font-bold tracking-wider uppercase flex items-center justify-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-none bg-emerald-500 animate-pulse"></span>
                Live
              </span>
            </div>
          </div>
    
          {!hasThroughput ? (
            <p className="h-64 flex items-center justify-center text-sm text-muted">No registrations recorded yet today.</p>
          ) : (
          <div className="h-64 w-full" role="img" aria-label={throughputSummary}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyTrafficData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorEncounters" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={palette.brand} stopOpacity={0.4}/>
                    <stop offset="95%" stopColor={palette.brand} stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartTheme.grid} />
                <XAxis dataKey="hour" tick={chartTheme.tick} />
                <YAxis tick={chartTheme.tick} allowDecimals={false} />
                <Tooltip 
                  contentStyle={chartTheme.tooltip}
                  itemStyle={chartTheme.tooltipItem}
                />
                <Area type="monotone" dataKey="encounters" name="Patients registered" stroke={palette.brand} strokeWidth={3} fillOpacity={1} fill="url(#colorEncounters)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          )}
          {hasThroughput && (
            <table className="sr-only">
              <caption>Patients registered per hour today</caption>
              <thead><tr><th scope="col">Hour</th><th scope="col">Patients</th></tr></thead>
              <tbody>
                {hourlyTrafficData.map((d) => (<tr key={d.hour}><th scope="row">{d.hour}</th><td>{d.encounters}</td></tr>))}
              </tbody>
            </table>
          )}
        </div>
      )}
    
      {/* ICD-10 Diagnosis Breakdown Pie Chart (4 Cols) */}
      {showPanel('icd') && (
        <div className={`${showPanel('throughput') ? 'lg:col-span-4' : 'lg:col-span-12'} bg-surface-muted border border-line-subtle rounded-none p-6 shadow-xs flex flex-col justify-between`}>
          <div>
            <div className="pb-4 border-b border-line-subtle mb-5">
              <h3 className="type-card-title text-ink flex items-center gap-2">
                <PieChartIcon className="w-5 h-5 text-accent" />
                ICD-10 Diagnosis Distribution
              </h3>
              <p className="text-xs text-muted mt-0.5">Top diagnoses from completed consultations today.</p>
            </div>
    
            <div className="h-48 w-full relative flex items-center justify-center mb-4" role="img" aria-label={icdSummary}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={icdBreakdownData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="count"
                    stroke="none"
                  >
                    {icdBreakdownData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={chartTheme.tooltip}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-2">
                <span className="type-metric font-mono text-ink">{icdTotal}</span>
                <span className="text-2xs uppercase font-bold text-muted tracking-wider">Cases</span>
              </div>
            </div>
          </div>
    
          {icdBreakdownData.length === 0 && <p className="text-xs text-muted">No diagnoses recorded yet.</p>}
          {/* Mini Legend */}
          <div className="space-y-2 mt-auto border-t border-line-subtle pt-4 text-xs">
            {icdBreakdownData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-muted">
                <span className="flex items-center gap-2 truncate max-w-[180px]">
                  <LegendSwatch color={item.color} />
                  <span className="truncate font-semibold">{item.name}</span>
                </span>
                <span className="font-mono font-bold text-ink">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    
    </div>
  );
}
