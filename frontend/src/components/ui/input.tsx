'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={cn(
        'h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none ring-0 transition placeholder:text-slate-400 focus:border-[#6c3aea] focus:ring-2 focus:ring-[#6c3aea]/20',
        className,
      )}
      {...props}
    />
  );
});

Input.displayName = 'Input';