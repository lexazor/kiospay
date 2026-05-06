'use client';

import { useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';

interface CountdownTimerProps {
  expiredAt?: string | null;
  className?: string;
  onExpire?: () => void;
}

export function CountdownTimer({ expiredAt, className, onExpire }: CountdownTimerProps) {
  const target = useMemo(() => (expiredAt ? new Date(expiredAt).getTime() : null), [expiredAt]);
  const [secondsLeft, setSecondsLeft] = useState(() =>
    target ? Math.max(0, Math.floor((target - Date.now()) / 1000)) : 0,
  );

  useEffect(() => {
    if (!target) {
      setSecondsLeft(0);
      return;
    }

    const tick = () => {
      const diff = Math.max(0, Math.floor((target - Date.now()) / 1000));
      setSecondsLeft(diff);
      if (diff === 0) {
        onExpire?.();
      }
    };

    tick();
    const timer = window.setInterval(tick, 1000);

    return () => window.clearInterval(timer);
  }, [onExpire, target]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const critical = secondsLeft > 0 && secondsLeft < 300;

  return (
    <span
      className={cn(
        'inline-flex rounded-full px-3 py-1 text-xs font-semibold',
        critical ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-700',
        className,
      )}
    >
      {`${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`}
    </span>
  );
}