#!/usr/bin/env bash
set -euo pipefail

# KiosPay VPS Installer (aaPanel + PM2)
# Jalankan dengan root/sudo:
#   sudo bash backend/deploy/install.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
BACKEND_DIR="${PROJECT_ROOT}/backend"
FRONTEND_DIR="${PROJECT_ROOT}/frontend"
APP_USER="${SUDO_USER:-${USER}}"

if [[ ! -d "${BACKEND_DIR}" || ! -d "${FRONTEND_DIR}" ]]; then
  echo "[ERROR] Folder backend/frontend tidak ditemukan."
  echo "Pastikan script dijalankan dari repository kiospay."
  exit 1
fi

if [[ "${EUID}" -ne 0 ]]; then
  echo "[ERROR] Script harus dijalankan sebagai root (sudo)."
  exit 1
fi

command_exists() {
  command -v "$1" >/dev/null 2>&1
}

print_header() {
  echo
  echo "==================================================="
  echo "$1"
  echo "==================================================="
}

print_header "1/8 Update package OS dan dependency dasar"
apt-get update -y
apt-get install -y curl git ca-certificates build-essential openssl

print_header "2/8 Cek Node.js dan npm"
if ! command_exists node || ! command_exists npm; then
  echo "[INFO] Node.js belum terpasang, install Node.js 20 LTS..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi

echo "[INFO] Node version: $(node -v)"
echo "[INFO] npm version : $(npm -v)"

print_header "3/8 Install PM2 global"
if ! command_exists pm2; then
  npm install -g pm2
fi
echo "[INFO] PM2 version: $(pm2 -v)"

print_header "4/8 Install dependency backend + frontend"
cd "${BACKEND_DIR}"
npm install

cd "${FRONTEND_DIR}"
npm install

print_header "5/8 Setup environment (.env)"

read -r -p "Domain frontend (contoh: kiospay.com): " FRONTEND_DOMAIN
read -r -p "Domain backend/API (contoh: api.kiospay.com): " BACKEND_DOMAIN
read -r -p "Cookie domain untuk share login lintas subdomain [${FRONTEND_DOMAIN}]: " COOKIE_DOMAIN
COOKIE_DOMAIN="${COOKIE_DOMAIN:-${FRONTEND_DOMAIN}}"
read -r -p "MySQL host [127.0.0.1]: " MYSQL_HOST
MYSQL_HOST="${MYSQL_HOST:-127.0.0.1}"
read -r -p "MySQL port [3306]: " MYSQL_PORT
MYSQL_PORT="${MYSQL_PORT:-3306}"
read -r -p "MySQL database [kiospay]: " MYSQL_DB
MYSQL_DB="${MYSQL_DB:-kiospay}"
read -r -p "MySQL username [kiospay_user]: " MYSQL_USER
MYSQL_USER="${MYSQL_USER:-kiospay_user}"
read -r -s -p "MySQL password: " MYSQL_PASS
echo
if [[ -z "${MYSQL_PASS}" ]]; then
  echo "[ERROR] Password MySQL tidak boleh kosong."
  exit 1
fi

read -r -p "PORT backend [4000]: " BACKEND_PORT
BACKEND_PORT="${BACKEND_PORT:-4000}"

JWT_ACCESS_SECRET="$(openssl rand -hex 32)"
JWT_REFRESH_SECRET="$(openssl rand -hex 32)"
DATABASE_URL="mysql://${MYSQL_USER}:${MYSQL_PASS}@${MYSQL_HOST}:${MYSQL_PORT}/${MYSQL_DB}"

cat > "${BACKEND_DIR}/.env" <<EOF
DATABASE_URL="${DATABASE_URL}"

JWT_ACCESS_SECRET="${JWT_ACCESS_SECRET}"
JWT_REFRESH_SECRET="${JWT_REFRESH_SECRET}"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="30d"

