import React, { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, FlaskConical, ScanLine, X } from 'lucide-react';
import { PageHeading, StatStrip, StationTabs } from '../../components/ui/StationChrome';
import type { UserRole } from '../../types';
import {
  INVESTIGATION_CATALOG, STATUS_LABEL, actionableCount, canOrder, canRecordResults, canReview, outsideRange, sortWorklist,
  type Investigation, type InvestigationUrgency,
} from '../../domain/investigations';
import type { MoveResult, NewOrder, ResultInput } from '../../hooks/useInvestigations';
import type { DeviceResult, LabDevice } from '../../domain/deviceResults';
import type { ImportSummary } from '../../hooks/useDeviceResults';
import type { DeviceObservation } from '../../../supabase/functions/_shared/deviceMessages';
import DeviceInbox from './DeviceInbox';

export interface OrderableVisit {
  visitId: string;
  patientName: string;
}

interface InvestigationsModuleProps {
  roles: readonly UserRole[];
  isBM: boolean;
  staffName: string;
  investigations: Investigation[];
  loadError: string | null;
  /** Patients the doctor can order for: those in or waiting for consultation, or on hold. */
  orderableVisits: OrderableVisit[];
  onOrder: (visitId: string, orders: NewOrder[]) => Promise<MoveResult>;
  onCollect: (id: string) => Promise<MoveResult>;
  onRecordResult: (id: string, r: ResultInput) => Promise<MoveResult>;
  onReview: (id: string) => Promise<MoveResult>;
  onCancel: (id: string, reason: string) => Promise<MoveResult>;
  /** Results sent by connected devices, waiting for staff to accept them. */
  devices: LabDevice[];
  deviceResults: DeviceResult[];
  deviceLoadError: string | null;
  onAcceptDevice: (id: string, investigationId?: string) => Promise<MoveResult>;
  onRejectDevice: (id: string, reason: string) => Promise<MoveResult>;
  onImportDevice: (deviceId: string, observations: DeviceObservation[], format: string) => Promise<{ ok: true; summary: ImportSummary } | { ok: false; error: string }>;
}

type Section = 'todo' | 'results' | 'devices' | 'history';

const fieldClass = 'min-h-11 w-full px-3 border border-line bg-surface text-ink text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent';
const buttonClass = 'min-h-11 px-4 text-sm font-bold inline-flex items-center justify-center gap-2 cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50 disabled:cursor-not-allowed';
const primaryButton = `${buttonClass} bg-primary text-white hover:bg-primary-hover`;
const quietButton = `${buttonClass} border border-line bg-surface text-ink hover:bg-surface-accent`;

const when = (iso?: string) => (iso ? new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '');

