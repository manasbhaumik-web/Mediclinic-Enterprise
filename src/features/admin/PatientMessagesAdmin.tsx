import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, MessageCircle } from 'lucide-react';
import { PageHeading, StatStrip } from '../../components/ui/StationChrome';
import { usePatientMessages } from '../../hooks/usePatientMessages';
import {
  KIND_LABEL, TEMPLATE_GUIDE, maskPhone, normalizeMyPhone, parseHours, summarizeOutbox, workerIsRunning, type MessageSettings,
} from '../../domain/patientMessages';

const fieldClass = 'min-h-11 w-full px-3 border border-line bg-surface text-ink text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent';
const buttonClass = 'min-h-11 px-4 text-sm font-bold inline-flex items-center justify-center gap-2 cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50 disabled:cursor-not-allowed';
const primaryButton = `${buttonClass} bg-primary text-white hover:bg-primary-hover`;
const quietButton = `${buttonClass} border border-line bg-surface text-ink hover:bg-surface-accent`;

const when = (iso?: string) => (iso ? new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '');

export default function PatientMessagesAdmin() {
  const m = usePatientMessages();
  const [form, setForm] = useState<MessageSettings | null>(null);
  const [hoursText, setHoursText] = useState('');
  const [notice, setNotice] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [phone, setPhone] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (m.settings && !form) {
      setForm(m.settings);
      setHoursText(m.settings.appointmentHours.join(', '));
    }
  }, [m.settings, form]);

  const report = (r: { ok: true } | { ok: false; error: string }, done: string) => {
    setNotice('error' in r ? { tone: 'error', text: r.error } : { tone: 'ok', text: done });
    return !('error' in r);
  };

  if (!form) {
    return (
      <div className="space-y-4">
        <PageHeading title="Patient messages" />
        {m.loadError ? <p role="alert" className="text-sm text-rose-700 dark:text-rose-300">{m.loadError}</p> : <p className="text-sm text-muted">Loading…</p>}
      </div>
    );
  }

  const counts = summarizeOutbox(m.outbox);
  const running = workerIsRunning(m.settings?.lastRunAt);
  const set = <K extends keyof MessageSettings>(k: K, v: MessageSettings[K]) => setForm({ ...form, [k]: v });

  const save = async () => {
    const hours = parseHours(hoursText);
    if (form.appointmentEnabled && hours.length === 0) {
      setNotice({ tone: 'error', text: 'Enter at least one reminder time, such as "24, 2" (hours before the appointment).' });
      return;
    }
    setBusy(true);
    const ok = report(await m.saveSettings({ ...form, appointmentHours: hours.length ? hours : form.appointmentHours }), 'Settings saved.');
    setBusy(false);
    if (ok) setHoursText((hours.length ? hours : form.appointmentHours).join(', '));
  };

  const addOptOut = async () => {
    if (!normalizeMyPhone(phone)) {
      setNotice({ tone: 'error', text: 'Enter a valid Malaysian mobile number, such as 012-345 6789.' });
      return;
    }
    if (report(await m.setOptOut(phone, true, reason), 'Number added. It will not be messaged.')) {
      setPhone('');
      setReason('');
    }
  };

  return (
    <div className="space-y-4 animate-fadeIn font-sans text-strong">
      <PageHeading title="Patient messages" eyebrow="WhatsApp reminders" />

      <StatStrip
        label="Message figures"
        stats={[
          { label: 'Waiting to send', value: counts.Queued + counts.Sending, note: 'In the queue now' },
          { label: 'Sent', value: counts.Sent, note: 'In the log below' },
          { label: 'Failed', value: counts.Failed, tone: counts.Failed > 0 ? 'danger' : 'default', note: counts.Failed > 0 ? 'Check the log and retry' : 'None' },
          { label: 'Opted out', value: m.optOuts.length, note: 'Never messaged' },
        ]}
      />

      <section className="bg-surface border border-line p-5 space-y-2 text-sm" aria-label="Status">
        <p className="flex items-start gap-2">
          {m.settings?.providerConfigured ? <CheckCircle2 className="w-5 h-5 text-accent shrink-0" aria-hidden="true" /> : <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" aria-hidden="true" />}
          <span>
            <strong className="text-ink">WhatsApp provider: </strong>
            {m.settings?.providerConfigured ? 'keys are set.' : 'not set up yet. Messages are queued but nothing is sent until the WhatsApp keys are added (see docs/patient-messages.md).'}
          </span>
        </p>
        <p className="flex items-start gap-2">
          {running ? <CheckCircle2 className="w-5 h-5 text-accent shrink-0" aria-hidden="true" /> : <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" aria-hidden="true" />}
          <span>
            <strong className="text-ink">Schedule: </strong>
            {running ? `the worker last ran ${when(m.settings?.lastRunAt)}.` : m.settings?.lastRunAt ? `the worker last ran ${when(m.settings.lastRunAt)}, so the schedule may have stopped.` : 'the worker has not run yet. It must be scheduled every 5 minutes.'}
          </span>
        </p>
      </section>

      {m.loadError && <p role="alert" className="text-sm text-rose-700 dark:text-rose-300">{m.loadError}</p>}
      {notice && (
        <div role={notice.tone === 'error' ? 'alert' : 'status'} className={`flex items-start gap-3 px-4 py-3 border ${notice.tone === 'error' ? 'bg-rose-50 border-rose-200 text-rose-900 dark:bg-rose-950/60 dark:border-rose-800 dark:text-rose-100' : 'bg-surface-accent border-line text-ink'}`}>
          {notice.tone === 'error' ? <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" /> : <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-accent" aria-hidden="true" />}
          <p className="text-sm">{notice.text}</p>
        </div>
      )}

      <section className="bg-surface border border-line p-5 grid gap-4" aria-label="Settings">
        <label className="inline-flex items-center gap-2 text-sm font-bold text-ink">
          <input type="checkbox" className="w-4 h-4" checked={form.enabled} onChange={(e) => set('enabled', e.target.checked)} />
          Send patient messages
        </label>
        <p className="text-xs text-subtle -mt-2">Off by default. While off, nothing is queued or sent.</p>

        <div className="grid gap-3 sm:grid-cols-3">
          <fieldset className="border border-line p-3 space-y-2">
            <legend className="px-1 text-sm font-bold text-ink">Appointment reminders</legend>
            <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" className="w-4 h-4" checked={form.appointmentEnabled} onChange={(e) => set('appointmentEnabled', e.target.checked)} />On</label>
            <label className="block text-xs font-medium text-muted" htmlFor="pm-hours">Hours before the appointment
              <input id="pm-hours" className={`${fieldClass} mt-1`} value={hoursText} onChange={(e) => setHoursText(e.target.value)} placeholder="24, 2" />
            </label>
          </fieldset>
          <fieldset className="border border-line p-3 space-y-2">
            <legend className="px-1 text-sm font-bold text-ink">Results reviewed</legend>
            <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" className="w-4 h-4" checked={form.resultsEnabled} onChange={(e) => set('resultsEnabled', e.target.checked)} />On</label>
            <p className="text-xs text-subtle">Sent once the doctor has reviewed all of a visit's results. It never contains a result.</p>
          </fieldset>
          <fieldset className="border border-line p-3 space-y-2">
            <legend className="px-1 text-sm font-bold text-ink">Follow-up due</legend>
            <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" className="w-4 h-4" checked={form.followupEnabled} onChange={(e) => set('followupEnabled', e.target.checked)} />On</label>
            <label className="block text-xs font-medium text-muted" htmlFor="pm-days">Days before the follow-up date
              <input id="pm-days" type="number" min={0} max={30} className={`${fieldClass} mt-1`} value={form.followupDaysBefore} onChange={(e) => set('followupDaysBefore', Math.max(0, Math.min(30, Number(e.target.value) || 0)))} />
            </label>
          </fieldset>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <label className="text-xs font-medium text-muted" htmlFor="pm-qs">Quiet hours start (Malaysia time)
            <input id="pm-qs" type="time" className={`${fieldClass} mt-1`} value={form.quietStart} onChange={(e) => set('quietStart', e.target.value)} />
          </label>
          <label className="text-xs font-medium text-muted" htmlFor="pm-qe">Quiet hours end
            <input id="pm-qe" type="time" className={`${fieldClass} mt-1`} value={form.quietEnd} onChange={(e) => set('quietEnd', e.target.value)} />
          </label>
          <label className="text-xs font-medium text-muted" htmlFor="pm-lang">Template language code
            <input id="pm-lang" className={`${fieldClass} mt-1`} value={form.languageCode} onChange={(e) => set('languageCode', e.target.value)} placeholder="en" />
          </label>
        </div>

        <div>
          <h3 className="text-sm font-bold text-ink mb-1">WhatsApp templates</h3>
          <p className="text-xs text-subtle mb-2">Create these in WhatsApp Manager and wait for approval. The name below must match exactly, and the numbered placeholders must be in this order. No clinical detail is ever sent.</p>
          <div className="grid gap-3 lg:grid-cols-3">
            {TEMPLATE_GUIDE.map((t) => (
              <div key={t.kind} className="border border-line p-3 space-y-2">
                <label className="block text-xs font-medium text-muted" htmlFor={`pm-t-${t.kind}`}>{KIND_LABEL[t.kind]} template name
                  <input id={`pm-t-${t.kind}`} className={`${fieldClass} mt-1`} value={form[t.setting]} onChange={(e) => set(t.setting, e.target.value)} />
                </label>
                <p className="text-xs text-muted whitespace-pre-wrap">{t.body}</p>
                <p className="text-2xs text-subtle">Placeholders: {t.params.map((p, i) => `{{${i + 1}}} ${p}`).join(', ')}</p>
              </div>
            ))}
          </div>
        </div>

        <div><button type="button" disabled={busy} className={primaryButton} onClick={save}>Save settings</button></div>
      </section>

      <section className="bg-surface border border-line p-5 space-y-3" aria-label="Opt-outs">
        <h3 className="text-sm font-bold text-ink">Numbers that must not be messaged</h3>
        <div className="grid gap-2 sm:grid-cols-[14rem_1fr_auto] items-end">
          <label className="text-xs font-medium text-muted" htmlFor="pm-phone">Mobile number
            <input id="pm-phone" className={`${fieldClass} mt-1`} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="012-345 6789" inputMode="tel" />
          </label>
          <label className="text-xs font-medium text-muted" htmlFor="pm-reason">Reason (optional)
            <input id="pm-reason" className={`${fieldClass} mt-1`} value={reason} onChange={(e) => setReason(e.target.value)} />
          </label>
          <button type="button" className={primaryButton} onClick={addOptOut}>Add</button>
        </div>
        {m.optOuts.length > 0 && (
          <ul className="divide-y divide-line border border-line">
            {m.optOuts.map((o) => (
              <li key={o.phone} className="px-3 py-2 text-sm flex items-center justify-between gap-2">
                <span className="tabular-nums">{maskPhone(o.phone)}{o.reason ? <span className="text-muted"> · {o.reason}</span> : null}</span>
                <button type="button" className={quietButton} onClick={async () => { report(await m.setOptOut(o.phone, false), 'Number removed from the list.'); }}>Remove</button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="bg-surface border border-line" aria-label="Message log">
        <h3 className="px-5 py-3 text-sm font-bold text-ink flex items-center gap-2 border-b border-line"><MessageCircle className="w-4 h-4" aria-hidden="true" />Message log (latest 100)</h3>
        {m.outbox.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted">Nothing queued yet.</p>
        ) : (
          <ul className="divide-y divide-line">
            {m.outbox.map((o) => (
              <li key={o.id} className="px-5 py-3 text-sm flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p><strong className="text-ink">{KIND_LABEL[o.kind]}</strong> <span className="text-muted tabular-nums">· {o.toPhone ? maskPhone(o.toPhone) : 'no number'} · {o.params[0] ?? ''}</span></p>
                  <p className="text-xs text-subtle">{o.status === 'Sent' ? `Sent ${when(o.sentAt)}` : `Due ${when(o.scheduledFor)}`}{o.attempts > 0 && o.status !== 'Sent' ? ` · attempt ${o.attempts}` : ''}{o.lastError ? ` · ${o.lastError}` : ''}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 text-xs font-bold ${o.status === 'Sent' ? 'bg-surface-accent text-accent' : o.status === 'Failed' ? 'bg-rose-100 text-rose-900 dark:bg-rose-950/60 dark:text-rose-200' : 'bg-surface-muted text-muted'}`}>{o.status}</span>
                  {o.status === 'Queued' && <button type="button" className={quietButton} onClick={async () => { report(await m.cancel(o.id), 'Message cancelled.'); }}>Cancel</button>}
                  {o.status === 'Failed' && <button type="button" className={quietButton} onClick={async () => { report(await m.retry(o.id), 'Message queued again.'); }}>Retry</button>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
