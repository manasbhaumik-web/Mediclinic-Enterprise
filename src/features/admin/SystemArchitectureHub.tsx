import React, { useEffect, useState } from 'react';
import {
  Activity, CheckCircle2, ChevronRight, Cloud, Database, Info, Plug, RefreshCw, Server, Wifi, XCircle, AlertTriangle, Package, ShieldCheck,
} from 'lucide-react';
import { useSystemStatus, buildInfo } from '../../hooks/useSystemStatus';
import { useIntegrations } from '../../hooks/useIntegrations';
import { useAuth } from '../../context/AuthContext';
import {
  APP_REALTIME_TABLES, FUNCTION_STATE_LABEL, Tone, formatBytes, latencyTone, minutesLeft, realtimeCoverage,
} from '../../domain/systemStatus';

interface SystemStatusProps {
  /** Opens another Administration section. */
  onOpenTab?: (tab: 'integrations') => void;
}

const TONE: Record<Tone, string> = {
  ok: 'chip-ok',
  warn: 'chip-warn',
  bad: 'chip-danger',
  idle: 'bg-slate-50 text-muted border-line',
};

const clockTime = (ms: number) => new Date(ms).toLocaleTimeString('en-MY', { hour12: false });
const when = (iso: string | null | undefined) => (iso ? new Date(iso).toLocaleString('en-MY', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }) : '—');

