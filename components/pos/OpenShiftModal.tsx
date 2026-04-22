'use client'

import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { formatRupiah, getTodayDate, formatDate } from '@/lib/utils/format'
import type { Menu, Shift } from '@/lib/types'

interface StokAwalItem {
  menu_id: string
  nama_menu: string
  qty_terima: number
}

interface OpenShiftModalProps {
  open: boolean
  onClose: () => void
  onSuccess: (shift: Shift) => void
}

async function fetchMenus(): Promise<Menu[]> {
  const res = await fetch('/api/pos/menu')
  if (!res.ok) throw new Error('Gagal memuat menu')
  return res.json()
}

export default function OpenShiftModal({ open, onClose, onSuccess }: OpenShiftModalProps) {
  const [cashAwal, setCashAwal] = useState<number>(0)
  const [stokAwal, setStokAwal] = useState<StokAwalItem[]>([])
  const [loading, setLoading] = useState(false)

  const { data: menus, isLoading: menusLoading } = useQuery<Menu[]>({
    queryKey: ['menus'],
    queryFn: fetchMenus,
    enabled: open,
  })

  // Sync menus into stokAwal state when menus load
  useEffect(() => {
    if (menus && menus.length > 0) {
      setStokAwal(
        menus
          .filter((m) => m.is_active)
          .sort((a, b) => a.urutan - b.urutan)
          .map((m) => ({
            menu_id: m.id,
            nama_menu: m.nama_menu,
            qty_terima: 0,
          }))
      )
    }
  }, [menus])

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setCashAwal(0)
      setStokAwal([])
    }
  }, [open])

  function updateQty(menuId: string, qty: number) {
    setStokAwal((prev) =>
      prev.map((item) =>
        item.menu_id === menuId ? { ...item, qty_terima: Math.max(0, qty) } : item
      )
    )
  }

  async function handleSubmit() {
    setLoading(true)
    try {
      const body = {
        cash_awal: cashAwal,
        stok_awal: stokAwal.map(({ menu_id, qty_terima }) => ({ menu_id, qty_terima })),
      }

      const res = await fetch('/api/pos/shift', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message ?? 'Gagal membuka shift')
      }

      const shift: Shift = await res.json()
      toast.success('Shift berhasil dibuka!')
      onSuccess(shift)
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal membuka shift')
    } finally {
      setLoading(false)
    }
  }

  const todayLabel = formatDate(getTodayDate())

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o && !loading) onClose() }}>
      <DialogContent
        showCloseButton={!loading}
        className="bg-[#231e18] border border-white/8 text-[#EDE5D8] max-h-[90vh] flex flex-col overflow-hidden"
      >
        <DialogHeader>
          <DialogTitle className="text-[#EDE5D8] text-base font-semibold">
            Buka Shift
          </DialogTitle>
          <p className="text-xs text-[#A8967E]">{todayLabel}</p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-5 py-2">
          {/* Cash Awal */}
          <div className="space-y-2">
            <Label className="text-xs text-[#A8967E] font-medium">Cash Awal (Modal Tunai)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A8967E] text-sm">
                Rp
              </span>
              <Input
                type="number"
                min={0}
                value={cashAwal === 0 ? '' : cashAwal}
                onChange={(e) => setCashAwal(Number(e.target.value) || 0)}
                placeholder="0"
                className="pl-9 bg-[#1C1712] border-white/8 text-[#EDE5D8] placeholder:text-[#5C5040] focus-visible:border-[#D4722A] h-11 text-base"
              />
            </div>
            {cashAwal > 0 && (
              <p className="text-xs text-[#A8967E]">{formatRupiah(cashAwal)}</p>
            )}
          </div>

          <Separator className="bg-white/8" />

          {/* Stok Awal per Menu */}
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-[#EDE5D8]">Stok Awal per Menu</p>
              <p className="text-xs text-[#A8967E] mt-0.5">
                Masukkan jumlah porsi yang diterima dari dapur
              </p>
            </div>

            {menusLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-12 rounded-xl bg-white/5 animate-pulse"
                  />
                ))}
              </div>
            ) : stokAwal.length === 0 ? (
              <p className="text-sm text-[#5C5040] text-center py-4">
                Tidak ada menu aktif
              </p>
            ) : (
              <div className="space-y-2">
                {stokAwal.map((item) => (
                  <div
                    key={item.menu_id}
                    className="flex items-center justify-between gap-3 bg-[#1C1712] rounded-xl px-3 py-2.5"
                  >
                    <span className="flex-1 text-sm text-[#EDE5D8] leading-tight">
                      {item.nama_menu}
                    </span>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => updateQty(item.menu_id, item.qty_terima - 1)}
                        className="w-7 h-7 rounded-lg bg-[#2C1810] text-[#A8967E] flex items-center justify-center text-base font-bold active:scale-90 transition-transform"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min={0}
                        value={item.qty_terima === 0 ? '0' : item.qty_terima}
                        onChange={(e) => updateQty(item.menu_id, Number(e.target.value) || 0)}
                        className="w-12 text-center bg-[#2C1810] border border-white/8 rounded-lg text-[#EDE5D8] text-sm py-1 focus:outline-none focus:border-[#D4722A]"
                      />
                      <button
                        type="button"
                        onClick={() => updateQty(item.menu_id, item.qty_terima + 1)}
                        className="w-7 h-7 rounded-lg bg-[#D4722A]/20 text-[#D4722A] flex items-center justify-center text-base font-bold active:scale-90 transition-transform"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="border-t border-white/8 bg-transparent -mx-4 -mb-4 px-4 pb-4 pt-3">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={loading}
            className="flex-1 text-[#A8967E] hover:text-[#EDE5D8] hover:bg-white/5 border border-white/8"
          >
            Batal
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || menusLoading}
            className="flex-1 bg-[#D4722A] hover:bg-[#D4722A]/90 text-white font-semibold"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Buka Shift
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
