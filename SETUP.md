# Setup Guide - Sistem Gerobak

## 1. Supabase Setup

### Buat project baru di supabase.com
1. Masuk ke dashboard.supabase.com
2. Klik "New Project"
3. Isi nama project: `sistem-gerobak`
4. Pilih password database
5. Pilih region terdekat

### Jalankan Migration SQL
1. Buka **SQL Editor** di Supabase dashboard
2. Copy isi file `supabase/migrations/001_initial_schema.sql`
3. Paste dan klik **Run**

### Jalankan Seed Data
1. Di SQL Editor, copy isi `supabase/seed.sql`
2. Paste dan klik **Run**

### Setup Auth Users
Di SQL Editor, buat user untuk tiap role:
```sql
-- Contoh: buat user owner
-- Pertama buat di Authentication > Users > Add User
-- Lalu insert ke m_users:
INSERT INTO m_users (id, nama_lengkap, role, lokasi_tugas) VALUES
  ('<auth-user-id>', 'Owner', 'owner', 'mobile'),
  ('<auth-user-id>', 'Manager Ops', 'manager', 'central_kitchen'),
  ('<auth-user-id>', 'Purchaser', 'purchaser', 'central_kitchen'),
  ('<auth-user-id>', 'Koki 1', 'koki', 'central_kitchen'),
  ('<auth-user-id>', 'Koki 2', 'koki', 'central_kitchen'),
  ('<auth-user-id>', 'Koki 3', 'koki', 'central_kitchen'),
  ('<auth-user-id>', 'Crew G1', 'crew_gerobak', 'gerobak_1'),
  ('<auth-user-id>', 'Crew G2', 'crew_gerobak', 'gerobak_2'),
  ('<auth-user-id>', 'Crew G3', 'crew_gerobak', 'gerobak_3');
```

Cara mudah: Buka **Authentication > Users**, klik **Add User**, isi email & password.
Lalu copy user ID yang terbentuk, masukkan ke query di atas.

### Ambil API Keys
Di Supabase: Settings > API
- `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
- `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `service_role` → `SUPABASE_SERVICE_ROLE_KEY`

---

## 2. Environment Variables

Edit file `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

NEXT_PUBLIC_APP_NAME="Sistem Gerobak"
NEXT_PUBLIC_APP_VERSION="1.0.0"
```

---

## 3. Jalankan Lokal

```bash
cd /Users/dwiibnurimba/Project/sistem-gerobak
npm run dev
```

Buka: http://localhost:3000

---

## 4. Deploy ke Vercel

```bash
# Push ke GitHub dulu
git init
git add .
git commit -m "Initial commit: Sistem Gerobak MVP"
git branch -M main
git remote add origin https://github.com/<username>/sistem-gerobak.git
git push -u origin main
```

Lalu di vercel.com:
1. Import project dari GitHub
2. Add semua environment variables dari `.env.local`
3. Deploy

---

## 5. Struktur Module

| Route | Role | Fungsi |
|-------|------|--------|
| `/login` | Semua | Login |
| `/pos` | crew_gerobak, manager, owner | POS Gerobak |
| `/kitchen` | koki, manager, owner | Produksi Dapur |
| `/inventory` | purchaser, manager, koki, owner | Stok Bahan |
| `/purchasing` | purchaser, manager, owner | Purchase Order |
| `/dashboard` | manager, owner | Ringkasan Harian |
| `/settings` | Semua | Profil & Logout |

---

## 6. Alur Harian

### Crew Gerobak
1. Login → otomatis masuk `/pos`
2. Tap **Buka Shift** → isi cash awal + stok menu
3. Lakukan transaksi sepanjang hari
4. Tap **Tutup Shift** → isi cash akhir, QRIS, sisa, waste

### Koki
1. Login → masuk `/kitchen`
2. Lihat rencana produksi hari ini
3. Update status: Belum → Proses → Selesai → QC OK
4. Isi realisasi porsi

### Purchaser
1. Login → masuk `/purchasing`
2. Buat Purchase Order bahan yang dibutuhkan
3. Input bahan masuk di `/inventory`

### Manager/Owner
1. Login → masuk `/dashboard`
2. Pantau revenue, status rekon, produksi, bahan kritis
3. Buat rencana produksi di `/kitchen`
4. Approve PO di `/purchasing`
