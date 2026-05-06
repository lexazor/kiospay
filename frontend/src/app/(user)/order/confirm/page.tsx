'use client';

import { Suspense, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';
import { PageTransition } from '@/components/layouts/page-transition';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api, ApiError } from '@/lib/api';
import { formatRupiah } from '@/lib/utils';
import { toast } from 'sonner';
import { SuccessOrderCard } from '@/components/user/success-order-card';
import type { SessionUser } from '@/types/api';

function ConfirmOrderContent() {
  const router = useRouter();
  const params = useSearchParams();

  const productId = params.get('productId') ?? '';
  const serviceName = params.get('service') ?? '';
  const customerDataRaw = params.get('customerData') ?? '{}';
  const total = Number(params.get('price') ?? 0);

  const [paid, setPaid] = useState(false);

  const meQuery = useQuery({
    queryKey: ['me-confirm'],
    queryFn: () => api.get<SessionUser>('/users/me'),
  });

  const createOrderMutation = useMutation({
    mutationFn: () => {
      let customerData = {} as Record<string, string>;

      try {
        customerData = JSON.parse(decodeURIComponent(customerDataRaw)) as Record<string, string>;
      } catch {
        customerData = {};
      }

      return api.post('/orders', {
        productId,
        customerData: Object.entries(customerData).map(([key, value]) => ({ key, value })),
        fee: 0,
      });
    },
    onSuccess: () => {
      toast.success('Pembayaran berhasil diproses.');
      setPaid(true);
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'Gagal memproses order.');
    },
  });

  const balance = Number(meQuery.data?.balance ?? 0);
  const remaining = useMemo(() => balance - total, [balance, total]);
  const enough = remaining >= 0;

  if (paid) {
    return (
      <PageTransition>
        <SuccessOrderCard
          title="Transaksi Berhasil"
          subtitle="Pesanan kamu sedang diproses. Status order akan update realtime."
        />

        <Button className="mt-4 w-full" onClick={() => router.push('/history')}>
          Lihat Riwayat
        </Button>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <header className="mb-4">
        <h1 className="text-xl font-semibold">Konfirmasi Pembayaran</h1>
        <p className="text-sm text-slate-500">Step 4: Bayar menggunakan saldo akun.</p>
      </header>

      <Card className="rounded-3xl p-5">
        <div className="space-y-3">
          <div>
            <p className="text-xs text-slate-500">Layanan</p>
            <p className="text-sm font-semibold text-slate-900">{serviceName || '-'}</p>
          </div>

          <div>
            <p className="text-xs text-slate-500">Total</p>
            <p className="text-lg font-semibold text-[#6c3aea]">{formatRupiah(total)}</p>
          </div>

          <div className="rounded-2xl bg-slate-50 p-3">
            <p className="text-xs text-slate-500">Metode Pembayaran</p>
            <p className="text-sm font-semibold text-slate-900">Saldo Akun</p>
            {enough ? (
              <p className="mt-1 text-xs text-green-600">
                Saldo tersisa setelah bayar: {formatRupiah(remaining)}
              </p>
            ) : (
              <p className="mt-1 text-xs text-red-600">
                Saldo tidak mencukupi, kurang {formatRupiah(Math.abs(remaining))}
              </p>
            )}
          </div>
        </div>
      </Card>

      <Button
        className="mt-4 w-full"
        disabled={!enough || !productId}
        loading={createOrderMutation.isPending}
        onClick={() => createOrderMutation.mutate()}
      >
        <CheckCircle2 className="h-4 w-4" />
        Bayar
      </Button>
    </PageTransition>
  );
}

export default function ConfirmOrderPage() {
  return (
    <Suspense fallback={<Card className="rounded-2xl p-5 text-sm text-slate-500">Memuat halaman...</Card>}>
      <ConfirmOrderContent />
    </Suspense>
  );
}