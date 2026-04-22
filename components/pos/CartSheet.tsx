'use client'

import { ShoppingCart, Trash2 } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet'
import { usePOSStore } from '@/lib/stores/posStore'
import { formatRupiah } from '@/lib/utils/format'
import CartItemRow from './CartItemRow'

interface CartSheetProps {
  open: boolean
  onClose: () => void
  onCheckout: (method: 'tunai' | 'qris') => void
}

export default function CartSheet({ open, onClose, onCheckout }: CartSheetProps) {
  const cartItems = usePOSStore((s) => s.cartItems)
  const cartTotal = usePOSStore((s) => s.cartTotal)
  const clearCart = usePOSStore((s) => s.clearCart)

  const total = cartTotal()

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="bg-[#231e18] border-t border-white/8 max-h-[80vh] flex flex-col px-0 pb-0"
      >
        <SheetHeader className="px-4 pt-4 pb-2 border-b border-white/8 flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-[#D4722A]" />
            <SheetTitle className="text-[#EDE5D8]">Keranjang</SheetTitle>
          </div>
          {cartItems.length > 0 && (
            <button
              onClick={clearCart}
              className="flex items-center gap-1 text-xs text-red-400 bg-red-900/20 px-2 py-1 rounded-lg"
            >
              <Trash2 className="w-3 h-3" />
              Hapus Semua
            </button>
          )}
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 py-3">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <ShoppingCart className="w-12 h-12 text-[#A8967E]" />
              <p className="text-[#A8967E] text-sm">Keranjang masih kosong</p>
            </div>
          ) : (
            cartItems.map((item) => (
              <CartItemRow key={item.menu_id} item={item} />
            ))
          )}
        </div>

        {cartItems.length > 0 && (
          <SheetFooter className="px-4 pb-6 pt-3 border-t border-white/8 bg-[#1C1712]">
            <div className="flex justify-between items-center mb-4">
              <span className="text-[#A8967E] text-sm">Total</span>
              <span className="text-[#EDE5D8] font-bold text-lg">{formatRupiah(total)}</span>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => onCheckout('tunai')}
                className="flex-1 bg-[#D4722A] text-white font-bold py-3 rounded-xl text-sm active:scale-95 transition-transform"
              >
                💵 Tunai
              </button>
              <button
                onClick={() => onCheckout('qris')}
                className="flex-1 bg-[#2C1810] border border-[#D4722A] text-[#D4722A] font-bold py-3 rounded-xl text-sm active:scale-95 transition-transform"
              >
                📱 QRIS
              </button>
            </div>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  )
}
