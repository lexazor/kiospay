# KiosPay Monorepo

Platform web jual produk digital (pulsa, e-wallet top-up, dll) dengan arsitektur:

- `frontend`: Next.js (App Router, TypeScript, Tailwind, Framer Motion)
- `backend`: NestJS + Prisma + MySQL + JWT + WebSocket + PM2

Dokumen ini adalah panduan utama untuk:

1. Instalasi lokal
2. Deploy VPS aaPanel dengan PM2 (otomatis via script)
3. Deploy VPS aaPanel dengan PM2 (manual step by step)
4. Contoh `.env` lengkap
5. Operasional, update, dan troubleshooting

---

## 1) Struktur Project

```text
kiospay/
├── backend/   # NestJS 11 + Prisma + MySQL
└── frontend/  # Next.js 16 + Tailwind + UI
```

---

## 2) Prasyarat

### Untuk Local Development

- Node.js 20+ (disarankan LTS)
- npm 10+
- MySQL 8+
- Git

### Untuk Deploy VPS

- VPS Ubuntu 22.04/24.04
- Domain frontend (contoh `kiospay.com`)
- Subdomain API (contoh `api.kiospay.com`)
- Akses root/sudo
- aaPanel terpasang

---

## 3) Menjalankan di Lokal (Development)

### 3.1 Clone Repo

```bash
git clone https://github.com/lexazor/kiospay.git
cd kiospay
```

### 3.2 Setup Backend

```bash
cd backend
cp .env.example .env
npm install
npm run prisma:generate
npx prisma db push
npm run seed
npm run start:dev
```

Backend default: `http://localhost:4000`

### 3.3 Setup Frontend

Buka terminal baru:

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Frontend default: `http://localhost:3000`

---

## 4) Contoh ENV Lengkap

## 4.1 Backend (`backend/.env`)

```env
# Database
DATABASE_URL="mysql://root:root@127.0.0.1:3306/kiospay"

# JWT
JWT_ACCESS_SECRET="ganti_dengan_secret_access_yang_panjang"
JWT_REFRESH_SECRET="ganti_dengan_secret_refresh_yang_panjang"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="30d"

# App
PORT=4000
CORS_ORIGIN="http://localhost:3000"
UPLOADS_DIR="public/uploads"
```

## 4.2 Frontend (`frontend/.env`)

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:4000
```

Untuk production:

```env
NEXT_PUBLIC_BACKEND_URL=https://api.domainkamu.com
```

---

## 5) Deploy Otomatis ke VPS aaPanel + PM2 (Paling Cepat)

Script installer sudah disediakan:

- `backend/deploy/install.sh`

Langkah:

1. SSH ke VPS
2. Clone repo
3. Jalankan script install

```bash
ssh root@IP_VPS
cd /www/wwwroot
git clone https://github.com/lexazor/kiospay.git
cd kiospay
sudo bash backend/deploy/install.sh
```

Script akan otomatis:

- install dependency OS
- install Node.js 20 (jika belum ada)
- install PM2
- install package backend/frontend
- generate `.env` backend/frontend dari input kamu
- `prisma generate` + sync DB
- build backend/frontend
- start PM2 (`kiospay-backend`, `kiospay-frontend`)
- setup PM2 startup auto boot

---

## 6) Deploy Manual VPS aaPanel + PM2 (Lengkap Untuk Pemula)

## 6.1 Setup DNS Domain

Di panel DNS domain:

1. A record `@` -> IP VPS
2. A record `api` -> IP VPS

Cek:

```bash
nslookup domainkamu.com
nslookup api.domainkamu.com
```

## 6.2 Install aaPanel

SSH ke VPS:

```bash
ssh root@IP_VPS
```

Install aaPanel:

```bash
URL=https://www.aapanel.com/script/install_7.0_en.sh && \
wget -O install.sh $URL && bash install.sh aapanel
```

Catat hasil install:

- URL panel
- user admin
- password admin
- port panel

Masuk ke panel, install:

1. Nginx
2. MySQL 8.x
3. phpMyAdmin (opsional)

## 6.3 Buat Database di aaPanel

Menu `Databases` -> `Add DB`:

- DB Name: `kiospay`
- Username: `kiospay_user`
- Password: (buat kuat)
- Host: default localhost

Simpan data ini karena akan dipakai di `.env`.

## 6.4 Clone Project di VPS

```bash
cd /www/wwwroot
git clone https://github.com/lexazor/kiospay.git
cd kiospay
```

## 6.5 Install Node.js + PM2

```bash
apt-get update -y
apt-get install -y curl git ca-certificates build-essential
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
npm install -g pm2
```

Cek:

```bash
node -v
npm -v
pm2 -v
```

## 6.6 Install Dependency Aplikasi

```bash
cd /www/wwwroot/kiospay/backend
npm install

