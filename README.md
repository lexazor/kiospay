# KiosPay Monorepo

Platform web jual produk digital (pulsa, e-wallet top-up, dll) dengan arsitektur:

- `frontend`: Next.js (App Router, TypeScript, Tailwind, Framer Motion)
- `backend`: NestJS + Prisma + MySQL + JWT + WebSocket + PM2

README ini adalah panduan utama instalasi, deploy, dan operasional.

---

## 1. Struktur Project

```text
kiospay/
|- backend/   # NestJS 11 + Prisma + MySQL
`- frontend/  # Next.js 16 + Tailwind + UI
```

---

## 2. Prasyarat

### 2.1 Untuk Local Development

- Node.js 20+ (LTS disarankan)
- npm 10+
- MySQL 8+
- Git

### 2.2 Untuk Deploy VPS

- VPS Ubuntu 22.04/24.04
- Domain frontend, contoh: `kiospay.com`
- Subdomain API, contoh: `api.kiospay.com`
- Akses root/sudo
- aaPanel sudah terpasang

---

## 3. Instalasi Lokal (Development)

### 3.1 Clone Repository

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

Backend berjalan di `http://localhost:4000`.

### 3.3 Setup Frontend

Jalankan di terminal baru:

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Frontend berjalan di `http://localhost:3000`.

---

## 4. Contoh ENV Lengkap

### 4.1 Backend Development (`backend/.env`)

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

### 4.2 Frontend Development (`frontend/.env`)

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:4000
```

### 4.3 Backend Production (`backend/.env`)

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

### 4.4 Frontend Production (`frontend/.env`)

```env
NEXT_PUBLIC_BACKEND_URL=https://api.domainkamu.com
```

---

## 5. Deploy Otomatis aaPanel + PM2 (Paling Cepat)

Script installer tersedia di:

- `backend/deploy/install.sh`

Langkah cepat:

```bash
ssh root@IP_VPS
cd /www/wwwroot
git clone https://github.com/lexazor/kiospay.git
cd kiospay
sudo bash backend/deploy/install.sh
```

Yang dilakukan script:

1. Install dependency OS
2. Install Node.js 20 (jika belum ada)
3. Install PM2
4. Install package backend/frontend
5. Generate `.env` backend/frontend
6. `prisma generate` + sinkron DB
7. Build backend/frontend
8. Start PM2 (`kiospay-backend`, `kiospay-frontend`)
9. Simpan PM2 startup auto boot

---

## 6. Deploy Manual aaPanel + PM2 (Step by Step)

### 6.1 Setup DNS Domain

Di panel DNS domain:

1. A record `@` ke IP VPS
2. A record `api` ke IP VPS

Verifikasi:

```bash
nslookup domainkamu.com
nslookup api.domainkamu.com
```

### 6.2 Install aaPanel

SSH ke VPS:

```bash
ssh root@IP_VPS
```

Install aaPanel:

```bash
URL=https://www.aapanel.com/script/install_7.0_en.sh && \
wget -O install.sh $URL && bash install.sh aapanel
```

Catat output instalasi:

- URL panel
- user admin
- password admin
- port panel

Masuk aaPanel lalu install:

1. Nginx
2. MySQL 8.x
3. phpMyAdmin (opsional)

### 6.3 Buat Database di aaPanel

Menu `Databases` -> `Add DB`:

- DB Name: `kiospay`
- Username: `kiospay_user`
- Password: kuat
- Host: localhost/default

Simpan kredensialnya untuk `.env` backend.

### 6.4 Clone Project di VPS

```bash
cd /www/wwwroot
git clone https://github.com/lexazor/kiospay.git
cd kiospay
```

### 6.5 Install Node.js + PM2

```bash
apt-get update -y
apt-get install -y curl git ca-certificates build-essential
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
npm install -g pm2
```

Cek versi:

```bash
node -v
npm -v
pm2 -v
```

### 6.6 Install Dependency Project

```bash
cd /www/wwwroot/kiospay/backend
npm install

