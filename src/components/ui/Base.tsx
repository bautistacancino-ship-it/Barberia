import React, { ReactNode, ComponentPropsWithoutRef } from 'react';
import { cn } from '../../lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
  [key: string]: any;
}

export function Button({ 
  variant = 'primary', 
  size = 'md', 
  className, 
  children, 
  ...props 
}: ButtonProps) {
  const variants = {
    primary: 'bg-brand-900 text-white hover:bg-brand-800 shadow-sm',
    secondary: 'bg-brand-100 text-brand-900 hover:bg-brand-200',
    outline: 'border border-brand-200 text-brand-900 hover:bg-brand-50',
    ghost: 'text-brand-600 hover:text-brand-900 hover:bg-brand-50',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg font-medium',
  };

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-full transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Card({ className, children, ...props }: { className?: string; children: ReactNode; [key: string]: any }) {
  return (
    <div className={cn('bg-white rounded-3xl p-6 shadow-sm border border-brand-100', className)} {...props}>
      {children}
    </div>
  );
}
