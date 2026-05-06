'use client';

import { Suspense, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { KeyRound } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PinInput } from '@/components/ui/pin-input';
import { toast } from 'sonner';

function SetupPinContent() {
  const params = useSearchParams();
  const mode = useMemo(() => params.get('mode') || 'create', [params]);
  const verifyOnly = mode === 'verify';

  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    try {
      setLoading(true);

      if (verifyOnly) {
        if (pin.length !== 6) {
          toast.error('PIN harus 6 digit.');
          return;
        }

        await api.post('/auth/verify-pin', { pin });
        toast.success('PIN valid. Selamat datang!');
        window.location.href = '/dashboard';
        return;
      }

      if (pin.length !== 6 || confirmPin.length !== 6) {
        toast.error('PIN harus 6 digit.');
        return;
      }

      if (pin !== confirmPin) {
        toast.error('Konfirmasi PIN tidak sesuai.');
        return;
      }

      await api.post('/auth/setup-pin', { pin, confirmPin });
      toast.success('PIN berhasil dibuat.');
      window.location.href = '/dashboard';
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Gagal memproses PIN.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mobile-shell min-h-screen px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#6c3aea] text-white">
            <KeyRound className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-semibold">{verifyOnly ? 'Verifikasi PIN' : 'Setup PIN Akun'}</h1>
          <p className="text-sm text-slate-500">
            {verifyOnly
              ? 'Masukkan PIN 6 digit untuk melanjutkan login.'
              : 'Buat PIN 6 digit untuk keamanan transaksi.'}
          </p>
        </div>

        <Card className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
          <CardContent className="space-y-5 p-0">
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700">PIN</p>
              <PinInput value={pin} onChange={setPin} />
            </div>

            {!verifyOnly ? (
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-700">Konfirmasi PIN</p>
                <PinInput value={confirmPin} onChange={setConfirmPin} />
              </div>
            ) : null}

            <Button className="w-full" onClick={submit} loading={loading}>
              {verifyOnly ? 'Verifikasi' : 'Simpan PIN'}
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </main>
  );
}

export default function SetupPinPage() {
  return (
    <Suspense fallback={<Card className="m-4 rounded-2xl p-5 text-sm text-slate-500">Memuat halaman...</Card>}>
      <SetupPinContent />
    </Suspense>
  );
}
