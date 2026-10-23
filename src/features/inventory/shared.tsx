import React from 'react';

export { inputClass, errorMessage, toneClass, myr } from '../payroll/shared';
import { inputClass } from '../payroll/shared';

export const todayStr = () => new Date().toISOString().slice(0, 10);

export const fmtDate = (iso: string | null | undefined) => (iso ? new Date(iso).toLocaleString('en-MY', { dateStyle: 'medium', timeStyle: 'short' }) : '–');

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * A centred modal. Focus moves into it on open, Tab stays inside it, Escape closes it,
 * and focus returns to whatever opened it. Closing is otherwise by the buttons the caller provides.
 */
export function Dialog({ title, onClose, children, wide = false }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  const panel = React.useRef<HTMLDivElement>(null);
  const closeRef = React.useRef(onClose);
  closeRef.current = onClose;
  const titleId = React.useId();

  React.useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const node = panel.current;
    (node?.querySelector<HTMLElement>('input:not([disabled]), select:not([disabled]), textarea:not([disabled])') ?? node?.querySelector<HTMLElement>(FOCUSABLE) ?? node)?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); closeRef.current(); return; }
      if (e.key !== 'Tab' || !node) return;
      const items = Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (items.length === 0) { e.preventDefault(); return; }
      const first = items[0], last = items[items.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === node)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); opener?.focus?.(); };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-night-950/70 backdrop-blur-xs flex items-center justify-center p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={panel} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={titleId} className={`bg-surface border border-line w-full ${wide ? 'max-w-3xl' : 'max-w-lg'} max-h-[90vh] overflow-y-auto p-5 space-y-3 shadow-2xl focus:outline-none`}>
        <h3 id={titleId} className="type-heading-caps text-ink">{title}</h3>
        {children}
      </div>
    </div>
  );
}

/** Asks for a written reason before a consequential action (retire a drug, cancel an order). */
export function ReasonDialog({ title, message, confirmLabel, reasonLabel = 'Reason', busy = false, onConfirm, onClose }: {
  title: string; message: string; confirmLabel: string; reasonLabel?: string; busy?: boolean; onConfirm: (reason: string) => void; onClose: () => void;
}) {
  const [reason, setReason] = React.useState('');
  const [err, setErr] = React.useState<string | null>(null);
  const submit = () => {
    if (!reason.trim()) { setErr('A reason is required. It is kept in the history.'); return; }
    onConfirm(reason.trim());
  };
  return (
    <Dialog title={title} onClose={onClose}>
      <p className="text-xs text-muted">{message}</p>
      <Field label={reasonLabel}>
        <input className={inputClass} value={reason} onChange={(e) => { setReason(e.target.value); setErr(null); }} onKeyDown={(e) => { if (e.key === 'Enter') submit(); }} aria-invalid={!!err} />
      </Field>
      {err && <Notice ok={false}>{err}</Notice>}
      <div className="flex justify-end gap-2">
        <button type="button" className="btn-secondary" onClick={onClose}>Keep it</button>
        <button type="button" className="btn-danger" onClick={submit} disabled={busy}>{confirmLabel}</button>
      </div>
    </Dialog>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-2xs font-bold uppercase tracking-wider text-subtle">{label}</span>
      {children}
    </label>
  );
}

export function Notice({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return <p role={ok ? 'status' : 'alert'} className={`${ok ? 'chip-ok' : 'chip-danger'} block w-full px-3 py-2 text-xs font-bold whitespace-pre-line`}>{children}</p>;
}
