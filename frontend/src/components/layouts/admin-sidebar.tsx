'use client';

import { usePathname, useRouter } from 'next/navigation';
import {
  Boxes,
  CreditCard,
  LayoutDashboard,
  ListChecks,
  Package,
  Settings,
  Users,
  Wallet,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const menu = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Kategori', href: '/admin/categories', icon: Boxes },
  { label: 'Layanan', href: '/admin/services', icon: ListChecks },
  { label: 'Produk', href: '/admin/products', icon: Package },
  { label: 'Deposit', href: '/admin/deposits', icon: Wallet },
  { label: 'Transaksi', href: '/admin/transactions', icon: CreditCard },
  { label: 'Pengguna', href: '/admin/users', icon: Users },
  { label: 'Metode Bayar', href: '/admin/payment-methods', icon: Wallet },
  { label: 'Pengaturan', href: '/admin/settings', icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <aside className="w-64 shrink-0 border-r border-slate-200 bg-white p-4">
      <div className="mb-6 rounded-2xl bg-[#6c3aea] p-4 text-white">
        <p className="text-sm">KiosPay Admin</p>
        <p className="text-xs text-white/80">Control Center</p>
      </div>
      <nav className="space-y-1">
        {menu.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <button
              key={item.href}
              type="button"
              onClick={() => router.push(item.href)}
              className={cn(
                'flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm transition',
                active
                  ? 'bg-[#6c3aea]/10 text-[#6c3aea]'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}