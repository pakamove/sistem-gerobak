'use client'

import { ShoppingCart } from 'lucide-react'
import { usePOSStore } from '@/lib/stores/posStore'
import { formatRupiah } from '@/lib/utils/format'

interface CartBarProps {
  onOpenCart: () => void
}

export default function CartBar({ onOpenCart }: CartBarProps) {
  const cartItems = usePOSStore((s) => s.cartItems)
  const cartTotal = usePOSStore((s) => s.cartTotal)
  const cartCount = usePOSStore((s) => s.cartCount)

  const count = cartCount()
  const total = cartTotal()

  if (count === 0) return null

  return (
    <div className="mx-4">
      <button
        onClick={onOpenCart}
        className="w-full bg-[#D4722A] text-white rounded-xl p-4 flex justify-between items-center"
      >
        <div className="flex items-center gap-2">
          <div className="relative">
            <ShoppingCart className="w-5 h-5" />
            <span className="absolute -top-2 -right-2 bg-white text-[#D4722A] text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
              {count}
            </span>
          </div>
          <span className="text-sm font-medium">{count} item</span>
        </div>
        <span className="font-bold text-base">{formatRupiah(total)}</span>
      </button>
    </div>
  )
}
