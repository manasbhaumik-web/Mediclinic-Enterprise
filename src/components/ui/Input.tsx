import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  error?: string;
  label?: string;
  className?: string;
  id?: string;
}

export default function Input({ icon, error, label, className = '', id, ...props }: InputProps) {

  const generatedId = id || Math.random().toString(36).substring(7);

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={generatedId} className="block text-sm font-bold text-slate-700 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            {icon}
          </div>
        )}
        <input
          id={generatedId}
          className={`
            w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl outline-none 
            transition-all duration-200 placeholder:text-slate-400
            focus:ring-2 focus:ring-[#0D9488]/20 focus:border-[#0D9488] focus:bg-white
            ${icon ? 'pl-10' : 'pl-4'} 
            pr-4 py-2.5 sm:text-sm
            ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : ''}
            ${className}
          `}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-1.5 text-xs font-medium text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}