export default function SystemArchitectureHub({ onOpenTab }: SystemStatusProps) {
  const { snapshot, running, run } = useSystemStatus();
  const { role } = useAuth();
  const integrations = useIntegrations();
  const build = buildInfo();

  // Re-read the clock each minute so the session countdown stays honest without re-running the checks.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 60_000); return () => clearInterval(id); }, []);

  const { api, session, realtime, functions, db } = snapshot;
  const facts = db?.facts;
  const coverage = realtimeCoverage(facts?.realtime_tables ?? []);
  const deployed = functions?.filter((f) => f.state === 'deployed' || f.state === 'unreadable').length ?? 0;
  const missing = functions?.filter((f) => f.state === 'not-deployed') ?? [];
  const sessionMinutes = minutesLeft(session?.expiresAtSec, now);
  const connections = integrations.connections.data ?? [];
  const outbox = integrations.outbox.data;
  const hasScheduler = (facts?.extensions ?? []).includes('pg_cron');

  const apiTone: Tone = !api ? 'idle' : api.error || !api.latency ? 'bad' : latencyTone(api.latency.median);
  const realtimeTone: Tone = !realtime ? 'idle' : realtime.state === 'connected' ? 'ok' : 'bad';
  const eventsTone: Tone = !facts ? 'idle' : coverage.missing.length === 0 ? 'ok' : coverage.published.length === 0 ? 'bad' : 'warn';

  return (
    <div className="animate-fadeIn w-full space-y-6 pb-8">
      <div className="bg-surface text-ink p-5 rounded-none shadow-2xs border border-line flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="type-page-title text-ink flex items-center gap-2.5">
            <Server className="w-6 h-6 text-accent" aria-hidden="true" />
            System Status
          </h1>
          <p className="text-xs text-muted font-medium max-w-2xl leading-relaxed">
            Live checks run from this browser against the clinic's backend, plus facts read from the database. Nothing here is estimated: whatever is not measured says so.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted font-mono">{snapshot.ranAt ? `Checked ${clockTime(snapshot.ranAt)}` : 'Checking…'}</span>
          <button
            type="button"
            onClick={() => { void run(); void integrations.refresh(); }}
            disabled={running}
            className="bg-white hover:bg-teal-50 text-deep text-xs font-bold px-3 py-2 rounded-none flex items-center justify-center gap-1.5 border border-line transition-all cursor-pointer shadow-2xs disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-accent ${running ? 'motion-safe:animate-spin' : ''}`} aria-hidden="true" />
            {running ? 'Checking…' : 'Run checks'}
          </button>
        </div>
      </div>

      {!build.backendConfigured && (
        <div role="alert" className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
          <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
          This build has no backend address configured, so none of the checks below can pass.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi
          label="API round trip"
          value={!api ? '…' : api.latency ? `${api.latency.median} ms` : 'Failed'}
          note={!api ? 'Measuring' : api.error ? api.error : `Median of ${api.latency?.samples} requests, fastest ${api.latency?.min} ms, slowest ${api.latency?.max} ms`}
          tone={apiTone}
        />
        <Kpi
          label="Your session"
          value={!session ? '…' : session.signedIn ? 'Signed in' : 'Not signed in'}
          note={!session ? 'Checking' : session.signedIn ? `${role ?? 'unknown role'}${sessionMinutes !== null ? ` · token renews within ${sessionMinutes} min` : ''}` : 'Sign in again'}
          tone={!session ? 'idle' : session.signedIn ? 'ok' : 'bad'}
        />
        <Kpi
          label="Realtime connection"
          value={!realtime ? '…' : realtime.state === 'connected' ? 'Connected' : realtime.state === 'timeout' ? 'No answer' : 'Refused'}
          note={!realtime ? 'Connecting' : realtime.state === 'connected' ? `Handshake took ${realtime.ms} ms` : 'Live updates cannot reach this browser'}
          tone={realtimeTone}
        />
        <Kpi
          label="Edge functions"
          value={!functions ? '…' : `${deployed} of ${functions.length}`}
          note={!functions ? 'Checking' : missing.length ? `Not deployed: ${missing.map((m) => m.slug).join(', ')}` : 'All present'}
          tone={!functions ? 'idle' : missing.length ? 'warn' : 'ok'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Panel icon={Wifi} title="Live updates">
          <div className="flex items-center gap-2 mb-3">
            <Pill tone={eventsTone}>
              {!facts ? 'Checking' : coverage.published.length === APP_REALTIME_TABLES.length ? 'All published' : `${coverage.published.length} of ${APP_REALTIME_TABLES.length} published`}
            </Pill>
            <span className="text-xs text-muted">Tables the app listens to, and whether the database publishes their changes</span>
          </div>
          {db?.error ? <p className="text-xs text-rose-700">Could not read the database facts: {db.error}</p> : (
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
              {APP_REALTIME_TABLES.map((t) => {
                const ok = coverage.published.includes(t);
                return (
                  <li key={t} className="flex items-center gap-2 font-mono">
                    {facts ? (ok ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" aria-label="Published" /> : <XCircle className="w-3.5 h-3.5 text-rose-600" aria-label="Not published" />) : <span className="w-3.5" />}
                    {t}
                  </li>
                );
              })}
            </ul>
          )}
          {facts && coverage.missing.length > 0 && (
            <p className="mt-3 text-xs text-amber-900 bg-amber-50 border border-amber-200 px-3 py-2 leading-relaxed">
              The app asks for live changes on {coverage.missing.length} table{coverage.missing.length === 1 ? '' : 's'} that don't publish them, so screens only refresh when someone acts or reloads. Publishing them is a database setting.
            </p>
          )}
        </Panel>

        <Panel icon={Cloud} title="Edge functions">
          {!functions ? <p className="text-xs text-subtle">Checking…</p> : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-ink uppercase border-b border-line font-bold">
                  <tr><th scope="col" className="py-2 pr-3">Function</th><th scope="col" className="py-2">Status</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {functions.map((f) => {
                    const s = FUNCTION_STATE_LABEL[f.state];
                    return (
                      <tr key={f.slug}>
                        <th scope="row" className="py-2 pr-3 font-normal">
                          <span className="font-mono font-bold text-ink">{f.slug}</span>
                          <span className="block text-2xs text-subtle">{f.label}{f.scheduled ? ' · needs a scheduler' : ''}</span>
                        </th>
                        <td className="py-2"><Pill tone={s.tone}>{s.label}</Pill>{f.httpStatus ? <span className="ml-1.5 font-mono text-2xs text-subtle">HTTP {f.httpStatus}</span> : null}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <p className="mt-3 text-2xs text-subtle leading-relaxed">
            Checked with a request that carries no credentials, so nothing is run: a deployed function refuses it and a missing one is reported as not found.
            {facts && !hasScheduler && ' The two workers have to be called on a timer; this database has no scheduler (pg_cron) installed, so something outside it must do that.'}
          </p>
        </Panel>

        <Panel icon={Database} title="Database">
          {db?.error ? <p className="text-xs text-rose-700">Could not read the database facts: {db.error}</p> : !facts ? <p className="text-xs text-subtle">Checking…</p> : (
            <dl className="grid grid-cols-[auto,1fr] gap-x-5 gap-y-1.5 text-xs">
              <Fact label="Server">PostgreSQL {facts.pg_version}</Fact>
              <Fact label="Size">{formatBytes(facts.db_size_bytes)}</Fact>
              <Fact label="Tables">{facts.tables} · {facts.tables_without_rls === 0 ? <Inline tone="ok">row-level security on all</Inline> : <Inline tone="bad">{facts.tables_without_rls} without row-level security</Inline>}</Fact>
              <Fact label="Functions">{facts.functions}</Fact>
              <Fact label="Migrations applied">{facts.migrations ? `${facts.migrations.count} (latest ${facts.migrations.latest})` : 'Not readable'}</Fact>
              <Fact label="Extensions">{facts.extensions.join(', ') || '—'}</Fact>
              <Fact label="Accounts">{facts.accounts}</Fact>
              <Fact label="Server time">{when(facts.server_time)}</Fact>
            </dl>
          )}
        </Panel>

        <Panel
          icon={Plug}
          title="Integrations"
          action={onOpenTab && (
            <button type="button" onClick={() => onOpenTab('integrations')} className="text-xs font-bold text-accent hover:underline flex items-center gap-0.5 cursor-pointer">
              Open Integrations<ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          )}
        >
          {integrations.connections.isPending ? <p className="text-xs text-subtle">Checking…</p> : integrations.connections.error ? (
            <p className="text-xs text-rose-700">Could not read integrations.</p>
          ) : (
            <dl className="grid grid-cols-[auto,1fr] gap-x-5 gap-y-1.5 text-xs">
              <Fact label="Connections">{connections.length === 0 ? 'None set up' : `${connections.filter((c) => c.enabled).length} enabled of ${connections.length}`}</Fact>
              <Fact label="Outbound queue">{outbox ? `${outbox.pending} waiting · ${outbox.failed} failed · ${outbox.dead} gave up · ${outbox.sent} sent` : '—'}</Fact>
            </dl>
          )}
          <p className="mt-3 text-2xs text-subtle leading-relaxed">Connection tests and per-integration health are on the Integrations screen.</p>
        </Panel>

        <Panel icon={Package} title="This build">
          <dl className="grid grid-cols-[auto,1fr] gap-x-5 gap-y-1.5 text-xs">
            <Fact label="Version">{build.version}</Fact>
            <Fact label="Built">{when(build.builtAt)}</Fact>
            <Fact label="Commit">{build.commit ? <span className="font-mono">{build.commit.slice(0, 10)}</span> : 'Not recorded (local build)'}</Fact>
            <Fact label="Mode">{build.mode}</Fact>
            <Fact label="Backend">{build.backendConfigured ? <span className="font-mono">{build.backendHost}</span> : <Inline tone="bad">not configured</Inline>}</Fact>
            <Fact label="Card payments key">{build.cardPaymentsKeySet ? 'Set' : <Inline tone="warn">not set, so card payments are unavailable</Inline>}</Fact>
            <Fact label="Demo data">{build.demoDataOn ? <Inline tone="warn">on: demo records are mixed into screens</Inline> : 'Off'}</Fact>
          </dl>
        </Panel>

        <Panel icon={Info} title="Not monitored here">
          <p className="text-xs text-muted leading-relaxed">
            This page does not measure uptime history, request volume, error rates, backups, failover or replication, and it holds no security certification.
            Those are reported by the hosting provider's dashboard; check them there. Anything shown above comes from a request made just now.
          </p>
          <p className="mt-2 flex items-start gap-1.5 text-2xs text-subtle"><ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-px" aria-hidden="true" />Security findings are on the Security & Audit screen.</p>
        </Panel>
      </div>
    </div>
  );
}

function Kpi({ label, value, note, tone }: { label: string; value: string; note: string; tone: Tone }) {
  const color = tone === 'bad' ? 'text-rose-700' : tone === 'warn' ? 'text-amber-700' : 'text-ink';
  return (
    <div className="bg-surface rounded-none border border-line p-4 shadow-2xs">
      <span className="text-xs font-semibold text-subtle uppercase tracking-wider flex items-center gap-1.5">
        <Activity className="w-3.5 h-3.5 text-accent" aria-hidden="true" />{label}
      </span>
      <h3 className={`type-metric mt-2 ${color}`}>{value}</h3>
      <p className="mt-2 text-xs text-muted break-words">{note}</p>
    </div>
  );
}

function Panel({ icon: Icon, title, action, children }: { icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' }>; title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="bg-surface rounded-none border border-line shadow-2xs overflow-hidden">
      <div className="border-b border-teal-100 bg-surface p-4 flex items-center justify-between gap-3">
        <h2 className="type-card-title text-ink flex items-center gap-2"><Icon className="w-4 h-4 text-accent" aria-hidden="true" />{title}</h2>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

const Pill = ({ tone, children }: { tone: Tone; children: React.ReactNode }) => (
  <span className={`inline-block px-2 py-0.5 border text-2xs font-bold uppercase tracking-wider ${TONE[tone]}`}>{children}</span>
);

const Inline = ({ tone, children }: { tone: Tone; children: React.ReactNode }) => (
  <span className={tone === 'bad' ? 'text-rose-700 font-bold' : tone === 'warn' ? 'text-amber-800 font-bold' : 'text-emerald-700 font-bold'}>{children}</span>
);

const Fact = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <>
    <dt className="text-subtle">{label}</dt>
    <dd className="text-ink font-medium break-words">{children}</dd>
  </>
);
