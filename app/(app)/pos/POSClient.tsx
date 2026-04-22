'use client'

import { useState, useEffect, useCallback } from 'react'
import { Store, AlertCircle, Loader2 } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import TopHeader from '@/components/layout/TopHeader'
import CategoryFilter from '@/components/pos/CategoryFilter'
import MenuCard from '@/components/pos/MenuCard'
import CartBar from '@/components/pos/CartBar'
import CartSheet from '@/components/pos/CartSheet'
import TunaiPaymentModal from '@/components/pos/TunaiPaymentModal'
import QrisPaymentModal from '@/components/pos/QrisPaymentModal'
import OpenShiftModal from '@/components/pos/OpenShiftModal'
import CloseShiftModal from '@/components/pos/CloseShiftModal'
import { GridSkeleton } from '@/components/shared/LoadingSkeleton'
import EmptyState from '@/components/shared/EmptyState'
import { usePOSStore } from '@/lib/stores/posStore'
import type { Menu, Shift } from '@/lib/types'

interface POSClientProps {
  profile: {
    id: string
    nama_lengkap: string
    role: string
    lokasi_tugas: string | null
  }
}

const CATEGORIES = ['nasi', 'lauk', 'sayur', 'kriuk', 'minuman']

async function fetchMenus(kategori: string): Promise<Menu[]> {
  const url =
    kategori !== 'semua'
      ? `/api/pos/menu?kategori=${encodeURIComponent(kategori)}`
      : '/api/pos/menu'
  const res = await fetch(url)
  if (!res.ok) throw new Error('Gagal memuat menu')
  const json = await res.json()
  return json.data?.menus ?? []
}

async function fetchActiveShift(): Promise<Shift | null> {
  const res = await fetch('/api/pos/shift')
  if (res.status === 404) return null
  if (!res.ok) throw new Error('Gagal mengambil shift')
  const json = await res.json()
  return json.data?.shift ?? null
}

interface CreateTransactionPayload {
  shift_id: string
  metode_bayar: 'tunai' | 'qris'
  cart_items: { menu_id: string; qty: number }[]
  payment: { uang_diterima: number } | { confirmed: true }
}

async function createTransaction(payload: CreateTransactionPayload) {
  const res = await fetch('/api/pos/transactions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message ?? 'Transaksi gagal')
  }
  return res.json()
}

