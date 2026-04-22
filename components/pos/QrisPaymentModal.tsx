'use client'

import { Loader2, QrCode } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { formatRupiah } from '@/lib/utils/format'

interface QrisPaymentModalProps {
  open: boolean
  total: number
  onClose: () => void
  onConfirm: () => void
  loading: boolean
}

export default function QrisPaymentModal({
  open,
  total,
  onClose,
  onConfirm,
  loading,
}: QrisPaymentModalProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o && !loading) onClose() }}>
      <DialogContent
        showCloseButton={!loading}
        className="bg-[#231e18] border border-white/8 text-[#EDE5D8]"
      >
        <DialogHeader>
          <DialogTitle className="text-[#EDE5D8] text-base">Pembayaran QRIS</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4">
          <div className="bg-[#1C1712] rounded-xl p-4 text-center w-full">
            <p className="text-xs text-[#A8967E] mb-1">Total Tagihan</p>
            <p className="text-2xl font-bold text-[#D4722A]">{formatRupiah(total)}</p>
          </div>

          <p className="text-sm text-[#A8967E] text-center">
            Arahkan kamera ke QR Code untuk melakukan pembayaran
          </p>

          <div className="w-[200px] h-[200px] bg-white rounded-2xl flex flex-col items-center justify-center gap-2 shadow-lg">
            <QrCode className="w-24 h-24 text-[#1C1712]" strokeWidth={1.5} />
            <p className="text-[#1C1712] text-xs font-medium text-center px-2">
              QR Code Gerobak
            </p>
          </div>

          <p className="text-xs text-[#A8967E] text-center">
            Pastikan pembayaran telah berhasil sebelum konfirmasi
          </p>

          <div className="flex flex-col gap-2 w-full">
            <button
              onClick={() => !loading && onConfirm()}
              disabled={loading}
              className="w-full bg-[#D4722A] text-white font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Konfirmasi Dibayar
            </button>
            <button
              onClick={onClose}
              disabled={loading}
              className="w-full bg-[#2C1810] text-[#A8967E] font-medium py-3 rounded-xl text-sm active:scale-95 transition-transform disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Batal
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
