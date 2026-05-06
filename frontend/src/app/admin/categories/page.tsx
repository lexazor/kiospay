'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { PageTransition } from '@/components/layouts/page-transition';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { api, ApiError } from '@/lib/api';
import { toast } from 'sonner';

interface Category {
  id: string;
  name: string;
  status: boolean;
  sortOrder: number;
  badge?: string | null;
}

export default function AdminCategoriesPage() {
  const [name, setName] = useState('');
  const [sortOrder, setSortOrder] = useState('0');
  const [status, setStatus] = useState(true);
  const [badge, setBadge] = useState('');

  const query = useQuery({
    queryKey: ['admin-categories'],
    queryFn: () => api.get<Category[]>('/categories/admin'),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      api.post('/categories/admin', {
        name,
        sortOrder: Number(sortOrder),
        status,
        badge,
      }),
    onSuccess: () => {
      setName('');
      setSortOrder('0');
      setBadge('');
      toast.success('Kategori berhasil ditambahkan.');
      void query.refetch();
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'Gagal menambah kategori.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/categories/admin/${id}`),
    onSuccess: () => {
      toast.success('Kategori dihapus.');
      void query.refetch();
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'Gagal hapus kategori.');
    },
  });

  const activeCount = useMemo(
    () => query.data?.filter((item) => item.status).length ?? 0,
    [query.data],
  );

  return (
    <PageTransition>
      <header className="mb-4">
        <h1 className="text-2xl font-semibold">Kategori</h1>
        <p className="text-sm text-slate-500">Kelola kategori utama layanan.</p>
      </header>

      <Card className="mb-4 rounded-2xl p-4">
        <div className="grid gap-3 md:grid-cols-5">
          <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Nama kategori" />
          <Input
            type="number"
            value={sortOrder}
            onChange={(event) => setSortOrder(event.target.value)}
            placeholder="Urutan"
          />
          <select
            value={badge}
            onChange={(event) => setBadge(event.target.value)}
            className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm"
          >
            <option value="">Tanpa Badge</option>
            <option value="BARU">BARU</option>
            <option value="PROMO">PROMO</option>
          </select>
          <select
            value={status ? 'true' : 'false'}
            onChange={(event) => setStatus(event.target.value === 'true')}
            className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm"
          >
            <option value="true">Aktif</option>
            <option value="false">Nonaktif</option>
          </select>
          <Button loading={createMutation.isPending} onClick={() => createMutation.mutate()}>
            <Plus className="h-4 w-4" />
            Tambah
          </Button>
        </div>
      </Card>

      <Card className="rounded-2xl p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold">Daftar Kategori</p>
          <p className="text-xs text-slate-500">Aktif: {activeCount}</p>
        </div>

        <div className="space-y-2">
          {query.data?.map((item) => (
            <div key={item.id} className="flex items-center justify-between rounded-xl border border-slate-100 p-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                <p className="text-xs text-slate-500">
                  Urutan {item.sortOrder} • {item.status ? 'Aktif' : 'Nonaktif'} • {item.badge || '-'}
                </p>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => deleteMutation.mutate(item.id)}
                loading={deleteMutation.isPending}
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          ))}
        </div>
      </Card>
    </PageTransition>
  );
}