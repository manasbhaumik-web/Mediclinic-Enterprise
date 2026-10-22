import React, { useEffect, useState } from 'react';
import { useIsFetching, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, ChevronRight, FileText, Info, Landmark, RefreshCw, TrendingUp, Wallet } from 'lucide-react';
import ProgressBar from './ui/ProgressBar';
import { useRevenue } from '../hooks/useRevenue';
import { STATUS_LABELS, EInvoiceStatus } from '../domain/einvoice';
import { formatRM, percentChange } from '../domain/revenue';

interface RevenueCycleHubProps {
  /** Opens another Administration section. */
  onOpenTab?: (tab: 'einvoice') => void;
}

const STATUS_ORDER: EInvoiceStatus[] = ['pending', 'needs_buyer', 'submitted', 'valid', 'invalid', 'error', 'cancelled', 'consolidated'];

export default function RevenueCycleHub({ onOpenTab }: RevenueCycleHubProps) {
  const queryClient = useQueryClient();
  const isFetching = useIsFetching({ queryKey: ['revenue'] }) > 0;

  // Re-evaluate "this month" once an hour so a long-open page rolls over at month end.
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 3_600_000);
    return () => clearInterval(id);
  }, []);

  const r = useRevenue(now);
  const change = percentChange(r.current.total, r.previous.total);
  const monthLabel = now.toLocaleDateString('en-MY', { month: 'long', year: 'numeric' });
  const topMethodAmount = Math.max(1, ...r.current.byMethod.map((m) => m.amount));

  return (
    <div className="animate-fadeIn w-full space-y-6 pb-8">
      <div className="bg-surface-accent text-ink p-5 rounded-none shadow-2xs border border-line flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="type-page-title text-ink flex items-center gap-2.5">
            <TrendingUp className="w-6 h-6 text-accent" aria-hidden="true" />
            Revenue Overview
          </h1>
          <p className="text-xs text-slate-600 font-medium max-w-2xl leading-relaxed">
            What the clinic has billed and collected in {monthLabel}, from paid visits, panel claims and e-invoices.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void queryClient.invalidateQueries({ queryKey: ['revenue'] })}
          disabled={isFetching}
          className="bg-white hover:bg-teal-50 text-deep text-xs font-bold px-3 py-2 rounded-none flex items-center justify-center gap-1.5 border border-line transition-all cursor-pointer shadow-2xs disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-accent ${isFetching ? 'motion-safe:animate-spin' : ''}`} aria-hidden="true" />
          {isFetching ? 'Refreshing…' : 'Refresh'}
        </button>
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
          This month has more paid visits than can be summed here, so the totals are understated.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi
          label="Revenue this month"
          value={r.isPending ? '…' : formatRM(r.current.total)}
          note={change === null ? `${r.current.visits} paid visits` : `${change >= 0 ? '+' : ''}${change}% vs last month · ${r.current.visits} paid visits`}
        />
        <Kpi label="Paid by patients" value={r.isPending ? '…' : formatRM(r.current.patientPaid)} note={`Average ${formatRM(r.current.average)} per visit`} />
        <Kpi label="Claimed from panels" value={r.isPending ? '…' : formatRM(r.current.panelClaimed)} note="Billed to panels / TPAs, not yet confirmed as received" />
        <Kpi label="Waiting at cashier" value={String(r.awaitingBilling)} note="Visits ready to be billed" tone={r.awaitingBilling > 0 ? 'warn' : 'ok'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Panel icon={Wallet} title={`Payment methods, ${monthLabel}`}>
          {r.current.byMethod.length === 0 ? (
            <p className="text-xs text-slate-600">No paid visits yet this month.</p>
          ) : (
            <div className="space-y-4">
              {r.current.byMethod.map((m) => (
                <div key={m.method} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-ink">{m.method} <span className="font-normal text-slate-500">({m.count} visit{m.count === 1 ? '' : 's'})</span></span>
                    <span className="font-mono text-slate-700">{formatRM(m.amount)}</span>
                  </div>
                  <ProgressBar value={(m.amount / topMethodAmount) * 100} size="sm" label={`${m.method}: ${formatRM(m.amount)}`} />
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel
          icon={FileText}
          title="E-invoices (LHDN)"
          action={onOpenTab && (
            <button type="button" onClick={() => onOpenTab('einvoice')} className="text-xs font-bold text-accent hover:underline flex items-center gap-0.5 cursor-pointer">
              Open e-Invoicing<ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          )}
        >
          {!r.hasEInvoices ? (
            <p className="text-xs text-slate-600">No e-invoices have been raised yet.</p>
          ) : (
            <>
              <p className={`text-xs mb-3 ${r.eInvoiceHealth.needAttention ? 'text-amber-800 font-bold' : 'text-emerald-700 font-medium'}`}>
                {r.eInvoiceHealth.needAttention
                  ? `${r.eInvoiceHealth.needAttention} need action, worth ${formatRM(r.eInvoiceHealth.valueNeedingAttention)}`
                  : 'Nothing needs action.'}
              </p>
              <dl className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {STATUS_ORDER.filter((s) => r.eInvoiceHealth.counts[s] > 0).map((s) => (
                  <div key={s} className="bg-surface border border-teal-100 p-2.5 text-center">
                    <dt className="text-2xs text-slate-500 font-bold uppercase">{STATUS_LABELS[s].label}</dt>
                    <dd className="type-metric text-ink mt-1">{r.eInvoiceHealth.counts[s]}</dd>
                  </div>
                ))}
              </dl>
            </>
          )}
        </Panel>

        <Panel icon={Landmark} title="Panels and TPAs set up">
          {r.panels.length === 0 ? (
            <p className="text-xs text-slate-600">No panels are configured.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-ink uppercase border-b border-line font-bold">
                  <tr>
                    <th scope="col" className="py-2 pr-4">Panel</th>
                    <th scope="col" className="py-2 pr-4">Coverage limit</th>
                    <th scope="col" className="py-2">Co-pay</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {r.panels.map((p) => (
                    <tr key={p.name}>
                      <th scope="row" className="py-2 pr-4 font-semibold text-ink">{p.name}</th>
                      <td className="py-2 pr-4 font-mono">{formatRM(p.coverageLimit)}</td>
                      <td className="py-2">{p.coPayRequired ? (p.coPayPercentage !== undefined ? `${p.coPayPercentage}%` : 'Required') : 'None'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        <Panel icon={Info} title="Not tracked yet">
          <p className="text-xs text-slate-600 leading-relaxed">
            The app records what each visit was billed and how it was paid, but not when a panel claim was submitted, approved or rejected,
            and it has no payment plans. Claim turnaround, denial rates and collections ageing can't be shown until that is recorded.
          </p>
        </Panel>
      </div>
    </div>
  );
}

function Kpi({ label, value, note, tone = 'ok' }: { label: string; value: string; note: string; tone?: 'ok' | 'warn' }) {
  return (
    <div className="bg-surface-accent rounded-none border border-line p-4 shadow-2xs">
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
      <h3 className={`type-metric mt-2 ${tone === 'warn' ? 'text-amber-700' : 'text-ink'}`}>{value}</h3>
      <p className="mt-2 text-xs text-slate-600">{note}</p>
    </div>
  );
}

function Panel({ icon: Icon, title, action, children }: { icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' }>; title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="bg-surface-accent rounded-none border border-line shadow-2xs overflow-hidden">
      <div className="border-b border-teal-100 bg-surface p-4 flex items-center justify-between gap-3">
        <h2 className="type-card-title text-ink flex items-center gap-2"><Icon className="w-4 h-4 text-accent" aria-hidden="true" />{title}</h2>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}