PORT=${BACKEND_PORT}
CORS_ORIGIN="https://${FRONTEND_DOMAIN}"
COOKIE_DOMAIN="${COOKIE_DOMAIN}"
UPLOADS_DIR="public/uploads"
EOF

cat > "${FRONTEND_DIR}/.env" <<EOF
NEXT_PUBLIC_BACKEND_URL=https://${BACKEND_DOMAIN}
EOF

echo "[INFO] File .env backend dan frontend sudah dibuat."
echo "[INFO] Cookie auth memakai nama v2 (kiospay_at_v2, kiospay_rt_v2)."

print_header "6/8 Prisma generate + sync database"
cd "${BACKEND_DIR}"
npm run prisma:generate

if [[ -d "${BACKEND_DIR}/prisma/migrations" ]] && [[ "$(find "${BACKEND_DIR}/prisma/migrations" -mindepth 1 -maxdepth 1 -type d | wc -l)" -gt 0 ]]; then
  echo "[INFO] Migrations ditemukan, jalankan prisma migrate deploy..."
  npm run prisma:deploy
else
  echo "[INFO] Migrations belum ada, jalankan prisma db push..."
  npx prisma db push
fi

read -r -p "Jalankan seed admin default? [y/N]: " RUN_SEED
if [[ "${RUN_SEED}" =~ ^[Yy]$ ]]; then
  npm run seed
fi

print_header "7/8 Build backend + frontend"
cd "${BACKEND_DIR}"
npm run build

cd "${FRONTEND_DIR}"
npm run build

print_header "8/8 Setup PM2 process + autostart"
ECOSYSTEM_FILE="${SCRIPT_DIR}/ecosystem.config.cjs"

cat > "${ECOSYSTEM_FILE}" <<EOF
module.exports = {
  apps: [
    {
      name: "kiospay-backend",
      cwd: "${BACKEND_DIR}",
      script: "npm",
      args: "run start:prod",
      exec_mode: "fork",
      instances: 1,
      env: {
        NODE_ENV: "production",
        PORT: "${BACKEND_PORT}"
      }
    },
    {
      name: "kiospay-frontend",
      cwd: "${FRONTEND_DIR}",
      script: "npm",
      args: "run start -- -p 3000 -H 127.0.0.1",
      exec_mode: "fork",
      instances: 1,
      env: {
        NODE_ENV: "production"
      }
    }
  ]
}
EOF

su - "${APP_USER}" -c "pm2 delete kiospay-backend >/dev/null 2>&1 || true"
su - "${APP_USER}" -c "pm2 delete kiospay-frontend >/dev/null 2>&1 || true"
su - "${APP_USER}" -c "pm2 start ${ECOSYSTEM_FILE}"
su - "${APP_USER}" -c "pm2 save"

PM2_STARTUP_CMD="$(su - "${APP_USER}" -c "pm2 startup systemd -u ${APP_USER} --hp /home/${APP_USER}" | grep -E 'sudo|env PATH=' | tail -n 1 || true)"
if [[ -n "${PM2_STARTUP_CMD}" ]]; then
  # shellcheck disable=SC2086
  eval ${PM2_STARTUP_CMD}
fi

echo
echo "✅ Instalasi dasar selesai."
echo
echo "Service PM2:"
su - "${APP_USER}" -c "pm2 status"
echo
echo "Langkah SELANJUTNYA di aaPanel:"
echo "1) Buat site untuk frontend domain: ${FRONTEND_DOMAIN}"
echo "2) Buat reverse proxy ke: http://127.0.0.1:3000"
echo "3) Buat site untuk backend domain: ${BACKEND_DOMAIN}"
echo "4) Buat reverse proxy ke: http://127.0.0.1:${BACKEND_PORT}"
echo "5) Aktifkan SSL Let's Encrypt untuk kedua domain."
echo
echo "Contoh login admin seed (jika seed dijalankan):"
echo "Email: admin@kiospay.local"
echo "Password: Admin12345!"
