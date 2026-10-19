import React from 'react';
import { AlertCircle } from 'lucide-react';

interface FieldControlProps {
  id: string;
  'aria-describedby'?: string;
  'aria-invalid'?: true;
  'aria-required'?: true;
}

interface FormFieldProps {
  /** Unique id; also used by callers to move focus to the field after a failed validation. */
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  className?: string;
  /** Render the control, spreading the supplied props onto it so the label and messages are linked. */
  children: (props: FieldControlProps) => React.ReactNode;
}

const labelClass =
  'block text-2xs font-bold text-accent dark:text-teal-300 uppercase tracking-wider mb-1 font-sans';

/**
 * A labelled form control: the label is tied to the input, required fields are marked the same
 * way everywhere, and any error or hint is announced with the control.
 */
export default function FormField({ id, label, required, error, hint, className, children }: FormFieldProps) {
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ') || undefined;

  return (
    <div className={className}>
      <label htmlFor={id} className={labelClass}>
        {label}
        {required && (
          <>
            <span aria-hidden="true" className="text-rose-500"> *</span>
            <span className="sr-only"> (required)</span>
          </>
        )}
      </label>
      {children({
        id,
        'aria-describedby': describedBy,
        ...(error ? { 'aria-invalid': true as const } : {}),
        ...(required ? { 'aria-required': true as const } : {}),
      })}
      {hint && !error && (
        <p id={hintId} className="mt-1 text-xs text-slate-600">{hint}</p>
      )}
      {error && (
        <p id={errorId} role="alert" className="mt-1 text-xs font-semibold text-rose-700 flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
}

/** Border class for a control, red when it has an error. */
export const fieldBorder = (error?: string) =>
  error ? 'border-rose-500 focus:border-rose-600' : 'border-line dark:border-teal-800/60 focus:border-brand';
