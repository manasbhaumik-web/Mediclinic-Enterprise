import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, Copy, KeyRound, Plus, Trash2 } from 'lucide-react';
import { PageHeading } from '../../components/ui/StationChrome';
import { useLabDevices, type DeviceForm } from '../../hooks/useDeviceResults';
import {
  KIND_LABEL, PROTOCOL_LABEL, deviceActivity, generateDeviceKey, ingestUrl, keyHint, sha256Hex,
  type DeviceKind, type DeviceProtocol, type LabDevice,
} from '../../domain/deviceResults';
import { INVESTIGATION_CATALOG } from '../../domain/investigations';

const fieldClass = 'min-h-11 w-full px-3 border border-line bg-surface text-ink text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent';
const buttonClass = 'min-h-11 px-4 text-sm font-bold inline-flex items-center justify-center gap-2 cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50 disabled:cursor-not-allowed';
const primaryButton = `${buttonClass} bg-primary text-white hover:bg-primary-hover`;
const quietButton = `${buttonClass} border border-line bg-surface text-ink hover:bg-surface-accent`;

const EMPTY: DeviceForm = { name: '', kind: 'analyzer', protocol: 'hl7v2', location: '', active: true };

const ACTIVITY_TEXT = { off: 'Switched off', never: 'Has not sent anything yet', recent: 'Sent results in the last 24 hours', quiet: 'Quiet for over 24 hours' } as const;

