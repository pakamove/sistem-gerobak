'use client'

import { Minus, Plus, Trash2 } from 'lucide-react'
import { CartItem } from '@/lib/types'
import { usePOSStore } from '@/lib/stores/posStore'
import { formatRupiah } from '@/lib/utils/format'

interface CartItemRowProps {
  item: CartItem
}

export default function CartItemRow({ item }: CartItemRowProps) {
  const updateQty = usePOSStore((s) => s.updateQty)
  const removeFromCart = usePOSStore((s) => s.removeFromCart)

  return (
    <div className="bg-[#2C1810] rounded-xl p-3 mb-2 flex items-center justify-between gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[#EDE5D8] truncate">{item.nama_menu}</p>
        <p className="text-xs text-[#A8967E] mt-0.5">
          {formatRupiah(item.harga_jual)} × {item.qty} ={' '}
          <span className="text-[#D4722A] font-semibold">{formatRupiah(item.subtotal)}</span>
        </p>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => updateQty(item.menu_id, item.qty - 1)}
          className="w-7 h-7 rounded-full bg-[#1C1712] text-[#EDE5D8] flex items-center justify-center active:scale-90 transition-transform"
        >
          <Minus className="w-3 h-3" />
        </button>
        <span className="w-6 text-center text-sm font-bold text-[#EDE5D8]">{item.qty}</span>
        <button
          onClick={() => updateQty(item.menu_id, item.qty + 1)}
          className="w-7 h-7 rounded-full bg-[#D4722A] text-white flex items-center justify-center active:scale-90 transition-transform"
        >
          <Plus className="w-3 h-3" />
        </button>
        <button
          onClick={() => removeFromCart(item.menu_id)}
          className="w-7 h-7 rounded-full bg-red-900/40 text-red-400 flex items-center justify-center active:scale-90 transition-transform ml-1"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  )
}
