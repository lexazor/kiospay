'use client';

import { Suspense, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { PageTransition } from '@/components/layouts/page-transition';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api, ApiError } from '@/lib/api';
import { formatRupiah } from '@/lib/utils';
import type { PaymentMethod } from '@/types/api';
import { toast } from 'sonner';

function DepositMethodContent() {
  const router = useRouter();
  const params = useSearchParams();
  const amount = Number(params.get('amount') ?? 0);

  const [selected, setSelected] = useState<PaymentMethod | null>(null);

  const methodQuery = useQuery({
    queryKey: ['payment-methods'],
    queryFn: () => api.get<PaymentMethod[]>('/payment-methods/public'),
  });

  const createMutation = useMutation({
    mutationFn: (method: PaymentMethod) =>
      api.post<{ id: string }>('/deposits', {
        paymentMethodId: method.id,
        amount,
      }),
    onSuccess: (data) => {
      toast.success('Invoice deposit dibuat.');
      router.push(`/deposit/invoice/${data.id}`);
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'Gagal membuat deposit.');
    },
  });

  const validationError = useMemo(() => {
    if (!selected) {
      return '';
    }

    const min = Number(selected.minDeposit);
    const max = Number(selected.maxDeposit);

    if (amount < min) {
      return `Minimal deposit ${formatRupiah(min)}`;
    }

    if (amount > max) {
      return `Maksimal deposit ${formatRupiah(max)}`;
    }

    return '';
  }, [amount, selected]);

  return (
    <PageTransition>
      <header className="mb-4">
        <h1 className="text-xl font-semibold">Pilih Metode Pembayaran</h1>
        <p className="text-sm text-slate-500">Step 2: Pilih metode untuk nominal {formatRupiah(amount)}.</p>
      </header>

      <div className="space-y-3">
        {methodQuery.data?.map((method) => {
          const active = selected?.id === method.id;
          return (
            <button
              key={method.id}
              type="button"
              onClick={() => setSelected(method)}
              className={`ios-card w-full rounded-2xl border px-4 py-3 text-left ${
                active ? 'border-[#6c3aea] bg-[#f4efff]' : 'border-slate-100'
              }`}
            >
              <p className="text-sm font-semibold text-slate-900">{method.name}</p>
              <p className="text-xs text-slate-500">{method.accountNumber} | {method.accountName}</p>
              <p className="mt-1 text-[11px] text-slate-400">
                Min {formatRupiah(method.minDeposit)} | Max {formatRupiah(method.maxDeposit)}
              </p>
            </button>
          );
        })}
      </div>

      {validationError ? <p className="mt-3 text-sm text-red-500">{validationError}</p> : null}

      <Card className="mt-4 rounded-2xl p-4 text-xs text-slate-500">
        Transfer harus sesuai nominal invoice agar konfirmasi otomatis lebih cepat.
      </Card>

      <Button
        className="mt-4 w-full"
        disabled={!selected || !!validationError}
        loading={createMutation.isPending}
        onClick={() => {
          if (selected) {
            createMutation.mutate(selected);
          }
        }}
      >
        Lanjut
      </Button>
    </PageTransition>
  );
}

export default function DepositMethodPage() {
  return (
    <Suspense fallback={<Card className="rounded-2xl p-5 text-sm text-slate-500">Memuat halaman...</Card>}>
      <DepositMethodContent />
    </Suspense>
  );
}