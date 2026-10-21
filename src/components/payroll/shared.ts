export const inputClass =
  'w-full px-3 py-2 bg-surface border border-line-subtle rounded-none text-xs font-medium text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/30';
export const myr = (n: number | undefined | null) =>
  `RM${(n ?? 0).toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export const errorMessage = (e: unknown) => (e instanceof Error ? e.message : 'Something went wrong.');
export const toneClass: Record<'idle' | 'info' | 'warn' | 'ok' | 'bad', string> = {
  ok: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  warn: 'bg-amber-100 text-amber-800 border-amber-300',
  bad: 'bg-rose-100 text-rose-800 border-rose-300',
  info: 'bg-sky-100 text-sky-800 border-sky-300',
  idle: 'bg-slate-100 text-slate-600 border-slate-300',
};
