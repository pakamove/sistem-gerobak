-- ========================================
-- MASTER TABLES
-- ========================================

CREATE TABLE IF NOT EXISTS m_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nama_lengkap TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'manager', 'purchaser', 'koki', 'crew_gerobak', 'delivery')),
  lokasi_tugas TEXT CHECK (lokasi_tugas IN ('central_kitchen', 'gerobak_1', 'gerobak_2', 'gerobak_3', 'mobile')),
  no_hp TEXT,
  gaji_pokok INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS m_gerobak (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama TEXT NOT NULL,
  lokasi TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS m_menu (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama_menu TEXT NOT NULL,
  kategori TEXT NOT NULL CHECK (kategori IN ('nasi', 'lauk', 'sayur', 'kriuk', 'minuman', 'paket', 'lainnya')),
  harga_jual INTEGER NOT NULL,
  hpp_current INTEGER DEFAULT 0,
  deskripsi TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  urutan INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS m_bahan_baku (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama_bahan TEXT NOT NULL,
  kategori TEXT CHECK (kategori IN ('protein', 'sayuran', 'bumbu', 'karbohidrat', 'minyak', 'kemasan', 'lainnya')),
  satuan TEXT NOT NULL,
  stok_sekarang DECIMAL(10,2) DEFAULT 0,
  stok_minimum DECIMAL(10,2) DEFAULT 0,
  harga_terakhir INTEGER DEFAULT 0,
  lokasi_simpan TEXT CHECK (lokasi_simpan IN ('kulkas', 'freezer', 'rak_kering', 'meja_prep')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS m_resep (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_id UUID NOT NULL REFERENCES m_menu(id),
  bahan_id UUID NOT NULL REFERENCES m_bahan_baku(id),
  qty_per_porsi DECIMAL(10,3) NOT NULL,
  satuan TEXT NOT NULL,
  tahap TEXT CHECK (tahap IN ('pre_cook', 'cook', 'finish')),
  catatan TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(menu_id, bahan_id)
);

CREATE TABLE IF NOT EXISTS m_supplier (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama_supplier TEXT NOT NULL,
  kontak TEXT,
  kategori_supply TEXT,
  jadwal_kirim TEXT,
  min_order TEXT,
  metode_bayar TEXT CHECK (metode_bayar IN ('tunai', 'transfer', 'tempo_7', 'tempo_14')),
  catatan TEXT,
  status TEXT DEFAULT 'aktif' CHECK (status IN ('aktif', 'cadangan', 'nonaktif')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS m_supplier_item (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES m_supplier(id),
  bahan_id UUID NOT NULL REFERENCES m_bahan_baku(id),
  harga_per_satuan INTEGER NOT NULL,
  lead_time_hari INTEGER DEFAULT 1,
  status TEXT DEFAULT 'utama' CHECK (status IN ('utama', 'cadangan')),
  tanggal_update TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- TRANSACTION TABLES
-- ========================================

CREATE TABLE IF NOT EXISTS t_shift (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gerobak_id UUID NOT NULL REFERENCES m_gerobak(id),
  crew_id UUID NOT NULL REFERENCES m_users(id),
  tanggal DATE NOT NULL,
  waktu_buka TIMESTAMPTZ DEFAULT NOW(),
  cash_awal INTEGER DEFAULT 0,
  waktu_tutup TIMESTAMPTZ,
  cash_akhir INTEGER,
  total_qris INTEGER DEFAULT 0,
  total_transaksi_sistem INTEGER DEFAULT 0,
  selisih INTEGER,
  status_rekon TEXT DEFAULT 'pending' CHECK (status_rekon IN ('pending', 'ok', 'ada_selisih')),
  catatan TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(gerobak_id, tanggal)
);

CREATE TABLE IF NOT EXISTS t_transaksi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id UUID NOT NULL REFERENCES t_shift(id),
  gerobak_id UUID NOT NULL REFERENCES m_gerobak(id),
  nomor_struk TEXT,
  waktu TIMESTAMPTZ DEFAULT NOW(),
  metode_bayar TEXT NOT NULL CHECK (metode_bayar IN ('tunai', 'qris')),
  total INTEGER NOT NULL,
  status TEXT DEFAULT 'selesai' CHECK (status IN ('selesai', 'batal', 'pending')),
  crew_id UUID REFERENCES m_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS t_penjualan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaksi_id UUID REFERENCES t_transaksi(id),
  shift_id UUID NOT NULL REFERENCES t_shift(id),
  menu_id UUID NOT NULL REFERENCES m_menu(id),
  nama_menu TEXT NOT NULL,
  harga_satuan INTEGER NOT NULL,
  qty INTEGER NOT NULL DEFAULT 1,
  subtotal INTEGER NOT NULL,
  status TEXT DEFAULT 'terjual' CHECK (status IN ('keranjang', 'terjual', 'batal')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS t_stok_gerobak (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id UUID NOT NULL REFERENCES t_shift(id),
  menu_id UUID NOT NULL REFERENCES m_menu(id),
  qty_terima INTEGER NOT NULL DEFAULT 0,
  qty_terjual INTEGER DEFAULT 0,
  qty_sisa INTEGER,
  qty_waste INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(shift_id, menu_id)
);

CREATE TABLE IF NOT EXISTS t_produksi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tanggal DATE NOT NULL,
  menu_id UUID NOT NULL REFERENCES m_menu(id),
  tipe TEXT DEFAULT 'regular' CHECK (tipe IN ('regular', 'pre_cook', 'tambahan', 'kustom')),
  target_porsi INTEGER NOT NULL,
  alokasi_g1 INTEGER DEFAULT 0,
  alokasi_g2 INTEGER DEFAULT 0,
  alokasi_g3 INTEGER DEFAULT 0,
  koki_id UUID REFERENCES m_users(id),
  status TEXT DEFAULT 'belum' CHECK (status IN ('belum', 'proses', 'selesai', 'qc_ok', 'terkirim')),
  realisasi_porsi INTEGER,
  waktu_selesai TIMESTAMPTZ,
  catatan TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS t_inventory_masuk (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bahan_id UUID NOT NULL REFERENCES m_bahan_baku(id),
  po_id UUID,
  tanggal_masuk DATE NOT NULL,
  qty_masuk DECIMAL(10,2) NOT NULL,
  harga_beli INTEGER NOT NULL,
  expired_date DATE,
  supplier_id UUID REFERENCES m_supplier(id),
  diterima_oleh UUID REFERENCES m_users(id),
  catatan TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS t_purchase_order (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nomor_po TEXT,
  tanggal_po DATE NOT NULL,
  tanggal_butuh DATE NOT NULL,
  bahan_id UUID NOT NULL REFERENCES m_bahan_baku(id),
  supplier_id UUID REFERENCES m_supplier(id),
  qty_order DECIMAL(10,2) NOT NULL,
  satuan TEXT NOT NULL,
  harga_estimasi INTEGER,
  harga_realisasi INTEGER,
  total_estimasi INTEGER,
  total_realisasi INTEGER,
  bukti_foto_url TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'sudah_beli', 'sudah_terima')),
  dibuat_oleh UUID REFERENCES m_users(id),
  diapprove_oleh UUID REFERENCES m_users(id),
  catatan TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS t_waste_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tanggal DATE NOT NULL,
  tipe_waste TEXT NOT NULL CHECK (tipe_waste IN ('bahan_baku', 'masakan_jadi', 'semi_produk')),
  item_nama TEXT NOT NULL,
  qty_waste DECIMAL(10,2) NOT NULL,
  satuan TEXT NOT NULL,
  alasan TEXT CHECK (alasan IN ('expired', 'rusak', 'sisa_produksi', 'sisa_gerobak')),
  estimasi_nilai INTEGER DEFAULT 0,
  dilaporkan_oleh UUID REFERENCES m_users(id),
  shift_id UUID REFERENCES t_shift(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS t_absensi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  karyawan_id UUID NOT NULL REFERENCES m_users(id),
  tanggal DATE NOT NULL,
  lokasi_kerja TEXT,
  jam_masuk TIMESTAMPTZ,
  jam_pulang TIMESTAMPTZ,
  status TEXT DEFAULT 'hadir' CHECK (status IN ('hadir', 'izin', 'sakit', 'alfa', 'libur')),
  lembur_jam DECIMAL(4,2) DEFAULT 0,
  keterangan TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(karyawan_id, tanggal)
);

-- ========================================
-- INDEXES
-- ========================================

CREATE INDEX IF NOT EXISTS idx_t_transaksi_shift ON t_transaksi(shift_id);
CREATE INDEX IF NOT EXISTS idx_t_transaksi_gerobak ON t_transaksi(gerobak_id);
CREATE INDEX IF NOT EXISTS idx_t_transaksi_waktu ON t_transaksi(waktu);
CREATE INDEX IF NOT EXISTS idx_t_penjualan_transaksi ON t_penjualan(transaksi_id);
CREATE INDEX IF NOT EXISTS idx_t_shift_tanggal ON t_shift(tanggal);
CREATE INDEX IF NOT EXISTS idx_t_produksi_tanggal ON t_produksi(tanggal);
CREATE INDEX IF NOT EXISTS idx_t_inventory_masuk_bahan ON t_inventory_masuk(bahan_id);

-- ========================================
-- RLS HELPERS
-- ========================================

CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM m_users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION get_user_lokasi()
RETURNS TEXT AS $$
  SELECT lokasi_tugas FROM m_users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ========================================
-- ROW LEVEL SECURITY
-- ========================================

ALTER TABLE m_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE m_gerobak ENABLE ROW LEVEL SECURITY;
ALTER TABLE m_menu ENABLE ROW LEVEL SECURITY;
ALTER TABLE m_bahan_baku ENABLE ROW LEVEL SECURITY;
ALTER TABLE m_resep ENABLE ROW LEVEL SECURITY;
ALTER TABLE m_supplier ENABLE ROW LEVEL SECURITY;
ALTER TABLE t_shift ENABLE ROW LEVEL SECURITY;
ALTER TABLE t_transaksi ENABLE ROW LEVEL SECURITY;
ALTER TABLE t_penjualan ENABLE ROW LEVEL SECURITY;
ALTER TABLE t_stok_gerobak ENABLE ROW LEVEL SECURITY;
ALTER TABLE t_produksi ENABLE ROW LEVEL SECURITY;
ALTER TABLE t_inventory_masuk ENABLE ROW LEVEL SECURITY;
ALTER TABLE t_purchase_order ENABLE ROW LEVEL SECURITY;

-- m_users policies
CREATE POLICY "users_read_own_or_manager" ON m_users
  FOR SELECT USING (
    id = auth.uid() OR get_user_role() IN ('owner', 'manager')
  );

CREATE POLICY "users_update_own" ON m_users
  FOR UPDATE USING (id = auth.uid());

-- m_gerobak policies (all authenticated can read)
CREATE POLICY "gerobak_read_authenticated" ON m_gerobak
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- m_menu policies (all authenticated can read)
CREATE POLICY "menu_read_authenticated" ON m_menu
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "menu_write_manager" ON m_menu
  FOR ALL USING (get_user_role() IN ('owner', 'manager'));

-- m_bahan_baku policies
CREATE POLICY "bahan_read_authenticated" ON m_bahan_baku
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "bahan_write_purchaser" ON m_bahan_baku
  FOR UPDATE USING (get_user_role() IN ('owner', 'manager', 'purchaser'));

-- m_resep policies
CREATE POLICY "resep_read_authenticated" ON m_resep
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- m_supplier policies
CREATE POLICY "supplier_read_purchasing" ON m_supplier
  FOR SELECT USING (get_user_role() IN ('owner', 'manager', 'purchaser'));

-- t_shift policies
CREATE POLICY "shift_read_own_or_manager" ON t_shift
  FOR SELECT USING (
    get_user_role() IN ('owner', 'manager') OR crew_id = auth.uid()
  );

CREATE POLICY "shift_insert_crew" ON t_shift
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "shift_update_own" ON t_shift
  FOR UPDATE USING (
    crew_id = auth.uid() OR get_user_role() IN ('owner', 'manager')
  );

-- t_transaksi policies
CREATE POLICY "transaksi_read" ON t_transaksi
  FOR SELECT USING (
    get_user_role() IN ('owner', 'manager') OR crew_id = auth.uid()
  );

CREATE POLICY "transaksi_insert" ON t_transaksi
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "transaksi_update_manager" ON t_transaksi
  FOR UPDATE USING (get_user_role() IN ('owner', 'manager') OR crew_id = auth.uid());

-- t_penjualan policies
CREATE POLICY "penjualan_read" ON t_penjualan
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "penjualan_insert" ON t_penjualan
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "penjualan_update_manager" ON t_penjualan
  FOR UPDATE USING (get_user_role() IN ('owner', 'manager'));

-- t_stok_gerobak policies
CREATE POLICY "stok_gerobak_read" ON t_stok_gerobak
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "stok_gerobak_write" ON t_stok_gerobak
  FOR ALL USING (auth.uid() IS NOT NULL);

-- t_produksi policies
CREATE POLICY "produksi_read" ON t_produksi
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "produksi_insert_manager" ON t_produksi
  FOR INSERT WITH CHECK (get_user_role() IN ('owner', 'manager'));

CREATE POLICY "produksi_update" ON t_produksi
  FOR UPDATE USING (
    get_user_role() IN ('owner', 'manager') OR koki_id = auth.uid()
  );

-- t_inventory_masuk policies
CREATE POLICY "inventory_masuk_read" ON t_inventory_masuk
  FOR SELECT USING (get_user_role() IN ('owner', 'manager', 'purchaser', 'koki'));

CREATE POLICY "inventory_masuk_insert" ON t_inventory_masuk
  FOR INSERT WITH CHECK (get_user_role() IN ('owner', 'manager', 'purchaser'));

-- t_purchase_order policies
CREATE POLICY "po_read" ON t_purchase_order
  FOR SELECT USING (get_user_role() IN ('owner', 'manager', 'purchaser'));

CREATE POLICY "po_insert" ON t_purchase_order
  FOR INSERT WITH CHECK (get_user_role() IN ('owner', 'manager', 'purchaser'));

CREATE POLICY "po_update" ON t_purchase_order
  FOR UPDATE USING (get_user_role() IN ('owner', 'manager', 'purchaser'));
