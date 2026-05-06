'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CircleAlert } from 'lucide-react';
import { PageTransition } from '@/components/layouts/page-transition';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { formatRupiah } from '@/lib/utils';

const quickAmounts = [10000, 20000, 50000, 100000, 200000, 500000];

export default function DepositPage() {
  const router = useRouter();
  const [amount, setAmount] = useState('');

  const numeric = useMemo(() => Number(amount.replace(/\D/g, '')) || 0, [amount]);

  return (
    <PageTransition>
      <header className="mb-4">
        <h1 className="text-xl font-semibold">Deposit Saldo</h1>
        <p className="text-sm text-slate-500">Step 1: Tentukan nominal deposit.</p>
      </header>

      <Card className="rounded-3xl p-5">
        <label className="mb-2 block text-sm font-medium text-slate-700">Nominal</label>
        <Input
          value={numeric ? formatRupiah(numeric) : ''}
          placeholder="Rp0"
          onChange={(event) => {
            const digits = event.target.value.replace(/\D/g, '');
            setAmount(digits);
          }}
        />

        <div className="mt-4 grid grid-cols-2 gap-2">
          {quickAmounts.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setAmount(String(value))}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700"
            >
              {formatRupiah(value)}
            </button>
          ))}
        </div>

        <div className="mt-4 rounded-2xl bg-slate-50 p-3 text-xs text-slate-500">
          <div className="flex items-start gap-2">
            <CircleAlert className="mt-0.5 h-3.5 w-3.5" />
            <p>Minimal dan maksimal nominal akan divalidasi lagi setelah memilih metode pembayaran.</p>
          </div>
        </div>

        <Button
          className="mt-4 w-full"
          disabled={!numeric}
          onClick={() => router.push(`/deposit/method?amount=${numeric}`)}
        >
          Lanjut
        </Button>
      </Card>
    </PageTransition>
  );
}