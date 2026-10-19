import React, { useEffect, useId, useRef, useState } from 'react';
import { MoreVertical } from 'lucide-react';

export interface ActionMenuItem {
  label: string;
  icon?: React.ReactNode;
  onSelect: (e: React.MouseEvent) => void;
}

interface ActionMenuProps {
  /** Accessible name for the trigger, e.g. "More actions for Nur Farhana". */
  label: string;
  items: ActionMenuItem[];
  className?: string;
}

/**
 * Small overflow menu for secondary row actions. Opens with click, Enter, Space or Arrow Down;
 * Arrow keys move between items, Escape closes and returns focus to the trigger.
 */
export default function ActionMenu({ label, items, className = '' }: ActionMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    // Move focus into the menu when it opens.
    rootRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  const close = (returnFocus: boolean) => {
    setOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  };

  const onMenuKeyDown = (e: React.KeyboardEvent) => {
    const els = Array.from<HTMLElement>(rootRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []);
    const i = els.indexOf(document.activeElement as HTMLElement);
    if (e.key === 'Escape') {
      e.preventDefault();
      close(true);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      els[(i + 1) % els.length]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      els[(i - 1 + els.length) % els.length]?.focus();
    } else if (e.key === 'Tab') {
      setOpen(false);
    }
  };

  return (
    <div ref={rootRef} className={`relative ${className}`} onKeyDown={open ? onMenuKeyDown : undefined}>
      <button
        ref={triggerRef}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' && !open) {
            e.preventDefault();
            setOpen(true);
          }
        }}
        className="w-11 h-11 bg-surface text-ink border border-line flex items-center justify-center hover:bg-surface-accent transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
      >
        <MoreVertical className="w-4 h-4" aria-hidden="true" />
      </button>
      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label={label}
          className="absolute right-0 top-full mt-1 z-30 min-w-[11rem] bg-surface border border-line shadow-lg py-1"
        >
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              onClick={(e) => {
                item.onSelect(e);
                close(true);
              }}
              className="w-full px-3 py-2.5 text-left text-sm font-semibold text-ink flex items-center gap-2 hover:bg-surface-accent focus:bg-surface-accent focus-visible:outline-none cursor-pointer"
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
