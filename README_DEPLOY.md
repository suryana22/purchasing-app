# Panduan Deployment Purchasing App

File ini berisi instruksi cara menginstal dan menjalankan aplikasi di server produksi (Linux/Ubuntu).

## Persiapan
Pastikan Anda sudah login ke server Anda via SSH.

## Langkah 1: Download & Persiapan Script
Pastikan file `install_server.sh` memiliki izin eksekusi:
```bash
chmod +x install_server.sh
```

## Langkah 2: Jalankan Script Installasi
Script ini akan menginstal Docker, Docker Compose, Node.js, dan menyiapkan template `.env`.
```bash
./install_server.sh
```
*Catatan: Setelah Docker diinstal, Anda mungkin perlu logout dan login kembali agar izin grup docker aktif.*

## Langkah 3: Konfigurasi Environment
Secara otomatis script telah membuat file `.env` di:
- `master-data-service/.env`
- `purchasing-service/.env`
- `purchasing-app/frontend/.env.local`

Buka masing-masing file tersebut jika Anda ingin mengganti password database atau secret key.

## Langkah 4: Menjalankan Aplikasi
Masuk ke direktori `purchasing-app` dan jalankan Docker Compose:
```bash
cd purchasing-app
docker-compose up -d --build
```

Aplikasi akan berjalan di:
- **Frontend**: http://ip-server-anda:3000
- **Master Data API**: http://ip-server-anda:4001
- **Purchasing API**: http://ip-server-anda:4002

## Maintenance
Untuk melihat log aplikasi:
```bash
docker-compose logs -f
```

Untuk menghentikan aplikasi:
```bash
docker-compose down
```
