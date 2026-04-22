'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import TopHeader from '@/components/layout/TopHeader'
import { formatRupiah, formatDate } from '@/lib/utils/format'
import { BarChart3, ShoppingCart, Package, Truck, Users, TrendingUp, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'

type ReportType = 'sales' | 'inventory' | 'purchasing' | 'labor'

const REPORT_TYPES: { key: ReportType; label: string; icon: React.ElementType }[] = [
  { key: 'sales', label: 'Penjualan', icon: ShoppingCart },
  { key: 'inventory', label: 'Inventory', icon: Package },
  { key: 'purchasing', label: 'Pembelian', icon: Truck },
  { key: 'labor', label: 'SDM', icon: Users },
]

function getDefaultRange() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const from = `${y}-${m}-01`
  const lastDay = new Date(y, now.getMonth() + 1, 0).getDate()
  const to = `${y}-${m}-${String(lastDay).padStart(2, '0')}`
  return { from, to }
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

  function handleApply() {
    setApplied({ type, from, to })
  }

  return (
    <div className="min-h-full pb-8">
      <TopHeader title="Laporan" subtitle="Owner & Manager" />

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
                  active
                    ? 'bg-[#D4722A] text-white'
                    : 'bg-[#231e18] border border-white/8 text-[#A8967E] hover:text-[#EDE5D8]'
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {r.label}
              </button>
            )
          })}
        </div>

        {/* Date range filter */}
        <div className="bg-[#231e18] rounded-2xl border border-white/8 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#D4722A]" />
            <p className="text-sm font-semibold text-[#EDE5D8]">Rentang Waktu</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-[#A8967E] block mb-1">Dari</label>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="w-full bg-[#1C1712] border border-white/8 rounded-xl px-3 py-2 text-sm text-[#EDE5D8] focus:outline-none focus:border-[#D4722A]"
              />
            </div>
            <div>
              <label className="text-[10px] text-[#A8967E] block mb-1">Sampai</label>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="w-full bg-[#1C1712] border border-white/8 rounded-xl px-3 py-2 text-sm text-[#EDE5D8] focus:outline-none focus:border-[#D4722A]"
              />
            </div>
          </div>
          <button
            onClick={handleApply}
            className="w-full bg-[#D4722A] text-white text-sm font-semibold py-2.5 rounded-xl active:scale-95 transition-transform"
          >
            Tampilkan Laporan
          </button>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded-2xl bg-white/5 animate-pulse" />
            ))}
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="bg-red-900/20 border border-red-500/20 rounded-2xl p-4 text-center">
            <p className="text-sm text-red-400">Gagal memuat laporan</p>
          </div>
        )}

        {/* Sales Report */}
        {!isLoading && !error && data && applied.type === 'sales' && (
          <SalesReport data={data} />
        )}

        {/* Inventory Report */}
        {!isLoading && !error && data && applied.type === 'inventory' && (
          <InventoryReport data={data} />
        )}

        {/* Purchasing Report */}
        {!isLoading && !error && data && applied.type === 'purchasing' && (
          <PurchasingReport data={data} />
        )}

        {/* Labor Report */}
        {!isLoading && !error && data && applied.type === 'labor' && (
          <LaborReport data={data} />
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

function SalesReport({ data }: { data: { summary: { total_revenue: number; total_transactions: number; total_tunai: number; total_qris: number }; by_day: { date: string; total: number; count: number; tunai: number; qris: number }[] } }) {
  const { summary, by_day } = data
  return (
    <div className="space-y-4">
      {/* Summary */}
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
          <div className="bg-[#1C1712] rounded-xl p-3 flex justify-between items-center">
            <span className="text-xs text-[#A8967E]">Rata-rata per transaksi</span>
            <span className="text-sm font-semibold text-[#D4722A]">
              {formatRupiah(Math.round(summary.total_revenue / summary.total_transactions))}
            </span>
          </div>
        )}
      </div>

      {/* Per-day table */}
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
                <div className="flex gap-3">
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

function InventoryReport({ data }: { data: { summary: { total_penerimaan: number; total_nilai: number }; items: { id: string; tanggal_masuk: string; qty_masuk: number; harga_beli: number; bahan: { nama_bahan: string; satuan: string } | null; supplier: { nama_supplier: string } | null }[] } }) {
  const { summary, items } = data
  return (
    <div className="space-y-4">
      <div className="bg-[#231e18] rounded-2xl border border-white/8 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-[#D4722A]" />
          <p className="text-sm font-semibold text-[#EDE5D8]">Ringkasan Penerimaan Bahan</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <SummaryCard label="Total Penerimaan" value={String(summary.total_penerimaan)} sub="item masuk" />
          <SummaryCard label="Total Nilai" value={formatRupiah(summary.total_nilai)} />
        </div>
      </div>

      {items.length > 0 && (
        <div className="bg-[#231e18] rounded-2xl border border-white/8 overflow-hidden">
          <div className="px-4 py-3 border-b border-white/8">
            <p className="text-sm font-semibold text-[#EDE5D8]">Detail Penerimaan</p>
          </div>
          <div className="divide-y divide-white/8">
            {items.map((item) => (
              <div key={item.id} className="px-4 py-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-medium text-[#EDE5D8]">{item.bahan?.nama_bahan ?? '—'}</p>
                    <p className="text-[10px] text-[#A8967E] mt-0.5">
                      {item.qty_masuk} {item.bahan?.satuan} · {item.supplier?.nama_supplier ?? 'Supplier tidak diketahui'}
                    </p>
                    <p className="text-[10px] text-[#5C5040]">{formatDate(item.tanggal_masuk)}</p>
                  </div>
                  <p className="text-xs font-semibold text-[#D4722A]">
                    {formatRupiah(item.qty_masuk * (item.harga_beli ?? 0))}
                  </p>
                </div>
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

function PurchasingReport({ data }: { data: { summary: { total_po: number; total_estimasi: number; total_realisasi: number }; items: { id: string; nomor_po: string; tanggal_po: string; qty_order: number; satuan: string; harga_estimasi: number | null; total_realisasi: number | null; status: string; bahan: { nama_bahan: string } | null; supplier: { nama_supplier: string } | null }[] } }) {
  const { summary, items } = data
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
          {summary.total_estimasi > 0 && (
            <SummaryCard
              label="Efisiensi"
              value={`${Math.round((1 - summary.total_realisasi / summary.total_estimasi) * 100)}%`}
              sub={summary.total_realisasi <= summary.total_estimasi ? 'under budget' : 'over budget'}
            />
          )}
        </div>
      </div>

      {items.length > 0 && (
        <div className="bg-[#231e18] rounded-2xl border border-white/8 overflow-hidden">
          <div className="px-4 py-3 border-b border-white/8">
            <p className="text-sm font-semibold text-[#EDE5D8]">Detail PO</p>
          </div>
          <div className="divide-y divide-white/8">
            {items.map((po) => (
              <div key={po.id} className="px-4 py-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-medium text-[#EDE5D8]">{po.bahan?.nama_bahan ?? '—'}</p>
                    <p className="text-[10px] text-[#A8967E] mt-0.5">{po.nomor_po} · {po.qty_order} {po.satuan}</p>
                    <p className="text-[10px] text-[#5C5040]">{formatDate(po.tanggal_po)}</p>
                  </div>
                  <div className="text-right">
                    <span className={cn(
                      'text-[10px] px-2 py-0.5 rounded-full font-medium',
                      po.status === 'sudah_terima' ? 'bg-green-900/30 text-green-400' :
                      po.status === 'approved' ? 'bg-blue-900/30 text-blue-400' :
                      'bg-[#2C1810] text-[#A8967E]'
                    )}>{po.status}</span>
                    {po.total_realisasi && (
                      <p className="text-xs font-semibold text-[#D4722A] mt-1">{formatRupiah(po.total_realisasi)}</p>
                    )}
                  </div>
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

function LaborReport({ data }: { data: { summary: { total_hadir: number; total_jam_kerja: number }; by_user: { user_id: string; nama: string; role: string; hari_hadir: number; total_menit: number }[] } }) {
  const { summary, by_user } = data
  return (
    <div className="space-y-4">
      <div className="bg-[#231e18] rounded-2xl border border-white/8 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-[#D4722A]" />
          <p className="text-sm font-semibold text-[#EDE5D8]">Ringkasan Kehadiran</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <SummaryCard label="Total Kehadiran" value={String(summary.total_hadir)} sub="hari-orang" />
          <SummaryCard label="Total Jam Kerja" value={`${summary.total_jam_kerja} jam`} />
        </div>
      </div>

      {by_user.length > 0 && (
        <div className="bg-[#231e18] rounded-2xl border border-white/8 overflow-hidden">
          <div className="px-4 py-3 border-b border-white/8">
            <p className="text-sm font-semibold text-[#EDE5D8]">Per Karyawan</p>
          </div>
          <div className="divide-y divide-white/8">
            {by_user.map((u) => {
              const jam = Math.floor(u.total_menit / 60)
              const menit = u.total_menit % 60
              return (
                <div key={u.user_id} className="px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-[#EDE5D8]">{u.nama}</p>
                    <p className="text-[10px] text-[#A8967E] capitalize mt-0.5">{u.role.replace('_', ' ')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-[#D4722A]">{jam}j {menit}m</p>
                    <p className="text-[10px] text-[#A8967E]">{u.hari_hadir} hari hadir</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {by_user.length === 0 && (
        <div className="text-center py-8">
          <Users className="w-10 h-10 text-[#5C5040] mx-auto mb-2" />
          <p className="text-sm text-[#5C5040]">Tidak ada data kehadiran di periode ini</p>
        </div>
      )}
    </div>
  )
}
