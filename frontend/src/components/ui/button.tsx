'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading = false, children, disabled, ...props }, ref) => {
    const base =
      'inline-flex items-center justify-center gap-2 rounded-full font-medium transition disabled:opacity-60 disabled:pointer-events-none';
    const variantMap: Record<string, string> = {
      primary: 'bg-[#6c3aea] text-white shadow-sm hover:scale-[1.02]',
      outline: 'border border-slate-200 bg-white text-slate-900 hover:bg-slate-50',
      ghost: 'bg-transparent text-slate-700 hover:bg-slate-100',
      danger: 'bg-red-600 text-white hover:bg-red-500',
    };
    const sizeMap: Record<string, string> = {
      sm: 'h-9 px-4 text-sm',
      md: 'h-11 px-5 text-sm',
      lg: 'h-12 px-6 text-base',
      icon: 'h-10 w-10 p-0 rounded-full',
    };

    return (
      <button
        ref={ref}
        className={cn(base, variantMap[variant], sizeMap[size], className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/60 border-t-transparent" />
        ) : null}
        {children}
      </button>
    );
  },
);

Button.displayName = 'Button';