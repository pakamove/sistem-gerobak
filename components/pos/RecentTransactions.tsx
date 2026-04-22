'use client'

import { useQuery } from '@tanstack/react-query'
import { MetodeBayar, StatusTransaksi } from '@/lib/types'
import { formatRupiah, formatTime } from '@/lib/utils/format'

interface Transaction {
  id: string
  nomor_struk: string | null
  metode_bayar: MetodeBayar
  total: number
  waktu: string
  status: StatusTransaksi
}

interface RecentTransactionsProps {
  shiftId: string | null
}

async function fetchTransactions(shiftId: string): Promise<Transaction[]> {
  const res = await fetch(`/api/pos/transactions?shift_id=${shiftId}`)
  if (!res.ok) throw new Error('Failed to fetch transactions')
  return res.json()
}

function TransactionSkeleton() {
  return (
    <div className="flex items-center justify-between p-3 bg-[#2C1810] rounded-xl mb-2 animate-pulse">
      <div className="flex flex-col gap-1.5">
        <div className="h-3 w-24 bg-white/10 rounded" />
        <div className="h-3 w-16 bg-white/10 rounded" />
      </div>
      <div className="h-4 w-20 bg-white/10 rounded" />
    </div>
  )
}

export default function RecentTransactions({ shiftId }: RecentTransactionsProps) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['pos-transactions', shiftId],
    queryFn: () => fetchTransactions(shiftId!),
    enabled: !!shiftId,
    refetchInterval: 30000,
  })

  if (!shiftId) {
    return (
      <div className="px-4 py-6 text-center">
        <p className="text-[#A8967E] text-sm">Tidak ada shift aktif</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="px-4 py-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <TransactionSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <div className="px-4 py-6 text-center">
        <p className="text-red-400 text-sm">Gagal memuat transaksi</p>
      </div>
    )
  }

  const transactions = (data ?? []).slice(0, 10)

  if (transactions.length === 0) {
    return (
      <div className="px-4 py-6 text-center">
        <p className="text-[#A8967E] text-sm">Belum ada transaksi hari ini</p>
      </div>
    )
  }

  return (
    <div className="px-4 py-3">
      {transactions.map((trx) => (
        <div
          key={trx.id}
          className="flex items-center justify-between p-3 bg-[#2C1810] rounded-xl mb-2"
        >
          <div className="flex flex-col gap-0.5">
            <p className="text-xs text-[#EDE5D8] font-medium">
              {trx.nomor_struk ?? '—'}
            </p>
            <div className="flex items-center gap-1.5">
              <span
                className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                  trx.metode_bayar === 'qris'
                    ? 'bg-blue-900/40 text-blue-400'
                    : 'bg-green-900/40 text-green-400'
                }`}
              >
                {trx.metode_bayar.toUpperCase()}
              </span>
              <span className="text-[10px] text-[#A8967E]">
                {formatTime(trx.waktu)}
              </span>
            </div>
          </div>
          <p className="text-sm font-bold text-[#D4722A]">{formatRupiah(trx.total)}</p>
        </div>
      ))}
    </div>
  )
}
