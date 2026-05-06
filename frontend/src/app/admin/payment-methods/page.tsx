'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { PageTransition } from '@/components/layouts/page-transition';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { api, ApiError } from '@/lib/api';
import { formatRupiah } from '@/lib/utils';
import { toast } from 'sonner';

interface PaymentMethod {
  id: string;
  name: string;
  accountNumber: string;
  accountName: string;
  minDeposit: string;
  maxDeposit: string;
  expiryMinutes: number;
  uniqueCodeEnabled: boolean;
  status: boolean;
}

export default function AdminPaymentMethodsPage() {
  const [name, setName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [minDeposit, setMinDeposit] = useState('10000');
  const [maxDeposit, setMaxDeposit] = useState('1000000');
  const [expiryMinutes, setExpiryMinutes] = useState('30');
  const [uniqueCodeEnabled, setUniqueCodeEnabled] = useState(false);

  const query = useQuery({
    queryKey: ['admin-payment-methods'],
    queryFn: () => api.get<PaymentMethod[]>('/payment-methods/admin'),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      api.post('/payment-methods/admin', {
        name,
        accountNumber,
        accountName,
        minDeposit: Number(minDeposit),
        maxDeposit: Number(maxDeposit),
        expiryMinutes: Number(expiryMinutes),
        uniqueCodeEnabled,
        status: true,
      }),
    onSuccess: () => {
      setName('');
      setAccountNumber('');
      setAccountName('');
      toast.success('Metode pembayaran ditambahkan.');
      void query.refetch();
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'Gagal menambah metode pembayaran.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/payment-methods/admin/${id}`),
    onSuccess: () => {
      toast.success('Metode pembayaran dihapus.');
      void query.refetch();
    },
  });

  return (
    <PageTransition>
      <header className="mb-4">
        <h1 className="text-2xl font-semibold">Metode Pembayaran</h1>
        <p className="text-sm text-slate-500">CRUD metode deposit manual dengan min/max dan expired.</p>
      </header>

      <Card className="mb-4 rounded-2xl p-4">
        <div className="grid gap-3 md:grid-cols-4">
          <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Nama metode" />
          <Input
            value={accountNumber}
            onChange={(event) => setAccountNumber(event.target.value)}
            placeholder="Nomor akun"
          />
          <Input
            value={accountName}
            onChange={(event) => setAccountName(event.target.value)}
            placeholder="Nama pemilik"
          />
          <Input
            type="number"
            value={minDeposit}
            onChange={(event) => setMinDeposit(event.target.value)}
            placeholder="Min"
          />
          <Input
            type="number"
            value={maxDeposit}
            onChange={(event) => setMaxDeposit(event.target.value)}
            placeholder="Max"
          />
          <Input
            type="number"
            value={expiryMinutes}
            onChange={(event) => setExpiryMinutes(event.target.value)}
            placeholder="Expired menit"
          />
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={uniqueCodeEnabled}
              onChange={(event) => setUniqueCodeEnabled(event.target.checked)}
            />
            Kode unik 3 digit
          </label>
          <Button loading={createMutation.isPending} onClick={() => createMutation.mutate()}>
            <Plus className="h-4 w-4" />
            Tambah
          </Button>
        </div>
      </Card>

      <Card className="rounded-2xl p-4">
        <div className="space-y-2">
          {query.data?.map((item) => (
            <div key={item.id} className="flex items-center justify-between rounded-xl border border-slate-100 p-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                <p className="text-xs text-slate-500">
                  {item.accountNumber} • Min {formatRupiah(item.minDeposit)} • Max {formatRupiah(item.maxDeposit)}
                </p>
              </div>
              <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(item.id)}>
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          ))}
        </div>
      </Card>
    </PageTransition>
  );
}