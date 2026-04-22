'use client'

import { useState, useEffect } from 'react'
import { Loader2, AlertCircle } from 'lucide-react'
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
import { formatRupiah, formatDate } from '@/lib/utils/format'
import type { Menu, Shift } from '@/lib/types'

interface StokPenutupanItem {
  menu_id: string
  nama_menu: string
  qty_terima: number
  qty_sisa: number
  qty_waste: number
}

interface CloseShiftModalProps {
  open: boolean
  shift: Shift
  onClose: () => void
  onSuccess: () => void
}

async function fetchMenus(): Promise<Menu[]> {
  const res = await fetch('/api/pos/menu')
  if (!res.ok) throw new Error('Gagal memuat menu')
  const json = await res.json()
  return json.data?.menus ?? []
}

function buildStokPenutupan(menus: Menu[], stokGerobak: { menu_id: string; qty_terima: number }[]): StokPenutupanItem[] {
  const stokMap = new Map(stokGerobak.map((s) => [s.menu_id, s.qty_terima]))
  return menus
    .filter((m) => m.is_active && stokMap.has(m.id))
    .sort((a, b) => a.urutan - b.urutan)
    .map((m) => ({
      menu_id: m.id,
      nama_menu: m.nama_menu,
      qty_terima: stokMap.get(m.id) ?? 0,
      qty_sisa: 0,
      qty_waste: 0,
    }))
}

