'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import TopHeader from '@/components/layout/TopHeader'
import PurchaseOrderCard from '@/components/purchasing/PurchaseOrderCard'
import CreatePOModal from '@/components/purchasing/CreatePOModal'
import UpdatePOModal from '@/components/purchasing/UpdatePOModal'
import EmptyState from '@/components/shared/EmptyState'
import { ListSkeleton } from '@/components/shared/LoadingSkeleton'
import { Button } from '@/components/ui/button'
import { PurchaseOrder, StatusPO } from '@/lib/types'
import { Plus, ShoppingBag } from 'lucide-react'

interface Props { role: string }

const statusFilters: { label: string; value: string }[] = [
  { label: 'Semua', value: '' },
  { label: 'Draft', value: 'draft' },
  { label: 'Approved', value: 'approved' },
  { label: 'Sudah Beli', value: 'sudah_beli' },
  { label: 'Diterima', value: 'sudah_terima' },
]

export default function PurchasingClient({ role }: Props) {
  const qc = useQueryClient()
  const [statusFilter, setStatusFilter] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['purchase-orders', statusFilter],
    queryFn: async () => {
      const params = statusFilter ? `?status=${statusFilter}` : ''
      const res = await fetch(`/api/purchasing/po${params}`)
      const json = await res.json()
      return json.data?.purchase_orders || []
    },
  })

  const orders: PurchaseOrder[] = data || []

  const counts = {
    draft: orders.filter(o => o.status === 'draft').length,
    approved: orders.filter(o => o.status === 'approved').length,
    sudah_beli: orders.filter(o => o.status === 'sudah_beli').length,
  }

  return (
    <div className="min-h-full">
      <TopHeader
        title="Purchasing"
        subtitle="Purchase Orders"
        rightAction={
          <Button size="sm" onClick={() => setShowCreate(true)}
            className="bg-[#D4722A] hover:bg-[#c0601e] text-white h-9 px-3">
            <Plus className="w-4 h-4 mr-1" /> PO Baru
          </Button>
        }
      />

      <div className="px-4 pt-4 space-y-4">
        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Draft', value: counts.draft, color: 'text-slate-400' },
            { label: 'Approved', value: counts.approved, color: 'text-blue-400' },
            { label: 'Sudah Beli', value: counts.sudah_beli, color: 'text-orange-400' },
          ].map(c => (
            <div key={c.label} className="bg-[#231e18] rounded-xl p-3 border border-white/8 text-center">
              <p className={`text-xl font-bold ${c.color}`}>{c.value}</p>
              <p className="text-xs text-[#A8967E] mt-0.5">{c.label}</p>
            </div>
          ))}
        </div>

        {/* Filter */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {statusFilters.map(f => (
            <button key={f.value} onClick={() => setStatusFilter(f.value)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                statusFilter === f.value ? 'bg-[#D4722A] text-white' : 'bg-[#2C1810] text-[#A8967E]'
              }`}>
              {f.label}
            </button>
          ))}
        </div>

        {/* List */}
        {isLoading ? (
          <ListSkeleton count={4} />
        ) : orders.length === 0 ? (
          <EmptyState icon={ShoppingBag} title="Belum ada PO"
            description="Buat Purchase Order baru untuk kebutuhan pembelian"
            action={
              <Button onClick={() => setShowCreate(true)} size="sm"
                className="bg-[#D4722A] hover:bg-[#c0601e] text-white">
                <Plus className="w-4 h-4 mr-1" /> Buat PO
              </Button>
            }
          />
        ) : (
          <div className="space-y-3 pb-4">
            {orders.map(po => (
              <PurchaseOrderCard key={po.id} po={po} role={role} onUpdateStatus={setSelectedPO} />
            ))}
          </div>
        )}
      </div>

      <CreatePOModal open={showCreate} onClose={() => setShowCreate(false)}
        onSuccess={() => qc.invalidateQueries({ queryKey: ['purchase-orders'] })} />

      <UpdatePOModal open={!!selectedPO} po={selectedPO} role={role}
        onClose={() => setSelectedPO(null)}
        onSuccess={() => { qc.invalidateQueries({ queryKey: ['purchase-orders'] }); setSelectedPO(null) }} />
    </div>
  )
}
