import { useColorTheme } from '../hooks/useColorTheme';
import React, { useEffect, useMemo, useState } from 'react';
import { useIsFetching, useQueryClient } from '@tanstack/react-query';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AlertTriangle, BarChart3, FileText, Info, Package, RefreshCw, Stethoscope, TrendingUp, Users, Wallet } from 'lucide-react';
import ProgressBar from './ui/ProgressBar';
import EquipmentBookValueCard from './equipment/EquipmentBookValueCard';
import ExportButtons from './reports/ExportButtons';
import { chartTheme } from '../theme/chartTheme';
import { palette, seriesColors } from '../theme/palette';
import { useAdminReports } from '../hooks/useReports';
import { useDrugs } from '../hooks/useInventoryData';
import { useFinancials } from '../context/FinancialContext';
import { daysBetween } from '../domain/equipment';
import { summarizeRevenue, formatRM } from '../domain/revenue';
import { localDateKey } from '../domain/operations';
import {
  averageDaysToPay, claimsAgeing, fastMovers, groupVolume, revenueByCategory, revenueByMonth, stockValue,
} from '../domain/reports';
import {
  categoryTable, claimsTable, diagnosesTable, ledgerTable, periodLabel, prescribingTable, revenueTable, stockTable, volumeTable,
} from '../domain/reportTables';

type Tab = 'overview' | 'clinical' | 'financial' | 'stock';

const TABS: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'clinical', label: 'Clinical' },
  { id: 'financial', label: 'Financial & claims' },
  { id: 'stock', label: 'Stock & assets' },
];

const PERIODS = [
  { id: '30', label: 'Last 30 days' },
  { id: '90', label: 'Last 90 days' },
  { id: '365', label: 'Last 12 months' },
  { id: 'ytd', label: 'Year to date' },
] as const;

const DAY_MS = 86_400_000;

const monthShort = (key: string) => new Date(Number(key.slice(0, 4)), Number(key.slice(5, 7)) - 1, 1).toLocaleDateString('en-MY', { month: 'short', year: '2-digit' });
const dayShort = (key: string) => new Date(`${key}T00:00:00`).toLocaleDateString('en-MY', { day: 'numeric', month: 'short' });

