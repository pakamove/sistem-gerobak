'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import TopHeader from '@/components/layout/TopHeader'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { formatRupiah, formatDate } from '@/lib/utils/format'
import { BarChart3, ShoppingCart, Package, Truck, Users, TrendingUp, Calendar, AlertTriangle, Loader2, Calculator } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

type ReportType = 'sales' | 'inventory' | 'purchasing' | 'labor'

const REPORT_TYPES: { key: ReportType; label: string; icon: React.ElementType }[] = [
  { key: 'sales',      label: 'Penjualan', icon: ShoppingCart },
  { key: 'inventory',  label: 'Inventory',  icon: Package },
  { key: 'purchasing', label: 'Pembelian',  icon: Truck },
  { key: 'labor',      label: 'SDM',        icon: Users },
]

function getDefaultRange() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const lastDay = new Date(y, now.getMonth() + 1, 0).getDate()
  return { from: `${y}-${m}-01`, to: `${y}-${m}-${String(lastDay).padStart(2, '0')}` }
}

export default function ReportsClient() {
  const def = getDefaultRange()
  const [type, setType] = useState<ReportType>('sales')
  const [from, setFrom] = useState(def.from)
  const [to, setTo] = useState(def.to)
  const [applied, setApplied] = useState({ type, from, to })

  const { data, isLoading, error } = useQuery({
    queryKey: ['reports', applied.type, applied.from, applied.to],
    queryFn: async () => {
      const res = await fetch(`/api/reports?type=${applied.type}&from=${applied.from}&to=${applied.to}`)
      const json = await res.json()
      if (!json.success) throw new Error(json.message)
      return json.data
    },
  })

  return (
    <div className="min-h-full pb-8">
      <TopHeader title="Laporan" subtitle="Analisis & Data" />

      <div className="px-4 pt-5 space-y-4">
        {/* Type tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {REPORT_TYPES.map((r) => {
            const Icon = r.icon
            const active = type === r.key
            return (
              <button
                key={r.key}
                onClick={() => setType(r.key)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors flex-shrink-0',
                  active ? 'bg-[#D4722A] text-white' : 'bg-[#231e18] border border-white/8 text-[#A8967E]'
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {r.label}
              </button>
            )
          })}
        </div>

        {/* Date range */}
        <div className="bg-[#231e18] rounded-2xl border border-white/8 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#D4722A]" />
            <p className="text-sm font-semibold text-[#EDE5D8]">Rentang Waktu</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-[#A8967E] block mb-1">Dari</label>
              <input id="report-from" name="report-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)}
                className="w-full bg-[#1C1712] border border-white/8 rounded-xl px-3 py-2 text-sm text-[#EDE5D8] focus:outline-none focus:border-[#D4722A]" />
            </div>
            <div>
              <label className="text-[10px] text-[#A8967E] block mb-1">Sampai</label>
              <input id="report-to" name="report-to" type="date" value={to} onChange={(e) => setTo(e.target.value)}
                className="w-full bg-[#1C1712] border border-white/8 rounded-xl px-3 py-2 text-sm text-[#EDE5D8] focus:outline-none focus:border-[#D4722A]" />
            </div>
          </div>
          <button
            onClick={() => setApplied({ type, from, to })}
            className="w-full bg-[#D4722A] text-white text-sm font-semibold py-2.5 rounded-xl active:scale-95 transition-transform"
          >
            Tampilkan Laporan
          </button>
        </div>

        {isLoading && (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-20 rounded-2xl bg-white/5 animate-pulse" />)}
          </div>
        )}

        {error && (
          <div className="bg-red-900/20 border border-red-500/20 rounded-2xl p-4 text-center">
            <p className="text-sm text-red-400">Gagal memuat laporan</p>
          </div>
        )}

        {!isLoading && !error && data && (
          <>
            {applied.type === 'sales'      && <SalesReport data={data} />}
            {applied.type === 'inventory'  && <InventoryReport data={data} />}
            {applied.type === 'purchasing' && <PurchasingReport data={data} />}
            {applied.type === 'labor'      && <LaborReport data={data} bulan={applied.from} />}
          </>
        )}
      </div>
    </div>
  )
}

function SummaryCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-[#1C1712] rounded-xl p-3">
      <p className="text-[10px] text-[#A8967E] mb-1">{label}</p>
      <p className="text-base font-bold text-[#EDE5D8]">{value}</p>
      {sub && <p className="text-[10px] text-[#5C5040] mt-0.5">{sub}</p>}
    </div>
  )
}

