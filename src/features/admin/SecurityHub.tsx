import React, { useMemo, useState } from 'react';
import { useQueryClient, useIsFetching } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2, Check, Key, Minus, RefreshCw, ScrollText, ShieldCheck } from 'lucide-react';
import { useAuditFeed } from '../../hooks/useAuditFeed';
import { AuditSource, AuditTone, SOURCE_LABEL, summarizeActivity } from '../../domain/audit';
import { ClinicalPermission, RBACPermissionEngine } from '../../domain/rbacPermissionEngine';
import { UserRole } from '../../types';

type Tab = 'activity' | 'access';

const ROLES: { id: UserRole; label: string }[] = [
  { id: 'admin', label: 'Admin' },
  { id: 'doctor', label: 'Doctor' },
  { id: 'pharmacist', label: 'Pharmacist' },
  { id: 'receptionist', label: 'Receptionist' },
  { id: 'clinic-assistant', label: 'Assistant' },
  { id: 'cashier', label: 'Cashier' },
  { id: 'hr', label: 'HR' },
];

const PERMISSIONS: { id: ClinicalPermission; label: string }[] = [
  { id: 'VIEW_FULL_NRIC', label: 'View full NRIC (unmasked)' },
  { id: 'EDIT_CLINICAL_SOAP', label: 'Edit clinical SOAP notes' },
  { id: 'DISPENSE_POISON_SCHEDULE', label: 'Dispense scheduled poisons' },
  { id: 'ISSUE_MC_LEAVE', label: 'Issue medical certificates' },
  { id: 'COLLECT_PAYMENT', label: 'Collect payment' },
  { id: 'APPLY_BILLING_DISCOUNT', label: 'Apply billing discounts' },
  { id: 'VIEW_FINANCIAL_REPORTS', label: 'View financial reports' },
  { id: 'MANAGE_INVENTORY_STOCK', label: 'Manage inventory stock' },
  { id: 'MANAGE_STAFF_ACCOUNTS', label: 'Manage staff accounts' },
  { id: 'EXPORT_MOH_AUDIT_LOGS', label: 'Export MOH audit logs' },
  { id: 'CONFIGURE_SYSTEM_SETTINGS', label: 'Configure system settings' },
];

const TONE_STYLE: Record<AuditTone, string> = {
  ok: 'chip-ok',
  warn: 'chip-warn',
  bad: 'chip-danger',
  info: 'bg-slate-50 text-muted border-line',
};

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const PAGE_SIZE = 50;

const formatWhen = (iso: string) =>
  new Date(iso).toLocaleString('en-MY', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false });

