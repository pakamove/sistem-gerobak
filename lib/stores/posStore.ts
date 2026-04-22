import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CartItem, Menu, Shift } from '@/lib/types'

interface POSStore {
  activeShift: Shift | null
  cartItems: CartItem[]
  setActiveShift: (shift: Shift | null) => void
  addToCart: (menu: Menu) => void
  updateQty: (menuId: string, qty: number) => void
  removeFromCart: (menuId: string) => void
  clearCart: () => void
  cartTotal: () => number
  cartCount: () => number
}

export const usePOSStore = create<POSStore>()(
  persist(
    (set, get) => ({
      activeShift: null,
      cartItems: [],

      setActiveShift: (shift) => set({ activeShift: shift }),

      addToCart: (menu) => {
        const existing = get().cartItems.find((i) => i.menu_id === menu.id)
        if (existing) {
          set({
            cartItems: get().cartItems.map((i) =>
              i.menu_id === menu.id
                ? { ...i, qty: i.qty + 1, subtotal: (i.qty + 1) * i.harga_jual }
                : i
            ),
          })
        } else {
          set({
            cartItems: [
              ...get().cartItems,
              {
                menu_id: menu.id,
                nama_menu: menu.nama_menu,
                harga_jual: menu.harga_jual,
                qty: 1,
                subtotal: menu.harga_jual,
              },
            ],
          })
        }
      },

      updateQty: (menuId, qty) => {
        if (qty <= 0) {
          set({ cartItems: get().cartItems.filter((i) => i.menu_id !== menuId) })
        } else {
          set({
            cartItems: get().cartItems.map((i) =>
              i.menu_id === menuId
                ? { ...i, qty, subtotal: qty * i.harga_jual }
                : i
            ),
          })
        }
      },

      removeFromCart: (menuId) => {
        set({ cartItems: get().cartItems.filter((i) => i.menu_id !== menuId) })
      },

      clearCart: () => set({ cartItems: [] }),

      cartTotal: () =>
        get().cartItems.reduce((sum, item) => sum + item.subtotal, 0),

      cartCount: () =>
        get().cartItems.reduce((sum, item) => sum + item.qty, 0),
    }),
    {
      name: 'pos-store',
      partialize: (state) => ({
        activeShift: state.activeShift,
        cartItems: state.cartItems,
      }),
    }
  )
)
