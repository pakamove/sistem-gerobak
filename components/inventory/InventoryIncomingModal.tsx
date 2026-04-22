'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { BahanBaku } from '@/lib/types'
import { getTodayDate } from '@/lib/utils/format'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface Props {
  open: boolean
  bahan: BahanBaku | null
  onClose: () => void
  onSuccess: () => void
}

export default function InventoryIncomingModal({ open, bahan, onClose, onSuccess }: Props) {
  const [qtyMasuk, setQtyMasuk] = useState('')
  const [hargaBeli, setHargaBeli] = useState('')
  const [tanggalMasuk, setTanggalMasuk] = useState(getTodayDate())
  const [catatan, setCatatan] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      setQtyMasuk('')
      setHargaBeli(bahan?.harga_terakhir ? String(bahan.harga_terakhir) : '')
      setTanggalMasuk(getTodayDate())
      setCatatan('')
    }
  }, [open, bahan])

  const handleSubmit = async () => {
    if (!bahan) return
    const qty = parseFloat(qtyMasuk)
    const harga = parseInt(hargaBeli)
    if (!qty || qty <= 0) { toast.error('Qty masuk harus > 0'); return }
    if (isNaN(harga) || harga < 0) { toast.error('Harga beli tidak valid'); return }

    setLoading(true)
    try {
      const res = await fetch('/api/inventory/incoming', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bahan_id: bahan.id,
          qty_masuk: qty,
          harga_beli: harga,
          tanggal_masuk: tanggalMasuk,
          catatan,
        }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.message)
      toast.success(`Bahan masuk berhasil dicatat`)
      onSuccess()
      onClose()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal menyimpan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-[#231e18] border-white/10 text-[#EDE5D8] max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-[#EDE5D8]">Catat Bahan Masuk</DialogTitle>
        </DialogHeader>
        {bahan && (
          <div className="space-y-4">
            <div className="bg-[#2C1810] rounded-lg p-3">
              <p className="font-semibold text-[#EDE5D8]">{bahan.nama_bahan}</p>
              <p className="text-xs text-[#A8967E]">Stok saat ini: {Number(bahan.stok_sekarang).toLocaleString('id-ID')} {bahan.satuan}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-[#A8967E] text-xs">Tanggal Masuk</Label>
              <Input type="date" value={tanggalMasuk} onChange={e => setTanggalMasuk(e.target.value)}
                className="bg-[#2C1810] border-white/10 text-[#EDE5D8] h-11" />
            </div>
            <div className="space-y-1">
              <Label className="text-[#A8967E] text-xs">Qty Masuk ({bahan.satuan})</Label>
              <Input type="number" min="0" step="0.1" placeholder="0" value={qtyMasuk}
                onChange={e => setQtyMasuk(e.target.value)}
                className="bg-[#2C1810] border-white/10 text-[#EDE5D8] h-11 text-lg font-bold" />
            </div>
            <div className="space-y-1">
              <Label className="text-[#A8967E] text-xs">Harga Beli (Rp / {bahan.satuan})</Label>
              <Input type="number" min="0" placeholder="0" value={hargaBeli}
                onChange={e => setHargaBeli(e.target.value)}
                className="bg-[#2C1810] border-white/10 text-[#EDE5D8] h-11" />
            </div>
            <div className="space-y-1">
              <Label className="text-[#A8967E] text-xs">Catatan (opsional)</Label>
              <Input placeholder="Catatan..." value={catatan} onChange={e => setCatatan(e.target.value)}
                className="bg-[#2C1810] border-white/10 text-[#EDE5D8] h-11" />
            </div>
          </div>
        )}
        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={onClose} className="text-[#A8967E]">Batal</Button>
          <Button onClick={handleSubmit} disabled={loading || !bahan}
            className="bg-[#D4722A] hover:bg-[#c0601e] text-white">
            {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Menyimpan...</> : 'Simpan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
