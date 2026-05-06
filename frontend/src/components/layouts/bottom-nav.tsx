'use client';

import { useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Bell, Clock3, Home, PlusCircle, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const items = [
  { label: 'Beranda', href: '/dashboard', icon: Home },
  { label: 'Riwayat', href: '/history', icon: Clock3 },
  { label: 'Deposit', href: '/deposit', icon: PlusCircle, emphasize: true },
  { label: 'Notif', href: '/notifications', icon: Bell },
  { label: 'Profil', href: '/profile', icon: User },
];

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  const active = useMemo(() => {
    return items.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))?.href;
  }, [pathname]);

  return (
    <nav className="fixed bottom-4 left-1/2 z-30 w-[calc(100%-1.25rem)] max-w-[410px] -translate-x-1/2 rounded-[24px] border border-slate-200/70 bg-white/95 px-3 py-2 shadow-lg backdrop-blur">
      <ul className="grid grid-cols-5 gap-1">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.href;
          return (
            <li key={item.href}>
              <button
                type="button"
                onClick={() => router.push(item.href)}
                className={cn(
                  'flex w-full flex-col items-center justify-center gap-1 rounded-2xl py-1.5 text-[11px] transition',
                  isActive ? 'text-[#6c3aea]' : 'text-slate-500 hover:text-slate-800',
                )}
              >
                <Icon
                  className={cn(
                    item.emphasize
                      ? 'h-7 w-7 rounded-full bg-[#6c3aea] p-1 text-white'
                      : 'h-5 w-5',
                  )}
                />
                <span>{item.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}