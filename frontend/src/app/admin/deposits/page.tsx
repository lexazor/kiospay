'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { CheckCircle2, XCircle } from 'lucide-react';
import { PageTransition } from '@/components/layouts/page-transition';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api, ApiError } from '@/lib/api';
import { formatRupiah } from '@/lib/utils';
import { toast } from 'sonner';

interface DepositAdminItem {
  id: string;
  amount: string;
  transferAmount: string;
  uniqueCode: number;
  status: 'PENDING' | 'CONFIRMED' | 'EXPIRED' | 'REJECTED';
  createdAt: string;
  user: {
    username: string;
    fullName: string;
  };
  paymentMethod: {
    name: string;
  };
}

export default function AdminDepositsPage() {
  const query = useQuery({
    queryKey: ['admin-deposits'],
    queryFn: () => api.get<DepositAdminItem[]>('/deposits/admin'),
    refetchInterval: 4000,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'CONFIRMED' | 'REJECTED' }) =>
      api.patch(`/deposits/admin/${id}/status`, { status }),
    onSuccess: (_, variables) => {
      toast.success(`Deposit ${variables.status === 'CONFIRMED' ? 'dikonfirmasi' : 'ditolak'}.`);
      void query.refetch();
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'Gagal update status deposit.');
    },
  });

  return (
    <PageTransition>
      <header className="mb-4">
        <h1 className="text-2xl font-semibold">Deposit</h1>
        <p className="text-sm text-slate-500">Konfirmasi atau tolak deposit yang pending.</p>
      </header>

      <Card className="rounded-2xl p-4">
        <div className="space-y-2">
          {query.data?.map((item) => (
            <div key={item.id} className="rounded-xl border border-slate-100 p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {item.user.username} • {item.paymentMethod.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatRupiah(item.transferAmount)} • {item.status}
                  </p>
                </div>

                {item.status === 'PENDING' ? (
                  <div className="flex items-center gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => updateMutation.mutate({ id: item.id, status: 'CONFIRMED' })}
                    >
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => updateMutation.mutate({ id: item.id, status: 'REJECTED' })}
                    >
                      <XCircle className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </PageTransition>
  );
}