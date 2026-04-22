export type UserRole = 'owner' | 'manager' | 'purchaser' | 'koki' | 'crew_gerobak' | 'delivery'
export type GerobakLocation = 'gerobak_1' | 'gerobak_2' | 'gerobak_3' | 'central_kitchen' | 'mobile'
export type MenuKategori = 'nasi' | 'lauk' | 'sayur' | 'kriuk' | 'minuman' | 'paket' | 'lainnya'
export type MetodeBayar = 'tunai' | 'qris'
export type StatusProduksi = 'belum' | 'proses' | 'selesai' | 'qc_ok' | 'terkirim'
export type StatusPO = 'draft' | 'approved' | 'sudah_beli' | 'sudah_terima'
export type StatusRekon = 'pending' | 'ok' | 'ada_selisih'
export type StatusTransaksi = 'selesai' | 'batal' | 'pending'
export type StatusStok = 'ok' | 'warning' | 'critical'

export interface User {
  id: string
  nama_lengkap: string
  role: UserRole
  lokasi_tugas: GerobakLocation | null
  no_hp: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Gerobak {
  id: string
  nama: string
  lokasi: string | null
  is_active: boolean
  created_at: string
}

export interface Menu {
  id: string
  nama_menu: string
  kategori: MenuKategori
  harga_jual: number
  hpp_current: number
  deskripsi: string | null
  image_url: string | null
  is_active: boolean
  urutan: number
  created_at: string
  updated_at: string
}

export interface BahanBaku {
  id: string
  nama_bahan: string
  kategori: string | null
  satuan: string
  stok_sekarang: number
  stok_minimum: number
  harga_terakhir: number
  lokasi_simpan: string | null
  cara_simpan: string | null
  masa_simpan_hari: number | null
  supplier_utama_id: string | null
  catatan: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Resep {
  id: string
  menu_id: string
  bahan_id: string
  qty_per_porsi: number
  satuan: string
  tahap: string | null
  catatan: string | null
}

export interface Supplier {
  id: string
  nama_supplier: string
  kontak: string | null
  email: string | null
  alamat: string | null
  pic: string | null
  kategori_supply: string | null
  metode_bayar: string | null
  lead_time_hari: number | null
  min_order: string | null
  termin_pembayaran: string | null
  catatan: string | null
  status: string
  is_active: boolean
}

export interface Shift {
  id: string
  gerobak_id: string
  crew_id: string
  tanggal: string
  waktu_buka: string | null
  cash_awal: number
  waktu_tutup: string | null
  cash_akhir: number | null
  total_qris: number
  total_transaksi_sistem: number
  selisih: number | null
  status_rekon: StatusRekon
  catatan: string | null
  created_at: string
  gerobak?: Gerobak
  crew?: User
}

export interface Transaksi {
  id: string
  shift_id: string
  gerobak_id: string
  nomor_struk: string | null
  waktu: string
  metode_bayar: MetodeBayar
  total: number
  status: StatusTransaksi
  crew_id: string | null
  created_at: string
  penjualan?: Penjualan[]
}

export interface Penjualan {
  id: string
  transaksi_id: string | null
  shift_id: string
  menu_id: string
  nama_menu: string
  harga_satuan: number
  qty: number
  subtotal: number
  status: string
}

export interface StokGerobak {
  id: string
  shift_id: string
  menu_id: string
  qty_terima: number
  qty_terjual: number
  qty_sisa: number | null
  qty_waste: number
  menu?: Menu
}

export interface Produksi {
  id: string
  tanggal: string
  menu_id: string
  tipe: string
  target_porsi: number
  alokasi_g1: number
  alokasi_g2: number
  alokasi_g3: number
  koki_id: string | null
  status: StatusProduksi
  realisasi_porsi: number | null
  waktu_selesai: string | null
  catatan: string | null
  created_at: string
  updated_at: string
  menu?: Menu
  koki?: User
}

export interface InventoryMasuk {
  id: string
  bahan_id: string
  po_id: string | null
  tanggal_masuk: string
  qty_masuk: number
  harga_beli: number
  expired_date: string | null
  supplier_id: string | null
  diterima_oleh: string | null
  catatan: string | null
  created_at: string
  bahan?: BahanBaku
  supplier?: Supplier
}

export interface PurchaseOrder {
  id: string
  nomor_po: string | null
  tanggal_po: string
  tanggal_butuh: string
  bahan_id: string
  supplier_id: string | null
  qty_order: number
  satuan: string
  harga_estimasi: number | null
  harga_realisasi: number | null
  total_estimasi: number | null
  total_realisasi: number | null
  status: StatusPO
  dibuat_oleh: string | null
  diapprove_oleh: string | null
  catatan: string | null
  created_at: string
  updated_at: string
  bahan?: BahanBaku
  supplier?: Supplier
}

export interface CartItem {
  menu_id: string
  nama_menu: string
  harga_jual: number
  qty: number
  subtotal: number
}

export interface Asset {
  id: string
  nama_aset: string
  kategori: string | null
  tanggal_beli: string | null
  harga_beli: number
  umur_manfaat_tahun: number
  nilai_residu: number
  penyusutan_per_tahun: number
  nilai_buku: number
  lokasi: string | null
  kondisi: string | null
  catatan: string | null
  is_active: boolean
  created_at: string
}

export interface AbsensiRecord {
  id: string
  user_id: string
  tanggal: string
  clock_in: string
  clock_out: string | null
  latitude_in: number | null
  longitude_in: number | null
  latitude_out: number | null
  longitude_out: number | null
  durasi_menit: number | null
  status: string
  catatan: string | null
  catatan_out: string | null
  user?: { id: string; nama_lengkap: string; role: string }
}

export interface DashboardSummary {
  summary: {
    total_revenue: number
    total_transactions: number
    active_shifts: number
    closed_shifts: number
    selisih_count: number
  }
  per_gerobak: {
    gerobak_id: string
    nama: string
    revenue: number
    transactions: number
    status_rekon: StatusRekon | null
  }[]
  production_today: {
    menu: string
    target_porsi: number
    realisasi_porsi: number | null
    status: StatusProduksi
  }[]
  critical_items: {
    nama_bahan: string
    stok_sekarang: number
    stok_minimum: number
  }[]
}
