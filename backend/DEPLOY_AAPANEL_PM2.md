# Panduan Deploy KiosPay ke VPS aaPanel (Lengkap Untuk Pemula)

Dokumen ini menjelaskan langkah demi langkah deploy monorepo KiosPay (`backend` NestJS + `frontend` Next.js) ke VPS Ubuntu menggunakan **aaPanel + PM2**.

Panduan dibuat untuk pemula dan fokus ke alur aman:
- Domain + SSL aktif
- API dan frontend berjalan stabil via PM2
- Reverse proxy di aaPanel
- Database MySQL dari panel aaPanel

## 1. Gambaran Arsitektur

Setelah deploy, alurnya akan seperti ini:

1. User akses `https://domain-frontend.com`
2. aaPanel web server (Nginx/OpenLiteSpeed) meneruskan ke `127.0.0.1:3000` (Next.js via PM2)
3. Frontend memanggil API `https://api.domain-frontend.com`
4. aaPanel meneruskan API ke `127.0.0.1:4000` (NestJS via PM2)
5. Backend terhubung ke MySQL lokal VPS

## 2. Prasyarat

Sebelum mulai, siapkan:

- VPS Ubuntu 22.04/24.04 (minimal 2 vCPU, 4 GB RAM disarankan)
- Domain aktif:
  - frontend: contoh `kiospay.com`
  - backend: contoh `api.kiospay.com`
- Akses root/sudo ke VPS
- Akun GitHub (untuk clone repository)
- Port yang perlu dibuka di firewall:
  - `22` (SSH)
  - `80` (HTTP)
  - `443` (HTTPS)
  - Port aaPanel (default instalasi, nanti muncul saat install)

## 3. Setup DNS Domain

Di panel domain (Cloudflare / registrar):

1. Buat A record `@` mengarah ke IP VPS
2. Buat A record `api` mengarah ke IP VPS
3. Tunggu propagasi (biasanya 1-15 menit, kadang lebih lama)

Cek dari lokal:

```bash
nslookup kiospay.com
nslookup api.kiospay.com
```

Pastikan mengarah ke IP VPS.

## 4. Install aaPanel di VPS

SSH ke VPS:

```bash
ssh root@IP_VPS
```

Install aaPanel (Ubuntu/Debian):

```bash
URL=https://www.aapanel.com/script/install_7.0_en.sh && \
wget -O install.sh $URL && bash install.sh aapanel
```

Setelah selesai, catat output:
- URL login panel
- username admin
- password admin
- port panel

Masuk ke aaPanel via browser, lalu:

1. Install stack web server (Nginx direkomendasikan)
2. Install MySQL (versi 8.x direkomendasikan)
3. Install phpMyAdmin (opsional, memudahkan cek DB)

## 5. Clone Repository

Masih di VPS:

```bash
cd /www/wwwroot
git clone https://github.com/lexazor/kiospay.git
cd kiospay
```

Pastikan struktur:

```bash
ls
# harus ada: backend  frontend
```

## 6. Jalankan Script Install Otomatis (PM2)

Script sudah disediakan:

`backend/deploy/install.sh`

Jalankan:

```bash
sudo bash backend/deploy/install.sh
```

Script akan otomatis:

1. Update package OS
2. Install dependency dasar (`curl`, `git`, `build-essential`, dll)
3. Cek/install Node.js 20 LTS
4. Install PM2 global
5. `npm install` backend & frontend
6. Tanya input konfigurasi (domain, MySQL, port)
7. Generate `.env` backend + frontend
8. Jalankan `prisma generate`
9. Jalankan `prisma migrate deploy` (jika ada migration), atau fallback `prisma db push`
10. Build backend + frontend
11. Start proses PM2:
   - `kiospay-backend`
   - `kiospay-frontend`
12. Simpan PM2 startup agar auto-start setelah reboot

## 7. Input Yang Akan Ditanya Script

Saat script jalan, isi:

- `Domain frontend` contoh: `kiospay.com`
- `Domain backend/API` contoh: `api.kiospay.com`
- `MySQL host` biasanya `127.0.0.1`
- `MySQL port` biasanya `3306`
- `MySQL database` contoh: `kiospay`
- `MySQL username` contoh: `kiospay_user`
- `MySQL password` isi password DB
- `PORT backend` default `4000`
- `Jalankan seed admin default?` pilih `y` jika ingin buat admin default

## 8. Buat Database MySQL di aaPanel (Jika Belum)

Kalau saat script jalan muncul error koneksi DB, buat dulu database di aaPanel:

1. Masuk aaPanel
2. Menu **Databases**
3. Klik **Add DB**
4. Isi:
   - DB Name: `kiospay`
   - Username: `kiospay_user`
   - Password: (buat kuat, simpan)
5. Privilege: all ke database tersebut
6. Save

Lalu jalankan ulang script:

```bash
cd /www/wwwroot/kiospay
sudo bash backend/deploy/install.sh
```