// ──────────────────────────────────────────────
function SalesReport({ data }: { data: {
  summary: { total_revenue: number; total_transactions: number; total_tunai: number; total_qris: number }
  by_day: { date: string; total: number; count: number; tunai: number; qris: number }[]
  top_items: { menu_id: string; nama: string; qty: number; revenue: number }[]
}}) {
  const { summary, by_day, top_items } = data
  return (
    <div className="space-y-4">
      <div className="bg-[#231e18] rounded-2xl border border-white/8 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[#D4722A]" />
          <p className="text-sm font-semibold text-[#EDE5D8]">Ringkasan Penjualan</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <SummaryCard label="Total Pendapatan" value={formatRupiah(summary.total_revenue)} />
          <SummaryCard label="Total Transaksi" value={String(summary.total_transactions)} sub="transaksi selesai" />
          <SummaryCard label="Pendapatan Tunai" value={formatRupiah(summary.total_tunai)} />
          <SummaryCard label="Pendapatan QRIS" value={formatRupiah(summary.total_qris)} />
        </div>
        {summary.total_transactions > 0 && (
          <div className="bg-[#1C1712] rounded-xl p-3 flex justify-between">
            <span className="text-xs text-[#A8967E]">Rata-rata per transaksi</span>
            <span className="text-sm font-semibold text-[#D4722A]">
              {formatRupiah(Math.round(summary.total_revenue / summary.total_transactions))}
            </span>
          </div>
        )}
      </div>

      {top_items.length > 0 && (
        <div className="bg-[#231e18] rounded-2xl border border-white/8 overflow-hidden">
          <div className="px-4 py-3 border-b border-white/8">
            <p className="text-sm font-semibold text-[#EDE5D8]">Item Terlaris</p>
          </div>
          <div className="divide-y divide-white/8">
            {top_items.map((item, idx) => (
              <div key={item.menu_id} className="px-4 py-3 flex items-center gap-3">
                <span className="text-xs font-bold text-[#5C5040] w-5">{idx + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-[#EDE5D8] truncate">{item.nama}</p>
                  <p className="text-[10px] text-[#A8967E]">{item.qty} porsi terjual</p>
                </div>
                <p className="text-xs font-semibold text-[#D4722A]">{formatRupiah(item.revenue)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {by_day.length > 0 && (
        <div className="bg-[#231e18] rounded-2xl border border-white/8 overflow-hidden">
          <div className="px-4 py-3 border-b border-white/8">
            <p className="text-sm font-semibold text-[#EDE5D8]">Detail Per Hari</p>
          </div>
          <div className="divide-y divide-white/8">
            {by_day.map((d) => (
              <div key={d.date} className="px-4 py-3">
                <div className="flex justify-between items-center mb-1">
                  <p className="text-xs font-medium text-[#EDE5D8]">{formatDate(d.date)}</p>
                  <p className="text-sm font-bold text-[#D4722A]">{formatRupiah(d.total)}</p>
                </div>
                <div className="flex gap-3 flex-wrap">
                  <span className="text-[10px] text-[#A8967E]">{d.count} transaksi</span>
                  <span className="text-[10px] text-[#5C5040]">Tunai: {formatRupiah(d.tunai)}</span>
                  <span className="text-[10px] text-[#5C5040]">QRIS: {formatRupiah(d.qris)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {by_day.length === 0 && (
        <div className="text-center py-8">
          <BarChart3 className="w-10 h-10 text-[#5C5040] mx-auto mb-2" />
          <p className="text-sm text-[#5C5040]">Tidak ada data penjualan di periode ini</p>
        </div>
      )}
    </div>
  )
}

// ──────────────────────────────────────────────
function InventoryReport({ data }: { data: {
  summary: { total_penerimaan: number; total_nilai: number; total_low_stock: number }
  items: { id: string; tanggal_masuk: string; qty_masuk: number; harga_beli: number; bahan: { nama_bahan: string; satuan: string } | null; supplier: { nama_supplier: string } | null }[]
  low_stock: { id: string; nama_bahan: string; satuan: string; stok_sekarang: number; stok_minimum: number; harga_terakhir: number }[]
}}) {
  const { summary, items, low_stock } = data
  return (
    <div className="space-y-4">
      <div className="bg-[#231e18] rounded-2xl border border-white/8 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-[#D4722A]" />
          <p className="text-sm font-semibold text-[#EDE5D8]">Ringkasan Inventory</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <SummaryCard label="Total Penerimaan" value={String(summary.total_penerimaan)} sub="item masuk" />
          <SummaryCard label="Total Nilai Masuk" value={formatRupiah(summary.total_nilai)} />
          <SummaryCard
            label="Stok Hampir Habis"
            value={String(summary.total_low_stock)}
            sub={summary.total_low_stock > 0 ? 'perlu restock' : 'semua aman'}
          />
        </div>
      </div>

      {low_stock.length > 0 && (
        <div className="bg-[#231e18] rounded-2xl border border-yellow-500/20 overflow-hidden">
          <div className="px-4 py-3 border-b border-yellow-500/20 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-400" />
            <p className="text-sm font-semibold text-yellow-400">Stok Di Bawah Minimum</p>
          </div>
          <div className="divide-y divide-white/8">
            {low_stock.map((s) => (
              <div key={s.id} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-[#EDE5D8]">{s.nama_bahan}</p>
                  <p className="text-[10px] text-[#A8967E]">Min: {s.stok_minimum} {s.satuan}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-yellow-400">{s.stok_sekarang} {s.satuan}</p>
                  <p className="text-[10px] text-[#5C5040]">{formatRupiah(s.harga_terakhir)}/{s.satuan}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {items.length > 0 && (
        <div className="bg-[#231e18] rounded-2xl border border-white/8 overflow-hidden">
          <div className="px-4 py-3 border-b border-white/8">
            <p className="text-sm font-semibold text-[#EDE5D8]">Detail Penerimaan</p>
          </div>
          <div className="divide-y divide-white/8">
            {items.map((item) => (
              <div key={item.id} className="px-4 py-3 flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-[#EDE5D8]">{item.bahan?.nama_bahan ?? '—'}</p>
                  <p className="text-[10px] text-[#A8967E] mt-0.5">
                    {item.qty_masuk} {item.bahan?.satuan} · {item.supplier?.nama_supplier ?? '—'}
                  </p>
                  <p className="text-[10px] text-[#5C5040]">{formatDate(item.tanggal_masuk)}</p>
                </div>
                <p className="text-xs font-semibold text-[#D4722A] flex-shrink-0">
                  {formatRupiah(item.qty_masuk * (item.harga_beli ?? 0))}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {items.length === 0 && (
        <div className="text-center py-8">
          <Package className="w-10 h-10 text-[#5C5040] mx-auto mb-2" />
          <p className="text-sm text-[#5C5040]">Tidak ada penerimaan bahan di periode ini</p>
        </div>
      )}
    </div>
  )
}

// ──────────────────────────────────────────────
function PurchasingReport({ data }: { data: {
  summary: { total_po: number; total_estimasi: number; total_realisasi: number }
  items: { id: string; nomor_po: string; tanggal_po: string; qty_order: number; satuan: string; total_estimasi: number | null; total_realisasi: number | null; status: string; bahan: { nama_bahan: string } | null; supplier: { nama_supplier: string } | null }[]
  by_supplier: { nama: string; total_po: number; total_nilai: number }[]
}}) {
  const { summary, items, by_supplier } = data
  const eff = summary.total_estimasi > 0
    ? Math.round((1 - summary.total_realisasi / summary.total_estimasi) * 100)
    : null

  return (
    <div className="space-y-4">
      <div className="bg-[#231e18] rounded-2xl border border-white/8 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Truck className="w-4 h-4 text-[#D4722A]" />
          <p className="text-sm font-semibold text-[#EDE5D8]">Ringkasan Purchase Order</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <SummaryCard label="Total PO" value={String(summary.total_po)} />
          <SummaryCard label="Estimasi Nilai" value={formatRupiah(summary.total_estimasi)} />
          <SummaryCard label="Realisasi Nilai" value={formatRupiah(summary.total_realisasi)} />
          {eff !== null && (
            <SummaryCard
              label="Efisiensi"
              value={`${Math.abs(eff)}%`}
              sub={eff >= 0 ? 'under budget ✓' : 'over budget !'}
            />
          )}
        </div>
      </div>

      {by_supplier.length > 0 && (
        <div className="bg-[#231e18] rounded-2xl border border-white/8 overflow-hidden">
          <div className="px-4 py-3 border-b border-white/8">
            <p className="text-sm font-semibold text-[#EDE5D8]">Per Supplier</p>
          </div>
          <div className="divide-y divide-white/8">
            {by_supplier.map((s, i) => (
              <div key={i} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-[#EDE5D8]">{s.nama}</p>
                  <p className="text-[10px] text-[#A8967E]">{s.total_po} PO</p>
                </div>
                <p className="text-xs font-semibold text-[#D4722A]">{formatRupiah(s.total_nilai)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {items.length > 0 && (
        <div className="bg-[#231e18] rounded-2xl border border-white/8 overflow-hidden">
          <div className="px-4 py-3 border-b border-white/8">
            <p className="text-sm font-semibold text-[#EDE5D8]">Detail PO</p>
          </div>
          <div className="divide-y divide-white/8">
            {items.map((po) => (
              <div key={po.id} className="px-4 py-3 flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-[#EDE5D8]">{po.bahan?.nama_bahan ?? '—'}</p>
                  <p className="text-[10px] text-[#A8967E] mt-0.5">{po.nomor_po} · {po.qty_order} {po.satuan}</p>
                  <p className="text-[10px] text-[#5C5040]">{formatDate(po.tanggal_po)} · {po.supplier?.nama_supplier ?? '—'}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className={cn(
                    'text-[10px] px-2 py-0.5 rounded-full font-medium',
                    po.status === 'sudah_terima' ? 'bg-green-900/30 text-green-400' :
                    po.status === 'approved' ? 'bg-blue-900/30 text-blue-400' :
                    'bg-[#2C1810] text-[#A8967E]'
                  )}>{po.status.replace(/_/g, ' ')}</span>
                  {po.total_realisasi != null && (
                    <p className="text-xs font-semibold text-[#D4722A] mt-1">{formatRupiah(po.total_realisasi)}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {items.length === 0 && (
        <div className="text-center py-8">
          <Truck className="w-10 h-10 text-[#5C5040] mx-auto mb-2" />
          <p className="text-sm text-[#5C5040]">Tidak ada PO di periode ini</p>
        </div>
      )}
    </div>
  )
}

// ──────────────────────────────────────────────
interface LaborUser {
  user_id: string; nama: string; role: string; gaji_pokok: number
  hari_hadir: number; total_menit: number; vpn_count: number
}
interface SavedCost {
  id: string; user_id: string; metode: string; hari_kerja: number
  hari_hadir: number; gaji_pokok: number; nilai_cost: number; bulan: string
}
interface AllUser { id: string; nama_lengkap: string; role: string; gaji_pokok: number }

function LaborReport({ data, bulan }: { data: {
  summary: { total_karyawan: number; total_hadir: number; total_jam_kerja: number; total_saved_cost: number }
  by_user: LaborUser[]
  saved_costs: SavedCost[]
  all_users: AllUser[]
}, bulan: string }) {
  const qc = useQueryClient()
  const { summary, by_user, saved_costs, all_users } = data
  const [calcUser, setCalcUser] = useState<(LaborUser & { hari_kerja: number }) | null>(null)
  const [metode, setMetode] = useState<'prorata' | 'total_gaji'>('prorata')
  const [hariKerja, setHariKerja] = useState(26)
  const [saving, setSaving] = useState(false)

  const [year, month] = bulan.split('-').map(Number)
  const bulanLabel = new Date(year, month - 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })

  function openCalc(u: LaborUser) {
    const saved = saved_costs.find(s => s.user_id === u.user_id)
    setHariKerja(saved?.hari_kerja ?? 26)
    setMetode((saved?.metode as 'prorata' | 'total_gaji') ?? 'prorata')
    setCalcUser({ ...u, hari_kerja: saved?.hari_kerja ?? 26 })
  }

  const nilaiCalc = calcUser
    ? metode === 'prorata'
      ? Math.round(calcUser.gaji_pokok / hariKerja * calcUser.hari_hadir)
      : calcUser.gaji_pokok
    : 0

  async function handleSave() {
    if (!calcUser) return
    setSaving(true)
    try {
      const res = await fetch('/api/labor-cost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: calcUser.user_id,
          bulan,
          metode,
          hari_kerja: hariKerja,
          hari_hadir: calcUser.hari_hadir,
          gaji_pokok: calcUser.gaji_pokok,
          nilai_cost: nilaiCalc,
        }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.message)
      toast.success('Labor cost disimpan')
      setCalcUser(null)
      qc.invalidateQueries({ queryKey: ['reports'] })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menyimpan')
    } finally {
      setSaving(false)
    }
  }

  // Merge: users yang ada absensi + yang belum punya data tapi ada di all_users
  const mergedUsers: LaborUser[] = all_users.map(u => {
    const found = by_user.find(b => b.user_id === u.id)
    return found ?? {
      user_id: u.id, nama: u.nama_lengkap, role: u.role,
      gaji_pokok: u.gaji_pokok, hari_hadir: 0, total_menit: 0, vpn_count: 0
    }
  })

  return (
    <div className="space-y-4">
      <div className="bg-[#231e18] rounded-2xl border border-white/8 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-[#D4722A]" />
          <p className="text-sm font-semibold text-[#EDE5D8]">Ringkasan SDM — {bulanLabel}</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <SummaryCard label="Total Karyawan" value={String(summary.total_karyawan)} sub="aktif" />
          <SummaryCard label="Total Kehadiran" value={String(summary.total_hadir)} sub="hari-orang" />
          <SummaryCard label="Total Jam Kerja" value={`${summary.total_jam_kerja} jam`} />
          <SummaryCard label="Total Labor Cost" value={formatRupiah(summary.total_saved_cost)} sub="yang sudah dihitung" />
        </div>
      </div>

      {/* Per karyawan */}
      <div className="bg-[#231e18] rounded-2xl border border-white/8 overflow-hidden">
        <div className="px-4 py-3 border-b border-white/8 flex items-center justify-between">
          <p className="text-sm font-semibold text-[#EDE5D8]">Per Karyawan</p>
          <span className="text-[10px] text-[#5C5040]">Tap untuk hitung cost</span>
        </div>
        <div className="divide-y divide-white/8">
          {mergedUsers.map((u) => {
            const saved = saved_costs.find(s => s.user_id === u.user_id)
            const jam = Math.floor(u.total_menit / 60)
            const mnt = u.total_menit % 60
            return (
              <div key={u.user_id} className="px-4 py-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-[#EDE5D8] truncate">{u.nama}</p>
                    <p className="text-[10px] text-[#A8967E] capitalize mt-0.5">{u.role.replace(/_/g, ' ')}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-[10px] text-[#5C5040]">{u.hari_hadir} hari hadir</span>
                      {u.total_menit > 0 && <span className="text-[10px] text-[#5C5040]">{jam}j {mnt}m</span>}
                      {u.vpn_count > 0 && <span className="text-[10px] text-yellow-500">⚠️ {u.vpn_count}x VPN</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {saved ? (
                      <div className="text-right">
                        <p className="text-xs font-semibold text-green-400">{formatRupiah(saved.nilai_cost)}</p>
                        <p className="text-[10px] text-[#5C5040]">{saved.metode === 'prorata' ? 'Pro-rata' : 'Total gaji'}</p>
                      </div>
                    ) : (
                      <span className="text-[10px] text-[#5C5040]">Belum dihitung</span>
                    )}
                    <button
                      onClick={() => openCalc(u)}
                      className="w-8 h-8 bg-[#2C1810] rounded-lg flex items-center justify-center flex-shrink-0"
                    >
                      <Calculator className="w-3.5 h-3.5 text-[#D4722A]" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {mergedUsers.length === 0 && (
        <div className="text-center py-8">
          <Users className="w-10 h-10 text-[#5C5040] mx-auto mb-2" />
          <p className="text-sm text-[#5C5040]">Tidak ada data karyawan</p>
        </div>
      )}

      {/* Labor Cost Calculator Modal */}
      <Dialog open={!!calcUser} onOpenChange={(o) => !o && setCalcUser(null)}>
        <DialogContent className="bg-[#231e18] border-white/8 text-[#EDE5D8]">
          <DialogHeader>
            <DialogTitle className="text-[#EDE5D8]">Hitung Labor Cost</DialogTitle>
          </DialogHeader>
          {calcUser && (
            <div className="space-y-4 py-1">
              {/* Info karyawan */}
              <div className="bg-[#1C1712] rounded-xl p-3 space-y-1">
                <p className="text-sm font-semibold text-[#EDE5D8]">{calcUser.nama}</p>
                <p className="text-xs text-[#A8967E] capitalize">{calcUser.role.replace(/_/g, ' ')}</p>
                <div className="flex gap-4 mt-2">
                  <div>
                    <p className="text-[10px] text-[#5C5040]">Gaji Pokok</p>
                    <p className="text-sm font-bold text-[#EDE5D8]">{formatRupiah(calcUser.gaji_pokok)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#5C5040]">Hari Hadir</p>
                    <p className="text-sm font-bold text-[#EDE5D8]">{calcUser.hari_hadir} hari</p>
                  </div>
                </div>
              </div>

              {/* Hari kerja bulan ini */}
              <div className="space-y-1">
                <label className="text-xs text-[#A8967E]">Hari Kerja Bulan Ini</label>
                <input
                  type="number"
                  min={1}
                  max={31}
                  value={hariKerja}
                  onChange={(e) => setHariKerja(Number(e.target.value))}
                  className="w-full bg-[#1C1712] border border-white/8 rounded-xl px-3 py-2.5 text-sm text-[#EDE5D8] focus:outline-none focus:border-[#D4722A]"
                />
              </div>

              {/* Pilihan metode */}
              <div className="space-y-2">
                <p className="text-xs text-[#A8967E]">Metode Perhitungan</p>
                {(['prorata', 'total_gaji'] as const).map((m) => (
                  <label key={m} className={cn(
                    'flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors',
                    metode === m ? 'border-[#D4722A] bg-[#D4722A]/10' : 'border-white/8 bg-[#1C1712]'
                  )}>
                    <input
                      type="radio"
                      name="metode"
                      value={m}
                      checked={metode === m}
                      onChange={() => setMetode(m)}
                      className="mt-0.5 accent-[#D4722A]"
                    />
                    <div>
                      <p className="text-xs font-semibold text-[#EDE5D8]">
                        {m === 'prorata' ? 'Pro-rata' : 'Total Gaji'}
                      </p>
                      <p className="text-[10px] text-[#5C5040] mt-0.5">
                        {m === 'prorata'
                          ? `Rp ${formatRupiah(calcUser.gaji_pokok)} ÷ ${hariKerja} hari × ${calcUser.hari_hadir} hadir`
                          : 'Bayar penuh tanpa pemotongan'}
                      </p>
                    </div>
                  </label>
                ))}
              </div>

              {/* Hasil */}
              <div className="bg-[#D4722A]/10 border border-[#D4722A]/30 rounded-xl p-4 flex justify-between items-center">
                <p className="text-sm text-[#A8967E]">Total Cost</p>
                <p className="text-xl font-bold text-[#D4722A]">{formatRupiah(nilaiCalc)}</p>
              </div>
            </div>
          )}
          <DialogFooter className="border-t border-white/8 pt-3">
            <Button variant="ghost" onClick={() => setCalcUser(null)} className="flex-1 text-[#A8967E] border border-white/8">Batal</Button>
            <Button onClick={handleSave} disabled={saving} className="flex-1 bg-[#D4722A] text-white">
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Simpan Cost
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
