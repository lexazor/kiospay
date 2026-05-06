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

interface Service {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  serviceId: string;
  nominal: string;
  sellingPrice: string;
  status: boolean;
}

export default function AdminProductsPage() {
  const [serviceId, setServiceId] = useState('');
  const [name, setName] = useState('');
  const [tabType, setTabType] = useState('');
  const [nominal, setNominal] = useState('0');
  const [sellingPrice, setSellingPrice] = useState('0');

  const serviceQuery = useQuery({
    queryKey: ['services-admin-options'],
    queryFn: () => api.get<Service[]>('/services/admin'),
  });

  const productQuery = useQuery({
    queryKey: ['products-admin'],
    queryFn: () => api.get<Product[]>('/products/admin'),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      api.post('/products/admin', {
        serviceId,
        name,
        tabType,
        nominal: Number(nominal),
        sellingPrice: Number(sellingPrice),
        status: true,
      }),
    onSuccess: () => {
      setName('');
      setTabType('');
      setNominal('0');
      setSellingPrice('0');
      toast.success('Produk ditambahkan.');
      void productQuery.refetch();
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'Gagal menambah produk.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/products/admin/${id}`),
    onSuccess: () => {
      toast.success('Produk dihapus.');
      void productQuery.refetch();
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'Gagal menghapus produk.');
    },
  });

  return (
    <PageTransition>
      <header className="mb-4">
        <h1 className="text-2xl font-semibold">Produk</h1>
        <p className="text-sm text-slate-500">Kelola produk nominal dan harga jual.</p>
      </header>

      <Card className="mb-4 rounded-2xl p-4">
        <div className="grid gap-3 md:grid-cols-6">
          <select
            value={serviceId}
            onChange={(event) => setServiceId(event.target.value)}
            className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm"
          >
            <option value="">Pilih layanan</option>
            {serviceQuery.data?.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name}
              </option>
            ))}
          </select>
          <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Nama produk" />
          <Input value={tabType} onChange={(event) => setTabType(event.target.value)} placeholder="Tab type" />
          <Input
            type="number"
            value={nominal}
            onChange={(event) => setNominal(event.target.value)}
            placeholder="Nominal"
          />
          <Input
            type="number"
            value={sellingPrice}
            onChange={(event) => setSellingPrice(event.target.value)}
            placeholder="Harga jual"
          />
          <Button loading={createMutation.isPending} onClick={() => createMutation.mutate()}>
            <Plus className="h-4 w-4" />
            Tambah
          </Button>
        </div>
      </Card>

      <Card className="rounded-2xl p-4">
        <div className="space-y-2">
          {productQuery.data?.map((item) => (
            <div key={item.id} className="flex items-center justify-between rounded-xl border border-slate-100 p-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                <p className="text-xs text-slate-500">
                  Nominal {formatRupiah(item.nominal)} • Harga {formatRupiah(item.sellingPrice)}
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