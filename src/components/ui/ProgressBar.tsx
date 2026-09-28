import React from 'react';

type Tone = 'primary' | 'success' | 'warning' | 'danger';

interface ProgressBarProps {
  /** 0–100 */
  value: number;
  tone?: Tone;
  size?: 'sm' | 'md';
  pill?: boolean;
  pulse?: boolean;
  label?: string;
  className?: string;
}

/** Shared progress bar. All styling lives in the `.progress*` classes in index.css. */
export function ProgressBar({ value, tone = 'primary', size = 'md', pill = false, pulse = false, label, className = '' }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
  const classes = ['progress', `progress-${size}`, `progress-${tone}`, pill && 'progress-pill', pulse && 'progress-pulse', className]
    .filter(Boolean)
    .join(' ');
  return <progress className={classes} value={clamped} max={100} aria-label={label} />;
}

export default ProgressBar;
