import { TrendingUp, CreditCard } from 'lucide-react';
import { ResponsiveContainer, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, Area, PieChart, Pie, Cell } from 'recharts';
import { palette } from '../../theme/palette';
import { chartTheme } from '../../theme/chartTheme';
import LegendSwatch from '../ui/LegendSwatch';

interface ReportChartsProps {
  sampleDailyRevenueData: { date: string; patients: number; fees: number; }[];
  samplePaymentMix: ({ name: string; value: number; color: '#0d9488'; } | { name: string; value: number; color: '#0f766e'; } | { name: string; value: number; color: '#14b8a6'; } | { name: string; value: number; color: '#d97706'; })[];
}

export default function ReportCharts({ sampleDailyRevenueData, samplePaymentMix }: ReportChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Area Chart: Daily Velocity */}
      <div className="lg:col-span-2 bg-surface dark:bg-night-900 border border-line-subtle dark:border-teal-800/40 p-5 rounded-none space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="type-card-title text-ink dark:text-teal-300 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-accent" />
              Daily Encounter Velocity &amp; Revenue Growth
            </h3>
            <p className="text-2xs text-slate-600 dark:text-slate-400 font-medium">
              Patient volume vs gross financial yield throughout September 2026.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs font-bold font-mono">
            <span className="flex items-center gap-1.5 text-accent dark:text-teal-300">
              <span className="w-3 h-3 bg-primary inline-block rounded-none"></span> Revenue (RM)
            </span>
          </div>
        </div>
    
        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sampleDailyRevenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorFees" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={palette.brand} stopOpacity={0.4}/>
                  <stop offset="95%" stopColor={palette.brand} stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} opacity={0.6} />
              <XAxis dataKey="date" tick={chartTheme.tick} axisLine={{ stroke: palette.line }} />
              <YAxis tick={chartTheme.tick} axisLine={{ stroke: palette.line }} />
              <Tooltip
                contentStyle={chartTheme.tooltip}
                formatter={(value: any) => [`RM ${value}`, 'Revenue']}
              />
              <Area type="monotone" dataKey="fees" stroke={palette.brand} strokeWidth={2.5} fillOpacity={1} fill="url(#colorFees)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    
      {/* Pie Chart: Payment Route Distribution */}
      <div className="bg-surface dark:bg-night-900 border border-line-subtle dark:border-teal-800/40 p-5 rounded-none space-y-4 flex flex-col justify-between shadow-xs">
        <div>
          <h3 className="type-card-title text-ink dark:text-teal-300 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-accent" />
            Corporate Panel &amp; Payment Mix
          </h3>
          <p className="text-2xs text-slate-600 dark:text-slate-400 font-medium">
            Distribution of patient settlement routes.
          </p>
        </div>
    
        <div className="h-44 w-full flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={samplePaymentMix}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={65}
                paddingAngle={4}
                dataKey="value"
              >
                {samplePaymentMix.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={chartTheme.tooltip} />
            </PieChart>
          </ResponsiveContainer>
        </div>
    
        <div className="space-y-1.5 pt-2 border-t border-line-subtle dark:border-teal-800/40">
          {samplePaymentMix.map((item) => (
            <div key={item.name} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <LegendSwatch color={item.color} size="sm" />
                <span className="text-slate-700 dark:text-slate-300 font-bold">{item.name}</span>
              </div>
              <span className="font-mono font-bold text-ink dark:text-teal-300">{item.value}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
