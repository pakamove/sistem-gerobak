'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PurchaseOrder, StatusPO } from '@/lib/types'
import MoneyInput from '@/components/shared/MoneyInput'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface Props {
  open: boolean
  po: PurchaseOrder | null
  role: string
  onClose: () => void
  onSuccess: () => void
}

const nextStatuses: Record<StatusPO, StatusPO[]> = {
  draft: ['approved'],
  approved: ['sudah_beli'],
  sudah_beli: ['sudah_terima'],
  sudah_terima: [],
}

const statusLabel: Record<StatusPO, string> = {
  draft: 'Draft',
  approved: 'Approved',
  sudah_beli: 'Sudah Beli',
  sudah_terima: 'Sudah Terima',
}

export default function UpdatePOModal({ open, po, role, onClose, onSuccess }: Props) {
  const [status, setStatus] = useState<StatusPO | ''>('')
  const [hargaRealisasi, setHargaRealisasi] = useState(0)
  const [catatan, setCatatan] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open && po) {
      setStatus('')
      setHargaRealisasi(po.harga_realisasi ?? 0)
      setCatatan(po.catatan || '')
    }
  }, [open, po])

  if (!po) return null

  const availableStatuses = nextStatuses[po.status as StatusPO] || []
  const canApprove = ['owner', 'manager'].includes(role)

  const filteredStatuses = availableStatuses.filter(s => {
    if (s === 'approved' && !canApprove) return false
    return true
  })

  const handleSubmit = async () => {
    if (!status) { toast.error('Pilih status baru'); return }
    setLoading(true)
    try {
      const body: Record<string, unknown> = { status }
      if (hargaRealisasi > 0) body.harga_realisasi = hargaRealisasi
      if (hargaRealisasi > 0 && po.qty_order) body.total_realisasi = hargaRealisasi * po.qty_order
      if (catatan) body.catatan = catatan

      const res = await fetch(`/api/purchasing/po/${po.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.message)
      toast.success('Status PO berhasil diperbarui')
      onSuccess()
      onClose()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal update PO')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="bg-[#231e18] border-white/10 text-[#EDE5D8] max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-[#EDE5D8]">Update Status PO</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="bg-[#2C1810] rounded-lg p-3 space-y-1">
            <p className="text-xs text-[#A8967E]">{po.nomor_po}</p>
            <p className="font-semibold text-[#EDE5D8]">{po.bahan?.nama_bahan}</p>
            <p className="text-sm text-[#A8967E]">{po.qty_order} {po.satuan}</p>
          </div>
          {filteredStatuses.length > 0 ? (
            <div className="space-y-1">
              <Label className="text-[#A8967E] text-xs">Status Baru</Label>
              <Select value={status} onValueChange={v => setStatus(v as StatusPO)}>
                <SelectTrigger className="bg-[#2C1810] border-white/10 text-[#EDE5D8] h-11">
                  <SelectValue placeholder="Pilih status...">
                    {status ? statusLabel[status] : null}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-[#231e18] border-white/10">
                  {filteredStatuses.map(s => (
                    <SelectItem key={s} value={s} className="text-[#EDE5D8] focus:bg-[#2C1810]">
                      {statusLabel[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <p className="text-center text-[#A8967E] text-sm">PO ini sudah selesai</p>
          )}
          {(status === 'sudah_beli' || status === 'sudah_terima') && (
            <div className="space-y-1">
              <Label className="text-[#A8967E] text-xs">Harga Realisasi / satuan (Rp)</Label>
              <MoneyInput value={hargaRealisasi} onChange={setHargaRealisasi} placeholder="0" className="bg-[#2C1810] border-white/10 h-11" />
            </div>
          )}
          <div className="space-y-1">
            <Label className="text-[#A8967E] text-xs">Catatan</Label>
            <Input value={catatan} onChange={e => setCatatan(e.target.value)} placeholder="Catatan..."
              className="bg-[#2C1810] border-white/10 text-[#EDE5D8] h-11" />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={onClose} className="text-[#A8967E]">Batal</Button>
          {filteredStatuses.length > 0 && (
            <Button onClick={handleSubmit} disabled={loading || !status} className="bg-[#D4722A] hover:bg-[#c0601e] text-white">
              {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Menyimpan...</> : 'Simpan'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
