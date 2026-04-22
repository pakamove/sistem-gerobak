'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import TopHeader from '@/components/layout/TopHeader'
import InventoryRow from '@/components/inventory/InventoryRow'
import InventoryIncomingModal from '@/components/inventory/InventoryIncomingModal'
import EmptyState from '@/components/shared/EmptyState'
import { ListSkeleton } from '@/components/shared/LoadingSkeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { BahanBaku } from '@/lib/types'
import { Plus, Search, Package, RefreshCw } from 'lucide-react'

interface Props {
  role: string
  canAdd: boolean
}

type FilterType = 'semua' | 'critical' | 'warning'

export default function InventoryClient({ role, canAdd }: Props) {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterType>('semua')
  const [selectedBahan, setSelectedBahan] = useState<BahanBaku | null>(null)
  const [showIncoming, setShowIncoming] = useState(false)

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['inventory', filter, search],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filter !== 'semua') params.set('filter', filter)
      if (search) params.set('search', search)
      const res = await fetch(`/api/inventory/stock?${params}`)
      const json = await res.json()
      return json.data?.items || []
    },
  })

  const items: (BahanBaku & { status_stok: 'ok' | 'warning' | 'critical' })[] = data || []
  const criticalCount = items.filter(i => i.status_stok === 'critical').length

  return (
    <div className="min-h-full">
      <TopHeader
        title="Inventori"
        subtitle="Stok Bahan Baku"
        rightAction={
          <div className="flex gap-2">
            <Button size="icon" variant="ghost" onClick={() => refetch()} className="w-9 h-9 text-[#A8967E]">
              <RefreshCw className="w-4 h-4" />
            </Button>
            {canAdd && (
              <Button size="sm" onClick={() => { setSelectedBahan(null); setShowIncoming(true) }}
                className="bg-[#D4722A] hover:bg-[#c0601e] text-white h-9 px-3">
                <Plus className="w-4 h-4 mr-1" /> Masuk
              </Button>
            )}
          </div>
        }
      />

      <div className="px-4 pt-4 space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5C5040]" />
          <Input
            placeholder="Cari bahan..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-[#231e18] border-white/8 text-[#EDE5D8] pl-9 h-11"
          />
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2">
          {(['semua', 'warning', 'critical'] as FilterType[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                filter === f
                  ? f === 'critical' ? 'bg-red-500/30 text-red-400'
                    : f === 'warning' ? 'bg-yellow-500/30 text-yellow-400'
                    : 'bg-[#D4722A] text-white'
                  : 'bg-[#2C1810] text-[#A8967E]'
              }`}
            >
              {f === 'semua' ? `Semua (${items.length})` : f === 'critical' ? `Kritis (${criticalCount})` : 'Perhatian'}
            </button>
          ))}
        </div>

        {/* List */}
        {isLoading ? (
          <ListSkeleton count={6} />
        ) : error ? (
          <div className="text-center py-8 text-red-400">Gagal memuat data</div>
        ) : items.length === 0 ? (
          <EmptyState icon={Package} title="Tidak ada data" description="Bahan baku belum tersedia" />
        ) : (
          <div className="space-y-2 pb-4">
            {items.map(item => (
              <InventoryRow
                key={item.id}
                item={item}
                canAdd={canAdd}
                onRecordIncoming={(b) => { setSelectedBahan(b); setShowIncoming(true) }}
              />
            ))}
          </div>
        )}
      </div>

      <InventoryIncomingModal
        open={showIncoming}
        bahan={selectedBahan}
        onClose={() => { setShowIncoming(false); setSelectedBahan(null) }}
        onSuccess={() => { qc.invalidateQueries({ queryKey: ['inventory'] }) }}
      />
    </div>
  )
}