export default function POSClient({ profile }: POSClientProps) {
  const queryClient = useQueryClient()

  // UI state
  const [selectedCategory, setSelectedCategory] = useState<string>('semua')
  const [showCart, setShowCart] = useState(false)
  const [showOpenShift, setShowOpenShift] = useState(false)
  const [showCloseShift, setShowCloseShift] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'tunai' | 'qris' | null>(null)
  const [paymentLoading, setPaymentLoading] = useState(false)

  // Store
  const activeShift = usePOSStore((s) => s.activeShift)
  const setActiveShift = usePOSStore((s) => s.setActiveShift)
  const cartItems = usePOSStore((s) => s.cartItems)
  const addToCart = usePOSStore((s) => s.addToCart)
  const cartTotal = usePOSStore((s) => s.cartTotal)
  const cartCount = usePOSStore((s) => s.cartCount)
  const clearCart = usePOSStore((s) => s.clearCart)

  // Fetch shift dari server dan sync ke store
  const { data: shiftData, isLoading: shiftLoading } = useQuery<Shift | null>({
    queryKey: ['shift'],
    queryFn: fetchActiveShift,
    staleTime: 0,
  })

  useEffect(() => {
    if (shiftData !== undefined) {
      setActiveShift(shiftData)
    }
  }, [shiftData, setActiveShift])

  // Gunakan data server sebagai sumber kebenaran, bukan store (hindari stale persist)
  const resolvedShift = shiftData !== undefined ? shiftData : activeShift

  // Fetch menus
  const {
    data: menus,
    isLoading: menusLoading,
    isError: menusError,
  } = useQuery<Menu[]>({
    queryKey: ['pos-menus', selectedCategory],
    queryFn: () => fetchMenus(selectedCategory),
    staleTime: 60_000,
    enabled: !!resolvedShift,
  })

  // Create transaction mutation
  const transactionMutation = useMutation({
    mutationFn: createTransaction,
    onSuccess: () => {
      clearCart()
      setPaymentMethod(null)
      setPaymentLoading(false)
      toast.success('Transaksi berhasil!')
      queryClient.invalidateQueries({ queryKey: ['pos-transactions'] })
    },
    onError: (err) => {
      setPaymentLoading(false)
      toast.error(err instanceof Error ? err.message : 'Transaksi gagal')
    },
  })

  const handleMenuTap = useCallback(
    (menu: Menu) => {
      addToCart(menu)
    },
    [addToCart]
  )

  const handleCheckout = useCallback((method: 'tunai' | 'qris') => {
    setShowCart(false)
    // Small delay to let sheet close before modal opens
    setTimeout(() => setPaymentMethod(method), 150)
  }, [])

  const handleTunaiConfirm = useCallback(
    (uangDiterima: number) => {
      const shift = shiftData ?? activeShift
      if (!shift) return
      setPaymentLoading(true)
      transactionMutation.mutate({
        shift_id: shift.id,
        metode_bayar: 'tunai',
        cart_items: cartItems.map((i) => ({ menu_id: i.menu_id, qty: i.qty })),
        payment: { uang_diterima: uangDiterima },
      })
    },
    [shiftData, activeShift, cartItems, transactionMutation]
  )

  const handleQrisConfirm = useCallback(() => {
    const shift = shiftData ?? activeShift
    if (!shift) return
    setPaymentLoading(true)
    transactionMutation.mutate({
      shift_id: shift.id,
      metode_bayar: 'qris',
      cart_items: cartItems.map((i) => ({ menu_id: i.menu_id, qty: i.qty })),
      payment: { confirmed: true },
    })
  }, [shiftData, activeShift, cartItems, transactionMutation])

  const handleOpenShiftSuccess = useCallback(
    (shift: Shift) => {
      setActiveShift(shift)
      queryClient.invalidateQueries({ queryKey: ['shift'] })
    },
    [setActiveShift, queryClient]
  )

  const handleCloseShiftSuccess = useCallback(() => {
    setActiveShift(null)
    clearCart()
    queryClient.invalidateQueries({ queryKey: ['shift'] })
    queryClient.invalidateQueries({ queryKey: ['pos-transactions'] })
  }, [setActiveShift, clearCart, queryClient])

  const total = cartTotal()
  const count = cartCount()

  // Header right action
  const headerRightAction = (
    <div className="flex items-center gap-2">
      {resolvedShift ? (
        <>
          <div className="flex items-center gap-1.5 bg-green-900/30 border border-green-500/30 rounded-full px-2.5 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[10px] font-semibold text-green-400">Shift Aktif</span>
          </div>
          <button
            onClick={() => setShowCloseShift(true)}
            className="text-[10px] font-semibold text-red-400 bg-red-900/20 border border-red-500/20 rounded-full px-2.5 py-1 active:scale-95 transition-transform"
          >
            Tutup Shift
          </button>
        </>
      ) : (
        <div className="flex items-center gap-1.5 bg-red-900/20 border border-red-500/20 rounded-full px-2.5 py-1">
          <AlertCircle className="w-3 h-3 text-red-400" />
          <span className="text-[10px] font-semibold text-red-400">Belum Buka Shift</span>
        </div>
      )}
    </div>
  )

  const gerobakSubtitle = resolvedShift?.gerobak?.nama ?? profile.lokasi_tugas ?? 'Gerobak'

  if (shiftLoading) {
    return (
      <div className="min-h-screen bg-[#1C1712] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#D4722A] animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#1C1712] flex flex-col">
      <TopHeader
        title="POS"
        subtitle={gerobakSubtitle}
        rightAction={headerRightAction}
      />

      {/* No active shift — prompt to open */}
      {!resolvedShift ? (
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="w-full max-w-sm">
            <div className="bg-[#231e18] border border-white/8 rounded-2xl p-8 flex flex-col items-center gap-5 text-center">
              <div className="w-20 h-20 rounded-2xl bg-[#2C1810] flex items-center justify-center">
                <Store className="w-10 h-10 text-[#D4722A]" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-[#EDE5D8]">
                  Shift Belum Dibuka
                </h2>
                <p className="text-sm text-[#A8967E] mt-1">
                  Buka shift terlebih dahulu untuk mulai menerima pesanan
                </p>
              </div>
              <button
                onClick={() => setShowOpenShift(true)}
                className="w-full bg-[#D4722A] text-white font-bold py-4 rounded-xl text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
              >
                <Store className="w-5 h-5" />
                Buka Shift Sekarang
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col">
          {/* Category Filter */}
          <CategoryFilter
            categories={CATEGORIES}
            selectedCategory={selectedCategory}
            onChange={setSelectedCategory}
          />

          {/* Menu Grid */}
          <div className="flex-1 pb-24">
            {menusLoading ? (
              <GridSkeleton count={6} />
            ) : menusError ? (
              <EmptyState
                icon={AlertCircle}
                title="Gagal memuat menu"
                description="Coba refresh halaman"
              />
            ) : !menus || menus.length === 0 ? (
              <EmptyState
                icon={Store}
                title="Tidak ada menu"
                description={
                  selectedCategory !== 'semua'
                    ? `Tidak ada menu untuk kategori "${selectedCategory}"`
                    : 'Belum ada menu yang tersedia'
                }
              />
            ) : (
              <div className="grid grid-cols-2 gap-3 px-4 py-2 pb-4">
                {menus
                  .filter((m) => m.is_active)
                  .map((menu) => (
                    <MenuCard key={menu.id} menu={menu} onTap={handleMenuTap} />
                  ))}
              </div>
            )}
          </div>

          {/* Cart Bar — always sticky above bottom nav */}
          <div className="fixed bottom-16 left-0 right-0 z-40 pb-2 pt-2 bg-[#1C1712]/90 backdrop-blur-sm border-t border-white/8">
            <CartBar onOpenCart={() => setShowCart(true)} />
          </div>
        </div>
      )}

      {/* Cart Sheet */}
      <CartSheet
        open={showCart}
        onClose={() => setShowCart(false)}
        onCheckout={handleCheckout}
      />

      {/* Tunai Payment Modal */}
      <TunaiPaymentModal
        open={paymentMethod === 'tunai'}
        total={total}
        onClose={() => {
          if (!paymentLoading) setPaymentMethod(null)
        }}
        onConfirm={handleTunaiConfirm}
        loading={paymentLoading}
      />

      {/* QRIS Payment Modal */}
      <QrisPaymentModal
        open={paymentMethod === 'qris'}
        total={total}
        onClose={() => {
          if (!paymentLoading) setPaymentMethod(null)
        }}
        onConfirm={handleQrisConfirm}
        loading={paymentLoading}
      />

      {/* Open Shift Modal */}
      <OpenShiftModal
        open={showOpenShift}
        onClose={() => setShowOpenShift(false)}
        onSuccess={handleOpenShiftSuccess}
      />

      {/* Close Shift Modal */}
      {resolvedShift && showCloseShift && (
        <CloseShiftModal
          open={showCloseShift}
          shift={resolvedShift}
          onClose={() => setShowCloseShift(false)}
          onSuccess={handleCloseShiftSuccess}
        />
      )}
    </div>
  )
}