cd /www/wwwroot/kiospay/frontend
npm install
```

## 6.7 Buat File ENV Production

### Backend

```bash
cd /www/wwwroot/kiospay/backend
cp .env.example .env
nano .env
```

Isi contoh:

```env
DATABASE_URL="mysql://kiospay_user:PASSWORD_DB@127.0.0.1:3306/kiospay"
JWT_ACCESS_SECRET="isi_secret_random_panjang_1"
JWT_REFRESH_SECRET="isi_secret_random_panjang_2"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="30d"
PORT=4000
CORS_ORIGIN="https://domainkamu.com"
UPLOADS_DIR="public/uploads"
```

### Frontend

```bash
cd /www/wwwroot/kiospay/frontend
cp .env.example .env
nano .env
```

Isi:

```env
NEXT_PUBLIC_BACKEND_URL=https://api.domainkamu.com
```

## 6.8 Prisma Generate + Sinkron DB

```bash
cd /www/wwwroot/kiospay/backend
npm run prisma:generate
```

Jika belum ada migration:

```bash
npx prisma db push
```

Jika sudah ada migration:

```bash
npm run prisma:deploy
```

Optional seed admin:

```bash
npm run seed
```

## 6.9 Build Backend + Frontend

```bash
cd /www/wwwroot/kiospay/backend
npm run build

cd /www/wwwroot/kiospay/frontend
npm run build
```

## 6.10 Jalankan Dengan PM2

### Start backend

```bash
cd /www/wwwroot/kiospay/backend
pm2 start dist/main.js --name kiospay-backend
```

### Start frontend

```bash
cd /www/wwwroot/kiospay/frontend
pm2 start "npm run start -- -p 3000 -H 127.0.0.1" --name kiospay-frontend
```

Simpan agar auto-start setelah reboot:

```bash
pm2 save
pm2 startup
```

Jalankan command yang direkomendasikan dari output `pm2 startup`.

## 6.11 Setup Reverse Proxy di aaPanel

Buat 2 website di aaPanel:

1. `domainkamu.com` (frontend)
2. `api.domainkamu.com` (backend)

### Proxy Frontend

- Domain: `domainkamu.com`
- Reverse proxy target: `http://127.0.0.1:3000`

### Proxy Backend

- Domain: `api.domainkamu.com`
- Reverse proxy target: `http://127.0.0.1:4000`

## 6.12 Aktifkan SSL Let's Encrypt

Untuk kedua domain:

1. Site -> `SSL`
2. Pilih `Let's Encrypt`
3. Issue certificate
4. Aktifkan Force HTTPS

## 6.13 Verifikasi

```bash
pm2 status
pm2 logs kiospay-backend --lines 100
pm2 logs kiospay-frontend --lines 100
```

Cek browser:

- `https://domainkamu.com`
- `https://api.domainkamu.com`

---

## 7) Operasional Harian

## 7.1 Restart Service

```bash
pm2 restart kiospay-backend
pm2 restart kiospay-frontend
```

## 7.2 Stop/Start Service

```bash
pm2 stop kiospay-backend
pm2 stop kiospay-frontend

pm2 start kiospay-backend
pm2 start kiospay-frontend
```

## 7.3 Lihat Log

```bash
pm2 logs kiospay-backend
pm2 logs kiospay-frontend
```

---

## 8) Update Aplikasi Dari GitHub

```bash
cd /www/wwwroot/kiospay
git pull origin main
```

Update backend:

```bash
cd backend
npm install
npm run prisma:generate
npm run prisma:deploy
npm run build
```

Update frontend:

```bash
cd ../frontend
npm install
npm run build
```

Restart PM2:

```bash
pm2 restart kiospay-backend
pm2 restart kiospay-frontend
```

---

## 9) Troubleshooting Umum

## 9.1 Error 502 Bad Gateway

- Cek PM2 process hidup atau tidak
- Cek target reverse proxy benar

```bash
pm2 status
pm2 logs kiospay-backend --lines 200
pm2 logs kiospay-frontend --lines 200
```

## 9.2 CORS Error

Pastikan backend `.env`:

```env
CORS_ORIGIN="https://domainkamu.com"
```

Lalu:

```bash
pm2 restart kiospay-backend
```

## 9.3 Koneksi Prisma / MySQL Gagal

- Cek `DATABASE_URL`
- Cek service MySQL aktif
- Cek user DB punya akses

Uji:

```bash
cd /www/wwwroot/kiospay/backend
npx prisma db pull
```

## 9.4 Aplikasi Tidak Auto Start Saat Reboot

```bash
pm2 save
pm2 startup
```

## 9.5 Upload Bukti Transfer Tidak Muncul

Periksa:

- Folder `backend/public/uploads` ada
- Permission folder benar
- URL backend yang dipakai frontend benar

---

## 10) Keamanan Dasar (Wajib)

1. Ganti password admin default setelah seed
2. Pakai password DB yang kuat
3. Simpan `.env` hanya di server, jangan commit
4. Aktifkan HTTPS di frontend + backend
5. Update rutin OS dan dependency

---

## 11) Dokumentasi Tambahan

- Deploy detail per backend: `backend/DEPLOY_AAPANEL_PM2.md`
- Backend notes: `backend/README.md`
- Frontend notes: `frontend/README.md`

Jika ada kebutuhan tambahan (CI/CD, backup DB otomatis, staging server), lanjutkan dari README utama ini agar satu pintu dokumentasi tetap rapi.
