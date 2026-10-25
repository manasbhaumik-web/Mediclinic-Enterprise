import React, { useState } from 'react';
import { Plus, RefreshCw, Trash2, Settings2, PlugZap } from 'lucide-react';
import Button from '../../components/ui/Button';
import ConnectionForm from './ConnectionForm';
import { Dialog } from '../inventory/shared';
import { useIntegrations, TestResult } from '../../hooks/useIntegrations';
import { validateEndpoint } from '../../../supabase/functions/_shared/endpoint';
import {
  IntegrationConnection, StatusTone, TYPE_LABELS, connectionStatus, enableBlocker,
} from '../../domain/integrations';

const toneClass: Record<StatusTone, string> = {
  ok: 'chip-ok',
  warn: 'chip-warn',
  bad: 'chip-danger',
  idle: 'chip-neutral',
};

const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleString() : 'never');
const errorMessage = (e: unknown) => (e instanceof Error ? e.message : 'Something went wrong.');

export default function ConnectionsPanel() {
  const api = useIntegrations();
  const [editing, setEditing] = useState<IntegrationConnection | 'new' | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, TestResult & { error?: string }>>({});
  const [rowError, setRowError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<IntegrationConnection | null>(null);

  const connections = api.connections.data ?? [];
  const health = api.health.data ?? {};
  const outbox = api.outbox.data;

  const runTest = async (id: string) => {
    setRowError(null);
    try {
      const res = await api.test.mutateAsync(id);
      setResults((r) => ({ ...r, [id]: res }));
    } catch (e) {
      setResults((r) => ({ ...r, [id]: { ok: false, message: errorMessage(e) } }));
    }
  };

  const toggle = async (c: IntegrationConnection) => {
    setRowError(null);
    try {
      await api.setEnabled.mutateAsync({ id: c.id, enabled: !c.enabled });
    } catch (e) {
      setRowError(errorMessage(e));
    }
  };

  const remove = (c: IntegrationConnection) => {
    setDeleteTarget(c);
  };

  const save = async (draft: Parameters<typeof api.save.mutateAsync>[0]['draft'], secret?: string) => {
    setFormError(null);
    try {
      await api.save.mutateAsync({ draft, secret });
      setEditing(null);
    } catch (e) {
      setFormError(errorMessage(e));
    }
  };

  const loadError = api.connections.error;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          ['Connections', connections.length],
          ['Enabled', connections.filter((c) => c.enabled).length],
          ['Queued / retrying', outbox ? outbox.pending + outbox.failed : '–'],
          ['Failed for good', outbox ? outbox.dead : '–'],
        ].map(([label, value]) => (
          <div key={label as string} className="bg-surface border border-line-subtle p-3">
            <div className="text-2xs font-bold uppercase tracking-wider text-subtle">{label}</div>
            <div className="text-xl font-bold text-ink font-mono">{value}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <h2 className="type-heading-caps text-ink">Connections</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" icon={<RefreshCw className="w-3.5 h-3.5" />} onClick={() => api.refresh()}>Refresh</Button>
          <Button size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={() => { setFormError(null); setEditing('new'); }}>Add connection</Button>
        </div>
      </div>

      {loadError && (
        <p role="alert" className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-2">
          Could not load connections ({errorMessage(loadError)}). Has the v15 integrations migration been applied?
        </p>
      )}
      {rowError && <p role="alert" className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-2">{rowError}</p>}

      {!loadError && connections.length === 0 && !api.connections.isPending && (
        <div className="bg-surface border border-dashed border-line p-8 text-center text-xs text-muted">
          No connections yet. Add one to start sending data to an external system. Nothing is sent until a connection is enabled.
        </div>
      )}

      <ul className="space-y-3">
        {connections.map((c) => {
          const h = health[c.id];
          const status = connectionStatus(c, h);
          const endpointOk = validateEndpoint(c.endpointUrl).ok;
          const blocker = c.enabled ? null : enableBlocker(c, endpointOk);
          const result = results[c.id];
          let host = '';
          try { host = c.endpointUrl ? new URL(c.endpointUrl).host : ''; } catch { /* shown as not set */ }

          return (
            <li key={c.id} className="bg-surface border border-line-subtle p-4 space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-sm text-ink">{c.name}</span>
                    <span className="text-2xs font-bold px-2 py-0.5 border border-line bg-surface-accent text-accent uppercase">{TYPE_LABELS[c.type]}</span>
                    <span className={`text-2xs font-bold px-2 py-0.5 border uppercase ${c.mode === 'live' ? 'chip-danger' : 'chip-info'}`}>{c.mode}</span>
                    <span className={`text-2xs font-bold px-2 py-0.5 border ${toneClass[status.tone]}`}>{status.label}</span>
                  </div>
                  <div className="text-xs text-muted font-mono">{host || 'No endpoint set'}</div>
                  {h && (
                    <div className="text-2xs text-subtle">
                      Last success: {fmt(h.lastSuccessAt)}{h.lastLatencyMs != null && ` · ${h.lastLatencyMs} ms`}
                      {h.lastError && <span className="text-rose-700"> · Last error: {h.lastError}</span>}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-ink cursor-pointer" title={blocker ?? undefined}>
                    <input type="checkbox" role="switch" checked={c.enabled} disabled={!!blocker || api.setEnabled.isPending} onChange={() => toggle(c)} />
                    {c.enabled ? 'Enabled' : 'Enable'}
                  </label>
                  <Button variant="outline" size="sm" icon={<PlugZap className="w-3.5 h-3.5" />} disabled={api.test.isPending || !endpointOk} onClick={() => runTest(c.id)}>
                    {api.test.isPending && api.test.variables === c.id ? 'Testing…' : 'Test'}
                  </Button>
                  <Button variant="outline" size="sm" icon={<Settings2 className="w-3.5 h-3.5" />} onClick={() => { setFormError(null); setEditing(c); }}>Configure</Button>
                  <Button variant="ghost" size="sm" aria-label={`Delete ${c.name}`} onClick={() => remove(c)}><Trash2 className="w-3.5 h-3.5 text-rose-600" /></Button>
                </div>
              </div>

              {blocker && !c.enabled && <p className="text-2xs text-subtle">Cannot be enabled yet: {blocker}</p>}
              {result && (
                <p role="status" className={`text-xs font-bold px-3 py-2 border ${result.ok ? 'chip-ok' : 'chip-danger'}`}>
                  {result.ok
                    ? `Connected${result.fhirVersion ? ` · FHIR ${result.fhirVersion}` : ''}${result.software ? ` · ${result.software}` : ''}${result.latencyMs != null ? ` · ${result.latencyMs} ms` : ''}`
                    : `Test failed: ${result.message ?? 'unknown error'}`}
                </p>
              )}
            </li>
          );
        })}
      </ul>

      <div className="space-y-2">
        <h2 className="type-heading-caps text-ink">Recent activity</h2>
        <div className="bg-surface border border-line-subtle overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-surface-muted text-2xs uppercase tracking-wider text-subtle">
              <tr><th className="p-2">Time</th><th className="p-2">Connection</th><th className="p-2">Event</th><th className="p-2">Result</th><th className="p-2">Detail</th></tr>
            </thead>
            <tbody className="divide-y divide-line-subtle">
              {(api.events.data ?? []).map((ev) => (
                <tr key={ev.id}>
                  <td className="p-2 whitespace-nowrap font-mono">{fmt(ev.createdAt)}</td>
                  <td className="p-2">{connections.find((c) => c.id === ev.connectionId)?.name ?? '–'}</td>
                  <td className="p-2 font-mono">{ev.direction}: {ev.eventType}</td>
                  <td className={`p-2 font-bold ${ev.status === 'success' ? 'text-emerald-700' : ev.status === 'blocked' ? 'text-amber-700' : 'text-rose-700'}`}>{ev.status}{ev.httpStatus ? ` (${ev.httpStatus})` : ''}</td>
                  <td className="p-2 text-muted">{ev.detail ?? ''}</td>
                </tr>
              ))}
              {(api.events.data ?? []).length === 0 && (
                <tr><td colSpan={5} className="p-4 text-center text-subtle">No activity yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="text-2xs text-subtle">The activity log records what was sent and the result, never patient data or credentials.</p>
      </div>

      {deleteTarget && (
        <Dialog title="Delete Integration" onClose={() => setDeleteTarget(null)}>
          <p className="text-xs text-muted leading-relaxed">
            Delete integration connection <strong>"{deleteTarget.name}"</strong>? Any queued outbound messages and stored authentication credentials will be permanently removed.
          </p>
          <div className="flex justify-end gap-2 pt-3">
            <button type="button" className="btn-secondary" onClick={() => setDeleteTarget(null)}>Keep it</button>
            <button type="button" className="btn-danger" onClick={async () => {
              const target = deleteTarget;
              setDeleteTarget(null);
              setRowError(null);
              try {
                await api.remove.mutateAsync(target.id);
              } catch (e) {
                setRowError(errorMessage(e));
              }
            }}>Delete Connection</button>
          </div>
        </Dialog>
      )}

      {editing && (
        <ConnectionForm
          existing={editing === 'new' ? undefined : editing}
          saving={api.save.isPending}
          error={formError}
          onSave={save}
          onClearSecret={editing !== 'new' ? async () => { try { await api.clearSecret.mutateAsync(editing.id); setEditing(null); } catch (e) { setFormError(errorMessage(e)); } } : undefined}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
