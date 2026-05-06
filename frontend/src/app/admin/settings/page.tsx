'use client';

import { Card } from '@/components/ui/card';
import { PageTransition } from '@/components/layouts/page-transition';

export default function AdminSettingsPage() {
  return (
    <PageTransition>
      <header className="mb-4">
        <h1 className="text-2xl font-semibold">Pengaturan</h1>
        <p className="text-sm text-slate-500">Konfigurasi global sistem.</p>
      </header>

      <Card className="rounded-2xl p-4 text-sm text-slate-600">
        Konfigurasi lanjutan (branding, kontak admin, dan parameter bisnis) bisa ditambahkan di iterasi berikutnya.
      </Card>
    </PageTransition>
  );
}