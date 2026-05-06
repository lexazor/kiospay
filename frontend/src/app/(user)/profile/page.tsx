'use client';

import { useRouter } from 'next/navigation';
import {
  History,
  KeyRound,
  LogOut,
  MessageCircle,
  Shield,
  UserCircle2,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { PageTransition } from '@/components/layouts/page-transition';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import type { SessionUser } from '@/types/api';

const menus = [
  { icon: Shield, label: 'Ganti Password' },
  { icon: KeyRound, label: 'Ganti PIN' },
  { icon: History, label: 'Riwayat Transaksi' },
  { icon: MessageCircle, label: 'Hubungi Admin' },
];

export default function ProfilePage() {
  const router = useRouter();

  const meQuery = useQuery({
    queryKey: ['me-profile'],
    queryFn: () => api.get<SessionUser>('/users/me'),
  });

  const me = meQuery.data;
  const initials = `${me?.fullName?.[0] ?? 'U'}${me?.fullName?.split(' ')[1]?.[0] ?? ''}`;

  const logout = async () => {
    await api.post('/auth/logout');
    toast.success('Logout berhasil.');
    router.push('/login');
  };

  return (
    <PageTransition>
      <header className="mb-4">
        <h1 className="text-xl font-semibold">Profil</h1>
      </header>

      <Card className="rounded-3xl p-5">
        <div className="flex items-center gap-3">
          <Avatar className="h-14 w-14">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-base font-semibold">{me?.fullName ?? 'Pengguna'}</p>
            <p className="text-sm text-slate-500">@{me?.username ?? 'username'}</p>
          </div>
        </div>

        <div className="mt-4 space-y-2 rounded-2xl bg-slate-50 p-3 text-sm">
          <p>Email: {me?.email}</p>
          <p>WhatsApp: {me?.whatsapp}</p>
        </div>
      </Card>

      <div className="mt-4 space-y-2">
        {menus.map((menu) => (
          <button
            key={menu.label}
            type="button"
            onClick={() => {
              if (menu.label === 'Riwayat Transaksi') {
                router.push('/history');
              } else if (menu.label === 'Hubungi Admin') {
                window.open('https://wa.me/6281234567890', '_blank', 'noopener,noreferrer');
              } else {
                toast.info('Fitur akan aktif di iterasi berikutnya.');
              }
            }}
            className="ios-card flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left"
          >
            <menu.icon className="h-4 w-4 text-[#6c3aea]" />
            <span className="text-sm font-medium text-slate-700">{menu.label}</span>
          </button>
        ))}
      </div>

      <Button className="mt-4 w-full" variant="danger" onClick={logout}>
        <LogOut className="h-4 w-4" />
        Logout
      </Button>

      <Card className="mt-4 rounded-2xl p-4 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <UserCircle2 className="h-4 w-4" />
          <p>Data akun disinkronkan dengan backend secara aman menggunakan JWT + cookie httpOnly.</p>
        </div>
      </Card>
    </PageTransition>
  );
}