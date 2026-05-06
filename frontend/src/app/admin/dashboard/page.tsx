'use client';

import { BellRing, CreditCard, DollarSign, Users } from 'lucide-react';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageTransition } from '@/components/layouts/page-transition';
import { Card } from '@/components/ui/card';
import { api } from '@/lib/api';
import { formatRupiah } from '@/lib/utils';
import { useWebSocket } from '@/hooks/useWebSocket';
import { toast } from 'sonner';

interface DashboardPayload {
  stats: {
    totalUsers: number;
    totalTransactionsToday: number;
    totalDepositsToday: string;
    totalRevenue: string;
    pendingDeposits: number;
  };
  recentOrders: Array<{
    id: string;
    total: string;
    status: string;
    user: { username: string };
    product: { name: string };
  }>;
  recentDeposits: Array<{
    id: string;
    transferAmount: string;
    status: string;
    user: { username: string };
    paymentMethod: { name: string };
  }>;
}

export default function AdminDashboardPage() {
  const query = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => api.get<DashboardPayload>('/admin/dashboard'),
    refetchInterval: 10000,
  });

  useWebSocket({
    onAdminDepositNew: () => {
      toast.info('Deposit baru masuk, silakan cek menu Deposit.');
      void query.refetch();
    },
  });

  useEffect(() => {
    void query.refetch();
  }, []);

  const stats = query.data?.stats;

  return (
    <PageTransition>
      <header className="mb-4">
        <h1 className="text-2xl font-semibold">Dashboard Admin</h1>
        <p className="text-sm text-slate-500">Ringkasan pengguna, transaksi, dan deposit pending.</p>
      </header>

      <section className="grid gap-3 md:grid-cols-4">
        <Card className="rounded-2xl p-4">
          <div className="flex items-center gap-2 text-slate-500">
            <Users className="h-4 w-4" />
            <p className="text-xs">Total User</p>
          </div>
          <p className="mt-2 text-2xl font-semibold">{stats?.totalUsers ?? 0}</p>
        </Card>

        <Card className="rounded-2xl p-4">
          <div className="flex items-center gap-2 text-slate-500">
            <CreditCard className="h-4 w-4" />
            <p className="text-xs">Transaksi Hari Ini</p>
          </div>
          <p className="mt-2 text-2xl font-semibold">{stats?.totalTransactionsToday ?? 0}</p>
        </Card>

        <Card className="rounded-2xl p-4">
          <div className="flex items-center gap-2 text-slate-500">
            <DollarSign className="h-4 w-4" />
            <p className="text-xs">Deposit Hari Ini</p>
          </div>
          <p className="mt-2 text-xl font-semibold">{formatRupiah(stats?.totalDepositsToday ?? '0')}</p>
        </Card>

        <Card className="rounded-2xl p-4">
          <div className="flex items-center gap-2 text-slate-500">
            <BellRing className="h-4 w-4" />
            <p className="text-xs">Deposit Pending</p>
          </div>
          <p className="mt-2 text-2xl font-semibold text-amber-600">{stats?.pendingDeposits ?? 0}</p>
        </Card>
      </section>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Card className="rounded-2xl p-4">
          <h2 className="mb-3 text-sm font-semibold">Order Terbaru</h2>
          <div className="space-y-2">
            {query.data?.recentOrders.map((item) => (
              <div key={item.id} className="rounded-xl bg-slate-50 px-3 py-2 text-xs">
                {item.user.username} • {item.product.name} • {formatRupiah(item.total)} • {item.status}
              </div>
            ))}
          </div>
        </Card>

        <Card className="rounded-2xl p-4">
          <h2 className="mb-3 text-sm font-semibold">Deposit Terbaru</h2>
          <div className="space-y-2">
            {query.data?.recentDeposits.map((item) => (
              <div key={item.id} className="rounded-xl bg-slate-50 px-3 py-2 text-xs">
                {item.user.username} • {item.paymentMethod.name} • {formatRupiah(item.transferAmount)} • {item.status}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </PageTransition>
  );
}