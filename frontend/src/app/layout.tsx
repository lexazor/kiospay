import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';
import { AppProviders } from '@/components/providers/app-providers';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'KiosPay',
  description: 'Platform digital top-up modern',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full bg-[#f5f5f7] text-slate-900">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}