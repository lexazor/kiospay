'use client';

import { Suspense, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { PageTransition } from '@/components/layouts/page-transition';
import { Card } from '@/components/ui/card';
import { CountdownTimer } from '@/components/ui/countdown-timer';
import { Button } from '@/components/ui/button';
import { FileUploadPreview } from '@/components/ui/file-upload-preview';
import { api, ApiError } from '@/lib/api';
import { formatRupiah } from '@/lib/utils';
import type { Deposit } from '@/types/api';
import { toast } from 'sonner';

function DepositInvoiceContent() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);

  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);

  const depositQuery = useQuery({
    queryKey: ['deposit-detail', params.id],
    queryFn: () => api.get<Deposit>(`/deposits/me/${params.id}`),
    refetchInterval: 5000,
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!file) {
        throw new ApiError('Pilih file terlebih dahulu.', 400);
      }

      const formData = new FormData();
      formData.append('file', file);
      return api.upload(`/deposits/me/${params.id}/upload-proof`, formData);
    },
    onSuccess: () => {
      toast.success('Bukti transfer berhasil diupload.');
      void depositQuery.refetch();
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'Upload gagal.');
    },
  });

  const data = depositQuery.data;

  if (!data) {
    return (
      <PageTransition>
        <Card className="rounded-2xl p-5 text-sm text-slate-500">Memuat invoice...</Card>
      </PageTransition>
    );
  }

  const isExpired = data.status === 'EXPIRED';
  const isPending = data.status === 'PENDING';

  return (
    <PageTransition>
      <header className="mb-4">
        <h1 className="text-xl font-semibold">Invoice Deposit</h1>
        <p className="text-sm text-slate-500">Step 3: Transfer lalu upload bukti transfer.</p>
      </header>

      <Card className="relative overflow-hidden rounded-3xl p-5">
        {isExpired ? (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-white/90">
            <p className="text-base font-semibold text-red-600">Deposit Expired</p>
            <Button onClick={() => router.push('/deposit')}>Buat Deposit Baru</Button>
          </div>
        ) : null}

        <div className="space-y-3">
          <div>
            <p className="text-xs text-slate-500">Metode Pembayaran</p>
            <p className="text-sm font-semibold text-slate-900">{data.paymentMethod?.name}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Nomor Tujuan</p>
            <p className="text-sm font-semibold text-slate-900">{data.paymentMethod?.accountNumber}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Nominal Transfer</p>
            <p className="text-lg font-semibold text-[#6c3aea]">{formatRupiah(data.transferAmount)}</p>
          </div>

          <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2">
            <p className="text-xs text-slate-500">Waktu tersisa</p>
            <CountdownTimer expiredAt={data.expiredAt} />
          </div>

          <div className="rounded-2xl bg-slate-50 px-3 py-2 text-xs">
            Status: <span className="font-semibold">{data.status}</span>
          </div>
        </div>
      </Card>

      <div className="mt-4">
        <FileUploadPreview file={file} previewUrl={previewUrl} onSelect={setFile} />
        <Button
          className="mt-3 w-full"
          disabled={!file || !isPending || Boolean(data.proofImageUrl)}
          loading={uploadMutation.isPending}
          onClick={() => uploadMutation.mutate()}
        >
          Upload Bukti Transfer
        </Button>
      </div>
    </PageTransition>
  );
}

export default function DepositInvoicePage() {
  return (
    <Suspense fallback={<Card className="rounded-2xl p-5 text-sm text-slate-500">Memuat halaman...</Card>}>
      <DepositInvoiceContent />
    </Suspense>
  );
}