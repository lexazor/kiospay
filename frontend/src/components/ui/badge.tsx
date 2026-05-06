'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export function Badge({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-semibold text-white',
        className,
      )}
      {...props}
    />
  );
}