export default function ReportsAnalyticsModule() {
  useColorTheme(); // re-render when the colour theme changes so palette colours refresh
  const queryClient = useQueryClient();
  const isFetching = useIsFetching({ predicate: (q) => q.queryKey[0] === 'reports' }) > 0;
  const [tab, setTab] = useState<Tab>('overview');
  const [period, setPeriod] = useState<(typeof PERIODS)[number]['id']>('90');

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 3_600_000);
    return () => clearInterval(id);
  }, []);
  const today = localDateKey(new Date(now));
  const from = period === 'ytd' ? `${today.slice(0, 4)}-01-01` : localDateKey(new Date(now - Number(period) * DAY_MS));
  const periodText = periodLabel(from, today);

  const r = useAdminReports(from, today);
  const drugs = useDrugs();
  const { transactions } = useFinancials();

  const periodTransactions = useMemo(
    () => transactions.filter((t) => { const d = localDateKey(new Date(t.date)); return d >= from && d <= today; }),
    [transactions, from, today],
  );
  const months = useMemo(() => revenueByMonth(r.paidVisits, from, today), [r.paidVisits, from, today]);
  const revenue = useMemo(() => summarizeRevenue(r.paidVisits), [r.paidVisits]);
  const category = useMemo(() => revenueByCategory(periodTransactions), [periodTransactions]);
  const ageing = useMemo(() => claimsAgeing(transactions, today), [transactions, today]);
  const daysToPay = useMemo(() => averageDaysToPay(transactions), [transactions]);
  const movers = useMemo(() => fastMovers(r.prescribing, drugs.data ?? [], today), [r.prescribing, drugs.data, today]);
  const stock = useMemo(() => stockValue(drugs.data ?? []), [drugs.data]);

  const volumeBy = daysBetween(from, today) > 45 ? 'week' : 'day';
  const volume = useMemo(() => groupVolume(r.volume, volumeBy), [r.volume, volumeBy]);
  const visitTotals = useMemo(() => r.volume.reduce((a, d) => ({ total: a.total + d.total, completed: a.completed + d.completed }), { total: 0, completed: 0 }), [r.volume]);
  const diagnosisVisits = r.diagnoses.reduce((s, d) => s + d.visits, 0);
  const topMethodAmount = Math.max(1, ...revenue.byMethod.map((m) => m.amount));
  const topAgeing = Math.max(1, ...ageing.buckets.map((b) => b.amount));

  return (
    <div className="animate-fadeIn w-full space-y-6 pb-8">
      <div className="bg-surface text-ink p-5 rounded-none shadow-2xs border border-line flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="type-page-title text-ink flex items-center gap-2.5">
            <BarChart3 className="w-6 h-6 text-accent" aria-hidden="true" />
            Analytics Reports
          </h1>
          <p className="text-xs text-muted font-medium max-w-2xl leading-relaxed">
            Revenue, visits, diagnoses, prescribing, panel claims and stock for {periodText}, read from the clinic's records. Every table can be downloaded as CSV or PDF.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="report-period" className="sr-only">Period</label>
          <select id="report-period" value={period} onChange={(e) => setPeriod(e.target.value as typeof period)} className="text-xs font-bold border border-line bg-white px-2 py-2 rounded-none cursor-pointer">
            {PERIODS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
          <button
            type="button"
            onClick={() => { setNow(Date.now()); void queryClient.invalidateQueries({ queryKey: ['reports'] }); void queryClient.invalidateQueries({ queryKey: ['inventory'] }); }}
            disabled={isFetching}
            className="bg-white hover:bg-teal-50 text-deep text-xs font-bold px-3 py-2 rounded-none flex items-center justify-center gap-1.5 border border-line transition-all cursor-pointer shadow-2xs disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-accent ${isFetching ? 'motion-safe:animate-spin' : ''}`} aria-hidden="true" />
            {isFetching ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      {r.hasError && (
        <div role="alert" className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
          <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
          Some figures could not be loaded and may be incomplete. Use Refresh to try again.
        </div>
      )}
      {r.capped && (
        <div role="status" className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium">
          <Info className="w-4 h-4 shrink-0" aria-hidden="true" />
          This period has more paid visits than can be summed here, so revenue is understated. Choose a shorter period.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi icon={Wallet} label="Revenue" value={r.isPending ? '…' : formatRM(revenue.total)} note={`${revenue.visits} paid visit${revenue.visits === 1 ? '' : 's'}${revenue.visits ? ` · avg ${formatRM(revenue.average)}` : ''}`} />
        <Kpi icon={Users} label="Visits" value={r.isPending ? '…' : String(visitTotals.total)} note={`${visitTotals.completed} completed`} />
        <Kpi icon={FileText} label="Panel claims outstanding" value={formatRM(ageing.amount)} note={ageing.count ? `${ageing.count} claim${ageing.count === 1 ? '' : 's'} · oldest ${ageing.oldestDays} days` : 'None waiting'} tone={ageing.buckets[3].count > 0 ? 'warn' : 'ok'} />
        <Kpi icon={Package} label="Stock value at cost" value={drugs.isPending ? '…' : formatRM(stock.value)} note={stock.batchesMissingCost ? `${stock.batchesMissingCost} batch${stock.batchesMissingCost === 1 ? '' : 'es'} have no cost recorded` : 'All batches costed'} tone={stock.batchesMissingCost ? 'warn' : 'ok'} />
      </div>

      <div role="tablist" aria-label="Report sections" className="flex items-stretch gap-0 bg-surface-strong border-b border-line text-xs font-bold h-10 overflow-x-auto custom-scrollbar">
        {TABS.map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}
            className={`px-4 h-full border-0 rounded-none transition-all cursor-pointer whitespace-nowrap ${tab === t.id ? 'bg-chrome text-white font-bold' : 'bg-transparent text-ink hover:bg-surface-strong font-bold'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Panel className="lg:col-span-2" icon={TrendingUp} title="Revenue by month" action={<ExportButtons table={revenueTable(months, periodText)} />}>
            {revenue.visits === 0 ? <Empty>No paid visits in this period.</Empty> : (
              <div className="h-72 w-full" role="img" aria-label={`Revenue by month: ${months.map((m) => `${monthShort(m.month)} ${formatRM(m.total)}`).join(', ')}`}>
                <ResponsiveContainer>
                  <BarChart data={months.map((m) => ({ ...m, label: monthShort(m.month) }))} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartTheme.grid} />
                    <XAxis dataKey="label" tick={chartTheme.tick} tickLine={false} />
                    <YAxis tick={chartTheme.tick} tickLine={false} tickFormatter={(v) => `RM${v}`} />
                    <Tooltip contentStyle={chartTheme.tooltip} cursor={chartTheme.cursor} formatter={(v: number) => formatRM(v)} />
                    <Legend iconType="square" wrapperStyle={chartTheme.legend} />
                    <Bar dataKey="patientPaid" stackId="rev" name="Paid by patients" fill={palette.brand} />
                    <Bar dataKey="panelClaimed" stackId="rev" name="Claimed from panels" fill={seriesColors.sky} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Panel>

          <Panel icon={Wallet} title="Payment methods">
            {revenue.byMethod.length === 0 ? <Empty>No paid visits in this period.</Empty> : (
              <div className="space-y-4">
                {revenue.byMethod.map((m) => (
                  <div key={m.method} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-bold text-ink">{m.method} <span className="font-normal text-subtle">({m.count})</span></span>
                      <span className="font-mono text-muted">{formatRM(m.amount)}</span>
                    </div>
                    <ProgressBar value={(m.amount / topMethodAmount) * 100} size="sm" label={`${m.method}: ${formatRM(m.amount)}`} />
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>
      )}

      {tab === 'clinical' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Panel icon={Users} title={`Visit volume, ${volumeBy === 'week' ? 'by week' : 'by day'}`} action={<ExportButtons table={volumeTable(volume, periodText, volumeBy)} />}>
            {visitTotals.total === 0 ? <Empty>No visits in this period.</Empty> : (
              <div className="h-64 w-full" role="img" aria-label={`Visits ${volumeBy === 'week' ? 'per week' : 'per day'}: ${visitTotals.total} in total`}>
                <ResponsiveContainer>
                  <BarChart data={volume.map((d) => ({ ...d, label: dayShort(d.day) }))} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartTheme.grid} />
                    <XAxis dataKey="label" tick={chartTheme.tick} tickLine={false} minTickGap={16} />
                    <YAxis tick={chartTheme.tick} tickLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={chartTheme.tooltip} cursor={chartTheme.cursor} />
                    <Bar dataKey="completed" stackId="v" name="Completed" fill={palette.brand} />
                    <Bar dataKey="inProgress" stackId="v" name="In progress" fill={seriesColors.amber} />
                    <Bar dataKey="cancelled" stackId="v" name="Cancelled" fill={seriesColors.red} />
                    <Legend iconType="square" wrapperStyle={chartTheme.legend} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Panel>

          <Panel icon={Stethoscope} title="Top diagnoses" action={<ExportButtons table={diagnosesTable(r.diagnoses, periodText)} />}>
            {r.diagnoses.length === 0 ? <Empty>No coded diagnoses in this period. A diagnosis code is chosen when a doctor signs off a consultation.</Empty> : (
              <table className="w-full text-left text-xs">
                <thead className="text-ink uppercase border-b border-line font-bold">
                  <tr><th scope="col" className="py-2 pr-3">Code</th><th scope="col" className="py-2 pr-3">Diagnosis</th><th scope="col" className="py-2 text-right">Visits</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {r.diagnoses.map((d) => (
                    <tr key={d.icdCode}>
                      <th scope="row" className="py-2 pr-3 font-mono font-bold text-ink">{d.icdCode}</th>
                      <td className="py-2 pr-3">{d.diagnosis ?? '—'}</td>
                      <td className="py-2 text-right font-mono">{d.visits}<span className="text-slate-400"> · {Math.round((d.visits / diagnosisVisits) * 100)}%</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Panel>

          <NotRecorded className="lg:col-span-2" title="Waiting and consultation times">
            The app records when a patient registers, but not when a consultation starts or ends, so waiting time by hour and consultation length can't be reported yet.
            Current waits are shown on the Operations page.
          </NotRecorded>
        </div>
      )}

      {tab === 'financial' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Panel icon={Wallet} title="Revenue by category" action={<ExportButtons table={categoryTable(category, periodText)} />}>
            {category.itemised === 0 ? (
              <Empty>No payments in this period carry an itemised bill yet. Bills are stored with each payment taken from now on, so this fills in as payments are recorded.</Empty>
            ) : (
              <>
                <table className="w-full text-xs">
                  <tbody className="divide-y divide-slate-100">
                    {category.categories.map((c) => (
                      <tr key={c.kind}><th scope="row" className="py-2 pr-3 text-left font-semibold text-ink">{c.label}</th><td className="py-2 text-right font-mono">{formatRM(c.amount)}</td></tr>
                    ))}
                    <tr><th scope="row" className="py-2 pr-3 text-left text-muted">Discounts</th><td className="py-2 text-right font-mono text-rose-700">-{formatRM(category.discounts)}</td></tr>
                    <tr><th scope="row" className="py-2 pr-3 text-left text-muted">SST</th><td className="py-2 text-right font-mono">{formatRM(category.tax)}</td></tr>
                    <tr className="font-bold"><th scope="row" className="py-2 pr-3 text-left text-ink">Total billed</th><td className="py-2 text-right font-mono">{formatRM(category.total)}</td></tr>
                  </tbody>
                </table>
                <p className="mt-3 text-2xs text-subtle">From {category.itemised} of {category.payments} payments in this period; the rest were taken before bills were stored.</p>
              </>
            )}
          </Panel>

          <Panel icon={FileText} title="Panel claims awaiting payment" action={<ExportButtons table={claimsTable(transactions, today)} />}>
            {ageing.count === 0 ? <Empty>No panel claims are waiting for payment.</Empty> : (
              <div className="space-y-4">
                {ageing.buckets.map((b, i) => (
                  <div key={b.label} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-bold text-ink">{b.label} <span className="font-normal text-subtle">({b.count})</span></span>
                      <span className="font-mono text-ink">{formatRM(b.amount)}</span>
                    </div>
                    <ProgressBar value={(b.amount / topAgeing) * 100} size="sm" tone={i === 3 ? 'danger' : i === 2 ? 'warning' : 'primary'} label={`${b.label}: ${formatRM(b.amount)}`} />
                  </div>
                ))}
              </div>
            )}
            <p className="mt-3 text-xs text-muted">
              {daysToPay.days === null ? 'Average days to payment: not enough paid claims with a recorded date yet.' : `Average days from payment to panel remittance: ${daysToPay.days} (over ${daysToPay.claims} claim${daysToPay.claims === 1 ? '' : 's'}).`}
            </p>
          </Panel>

          <Panel icon={FileText} title="Payments ledger" action={<ExportButtons table={ledgerTable(periodTransactions, periodText)} />}>
            <p className="text-xs text-muted">{periodTransactions.length} payment{periodTransactions.length === 1 ? '' : 's'} in this period, ready to download with receipt numbers, references and panel details.</p>
          </Panel>

          <NotRecorded title="Operating expenses and profit">
            The app does not have an expense ledger, so costs and profit can't be reported. Revenue above is what was billed and paid, not profit.
          </NotRecorded>
        </div>
      )}

      {tab === 'stock' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Panel icon={Package} title="Most prescribed drugs" action={<ExportButtons table={prescribingTable(movers, periodText)} />}>
            {movers.length === 0 ? <Empty>No prescriptions in this period.</Empty> : (
              <table className="w-full text-left text-xs">
                <thead className="text-ink uppercase border-b border-line font-bold">
                  <tr><th scope="col" className="py-2 pr-3">Drug</th><th scope="col" className="py-2 pr-3 text-right">Prescribed</th><th scope="col" className="py-2 pr-3 text-right">Quantity</th><th scope="col" className="py-2 text-right">In stock</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {movers.map((m) => (
                    <tr key={m.drugName}>
                      <th scope="row" className="py-2 pr-3 font-semibold text-ink">{m.drugName}{m.isControlled && <span className="ml-1.5 text-2xs font-bold text-teal-800 border border-teal-300 px-1">Controlled</span>}</th>
                      <td className="py-2 pr-3 text-right font-mono">{m.prescriptions}</td>
                      <td className="py-2 pr-3 text-right font-mono">{m.totalQuantity}</td>
                      <td className={`py-2 text-right font-mono ${m.onHand === 0 ? 'text-rose-700 font-bold' : ''}`}>{m.onHand ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Panel>

          <Panel icon={Package} title="Stock on hand" action={<ExportButtons table={stockTable(drugs.data ?? [], today)} />}>
            <p className="text-xs text-muted leading-relaxed">
              In-date stock for {(drugs.data ?? []).filter((d) => d.status === 'active').length} active drugs, valued at {formatRM(stock.value)} using the cost recorded on each batch.
              {stock.batchesMissingCost > 0 && ` ${stock.batchesMissingCost} batch${stock.batchesMissingCost === 1 ? ' has' : 'es have'} no cost recorded and ${stock.batchesMissingCost === 1 ? 'is' : 'are'} not in that value; add costs when receiving stock for a complete figure.`}
            </p>
          </Panel>

          <EquipmentBookValueCard />
        </div>
      )}
    </div>
  );
}

function Kpi({ icon: Icon, label, value, note, tone = 'ok' }: { icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' }>; label: string; value: string; note: string; tone?: 'ok' | 'warn' }) {
  return (
    <div className="bg-surface rounded-none border border-line p-4 shadow-2xs">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-subtle uppercase tracking-wider">{label}</span>
        <div className="p-2 bg-teal-50 rounded-none text-accent"><Icon className="w-5 h-5" aria-hidden="true" /></div>
      </div>
      <h3 className={`type-metric mt-2 ${tone === 'warn' ? 'text-amber-700' : 'text-ink'}`}>{value}</h3>
      <p className="mt-2 text-xs text-muted">{note}</p>
    </div>
  );
}

function Panel({ icon: Icon, title, action, className = '', children }: { icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' }>; title: string; action?: React.ReactNode; className?: string; children: React.ReactNode }) {
  return (
    <section className={`bg-surface rounded-none border border-line shadow-2xs overflow-hidden ${className}`}>
      <div className="border-b border-teal-100 bg-surface p-4 flex items-center justify-between gap-3">
        <h2 className="type-card-title text-ink flex items-center gap-2"><Icon className="w-4 h-4 text-accent" aria-hidden="true" />{title}</h2>
        {action}
      </div>
      <div className="p-5 overflow-x-auto">{children}</div>
    </section>
  );
}

const Empty = ({ children }: { children: React.ReactNode }) => <p className="text-xs text-muted">{children}</p>;

function NotRecorded({ title, className = '', children }: { title: string; className?: string; children: React.ReactNode }) {
  return (
    <section className={`border border-dashed border-line bg-surface p-5 ${className}`}>
      <h2 className="type-card-title text-ink flex items-center gap-2"><Info className="w-4 h-4 text-slate-400" aria-hidden="true" />{title}: not recorded yet</h2>
      <p className="mt-1.5 text-xs text-muted leading-relaxed">{children}</p>
    </section>
  );
}
