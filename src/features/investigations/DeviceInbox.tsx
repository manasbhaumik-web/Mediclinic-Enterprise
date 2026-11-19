import React, { useMemo, useRef, useState } from 'react';
import { Cpu, Upload } from 'lucide-react';
import {
  MATCH_LABEL, candidateOrders, matchState, type DeviceResult, type LabDevice,
} from '../../domain/deviceResults';
import type { Investigation } from '../../domain/investigations';
import type { MoveResult } from '../../hooks/useInvestigations';
import type { ImportSummary } from '../../hooks/useDeviceResults';
import { isUsable, parseDeviceMessage, type DeviceObservation } from '../../../supabase/functions/_shared/deviceMessages';

interface DeviceInboxProps {
  isBM: boolean;
  results: DeviceResult[];
  devices: LabDevice[];
  investigations: Investigation[];
  loadError: string | null;
  onAccept: (id: string, investigationId?: string) => Promise<MoveResult>;
  onReject: (id: string, reason: string) => Promise<MoveResult>;
  onImport: (deviceId: string, observations: DeviceObservation[], format: string) => Promise<{ ok: true; summary: ImportSummary } | { ok: false; error: string }>;
  onNotice: (n: { tone: 'ok' | 'error'; text: string }) => void;
}

const fieldClass = 'min-h-11 w-full px-3 border border-line bg-surface text-ink text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent';
const buttonClass = 'min-h-11 px-4 text-sm font-bold inline-flex items-center justify-center gap-2 cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50 disabled:cursor-not-allowed';
const primaryButton = `${buttonClass} bg-primary text-white hover:bg-primary-hover`;
const quietButton = `${buttonClass} border border-line bg-surface text-ink hover:bg-surface-accent`;

const when = (iso?: string) => (iso ? new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '');