export default function CloseShiftModal({
  open,
  shift,
  onClose,
  onSuccess,
}: CloseShiftModalProps) {
  const [cashAkhir, setCashAkhir] = useState<number>(0)
  const [totalQris, setTotalQris] = useState<number>(0)
  const [stokPenutupan, setStokPenutupan] = useState<StokPenutupanItem[]>([])
  const [catatan, setCatatan] = useState('')
  const [loading, setLoading] = useState(false)

  const { data: menus, isLoading: menusLoading } = useQuery<Menu[]>({
    queryKey: ['menus'],
    queryFn: fetchMenus,
    enabled: open,
  })

  // Fetch stok gerobak untuk shift ini
  const { data: stokGerobakData, isLoading: stokLoading } = useQuery<
    { menu_id: string; qty_terima: number }[]
  >({
    queryKey: ['stok-gerobak', shift.id],
    queryFn: async () => {
      const res = await fetch(`/api/pos/shift?date=${shift.tanggal}`)
      if (!res.ok) throw new Error('Gagal memuat stok')
      const data = await res.json()
      // Expect data to be the shift with stok_gerobak or just the list
      const shiftData = Array.isArray(data)
        ? data.find((s: Shift & { stok_gerobak?: { menu_id: string; qty_terima: number }[] }) => s.id === shift.id)
        : data
      return shiftData?.stok_gerobak ?? []
    },
    enabled: open && !!shift.id,
  })

  // Build stok penutupan list when menus + stok loaded
  useEffect(() => {
    if (menus && stokGerobakData) {
      setStokPenutupan(buildStokPenutupan(menus, stokGerobakData))
    }
  }, [menus, stokGerobakData])

  // Reset on close
  useEffect(() => {
    if (!open) {
      setCashAkhir(0)
      setTotalQris(0)
      setStokPenutupan([])
      setCatatan('')
    }
  }, [open])

  function updateSisa(menuId: string, qty: number) {
    setStokPenutupan((prev) =>
      prev.map((item) =>
        item.menu_id === menuId ? { ...item, qty_sisa: Math.max(0, qty) } : item
      )
    )
  }

  function updateWaste(menuId: string, qty: number) {
    setStokPenutupan((prev) =>
      prev.map((item) =>
        item.menu_id === menuId ? { ...item, qty_waste: Math.max(0, qty) } : item
      )
    )
  }

  const estimasiPendapatan = (cashAkhir - shift.cash_awal) + totalQris
  const gerobakName = shift.gerobak?.nama ?? 'Gerobak'

  async function handleSubmit() {
    setLoading(true)
    try {
      const body = {
        shift_id: shift.id,
        cash_akhir: cashAkhir,
        total_qris: totalQris,
        stok_penutupan: stokPenutupan.map(({ menu_id, qty_sisa, qty_waste }) => ({
          menu_id,
          qty_sisa,
          qty_waste,
        })),
        catatan: catatan.trim() || null,
      }

      const res = await fetch('/api/pos/shift/close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message ?? 'Gagal menutup shift')
      }

      toast.success('Shift berhasil ditutup!')
      onSuccess()
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menutup shift')
    } finally {
      setLoading(false)
    }
  }

  const isDataLoading = menusLoading || stokLoading

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o && !loading) onClose() }}>
      <DialogContent
        showCloseButton={!loading}
        className="bg-[#231e18] border border-white/8 text-[#EDE5D8] max-h-[92vh] flex flex-col overflow-hidden"
      >
        <DialogHeader>
          <DialogTitle className="text-[#EDE5D8] text-base font-semibold">
            Tutup Shift — {gerobakName}
          </DialogTitle>
          <p className="text-xs text-[#A8967E]">
            {formatDate(shift.tanggal)} · Dibuka pukul{' '}
            {shift.waktu_buka
              ? new Date(shift.waktu_buka).toLocaleTimeString('id-ID', {
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : '—'}
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-5 py-2">
          {/* Ringkasan Shift */}
          <div className="bg-[#1C1712] rounded-xl p-3 flex justify-between items-center">
            <div>
              <p className="text-xs text-[#A8967E]">Cash Awal</p>
              <p className="text-sm font-semibold text-[#EDE5D8]">{formatRupiah(shift.cash_awal)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-[#A8967E]">Total Sistem</p>
              <p className="text-sm font-semibold text-[#EDE5D8]">
                {formatRupiah(shift.total_transaksi_sistem)}
              </p>
            </div>
          </div>

          {/* Rekonsiliasi Cash */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-[#EDE5D8]">Rekonsiliasi Kas</p>

            <div className="space-y-2">
              <Label className="text-xs text-[#A8967E] font-medium">Cash Akhir (Uang di Tangan)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A8967E] text-sm">
                  Rp
                </span>
                <Input
                  type="number"
                  min={0}
                  value={cashAkhir === 0 ? '' : cashAkhir}
                  onChange={(e) => setCashAkhir(Number(e.target.value) || 0)}
                  placeholder="0"
                  className="pl-9 bg-[#1C1712] border-white/8 text-[#EDE5D8] placeholder:text-[#5C5040] focus-visible:border-[#D4722A] h-11 text-base"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-[#A8967E] font-medium">Total QRIS Hari Ini</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A8967E] text-sm">
                  Rp
                </span>
                <Input
                  type="number"
                  min={0}
                  value={totalQris === 0 ? '' : totalQris}
                  onChange={(e) => setTotalQris(Number(e.target.value) || 0)}
                  placeholder="0"
                  className="pl-9 bg-[#1C1712] border-white/8 text-[#EDE5D8] placeholder:text-[#5C5040] focus-visible:border-[#D4722A] h-11 text-base"
                />
              </div>
            </div>

            {/* Estimasi Selisih */}
            {(cashAkhir > 0 || totalQris > 0) && (
              <div className="bg-[#1C1712] rounded-xl p-3 space-y-2">
                <p className="text-xs text-[#A8967E] font-medium">Estimasi Rekonsiliasi</p>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[#A8967E]">Total Sistem</span>
                  <span className="text-xs font-semibold text-[#EDE5D8]">
                    {formatRupiah(shift.total_transaksi_sistem)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[#A8967E]">Tunai (Akhir − Awal)</span>
                  <span className="text-xs font-semibold text-[#EDE5D8]">
                    {formatRupiah(cashAkhir - shift.cash_awal)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[#A8967E]">QRIS</span>
                  <span className="text-xs font-semibold text-[#EDE5D8]">
                    {formatRupiah(totalQris)}
                  </span>
                </div>
                <Separator className="bg-white/8" />
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-[#EDE5D8]">Estimasi Selisih</span>
                  <span
                    className={`text-sm font-bold ${
                      estimasiPendapatan >= shift.total_transaksi_sistem
                        ? 'text-green-400'
                        : 'text-red-400'
                    }`}
                  >
                    {formatRupiah(estimasiPendapatan - shift.total_transaksi_sistem)}
                  </span>
                </div>
                {estimasiPendapatan !== shift.total_transaksi_sistem && (
                  <div className="flex items-start gap-1.5 pt-1">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <p className="text-[10px] text-amber-400">
                      Ada perbedaan antara kas fisik dan sistem. Pastikan data sudah benar.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <Separator className="bg-white/8" />

          {/* Stok Penutupan */}
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-[#EDE5D8]">Stok Sisa & Waste</p>
              <p className="text-xs text-[#A8967E] mt-0.5">
                Isi stok sisa yang dikembalikan dan yang terbuang/rusak
              </p>
            </div>

            {isDataLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 rounded-xl bg-white/5 animate-pulse" />
                ))}
              </div>
            ) : stokPenutupan.length === 0 ? (
              <p className="text-sm text-[#5C5040] text-center py-4">
                Tidak ada stok terdaftar untuk shift ini
              </p>
            ) : (
              <div className="space-y-2">
                {stokPenutupan.map((item) => (
                  <div
                    key={item.menu_id}
                    className="bg-[#1C1712] rounded-xl px-3 py-3 space-y-2"
                  >
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-medium text-[#EDE5D8]">{item.nama_menu}</p>
                      <span className="text-xs text-[#A8967E]">
                        Terima: {item.qty_terima} porsi
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <p className="text-[10px] text-[#A8967E]">Sisa (dikembalikan)</p>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => updateSisa(item.menu_id, item.qty_sisa - 1)}
                            className="w-7 h-7 rounded-lg bg-[#2C1810] text-[#A8967E] flex items-center justify-center text-base font-bold active:scale-90 transition-transform"
                          >
                            −
                          </button>
                          <input
                            type="number"
                            min={0}
                            value={item.qty_sisa}
                            onChange={(e) => updateSisa(item.menu_id, Number(e.target.value) || 0)}
                            className="flex-1 text-center bg-[#2C1810] border border-white/8 rounded-lg text-[#EDE5D8] text-sm py-1 focus:outline-none focus:border-[#D4722A]"
                          />
                          <button
                            type="button"
                            onClick={() => updateSisa(item.menu_id, item.qty_sisa + 1)}
                            className="w-7 h-7 rounded-lg bg-[#D4722A]/20 text-[#D4722A] flex items-center justify-center text-base font-bold active:scale-90 transition-transform"
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] text-[#A8967E]">Waste (terbuang)</p>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => updateWaste(item.menu_id, item.qty_waste - 1)}
                            className="w-7 h-7 rounded-lg bg-[#2C1810] text-[#A8967E] flex items-center justify-center text-base font-bold active:scale-90 transition-transform"
                          >
                            −
                          </button>
                          <input
                            type="number"
                            min={0}
                            value={item.qty_waste}
                            onChange={(e) => updateWaste(item.menu_id, Number(e.target.value) || 0)}
                            className="flex-1 text-center bg-[#2C1810] border border-white/8 rounded-lg text-[#EDE5D8] text-sm py-1 focus:outline-none focus:border-[#D4722A]"
                          />
                          <button
                            type="button"
                            onClick={() => updateWaste(item.menu_id, item.qty_waste + 1)}
                            className="w-7 h-7 rounded-lg bg-red-900/20 text-red-400 flex items-center justify-center text-base font-bold active:scale-90 transition-transform"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator className="bg-white/8" />

          {/* Catatan */}
          <div className="space-y-2">
            <Label className="text-xs text-[#A8967E] font-medium">Catatan (opsional)</Label>
            <textarea
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Tambahkan catatan untuk shift ini..."
              rows={3}
              className="w-full bg-[#1C1712] border border-white/8 rounded-xl px-3 py-2.5 text-sm text-[#EDE5D8] placeholder:text-[#5C5040] resize-none focus:outline-none focus:border-[#D4722A]"
            />
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
            disabled={loading || isDataLoading || cashAkhir <= 0}
            className="flex-1 bg-red-700 hover:bg-red-600 text-white font-semibold"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Tutup Shift
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