cd /www/wwwroot/kiospay/frontend
npm install
```

### 6.7 Setup File ENV Production

Backend:

```bash
cd /www/wwwroot/kiospay/backend
cp .env.example .env
nano .env
```

Frontend:

```bash
cd /www/wwwroot/kiospay/frontend
cp .env.example .env
nano .env
```

Isi sesuai contoh pada bagian `4.3` dan `4.4`.

### 6.8 Prisma Generate + Sinkron Database

```bash
cd /www/wwwroot/kiospay/backend
npm run prisma:generate
```

Jika migration belum ada:

```bash
npx prisma db push
```

Jika migration sudah ada:

```bash
npm run prisma:deploy
```

Opsional seed admin:

```bash
npm run seed
```

### 6.9 Build Backend + Frontend

```bash
cd /www/wwwroot/kiospay/backend
npm run build

cd /www/wwwroot/kiospay/frontend
npm run build
```

### 6.10 Jalankan Service Dengan PM2

Start backend:

```bash
cd /www/wwwroot/kiospay/backend
pm2 start dist/main.js --name kiospay-backend
```

Start frontend:

```bash
cd /www/wwwroot/kiospay/frontend
pm2 start "npm run start -- -p 3000 -H 127.0.0.1" --name kiospay-frontend
```

Simpan startup:

```bash
pm2 save
pm2 startup
```

Jalankan command lanjutan yang ditampilkan oleh output `pm2 startup`.

### 6.11 Setup Reverse Proxy di aaPanel

Buat 2 website:

1. `domainkamu.com` (frontend)
2. `api.domainkamu.com` (backend)

Atur reverse proxy:

- `domainkamu.com` -> `http://127.0.0.1:3000`
- `api.domainkamu.com` -> `http://127.0.0.1:4000`

### 6.12 Aktifkan SSL Let's Encrypt

Untuk masing-masing domain:

1. Site -> `SSL`
2. Pilih `Let's Encrypt`
3. Issue certificate
4. Aktifkan `Force HTTPS`

### 6.13 Verifikasi

```bash
pm2 status
pm2 logs kiospay-backend --lines 100
pm2 logs kiospay-frontend --lines 100
```

Test browser:

- `https://domainkamu.com`
- `https://api.domainkamu.com`

---

## 7. Operasional PM2

### 7.1 Restart Service

```bash
pm2 restart kiospay-backend
pm2 restart kiospay-frontend
```

### 7.2 Stop/Start Service

```bash
pm2 stop kiospay-backend
pm2 stop kiospay-frontend

pm2 start kiospay-backend
pm2 start kiospay-frontend
```

### 7.3 Lihat Log

```bash
pm2 logs kiospay-backend
pm2 logs kiospay-frontend
```

---

## 8. Update Aplikasi dari GitHub

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

Restart service:

```bash
pm2 restart kiospay-backend
pm2 restart kiospay-frontend
```

---

## 9. Troubleshooting

### 9.1 502 Bad Gateway

```bash
pm2 status
pm2 logs kiospay-backend --lines 200
pm2 logs kiospay-frontend --lines 200
```

Pastikan target reverse proxy benar:

- frontend -> `127.0.0.1:3000`
- backend -> `127.0.0.1:4000`

### 9.2 CORS Error

Cek `backend/.env`:

```env
CORS_ORIGIN="https://domainkamu.com"
```

Lalu:

```bash
pm2 restart kiospay-backend
```

### 9.3 Prisma / MySQL Tidak Terkoneksi

Cek `DATABASE_URL`, status MySQL, dan hak akses user DB.

Uji:

```bash
cd /www/wwwroot/kiospay/backend
npx prisma db pull
```

### 9.4 Aplikasi Tidak Auto Start Setelah Reboot

```bash
pm2 save
pm2 startup
```

### 9.5 Upload Bukti Transfer Tidak Muncul

Periksa:

- Folder `backend/public/uploads` ada
- Permission folder benar
- URL API di frontend benar

---

## 10. Keamanan Dasar

1. Ganti password admin default setelah seed.
2. Gunakan password database yang kuat.
3. Jangan commit file `.env` ke repository.
4. Wajib HTTPS untuk frontend + backend.
5. Update rutin OS dan dependency.

---

## 11. Dokumentasi Tambahan

- Deploy detail backend: `backend/DEPLOY_AAPANEL_PM2.md`
- Ringkasan backend: `backend/README.md`
- Ringkasan frontend: `frontend/README.md`
