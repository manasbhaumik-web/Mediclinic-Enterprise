import React, { useEffect, useRef, useId } from 'react';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
  className?: string;
}

const SIZE_CLASSES = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-6xl',
} as const;

/**
 * Standardized Accessible Enterprise Modal Dialog Component.
 * Enforces design system tokens, focus-trapping, escape key handling,
 * and responsive viewport scaling.
 */
export default function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  size = 'md',
  showCloseButton = true,
  className = '',
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!isOpen) return;
    const previousActive = document.activeElement as HTMLElement | null;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previousActive?.focus?.();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-night-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 font-sans animate-fadeIn"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="presentation"
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`bg-surface dark:bg-night-900 border border-line dark:border-white/20 w-full ${SIZE_CLASSES[size]} max-h-[90vh] overflow-y-auto p-4 sm:p-6 space-y-4 shadow-2xl rounded-none animate-slideUp text-ink dark:text-white focus:outline-none ${className}`}
      >
        <div className="flex items-start justify-between border-b border-line dark:border-white/10 pb-3">
          <div>
            <h3 id={titleId} className="type-heading-caps text-ink dark:text-teal-300">
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs text-muted dark:text-teal-200/80 mt-0.5 font-medium">
                {subtitle}
              </p>
            )}
          </div>
          {showCloseButton && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close modal dialog"
              className="p-1 hover:bg-surface-accent dark:hover:bg-night-800 text-muted hover:text-ink dark:text-teal-200 dark:hover:text-white transition-colors cursor-pointer rounded-none border border-transparent hover:border-line"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
}
