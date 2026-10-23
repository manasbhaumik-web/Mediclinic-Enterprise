import React from 'react';
import { Palette } from 'lucide-react';
import { COLOR_THEMES, ColorTheme, useColorTheme } from '../../hooks/useColorTheme';

interface ThemeSelectorProps {
  /** `menu` sits inside the workstation menus (themed in day mode, dark in Night Shift); `light` sits in light headers. */
  variant?: 'menu' | 'light';
  className?: string;
}

export default function ThemeSelector({ variant = 'light', className = '' }: ThemeSelectorProps) {
  const [theme, setTheme] = useColorTheme();

  if (variant === 'menu') {
    return (
      <div className={`flex items-center justify-between bg-surface-accent dark:bg-night-800 p-2 border border-line dark:border-teal-900/60 ${className}`}>
        <label htmlFor="color-theme-menu" className="text-ink dark:text-teal-100 font-medium flex items-center gap-1.5">
          <Palette className="w-3.5 h-3.5 text-accent dark:text-teal-200" />
          <span>Color Theme</span>
        </label>
        <select
          id="color-theme-menu"
          value={theme}
          onChange={(e) => setTheme(e.target.value as ColorTheme)}
          className="h-8 bg-surface text-ink border border-line dark:bg-night-950 dark:text-white dark:border-teal-700 px-2 text-xs font-semibold focus:outline-none focus:border-brand cursor-pointer"
        >
          {COLOR_THEMES.map((t) => (
            <option key={t.id} value={t.id}>{t.label}</option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <label htmlFor="color-theme-light" className="sr-only">Color theme</label>
      <Palette className="w-3.5 h-3.5 text-accent shrink-0" aria-hidden="true" />
      <select
        id="color-theme-light"
        value={theme}
        onChange={(e) => setTheme(e.target.value as ColorTheme)}
        title="Color theme"
        className="min-h-[44px] bg-surface text-accent border border-line-subtle px-2 text-xs font-bold hover:bg-surface-accent focus:outline-none focus:border-brand cursor-pointer"
      >
        {COLOR_THEMES.map((t) => (
          <option key={t.id} value={t.id}>{t.label}</option>
        ))}
      </select>
    </div>
  );
}
