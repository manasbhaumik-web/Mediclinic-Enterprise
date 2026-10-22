import React from 'react';

export { inputClass, errorMessage, toneClass, myr } from '../payroll/shared';

export const todayStr = () => new Date().toISOString().slice(0, 10);

export const fmtDate = (iso: string | null | undefined) => (iso ? new Date(iso).toLocaleString('en-MY', { dateStyle: 'medium', timeStyle: 'short' }) : '–');

/** A centred modal. Closing is by the buttons the caller provides, or Escape. */
export function Dialog({ title, onClose, children, wide = false }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  React.useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);
  return (
    <div role="dialog" aria-modal="true" aria-label={title} className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className={`bg-surface border border-line w-full ${wide ? 'max-w-3xl' : 'max-w-lg'} max-h-[90vh] overflow-y-auto p-5 space-y-3`}>
        <h3 className="type-heading-caps text-ink">{title}</h3>
        {children}
      </div>
    </div>
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
  return <p role={ok ? 'status' : 'alert'} className={`text-xs font-bold whitespace-pre-line ${ok ? 'text-emerald-700' : 'text-rose-700'}`}>{children}</p>;
}
