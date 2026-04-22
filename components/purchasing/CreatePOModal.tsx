'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getTodayDate } from '@/lib/utils/format'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function CreatePOModal({ open, onClose, onSuccess }: Props) {
  const [bahanId, setBahanId] = useState('')
  const [qtyOrder, setQtyOrder] = useState('')
  const [satuan, setSatuan] = useState('')
  const [hargaEstimasi, setHargaEstimasi] = useState('')
  const [tanggalButuh, setTanggalButuh] = useState('')
  const [catatan, setCatatan] = useState('')
  const [loading, setLoading] = useState(false)

  const { data: bahanList } = useQuery({
    queryKey: ['bahan-list'],
    queryFn: async () => {
      const res = await fetch('/api/inventory/stock')
      const json = await res.json()
      return json.data?.items || []
    },
    enabled: open,
  })

  const handleBahanChange = (id: string | null) => {
    if (!id) return
    setBahanId(id)
    const bahan = bahanList?.find((b: { id: string; satuan: string }) => b.id === id)
    if (bahan) setSatuan(bahan.satuan)
  }

  const handleSubmit = async () => {
    if (!bahanId) { toast.error('Pilih bahan terlebih dahulu'); return }
    if (!qtyOrder || parseFloat(qtyOrder) <= 0) { toast.error('Qty order harus > 0'); return }
    if (!tanggalButuh) { toast.error('Tanggal butuh wajib diisi'); return }
    if (!satuan) { toast.error('Satuan wajib diisi'); return }

    setLoading(true)
    try {
      const res = await fetch('/api/purchasing/po', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bahan_id: bahanId,
          qty_order: parseFloat(qtyOrder),
          satuan,
          harga_estimasi: hargaEstimasi ? parseInt(hargaEstimasi) : null,
          tanggal_butuh: tanggalButuh,
          tanggal_po: getTodayDate(),
          catatan,
        }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.message)
      toast.success('Purchase Order berhasil dibuat')
      onSuccess()
      onClose()
      setBahanId(''); setQtyOrder(''); setHargaEstimasi(''); setTanggalButuh(''); setCatatan('')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal membuat PO')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="bg-[#231e18] border-white/10 text-[#EDE5D8] max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-[#EDE5D8]">Buat Purchase Order</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-[#A8967E] text-xs">Bahan Baku *</Label>
            <Select value={bahanId} onValueChange={handleBahanChange}>
              <SelectTrigger className="bg-[#2C1810] border-white/10 text-[#EDE5D8] h-11">
                <SelectValue placeholder="Pilih bahan...">
                  {bahanId
                    ? (() => { const b = (bahanList || []).find((x: { id: string; nama_bahan: string; satuan: string }) => x.id === bahanId); return b ? `${b.nama_bahan} (${b.satuan})` : bahanId })()
                    : null}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-[#231e18] border-white/10">
                {(bahanList || []).map((b: { id: string; nama_bahan: string; satuan: string }) => (
                  <SelectItem key={b.id} value={b.id} className="text-[#EDE5D8] focus:bg-[#2C1810]">
                    {b.nama_bahan} ({b.satuan})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-[#A8967E] text-xs">Qty Order *</Label>
              <Input type="number" min="0" value={qtyOrder} onChange={e => setQtyOrder(e.target.value)}
                placeholder="0" className="bg-[#2C1810] border-white/10 text-[#EDE5D8] h-11" />
            </div>
            <div className="space-y-1">
              <Label className="text-[#A8967E] text-xs">Satuan *</Label>
              <Input value={satuan} onChange={e => setSatuan(e.target.value)} placeholder="gram, kg..."
                className="bg-[#2C1810] border-white/10 text-[#EDE5D8] h-11" />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-[#A8967E] text-xs">Harga Estimasi / satuan (opsional)</Label>
            <Input type="number" min="0" value={hargaEstimasi} onChange={e => setHargaEstimasi(e.target.value)}
              placeholder="0" className="bg-[#2C1810] border-white/10 text-[#EDE5D8] h-11" />
          </div>
          <div className="space-y-1">
            <Label className="text-[#A8967E] text-xs">Tanggal Dibutuhkan *</Label>
            <Input type="date" value={tanggalButuh} onChange={e => setTanggalButuh(e.target.value)}
              className="bg-[#2C1810] border-white/10 text-[#EDE5D8] h-11" />
          </div>
          <div className="space-y-1">
            <Label className="text-[#A8967E] text-xs">Catatan (opsional)</Label>
            <Input value={catatan} onChange={e => setCatatan(e.target.value)} placeholder="Catatan..."
              className="bg-[#2C1810] border-white/10 text-[#EDE5D8] h-11" />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={onClose} className="text-[#A8967E]">Batal</Button>
          <Button onClick={handleSubmit} disabled={loading} className="bg-[#D4722A] hover:bg-[#c0601e] text-white">
            {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Membuat...</> : 'Buat PO'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
