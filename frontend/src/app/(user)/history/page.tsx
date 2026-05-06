'use client';

import { useMemo, useState } from 'react';
import { ArrowDownCircle, Clock3, ShoppingBag } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { PageTransition } from '@/components/layouts/page-transition';
import { api } from '@/lib/api';
import { formatRupiah } from '@/lib/utils';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';

type TxType = 'ALL' | 'ORDER' | 'DEPOSIT';

interface TxItem {
  id: string;
  type: 'ORDER' | 'DEPOSIT' | 'ADJUSTMENT';
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  amount: string;
  description?: string;
  createdAt: string;
}

export default function HistoryPage() {
  const [tab, setTab] = useState<TxType>('ALL');

  const txQuery = useQuery({
    queryKey: ['transactions', tab],
    queryFn: () =>
      api.get<TxItem[]>(
        tab === 'ALL' ? '/users/me/transactions' : `/users/me/transactions?type=${tab}`,
      ),
  });

  const items = useMemo(() => txQuery.data ?? [], [txQuery.data]);

  return (
    <PageTransition>
      <header className="mb-4">
        <h1 className="text-xl font-semibold">Riwayat Transaksi</h1>
        <p className="text-sm text-slate-500">Order, deposit, dan update status secara realtime.</p>
      </header>

      <Tabs value={tab} onValueChange={(value) => setTab(value as TxType)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="ALL">Semua</TabsTrigger>
          <TabsTrigger value="ORDER">Order</TabsTrigger>
          <TabsTrigger value="DEPOSIT">Deposit</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="mt-4 space-y-3">
        {items.map((item) => {
          const isIn = Number(item.amount) > 0;
          const Icon = item.type === 'DEPOSIT' ? ArrowDownCircle : ShoppingBag;
          const statusColor =
            item.status === 'SUCCESS'
              ? 'bg-green-100 text-green-700'
              : item.status === 'PENDING'
                ? 'bg-amber-100 text-amber-700'
                : 'bg-red-100 text-red-700';

          return (
            <Card key={item.id} className="rounded-2xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-slate-100 p-2">
                    <Icon className="h-4 w-4 text-slate-700" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{item.description ?? item.type}</p>
                    <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                      <Clock3 className="h-3 w-3" />
                      <span>{new Date(item.createdAt).toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <p className={`text-sm font-semibold ${isIn ? 'text-green-600' : 'text-red-500'}`}>
                    {formatRupiah(item.amount)}
                  </p>
                  <span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusColor}`}>
                    {item.status}
                  </span>
                </div>
              </div>
            </Card>
          );
        })}

        {items.length === 0 ? (
          <Card className="rounded-2xl p-6 text-center text-sm text-slate-500">
            Belum ada transaksi.
          </Card>
        ) : null}
      </div>
    </PageTransition>
  );
}