export default function InvestigationsModule({
  roles, isBM, staffName, investigations, loadError, orderableVisits, onOrder, onCollect, onRecordResult, onReview, onCancel,
  devices, deviceResults, deviceLoadError, onAcceptDevice, onRejectDevice, onImportDevice,
}: InvestigationsModuleProps) {
  const record = canRecordResults(roles);
  const order = canOrder(roles);
  const review = canReview(roles);
  const [section, setSection] = useState<Section>(roles.includes('doctor') && !roles.includes('clinic-assistant') ? 'results' : 'todo');
  const [notice, setNotice] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [resultFor, setResultFor] = useState<string | null>(null);

  const todo = useMemo(() => sortWorklist(investigations.filter((i) => i.status === 'Ordered' || i.status === 'Collected')), [investigations]);
  const results = useMemo(() => sortWorklist(investigations.filter((i) => i.status === 'Resulted')), [investigations]);
  const history = useMemo(
    () => investigations.filter((i) => i.status === 'Reviewed' || i.status === 'Cancelled').sort((a, b) => (b.resultedAt ?? b.orderedAt).localeCompare(a.resultedAt ?? a.orderedAt)),
    [investigations],
  );
  const urgentWaiting = todo.filter((i) => i.urgency === 'urgent').length;
  const abnormalWaiting = results.filter((i) => i.abnormal).length;
  const devicePending = deviceResults.filter((r) => r.status === 'Pending').length;
  const shown = section === 'todo' ? todo : section === 'results' ? results : history;

  const act = async (id: string, call: () => Promise<MoveResult>, done: string) => {
    setBusyId(id);
    const result = await call();
    setBusyId(null);
    if ('error' in result) {
      setNotice({ tone: 'error', text: result.error });
      return false;
    }
    setNotice({ tone: 'ok', text: done });
    return true;
  };

  const text = {
    title: isBM ? 'Makmal dan pengimejan' : 'Lab and imaging',
    todo: isBM ? 'Untuk dibuat' : 'To do',
    results: isBM ? 'Keputusan untuk disemak' : 'Results to review',
    devices: isBM ? 'Daripada peranti' : 'From devices',
    history: isBM ? 'Sejarah' : 'History',
    empty: {
      todo: isBM ? 'Tiada ujian atau imbasan menunggu.' : 'No tests or scans are waiting.',
      results: isBM ? 'Tiada keputusan menunggu semakan.' : 'No results are waiting for review.',
      devices: '',
      history: isBM ? 'Belum ada rekod dalam 7 hari lepas.' : 'Nothing reviewed or cancelled in the last 7 days.',
    },
  };

  return (
    <div className="space-y-4 animate-fadeIn font-sans text-strong">
      <PageHeading eyebrow={`${isBM ? 'Staf' : 'Staff'}: ${staffName}`} title={text.title} />

      <StationTabs<Section>
        label={isBM ? 'Bahagian makmal' : 'Lab sections'}
        active={section}
        onChange={setSection}
        tabs={[
          { id: 'todo', label: text.todo, count: todo.length, alert: record },
          { id: 'results', label: text.results, count: results.length, alert: review },
          ...(record ? [{ id: 'devices' as const, label: text.devices, count: devicePending, alert: true }] : []),
          { id: 'history', label: text.history, count: history.length },
        ]}
      />

      <StatStrip
        label={isBM ? 'Angka makmal' : 'Lab figures'}
        stats={[
          { label: isBM ? 'Menunggu sampel / imbasan' : 'Waiting for sample or scan', value: todo.length, note: urgentWaiting > 0 ? `${urgentWaiting} ${isBM ? 'segera' : 'urgent'}` : (isBM ? 'Tiada yang segera' : 'None urgent') },
          { label: isBM ? 'Keputusan menunggu doktor' : 'Results waiting for the doctor', value: results.length, tone: abnormalWaiting > 0 ? 'danger' : 'default', note: abnormalWaiting > 0 ? `${abnormalWaiting} ${isBM ? 'tidak normal' : 'abnormal'}` : (isBM ? 'Tiada yang tidak normal' : 'None abnormal') },
          { label: isBM ? 'Kerja untuk anda' : 'Work for you', value: actionableCount(roles, investigations) },
        ]}
      />

      {loadError && (
        <div role="alert" className="flex items-start gap-3 px-4 py-3 bg-rose-50 border border-rose-200 text-rose-900 dark:bg-rose-950/60 dark:border-rose-800 dark:text-rose-100">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-sm">{isBM ? 'Senarai tidak dapat dimuat.' : 'The list could not be loaded.'} {loadError}</p>
        </div>
      )}

      {notice && (
        <div role={notice.tone === 'error' ? 'alert' : 'status'} className={`flex items-start gap-3 px-4 py-3 border ${notice.tone === 'error' ? 'bg-rose-50 border-rose-200 text-rose-900 dark:bg-rose-950/60 dark:border-rose-800 dark:text-rose-100' : 'bg-surface-accent border-line text-ink'}`}>
          {notice.tone === 'error' ? <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" /> : <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-accent" aria-hidden="true" />}
          <p className="text-sm flex-1">{notice.text}</p>
          <button type="button" aria-label="Dismiss" onClick={() => setNotice(null)} className="min-h-8 min-w-8 -my-1 -mr-1 inline-flex items-center justify-center cursor-pointer"><X className="w-4 h-4" /></button>
        </div>
      )}

      {order && <NewOrderForm isBM={isBM} visits={orderableVisits} onOrder={onOrder} onNotice={setNotice} />}

      {section === 'devices' ? (
        <DeviceInbox isBM={isBM} results={deviceResults} devices={devices} investigations={investigations} loadError={deviceLoadError} onAccept={onAcceptDevice} onReject={onRejectDevice} onImport={onImportDevice} onNotice={setNotice} />
      ) : (
      <section aria-label={text[section]} className="bg-surface border border-line">
        {shown.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-muted">{text.empty[section]}</p>
        ) : (
          <ul className="divide-y divide-line">
            {shown.map((i) => (
              <li key={i.id} className="p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 text-sm">
                      {i.kind === 'imaging' ? <ScanLine className="w-4 h-4 text-accent" aria-label="Imaging" /> : <FlaskConical className="w-4 h-4 text-accent" aria-label="Lab test" />}
                      <strong className="text-ink">{i.name}</strong>
                      {i.urgency === 'urgent' && <span className="px-2 py-0.5 text-xs font-bold bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200">{isBM ? 'Segera' : 'Urgent'}</span>}
                      {i.abnormal && i.status !== 'Ordered' && i.status !== 'Collected' && <span className="px-2 py-0.5 text-xs font-bold bg-rose-100 text-rose-900 dark:bg-rose-950/60 dark:text-rose-200">{isBM ? 'Tidak normal' : 'Abnormal'}</span>}
                    </p>
                    <p className="mt-1 text-sm text-muted">{i.patientName}{i.patientIc ? ` · ${i.patientIc}` : ''}</p>
                    <p className="mt-0.5 text-xs text-subtle tabular-nums">
                      {STATUS_LABEL[i.status][isBM ? 'bm' : 'en']} · {isBM ? 'Dipesan' : 'Ordered'} {when(i.orderedAt)}
                      {i.status === 'Cancelled' && i.cancelReason ? ` · ${i.cancelReason}` : ''}
                    </p>
                    {i.clinicalInfo && <p className="mt-1 text-sm text-muted"><strong>{isBM ? 'Maklumat klinikal' : 'Clinical info'}:</strong> {i.clinicalInfo}</p>}
                    {(i.status === 'Resulted' || i.status === 'Reviewed') && <ResultSummary item={i} isBM={isBM} />}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {record && i.status === 'Ordered' && (
                      <button type="button" disabled={busyId === i.id} className={quietButton} onClick={() => act(i.id, () => onCollect(i.id), `${i.name}: ${isBM ? 'ditanda sudah diambil' : 'marked as collected'}.`)}>
                        {i.kind === 'imaging' ? (isBM ? 'Pesakit dihantar' : 'Patient sent') : (isBM ? 'Sampel diambil' : 'Sample taken')}
                      </button>
                    )}
                    {record && (i.status === 'Ordered' || i.status === 'Collected') && (
                      <button type="button" disabled={busyId === i.id} className={primaryButton} onClick={() => setResultFor(resultFor === i.id ? null : i.id)}>
                        {isBM ? 'Masukkan keputusan' : 'Enter result'}
                      </button>
                    )}
                    {review && i.status === 'Resulted' && (
                      <button type="button" disabled={busyId === i.id} className={primaryButton} onClick={() => act(i.id, () => onReview(i.id), `${i.name}: ${isBM ? 'ditanda sudah disemak' : 'marked as reviewed'}.`)}>
                        {isBM ? 'Tandakan disemak' : 'Mark as reviewed'}
                      </button>
                    )}
                    {(record) && (i.status === 'Ordered' || i.status === 'Collected') && (
                      <CancelButton isBM={isBM} disabled={busyId === i.id} onCancel={(reason) => act(i.id, () => onCancel(i.id, reason), `${i.name}: ${isBM ? 'dibatalkan' : 'cancelled'}.`)} />
                    )}
                  </div>
                </div>

                {resultFor === i.id && (
                  <ResultForm
                    item={i}
                    isBM={isBM}
                    busy={busyId === i.id}
                    onSave={async (r) => {
                      const ok = await act(i.id, () => onRecordResult(i.id, r), `${i.name}: ${isBM ? 'keputusan disimpan' : 'result saved'}.`);
                      if (ok) setResultFor(null);
                    }}
                    onClose={() => setResultFor(null)}
                  />
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
      )}
    </div>
  );
}

function ResultSummary({ item, isBM }: { item: Investigation; isBM: boolean }) {
  const value = [item.resultValue, item.resultUnit].filter(Boolean).join(' ');
  return (
    <div className="mt-2 border border-line bg-surface-muted px-3 py-2 text-sm">
      {value && (
        <p className="tabular-nums">
          <strong className={item.abnormal ? 'text-rose-700 dark:text-rose-300' : 'text-ink'}>{value}</strong>
          {item.referenceRange && <span className="text-muted"> · {isBM ? 'Julat' : 'Range'} {item.referenceRange}</span>}
        </p>
      )}
      {item.resultNotes && <p className="text-muted whitespace-pre-wrap">{item.resultNotes}</p>}
      <p className="text-xs text-subtle mt-1">{isBM ? 'Keputusan' : 'Resulted'} {when(item.resultedAt)}{item.reviewedAt ? ` · ${isBM ? 'Disemak' : 'Reviewed'} ${when(item.reviewedAt)}` : ''}</p>
    </div>
  );
}

function CancelButton({ isBM, disabled, onCancel }: { isBM: boolean; disabled: boolean; onCancel: (reason: string) => void }) {
  const [asking, setAsking] = useState(false);
  const [reason, setReason] = useState('');
  if (!asking) {
    return <button type="button" disabled={disabled} className={quietButton} onClick={() => setAsking(true)}>{isBM ? 'Batalkan' : 'Cancel order'}</button>;
  }
  return (
    <div className="flex flex-wrap gap-2 items-center">
      <input aria-label={isBM ? 'Sebab pembatalan' : 'Reason for cancelling'} className={`${fieldClass} sm:w-56`} value={reason} onChange={(e) => setReason(e.target.value)} placeholder={isBM ? 'Sebab (pilihan)' : 'Reason (optional)'} />
      <button type="button" disabled={disabled} className={`${buttonClass} bg-rose-600 text-white hover:bg-rose-700`} onClick={() => { onCancel(reason); setAsking(false); setReason(''); }}>{isBM ? 'Sahkan batal' : 'Confirm cancel'}</button>
      <button type="button" className={quietButton} onClick={() => setAsking(false)}>{isBM ? 'Kembali' : 'Keep'}</button>
    </div>
  );
}

function ResultForm({ item, isBM, busy, onSave, onClose }: { item: Investigation; isBM: boolean; busy: boolean; onSave: (r: ResultInput) => void; onClose: () => void }) {
  const [value, setValue] = useState('');
  const [unit, setUnit] = useState('');
  const [range, setRange] = useState('');
  const [abnormal, setAbnormal] = useState(false);
  const [abnormalTouched, setAbnormalTouched] = useState(false);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  // The flag follows the numbers until the person sets it themselves.
  const suggested = outsideRange(value, range);
  const flag = abnormalTouched ? abnormal : suggested === true;

  const save = () => {
    if (!value.trim() && !notes.trim()) {
      setError(isBM ? 'Masukkan nilai keputusan atau laporan.' : 'Enter a result value or a report before saving.');
      return;
    }
    setError('');
    onSave({ value: value.trim(), unit: unit.trim(), range: range.trim(), abnormal: flag, notes: notes.trim() });
  };

  const id = `result-${item.id}`;
  return (
    <div className="mt-4 border border-line p-4 grid gap-3 sm:grid-cols-3" role="group" aria-label={`${isBM ? 'Keputusan untuk' : 'Result for'} ${item.name}`}>
      <label className="text-sm font-medium text-muted" htmlFor={`${id}-value`}>{isBM ? 'Nilai' : 'Value'}
        <input id={`${id}-value`} className={`${fieldClass} mt-1`} value={value} onChange={(e) => setValue(e.target.value)} inputMode="decimal" />
      </label>
      <label className="text-sm font-medium text-muted" htmlFor={`${id}-unit`}>{isBM ? 'Unit' : 'Unit'}
        <input id={`${id}-unit`} className={`${fieldClass} mt-1`} value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="mmol/L" />
      </label>
      <label className="text-sm font-medium text-muted" htmlFor={`${id}-range`}>{isBM ? 'Julat rujukan' : 'Reference range'}
        <input id={`${id}-range`} className={`${fieldClass} mt-1`} value={range} onChange={(e) => setRange(e.target.value)} placeholder="3.5-5.0" />
      </label>
      <label className="text-sm font-medium text-muted sm:col-span-3" htmlFor={`${id}-notes`}>{item.kind === 'imaging' ? (isBM ? 'Laporan / penemuan' : 'Report / findings') : (isBM ? 'Catatan' : 'Notes')}
        <textarea id={`${id}-notes`} rows={3} className={`${fieldClass} mt-1 py-2`} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </label>
      <label className="sm:col-span-3 inline-flex items-center gap-2 text-sm text-ink">
        <input type="checkbox" checked={flag} onChange={(e) => { setAbnormal(e.target.checked); setAbnormalTouched(true); }} className="w-4 h-4" />
        {isBM ? 'Tidak normal' : 'Abnormal result'}
        {!abnormalTouched && suggested === true && <span className="text-xs text-muted">({isBM ? 'di luar julat' : 'outside the range'})</span>}
      </label>
      {error && <p role="alert" className="sm:col-span-3 text-sm text-rose-700 dark:text-rose-300">{error}</p>}
      <div className="sm:col-span-3 flex flex-wrap gap-2">
        <button type="button" disabled={busy} className={primaryButton} onClick={save}>{isBM ? 'Simpan keputusan' : 'Save result'}</button>
        <button type="button" className={quietButton} onClick={onClose}>{isBM ? 'Tutup' : 'Close'}</button>
      </div>
    </div>
  );
}

function NewOrderForm({ isBM, visits, onOrder, onNotice }: { isBM: boolean; visits: OrderableVisit[]; onOrder: InvestigationsModuleProps['onOrder']; onNotice: (n: { tone: 'ok' | 'error'; text: string }) => void }) {
  const [visitId, setVisitId] = useState('');
  const [picked, setPicked] = useState<string[]>([]);
  const [urgency, setUrgency] = useState<InvestigationUrgency>('routine');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);

  const toggle = (name: string) => setPicked((p) => (p.includes(name) ? p.filter((n) => n !== name) : [...p, name]));

  const submit = async () => {
    if (!visitId || picked.length === 0) {
      onNotice({ tone: 'error', text: isBM ? 'Pilih pesakit dan sekurang-kurangnya satu ujian atau imbasan.' : 'Choose a patient and at least one test or scan.' });
      return;
    }
    setBusy(true);
    const orders: NewOrder[] = picked.map((name) => ({
      name, urgency, clinicalInfo: info, kind: INVESTIGATION_CATALOG.find((c) => c.name === name)?.kind ?? 'lab',
    }));
    const result = await onOrder(visitId, orders);
    setBusy(false);
    if ('error' in result) {
      onNotice({ tone: 'error', text: result.error });
      return;
    }
    onNotice({ tone: 'ok', text: isBM ? `${picked.length} pesanan dihantar.` : `${picked.length} order${picked.length === 1 ? '' : 's'} sent.` });
    setPicked([]);
    setInfo('');
    setUrgency('routine');
  };

  return (
    <details className="bg-surface border border-line group">
      <summary className="min-h-11 px-5 flex items-center cursor-pointer text-sm font-bold text-ink select-none">{isBM ? 'Pesanan baharu' : 'New order'}</summary>
      <div className="p-5 border-t border-line grid gap-4">
        {visits.length === 0 ? (
          <p className="text-sm text-muted">{isBM ? 'Tiada pesakit dalam giliran atau perundingan anda.' : 'No patients are in your queue or consultation right now.'}</p>
        ) : (
          <>
            <label className="text-sm font-medium text-muted" htmlFor="order-visit">{isBM ? 'Pesakit' : 'Patient'}
              <select id="order-visit" className={`${fieldClass} mt-1`} value={visitId} onChange={(e) => setVisitId(e.target.value)}>
                <option value="">{isBM ? 'Pilih pesakit' : 'Choose a patient'}</option>
                {visits.map((v) => <option key={v.visitId} value={v.visitId}>{v.patientName}</option>)}
              </select>
            </label>
            <fieldset>
              <legend className="text-sm font-medium text-muted mb-2">{isBM ? 'Ujian dan imbasan' : 'Tests and scans'}</legend>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {INVESTIGATION_CATALOG.map((c) => (
                  <label key={c.name} className={`flex items-center gap-2 min-h-11 px-3 border cursor-pointer text-sm ${picked.includes(c.name) ? 'border-brand bg-surface-accent font-semibold text-ink' : 'border-line text-muted hover:bg-surface-muted'}`}>
                    <input type="checkbox" checked={picked.includes(c.name)} onChange={() => toggle(c.name)} className="w-4 h-4" />
                    {c.kind === 'imaging' ? <ScanLine className="w-4 h-4 shrink-0" aria-hidden="true" /> : <FlaskConical className="w-4 h-4 shrink-0" aria-hidden="true" />}
                    <span className="min-w-0">{c.name}<span className="block text-2xs text-subtle font-normal">{c.category} · {c.turnaround}</span></span>
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="grid gap-3 sm:grid-cols-[12rem_1fr]">
              <label className="text-sm font-medium text-muted" htmlFor="order-urgency">{isBM ? 'Keutamaan' : 'Priority'}
                <select id="order-urgency" className={`${fieldClass} mt-1`} value={urgency} onChange={(e) => setUrgency(e.target.value as InvestigationUrgency)}>
                  <option value="routine">{isBM ? 'Biasa' : 'Routine'}</option>
                  <option value="urgent">{isBM ? 'Segera' : 'Urgent'}</option>
                </select>
              </label>
              <label className="text-sm font-medium text-muted" htmlFor="order-info">{isBM ? 'Maklumat klinikal' : 'Clinical information'}
                <input id="order-info" className={`${fieldClass} mt-1`} value={info} onChange={(e) => setInfo(e.target.value)} placeholder={isBM ? 'Sebab ujian' : 'Why it is needed'} />
              </label>
            </div>
            <div>
              <button type="button" disabled={busy} className={primaryButton} onClick={submit}>{isBM ? 'Hantar pesanan' : 'Send order'}</button>
            </div>
          </>
        )}
      </div>
    </details>
  );
}