export default function SecurityHub() {
  const [tab, setTab] = useState<Tab>('activity');
  const [source, setSource] = useState<AuditSource | 'all'>('all');
  const [shown, setShown] = useState(PAGE_SIZE);
  const queryClient = useQueryClient();
  const isFetching = useIsFetching({ queryKey: ['audit'] }) > 0;

  const feed = useAuditFeed();
  const summary = useMemo(() => summarizeActivity(feed.entries, Date.now() - WEEK_MS), [feed.entries]);
  const loadedBySource = useMemo(() => summarizeActivity(feed.entries, 0).bySource, [feed.entries]);
  const filtered = useMemo(() => (source === 'all' ? feed.entries : feed.entries.filter((e) => e.source === source)), [feed.entries, source]);
  const visible = filtered.slice(0, shown);

  return (
    <div className="animate-fadeIn w-full space-y-6 pb-8">
      <div className="bg-surface text-ink p-5 rounded-none shadow-2xs border border-line flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="type-page-title text-ink flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-accent" aria-hidden="true" />
            Security & Audit
          </h1>
          <p className="text-xs text-muted font-medium max-w-2xl leading-relaxed">
            Recent activity recorded across inventory, HR, payroll, equipment and integrations, and what each role is allowed to do.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void queryClient.invalidateQueries({ queryKey: ['audit'] })}
          disabled={isFetching}
          className="bg-white hover:bg-teal-50 text-deep text-xs font-bold px-3 py-2 rounded-none flex items-center justify-center gap-1.5 border border-line transition-all cursor-pointer shadow-2xs disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-accent ${isFetching ? 'motion-safe:animate-spin' : ''}`} aria-hidden="true" />
          {isFetching ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {feed.failedSources.length > 0 && (
        <div role="alert" className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
          <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
          Could not load: {feed.failedSources.join(', ')}. The log below is incomplete.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Kpi label="Events, last 7 days" value={String(summary.total)} note="Across all recorded sources" />
        <Kpi
          label="Failed or flagged"
          value={String(summary.problems)}
          note="Failed integrations and failed equipment checks"
          tone={summary.problems > 0 ? 'bad' : 'ok'}
        />
        <Kpi label="Roles defined" value={String(ROLES.length)} note="See the access matrix for what each can do" />
      </div>

      <div role="tablist" aria-label="Security sections" className="flex items-stretch gap-0 bg-surface-strong border-b border-line text-xs font-bold h-10 overflow-x-auto custom-scrollbar">
        {([['activity', 'Activity log'], ['access', 'Role permissions']] as const).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`px-4 h-full border-0 rounded-none transition-all cursor-pointer whitespace-nowrap ${tab === id ? 'bg-chrome text-white font-bold' : 'bg-transparent text-ink hover:bg-surface-strong font-bold'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'activity' && (
        <section className="bg-surface p-6 rounded-none shadow-xs border border-line" aria-label="Activity log">
          <h2 className="type-heading-caps mb-1 flex items-center gap-2 text-ink">
            <ScrollText className="w-5 h-5 text-accent" aria-hidden="true" /> Activity log
          </h2>
          <p className="text-xs text-subtle mb-4">
            Newest first. Shows up to {feed.perSourceLimit} recent events per source. Patient-visit and sign-in activity is not recorded here.
          </p>

          <div className="flex flex-wrap gap-2 mb-4" role="group" aria-label="Filter by source">
            {(['all', ...Object.keys(SOURCE_LABEL)] as (AuditSource | 'all')[]).map((s) => (
              <button
                key={s}
                type="button"
                aria-pressed={source === s}
                onClick={() => { setSource(s); setShown(PAGE_SIZE); }}
                className={`text-xs font-bold px-3 py-1 border cursor-pointer ${source === s ? 'bg-chrome text-white border-chrome' : 'bg-white text-ink border-line hover:bg-teal-50'}`}
              >
                {s === 'all' ? 'All' : SOURCE_LABEL[s]}
                {s !== 'all' && <span className="ml-1.5 font-mono font-normal">{loadedBySource[s]}</span>}
              </button>
            ))}
          </div>

          {feed.isPending ? (
            <p className="text-xs text-subtle">Loading…</p>
          ) : visible.length === 0 ? (
            <p className="flex items-center gap-2 text-xs text-muted"><CheckCircle2 className="w-4 h-4 text-slate-400" aria-hidden="true" />No activity recorded{source === 'all' ? '' : ` for ${SOURCE_LABEL[source]}`} yet.</p>
          ) : (
            <ul className="space-y-2">
              {visible.map((e) => (
                <li key={e.id} className="bg-surface border border-teal-100 p-3 text-xs flex flex-col sm:flex-row sm:items-start gap-x-4 gap-y-1">
                  <time dateTime={e.at} className="font-mono text-subtle shrink-0 sm:w-28">{formatWhen(e.at)}</time>
                  <span className={`shrink-0 self-start px-2 py-0.5 border text-2xs font-bold uppercase tracking-wider ${TONE_STYLE[e.tone]}`}>{SOURCE_LABEL[e.source]}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-ink">{e.action}</p>
                    {e.detail && <p className="text-muted break-words">{e.detail}</p>}
                  </div>
                  <span className="text-subtle shrink-0 sm:text-right">{e.actorName ?? (e.actor ? 'Unknown user' : 'System')}</span>
                </li>
              ))}
            </ul>
          )}

          {filtered.length > shown && (
            <div className="mt-4 flex justify-center">
              <button type="button" onClick={() => setShown((n) => n + PAGE_SIZE)} className="text-xs font-bold text-accent hover:underline cursor-pointer">
                Show more ({filtered.length - shown} remaining)
              </button>
            </div>
          )}
        </section>
      )}

      {tab === 'access' && (
        <section className="bg-surface p-6 rounded-none shadow-xs border border-line" aria-label="Role permissions">
          <h2 className="type-heading-caps mb-1 flex items-center gap-2 text-ink">
            <Key className="w-5 h-5 text-accent" aria-hidden="true" /> Role permissions
          </h2>
          <p className="text-xs text-subtle mb-4">
            Read from the application's permission rules (<code>rbacPermissionEngine</code>). They are part of the code, so changing them takes a software update, not a setting.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface text-ink uppercase border-b border-teal-100 font-bold">
                <tr>
                  <th scope="col" className="px-4 py-3">Permission</th>
                  {ROLES.map((r) => <th key={r.id} scope="col" className="px-4 py-3 text-center">{r.label}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {PERMISSIONS.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <th scope="row" className="px-4 py-3 font-semibold text-ink">{p.label}</th>
                    {ROLES.map((r) => {
                      const allowed = RBACPermissionEngine.hasPermission(r.id, p.id);
                      return (
                        <td key={r.id} className="px-4 py-3 text-center">
                          {allowed
                            ? <Check className="w-4 h-4 text-emerald-600 inline" aria-label="Allowed" />
                            : <Minus className="w-4 h-4 text-slate-300 inline" aria-label="Not allowed" />}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

function Kpi({ label, value, note, tone = 'ok' }: { label: string; value: string; note: string; tone?: 'ok' | 'bad' }) {
  return (
    <div className="bg-surface rounded-none border border-line p-4 shadow-2xs">
      <span className="text-xs font-semibold text-subtle uppercase tracking-wider">{label}</span>
      <h3 className={`type-metric mt-2 ${tone === 'bad' ? 'text-rose-700' : 'text-ink'}`}>{value}</h3>
      <p className="mt-2 text-xs text-muted">{note}</p>
    </div>
  );
}
