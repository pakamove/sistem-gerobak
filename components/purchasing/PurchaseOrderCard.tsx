'use client'

import { PurchaseOrder } from '@/lib/types'
import StatusBadge from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { formatRupiah, formatDate } from '@/lib/utils/format'
import { Calendar, Package } from 'lucide-react'

interface Props {
  po: PurchaseOrder
  role: string
  onUpdateStatus: (po: PurchaseOrder) => void
}

export default function PurchaseOrderCard({ po, role, onUpdateStatus }: Props) {
  const canUpdate = ['owner', 'manager', 'purchaser'].includes(role)
  const isDone = po.status === 'sudah_terima'

  return (
    <div className="bg-[#231e18] rounded-xl p-4 border border-white/8 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-[#5C5040] font-mono">{po.nomor_po || 'Draft'}</p>
          <p className="font-semibold text-[#EDE5D8] text-sm leading-tight truncate">
            {po.bahan?.nama_bahan || 'Bahan tidak diketahui'}
          </p>
          {po.supplier && (
            <p className="text-xs text-[#A8967E]">{po.supplier.nama_supplier}</p>
          )}
        </div>
        <StatusBadge status={po.status} />
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="bg-[#2C1810] rounded-lg p-2">
          <p className="text-xs text-[#A8967E]">Order</p>
          <p className="font-semibold text-[#EDE5D8]">{po.qty_order.toLocaleString('id-ID')} {po.satuan}</p>
        </div>
        <div className="bg-[#2C1810] rounded-lg p-2">
          <p className="text-xs text-[#A8967E]">Estimasi</p>
          <p className="font-semibold text-[#EDE5D8]">
            {po.total_estimasi ? formatRupiah(po.total_estimasi) : '-'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs text-[#A8967E]">
        <div className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          <span>PO: {formatDate(po.tanggal_po)}</span>
        </div>
        <div className="flex items-center gap-1">
          <Package className="w-3 h-3" />
          <span>Butuh: {formatDate(po.tanggal_butuh)}</span>
        </div>
      </div>

      {po.harga_realisasi && (
        <div className="bg-green-500/10 rounded-lg p-2">
          <p className="text-xs text-green-400">
            Realisasi: {formatRupiah(po.total_realisasi || po.harga_realisasi * po.qty_order)}
          </p>
        </div>
      )}

      {canUpdate && !isDone && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => onUpdateStatus(po)}
          className="w-full border-[#D4722A]/30 text-[#D4722A] hover:bg-[#D4722A]/10 h-9"
        >
          Update Status
        </Button>
      )}
    </div>
  )
}
