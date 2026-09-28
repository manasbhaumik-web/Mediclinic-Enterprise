import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
  key?: React.Key | string | number;
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`bg-surface dark:bg-night-900 rounded-none border border-line-subtle dark:border-teal-800/40 shadow-xs overflow-hidden ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }: CardProps) {
  return (
    <div className={`px-6 py-5 border-b border-line-subtle dark:border-teal-800/40 bg-surface-muted dark:bg-night-850 ${className}`}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '' }: CardProps) {
  return (
    <h3 className={`type-heading-caps text-ink dark:text-teal-300 ${className}`}>
      {children}
    </h3>
  );
}

export function CardDescription({ children, className = '' }: CardProps) {
  return (
    <p className={`text-xs text-slate-600 dark:text-slate-300 mt-1 font-medium ${className}`}>
      {children}
    </p>
  );
}

export function CardContent({ children, className = '' }: CardProps) {
  return (
    <div className={`p-6 ${className}`}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = '' }: CardProps) {
  return (
    <div className={`px-6 py-4 bg-surface-muted dark:bg-night-850 border-t border-line-subtle dark:border-teal-800/40 flex items-center ${className}`}>
      {children}
    </div>
  );
}
