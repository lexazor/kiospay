'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { BadgeCheck, Wallet } from 'lucide-react';
import { PageTransition } from '@/components/layouts/page-transition';
import { api } from '@/lib/api';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatRupiah } from '@/lib/utils';

interface ServiceField {
  id: string;
  label: string;
  key: string;
  type: 'TEXT' | 'NUMBER' | 'SELECT';
  required: boolean;
  placeholder?: string | null;
  optionsJson?: string[] | null;
}

interface ServiceProduct {
  id: string;
  name: string;
  tabType?: string | null;
  nominal: string;
  sellingPrice: string;
}

interface ServiceDetailPayload {
  id: string;
  name: string;
  logoUrl?: string | null;
  inputFields: ServiceField[];
  products: ServiceProduct[];
}

export default function ServiceOrderPage() {
  const router = useRouter();
  const params = useParams<{ categorySlug: string; serviceSlug: string }>();

  const [selectedTab, setSelectedTab] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState<ServiceProduct | null>(null);
  const [openSheet, setOpenSheet] = useState(false);
  const [formValues, setFormValues] = useState<Record<string, string>>({});

  const query = useQuery({
    queryKey: ['service-detail', params.categorySlug, params.serviceSlug],
    queryFn: () =>
      api.get<ServiceDetailPayload>(
        `/services/public/${params.categorySlug}/${params.serviceSlug}`,
      ),
  });

  const tabOptions = useMemo(() => {
    const types = Array.from(
      new Set(query.data?.products.map((item) => item.tabType).filter(Boolean) as string[]),
    );

    return ['all', ...types];
  }, [query.data?.products]);

  const filteredProducts = useMemo(() => {
    if (!query.data?.products) {
      return [];
    }

    if (selectedTab === 'all') {
      return query.data.products;
    }

    return query.data.products.filter((item) => (item.tabType ?? '') === selectedTab);
  }, [query.data?.products, selectedTab]);

  const allRequiredFilled = useMemo(() => {
    if (!query.data) {
      return false;
    }

    return query.data.inputFields.every((field) => {
      if (!field.required) {
        return true;
      }

      return Boolean(formValues[field.key]?.trim());
    });
  }, [formValues, query.data]);

  if (!query.data) {
    return (
      <PageTransition>
        <Card className="rounded-2xl p-5 text-sm text-slate-500">Memuat layanan...</Card>
      </PageTransition>
    );
  }

  const selectedPrice = selectedProduct ? Number(selectedProduct.sellingPrice) : 0;

  return (
    <PageTransition>
      <header className="mb-4 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-[#f0ebff]">
          {query.data.logoUrl ? (
            <Image
              src={query.data.logoUrl}
              alt={query.data.name}
              width={44}
              height={44}
              className="h-full w-full object-cover"
            />
          ) : (
            <Wallet className="h-5 w-5 text-[#6c3aea]" />
          )}
        </div>
        <div>
          <h1 className="text-xl font-semibold">{query.data.name}</h1>
          <p className="text-sm text-slate-500">Step 2: Isi data dan pilih produk.</p>
        </div>
      </header>

      <Card className="rounded-3xl p-4">
        <div className="space-y-3">
          {query.data.inputFields.map((field) => (
            <div key={field.id} className="space-y-1">
              <Label>
                {field.label}
                {field.required ? ' *' : ''}
              </Label>

              {field.type === 'SELECT' ? (
                <select
                  value={formValues[field.key] ?? ''}
                  onChange={(event) =>
                    setFormValues((prev) => ({
                      ...prev,
                      [field.key]: event.target.value,
                    }))
                  }
                  className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm"
                >
                  <option value="">Pilih opsi</option>
                  {(field.optionsJson ?? []).map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              ) : (
                <Input
                  type={field.type === 'NUMBER' ? 'number' : 'text'}
                  placeholder={field.placeholder ?? field.label}
                  value={formValues[field.key] ?? ''}
                  onChange={(event) =>
                    setFormValues((prev) => ({
                      ...prev,
                      [field.key]: event.target.value,
                    }))
                  }
                />
              )}
            </div>
          ))}
        </div>
      </Card>

      {tabOptions.length > 1 ? (
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="mt-4">
          <TabsList className="w-full overflow-x-auto scrollbar-none">
            {tabOptions.map((tab) => (
              <TabsTrigger key={tab} value={tab} className="capitalize">
                {tab === 'all' ? 'Semua' : tab}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      ) : null}

      <div className="mt-4 grid grid-cols-2 gap-3">
        {filteredProducts.map((product) => {
          const selected = selectedProduct?.id === product.id;
          return (
            <button
              key={product.id}
              type="button"
              onClick={() => {
                setSelectedProduct(product);
                setOpenSheet(true);
              }}
              className={`rounded-2xl border bg-white p-3 text-left shadow-sm transition ${
                selected ? 'border-[#6c3aea] bg-[#f4efff]' : 'border-slate-100'
              }`}
            >
              <p className="text-sm font-semibold text-slate-900">{product.name}</p>
              <p className="mt-1 text-xs text-slate-500">Harga</p>
              <p className="text-sm font-semibold text-[#6c3aea]">{formatRupiah(product.sellingPrice)}</p>
            </button>
          );
        })}
      </div>

      <BottomSheet open={openSheet} onClose={() => setOpenSheet(false)} title="Informasi Pesanan">
        <div className="space-y-4 text-sm">
          <div>
            <p className="font-semibold text-slate-900">Informasi Pelanggan</p>
            <div className="mt-2 space-y-1 rounded-2xl bg-slate-50 p-3 text-xs">
              {Object.entries(formValues).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between gap-4">
                  <span className="text-slate-500">{key}</span>
                  <span className="font-medium text-slate-800">{value || '-'}</span>
                </div>
              ))}
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-500">Produk</span>
                <span className="font-medium text-slate-800">{selectedProduct?.name ?? '-'}</span>
              </div>
            </div>
          </div>

          <div>
            <p className="font-semibold text-slate-900">Detail Pembayaran</p>
            <div className="mt-2 space-y-1 rounded-2xl bg-slate-50 p-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Harga Voucher</span>
                <span className="font-medium">{formatRupiah(selectedPrice)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Biaya Transaksi</span>
                <span className="font-medium">{formatRupiah(0)}</span>
              </div>
              <div className="flex items-center justify-between text-sm font-semibold text-slate-900">
                <span>Total Pembayaran</span>
                <span>{formatRupiah(selectedPrice)}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={() => setOpenSheet(false)}>
              Ubah
            </Button>
            <Button
              disabled={!selectedProduct || !allRequiredFilled}
              onClick={() => {
                if (!selectedProduct) {
                  return;
                }

                const customerData = encodeURIComponent(JSON.stringify(formValues));
                router.push(
                  `/order/confirm?productId=${selectedProduct.id}&customerData=${customerData}&service=${encodeURIComponent(query.data.name)}&price=${encodeURIComponent(selectedProduct.sellingPrice)}`,
                );
              }}
            >
              <BadgeCheck className="h-4 w-4" />
              Konfirmasi
            </Button>
          </div>
        </div>
      </BottomSheet>
    </PageTransition>
  );
}