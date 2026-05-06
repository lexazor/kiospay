'use client';

import { Bell } from 'lucide-react';
import { PageTransition } from '@/components/layouts/page-transition';
import { Card } from '@/components/ui/card';

export default function NotificationsPage() {
  return (
    <PageTransition>
      <header className="mb-4 flex items-center gap-2">
        <Bell className="h-5 w-5 text-[#6c3aea]" />
        <h1 className="text-xl font-semibold">Notifikasi</h1>
      </header>

      <Card className="rounded-2xl p-4 text-sm text-slate-600">
        Event realtime order dan deposit akan muncul di sini melalui WebSocket.
      </Card>
    </PageTransition>
  );
}