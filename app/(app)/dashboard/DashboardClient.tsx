'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import TopHeader from '@/components/layout/TopHeader'
import SummaryCard from '@/components/dashboard/SummaryCard'
import GerobakCard from '@/components/dashboard/GerobakCard'
import StatusBadge from '@/components/shared/StatusBadge'
import EmptyState from '@/components/shared/EmptyState'
import { SummarySkeleton, CardSkeleton } from '@/components/shared/LoadingSkeleton'
import { Button } from '@/components/ui/button'
import { formatRupiah, getTodayDate, formatDate } from '@/lib/utils/format'
import { DashboardSummary } from '@/lib/types'
import {
  TrendingUp, ShoppingCart, Store, AlertTriangle,
  ChefHat, Package, RefreshCw, LayoutDashboard
} from 'lucide-react'

interface Props { namaUser: string }

export default function DashboardClient({ namaUser }: Props) {
  const [date, setDate] = useState(getTodayDate())

  const { data, isLoading, error, refetch } = useQuery<DashboardSummary>({
    queryKey: ['dashboard-summary', date],
    queryFn: async () => {
      const res = await fetch(`/api/dashboard/summary?date=${date}`)
      const json = await res.json()
      if (!json.success) throw new Error(json.message)
      return json.data as DashboardSummary
    },
    staleTime: 60 * 1000,
  })

  const isToday = date === getTodayDate()

  return (
    <div className="min-h-full">
      <TopHeader
        title="Dashboard"
        subtitle={`Halo, ${namaUser.split(' ')[0]}`}
        rightAction={
          <Button size="icon" variant="ghost" onClick={() => refetch()} className="w-9 h-9 text-[#A8967E]">
            <RefreshCw className="w-4 h-4" />
          </Button>
        }
      />

      <div className="px-4 pt-4 space-y-5 pb-6">
        {/* Date selector */}
        <div className="flex gap-2 items-center">
          <input
            id="dashboard-date"
            name="dashboard-date"
            type="date"
            value={date}
            max={getTodayDate()}
            onChange={e => setDate(e.target.value)}
            className="bg-[#231e18] border border-white/8 text-[#EDE5D8] rounded-lg px-3 py-2 text-sm flex-1 h-10"
          />
          {!isToday && (
            <Button size="sm" variant="ghost" onClick={() => setDate(getTodayDate())}
              className="text-[#D4722A] text-xs h-10">
              Hari Ini
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <SummarySkeleton />
            <div className="space-y-3">
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-400 mb-3">Gagal memuat data dashboard</p>
            <Button size="sm" onClick={() => refetch()} variant="outline" className="border-white/10 text-[#A8967E]">
              Coba Lagi
            </Button>
          </div>
        ) : !data ? (
          <EmptyState icon={LayoutDashboard} title="Belum ada data" description="Belum ada transaksi atau shift hari ini" />
        ) : (
          <>
            {/* Summary Cards */}
            <section>
              <h2 className="text-xs font-semibold text-[#A8967E] uppercase tracking-wide mb-3">
                Ringkasan {isToday ? 'Hari Ini' : formatDate(date)}
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <SummaryCard
                  label="Total Revenue"
                  value={formatRupiah(data.summary.total_revenue)}
                  icon={TrendingUp}
                  iconColor="text-green-400"
                  helperText={`${data.summary.total_transactions} transaksi`}
                  className="col-span-2"
                />
                <SummaryCard
                  label="Shift Aktif"
                  value={data.summary.active_shifts}
                  icon={Store}
                  helperText={`${data.summary.closed_shifts} sudah tutup`}
                />
                <SummaryCard
                  label="Ada Selisih"
                  value={data.summary.selisih_count}
                  icon={AlertTriangle}
                  iconColor={data.summary.selisih_count > 0 ? 'text-red-400' : 'text-green-400'}
                  helperText="shift bermasalah"
                />
              </div>
            </section>

            {/* Per Gerobak */}
            <section>
              <h2 className="text-xs font-semibold text-[#A8967E] uppercase tracking-wide mb-3">
                Per Gerobak
              </h2>
              {data.per_gerobak.length === 0 ? (
                <p className="text-[#5C5040] text-sm text-center py-4">Belum ada data gerobak</p>
              ) : (
                <div className="space-y-3">
                  {data.per_gerobak.map(g => (
                    <GerobakCard
                      key={g.gerobak_id}
                      nama={g.nama}
                      revenue={g.revenue}
                      transactions={g.transactions}
                      statusRekon={g.status_rekon}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* Produksi Hari Ini */}
            {data.production_today.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold text-[#A8967E] uppercase tracking-wide mb-3 flex items-center gap-1">
                  <ChefHat className="w-3.5 h-3.5" /> Produksi
                </h2>
                <div className="space-y-2">
                  {data.production_today.map((p, i) => (
                    <div key={i} className="bg-[#231e18] rounded-xl p-3 border border-white/8 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-[#EDE5D8]">{p.menu}</p>
                        <p className="text-xs text-[#A8967E]">
                          Target {p.target_porsi} • Realisasi {p.realisasi_porsi ?? '-'} porsi
                        </p>
                      </div>
                      <StatusBadge status={p.status} />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Bahan Kritis */}
            {data.critical_items.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold text-red-400 uppercase tracking-wide mb-3 flex items-center gap-1">
                  <Package className="w-3.5 h-3.5" /> Bahan Kritis ({data.critical_items.length})
                </h2>
                <div className="space-y-2">
                  {data.critical_items.map((item, i) => (
                    <div key={i} className="bg-red-500/10 rounded-xl p-3 border border-red-500/20 flex items-center justify-between">
                      <p className="text-sm font-medium text-[#EDE5D8]">{item.nama_bahan}</p>
                      <div className="text-right">
                        <p className="text-sm font-bold text-red-400">
                          {Number(item.stok_sekarang).toLocaleString('id-ID')}
                        </p>
                        <p className="text-xs text-[#A8967E]">min: {Number(item.stok_minimum).toLocaleString('id-ID')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  )
}
