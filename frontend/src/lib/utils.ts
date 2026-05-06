import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRupiah(value: number | string) {
  const numeric = typeof value === 'string' ? Number(value) : value;

  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Number.isFinite(numeric) ? numeric : 0);
}

export function formatNumberId(value: number | string) {
  const numeric = typeof value === 'string' ? Number(value) : value;

  return new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: 0,
  }).format(Number.isFinite(numeric) ? numeric : 0);
}