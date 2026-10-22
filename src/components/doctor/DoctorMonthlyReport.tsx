import React, { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AlertTriangle, BarChart3, FileText, Info, RefreshCw, Search, Stethoscope, Users, Wallet } from 'lucide-react';
import ProgressBar from '../ui/ProgressBar';
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
    <div className="space-y-5 animate-fadeIn">
      <div className="bg-surface-muted dark:bg-night-850 border border-line-subtle dark:border-teal-800/40 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-none shadow-xs">
        <div>
          <h2 className="type-card-title text-ink dark:text-teal-300 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-accent dark:text-teal-300" aria-hidden="true" />
            My monthly report
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 font-medium">
            The consultations you signed off in {label}, what was billed for them, and your diagnoses.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="doctor-report-month" className="sr-only">Month</label>
          <select id="doctor-report-month" value={month} onChange={(e) => setMonth(e.target.value)} className="bg-surface dark:bg-night-900 border border-line dark:border-teal-800/40 text-ink dark:text-teal-100 text-xs font-bold px-3 py-1.5 rounded-none cursor-pointer">
            {months.map((m, i) => <option key={m} value={m}>{monthLabel(m)}{i === 0 ? ' (this month)' : ''}</option>)}
          </select>
          <button type="button" onClick={() => void queryClient.invalidateQueries({ queryKey: ['reports'] })} className="px-3 py-1.5 text-xs font-bold border border-line bg-white text-accent hover:bg-teal-50 flex items-center gap-1.5 cursor-pointer rounded-none">
            <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" /> Refresh
          </button>
        </div>
      </div>

      {report.hasError && (
        <div role="alert" className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
          <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
          Your report could not be loaded. Use Refresh to try again.
        </div>
      )}
      {report.unattributed > 0 && (
        <div role="status" className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium">
          <Info className="w-4 h-4 shrink-0 mt-px" aria-hidden="true" />
          {report.unattributed} consultation{report.unattributed === 1 ? '' : 's'} finished in {label} before doctors were recorded on sign-off, so {report.unattributed === 1 ? 'it is' : 'they are'} not counted here. Consultations you sign off from now on are.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi icon={Users} label="Consultations signed off" value={report.isPending ? '…' : String(s.encounters)} note={`${s.certificates} medical certificate${s.certificates === 1 ? '' : 's'} · ${s.referrals} referral${s.referrals === 1 ? '' : 's'}`} />
        <Kpi icon={Wallet} label="Billed (paid visits)" value={report.isPending ? '…' : formatRM(s.billed)} note={s.averageBill === null ? 'Nothing paid yet' : `Average ${formatRM(s.averageBill)} over ${s.billedVisits} visit${s.billedVisits === 1 ? '' : 's'}`} />
        <Kpi icon={Stethoscope} label="Top diagnosis" value={s.topDiagnosis ? s.topDiagnosis.code : '—'} note={s.topDiagnosis ? `${s.topDiagnosis.diagnosis ?? ''} · ${s.topDiagnosis.sharePercent}% of coded visits` : 'No coded diagnoses yet'} />
        <Kpi icon={FileText} label="Diagnosis coded" value={s.encounters ? `${Math.round((s.coded / s.encounters) * 100)}%` : '—'} note={s.encounters ? `${s.uncoded} without a code` : 'No consultations yet'} tone={s.uncoded > 0 ? 'warn' : 'ok'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <section className="lg:col-span-2 bg-surface dark:bg-night-900 border border-line-subtle dark:border-teal-800/40 p-5 rounded-none space-y-3 shadow-xs">
          <h3 className="type-card-title text-ink dark:text-teal-300">Consultations per day</h3>
          {s.byDay.length === 0 ? <p className="text-xs text-slate-600">No consultations signed off in {label}.</p> : (
            <div className="h-56 w-full" role="img" aria-label={`Consultations per day in ${label}: ${s.encounters} in total`}>
              <ResponsiveContainer>
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

        <section className="bg-surface dark:bg-night-900 border border-line-subtle dark:border-teal-800/40 p-5 rounded-none space-y-3 shadow-xs">
          <h3 className="type-card-title text-ink dark:text-teal-300">Billing by payment method</h3>
          {s.byMethod.length === 0 ? <p className="text-xs text-slate-600">No paid visits yet.</p> : s.byMethod.map((m) => (
            <div key={m.method} className="space-y-1">
              <div className="flex justify-between text-xs"><span className="font-bold text-ink dark:text-white">{m.method} <span className="font-normal text-slate-500">({m.count})</span></span><span className="font-mono">{formatRM(m.amount)}</span></div>
              <ProgressBar value={(m.amount / topMethodAmount) * 100} size="sm" label={`${m.method}: ${formatRM(m.amount)}`} />
            </div>
          ))}
        </section>
      </div>

      <section className="border border-dashed border-line bg-surface p-4">
        <h3 className="type-card-title text-ink flex items-center gap-2"><Info className="w-4 h-4 text-slate-400" aria-hidden="true" />Consultation length: not recorded yet</h3>
        <p className="mt-1 text-xs text-slate-600">The app does not record when a consultation starts or ends, so average consultation time can't be reported.</p>
      </section>

      <section className="bg-surface dark:bg-night-900 border border-line-subtle dark:border-teal-800/40 rounded-none shadow-xs overflow-hidden">
        <div className="p-4 border-b border-line-subtle flex flex-col md:flex-row md:items-center justify-between gap-3">
          <h3 className="type-card-title text-ink dark:text-teal-300">Consultations ({shown.length}{shown.length !== report.visits.length ? ` of ${report.visits.length}` : ''})</h3>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
              <label htmlFor="doctor-report-search" className="sr-only">Search consultations</label>
              <input id="doctor-report-search" type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Patient or diagnosis" className="pl-8 pr-3 py-1.5 text-xs border border-line bg-white rounded-none w-48 focus:ring-1 focus:ring-brand outline-none" />
            </div>
            <label htmlFor="doctor-report-method" className="sr-only">Payment method</label>
            <select id="doctor-report-method" value={method} onChange={(e) => setMethod(e.target.value)} className="text-xs font-bold border border-line bg-white px-2 py-1.5 rounded-none cursor-pointer">
              <option value="all">All payment methods</option>
              {methodsPresent.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
            <ExportButtons table={doctorEncountersTable(shown, label)} />
          </div>
        </div>
        {shown.length === 0 ? (
          <p className="p-5 text-xs text-slate-600">{report.visits.length === 0 ? `No consultations signed off by you in ${label}.` : 'No consultations match this search.'}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-muted text-ink uppercase border-b border-line font-bold">
                <tr><th scope="col" className="px-4 py-3">Signed off</th><th scope="col" className="px-4 py-3">Patient</th><th scope="col" className="px-4 py-3">Diagnosis</th><th scope="col" className="px-4 py-3">Payment</th><th scope="col" className="px-4 py-3 text-right">Billed</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {shown.map((v) => (
                  <tr key={v.id}>
                    <td className="px-4 py-2.5 font-mono whitespace-nowrap">{new Date(v.signedOffAt).toLocaleString('en-MY', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false })}</td>
                    <th scope="row" className="px-4 py-2.5 font-semibold text-ink">{v.patientName}</th>
                    <td className="px-4 py-2.5">{v.icdCode && v.icdCode.toUpperCase() !== 'N/A' ? <><span className="font-mono font-bold">{v.icdCode}</span> {v.diagnosis}</> : <span className="text-amber-800">Not coded</span>}</td>
                    <td className="px-4 py-2.5">{v.paymentMethod ?? '—'}</td>
                    <td className="px-4 py-2.5 text-right font-mono">{v.fee === null ? <span className="text-slate-400">Not paid yet</span> : formatRM(v.fee)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-line font-bold"><td className="px-4 py-2.5" colSpan={4}>Billed on the visits shown</td><td className="px-4 py-2.5 text-right font-mono">{formatRM(shownSummary.billed)}</td></tr>
              </tfoot>
            </table>
          </div>
        )}
        <p className="p-3 text-2xs text-slate-500 border-t border-line-subtle">Downloads contain patient names and diagnoses. Keep them confidential and delete them when no longer needed.</p>
      </section>
    </div>
  );
}

function Kpi({ icon: Icon, label, value, note, tone = 'ok' }: { icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' }>; label: string; value: string; note: string; tone?: 'ok' | 'warn' }) {
  return (
    <div className="bg-surface dark:bg-night-900 border border-line-subtle dark:border-teal-800/40 p-4 rounded-none shadow-xs">
      <div className="flex items-center justify-between">
        <span className="text-2xs text-slate-500 dark:text-teal-200/80 font-bold uppercase tracking-wider font-mono">{label}</span>
        <Icon className="w-4 h-4 text-accent dark:text-teal-300" aria-hidden="true" />
      </div>
      <p className={`type-metric mt-2 ${tone === 'warn' ? 'text-amber-700' : 'text-ink dark:text-white'}`}>{value}</p>
      <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400">{note}</p>
    </div>
  );
}
