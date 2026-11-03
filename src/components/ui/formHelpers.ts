export const inputClass =
  'w-full px-3 py-2 bg-surface border border-line-subtle rounded-none text-xs font-medium text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/30';
export const myr = (n: number | undefined | null) =>
  `RM${(n ?? 0).toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export const errorMessage = (e: unknown) => (e instanceof Error ? e.message : 'Something went wrong.');
export const toneClass: Record<'idle' | 'info' | 'warn' | 'ok' | 'bad', string> = {
  ok: 'chip-ok',
  warn: 'chip-warn',
  bad: 'chip-danger',
  info: 'chip-info',
  idle: 'chip-neutral',
};
