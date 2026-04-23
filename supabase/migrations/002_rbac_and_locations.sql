-- ============================================================
-- Migration 002: RBAC (Roles, Modules, Role-Modules) + Lokasi
-- Jalankan di Supabase SQL Editor
-- ============================================================

-- 1. Tabel m_lokasi (master lokasi operasional)
CREATE TABLE IF NOT EXISTS m_lokasi (
  id          TEXT PRIMARY KEY,
  nama        TEXT NOT NULL,
  deskripsi   TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed data lokasi awal
INSERT INTO m_lokasi (id, nama, deskripsi, is_active) VALUES
  ('central_kitchen', 'Central Kitchen', 'Dapur pusat produksi', TRUE),
  ('gerobak_1',       'Gerobak 1',       NULL,                   TRUE),
  ('gerobak_2',       'Gerobak 2',       NULL,                   TRUE),
  ('gerobak_3',       'Gerobak 3',       NULL,                   TRUE),
  ('mobile',          'Mobile',          'Tidak terikat lokasi', TRUE)
ON CONFLICT (id) DO NOTHING;

-- 2. Tabel m_roles (master role dinamis)
CREATE TABLE IF NOT EXISTS m_roles (
  id            TEXT PRIMARY KEY,
  display_name  TEXT NOT NULL,
  ui_type       TEXT NOT NULL DEFAULT 'executor' CHECK (ui_type IN ('executor', 'planner')),
  color         TEXT,
  deskripsi     TEXT,
  is_system     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed role awal (is_system = TRUE agar tidak bisa dihapus)
INSERT INTO m_roles (id, display_name, ui_type, color, is_system) VALUES
  ('owner',        'Owner',        'planner',  '#D4722A', TRUE),
  ('manager',      'Manager Ops',  'planner',  '#3B82F6', TRUE),
  ('purchaser',    'Purchaser',    'planner',  '#8B5CF6', TRUE),
  ('koki',         'Koki',         'executor', '#10B981', TRUE),
  ('crew_gerobak', 'Crew Gerobak', 'executor', '#F59E0B', TRUE),
  ('delivery',     'Delivery',     'executor', '#EF4444', TRUE)
ON CONFLICT (id) DO NOTHING;

-- 3. Tabel m_modules (master modul aplikasi)
CREATE TABLE IF NOT EXISTS m_modules (
  key         TEXT PRIMARY KEY,
  label       TEXT NOT NULL,
  icon_name   TEXT NOT NULL,
  href        TEXT NOT NULL,
  category    TEXT NOT NULL DEFAULT 'operational',
  sort_order  INTEGER NOT NULL DEFAULT 0
);

-- Seed modul
INSERT INTO m_modules (key, label, icon_name, href, category, sort_order) VALUES
  ('pos',        'Kasir',      'ShoppingCart', '/pos',        'operational', 1),
  ('production', 'Produksi',   'ChefHat',      '/production', 'operational', 2),
  ('inventory',  'Stok',       'Package',      '/inventory',  'operational', 3),
  ('purchasing', 'Pembelian',  'Truck',        '/purchasing', 'operational', 4),
  ('attendance', 'Absensi',    'Clock',        '/attendance', 'operational', 5),
  ('reports',    'Laporan',    'BarChart2',    '/reports',    'management',  6),
  ('settings',   'Pengaturan', 'Settings',     '/settings',   'settings',    7)
ON CONFLICT (key) DO NOTHING;

-- 4. Tabel m_role_modules (mapping role → modul yang bisa diakses)
CREATE TABLE IF NOT EXISTS m_role_modules (
  role_id     TEXT NOT NULL REFERENCES m_roles(id) ON DELETE CASCADE,
  module_key  TEXT NOT NULL REFERENCES m_modules(key) ON DELETE CASCADE,
  PRIMARY KEY (role_id, module_key)
);

-- Seed akses modul per role
INSERT INTO m_role_modules (role_id, module_key) VALUES
  -- Owner: akses semua
  ('owner',        'pos'),
  ('owner',        'production'),
  ('owner',        'inventory'),
  ('owner',        'purchasing'),
  ('owner',        'attendance'),
  ('owner',        'reports'),
  ('owner',        'settings'),
  -- Manager: semua kecuali settings (role management)
  ('manager',      'pos'),
  ('manager',      'production'),
  ('manager',      'inventory'),
  ('manager',      'purchasing'),
  ('manager',      'attendance'),
  ('manager',      'reports'),
  ('manager',      'settings'),
  -- Purchaser: inventory, purchasing, attendance
  ('purchaser',    'inventory'),
  ('purchaser',    'purchasing'),
  ('purchaser',    'attendance'),
  -- Koki: production, inventory, attendance
  ('koki',         'production'),
  ('koki',         'inventory'),
  ('koki',         'attendance'),
  -- Crew Gerobak: pos, attendance
  ('crew_gerobak', 'pos'),
  ('crew_gerobak', 'attendance'),
  -- Delivery: pos, attendance
  ('delivery',     'pos'),
  ('delivery',     'attendance')
ON CONFLICT (role_id, module_key) DO NOTHING;

-- 5. RLS Policies
ALTER TABLE m_lokasi       ENABLE ROW LEVEL SECURITY;
ALTER TABLE m_roles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE m_modules      ENABLE ROW LEVEL SECURITY;
ALTER TABLE m_role_modules ENABLE ROW LEVEL SECURITY;

-- Semua user authenticated bisa baca (read-only via client)
-- Write hanya via service_role (admin client di API routes)
CREATE POLICY "authenticated read m_lokasi"       ON m_lokasi       FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "authenticated read m_roles"        ON m_roles        FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "authenticated read m_modules"      ON m_modules      FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "authenticated read m_role_modules" ON m_role_modules FOR SELECT TO authenticated USING (TRUE);
