import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
  key?: React.Key | string | number;
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`bg-[#f7fdfd] dark:bg-[#07252d] rounded-none border border-[#ccfbf1] dark:border-teal-800/40 shadow-xs overflow-hidden ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }: CardProps) {
  return (
    <div className={`px-6 py-5 border-b border-[#ccfbf1] dark:border-teal-800/40 bg-[#f0fdfa] dark:bg-[#082830] ${className}`}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '' }: CardProps) {
  return (
    <h3 className={`font-black text-lg text-[#0f3c4c] dark:text-[#5eead4] tracking-tight uppercase ${className}`}>
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
    <div className={`px-6 py-4 bg-[#f0fdfa] dark:bg-[#082830] border-t border-[#ccfbf1] dark:border-teal-800/40 flex items-center ${className}`}>
      {children}
    </div>
  );
}
