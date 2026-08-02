import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
  key?: React.Key | string | number;
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }: CardProps) {
  return (
    <div className={`px-6 py-5 border-b border-slate-100 ${className}`}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '' }: CardProps) {
  return (
    <h3 className={`font-bold text-lg text-slate-800 tracking-tight ${className}`}>
      {children}
    </h3>
  );
}

export function CardDescription({ children, className = '' }: CardProps) {
  return (
    <p className={`text-sm text-slate-500 mt-1 ${className}`}>
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
    <div className={`px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center ${className}`}>
      {children}
    </div>
  );
}
