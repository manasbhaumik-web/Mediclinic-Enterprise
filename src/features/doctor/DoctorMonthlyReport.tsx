import { useColorTheme } from '../../hooks/useColorTheme';
import React, { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AlertTriangle, FileText, Info, RefreshCw, Search, Stethoscope, Users, Wallet } from 'lucide-react';
import ProgressBar from '../../components/ui/ProgressBar';
import ExportButtons from '../reports/ExportButtons';
import { chartTheme } from '../../theme/chartTheme';
import { palette } from '../../theme/palette';
import { useAuth } from '../../context/AuthContext';
import { useDoctorMonth } from '../../hooks/useReports';
import { formatRM } from '../../domain/revenue';
import { monthLabel, recentMonthKeys, summarizeDoctorMonth } from '../../domain/reports';
import { doctorEncountersTable } from '../../domain/reportTables';

const dayShort = (key: string) => new Date(`${key}T00:00:00`).toLocaleDateString('en-MY', { day: 'numeric', month: 'short' });

/** A doctor's own month: the consultations they signed off, what was billed for them, and their diagnoses. */
export default function DoctorMonthlyReport() {
  useColorTheme(); // re-render when the colour theme changes so palette colours refresh
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const months = useMemo(() => recentMonthKeys(6, new Date()), []);
  const [month, setMonth] = useState(months[0]);
  const [search, setSearch] = useState('');
  const [method, setMethod] = useState('all');

  const report = useDoctorMonth(user?.id, month);
  const s = report.summary;
  const label = monthLabel(month);

  const methodsPresent = useMemo(() => [...new Set(report.visits.map((v) => v.paymentMethod).filter(Boolean) as string[])].sort(), [report.visits]);
  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return report.visits.filter((v) =>
      (method === 'all' || v.paymentMethod === method) &&
      (!q || v.patientName.toLowerCase().includes(q) || (v.icdCode ?? '').toLowerCase().includes(q) || (v.diagnosis ?? '').toLowerCase().includes(q)));
  }, [report.visits, search, method]);
  const shownSummary = useMemo(() => summarizeDoctorMonth(shown), [shown]);
  const topMethodAmount = Math.max(1, ...s.byMethod.map((m) => m.amount));

  return (
    <div className="space-y-5 animate-fadeIn text-ink w-full pb-8">
      {/* 1. Page header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted">{label}</p>
          <h2 className="mt-1 type-section-title text-ink font-bold">Monthly report</h2>
          <p className="mt-1 text-xs text-muted max-w-2xl">
            Your consultations, billing and diagnoses for {label}.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <div>
            <label htmlFor="doctor-report-month" className="block text-xs font-medium text-muted mb-1">Month</label>
            <select
              id="doctor-report-month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="min-h-11 min-w-44 bg-surface border border-line text-ink text-sm font-semibold px-3 rounded-none cursor-pointer"
            >
              {months.map((m, i) => (
                <option key={m} value={m}>{monthLabel(m)}{i === 0 ? ' (Current)' : ''}</option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={() => void queryClient.invalidateQueries({ queryKey: ['reports'] })}
            title="Refresh clinical encounter statistics and billing summaries for selected month"
            className="btn-secondary min-h-11 px-4 text-sm text-ink"
          >
            <RefreshCw className="w-4 h-4 text-accent" aria-hidden="true" /> Refresh
          </button>
        </div>
      </div>

      {/* Warnings & Notices */}
      {report.hasError && (
        <div role="alert" className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" aria-hidden="true" />
          <span>Your report could not be loaded. Click Refresh to re-fetch clinic data.</span>
        </div>
      )}
      {report.truncated && (
        <div role="status" className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium">
          <Info className="w-4 h-4 shrink-0 mt-px text-amber-600" aria-hidden="true" />
          <span>Only the latest 2,000 consultations are listed, so the totals below may be lower than the true month.</span>
        </div>
      )}
      {report.unattributed > 0 && (
        <div role="status" className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium">
          <Info className="w-4 h-4 shrink-0 mt-px text-amber-600" aria-hidden="true" />
          <span>Across the clinic, {report.unattributed} consultation{report.unattributed === 1 ? '' : 's'} in {label} finished before the signing doctor was recorded. Consultations signed off from now on are counted.</span>
        </div>
      )}

      {/* 2. Key Performance Indicators (4 Cards with 3px Acuity Stripes) */}
      <section aria-label="Month at a glance" className="grid grid-cols-[repeat(auto-fit,minmax(12rem,1fr))] bg-surface border-l border-t border-line">
        <Kpi
          icon={Users}
          label="Consultations signed off"
          value={report.isPending ? '…' : String(s.encounters)}
          note={`${s.certificates} certificate${s.certificates === 1 ? '' : 's'} · ${s.referrals} referral${s.referrals === 1 ? '' : 's'} · ${s.withLabOrders} with lab orders`}
          stripe="border-l-primary"
        />
        <Kpi
          icon={Wallet}
          label="Billed (paid visits)"
          value={report.isPending ? '…' : formatRM(s.billed)}
          note={s.averageBill === null ? 'Nothing paid yet' : `Average ${formatRM(s.averageBill)} over ${s.billedVisits} visit${s.billedVisits === 1 ? '' : 's'}`}
          stripe="border-l-emerald-600"
        />
        <Kpi
          icon={Stethoscope}
          label="Top diagnosis"
          value={s.topDiagnosis ? s.topDiagnosis.code : '—'}
          note={s.topDiagnosis ? `${s.topDiagnosis.diagnosis ?? ''} · ${s.topDiagnosis.sharePercent}% of coded visits` : 'No coded diagnoses yet'}
          stripe="border-l-accent"
        />
        <Kpi
          icon={FileText}
          label="Diagnosis coding rate"
          value={s.encounters ? `${Math.round((s.coded / s.encounters) * 100)}%` : '—'}
          note={s.encounters ? `${s.uncoded} uncoded visits` : 'No consultations yet'}
          tone={s.uncoded > 0 ? 'warn' : 'ok'}
          stripe={s.uncoded > 0 ? 'border-l-amber-500' : 'border-l-emerald-600'}
        />
      </section>

      {/* 3. One ruled sheet: trend, billing, audit note and the ledger */}
      <div className="bg-surface border border-line">
      <div className="flex flex-wrap">
        <section className="flex-[60_1_30rem] min-w-0">
          <div className="flex flex-wrap items-baseline justify-between gap-2 px-5 py-4 border-b border-line">
            <div>
              <h3 className="text-base font-bold text-ink">Consultations per day</h3>
              <p className="text-xs text-muted">Daily sign-off volume over the month</p>
            </div>
            <span className="px-2.5 py-1 bg-surface-muted text-muted text-xs font-semibold tabular-nums">{s.encounters} consultations</span>
          </div>

          {s.byDay.length === 0 ? (
            <p className="text-sm text-muted p-10 text-center">No consultations signed off in {label}.</p>
          ) : (
            <div className="h-60 w-full p-5" role="img" aria-label={`Consultations per day in ${label}: ${s.encounters} in total`}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={s.byDay.map((d) => ({ ...d, label: dayShort(d.day) }))} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartTheme.grid} />
                  <XAxis dataKey="label" tick={chartTheme.tick} tickLine={false} minTickGap={16} />
                  <YAxis tick={chartTheme.tick} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={chartTheme.tooltip} cursor={chartTheme.cursor} />
                  <Bar dataKey="count" name="Consultations" fill={palette.brand} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        <section className="flex-[40_1_20rem] min-w-0 border-t lg:border-t-0 lg:border-l border-line">
          <div className="flex flex-wrap items-baseline justify-between gap-2 px-5 py-4 border-b border-line">
            <div>
              <h3 className="text-base font-bold text-ink">Billing by payment method</h3>
              <p className="text-xs text-muted">Panel claims and self-pay</p>
            </div>
            <span className="px-2.5 py-1 bg-surface-muted text-muted text-xs font-semibold tabular-nums">{formatRM(s.billed)}</span>
          </div>

          {s.byMethod.length === 0 ? (
            <p className="text-sm text-muted p-10 text-center">No paid visits recorded for {label}.</p>
          ) : (
            <div className="p-5 space-y-4">
              {s.byMethod.map((m) => (
                <div key={m.method} className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold text-ink">
                      {m.method} <span className="text-xs text-muted font-normal tabular-nums">({m.count} visits)</span>
                    </span>
                    <span className="font-bold tabular-nums text-accent">{formatRM(m.amount)}</span>
                  </div>
                  <ProgressBar value={(m.amount / topMethodAmount) * 100} size="sm" label={`${m.method}: ${formatRM(m.amount)}`} />
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* 4. Consultation length note */}
      <p className="px-5 py-3 border-t border-line bg-surface-muted text-xs text-muted flex items-center gap-2">
        <Info className="w-4 h-4 text-accent shrink-0" aria-hidden="true" />
        Consultation length is not reported: visits without a recorded end time are left out of duration averages.
      </p>

      {/* 5. Detailed Consultation Encounter Table */}
      <section className="border-t border-line overflow-hidden">
        <div className="px-5 py-4 border-b border-line flex flex-col md:flex-row md:items-center justify-between gap-3 bg-surface">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-ink">
                Consultation ledger
              </h3>
              <span className="px-2.5 py-1 bg-surface-muted text-muted text-xs font-semibold tabular-nums">
                {shown.length}{shown.length !== report.visits.length ? ` of ${report.visits.length}` : ''} records
              </span>
            </div>
            <p className="text-2xs text-muted font-medium mt-0.5">
              Every consultation you signed off this month.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
              <label htmlFor="doctor-report-search" className="sr-only">Search consultations</label>
              <input
                id="doctor-report-search"
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search patient, ICD code..."
                className="pl-8 pr-3 min-h-11 text-sm border border-line bg-surface rounded-none w-56 focus:ring-1 focus:ring-brand outline-none font-medium"
              />
            </div>
            <label htmlFor="doctor-report-method" className="sr-only">Payment method</label>
            <select
              id="doctor-report-method"
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="min-h-11 text-sm font-semibold border border-line bg-surface px-3 rounded-none cursor-pointer"
            >
              <option value="all">All payment methods</option>
              {methodsPresent.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
            <ExportButtons table={doctorEncountersTable(shown, label)} />
          </div>
        </div>

        {shown.length === 0 ? (
          <p className="p-8 text-xs text-muted text-center italic">
            {report.visits.length === 0 ? `No consultations signed off by you in ${label}.` : 'No consultations match this search filter.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-muted text-muted border-b border-line font-semibold text-xs">
                <tr>
                  <th scope="col" className="px-4 py-3">Signed off</th>
                  <th scope="col" className="px-4 py-3">Patient</th>
                  <th scope="col" className="px-4 py-3">Diagnosis</th>
                  <th scope="col" className="px-4 py-3">Clinical plan</th>
                  <th scope="col" className="px-4 py-3">Payment</th>
                  <th scope="col" className="px-4 py-3 text-right">Billed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line-subtle">
                {shown.map((v) => (
                  <tr key={v.id} className="hover:bg-surface-muted transition-colors">
                    <td className="px-4 py-2.5 tabular-nums whitespace-nowrap text-muted">
                      {new Date(v.signedOffAt).toLocaleString('en-MY', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false })}
                    </td>
                    <th scope="row" className="px-4 py-2.5 font-bold text-ink">
                      {v.patientName}
                    </th>
                    <td className="px-4 py-2.5">
                      {v.icdCode && v.icdCode.toUpperCase() !== 'N/A' ? (
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono tabular-nums font-bold text-accent bg-surface-accent px-1.5 py-0.2 border border-line text-2xs">
                            {v.icdCode}
                          </span>
                          <span className="text-ink font-medium">{v.diagnosis}</span>
                        </div>
                      ) : (
                        <span className="chip-warn text-2xs px-1.5 py-0.2">Uncoded</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-muted">
                      {[
                        v.mcDays > 0 ? `MC ${v.mcDays}d${v.mcReason ? ` (${v.mcReason})` : ''}` : '',
                        v.referral ? `Referral${v.referralTo ? `: ${v.referralTo}` : ''}` : '',
                        v.labOrders && v.labOrders.length ? `${v.labOrders.length} lab order${v.labOrders.length === 1 ? '' : 's'}` : ''
                      ].filter(Boolean).join(' · ') || '—'}
                    </td>
                    <td className="px-4 py-2.5 font-medium">
                      <span className="bg-surface-accent border border-line px-1.5 py-0.5 text-2xs">
                        {v.paymentMethod ?? '—'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums font-bold text-ink">
                      {v.fee === null ? <span className="text-slate-400 font-normal">Pending</span> : formatRM(v.fee)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-line bg-surface-muted font-bold">
                  <td className="px-4 py-3" colSpan={5}>Total billed for the visits shown</td>
                  <td className="px-4 py-3 text-right tabular-nums text-sm text-accent">
                    {formatRM(shownSummary.billed)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        <div className="px-5 py-3 text-xs text-muted border-t border-line bg-surface flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <span>Confidential Clinical Record Audit · Protected Health Information (PHI)</span>
          <span>Regulatory Compliance (Act 586 / PHFSA)</span>
        </div>
      </section>
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  note,
  tone = 'ok'
}: {
  icon?: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' }>;
  label: string;
  value: string;
  note: string;
  tone?: 'ok' | 'warn';
  stripe?: string;
}) {
  return (
    <div className="px-5 py-5 border-r border-b border-line">
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className={`mt-2 text-3xl font-bold leading-none tracking-tight tabular-nums break-words ${tone === 'warn' ? 'text-amber-800' : 'text-ink'}`}>{value}</p>
      <p className={`mt-2.5 text-xs font-semibold ${tone === 'warn' ? 'text-amber-800' : 'text-accent'}`}>{note}</p>
    </div>
  );
}