## 9. Konfigurasi Website di aaPanel

Setelah PM2 hidup, buat 2 site di aaPanel:

1. Site frontend: `kiospay.com`
2. Site backend: `api.kiospay.com`

### 9.1 Reverse Proxy Frontend

Di site frontend:

1. Buka pengaturan site
2. Menu **Reverse Proxy**
3. Add Proxy:
   - Target URL: `http://127.0.0.1:3000`
   - Send Domain: `$host` (default)
4. Simpan dan aktifkan

### 9.2 Reverse Proxy Backend

Di site backend:

1. Add Reverse Proxy
2. Target URL: `http://127.0.0.1:4000` (atau port backend yang kamu isi di script)
3. Simpan

## 10. Aktifkan SSL Let’s Encrypt

Untuk masing-masing domain (`kiospay.com` dan `api.kiospay.com`):

1. Masuk pengaturan site
2. Menu **SSL**
3. Pilih **Let’s Encrypt**
4. Issue certificate
5. Aktifkan force HTTPS

Setelah SSL aktif, cek:

- `https://kiospay.com`
- `https://api.kiospay.com`

## 11. Cek Status Aplikasi

Di VPS:

```bash
pm2 status
pm2 logs kiospay-backend --lines 100
pm2 logs kiospay-frontend --lines 100
```

Harus terlihat status `online` untuk dua process.

## 12. Perintah Operasional Harian

Masuk folder project dulu:

```bash
cd /www/wwwroot/kiospay
```

Restart aplikasi:

```bash
pm2 restart kiospay-backend
pm2 restart kiospay-frontend
```

Stop aplikasi:

```bash
pm2 stop kiospay-backend
pm2 stop kiospay-frontend
```

Lihat semua process:

```bash
pm2 status
```

## 13. Update Aplikasi (Setelah Ada Commit Baru)

Jika ada update code di GitHub:

```bash
cd /www/wwwroot/kiospay
git pull origin main
```

Lalu update dependency + build:

```bash
cd backend
npm install
npm run prisma:generate
npm run prisma:deploy
npm run build

cd ../frontend
npm install
npm run build
```

Restart PM2:

```bash
pm2 restart kiospay-backend
pm2 restart kiospay-frontend
```

## 14. Struktur ENV Yang Dipakai

### Backend `.env` (dibuat otomatis script)

Contoh:

```env
DATABASE_URL="mysql://kiospay_user:password@127.0.0.1:3306/kiospay"
JWT_ACCESS_SECRET="randomhex..."
JWT_REFRESH_SECRET="randomhex..."
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="30d"
PORT=4000
CORS_ORIGIN="https://kiospay.com"
UPLOADS_DIR="public/uploads"
```

### Frontend `.env` (dibuat otomatis script)

```env
NEXT_PUBLIC_BACKEND_URL=https://api.kiospay.com
```

## 15. Troubleshooting Paling Umum

### A. 502 Bad Gateway di domain

Penyebab:
- PM2 process mati
- Port reverse proxy salah

Cek:

```bash
pm2 status
pm2 logs kiospay-backend --lines 200
pm2 logs kiospay-frontend --lines 200
```

Pastikan:
- frontend proxy ke `127.0.0.1:3000`
- backend proxy ke `127.0.0.1:4000` (atau port backend kamu)

### B. Frontend tidak bisa request API (CORS)

Pastikan `CORS_ORIGIN` di backend `.env` sama dengan domain frontend HTTPS.

Contoh:

```env
CORS_ORIGIN="https://kiospay.com"
```

Lalu restart backend:

```bash
pm2 restart kiospay-backend
```

### C. Prisma gagal konek DB

Periksa:
- host/user/password database benar
- MySQL service aktif di aaPanel
- user punya akses ke database

Uji cepat:

```bash
cd /www/wwwroot/kiospay/backend
npx prisma db pull
```

### D. Setelah reboot VPS aplikasi tidak auto-start

Jalankan:

```bash
pm2 save
pm2 startup
```

Ikuti command lanjutan yang diberikan PM2 (biasanya perlu `sudo`).

### E. Upload bukti transfer tidak tampil

Periksa:
- folder `backend/public/uploads` ada
- permission folder cukup
- domain backend dan path static benar

## 16. Catatan Keamanan Dasar

Wajib dilakukan di production:

1. Ganti password admin default secepatnya
2. Gunakan password database kuat
3. Batasi akses SSH (non-root + key auth jika memungkinkan)
4. Rutin update dependency dan OS security patch
5. Jangan commit file `.env` ke repository

## 17. Ringkas Alur Cepat

1. Setup DNS `@` dan `api`
2. Install aaPanel + MySQL
3. Clone repo ke VPS
4. Jalankan `sudo bash backend/deploy/install.sh`
5. Buat reverse proxy frontend/backend di aaPanel
6. Aktifkan SSL
7. Cek `pm2 status`

Selesai.
