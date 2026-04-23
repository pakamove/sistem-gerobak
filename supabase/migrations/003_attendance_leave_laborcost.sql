-- ============================================================
-- Migration 003: Attendance GPS, Anti-VPN, Leave Requests, Labor Cost
-- Aman dijalankan ulang (idempotent)
-- ============================================================

-- 1. Drop hardcoded CHECK constraints di m_users
--    Agar role & lokasi dinamis bisa dipakai
ALTER TABLE m_users DROP CONSTRAINT IF EXISTS m_users_role_check;
ALTER TABLE m_users DROP CONSTRAINT IF EXISTS m_users_lokasi_tugas_check;

-- 2. m_lokasi: tambah kolom GPS + radius
ALTER TABLE m_lokasi ADD COLUMN IF NOT EXISTS latitude     DOUBLE PRECISION;
ALTER TABLE m_lokasi ADD COLUMN IF NOT EXISTS longitude    DOUBLE PRECISION;
ALTER TABLE m_lokasi ADD COLUMN IF NOT EXISTS radius_meter INTEGER NOT NULL DEFAULT 100;

-- 3. t_absensi: tambah metadata GPS + anti-VPN
ALTER TABLE t_absensi ADD COLUMN IF NOT EXISTS ip_address    TEXT;
ALTER TABLE t_absensi ADD COLUMN IF NOT EXISTS is_vpn        BOOLEAN DEFAULT FALSE;
ALTER TABLE t_absensi ADD COLUMN IF NOT EXISTS latitude_in   DOUBLE PRECISION;
ALTER TABLE t_absensi ADD COLUMN IF NOT EXISTS longitude_in  DOUBLE PRECISION;
ALTER TABLE t_absensi ADD COLUMN IF NOT EXISTS latitude_out  DOUBLE PRECISION;
ALTER TABLE t_absensi ADD COLUMN IF NOT EXISTS longitude_out DOUBLE PRECISION;
ALTER TABLE t_absensi ADD COLUMN IF NOT EXISTS catatan_out   TEXT;

-- 4. t_leave_requests: request cuti / sakit / izin
CREATE TABLE IF NOT EXISTS t_leave_requests (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES m_users(id) ON DELETE CASCADE,
  type             TEXT NOT NULL CHECK (type IN ('cuti', 'sakit', 'izin_lain')),
  tanggal_mulai    DATE NOT NULL,
  tanggal_selesai  DATE NOT NULL,
  alasan           TEXT,
  document_url     TEXT,
  status           TEXT NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by      UUID REFERENCES m_users(id),
  approved_at      TIMESTAMPTZ,
  catatan_approval TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- 5. t_labor_cost: hasil kalkulasi cost karyawan per bulan
CREATE TABLE IF NOT EXISTS t_labor_cost (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES m_users(id) ON DELETE CASCADE,
  bulan       DATE NOT NULL,          -- selalu tanggal 1 bulan tersebut, e.g. 2026-04-01
  metode      TEXT NOT NULL CHECK (metode IN ('prorata', 'total_gaji')),
  hari_kerja  INTEGER NOT NULL DEFAULT 0,
  hari_hadir  INTEGER NOT NULL DEFAULT 0,
  gaji_pokok  BIGINT NOT NULL DEFAULT 0,
  nilai_cost  BIGINT NOT NULL DEFAULT 0,
  dibuat_oleh UUID REFERENCES m_users(id),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, bulan)
);

-- 6. RLS
ALTER TABLE t_leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE t_labor_cost     ENABLE ROW LEVEL SECURITY;

-- t_leave_requests: user bisa lihat punya sendiri, manager/owner bisa lihat semua
DROP POLICY IF EXISTS "leave_read" ON t_leave_requests;
CREATE POLICY "leave_read" ON t_leave_requests
  FOR SELECT USING (
    user_id = auth.uid() OR get_user_role() IN ('owner', 'manager')
  );

DROP POLICY IF EXISTS "leave_insert" ON t_leave_requests;
CREATE POLICY "leave_insert" ON t_leave_requests
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "leave_update_manager" ON t_leave_requests;
CREATE POLICY "leave_update_manager" ON t_leave_requests
  FOR UPDATE USING (get_user_role() IN ('owner', 'manager'));

-- t_absensi: tambah policy jika belum ada
ALTER TABLE t_absensi ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "absensi_read" ON t_absensi;
CREATE POLICY "absensi_read" ON t_absensi
  FOR SELECT USING (
    karyawan_id = auth.uid() OR get_user_role() IN ('owner', 'manager')
  );

DROP POLICY IF EXISTS "absensi_insert" ON t_absensi;
CREATE POLICY "absensi_insert" ON t_absensi
  FOR INSERT WITH CHECK (karyawan_id = auth.uid());

DROP POLICY IF EXISTS "absensi_update" ON t_absensi;
CREATE POLICY "absensi_update" ON t_absensi
  FOR UPDATE USING (
    karyawan_id = auth.uid() OR get_user_role() IN ('owner', 'manager')
  );

-- t_labor_cost: hanya manager/owner
DROP POLICY IF EXISTS "labor_cost_read" ON t_labor_cost;
CREATE POLICY "labor_cost_read" ON t_labor_cost
  FOR SELECT USING (get_user_role() IN ('owner', 'manager'));

DROP POLICY IF EXISTS "labor_cost_write" ON t_labor_cost;
CREATE POLICY "labor_cost_write" ON t_labor_cost
  FOR ALL USING (get_user_role() IN ('owner', 'manager'));

-- 7. Indexes
CREATE INDEX IF NOT EXISTS idx_t_absensi_karyawan  ON t_absensi(karyawan_id);
CREATE INDEX IF NOT EXISTS idx_t_absensi_tanggal   ON t_absensi(tanggal);
CREATE INDEX IF NOT EXISTS idx_t_leave_user        ON t_leave_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_t_leave_status      ON t_leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_t_labor_cost_bulan  ON t_labor_cost(bulan);

-- ============================================================
-- STORAGE: Jalankan manual di Supabase Dashboard > Storage
-- Buat bucket "leave-documents" (private)
-- Lalu jalankan policy berikut:
-- ============================================================

-- Storage policies (jalankan di SQL Editor juga)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'leave-documents',
  'leave-documents',
  false,
  10485760, -- 10MB
  ARRAY['image/jpeg','image/png','image/webp','application/pdf']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "leave_docs_upload" ON storage.objects;
CREATE POLICY "leave_docs_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'leave-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "leave_docs_read" ON storage.objects;
CREATE POLICY "leave_docs_read" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'leave-documents' AND (
      auth.uid()::text = (storage.foldername(name))[1]
      OR get_user_role() IN ('owner', 'manager')
    )
  );
