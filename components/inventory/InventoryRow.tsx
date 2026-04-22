'use client'

import { BahanBaku } from '@/lib/types'
import { formatRupiah } from '@/lib/utils/format'
import { Button } from '@/components/ui/button'
import { Plus, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface InventoryRowProps {
  item: BahanBaku & { status_stok: 'ok' | 'warning' | 'critical' }
  canAdd?: boolean
  onRecordIncoming?: (item: BahanBaku) => void
}

const statusIcon = {
  ok: <CheckCircle className="w-4 h-4 text-green-400" />,
  warning: <AlertTriangle className="w-4 h-4 text-yellow-400" />,
  critical: <XCircle className="w-4 h-4 text-red-400" />,
}

const statusColor = {
  ok: 'text-green-400',
  warning: 'text-yellow-400',
  critical: 'text-red-400',
}

export default function InventoryRow({ item, canAdd, onRecordIncoming }: InventoryRowProps) {
  return (
    <div className={cn(
      'bg-[#231e18] rounded-xl p-3 border flex items-center gap-3',
      item.status_stok === 'critical' ? 'border-red-500/30' : 'border-white/8'
    )}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-[#EDE5D8] text-sm truncate">{item.nama_bahan}</p>
          {statusIcon[item.status_stok]}
        </div>
        <div className="flex items-center gap-3 mt-1">
          <span className={cn('text-sm font-semibold', statusColor[item.status_stok])}>
            {Number(item.stok_sekarang).toLocaleString('id-ID')} {item.satuan}
          </span>
          <span className="text-xs text-[#5C5040]">min: {Number(item.stok_minimum).toLocaleString('id-ID')}</span>
        </div>
        <p className="text-xs text-[#A8967E] mt-0.5">
          {formatRupiah(item.harga_terakhir)} / {item.satuan}
        </p>
      </div>
      {canAdd && onRecordIncoming && (
        <Button
          size="icon"
          variant="ghost"
          onClick={() => onRecordIncoming(item)}
          className="w-9 h-9 rounded-lg bg-[#D4722A]/10 hover:bg-[#D4722A]/20 text-[#D4722A] flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
        </Button>
      )}
    </div>
  )
}
