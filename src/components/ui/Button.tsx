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
    primary: 'bg-[#0D9488] text-white hover:bg-[#0F766E] focus:ring-[#0D9488] shadow-xs',
    secondary: 'bg-slate-800 text-white hover:bg-slate-900 focus:ring-slate-800 shadow-xs',
    outline: 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 focus:ring-slate-200 shadow-xs',
    danger: 'bg-red-600 text-white hover:bg-red-700 border border-red-600 focus:ring-red-500 shadow-xs',
    ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 focus:ring-slate-200'
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
