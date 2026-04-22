'use client'

import { useState, useEffect } from 'react'
import { Loader2, AlertCircle, CheckCircle2, Receipt } from 'lucide-react'
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
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import MoneyInput from '@/components/shared/MoneyInput'
import { formatRupiah, formatDate } from '@/lib/utils/format'
import type { Menu, Shift } from '@/lib/types'

interface StokPenutupanItem {
  menu_id: string
  nama_menu: string
  qty_terima: number
  qty_sisa: number
  qty_waste: number
}

interface ShiftSummary {
  total_transaksi: number
  total_qris: number
  total_tunai: number
  jumlah_transaksi: number
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
  const [cashAktual, setCashAktual] = useState<number>(0)
  const [stokPenutupan, setStokPenutupan] = useState<StokPenutupanItem[]>([])
  const [catatan, setCatatan] = useState('')
  const [loading, setLoading] = useState(false)

  // Auto-fetch summary transaksi shift ini
  const { data: summary } = useQuery<ShiftSummary>({
    queryKey: ['shift-summary', shift.id],
    queryFn: async () => {
      const res = await fetch(`/api/pos/shift/summary?shift_id=${shift.id}`)
      if (!res.ok) return { total_transaksi: 0, total_qris: 0, total_tunai: 0, jumlah_transaksi: 0 }
      const json = await res.json()
      return json.data ?? { total_transaksi: 0, total_qris: 0, total_tunai: 0, jumlah_transaksi: 0 }
    },
    enabled: open && !!shift.id,
    refetchInterval: 30_000,
  })

  const { data: menus, isLoading: menusLoading } = useQuery<Menu[]>({
    queryKey: ['menus'],
    queryFn: fetchMenus,
    enabled: open,
  })

  const { data: stokGerobakData, isLoading: stokLoading } = useQuery<{ menu_id: string; qty_terima: number }[]>({
    queryKey: ['stok-gerobak', shift.id],
    queryFn: async () => {
      const res = await fetch(`/api/pos/shift?date=${shift.tanggal}`)
      if (!res.ok) return []
      const data = await res.json()
      const shiftData = Array.isArray(data)
        ? data.find((s: Shift & { stok_gerobak?: { menu_id: string; qty_terima: number }[] }) => s.id === shift.id)
        : data
      return shiftData?.stok_gerobak ?? []
    },
    enabled: open && !!shift.id,
  })

  useEffect(() => {
    if (menus && stokGerobakData) {
      setStokPenutupan(buildStokPenutupan(menus, stokGerobakData))
    }
  }, [menus, stokGerobakData])

  useEffect(() => {
    if (!open) {
      setCashAktual(0)
      setStokPenutupan([])
      setCatatan('')
    }
  }, [open])

  function updateSisa(menuId: string, qty: number) {
    setStokPenutupan((prev) =>
      prev.map((item) => item.menu_id === menuId ? { ...item, qty_sisa: Math.max(0, qty) } : item)
    )
  }

  function updateWaste(menuId: string, qty: number) {
    setStokPenutupan((prev) =>
      prev.map((item) => item.menu_id === menuId ? { ...item, qty_waste: Math.max(0, qty) } : item)
    )
  }

  const totalTunai = summary?.total_tunai ?? 0
  const totalQris = summary?.total_qris ?? 0
  const totalSistem = summary?.total_transaksi ?? 0
  const estimasiCashAkhir = shift.cash_awal + totalTunai
  const selisihCash = cashAktual - estimasiCashAkhir
  const gerobakName = shift.gerobak?.nama ?? 'Gerobak'
  const isDataLoading = menusLoading || stokLoading

