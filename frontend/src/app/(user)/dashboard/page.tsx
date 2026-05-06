'use client';

import { useMemo } from 'react';
import { ArrowDownCircle, History, Home, Wallet } from 'lucide-react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { formatRupiah } from '@/lib/utils';
import { PageTransition } from '@/components/layouts/page-transition';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import type { Category, SessionUser } from '@/types/api';

export default function DashboardPage() {
  const router = useRouter();

  const meQuery = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get<SessionUser>('/users/me'),
  });

  const categoryQuery = useQuery({
    queryKey: ['categories-public'],
    queryFn: () => api.get<Category[]>('/categories/public'),
  });

  const balance = useMemo(() => meQuery.data?.balance ?? '0', [meQuery.data?.balance]);

  return (
    <PageTransition>
      <header className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">KiosPay</p>
          <h1 className="text-xl font-semibold">Beranda</h1>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm">
          <Home className="h-5 w-5 text-[#6c3aea]" />
        </div>
      </header>

      <motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 220, damping: 20 }}
        className="relative overflow-hidden rounded-[26px] bg-gradient-to-br from-[#6c3aea] via-[#7b49ef] to-[#8c64ff] p-5 text-white shadow-lg"
      >
        <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/15 blur-2xl" />
        <div className="absolute -left-16 bottom-0 h-36 w-36 rounded-full bg-blue-200/20 blur-xl" />
        <div className="relative">
          <p className="text-sm text-white/80">Saldo Akun</p>
          <h2 className="mt-1 text-3xl font-semibold">{formatRupiah(balance)}</h2>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Button
              className="bg-white/20 text-white hover:bg-white/30"
              variant="ghost"
              onClick={() => router.push('/deposit')}
            >
              <ArrowDownCircle className="h-4 w-4" />
              Deposit
            </Button>
            <Button
              className="bg-white/20 text-white hover:bg-white/30"
              variant="ghost"
              onClick={() => router.push('/history')}
            >
              <History className="h-4 w-4" />
              Riwayat
            </Button>
          </div>
        </div>
      </motion.section>

      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-semibold">Layanan</h3>
          <Wallet className="h-4 w-4 text-slate-400" />
        </div>

        {categoryQuery.isLoading ? (
          <div className="grid grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, idx) => (
              <Skeleton key={idx} className="h-24 rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-3">
            {categoryQuery.data?.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => router.push(`/order/${category.slug}`)}
                className="ios-card relative flex h-24 flex-col items-center justify-center gap-2 rounded-2xl p-2 text-center"
              >
                {category.badge ? <Badge className="absolute right-1 top-1">{category.badge}</Badge> : null}
                <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-[#f0ebff]">
                  {category.imageUrl ? (
                    <Image
                      src={category.imageUrl}
                      alt={category.name}
                      width={36}
                      height={36}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Wallet className="h-4 w-4 text-[#6c3aea]" />
                  )}
                </div>
                <span className="line-clamp-2 text-[11px] font-medium text-slate-700">{category.name}</span>
              </button>
            ))}
          </div>
        )}
      </section>

      <Card className="mt-6 rounded-2xl p-4">
        <p className="text-sm text-slate-500">
          Semua nominal menggunakan format Rupiah Indonesia dan status transaksi akan update realtime.
        </p>
      </Card>
    </PageTransition>
  );
}