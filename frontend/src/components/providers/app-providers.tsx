'use client';

import { QueryProvider } from './query-provider';
import { AppToaster } from './app-toaster';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      {children}
      <AppToaster />
    </QueryProvider>
  );
}