import type { KeyboardEvent } from 'react';

/**
 * Props that make a non-button element (a clickable card or list row) behave like a button:
 * focusable, announced as a button, and activated with Enter or Space.
 * Key presses that originate from a nested control are ignored so inner buttons keep working.
 */
export function buttonProps(onActivate: () => void, pressed?: boolean) {
  return {
    role: 'button' as const,
    tabIndex: 0,
    onClick: onActivate,
    onKeyDown: (e: KeyboardEvent<HTMLElement>) => {
      if (e.target !== e.currentTarget) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onActivate();
      }
    },
    ...(pressed === undefined ? {} : { 'aria-pressed': pressed }),
  };
}

export const focusRing =
  'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand focus-visible:border-brand';
