# Task: Manajemen Pengguna & Hak Akses (RBAC)

## Status: Berjalan (In Progress)

### ✅ Deskripsi Pencapaian:
Sistem Manajemen Pengguna dengan Role-Based Access Control (RBAC) telah berhasil diimplementasikan secara fundamental baik di sisi Backend maupun Frontend.

*   **Backend (IAM Core)**: 
    *   Model `User`, `Role`, dan `Permission` telah dibuat dengan relasi Many-to-Many.
    *   Sistem Seeding otomatis untuk 40+ izin granular (View, Create, Edit, Delete) per modul.
    *   API Endpoint untuk manajemen User dan Role telah aktif.
    *   Login API telah diperbarui untuk mengembalikan data profil, role, dan daftar izin lengkap.
*   **Frontend (IAM UI)**:
    *   Halaman **Manajemen Pengguna** (Daftar, Tambah, Edit, Hapus user).
    *   Halaman **Role & Hak Akses** (Pembuatan role kustom dengan pilihan izin granular).
    *   **Sidebar Filtering**: Menu samping otomatis bersembunyi jika user tidak memiliki izin `.view`.
    *   **TopHeader Integration**: Menampilkan nama dan role user yang sedang login secara dinamis.
    *   **Logout Functionality**: Pembersihan session dan redirect keamanan.

---

### 🚀 Rencana Selanjutnya (Next Steps):

#### 1. Button-Level Access Control (CRUD)
Implementasikan pembatasan tombol aksi (Tambah, Edit, Hapus) di dalam setiap halaman master data dan purchasing.
*   Buat helper/hook `usePermission` di frontend.
*   Sembunyikan tombol "Tambah Barang" jika user tidak punya izin `items.create`.
*   Sembunyikan ikon "Hapus" jika user tidak punya izin `items.delete`.

#### 2. Backend Security Middleware
Tambahkan lapisan keamanan di sisi server untuk memvalidasi izin sebelum memproses request.
*   Buat middleware `checkPermission('items.delete')` di API routes.
*   Pastikan user tanpa izin mendapatkan error `403 Forbidden` meskipun mencoba menembak API langsung.

#### 3. Page Guards (Middleware Next.js)
Cegah akses langsung ke URL (misal: `/dashboard/settings`) bagi user yang tidak berwenang menggunakan Next.js Middleware.

#### 4. Password Hashing & JWT
Meningkatkan keamanan login dengan enkripsi password (bcrypt) dan penggunaan Token (JWT) untuk session yang lebih standar industri.
