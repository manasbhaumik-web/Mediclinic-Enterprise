import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  className?: string;
  children?: React.ReactNode;
  disabled?: boolean;
  onClick?: React.MouseEventHandler<HTMLButtonElement> | (() => void);
  type?: 'button' | 'submit' | 'reset';
  form?: string;
  id?: string;
  key?: React.Key | string | number;
}

export default function Button({
  variant = 'primary',
  size = 'md',
  icon,
  fullWidth = false,
  className = '',
  children,
  disabled,
  ...props
}: ButtonProps) {
  
  const baseStyles = 'inline-flex items-center justify-center font-bold rounded-none transition-colors duration-200 ease-out active:scale-[0.98] outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none';
  
  const variants = {
    primary: 'bg-[#0d9488] text-white hover:bg-[#0f766e] focus:ring-[#0d9488] shadow-xs cursor-pointer',
    secondary: 'bg-[#0f3c4c] text-white hover:bg-[#082830] focus:ring-[#0f3c4c] shadow-xs cursor-pointer',
    outline: 'bg-[#f7fdfd] dark:bg-[#082830] border border-[#ccfbf1] dark:border-teal-800/40 text-slate-700 dark:text-slate-200 hover:bg-[#f0fdfa] dark:hover:bg-[#0c3844] focus:ring-[#0d9488] shadow-2xs cursor-pointer',
    danger: 'bg-rose-600 text-white hover:bg-rose-700 border border-rose-600 focus:ring-rose-500 shadow-xs cursor-pointer',
    ghost: 'bg-transparent text-slate-600 dark:text-slate-300 hover:bg-[#f0fdfa] dark:hover:bg-[#0c3844] focus:ring-[#0d9488] cursor-pointer'
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-5 py-2.5 gap-2',
    lg: 'text-base px-6 py-3.5 gap-2.5'
  };

  const classes = [
    baseStyles,
    variants[variant],
    sizes[size],
    fullWidth ? 'w-full' : '',
    className
  ].join(' ').trim();

  return (
    <button className={classes} disabled={disabled} {...props}>
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </button>
  );
}
