'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { Plus, RefreshCw, ToggleLeft } from 'lucide-react';
import { useState } from 'react';
import { PageTransition } from '@/components/layouts/page-transition';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { api, ApiError } from '@/lib/api';
import { formatRupiah } from '@/lib/utils';
import { toast } from 'sonner';

interface UserItem {
  id: string;
  fullName: string;
  username: string;
  email: string;
  whatsapp: string;
  balance: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export default function AdminUsersPage() {
  const [selectedUserId, setSelectedUserId] = useState('');
  const [amount, setAmount] = useState('0');
  const [note, setNote] = useState('Penyesuaian manual');

  const query = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => api.get<UserItem[]>('/users/admin/list'),
  });

  const adjustMutation = useMutation({
    mutationFn: () =>
      api.patch(`/users/admin/${selectedUserId}/adjust-balance`, {
        amount: Number(amount),
        note,
      }),
    onSuccess: () => {
      toast.success('Saldo user berhasil diadjust.');
      void query.refetch();
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'Gagal adjust saldo.');
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'ACTIVE' | 'INACTIVE' }) =>
      api.patch(`/users/admin/${id}/status`, { status }),
    onSuccess: () => {
      toast.success('Status user diperbarui.');
      void query.refetch();
    },
  });

  return (
    <PageTransition>
      <header className="mb-4">
        <h1 className="text-2xl font-semibold">Pengguna</h1>
        <p className="text-sm text-slate-500">Kelola status user dan penyesuaian saldo manual.</p>
      </header>

      <Card className="mb-4 rounded-2xl p-4">
        <div className="grid gap-3 md:grid-cols-4">
          <select
            value={selectedUserId}
            onChange={(event) => setSelectedUserId(event.target.value)}
            className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm"
          >
            <option value="">Pilih user</option>
            {query.data?.map((user) => (
              <option key={user.id} value={user.id}>
                {user.username}
              </option>
            ))}
          </select>
          <Input
            type="number"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="Nominal (+/-)"
          />
          <Input value={note} onChange={(event) => setNote(event.target.value)} placeholder="Catatan" />
          <Button loading={adjustMutation.isPending} onClick={() => adjustMutation.mutate()}>
            <Plus className="h-4 w-4" />
            Adjust Saldo
          </Button>
        </div>
      </Card>

      <Card className="rounded-2xl p-4">
        <div className="space-y-2">
          {query.data?.map((user) => (
            <div key={user.id} className="rounded-xl border border-slate-100 p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{user.fullName}</p>
                  <p className="text-xs text-slate-500">
                    @{user.username} • {user.email} • {formatRupiah(user.balance)}
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() =>
                    toggleMutation.mutate({
                      id: user.id,
                      status: user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
                    })
                  }
                >
                  <ToggleLeft className="h-4 w-4" />
                  {user.status}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Button className="mt-4" variant="ghost" onClick={() => query.refetch()}>
        <RefreshCw className="h-4 w-4" />
        Refresh
      </Button>
    </PageTransition>
  );
}