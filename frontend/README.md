# KiosPay Frontend

Frontend Next.js App Router dengan UI mobile-style iOS untuk platform jual produk digital.

## Setup

1. Copy env:

```bash
cp .env.example .env
```

2. Pastikan backend NestJS berjalan di `http://localhost:4000`.

3. Jalankan aplikasi:

```bash
npm run dev
```

## Struktur utama

- `src/app/(auth)` : login/register/setup-pin
- `src/app/(user)` : dashboard, order, deposit, history, profile
- `src/app/admin` : dashboard dan CRUD admin
- `src/proxy.ts` : auth guard routing (pengganti middleware di Next 16)

## UI Stack

- Tailwind CSS
- Lucide React icons
- Framer Motion transition + interaction
- Radix primitives (shadcn-style custom)
- Sonner toast

## Realtime

Socket.IO client untuk event:

- `balance:updated`
- `deposit:status`
- `order:status`
- `admin:deposit_new`

## Catatan

- Light mode only
- Max content width 430px untuk user layout
- Bottom navigation untuk user dan sidebar untuk admin