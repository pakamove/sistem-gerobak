'use client'

import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { formatRupiah } from '@/lib/utils/format'
import MoneyInput from '@/components/shared/MoneyInput'

interface TunaiPaymentModalProps {
  open: boolean
  total: number
  onClose: () => void
  onConfirm: (uangDiterima: number) => void
  loading: boolean
}

export default function TunaiPaymentModal({
  open,
  total,
  onClose,
  onConfirm,
  loading,
}: TunaiPaymentModalProps) {
  const [uangDiterima, setUangDiterima] = useState<number>(0)

  useEffect(() => {
    if (open) setUangDiterima(0)
  }, [open])

  const kembalian = uangDiterima - total
  const canConfirm = uangDiterima >= total && !loading

  const quickAmounts = [
    { label: 'Pas', value: total },
    { label: '+5rb', value: Math.ceil(total / 5000) * 5000 + 5000 },
    { label: '+10rb', value: Math.ceil(total / 10000) * 10000 + 10000 },
    { label: '+20rb', value: Math.ceil(total / 20000) * 20000 + 20000 },
    { label: '+50rb', value: Math.ceil(total / 50000) * 50000 + 50000 },
  ]

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent
        showCloseButton={!loading}
        className="bg-[#231e18] border border-white/8 text-[#EDE5D8]"
      >
        <DialogHeader>
          <DialogTitle className="text-[#EDE5D8] text-base">Pembayaran Tunai</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="bg-[#1C1712] rounded-xl p-4 text-center">
            <p className="text-xs text-[#A8967E] mb-1">Total Tagihan</p>
            <p className="text-2xl font-bold text-[#D4722A]">{formatRupiah(total)}</p>
          </div>

          <div>
            <label className="text-xs text-[#A8967E] mb-1 block">Uang Diterima</label>
            <MoneyInput
              value={uangDiterima}
              onChange={setUangDiterima}
              placeholder="0"
              className="text-xl font-bold text-right h-12"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            {quickAmounts.map((qa) => (
              <button
                key={qa.label}
                onClick={() => setUangDiterima(qa.value)}
                className="flex-1 min-w-[60px] bg-[#2C1810] text-[#A8967E] text-xs py-2 px-2 rounded-lg active:scale-95 transition-transform whitespace-nowrap"
              >
                {qa.label}
              </button>
            ))}
          </div>

          <div className="bg-[#1C1712] rounded-xl p-3 flex justify-between items-center">
            <span className="text-sm text-[#A8967E]">Kembalian</span>
            <span
              className={`text-base font-bold ${
                kembalian >= 0 ? 'text-green-400' : 'text-red-400'
              }`}
            >
              {formatRupiah(kembalian >= 0 ? kembalian : 0)}
            </span>
          </div>

          <button
            onClick={() => canConfirm && onConfirm(uangDiterima)}
            disabled={!canConfirm}
            className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-opacity ${
              canConfirm
                ? 'bg-[#D4722A] text-white active:scale-95 transition-transform'
                : 'bg-[#2C1810] text-[#A8967E] opacity-60 cursor-not-allowed'
            }`}
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Konfirmasi Pembayaran
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
