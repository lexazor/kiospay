'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { ChevronRight, Wallet } from 'lucide-react';
import { PageTransition } from '@/components/layouts/page-transition';
import { Card } from '@/components/ui/card';
import { api } from '@/lib/api';

interface ServiceItem {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  description?: string | null;
}

export default function CategoryOrderPage() {
  const params = useParams<{ categorySlug: string }>();
  const router = useRouter();

  const servicesQuery = useQuery({
    queryKey: ['services', params.categorySlug],
    queryFn: () => api.get<ServiceItem[]>(`/services/public?categorySlug=${params.categorySlug}`),
  });

  return (
    <PageTransition>
      <header className="mb-4">
        <h1 className="text-xl font-semibold">Pilih Layanan</h1>
        <p className="text-sm text-slate-500">Step 1: Pilih sub-layanan dari kategori.</p>
      </header>

      <div className="space-y-3">
        {servicesQuery.data?.map((service) => (
          <button
            key={service.id}
            type="button"
            onClick={() => router.push(`/order/${params.categorySlug}/${service.slug}`)}
            className="w-full"
          >
            <Card className="flex items-center justify-between rounded-2xl p-4 text-left">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-[#f0ebff]">
                  {service.logoUrl ? (
                    <Image
                      src={service.logoUrl}
                      alt={service.name}
                      width={44}
                      height={44}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Wallet className="h-5 w-5 text-[#6c3aea]" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{service.name}</p>
                  <p className="text-xs text-slate-500">{service.description || 'Layanan digital instan'}</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-400" />
            </Card>
          </button>
        ))}
      </div>
    </PageTransition>
  );
}