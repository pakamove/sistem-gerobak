'use client'

import { ShoppingCart } from 'lucide-react'
import { usePOSStore } from '@/lib/stores/posStore'
import { formatRupiah } from '@/lib/utils/format'

interface CartBarProps {
  onOpenCart: () => void
}

export default function CartBar({ onOpenCart }: CartBarProps) {
  const cartTotal = usePOSStore((s) => s.cartTotal)
  const cartCount = usePOSStore((s) => s.cartCount)

  const count = cartCount()
  const total = cartTotal()

  return (
    <div className="mx-4">
      <button
        onClick={onOpenCart}
        disabled={count === 0}
        className={`w-full rounded-xl p-4 flex justify-between items-center transition-all ${
          count > 0
            ? 'bg-[#D4722A] text-white active:scale-95'
            : 'bg-[#2C1810] text-[#5C5040] cursor-not-allowed'
        }`}
      >
        <div className="flex items-center gap-2">
          <div className="relative">
            <ShoppingCart className="w-5 h-5" />
            {count > 0 && (
              <span className="absolute -top-2 -right-2 bg-white text-[#D4722A] text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
                {count}
              </span>
            )}
          </div>
          <span className="text-sm font-medium">
            {count > 0 ? `${count} item` : 'Keranjang kosong'}
          </span>
        </div>
        <span className="font-bold text-base">{count > 0 ? formatRupiah(total) : 'Rp 0'}</span>
      </button>
    </div>
  )
}