export default function DeviceInbox({ isBM, results, devices, investigations, loadError, onAccept, onReject, onImport, onNotice }: DeviceInboxProps) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pick, setPick] = useState<Record<string, string>>({});
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const pending = useMemo(() => results.filter((r) => r.status === 'Pending'), [results]);
  const done = useMemo(() => results.filter((r) => r.status !== 'Pending'), [results]);
  const deviceName = (id: string) => devices.find((d) => d.id === id)?.name ?? (isBM ? 'Peranti' : 'Device');

  const act = async (id: string, call: () => Promise<MoveResult>, ok: string) => {
    setBusyId(id);
    const result = await call();
    setBusyId(null);
    onNotice('error' in result ? { tone: 'error', text: result.error } : { tone: 'ok', text: ok });
  };

  return (
    <div className="space-y-4">
      <ImportPanel isBM={isBM} devices={devices} onImport={onImport} onNotice={onNotice} />

      {loadError && <p role="alert" className="text-sm text-rose-700 dark:text-rose-300">{loadError}</p>}

      <section aria-label={isBM ? 'Keputusan daripada peranti' : 'Results from devices'} className="bg-surface border border-line">
        {pending.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-muted">
            {isBM ? 'Tiada keputusan peranti menunggu semakan.' : 'No device results are waiting for you.'}
            {devices.length === 0 && <span className="block mt-1 text-xs text-subtle">{isBM ? 'Belum ada peranti didaftarkan. Pentadbir menambahnya di Pentadbiran > Peranti makmal.' : 'No devices are set up yet. An administrator adds them under Administration > Lab devices.'}</span>}
          </p>
        ) : (
          <ul className="divide-y divide-line">
            {pending.map((r) => {
              const state = matchState(r);
              const options = candidateOrders(r, investigations);
              const target = pick[r.id] ?? r.investigationId ?? '';
              return (
                <li key={r.id} className="p-4 sm:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-2 text-sm">
                        <Cpu className="w-4 h-4 text-accent" aria-hidden="true" />
                        <strong className="text-ink">{r.testName ?? r.deviceCode}</strong>
                        {r.testName && r.testName !== r.deviceCode && <span className="text-xs text-subtle">({r.deviceCode})</span>}
                        {r.abnormal && <span className="px-2 py-0.5 text-xs font-bold bg-rose-100 text-rose-900 dark:bg-rose-950/60 dark:text-rose-200">{isBM ? 'Tidak normal' : 'Abnormal'}</span>}
                      </p>
                      <p className="mt-1 text-sm tabular-nums">
                        {(r.value || r.unit) && <strong className={r.abnormal ? 'text-rose-700 dark:text-rose-300' : 'text-ink'}>{[r.value, r.unit].filter(Boolean).join(' ')}</strong>}
                        {r.range && <span className="text-muted"> · {isBM ? 'Julat' : 'Range'} {r.range}</span>}
                      </p>
                      {r.notes && <p className="mt-1 text-sm text-muted whitespace-pre-wrap">{r.notes}</p>}
                      <p className="mt-1 text-xs text-subtle">
                        {deviceName(r.deviceId)} · {isBM ? 'Pengenalan pesakit' : 'Patient ID'} {r.patientRef || '—'} · {isBM ? 'Diterima' : 'Received'} {when(r.receivedAt)}
                      </p>
                      <p className={`mt-1 text-xs font-semibold ${state === 'matched' ? 'text-accent' : 'text-amber-800 dark:text-amber-300'}`}>{MATCH_LABEL[state]}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {state !== 'matched' && options.length > 0 && (
                        <select aria-label={isBM ? 'Pilih pesanan' : 'Choose the order'} className={`${fieldClass} sm:w-64`} value={target} onChange={(e) => setPick((p) => ({ ...p, [r.id]: e.target.value }))}>
                          <option value="">{isBM ? 'Pilih pesanan…' : 'Choose an order…'}</option>
                          {options.map((o) => <option key={o.id} value={o.id}>{o.name} · {o.patientName}</option>)}
                        </select>
                      )}
                      <button type="button" disabled={busyId === r.id || (!target && state !== 'matched')} className={primaryButton} onClick={() => act(r.id, () => onAccept(r.id, target || undefined), isBM ? 'Keputusan direkodkan.' : 'Result recorded on the order.')}>
                        {isBM ? 'Terima' : 'Accept'}
                      </button>
                      <button type="button" disabled={busyId === r.id} className={quietButton} onClick={() => { setRejecting(rejecting === r.id ? null : r.id); setReason(''); }}>
                        {isBM ? 'Tolak' : 'Reject'}
                      </button>
                    </div>
                  </div>

                  {rejecting === r.id && (
                    <div className="mt-3 flex flex-wrap gap-2 items-center">
                      <input aria-label={isBM ? 'Sebab menolak' : 'Reason for rejecting'} className={`${fieldClass} sm:w-72`} value={reason} onChange={(e) => setReason(e.target.value)} placeholder={isBM ? 'Sebab (pilihan)' : 'Reason (optional)'} />
                      <button type="button" disabled={busyId === r.id} className={`${buttonClass} bg-rose-600 text-white hover:bg-rose-700`} onClick={() => { void act(r.id, () => onReject(r.id, reason), isBM ? 'Keputusan ditolak.' : 'Result rejected.'); setRejecting(null); }}>
                        {isBM ? 'Sahkan tolak' : 'Confirm reject'}
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {done.length > 0 && (
        <details className="bg-surface border border-line">
          <summary className="min-h-11 px-5 flex items-center cursor-pointer text-sm font-bold text-ink select-none">{isBM ? 'Sudah diproses' : 'Already handled'} ({done.length})</summary>
          <ul className="divide-y divide-line border-t border-line">
            {done.map((r) => (
              <li key={r.id} className="px-5 py-3 text-sm flex flex-wrap items-baseline justify-between gap-2">
                <span><strong className="text-ink">{r.testName ?? r.deviceCode}</strong> <span className="text-muted tabular-nums">{[r.value, r.unit].filter(Boolean).join(' ')}</span> · <span className="text-subtle">{deviceName(r.deviceId)}</span></span>
                <span className="text-xs text-subtle">{r.status === 'Accepted' ? (isBM ? 'Diterima' : 'Accepted') : (isBM ? 'Ditolak' : 'Rejected')}{r.rejectReason ? ` · ${r.rejectReason}` : ''}</span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

function ImportPanel({ isBM, devices, onImport, onNotice }: Pick<DeviceInboxProps, 'isBM' | 'devices' | 'onImport' | 'onNotice'>) {
  const active = devices.filter((d) => d.active);
  const [deviceId, setDeviceId] = useState('');
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async (file: File | undefined) => {
    if (!file) return;
    if (!deviceId) {
      onNotice({ tone: 'error', text: isBM ? 'Pilih peranti dahulu.' : 'Choose the device first.' });
      return;
    }
    setBusy(true);
    try {
      const parsed = parseDeviceMessage(await file.text());
      if (!isUsable(parsed)) {
        onNotice({ tone: 'error', text: `${isBM ? 'Fail tidak dapat digunakan' : 'The file could not be used'}: ${parsed.errors[0] ?? ''}` });
        return;
      }
      const result = await onImport(deviceId, parsed.observations, parsed.format);
      if ('error' in result) {
        onNotice({ tone: 'error', text: result.error });
      } else {
        const s = result.summary;
        onNotice({ tone: 'ok', text: isBM
          ? `${s.received} keputusan diimport (${s.duplicates} pendua, ${s.unmatched} belum dipadankan).`
          : `${s.received} result${s.received === 1 ? '' : 's'} imported (${s.duplicates} already received, ${s.unmatched} without a matching order).` });
      }
    } catch {
      onNotice({ tone: 'error', text: isBM ? 'Fail tidak dapat dibaca.' : 'The file could not be read.' });
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <details className="bg-surface border border-line">
      <summary className="min-h-11 px-5 flex items-center gap-2 cursor-pointer text-sm font-bold text-ink select-none">
        <Upload className="w-4 h-4" aria-hidden="true" />{isBM ? 'Import fail keputusan' : 'Import a result file'}
      </summary>
      <div className="p-5 border-t border-line grid gap-3 sm:grid-cols-[16rem_1fr] items-end">
        <label className="text-sm font-medium text-muted" htmlFor="import-device">{isBM ? 'Peranti' : 'Device'}
          <select id="import-device" className={`${fieldClass} mt-1`} value={deviceId} onChange={(e) => setDeviceId(e.target.value)}>
            <option value="">{isBM ? 'Pilih peranti' : 'Choose a device'}</option>
            {active.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </label>
        <label className="text-sm font-medium text-muted" htmlFor="import-file">{isBM ? 'Fail HL7, FHIR atau JSON' : 'HL7, FHIR or JSON file'}
          <input id="import-file" ref={fileRef} type="file" accept=".hl7,.txt,.json,.oru" disabled={busy} className={`${fieldClass} mt-1 py-2`} onChange={(e) => void load(e.target.files?.[0])} />
        </label>
        <p className="sm:col-span-2 text-xs text-subtle">{isBM ? 'Keputusan masuk ke peti masuk ini dahulu; tiada apa-apa direkodkan sehingga anda menerimanya.' : 'Imported results land in this inbox first; nothing is recorded on an order until you accept it.'}</p>
      </div>
    </details>
  );
}
