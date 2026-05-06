# KiosPay Backend

Backend API untuk platform jual produk digital (pulsa, ewallet top-up, dll) menggunakan NestJS 11, Prisma, MySQL, JWT auth + PIN, WebSocket realtime, dan cron auto-expired deposit.

## Setup

1. Copy env:

```bash
cp .env.example .env
```

2. Sesuaikan koneksi database pada `.env`.

3. Generate prisma client:

```bash
npm run prisma:generate
```

4. Jalankan migration:

```bash
npm run prisma:migrate -- --name init
```

5. Seed admin default:

```bash
npm run seed
```

6. Jalankan server:

```bash
npm run start:dev
```

## Auth Flow

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/setup-pin`
- `POST /auth/verify-pin`
- `POST /auth/refresh-token`
- `POST /auth/logout`
- `GET /auth/me`

Token disimpan pada cookie httpOnly:

- `kiospay_at` (access token)
- `kiospay_rt` (refresh token)

## WebSocket Events

- `balance:updated`
- `deposit:status`
- `order:status`
- `admin:deposit_new`

Koneksi socket membutuhkan access token pada `handshake.auth.token` atau header Bearer.

## Upload

Bukti transfer disimpan pada:

- `backend/public/uploads/deposits`

Diakses via static path:

- `/public/uploads/deposits/<filename>`