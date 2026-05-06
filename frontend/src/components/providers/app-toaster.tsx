'use client';

import { Toaster } from 'sonner';

export function AppToaster() {
  return (
    <Toaster
      richColors
      position="top-center"
      toastOptions={{
        className: 'rounded-2xl',
      }}
    />
  );
}