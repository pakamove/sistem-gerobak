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
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { getTodayDate } from '@/lib/utils/format'
import type { Menu, User } from '@/lib/types'

interface CreateProductionModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

async function fetchMenus(): Promise<Menu[]> {
  const res = await fetch('/api/pos/menu')
  if (!res.ok) throw new Error('Gagal memuat menu')
  const json = await res.json()
  // API may return array directly or wrapped in data
  return Array.isArray(json) ? json : (json.data?.menus ?? json.data ?? json)
}

async function fetchKoki(): Promise<User[]> {
  const res = await fetch('/api/kitchen/koki')
  if (!res.ok) throw new Error('Gagal memuat data koki')
  const json = await res.json()
  return json.data?.koki ?? []
}

const emptyForm = {
  menu_id: '',
  target_porsi: '',
  alokasi_g1: '',
  alokasi_g2: '',
  alokasi_g3: '',
  koki_id: '',
  tanggal: getTodayDate(),
  catatan: '',
}

export default function CreateProductionModal({
  open,
  onClose,
  onSuccess,
}: CreateProductionModalProps) {
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(false)

  const { data: menus, isLoading: menusLoading } = useQuery<Menu[]>({
    queryKey: ['menus-active'],
    queryFn: fetchMenus,
    enabled: open,
    staleTime: 5 * 60 * 1000,
  })

  const { data: kokiList, isLoading: kokiLoading } = useQuery<User[]>({
    queryKey: ['koki-list'],
    queryFn: fetchKoki,
    enabled: open,
    staleTime: 5 * 60 * 1000,
  })

  // Reset form when modal opens
  useEffect(() => {
    if (open) setForm({ ...emptyForm, tanggal: getTodayDate() })
  }, [open])

  function setField(key: keyof typeof emptyForm, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function handleClose() {
    if (!loading) onClose()
  }

  async function handleSubmit() {
    if (!form.menu_id) {
      toast.error('Pilih menu terlebih dahulu')
      return
    }
    const targetNum = Number(form.target_porsi)
    if (!form.target_porsi || isNaN(targetNum) || targetNum <= 0) {
      toast.error('Target porsi harus lebih dari 0')
      return
    }

    setLoading(true)
    try {
      const body = {
        menu_id: form.menu_id,
        target_porsi: targetNum,
        alokasi_g1: Number(form.alokasi_g1) || 0,
        alokasi_g2: Number(form.alokasi_g2) || 0,
        alokasi_g3: Number(form.alokasi_g3) || 0,
        koki_id: form.koki_id || null,
        tanggal: form.tanggal || getTodayDate(),
        catatan: form.catatan,
      }

      const res = await fetch('/api/kitchen/production', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message ?? 'Gagal membuat rencana produksi')
      }

      toast.success('Rencana produksi berhasil dibuat')
      onSuccess()
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal membuat rencana produksi')
    } finally {
      setLoading(false)
    }
  }

  const activeMenus = (menus ?? []).filter((m) => m.is_active).sort((a, b) => a.urutan - b.urutan)
  const isDataLoading = menusLoading || kokiLoading

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose() }}>
      <DialogContent className="bg-[#231e18] border border-white/8 text-[#EDE5D8] max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-[#EDE5D8] text-base font-semibold">
            Buat Rencana Produksi
          </DialogTitle>
          <p className="text-xs text-[#A8967E]">Isi detail produksi untuk hari ini</p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-1">
          {/* Menu */}
          <div className="space-y-2">
            <Label className="text-xs text-[#A8967E] font-medium">
              Menu <span className="text-red-400">*</span>
            </Label>
            {menusLoading ? (
              <div className="h-11 rounded-xl bg-white/5 animate-pulse" />
            ) : (
              <Select
                value={form.menu_id}
                onValueChange={(val) => setField('menu_id', val)}
              >
                <SelectTrigger className="w-full bg-[#1C1712] border-white/8 text-[#EDE5D8] h-11 data-placeholder:text-[#5C5040] focus-visible:border-[#D4722A]">
                  <SelectValue placeholder="Pilih menu...">
                    {form.menu_id ? (activeMenus.find(m => m.id === form.menu_id)?.nama_menu ?? null) : null}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-[#231e18] border-white/8 text-[#EDE5D8]">
                  {activeMenus.length === 0 ? (
                    <div className="px-3 py-4 text-center text-xs text-[#5C5040]">
                      Tidak ada menu aktif
                    </div>
                  ) : (
                    activeMenus.map((menu) => (
                      <SelectItem
                        key={menu.id}
                        value={menu.id}
                        className="text-[#EDE5D8] focus:bg-[#2C1810] focus:text-[#EDE5D8]"
                      >
                        {menu.nama_menu}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Target porsi */}
          <div className="space-y-2">
            <Label className="text-xs text-[#A8967E] font-medium">
              Target Porsi <span className="text-red-400">*</span>
            </Label>
            <Input
              type="number"
              min={1}
              value={form.target_porsi}
              onChange={(e) => setField('target_porsi', e.target.value)}
              placeholder="Contoh: 50"
              className="bg-[#1C1712] border-white/8 text-[#EDE5D8] placeholder:text-[#5C5040] focus-visible:border-[#D4722A] h-11"
            />
          </div>

          <Separator className="bg-white/8" />

          {/* Alokasi G1/G2/G3 */}
          <div className="space-y-2">
            <Label className="text-xs text-[#A8967E] font-medium">
              Alokasi per Gerobak <span className="text-[#5C5040]">(opsional)</span>
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {(['g1', 'g2', 'g3'] as const).map((g) => (
                <div key={g} className="space-y-1">
                  <span className="text-xs text-[#5C5040] font-medium uppercase">{g}</span>
                  <Input
                    type="number"
                    min={0}
                    value={form[`alokasi_${g}` as keyof typeof form]}
                    onChange={(e) => setField(`alokasi_${g}` as keyof typeof emptyForm, e.target.value)}
                    placeholder="0"
                    className="bg-[#1C1712] border-white/8 text-[#EDE5D8] placeholder:text-[#5C5040] focus-visible:border-[#D4722A] h-10 text-center"
                  />
                </div>
              ))}
            </div>
          </div>

          <Separator className="bg-white/8" />

          {/* Koki */}
          <div className="space-y-2">
            <Label className="text-xs text-[#A8967E] font-medium">
              Koki <span className="text-[#5C5040]">(opsional)</span>
            </Label>
            {kokiLoading ? (
              <div className="h-11 rounded-xl bg-white/5 animate-pulse" />
            ) : (
              <Select
                value={form.koki_id}
                onValueChange={(val) => setField('koki_id', val)}
              >
                <SelectTrigger className="w-full bg-[#1C1712] border-white/8 text-[#EDE5D8] h-11 data-placeholder:text-[#5C5040] focus-visible:border-[#D4722A]">
                  <SelectValue placeholder="Pilih koki (opsional)...">
                    {form.koki_id ? ((kokiList ?? []).find(k => k.id === form.koki_id)?.nama_lengkap ?? null) : null}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-[#231e18] border-white/8 text-[#EDE5D8]">
                  {(kokiList ?? []).length === 0 ? (
                    <div className="px-3 py-4 text-center text-xs text-[#5C5040]">
                      Tidak ada koki tersedia
                    </div>
                  ) : (
                    (kokiList ?? []).map((koki) => (
                      <SelectItem
                        key={koki.id}
                        value={koki.id}
                        className="text-[#EDE5D8] focus:bg-[#2C1810] focus:text-[#EDE5D8]"
                      >
                        {koki.nama_lengkap}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Tanggal */}
          <div className="space-y-2">
            <Label className="text-xs text-[#A8967E] font-medium">Tanggal</Label>
            <Input
              type="date"
              value={form.tanggal}
              onChange={(e) => setField('tanggal', e.target.value)}
              className="bg-[#1C1712] border-white/8 text-[#EDE5D8] focus-visible:border-[#D4722A] h-11 [color-scheme:dark]"
            />
          </div>

          {/* Catatan */}
          <div className="space-y-2">
            <Label className="text-xs text-[#A8967E] font-medium">Catatan</Label>
            <textarea
              value={form.catatan}
              onChange={(e) => setField('catatan', e.target.value)}
              rows={3}
              placeholder="Tambahkan catatan (opsional)..."
              className="w-full bg-[#1C1712] border border-white/8 rounded-xl px-3 py-2.5 text-sm text-[#EDE5D8] placeholder:text-[#5C5040] resize-none focus:outline-none focus:border-[#D4722A] transition-colors"
            />
          </div>
        </div>

        <DialogFooter className="border-t border-white/8 -mx-4 -mb-4 px-4 pb-4 pt-3 bg-transparent">
          <Button
            variant="ghost"
            onClick={handleClose}
            disabled={loading}
            className="flex-1 text-[#A8967E] hover:text-[#EDE5D8] hover:bg-white/5 border border-white/8"
          >
            Batal
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || isDataLoading}
            className="flex-1 bg-[#D4722A] hover:bg-[#D4722A]/90 text-white font-semibold"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Buat Produksi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