  async function handleSubmit() {
    setLoading(true)
    try {
      const body = {
        shift_id: shift.id,
        cash_akhir: cashAktual,
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
              ? new Date(shift.waktu_buka).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
              : '—'}
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-5 py-2">
          {/* Ringkasan Transaksi (Auto dari Sistem) */}
          <div className="bg-[#1C1712] rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Receipt className="w-4 h-4 text-[#D4722A]" />
              <p className="text-sm font-semibold text-[#EDE5D8]">Ringkasan Transaksi Sistem</p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-[#A8967E]">Jumlah Transaksi</span>
                <span className="text-xs font-semibold text-[#EDE5D8]">{summary?.jumlah_transaksi ?? 0} transaksi</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-[#A8967E]">Total Tunai</span>
                <span className="text-xs font-semibold text-[#EDE5D8]">{formatRupiah(totalTunai)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-[#A8967E]">Total QRIS (otomatis)</span>
                <span className="text-xs font-semibold text-[#D4722A]">{formatRupiah(totalQris)}</span>
              </div>
              <Separator className="bg-white/8" />
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-[#EDE5D8]">Total Penjualan</span>
                <span className="text-sm font-bold text-[#EDE5D8]">{formatRupiah(totalSistem)}</span>
              </div>
            </div>
          </div>

          {/* Cash Rekonsiliasi */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-[#EDE5D8]">Rekonsiliasi Kas</p>

            <div className="bg-[#1C1712] rounded-xl p-3 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-[#A8967E]">Cash Awal</span>
                <span className="text-xs font-semibold text-[#EDE5D8]">{formatRupiah(shift.cash_awal)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-[#A8967E]">+ Total Tunai Sistem</span>
                <span className="text-xs font-semibold text-[#EDE5D8]">{formatRupiah(totalTunai)}</span>
              </div>
              <Separator className="bg-white/8" />
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-[#EDE5D8]">Estimasi Cash di Laci</span>
                <span className="text-sm font-bold text-[#EDE5D8]">{formatRupiah(estimasiCashAkhir)}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-[#A8967E] font-medium">
                Cash Aktual di Laci <span className="text-red-400">*</span>
              </Label>
              <MoneyInput
                value={cashAktual}
                onChange={setCashAktual}
                placeholder="Masukkan jumlah uang fisik"
              />
            </div>

            {cashAktual > 0 && (
              <div className={`rounded-xl p-3 flex items-center justify-between ${
                selisihCash === 0
                  ? 'bg-green-900/20 border border-green-500/20'
                  : 'bg-amber-900/20 border border-amber-500/20'
              }`}>
                <div className="flex items-center gap-2">
                  {selisihCash === 0
                    ? <CheckCircle2 className="w-4 h-4 text-green-400" />
                    : <AlertCircle className="w-4 h-4 text-amber-400" />}
                  <span className="text-xs font-medium text-[#EDE5D8]">Selisih Cash</span>
                </div>
                <span className={`text-sm font-bold ${selisihCash === 0 ? 'text-green-400' : 'text-amber-400'}`}>
                  {selisihCash >= 0 ? '+' : ''}{formatRupiah(selisihCash)}
                </span>
              </div>
            )}
          </div>

          <Separator className="bg-white/8" />

          {/* Stok Penutupan */}
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-[#EDE5D8]">Stok Sisa & Waste</p>
              <p className="text-xs text-[#A8967E] mt-0.5">Isi stok sisa yang dikembalikan dan yang terbuang</p>
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
                  <div key={item.menu_id} className="bg-[#1C1712] rounded-xl px-3 py-3 space-y-2">
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-medium text-[#EDE5D8]">{item.nama_menu}</p>
                      <span className="text-xs text-[#A8967E]">Terima: {item.qty_terima} porsi</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: 'Sisa (kembali)', value: item.qty_sisa, onChange: (v: number) => updateSisa(item.menu_id, v), color: 'text-[#D4722A]' },
                        { label: 'Waste (buang)', value: item.qty_waste, onChange: (v: number) => updateWaste(item.menu_id, v), color: 'text-red-400' },
                      ].map((field) => (
                        <div key={field.label} className="space-y-1">
                          <p className="text-[10px] text-[#A8967E]">{field.label}</p>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => field.onChange(field.value - 1)}
                              className="w-7 h-7 rounded-lg bg-[#2C1810] text-[#A8967E] flex items-center justify-center text-base font-bold active:scale-90 transition-transform"
                            >−</button>
                            <input
                              type="number"
                              min={0}
                              value={field.value}
                              onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                              className="flex-1 text-center bg-[#2C1810] border border-white/8 rounded-lg text-[#EDE5D8] text-sm py-1 focus:outline-none focus:border-[#D4722A]"
                            />
                            <button
                              type="button"
                              onClick={() => field.onChange(field.value + 1)}
                              className={`w-7 h-7 rounded-lg bg-[#2C1810] ${field.color} flex items-center justify-center text-base font-bold active:scale-90 transition-transform`}
                            >+</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator className="bg-white/8" />

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
            disabled={loading || cashAktual <= 0}
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