export default function LabDevicesAdmin() {
  const lab = useLabDevices();
  const [editing, setEditing] = useState<string | 'new' | null>(null);
  const [form, setForm] = useState<DeviceForm>(EMPTY);
  const [notice, setNotice] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);
  const [newKey, setNewKey] = useState<{ deviceId: string; key: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const endpoint = ingestUrl(import.meta.env.VITE_SUPABASE_URL as string | undefined);

  const report = (r: { ok: true } | { ok: false; error: string }, done: string) => {
    setNotice('error' in r ? { tone: 'error', text: r.error } : { tone: 'ok', text: done });
    return !('error' in r);
  };

  const startEdit = (d: LabDevice | null) => {
    setEditing(d ? d.id : 'new');
    setForm(d ? { name: d.name, kind: d.kind, protocol: d.protocol, location: d.location, active: d.active } : EMPTY);
  };

  const save = async () => {
    if (!form.name.trim()) {
      setNotice({ tone: 'error', text: 'Give the device a name.' });
      return;
    }
    setBusy(true);
    const ok = report(await lab.save(editing === 'new' ? null : editing, form), 'Device saved.');
    setBusy(false);
    if (ok) setEditing(null);
  };

  const makeKey = async (d: LabDevice) => {
    setBusy(true);
    const key = generateDeviceKey();
    const ok = report(await lab.setKey(d.id, await sha256Hex(key), keyHint(key)), 'New key created. Copy it now: it cannot be shown again.');
    setBusy(false);
    if (ok) setNewKey({ deviceId: d.id, key });
  };

  const copy = (text: string, done: string) => {
    void navigator.clipboard?.writeText(text).then(() => setNotice({ tone: 'ok', text: done }), () => setNotice({ tone: 'error', text: 'Could not copy. Select the text and copy it by hand.' }));
  };

  return (
    <div className="space-y-4 animate-fadeIn font-sans text-strong">
      <PageHeading title="Lab devices">
        <button type="button" className={primaryButton} onClick={() => startEdit(null)}><Plus className="w-4 h-4" aria-hidden="true" />Add a device</button>
      </PageHeading>

      <section className="bg-surface border border-line p-5 text-sm space-y-2">
        <p className="text-muted">
          Lab analyzers, imaging gateways and point-of-care devices (or their vendor middleware) send results to this address with their own key.
          Results wait in the <strong className="text-ink">Lab and imaging &gt; From devices</strong> inbox until a clinic assistant or doctor accepts them. Nothing reaches a chart on its own.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <code className="px-2 py-1 bg-surface-muted border border-line break-all select-all">{endpoint}</code>
          <button type="button" className={quietButton} onClick={() => copy(endpoint, 'Address copied.')}><Copy className="w-4 h-4" aria-hidden="true" />Copy address</button>
        </div>
        <p className="text-xs text-subtle">Send each message as a POST with the header <code>Authorization: Bearer &lt;device key&gt;</code>. Accepted formats: HL7 v2 (ORU^R01), FHIR (Observation or Bundle) and plain JSON.</p>
      </section>

      {lab.loadError && <p role="alert" className="text-sm text-rose-700 dark:text-rose-300">{lab.loadError}</p>}

      {notice && (
        <div role={notice.tone === 'error' ? 'alert' : 'status'} className={`flex items-start gap-3 px-4 py-3 border ${notice.tone === 'error' ? 'bg-rose-50 border-rose-200 text-rose-900 dark:bg-rose-950/60 dark:border-rose-800 dark:text-rose-100' : 'bg-surface-accent border-line text-ink'}`}>
          {notice.tone === 'error' ? <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" /> : <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-accent" aria-hidden="true" />}
          <p className="text-sm">{notice.text}</p>
        </div>
      )}

      {editing && (
        <section className="bg-surface border border-line p-5 grid gap-3 sm:grid-cols-2" aria-label="Device details">
          <label className="text-sm font-medium text-muted" htmlFor="dev-name">Name
            <input id="dev-name" className={`${fieldClass} mt-1`} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Sysmex XN-1000" />
          </label>
          <label className="text-sm font-medium text-muted" htmlFor="dev-location">Where it is
            <input id="dev-location" className={`${fieldClass} mt-1`} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Treatment room" />
          </label>
          <label className="text-sm font-medium text-muted" htmlFor="dev-kind">Type
            <select id="dev-kind" className={`${fieldClass} mt-1`} value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value as DeviceKind })}>
              {(Object.keys(KIND_LABEL) as DeviceKind[]).map((k) => <option key={k} value={k}>{KIND_LABEL[k]}</option>)}
            </select>
          </label>
          <label className="text-sm font-medium text-muted" htmlFor="dev-protocol">Message format
            <select id="dev-protocol" className={`${fieldClass} mt-1`} value={form.protocol} onChange={(e) => setForm({ ...form, protocol: e.target.value as DeviceProtocol })}>
              {(Object.keys(PROTOCOL_LABEL) as DeviceProtocol[]).map((p) => <option key={p} value={p}>{PROTOCOL_LABEL[p]}</option>)}
            </select>
          </label>
          <label className="sm:col-span-2 inline-flex items-center gap-2 text-sm text-ink">
            <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="w-4 h-4" />
            Accept results from this device
          </label>
          <div className="sm:col-span-2 flex flex-wrap gap-2">
            <button type="button" disabled={busy} className={primaryButton} onClick={save}>Save device</button>
            <button type="button" className={quietButton} onClick={() => setEditing(null)}>Cancel</button>
          </div>
        </section>
      )}

      <section aria-label="Devices" className="bg-surface border border-line">
        {lab.devices.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-muted">No devices yet. Add one, create its key, then map its test codes.</p>
        ) : (
          <ul className="divide-y divide-line">
            {lab.devices.map((d) => (
              <DeviceRow key={d.id} device={d} lab={lab} busy={busy} newKey={newKey?.deviceId === d.id ? newKey.key : null}
                onEdit={() => startEdit(d)} onMakeKey={() => makeKey(d)} onCopy={copy} onNotice={setNotice} onKeyHidden={() => setNewKey(null)} report={report} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function DeviceRow({ device: d, lab, busy, newKey, onEdit, onMakeKey, onCopy, onNotice, onKeyHidden, report }: {
  device: LabDevice;
  lab: ReturnType<typeof useLabDevices>;
  busy: boolean;
  newKey: string | null;
  onEdit: () => void;
  onMakeKey: () => void;
  onCopy: (text: string, done: string) => void;
  onNotice: (n: { tone: 'ok' | 'error'; text: string }) => void;
  onKeyHidden: () => void;
  report: (r: { ok: true } | { ok: false; error: string }, done: string) => boolean;
}) {
  const [code, setCode] = useState('');
  const [test, setTest] = useState('');
  const mapped = lab.codes.filter((c) => c.deviceId === d.id);
  const activity = deviceActivity(d);

  const addCode = async () => {
    if (!code.trim() || !test.trim()) {
      onNotice({ tone: 'error', text: 'Enter the device code and choose the test it stands for.' });
      return;
    }
    if (report(await lab.saveCode(d.id, code.trim(), test), 'Code saved.')) {
      setCode('');
      setTest('');
    }
  };

  return (
    <li className="p-5 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm"><strong className="text-ink">{d.name}</strong> <span className="text-muted">· {KIND_LABEL[d.kind]} · {PROTOCOL_LABEL[d.protocol]}{d.location ? ` · ${d.location}` : ''}</span></p>
          <p className={`mt-1 text-xs ${activity === 'recent' ? 'text-accent font-semibold' : activity === 'quiet' ? 'text-amber-800 dark:text-amber-300 font-semibold' : 'text-subtle'}`}>
            {ACTIVITY_TEXT[activity]}{d.lastSeenAt ? ` · last ${new Date(d.lastSeenAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}` : ''}
          </p>
          <p className="mt-0.5 text-xs text-subtle">{d.keyHint ? `Key ending ${d.keyHint}` : 'No key yet, so this device cannot send results.'}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={quietButton} onClick={onEdit}>Edit</button>
          <button type="button" disabled={busy} className={quietButton} onClick={onMakeKey}><KeyRound className="w-4 h-4" aria-hidden="true" />{d.keyHint ? 'Replace key' : 'Create key'}</button>
          {d.keyHint && <button type="button" disabled={busy} className={quietButton} onClick={async () => { report(await lab.clearKey(d.id), 'Key removed. The device can no longer send results.'); }}>Remove key</button>}
        </div>
      </div>

      {newKey && (
        <div role="status" className="border border-amber-300 bg-amber-50 text-amber-950 dark:bg-amber-950/40 dark:text-amber-100 dark:border-amber-800 p-4 space-y-2">
          <p className="text-sm font-semibold">Copy this key now. It is not stored and cannot be shown again.</p>
          <code className="block px-2 py-1 bg-surface border border-line break-all select-all text-ink">{newKey}</code>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={quietButton} onClick={() => onCopy(newKey, 'Key copied.')}><Copy className="w-4 h-4" aria-hidden="true" />Copy key</button>
            <button type="button" className={quietButton} onClick={onKeyHidden}>I have saved it</button>
          </div>
        </div>
      )}

      <div>
        <h4 className="text-sm font-bold text-ink">Test codes</h4>
        <p className="text-xs text-subtle mb-2">Match the code this device uses to the test it stands for, so its results find the right order.</p>
        {mapped.length > 0 && (
          <ul className="divide-y divide-line border border-line mb-3">
            {mapped.map((c) => (
              <li key={c.deviceCode} className="px-3 py-2 text-sm flex items-center justify-between gap-2">
                <span><code className="text-ink">{c.deviceCode}</code> <span className="text-muted">→ {c.testName}</span></span>
                <button type="button" aria-label={`Remove code ${c.deviceCode}`} className="min-h-9 min-w-9 inline-flex items-center justify-center text-muted hover:text-rose-700 cursor-pointer" onClick={async () => { report(await lab.deleteCode(d.id, c.deviceCode), 'Code removed.'); }}>
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="grid gap-2 sm:grid-cols-[10rem_1fr_auto] items-end">
          <label className="text-xs font-medium text-muted" htmlFor={`code-${d.id}`}>Device code
            <input id={`code-${d.id}`} className={`${fieldClass} mt-1`} value={code} onChange={(e) => setCode(e.target.value)} placeholder="HGB" />
          </label>
          <label className="text-xs font-medium text-muted" htmlFor={`test-${d.id}`}>Test
            <select id={`test-${d.id}`} className={`${fieldClass} mt-1`} value={test} onChange={(e) => setTest(e.target.value)}>
              <option value="">Choose a test</option>
              {INVESTIGATION_CATALOG.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
            </select>
          </label>
          <button type="button" className={primaryButton} onClick={addCode}>Add code</button>
        </div>
      </div>
    </li>
  );
}
