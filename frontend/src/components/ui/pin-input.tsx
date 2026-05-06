'use client';

import { useMemo, useRef } from 'react';
import { cn } from '@/lib/utils';

interface PinInputProps {
  value: string;
  onChange: (next: string) => void;
  length?: number;
  className?: string;
}

export function PinInput({ value, onChange, length = 6, className }: PinInputProps) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = useMemo(
    () => Array.from({ length }, (_, idx) => value[idx] ?? ''),
    [length, value],
  );

  const setDigit = (index: number, char: string) => {
    const numeric = char.replace(/\D/g, '').slice(-1);
    const next = digits.map((item, idx) => (idx === index ? numeric : item)).join('');
    onChange(next.slice(0, length));

    if (numeric && index < length - 1) {
      refs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && !digits[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  };

  return (
    <div className={cn('flex items-center justify-between gap-2', className)}>
      {digits.map((digit, index) => (
        <input
          key={`pin-${index}`}
          ref={(element) => {
            refs.current[index] = element;
          }}
          type="password"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="one-time-code"
          maxLength={1}
          value={digit}
          onChange={(event) => setDigit(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          className="h-14 w-12 rounded-2xl border border-slate-200 bg-white text-center text-xl font-semibold tracking-wide outline-none focus:border-[#6c3aea] focus:ring-2 focus:ring-[#6c3aea]/20"
        />
      ))}
    </div>
  );
}