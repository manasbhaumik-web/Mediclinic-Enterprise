import { useSyncExternalStore } from 'react';

export type ColorTheme = 'mint' | 'sky' | 'ice';

export const COLOR_THEMES: { id: ColorTheme; label: string }[] = [
  { id: 'mint', label: 'Ice Mint' },
  { id: 'sky', label: 'Sky Blue' },
  { id: 'ice', label: 'Ice Blue' },
];

const STORAGE_KEY = 'mediclinic.colorTheme';
const listeners = new Set<() => void>();

function readStored(): ColorTheme {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === 'mint' || v === 'sky' || v === 'ice') return v;
  } catch { /* storage unavailable */ }
  return 'mint';
}

let current: ColorTheme = readStored();

function apply(theme: ColorTheme) {
  if (theme === 'mint') delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = theme;
}

// Apply the saved theme before first paint of any component.
if (typeof document !== 'undefined') apply(current);

export function setColorTheme(theme: ColorTheme) {
  current = theme;
  apply(theme);
  try { localStorage.setItem(STORAGE_KEY, theme); } catch { /* ignore */ }
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}

/** Shared colour-theme state: every selector and consumer stays in sync. */
export function useColorTheme(): [ColorTheme, (t: ColorTheme) => void] {
  const theme = useSyncExternalStore(subscribe, () => current, () => 'mint' as ColorTheme);
  return [theme, setColorTheme];
}
