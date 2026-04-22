'use client'

import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
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
import StatusBadge from '@/components/shared/StatusBadge'
import type { Produksi, StatusProduksi } from '@/lib/types'

interface UpdateProductionModalProps {
  open: boolean
  production: Produksi | null
  role: string
  onClose: () => void
  onSuccess: () => void
}

type NextStatusOption = {
  value: StatusProduksi
  label: string
}

function getNextStatusOptions(current: StatusProduksi): NextStatusOption[] {
  switch (current) {
    case 'belum':
      return [{ value: 'proses', label: 'Proses (Mulai Memasak)' }]
    case 'proses':
      return [{ value: 'selesai', label: 'Selesai (Produksi Selesai)' }]
    case 'selesai':
      return [{ value: 'qc_ok', label: 'QC OK (Lolos Quality Check)' }]
    default:
      return []
  }
}

function requiresRealisasi(status: StatusProduksi | ''): boolean {
  return status === 'selesai' || status === 'qc_ok'
}

export default function UpdateProductionModal({
  open,
  production,
  role,
  onClose,
  onSuccess,
}: UpdateProductionModalProps) {
  const [newStatus, setNewStatus] = useState<StatusProduksi | ''>('')
  const [realisasiPorsi, setRealisasiPorsi] = useState<string>('')
  const [catatan, setCatatan] = useState('')
  const [loading, setLoading] = useState(false)

  const nextOptions = production ? getNextStatusOptions(production.status) : []

  // Reset when modal opens/production changes
  useEffect(() => {
    if (open && production) {
      // Auto-select if only one option
      if (nextOptions.length === 1) {
        setNewStatus(nextOptions[0].value)
      } else {
        setNewStatus('')
      }
      setRealisasiPorsi(
        production.realisasi_porsi != null ? String(production.realisasi_porsi) : ''
      )
      setCatatan(production.catatan ?? '')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, production?.id])

  function handleClose() {
    if (!loading) onClose()
  }

  async function handleSubmit() {
    if (!production || !newStatus) {
      toast.error('Pilih status baru terlebih dahulu')
      return
    }

    if (requiresRealisasi(newStatus) && !realisasiPorsi) {
      toast.error('Realisasi porsi wajib diisi')
      return
    }

    const realisasiNum = realisasiPorsi ? Number(realisasiPorsi) : undefined
    if (realisasiPorsi && (isNaN(realisasiNum!) || realisasiNum! < 0)) {
      toast.error('Realisasi porsi tidak valid')
      return
    }

    setLoading(true)
    try {
      const body: Record<string, unknown> = { status: newStatus, catatan }
      if (realisasiNum !== undefined) body.realisasi_porsi = realisasiNum

      const res = await fetch(`/api/kitchen/production/${production.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message ?? 'Gagal update status')
      }

      toast.success('Status produksi berhasil diperbarui')
      onSuccess()
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal update status')
    } finally {
      setLoading(false)
    }
  }

  if (!production) return null

  const isRealisasiRequired = requiresRealisasi(newStatus)
  const noNextStatus = nextOptions.length === 0

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose() }}>
      <DialogContent
        className="bg-[#231e18] border border-white/8 text-[#EDE5D8] max-h-[90vh] flex flex-col overflow-hidden"
      >
        <DialogHeader>
          <DialogTitle className="text-[#EDE5D8] text-base font-semibold">
            Update Status Produksi
          </DialogTitle>
          <p className="text-xs text-[#A8967E] truncate">
            {production.menu?.nama_menu ?? '—'}
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-1">
          {/* Current status */}
          <div className="flex items-center justify-between bg-[#1C1712] rounded-xl px-4 py-3">
            <span className="text-xs text-[#A8967E]">Status saat ini</span>
            <StatusBadge status={production.status} />
          </div>

          {noNextStatus ? (
            <div className="text-center py-4">
              <p className="text-sm text-[#A8967E]">
                Produksi ini sudah dalam status akhir dan tidak dapat diubah.
              </p>
            </div>
          ) : (
            <>
              <Separator className="bg-white/8" />

              {/* New status select */}
              <div className="space-y-2">
                <Label className="text-xs text-[#A8967E] font-medium">
                  Status Baru <span className="text-red-400">*</span>
                </Label>
                <Select
                  value={newStatus || undefined}
                  onValueChange={(val) => setNewStatus(val as StatusProduksi)}
                >
                  <SelectTrigger className="w-full bg-[#1C1712] border-white/8 text-[#EDE5D8] h-11 data-placeholder:text-[#5C5040] focus-visible:border-[#D4722A]">
                    <SelectValue placeholder="Pilih status baru..." />
                  </SelectTrigger>
                  <SelectContent className="bg-[#231e18] border-white/8 text-[#EDE5D8]">
                    {nextOptions.map((opt) => (
                      <SelectItem
                        key={opt.value}
                        value={opt.value}
                        className="text-[#EDE5D8] focus:bg-[#2C1810] focus:text-[#EDE5D8]"
                      >
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Realisasi porsi */}
              <div className="space-y-2">
                <Label className="text-xs text-[#A8967E] font-medium">
                  Realisasi Porsi
                  {isRealisasiRequired && (
                    <span className="text-red-400 ml-1">*</span>
                  )}
                </Label>
                <Input
                  type="number"
                  min={0}
                  value={realisasiPorsi}
                  onChange={(e) => setRealisasiPorsi(e.target.value)}
                  placeholder={`Target: ${production.target_porsi} porsi`}
                  className="bg-[#1C1712] border-white/8 text-[#EDE5D8] placeholder:text-[#5C5040] focus-visible:border-[#D4722A] h-11"
                />
              </div>

              {/* Catatan */}
              <div className="space-y-2">
                <Label className="text-xs text-[#A8967E] font-medium">Catatan</Label>
                <textarea
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  rows={3}
                  placeholder="Tambahkan catatan (opsional)..."
                  className="w-full bg-[#1C1712] border border-white/8 rounded-xl px-3 py-2.5 text-sm text-[#EDE5D8] placeholder:text-[#5C5040] resize-none focus:outline-none focus:border-[#D4722A] transition-colors"
                />
              </div>
            </>
          )}
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
          {!noNextStatus && (
            <Button
              onClick={handleSubmit}
              disabled={loading || !newStatus}
              className="flex-1 bg-[#D4722A] hover:bg-[#D4722A]/90 text-white font-semibold"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Simpan
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
