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
}

interface Service {
  id: string;
  name: string;
  categoryId: string;
  category: Category;
  status: boolean;
  description?: string;
  inputFields?: Array<{ label: string; type: string }>;
}

export default function AdminServicesPage() {
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState(true);

  const categoryQuery = useQuery({
    queryKey: ['categories-admin-select'],
    queryFn: () => api.get<Category[]>('/categories/admin'),
  });

  const serviceQuery = useQuery({
    queryKey: ['services-admin'],
    queryFn: () => api.get<Service[]>('/services/admin'),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      api.post('/services/admin', {
        categoryId,
        name,
        description,
        status,
        inputFields: [
          {
            label: 'Nomor Handphone',
            type: 'TEXT',
            required: true,
            placeholder: '08xxxxxxxxxx',
          },
        ],
      }),
    onSuccess: () => {
      setName('');
      setDescription('');
      toast.success('Layanan ditambahkan.');
      void serviceQuery.refetch();
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'Gagal tambah layanan.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/services/admin/${id}`),
    onSuccess: () => {
      toast.success('Layanan dihapus.');
      void serviceQuery.refetch();
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'Gagal hapus layanan.');
    },
  });

  const activeCount = useMemo(
    () => serviceQuery.data?.filter((item) => item.status).length ?? 0,
    [serviceQuery.data],
  );

  return (
    <PageTransition>
      <header className="mb-4">
        <h1 className="text-2xl font-semibold">Layanan</h1>
        <p className="text-sm text-slate-500">Kelola sub-kategori layanan dan field input order.</p>
      </header>

      <Card className="mb-4 rounded-2xl p-4">
        <div className="grid gap-3 md:grid-cols-5">
          <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Nama layanan" />
          <select
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
            className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm"
          >
            <option value="">Pilih kategori</option>
            {categoryQuery.data?.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          <Input
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Deskripsi"
          />
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
          <p className="text-sm font-semibold">Daftar Layanan</p>
          <p className="text-xs text-slate-500">Aktif: {activeCount}</p>
        </div>

        <div className="space-y-2">
          {serviceQuery.data?.map((item) => (
            <div key={item.id} className="flex items-center justify-between rounded-xl border border-slate-100 p-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                <p className="text-xs text-slate-500">
                  {item.category.name} • {item.status ? 'Aktif' : 'Nonaktif'}
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