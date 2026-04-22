import { formatRupiah } from '@/lib/utils/format'
import StatusBadge from '@/components/shared/StatusBadge'
import { StatusRekon } from '@/lib/types'

interface GerobakCardProps {
  nama: string
  revenue: number
  transactions: number
  statusRekon: StatusRekon | null
}

export default function GerobakCard({ nama, revenue, transactions, statusRekon }: GerobakCardProps) {
  return (
    <div className="bg-[#231e18] rounded-xl p-4 border border-white/8">
      <div className="flex items-center justify-between mb-3">
        <p className="font-semibold text-[#EDE5D8] text-sm">{nama}</p>
        {statusRekon ? (
          <StatusBadge status={statusRekon} />
        ) : (
          <span className="text-xs text-[#5C5040]">Belum shift</span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <p className="text-xs text-[#A8967E]">Revenue</p>
          <p className="font-bold text-[#D4722A] text-base">{formatRupiah(revenue)}</p>
        </div>
        <div>
          <p className="text-xs text-[#A8967E]">Transaksi</p>
          <p className="font-bold text-[#EDE5D8] text-base">{transactions}</p>
        </div>
      </div>
    </div>
  )
}
