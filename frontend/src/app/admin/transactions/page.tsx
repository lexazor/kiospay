'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { CheckCircle2, Clock3, XCircle } from 'lucide-react';
import { PageTransition } from '@/components/layouts/page-transition';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api, ApiError } from '@/lib/api';
import { formatRupiah } from '@/lib/utils';
import { toast } from 'sonner';

interface OrderItem {
  id: string;
  total: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  user: {
    username: string;
  };
  product: {
    name: string;
  };
}

export default function AdminTransactionsPage() {
  const query = useQuery({
    queryKey: ['admin-orders'],
    queryFn: () => api.get<OrderItem[]>('/orders/admin'),
  });

  const mutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'SUCCESS' | 'FAILED' }) =>
      api.patch(`/orders/admin/${id}/status`, { status }),
    onSuccess: () => {
      toast.success('Status order diperbarui.');
      void query.refetch();
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'Gagal update status order.');
    },
  });

  return (
    <PageTransition>
      <header className="mb-4">
        <h1 className="text-2xl font-semibold">Transaksi Order</h1>
        <p className="text-sm text-slate-500">Ubah status order pending menjadi sukses atau gagal.</p>
      </header>

      <Card className="rounded-2xl p-4">
        <div className="space-y-2">
          {query.data?.map((item) => (
            <div key={item.id} className="rounded-xl border border-slate-100 p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{item.product.name}</p>
                  <p className="text-xs text-slate-500">
                    {item.user.username} • {formatRupiah(item.total)} • {item.status}
                  </p>
                </div>

                {item.status === 'PENDING' ? (
                  <div className="flex items-center gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => mutation.mutate({ id: item.id, status: 'SUCCESS' })}
                    >
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => mutation.mutate({ id: item.id, status: 'FAILED' })}
                    >
                      <XCircle className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                ) : (
                  <Clock3 className="h-4 w-4 text-slate-400" />
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </PageTransition>
  );
}