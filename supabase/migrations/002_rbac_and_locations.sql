-- ============================================================
-- Migration 002: RBAC (Roles, Modules, Role-Modules) + Lokasi
-- Jalankan di Supabase SQL Editor
-- Aman dijalankan ulang (idempotent)
-- ============================================================

-- 1. Tabel m_lokasi
CREATE TABLE IF NOT EXISTS m_lokasi (
  id          TEXT PRIMARY KEY,
  nama        TEXT NOT NULL,
  deskripsi   TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO m_lokasi (id, nama, deskripsi, is_active) VALUES
  ('central_kitchen', 'Central Kitchen', 'Dapur pusat produksi', TRUE),
  ('gerobak_1',       'Gerobak 1',       NULL,                   TRUE),
  ('gerobak_2',       'Gerobak 2',       NULL,                   TRUE),
  ('gerobak_3',       'Gerobak 3',       NULL,                   TRUE),
  ('mobile',          'Mobile',          'Tidak terikat lokasi', TRUE)
ON CONFLICT (id) DO NOTHING;

-- 2. Tabel m_roles
CREATE TABLE IF NOT EXISTS m_roles (
  id            TEXT PRIMARY KEY,
  display_name  TEXT NOT NULL,
  ui_type       TEXT NOT NULL DEFAULT 'executor' CHECK (ui_type IN ('executor', 'planner')),
  color         TEXT,
  deskripsi     TEXT,
  is_system     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO m_roles (id, display_name, ui_type, color, is_system) VALUES
  ('owner',        'Owner',        'planner',  '#D4722A', TRUE),
  ('manager',      'Manager Ops',  'planner',  '#3B82F6', TRUE),
  ('purchaser',    'Purchaser',    'planner',  '#8B5CF6', TRUE),
  ('koki',         'Koki',         'executor', '#10B981', TRUE),
  ('crew_gerobak', 'Crew Gerobak', 'executor', '#F59E0B', TRUE),
  ('delivery',     'Delivery',     'executor', '#EF4444', TRUE)
ON CONFLICT (id) DO NOTHING;

-- 3. Tabel m_modules — tambah kolom jika belum ada
CREATE TABLE IF NOT EXISTS m_modules (
  key        TEXT PRIMARY KEY,
  label      TEXT NOT NULL,
  icon_name  TEXT NOT NULL,
  href       TEXT NOT NULL
);

ALTER TABLE m_modules ADD COLUMN IF NOT EXISTS category   TEXT NOT NULL DEFAULT 'operational';
ALTER TABLE m_modules ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;

INSERT INTO m_modules (key, label, icon_name, href, category, sort_order) VALUES
  ('pos',        'Kasir',      'ShoppingCart', '/pos',        'operational', 1),
  ('production', 'Produksi',   'ChefHat',      '/production', 'operational', 2),
  ('inventory',  'Stok',       'Package',      '/inventory',  'operational', 3),
  ('purchasing', 'Pembelian',  'Truck',        '/purchasing', 'operational', 4),
  ('attendance', 'Absensi',    'Clock',        '/attendance', 'operational', 5),
  ('reports',    'Laporan',    'BarChart2',    '/reports',    'management',  6),
  ('settings',   'Pengaturan', 'Settings',     '/settings',   'settings',    7)
ON CONFLICT (key) DO UPDATE SET
  label      = EXCLUDED.label,
  icon_name  = EXCLUDED.icon_name,
  href       = EXCLUDED.href,
  category   = EXCLUDED.category,
  sort_order = EXCLUDED.sort_order;

-- 4. Tabel m_role_modules
CREATE TABLE IF NOT EXISTS m_role_modules (
  role_id     TEXT NOT NULL REFERENCES m_roles(id) ON DELETE CASCADE,
  module_key  TEXT NOT NULL REFERENCES m_modules(key) ON DELETE CASCADE,
  PRIMARY KEY (role_id, module_key)
);

INSERT INTO m_role_modules (role_id, module_key) VALUES
  ('owner',        'pos'),
  ('owner',        'production'),
  ('owner',        'inventory'),
  ('owner',        'purchasing'),
  ('owner',        'attendance'),
  ('owner',        'reports'),
  ('owner',        'settings'),
  ('manager',      'pos'),
  ('manager',      'production'),
  ('manager',      'inventory'),
  ('manager',      'purchasing'),
  ('manager',      'attendance'),
  ('manager',      'reports'),
  ('manager',      'settings'),
  ('purchaser',    'inventory'),
  ('purchaser',    'purchasing'),
  ('purchaser',    'attendance'),
  ('koki',         'production'),
  ('koki',         'inventory'),
  ('koki',         'attendance'),
  ('crew_gerobak', 'pos'),
  ('crew_gerobak', 'attendance'),
  ('delivery',     'pos'),
  ('delivery',     'attendance')
ON CONFLICT (role_id, module_key) DO NOTHING;

-- 5. RLS
ALTER TABLE m_lokasi       ENABLE ROW LEVEL SECURITY;
ALTER TABLE m_roles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE m_modules      ENABLE ROW LEVEL SECURITY;
ALTER TABLE m_role_modules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated read m_lokasi"       ON m_lokasi;
DROP POLICY IF EXISTS "authenticated read m_roles"        ON m_roles;
DROP POLICY IF EXISTS "authenticated read m_modules"      ON m_modules;
DROP POLICY IF EXISTS "authenticated read m_role_modules" ON m_role_modules;

CREATE POLICY "authenticated read m_lokasi"       ON m_lokasi       FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "authenticated read m_roles"        ON m_roles        FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "authenticated read m_modules"      ON m_modules      FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "authenticated read m_role_modules" ON m_role_modules FOR SELECT TO authenticated USING (TRUE);
