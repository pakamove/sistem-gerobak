# Dokumentasi Teknis — Sistem Gerobak

> Versi: branch `main` | Diperbarui: 2026-04-27

---

## Daftar Isi

1. [Gambaran Umum](#1-gambaran-umum)
2. [Tech Stack](#2-tech-stack)
3. [Struktur Folder](#3-struktur-folder)
4. [Skema Database](#4-skema-database)
5. [Middleware & Routing](#5-middleware--routing)
6. [Autentikasi & RBAC](#6-autentikasi--rbac)
7. [Modul & Halaman](#7-modul--halaman)
8. [API Endpoints](#8-api-endpoints)
9. [Komponen UI](#9-komponen-ui)
10. [Lib & Utilities](#10-lib--utilities)
11. [Pola Arsitektur](#11-pola-arsitektur)
12. [Fitur Keamanan](#12-fitur-keamanan)
13. [Relasi Antar Tabel](#13-relasi-antar-tabel)
14. [Alur Bisnis Utama](#14-alur-bisnis-utama)
15. [Panduan Pengembangan](#15-panduan-pengembangan)

---

## 1. Gambaran Umum

**Sistem Gerobak** adalah sistem manajemen operasional F&B berbasis Next.js + Supabase. Mencakup seluruh siklus bisnis gerobak kuliner dari penjualan, produksi dapur, pembelian bahan baku, inventaris, absensi karyawan, hingga laporan eksekutif.

### Entitas Utama

| Entitas | Keterangan |
|---------|-----------|
| Gerobak | Titik penjualan lapangan (G1, G2, G3) |
| Dapur Pusat / Central Kitchen | Lokasi produksi makanan |
| Menu | Produk yang dijual di gerobak |
| Bahan Baku | Ingredient/material untuk produksi |
| Supplier | Pemasok bahan baku |
| Karyawan | Seluruh pengguna sistem berdasarkan role |

---

## 2. Tech Stack

| Layer | Teknologi | Versi |
|-------|-----------|-------|
| Framework | Next.js (App Router) | 16.2.4 |
| UI Library | React | 19.2.4 |
| Language | TypeScript | 5 |
| Database | Supabase (PostgreSQL) | — |
| Auth | Supabase Auth + SSR | @supabase/ssr 0.10.2 |
| Styling | Tailwind CSS | 4 |
| Component Base | shadcn/ui + Base UI | — |
| State Management | Zustand | 5 |
| Data Fetching | TanStack React Query | 5.99.2 |
| Icons | Lucide React | 1.8.0 |
| Toast Notification | Sonner | 2.0.7 |
| Form Utilities | clsx + tailwind-merge | — |

### Script NPM

```bash
npm run dev      # Development server (port 3000)
npm run build    # Production build
npm run start    # Production server
npm run lint     # ESLint check
```

---

## 3. Struktur Folder

```
sistem-gerobak/
├── app/
│   ├── (app)/                         # Route group — halaman terproteksi
│   │   ├── layout.tsx                 # Layout utama: auth check, nav, clock-in popup
│   │   ├── dashboard/                 # Dashboard ringkasan harian
│   │   ├── pos/                       # Point of Sale
│   │   ├── kitchen/                   # Manajemen produksi dapur
│   │   ├── inventory/                 # Manajemen stok bahan baku
│   │   ├── purchasing/                # Purchase Order
│   │   ├── attendance/                # Absensi & cuti karyawan
│   │   │   └── approvals/             # Approval antrian cuti/izin
│   │   ├── reports/                   # Laporan (penjualan/inventory/SDM)
│   │   └── settings/                  # Pengaturan sistem
│   │       ├── users/                 # Kelola karyawan
│   │       ├── menus/                 # Kelola menu & resep
│   │       ├── inventory/             # Kelola master bahan baku
│   │       ├── suppliers/             # Kelola supplier
│   │       ├── locations/             # Kelola lokasi + GPS geofence
│   │       ├── roles/                 # Kelola role & akses modul
│   │       └── assets/                # Aset & penyusutan
│   ├── (auth)/
│   │   └── login/                     # Halaman login
│   ├── api/                           # Backend API routes (Next.js Route Handlers)
│   │   ├── attendance/
│   │   ├── assets/
│   │   ├── dashboard/
│   │   ├── inventory/
│   │   ├── kitchen/
│   │   ├── labor-cost/
│   │   ├── leave-requests/
│   │   ├── locations/
│   │   ├── menus/
│   │   ├── pos/
│   │   ├── purchasing/
│   │   ├── reports/
│   │   ├── roles/
│   │   ├── suppliers/
│   │   └── users/
│   ├── layout.tsx                     # Root layout (font, theme, providers)
│   └── page.tsx                       # Entry point — redirect ke /login
├── components/
│   ├── ui/                            # shadcn base components
│   ├── layout/                        # SideNav, TopHeader, BottomNav
│   ├── shared/                        # Providers, MoneyInput, dll.
│   ├── attendance/                    # ClockInPopup
│   ├── dashboard/                     # Widget cards
│   ├── pos/                           # POS interface components
│   ├── kitchen/                       # Kitchen task components
│   ├── inventory/                     # Stock components
│   └── purchasing/                    # PO card & modals
├── lib/
│   ├── supabase/
│   │   ├── client.ts                  # Browser Supabase client
│   │   ├── server.ts                  # Server + Admin Supabase client
│   │   └── auth-helpers.ts            # Auth utils & response helpers
│   ├── types/
│   │   └── index.ts                   # Semua TypeScript types & interfaces
│   ├── stores/                        # Zustand state stores
│   ├── hooks/                         # Custom React hooks
│   └── utils.ts                       # cn() helper
├── supabase/
│   └── migrations/
│       ├── 001_initial_schema.sql     # Skema awal + RLS
│       ├── 002_rbac_and_locations.sql # RBAC, modul, lokasi
│       └── 003_attendance_leave_laborcost.sql  # Absensi GPS, cuti, biaya SDM
├── public/
│   ├── manifest.json                  # PWA manifest
│   └── icons/                         # App icons
├── middleware.ts                      # Auth guard + role-based routing
├── next.config.ts                     # Next.js config
└── package.json
```

---

## 4. Skema Database

### Cara Menjalankan Migrasi

```sql
-- Jalankan di Supabase SQL Editor secara berurutan:
-- 1. supabase/migrations/001_initial_schema.sql
-- 2. supabase/migrations/002_rbac_and_locations.sql
-- 3. supabase/migrations/003_attendance_leave_laborcost.sql
```

---

### Tabel Master

#### `m_users` — Karyawan / Pengguna

| Kolom | Tipe | Keterangan |
|-------|------|-----------|
| id | UUID PK | FK → auth.users |
| nama_lengkap | TEXT NOT NULL | |
| role | TEXT | owner\|manager\|purchaser\|koki\|crew_gerobak\|delivery |
| lokasi_tugas | TEXT | central_kitchen\|gerobak_1\|gerobak_2\|gerobak_3\|mobile |
| no_hp | TEXT | |
| gaji_pokok | INTEGER | Gaji bulanan (Rupiah) |
| is_active | BOOLEAN | Default true |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

#### `m_gerobak` — Gerobak / Titik Penjualan

| Kolom | Tipe | Keterangan |
|-------|------|-----------|
| id | UUID PK | |
| nama | TEXT | "Gerobak 1", "Gerobak 2", dll. |
| lokasi | TEXT | Deskripsi lokasi fisik |
| is_active | BOOLEAN | |
| created_at | TIMESTAMPTZ | |

#### `m_menu` — Daftar Menu

| Kolom | Tipe | Keterangan |
|-------|------|-----------|
| id | UUID PK | |
| nama_menu | TEXT NOT NULL | |
| kategori | TEXT | nasi\|lauk\|sayur\|kriuk\|minuman\|paket\|lainnya |
| harga_jual | INTEGER NOT NULL | Harga jual (Rupiah) |
| hpp_current | INTEGER | HPP terhitung dari resep (auto-update) |
| deskripsi | TEXT | |
| image_url | TEXT | |
| is_active | BOOLEAN | |
| urutan | INTEGER | Urutan tampil di POS |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

#### `m_bahan_baku` — Bahan Baku

| Kolom | Tipe | Keterangan |
|-------|------|-----------|
| id | UUID PK | |
| nama_bahan | TEXT NOT NULL | |
| kategori | TEXT | |
| satuan | TEXT | kg, liter, pcs, dll. |
| stok_sekarang | DECIMAL(10,2) | Stok saat ini |
| stok_minimum | DECIMAL(10,2) | Ambang batas alert |
| harga_terakhir | INTEGER | Harga beli terakhir |
| lokasi_simpan | TEXT | kulkas\|freezer\|rak_kering\|meja_prep |
| cara_simpan | TEXT | |
| masa_simpan_hari | INTEGER | |
| supplier_utama_id | UUID FK → m_supplier | |
| catatan | TEXT | |
| is_active | BOOLEAN | |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

#### `m_resep` — Resep Menu

| Kolom | Tipe | Keterangan |
|-------|------|-----------|
| id | UUID PK | |
| menu_id | UUID FK → m_menu | |
| bahan_id | UUID FK → m_bahan_baku | |
| qty_per_porsi | DECIMAL(10,3) | |
| satuan | TEXT | |
| tahap | TEXT | pre_cook\|cook\|finish |
| catatan | TEXT | |
| UNIQUE | (menu_id, bahan_id) | |

#### `m_supplier` — Supplier

| Kolom | Tipe | Keterangan |
|-------|------|-----------|
| id | UUID PK | |
| nama_supplier | TEXT NOT NULL | |
| kontak, email, alamat, pic | TEXT | |
| kategori_supply | TEXT | |
| metode_bayar | TEXT | tunai\|transfer\|tempo_7\|tempo_14 |
| lead_time_hari | INTEGER | |
| min_order | TEXT | |
| termin_pembayaran | TEXT | |
| catatan | TEXT | |
| status | TEXT | aktif\|cadangan\|nonaktif |
| is_active | BOOLEAN | |

#### `m_lokasi` — Lokasi Operasional (GPS)

| Kolom | Tipe | Keterangan |
|-------|------|-----------|
| id | TEXT PK | central_kitchen, gerobak_1, dst. |
| nama | TEXT NOT NULL | |
| deskripsi | TEXT | |
| is_active | BOOLEAN | |
| latitude | DECIMAL(10,7) | Koordinat GPS |
| longitude | DECIMAL(10,7) | Koordinat GPS |
| radius_meter | INTEGER | Default 100m (geofence) |
| created_at | TIMESTAMPTZ | |

#### `m_roles` — Definisi Role

| Kolom | Tipe | Keterangan |
|-------|------|-----------|
| id | TEXT PK | owner, manager, dst. |
| display_name | TEXT | Nama tampil |
| ui_type | TEXT | executor\|planner |
| color | TEXT | Hex color |
| deskripsi | TEXT | |
| is_system | BOOLEAN | True = tidak bisa dihapus |
| created_at | TIMESTAMPTZ | |

#### `m_modules` — Modul Aplikasi

| Kolom | Tipe | Keterangan |
|-------|------|-----------|
| key | TEXT PK | pos, attendance, reports, dst. |
| label | TEXT | Nama tampil |
| icon_name | TEXT | Lucide icon name |
| href | TEXT | URL path |
| kategori | TEXT | operational\|management\|settings |
| urutan | INTEGER | Urutan tampil di nav |

#### `m_role_modules` — Hak Akses Role → Modul

| Kolom | Tipe | Keterangan |
|-------|------|-----------|
| role_id | TEXT FK → m_roles | |
| module_key | TEXT FK → m_modules | |
| PK | (role_id, module_key) | |

---

### Tabel Transaksi

#### `t_shift` — Shift Harian Gerobak

| Kolom | Tipe | Keterangan |
|-------|------|-----------|
| id | UUID PK | |
| gerobak_id | UUID FK → m_gerobak | |
| crew_id | UUID FK → m_users | |
| tanggal | DATE | |
| waktu_buka | TIMESTAMPTZ | |
| waktu_tutup | TIMESTAMPTZ | |
| cash_awal | INTEGER | Modal awal |
| cash_akhir | INTEGER | Kas akhir (saat tutup) |
| total_qris | INTEGER | Total QRIS diterima |
| total_transaksi_sistem | INTEGER | Total dari sistem |
| selisih | INTEGER | cash_akhir - (cash_awal + total_tunai) |
| status_rekon | TEXT | pending\|ok\|ada_selisih |
| catatan | TEXT | |
| created_at | TIMESTAMPTZ | |
| UNIQUE | (gerobak_id, tanggal) | 1 shift per gerobak per hari |

#### `t_transaksi` — Transaksi Penjualan

| Kolom | Tipe | Keterangan |
|-------|------|-----------|
| id | UUID PK | |
| shift_id | UUID FK → t_shift | |
| gerobak_id | UUID FK → m_gerobak | |
| nomor_struk | TEXT | Format: G1-20260424-001 |
| waktu | TIMESTAMPTZ | |
| metode_bayar | TEXT | tunai\|qris |
| total | INTEGER | |
| status | TEXT | selesai\|batal\|pending |
| crew_id | UUID FK → m_users | |
| created_at | TIMESTAMPTZ | |

#### `t_penjualan` — Item Per Transaksi

| Kolom | Tipe | Keterangan |
|-------|------|-----------|
| id | UUID PK | |
| transaksi_id | UUID FK → t_transaksi | |
| shift_id | UUID FK → t_shift | |
| menu_id | UUID FK → m_menu | |
| nama_menu | TEXT | Snapshot nama saat transaksi |
| harga_satuan | INTEGER | Snapshot harga saat transaksi |
| qty | INTEGER | |
| subtotal | INTEGER | |
| status | TEXT | keranjang\|terjual\|batal |
| created_at | TIMESTAMPTZ | |

#### `t_stok_gerobak` — Stok Per Shift

| Kolom | Tipe | Keterangan |
|-------|------|-----------|
| id | UUID PK | |
| shift_id | UUID FK → t_shift | |
| menu_id | UUID FK → m_menu | |
| qty_terima | INTEGER | Stok awal shift |
| qty_terjual | INTEGER | Terjual (auto-update per transaksi) |
| qty_sisa | INTEGER | Input saat tutup shift |
| qty_waste | INTEGER | Terbuang/rusak |
| created_at | TIMESTAMPTZ | |
| UNIQUE | (shift_id, menu_id) | |

#### `t_produksi` — Order Produksi Dapur

| Kolom | Tipe | Keterangan |
|-------|------|-----------|
| id | UUID PK | |
| tanggal | DATE | Tanggal produksi |
| menu_id | UUID FK → m_menu | |
| tipe | TEXT | regular\|pre_cook\|tambahan\|kustom |
| target_porsi | INTEGER | |
| alokasi_g1/g2/g3 | INTEGER | Alokasi per gerobak |
| koki_id | UUID FK → m_users | |
| status | TEXT | belum\|proses\|selesai\|qc_ok\|terkirim |
| realisasi_porsi | INTEGER | Aktual yang diproduksi |
| waktu_selesai | TIMESTAMPTZ | |
| catatan | TEXT | |
| created_at, updated_at | TIMESTAMPTZ | |

#### `t_inventory_masuk` — Penerimaan Bahan Baku

| Kolom | Tipe | Keterangan |
|-------|------|-----------|
| id | UUID PK | |
| bahan_id | UUID FK → m_bahan_baku | |
| po_id | UUID FK → t_purchase_order | Nullable |
| tanggal_masuk | DATE | |
| qty_masuk | DECIMAL(10,2) | |
| harga_beli | INTEGER | Harga per satuan |
| expired_date | DATE | |
| supplier_id | UUID FK → m_supplier | |
| diterima_oleh | UUID FK → m_users | |
| catatan | TEXT | |
| created_at | TIMESTAMPTZ | |

#### `t_purchase_order` — Purchase Order

| Kolom | Tipe | Keterangan |
|-------|------|-----------|
| id | UUID PK | |
| nomor_po | TEXT | Format: PO-20260424-001 |
| tanggal_po | DATE | |
| tanggal_butuh | DATE | Target tiba |
| bahan_id | UUID FK → m_bahan_baku | |
| supplier_id | UUID FK → m_supplier | |
| qty_order | DECIMAL(10,2) | |
| satuan | TEXT | |
| harga_estimasi | INTEGER | |
| harga_realisasi | INTEGER | Diisi saat realisasi |
| total_estimasi | INTEGER | |
| total_realisasi | INTEGER | |
| bukti_foto_url | TEXT | |
| status | TEXT | draft\|approved\|sudah_beli\|sudah_terima |
| dibuat_oleh | UUID FK → m_users | |
| diapprove_oleh | UUID FK → m_users | |
| catatan | TEXT | |
| created_at, updated_at | TIMESTAMPTZ | |

#### `t_absensi` — Absensi Karyawan

| Kolom | Tipe | Keterangan |
|-------|------|-----------|
| id | UUID PK | |
| karyawan_id | UUID FK → m_users | |
| tanggal | DATE | |
| lokasi_kerja | TEXT | |
| jam_masuk | TIMESTAMPTZ | Clock in time |
| jam_pulang | TIMESTAMPTZ | Clock out time |
| status | TEXT | hadir\|izin\|sakit\|alfa\|libur |
| lembur_jam | INTEGER | |
| keterangan | TEXT | |
| ip_address | TEXT | IP saat clock in |
| is_vpn | BOOLEAN | Terdeteksi VPN? |
| latitude_in | DECIMAL(10,7) | GPS clock in |
| longitude_in | DECIMAL(10,7) | GPS clock in |
| latitude_out | DECIMAL(10,7) | GPS clock out |
| longitude_out | DECIMAL(10,7) | GPS clock out |
| catatan_out | TEXT | Catatan saat clock out |
| created_at | TIMESTAMPTZ | |
| UNIQUE | (karyawan_id, tanggal) | |

#### `t_leave_requests` — Pengajuan Cuti / Izin

| Kolom | Tipe | Keterangan |
|-------|------|-----------|
| id | UUID PK | |
| user_id | UUID FK → m_users | |
| type | TEXT | cuti\|sakit\|izin_lain |
| tanggal_mulai | DATE | |
| tanggal_selesai | DATE | |
| alasan | TEXT | |
| document_url | TEXT | URL dokumen pendukung |
| status | TEXT | pending\|approved\|rejected |
| approved_by | UUID FK → m_users | |
| approved_at | TIMESTAMPTZ | |
| catatan_approval | TEXT | Catatan dari approver |
| created_at | TIMESTAMPTZ | |

#### `t_labor_cost` — Biaya SDM Bulanan

| Kolom | Tipe | Keterangan |
|-------|------|-----------|
| id | UUID PK | |
| user_id | UUID FK → m_users | |
| bulan | DATE | Selalu tanggal 1 (2026-04-01) |
| metode | TEXT | prorata\|total_gaji |
| hari_kerja | INTEGER | Total hari kerja bulan itu |
| hari_hadir | INTEGER | Hari hadir aktual |
| gaji_pokok | INTEGER | Snapshot gaji saat hitung |
| nilai_cost | INTEGER | Hasil kalkulasi |
| dibuat_oleh | UUID FK → m_users | Manager/owner yang hitung |
| created_at | TIMESTAMPTZ | |
| UNIQUE | (user_id, bulan) | Upsert pattern |

#### `t_waste_log` — Log Pemborosan

| Kolom | Tipe | Keterangan |
|-------|------|-----------|
| id | UUID PK | |
| tanggal | DATE | |
| tipe_waste | TEXT | bahan_baku\|masakan_jadi\|semi_produk |
| item_nama | TEXT | |
| qty_waste | DECIMAL | |
| satuan | TEXT | |
| alasan | TEXT | expired\|rusak\|sisa_produksi\|sisa_gerobak |
| estimasi_nilai | INTEGER | |
| dilaporkan_oleh | UUID FK → m_users | |
| shift_id | UUID FK → t_shift | |
| created_at | TIMESTAMPTZ | |

---

### Storage Bucket

| Bucket | Akses | Keterangan |
|--------|-------|-----------|
| `leave-documents` | Private | Dokumen pendukung cuti/izin |

- Path format: `{user_id}/{timestamp}.{ext}`
- Batas ukuran: 10 MB
- Tipe diizinkan: jpeg, png, webp, pdf

---

## 5. Middleware & Routing

File: `middleware.ts`

### Alur Kerja

```
Request masuk
    │
    ▼
Apakah path publik? (/login, manifest.json, _next/*, api/*, icons/*)
    │ Ya → Lanjut tanpa cek
    │ Tidak ▼
Apakah user terautentikasi?
    │ Tidak → Redirect /login
    │ Ya ▼
Ambil profile dari m_users
    │
    ▼
Apakah path termasuk roleAllowedPaths[role]?
    │ Tidak → Redirect ke roleRedirects[role]
    │ Ya → Lanjut ke halaman
```

### Pemetaan Role → Path yang Diizinkan

| Role | Path yang Diizinkan |
|------|-------------------|
| owner | /dashboard, /pos, /kitchen, /inventory, /purchasing, /attendance, /reports, /settings |
| manager | /dashboard, /pos, /kitchen, /inventory, /purchasing, /attendance, /reports, /settings |
| purchaser | /purchasing, /inventory, /attendance, /settings |
| koki | /kitchen, /inventory, /attendance, /settings |
| crew_gerobak | /pos, /attendance, /settings |
| delivery | /pos, /attendance, /settings |

### Default Redirect per Role

| Role | Redirect Default |
|------|----------------|
| owner | /dashboard |
| manager | /dashboard |
| purchaser | /purchasing |
| koki | /kitchen |
| crew_gerobak | /pos |
| delivery | /pos |

---

## 6. Autentikasi & RBAC

### Lapisan Keamanan

```
Browser  →  Middleware  →  API Route  →  Supabase RLS
  (1)          (2)            (3)            (4)
```

1. **Middleware**: Blokir akses halaman berdasarkan role sebelum halaman dimuat
2. **API Route Handler**: `getAuthProfile()` → validasi role di setiap endpoint
3. **Supabase RLS**: Policy database level mencegah query langsung ke data yang tidak diizinkan
4. **Admin Client**: `createAdminClient()` menggunakan service role key — bypass RLS, hanya digunakan di server

### Helper Auth (`lib/supabase/auth-helpers.ts`)

```typescript
getAuthUser()     → User | null   // Dari Supabase Auth
getAuthProfile()  → Profile | null // Dari m_users (includes role)
hasRole(role, allowed[]) → boolean  // Cek apakah role ada di array

// Response helpers (standarisasi semua API response):
ok(data, msg?)       → 200 JSON { success: true, data, message }
created(data, msg?)  → 201 JSON { success: true, data, message }
unauthorized()       → 401 JSON { success: false, message: 'Unauthorized' }
forbidden()          → 403 JSON { success: false, message: 'Forbidden' }
badRequest(msg)      → 400 JSON { success: false, message }
notFound(msg)        → 404 JSON { success: false, message }
conflict(msg)        → 409 JSON { success: false, message }
serverError(msg?)    → 500 JSON { success: false, message }
```

### Hierarki Approval

```
Owner
  └── Approves: Manager leave requests
Manager
  └── Approves: Semua kecuali Owner
  └── Approves: Purchase Orders (tapi tidak bisa approve PO sendiri)
Purchaser
  └── Buat PO, tidak bisa self-approve
```

---

## 7. Modul & Halaman

### Dashboard (`/dashboard`)
- **Role**: owner, manager
- **Data**: Revenue harian, jumlah transaksi, shift aktif/tutup, ada selisih, ringkasan per gerobak, status produksi hari ini, bahan baku kritis
- **Component**: `DashboardClient.tsx` — date selector, summary cards, gerobak cards, production table, critical stock list

### POS — Point of Sale (`/pos`)
- **Role**: crew_gerobak, delivery, owner, manager
- **Fitur**: Buka shift → pilih menu → keranjang → bayar (tunai/QRIS) → cetak struk → tutup shift + rekonsiliasi kas
- **Component**: `PosClient.tsx`, `MenuCard`, `CartBar`, `CartItemRow`, `OpenShiftModal`, `CloseShiftModal`, `QrisPaymentModal`

### Kitchen — Dapur (`/kitchen`)
- **Role**: koki, owner, manager
- **Fitur**: Buat jadwal produksi, update status (belum→proses→selesai→qc_ok→terkirim), alokasi per gerobak, assign ke koki
- **Component**: `KitchenClient.tsx`

### Inventory (`/inventory`)
- **Role**: semua yang memiliki akses inventory
- **Fitur**: Daftar stok bahan baku, alert stok rendah, input barang masuk, filter (semua/kritis/warning)
- **Component**: `InventoryClient.tsx`

### Purchasing (`/purchasing`)
- **Role**: purchaser, owner, manager
- **Fitur**: Buat PO, approval workflow (draft→approved→sudah_beli→sudah_terima), auto-receive ke inventory saat sudah_terima
- **Component**: `PurchasingClient.tsx`, `CreatePOModal`, `UpdatePOModal`

### Attendance — Absensi (`/attendance`)
- **Role**: semua
- **Fitur**:
  - Tab "Hari Ini": clock in/out dengan GPS, status kehadiran, deteksi VPN (flag saja)
  - Tab "Riwayat": histori absensi bulanan, durasi kerja, badge VPN
  - Tab "Cuti & Izin": form pengajuan + upload dokumen, daftar status pengajuan
- **Component**: `AttendanceClient.tsx`

#### Approval Absensi (`/attendance/approvals`)
- **Role**: manager, owner
- **Fitur**: Antrian pengajuan pending, approve/reject dengan catatan, lihat dokumen
- **Component**: `ApprovalsClient.tsx`

#### Clock-In Popup
- **Trigger**: Muncul otomatis di semua halaman saat login jika belum clock in hari ini (semua role kecuali owner)
- **Fix kritis**: `if (!open) return null` — unmount seluruh Dialog tree saat ditutup, mencegah base-ui backdrop tetap di DOM dan memblokir klik navigasi
- **Component**: `components/attendance/ClockInPopup.tsx`

### Reports — Laporan (`/reports`)
- **Role**: owner, manager
- **Laporan yang tersedia**:
  | Tipe | Data |
  |------|------|
  | Penjualan | Revenue total, per hari, tunai vs QRIS, top 10 menu terlaris |
  | Inventaris | Penerimaan barang, total nilai, stok di bawah minimum |
  | Pembelian | PO realisasi vs estimasi, breakdown per supplier |
  | SDM | Rekap absensi, jam kerja, kalkulator biaya labor |

### Settings (`/settings`)
- **Role**: owner (semua), manager (sebagian)
- **Sub-halaman**:
  | Sub-halaman | Role | Fitur |
  |-------------|------|-------|
  | users | owner, manager | CRUD karyawan, set gaji |
  | menus | owner, manager | CRUD menu + resep + auto-HPP |
  | inventory | owner, manager | CRUD bahan baku master |
  | suppliers | purchaser+ | CRUD supplier |
  | locations | owner, manager | CRUD lokasi + GPS koordinat + radius |
  | roles | owner | CRUD role + assign modul akses |
  | assets | owner, manager | CRUD aset + kalkulasi penyusutan |

---

## 8. API Endpoints

Format response semua endpoint:
```json
{ "success": true, "data": {...}, "message": "..." }
{ "success": false, "message": "..." }
```

---

### Attendance

#### `GET /api/attendance`
Ambil data absensi.

| Query Param | Keterangan |
|-------------|-----------|
| `bulan` | Format YYYY-MM |
| `today=1` | Hanya absensi hari ini |
| `user_id` | Filter user tertentu (admin only) |

**Auth**: Semua. User biasa hanya lihat data sendiri.

**Response**:
```json
{
  "data": [{
    "id": "uuid",
    "karyawan_id": "uuid",
    "tanggal": "2026-04-24",
    "jam_masuk": "2026-04-24T08:00:00Z",
    "jam_pulang": "2026-04-24T17:00:00Z",
    "status": "hadir",
    "is_vpn": false,
    "latitude_in": -6.2,
    "longitude_in": 106.8,
    "karyawan": { "nama_lengkap": "...", "role": "..." }
  }]
}
```

#### `POST /api/attendance`
Clock in atau clock out.

**Body**:
```json
{ "action": "in", "latitude": -6.2, "longitude": 106.8 }
{ "action": "out", "catatan_out": "..." }
```

**Logika**:
- Deteksi VPN via `ip-api.com/json/{ip}?fields=proxy,hosting` (3 detik timeout, graceful fail)
- `action: "in"` → cek tidak boleh double clock in
- `action: "out"` → cek sudah clock in
- Menyimpan IP address dan koordinat GPS
- Response berisi `is_vpn` flag

---

### Dashboard

#### `GET /api/dashboard/summary`

| Query Param | Keterangan |
|-------------|-----------|
| `date` | YYYY-MM-DD (default: hari ini) |

**Auth**: owner, manager

**Response**:
```json
{
  "data": {
    "summary": {
      "total_revenue": 1500000,
      "total_transactions": 42,
      "active_shifts": 2,
      "closed_shifts": 1,
      "selisih_count": 0
    },
    "per_gerobak": [
      { "gerobak_id": "...", "nama": "Gerobak 1", "revenue": 800000, "transactions": 20, "status_rekon": "ok" }
    ],
    "production_today": [
      { "menu": "Nasi Goreng", "target_porsi": 50, "realisasi_porsi": 48, "status": "qc_ok" }
    ],
    "critical_items": [
      { "nama_bahan": "Bawang Putih", "stok_sekarang": 0.5, "stok_minimum": 1 }
    ]
  }
}
```

#### `GET /api/dashboard/hpp`
Kalkulasi HPP dan margin per menu.

**Response**: `[{ menu_id, nama_menu, kategori, harga_jual, hpp, margin_percent }]`

---

### POS

#### `GET /api/pos/shift`
Ambil shift aktif hari ini.

| Query Param | Keterangan |
|-------------|-----------|
| `gerobak_id` | Filter per gerobak |
| `assigned_to=me` | Hanya shift milik user (auto-resolve lokasi crew) |

#### `POST /api/pos/shift`
Buka shift baru.

**Body**:
```json
{
  "cash_awal": 500000,
  "stok_awal": [
    { "menu_id": "uuid", "qty_terima": 50 }
  ],
  "gerobak_id": "uuid"
}
```

#### `POST /api/pos/shift/close`
Tutup shift + rekonsiliasi.

**Body**:
```json
{
  "shift_id": "uuid",
  "cash_akhir": 650000,
  "stok_penutupan": [
    { "menu_id": "uuid", "qty_sisa": 5, "qty_waste": 2 }
  ],
  "catatan": "..."
}
```

**Logika**: Auto-hitung `total_qris`, `total_transaksi_sistem`, `selisih`, `status_rekon`.

#### `POST /api/pos/transactions`
Catat transaksi penjualan.

**Body**:
```json
{
  "shift_id": "uuid",
  "metode_bayar": "tunai",
  "cart_items": [
    { "menu_id": "uuid", "qty": 2 }
  ],
  "payment": { "uang_diterima": 50000 }
}
```

**Keamanan**: Harga diambil server-side dari DB (anti-manipulasi harga dari client).

**Response**: `{ id, nomor_struk, metode_bayar, total, kembalian }`

#### `GET /api/pos/menu`
Daftar menu aktif.

| Query Param | Keterangan |
|-------------|-----------|
| `kategori` | Filter kategori (default: semua) |

---

### Kitchen

#### `GET /api/kitchen/production`
Daftar order produksi.

| Query Param | Keterangan |
|-------------|-----------|
| `date` | YYYY-MM-DD (default hari ini) |
| `assigned_to=me` | Filter ke koki yang login |

#### `POST /api/kitchen/production`
Buat order produksi baru. **Auth**: owner, manager.

**Body**: `{ tanggal?, menu_id, target_porsi, alokasi_g1?, alokasi_g2?, alokasi_g3?, koki_id?, tipe?, catatan? }`

#### `PATCH /api/kitchen/production/[id]`
Update status produksi.

**Body**: `{ status?, realisasi_porsi?, catatan? }`

**Aturan**: Koki hanya bisa update task sendiri; `waktu_selesai` auto-diisi saat `status=selesai`.

---

### Inventory

#### `GET /api/inventory/stock`
Status stok dengan kalkulasi level.

| Query Param | Keterangan |
|-------------|-----------|
| `search` | Cari nama bahan (ILIKE) |
| `filter` | all \| critical \| warning |

**Level stok**:
- `critical`: stok ≤ stok_minimum
- `warning`: stok ≤ stok_minimum × 1.5
- `ok`: otherwise

#### `POST /api/inventory/incoming`
Input barang masuk.

**Body**: `{ bahan_id, tanggal_masuk?, qty_masuk, harga_beli, supplier_id?, expired_date?, catatan? }`

**Efek**: Update `stok_sekarang += qty_masuk` dan `harga_terakhir` di `m_bahan_baku`.

#### `POST /api/inventory/bahan`
Tambah bahan baku baru. **Auth**: owner, manager.

#### `PATCH /api/inventory/bahan/[id]`
Edit bahan baku. **Auth**: owner, manager.

---

### Purchasing

#### `GET /api/purchasing/po`
Daftar PO dengan filter status.

#### `POST /api/purchasing/po`
Buat PO baru.

**Body**: `{ tanggal_po?, tanggal_butuh, bahan_id, supplier_id?, qty_order, satuan, harga_estimasi?, catatan? }`

**Auto-generate**: Nomor PO format `PO-{YYYYMMDD}-{seq}`.

#### `PATCH /api/purchasing/po/[id]`
Update status PO.

**Alur status**: `draft → approved → sudah_beli → sudah_terima`

**Aturan**:
- Purchaser tidak bisa self-approve
- Saat `sudah_terima`: auto-buat `t_inventory_masuk` + update stok bahan baku

---

### Leave Requests

#### `GET /api/leave-requests`
Daftar pengajuan cuti/izin.

| Query Param | Keterangan |
|-------------|-----------|
| `pending=1` | Hanya yang menunggu approval |

**Visibilitas**:
- User biasa → hanya pengajuan sendiri
- Manager → semua kecuali pengajuan owner
- Owner → semua

#### `POST /api/leave-requests`
Buat pengajuan baru.

**Body**: `{ type: 'cuti'|'sakit'|'izin_lain', tanggal_mulai, tanggal_selesai, alasan?, document_url? }`

#### `PATCH /api/leave-requests/[id]`
Approve atau reject.

**Body**: `{ action: 'approved'|'rejected', catatan_approval? }`

**Aturan**: Manager tidak bisa approve pengajuan owner.

#### `POST /api/leave-requests/upload`
Upload dokumen pendukung.

**Body**: `FormData { file: File }` — max 10MB, MIME: jpeg/png/webp/pdf

**Response**: `{ url: "https://..." }`

---

### Labor Cost

#### `GET /api/labor-cost`

| Query Param | Keterangan |
|-------------|-----------|
| `bulan` | Format YYYY-MM |

**Auth**: owner, manager

#### `POST /api/labor-cost`
Hitung dan simpan biaya SDM.

**Body**:
```json
{
  "user_id": "uuid",
  "bulan": "2026-04",
  "metode": "prorata",
  "hari_kerja": 26,
  "hari_hadir": 22,
  "gaji_pokok": 3000000,
  "nilai_cost": 2538462
}
```

**Rumus prorata**: `nilai_cost = gaji_pokok ÷ hari_kerja × hari_hadir`

**Rumus total_gaji**: `nilai_cost = gaji_pokok`

**Upsert**: `ON CONFLICT (user_id, bulan)` → update nilai yang sudah ada.

---

### Reports

#### `GET /api/reports`

| Query Param | Keterangan |
|-------------|-----------|
| `type` | sales \| inventory \| purchasing \| labor |
| `from` | YYYY-MM-DD |
| `to` | YYYY-MM-DD |

**Auth**: owner, manager

**Sales Response**:
```json
{
  "summary": { "total_revenue": 0, "total_transactions": 0, "total_tunai": 0, "total_qris": 0 },
  "by_day": [{ "date": "2026-04-24", "total": 0, "count": 0, "tunai": 0, "qris": 0 }],
  "top_items": [{ "menu_id": "...", "nama": "Nasi Goreng", "qty": 120, "revenue": 1800000 }]
}
```

**Labor Response**:
```json
{
  "summary": { "total_karyawan": 5, "total_hadir": 110, "total_jam_kerja": 880, "total_saved_cost": 15000000 },
  "by_user": [{ "user_id": "...", "nama": "...", "hari_hadir": 22, "total_menit": 7920, "vpn_count": 1 }],
  "saved_costs": [...],
  "leave_summary": [...],
  "all_users": [...]
}
```

---

### Users

#### `GET /api/users` — List karyawan. **Auth**: owner, manager.

#### `POST /api/users` — Buat user baru.
**Body**: `{ nama_lengkap, email, password (min 6), role, lokasi_tugas?, no_hp?, gaji_pokok? }`

**Workflow**: Buat Supabase Auth user → Buat m_users record → Rollback jika gagal.

#### `PATCH /api/users/[id]`
**Body**: `{ nama_lengkap?, role?, lokasi_tugas?, no_hp?, is_active?, password?, gaji_pokok? }`

**Aturan**: Manager tidak bisa edit akun owner.

#### `DELETE /api/users/[id]`
Soft-delete (set `is_active=false`, ban auth user). **Auth**: owner only.

---

### Menus

#### `GET /api/menus` — List menu + resep. **Auth**: owner, manager.
#### `POST /api/menus` — Buat menu baru. **Auth**: owner, manager.
#### `PATCH /api/menus/[id]` — Update menu.
#### `GET /api/menus/[id]/recipe` — Ambil resep.
#### `POST /api/menus/[id]/recipe` — Ganti seluruh resep (delete all + insert baru).

**Auto-HPP**: Saat resep diupdate, `hpp_current = Σ(qty_per_porsi × harga_terakhir)` dihitung otomatis.

---

### Locations, Roles, Suppliers, Assets

Endpoint CRUD standar (GET/POST/PATCH) tersedia di masing-masing:
- `/api/locations` — Lokasi + GPS
- `/api/roles` + `/api/roles/[id]/modules` — Role + hak akses modul
- `/api/suppliers` — Supplier master
- `/api/assets` — Aset + auto-penyusutan

---

## 9. Komponen UI

### Layout

| Komponen | Path | Keterangan |
|----------|------|-----------|
| `SideNav` | components/layout/SideNav.tsx | Navigasi sidebar (role planner/web) |
| `BottomNav` | components/layout/BottomNav.tsx | Navigasi bawah (role executor/mobile) |
| `TopHeader` | components/layout/TopHeader.tsx | Header halaman |

**ICON_MAP** (SideNav & BottomNav): `ShoppingCart, ChefHat, Package, ShoppingBag, LayoutDashboard, Settings, ClipboardCheck, BarChart3, Clock`

Tambahkan icon baru di sini jika menambah modul baru yang menggunakan icon Lucide berbeda.

### Shared

| Komponen | Keterangan |
|----------|-----------|
| `Providers.tsx` | Wrapper React Query + Zustand providers |
| `MoneyInput.tsx` | Input currency dengan format Rupiah (Rp 1.500.000) |
| `ClockInPopup.tsx` | Popup clock in otomatis saat login (non-owner) |

### UI Base (shadcn)

`Button, Input, Label, Dialog, Select, Tabs, Card, Sheet, Badge, Separator, Sonner (toast)`

---

## 10. Lib & Utilities

### Supabase Clients

```typescript
// Browser (Client Components)
import { createClient } from '@/lib/supabase/client'
const supabase = createClient()

// Server (Server Components, Route Handlers)
import { createClient } from '@/lib/supabase/server'
const supabase = await createClient()

// Admin — bypass RLS, hanya di Route Handlers
import { createAdminClient } from '@/lib/supabase/server'
const admin = createAdminClient()
```

### Format Utilities

```typescript
formatRupiah(1500000)           // → "Rp 1.500.000"
formatDate("2026-04-24")        // → "24 April 2026"
formatDateShort("2026-04-24")   // → "24/04/2026"
formatTime("2026-04-24T08:00Z") // → "08:00"
getTodayDate()                  // → "2026-04-24"
```

### TypeScript Types Penting

```typescript
type UserRole = 'owner'|'manager'|'purchaser'|'koki'|'crew_gerobak'|'delivery'
type LeaveType = 'cuti'|'sakit'|'izin_lain'
type StatusPO = 'draft'|'approved'|'sudah_beli'|'sudah_terima'
type StatusProduksi = 'belum'|'proses'|'selesai'|'qc_ok'|'terkirim'
type MetodeBayar = 'tunai'|'qris'

interface AbsensiRecord { karyawan_id, tanggal, jam_masuk, jam_pulang, is_vpn, latitude_in, longitude_in, ... }
interface LeaveRequest { user_id, type, tanggal_mulai, tanggal_selesai, status, document_url, approved_by, ... }
interface PurchaseOrder { bahan_id, supplier_id, qty_order, total_estimasi, total_realisasi, status, ... }
```

---

## 11. Pola Arsitektur

### Server vs Client Component

```
Page (Server Component)
  └── Auth check via createClient()
  └── Fetch data awal (SSR)
  └── Render → XxxClient (Client Component)
       └── useQuery (TanStack) untuk real-time fetch
       └── Zustand untuk local state
       └── fetch() untuk POST/PATCH ke API routes
```

### Dual UI Layout

```
layout.tsx
  ├── profile.ui_type === 'planner' → SideNav (desktop/web)
  └── profile.ui_type === 'executor' → BottomNav (mobile)
```

**executor**: crew_gerobak, delivery, koki (gunakan BottomNav, max 5 items)
**planner**: owner, manager, purchaser (gunakan SideNav)

### Anti-Manipulasi Harga POS

```
Client: kirim { menu_id, qty }
Server: ambil harga_jual dari DB (tidak percaya harga dari client)
Server: hitung total = Σ(harga_jual × qty)
```

### PO Auto-Receive Inventory

```
PATCH /api/purchasing/po/[id] { status: 'sudah_terima' }
  │
  ├── Insert t_inventory_masuk (auto)
  └── Update m_bahan_baku.stok_sekarang += qty_order
```

### Upsert Labor Cost

```
POST /api/labor-cost
  └── INSERT INTO t_labor_cost
      ON CONFLICT (user_id, bulan) DO UPDATE SET ...
```

Manager bisa recalculate kapan saja; data lama ditimpa.

---

## 12. Fitur Keamanan

| Fitur | Implementasi |
|-------|-------------|
| Autentikasi | Supabase Auth (email + password) |
| Session | Cookie-based via @supabase/ssr |
| Route Guard | middleware.ts — whitelist path per role |
| DB Access | RLS policies + Admin client hanya di server |
| Anti-Manipulasi | Harga POS diambil server-side |
| VPN Detection | ip-api.com cek proxy/hosting flag, dicatat sebagai audit trail |
| GPS Attendance | Koordinat disimpan di clock in/out (dasar geofencing masa depan) |
| Soft Delete | User tidak dihapus permanen (is_active=false + ban auth) |
| Self-Approve Prevention | Purchaser tidak bisa approve PO sendiri |
| Manager ≠ Approve Owner | Hierarchy enforced di API level |
| Document Upload | Private bucket, max 10MB, MIME validation |

---

## 13. Relasi Antar Tabel

```
m_users ──────┬─── t_absensi (karyawan_id)
              ├─── t_leave_requests (user_id)
              ├─── t_labor_cost (user_id)
              ├─── t_shift (crew_id)
              ├─── t_transaksi (crew_id)
              └─── t_produksi (koki_id)

m_menu ────────┬─── m_resep (menu_id)
               ├─── t_penjualan (menu_id)
               ├─── t_stok_gerobak (menu_id)
               └─── t_produksi (menu_id)

m_bahan_baku ──┬─── m_resep (bahan_id)
               ├─── t_inventory_masuk (bahan_id)
               └─── t_purchase_order (bahan_id)

m_supplier ────┬─── t_inventory_masuk (supplier_id)
               └─── t_purchase_order (supplier_id)

m_gerobak ─────┬─── t_shift (gerobak_id)
               └─── t_transaksi (gerobak_id)

t_shift ───────┬─── t_transaksi (shift_id)
               ├─── t_stok_gerobak (shift_id)
               └─── t_waste_log (shift_id)

t_transaksi ───── t_penjualan (transaksi_id)

t_purchase_order ── t_inventory_masuk (po_id, auto-created saat sudah_terima)

m_roles ─────── m_role_modules (role_id) ─── m_modules (module_key)
```

---

## 14. Alur Bisnis Utama

### Alur Penjualan Harian

```
1. Crew buka shift (POST /api/pos/shift)
   └── Input cash awal + stok awal per menu

2. Crew catat transaksi (POST /api/pos/transactions)
   └── Pilih menu → keranjang → pilih metode bayar → konfirmasi
   └── Server: generate nomor struk, simpan transaksi + item, update qty_terjual

3. Crew tutup shift (POST /api/pos/shift/close)
   └── Input cash akhir + sisa stok per menu
   └── Server: hitung total QRIS, hitung selisih, tentukan status_rekon
```

### Alur Produksi Dapur

```
1. Manager buat jadwal produksi (POST /api/kitchen/production)
   └── Assign koki, target porsi, alokasi per gerobak

2. Koki update status:
   belum → proses → selesai → (Manager: qc_ok) → terkirim

3. Dashboard menampilkan progress produksi hari ini
```

### Alur Pembelian Bahan Baku

```
1. Purchaser buat PO (POST /api/purchasing/po)
   └── Status: draft, nomor PO auto-generate

2. Manager approve (PATCH .../po/[id] { status: 'approved' })

3. Purchaser konfirmasi sudah beli (status: 'sudah_beli')

4. Purchaser konfirmasi sudah terima (status: 'sudah_terima')
   └── Auto: buat t_inventory_masuk
   └── Auto: update stok_sekarang di m_bahan_baku
```

### Alur Absensi

```
1. Login → layout.tsx cek jam_masuk hari ini
   └── Jika belum → tampilkan ClockInPopup

2. Clock In (POST /api/attendance { action: 'in' })
   └── Cek VPN → simpan is_vpn (flag saja, tidak blokir)
   └── Simpan IP + GPS + jam_masuk

3. Clock Out (POST /api/attendance { action: 'out' })
   └── Simpan GPS + jam_pulang

4. (Opsional) Ajukan cuti/izin (POST /api/leave-requests)
   └── Upload dokumen
   └── Manager/Owner approve atau reject
```

### Alur Kalkulasi Biaya SDM

```
1. Buka Laporan SDM, pilih bulan

2. API gabungkan: absensi + labor_cost tersimpan + semua user

3. Manager input kalkulasi per karyawan:
   - Metode prorata: nilai = gaji ÷ hari_kerja × hari_hadir
   - Metode total_gaji: nilai = gaji_pokok penuh

4. Simpan (POST /api/labor-cost)
   └── Upsert: update jika sudah ada di bulan yang sama
```

---

## 15. Panduan Pengembangan

### Menambah Modul Baru

1. **Buat halaman**: `app/(app)/nama-modul/page.tsx` + `NamaModulClient.tsx`
2. **Buat API**: `app/api/nama-modul/route.ts`
3. **Tambah ke middleware**: Insert `/nama-modul` ke `roleAllowedPaths` untuk role yang relevan
4. **Tambah ke DB** (migrasi baru):
   ```sql
   INSERT INTO m_modules (key, label, icon_name, href, kategori, urutan)
   VALUES ('nama_modul', 'Nama Modul', 'IconName', '/nama-modul', 'operational', 99);

   INSERT INTO m_role_modules (role_id, module_key)
   VALUES ('owner', 'nama_modul'), ('manager', 'nama_modul');
   ```
5. **Tambah icon**: Jika icon baru, tambahkan ke `ICON_MAP` di `SideNav.tsx` dan `BottomNav.tsx`

### Menambah Role Baru

1. Insert ke `m_roles` dengan `is_system=false`
2. Insert ke `m_role_modules` modul yang diizinkan
3. Tambahkan ke `roleAllowedPaths` dan `roleRedirects` di `middleware.ts`
4. Tambahkan ke `UserRole` type di `lib/types/index.ts`

### Menambah Field di Tabel

1. Buat migration baru: `supabase/migrations/004_nama_perubahan.sql`
2. Gunakan `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`
3. Update TypeScript interface di `lib/types/index.ts`
4. Update query di API route terkait

### Konvensi Kode

| Hal | Konvensi |
|-----|---------|
| API Response | Selalu gunakan helper: `ok()`, `badRequest()`, `forbidden()`, dll. |
| Admin DB | Gunakan `createAdminClient()` di API routes yang butuh bypass RLS |
| User DB | Gunakan `createClient()` di Server Components |
| Price Calculation | Selalu server-side, jangan percaya nilai dari client |
| Soft Delete | Set `is_active = false`, jangan `DELETE` |
| Timestamps | Selalu isi `updated_at` saat update |
| Upsert | Gunakan `ON CONFLICT DO UPDATE` untuk data yang bersifat "1 per periode" |

### Environment Variables

```bash
# .env.local (wajib)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # Hanya untuk createAdminClient()
```

### Known Quirks

| Masalah | Solusi |
|---------|-------|
| Base-UI Dialog backdrop tetap di DOM setelah close | `if (!open) return null` sebelum `<Dialog>` render |
| Middleware menghalangi manifest.json | Sudah di-exclude di matcher pattern |
| Role baru tidak bisa akses halaman | Tambahkan ke `roleAllowedPaths` di middleware.ts |
| Icon tidak muncul di nav | Tambahkan ke `ICON_MAP` di SideNav.tsx + BottomNav.tsx |

---

*Dokumentasi ini dibuat berdasarkan source code branch `main` per 2026-04-27.*
*Update dokumentasi ini setiap ada penambahan modul, tabel, atau perubahan arsitektur signifikan.*
