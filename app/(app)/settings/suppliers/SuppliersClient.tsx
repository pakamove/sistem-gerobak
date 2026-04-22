'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import TopHeader from '@/components/layout/TopHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Loader2, Plus, ChevronLeft, Phone, Mail, Pencil } from 'lucide-react'
import type { Supplier } from '@/lib/types'

const kategoriOptions = [
  'Protein', 'Sayuran', 'Bumbu', 'Packaging', 'Utility',
  'Asset', 'Maintenance', 'Umum',
]

const emptyForm = {
  nama_supplier: '', alamat: '', email: '', no_hp: '', pic: '',
  kategori_supply: '', metode_bayar: '', lead_time_hari: '',
  min_order: '', termin_pembayaran: '', catatan: '',
}

export default function SuppliersClient() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editSupplier, setEditSupplier] = useState<Supplier | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(false)

  const { data: suppliers, isLoading } = useQuery<Supplier[]>({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const res = await fetch('/api/suppliers')
      const json = await res.json()
      return json.data?.suppliers ?? []
    },
  })

  function setField(key: keyof typeof emptyForm, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function openCreate() {
    setEditSupplier(null)
    setForm(emptyForm)
    setShowForm(true)
  }

  function openEdit(s: Supplier) {
    setEditSupplier(s)
    setForm({
      nama_supplier: s.nama_supplier,
      alamat: s.alamat ?? '',
      email: s.email ?? '',
      no_hp: s.kontak ?? '',
      pic: s.pic ?? '',
      kategori_supply: s.kategori_supply ?? '',
      metode_bayar: s.metode_bayar ?? '',
      lead_time_hari: s.lead_time_hari != null ? String(s.lead_time_hari) : '',
      min_order: s.min_order ?? '',
      termin_pembayaran: s.termin_pembayaran ?? '',
      catatan: '',
    })
    setShowForm(true)
  }

  async function handleSubmit() {
    if (!form.nama_supplier.trim()) { toast.error('Nama supplier wajib diisi'); return }
    setLoading(true)
    try {
      const url = editSupplier ? `/api/suppliers/${editSupplier.id}` : '/api/suppliers'
      const method = editSupplier ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.message)
      toast.success(editSupplier ? 'Supplier diperbarui' : 'Supplier ditambahkan')
      setShowForm(false)
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menyimpan supplier')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-full pb-8">
      <TopHeader
        title="Kelola Supplier"
        subtitle={`${suppliers?.length ?? 0} supplier`}
        leftAction={<button onClick={() => router.back()} className="text-[#A8967E] p-1"><ChevronLeft className="w-5 h-5" /></button>}
        rightAction={
          <button onClick={openCreate} className="w-8 h-8 bg-[#D4722A] rounded-xl flex items-center justify-center">
            <Plus className="w-4 h-4 text-white" />
          </button>
        }
      />

      <div className="px-4 pt-4 space-y-3">
        {isLoading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-white/5 rounded-2xl animate-pulse" />)}</div>
        ) : !suppliers || suppliers.length === 0 ? (
          <div className="text-center py-12 text-[#5C5040]">Belum ada supplier</div>
        ) : (
          suppliers.map((s) => (
            <div key={s.id} className="bg-[#231e18] rounded-2xl border border-white/8 p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#EDE5D8]">{s.nama_supplier}</p>
                  {s.kategori_supply && <p className="text-xs text-[#D4722A] mt-0.5">{s.kategori_supply}</p>}
                  <div className="flex flex-wrap gap-3 mt-2">
                    {s.kontak && (
                      <div className="flex items-center gap-1 text-xs text-[#A8967E]">
                        <Phone className="w-3 h-3" />{s.kontak}
                      </div>
                    )}
                    {s.email && (
                      <div className="flex items-center gap-1 text-xs text-[#A8967E]">
                        <Mail className="w-3 h-3" />{s.email}
                      </div>
                    )}
                  </div>
                  {s.metode_bayar && (
                    <p className="text-xs text-[#5C5040] mt-1">Bayar: {s.metode_bayar}</p>
                  )}
                </div>
                <button onClick={() => openEdit(s)} className="w-8 h-8 bg-[#2C1810] rounded-lg flex items-center justify-center flex-shrink-0">
                  <Pencil className="w-3.5 h-3.5 text-[#A8967E]" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={showForm} onOpenChange={(o) => !o && setShowForm(false)}>
        <DialogContent className="bg-[#231e18] border-white/8 text-[#EDE5D8] max-h-[90vh] flex flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-[#EDE5D8]">{editSupplier ? 'Edit Supplier' : 'Tambah Supplier'}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-3 py-1">
            {[
              { label: 'Nama Supplier *', key: 'nama_supplier', placeholder: 'PT. Contoh Supplier' },
              { label: 'PIC / Kontak Person', key: 'pic', placeholder: 'Nama PIC' },
              { label: 'No. HP / WhatsApp', key: 'no_hp', placeholder: '08xx-xxxx-xxxx' },
              { label: 'Email', key: 'email', placeholder: 'email@supplier.com', type: 'email' },
              { label: 'Alamat', key: 'alamat', placeholder: 'Alamat lengkap' },
              { label: 'Lead Time (hari)', key: 'lead_time_hari', placeholder: '3', type: 'number' },
              { label: 'Min. Order', key: 'min_order', placeholder: 'Contoh: Min 5kg' },
              { label: 'Termin Pembayaran', key: 'termin_pembayaran', placeholder: 'Contoh: Net 30' },
            ].map((f) => (
              <div key={f.key} className="space-y-1">
                <Label className="text-xs text-[#A8967E]">{f.label}</Label>
                <Input type={f.type || 'text'} placeholder={f.placeholder}
                  value={form[f.key as keyof typeof emptyForm]}
                  onChange={(e) => setField(f.key as keyof typeof emptyForm, e.target.value)}
                  className="bg-[#1C1712] border-white/8 text-[#EDE5D8] h-11" />
              </div>
            ))}
            <div className="space-y-1">
              <Label className="text-xs text-[#A8967E]">Kategori Supplier</Label>
              <Select value={form.kategori_supply} onValueChange={(v) => setField('kategori_supply', v ?? '')}>
                <SelectTrigger className="bg-[#1C1712] border-white/8 text-[#EDE5D8] h-11">
                  <SelectValue placeholder="Pilih kategori...">{form.kategori_supply || undefined}</SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-[#231e18] border-white/8">
                  {kategoriOptions.map((k) => (
                    <SelectItem key={k} value={k} className="text-[#EDE5D8] focus:bg-[#2C1810]">{k}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-[#A8967E]">Metode Bayar</Label>
              <Select value={form.metode_bayar} onValueChange={(v) => setField('metode_bayar', v ?? '')}>
                <SelectTrigger className="bg-[#1C1712] border-white/8 text-[#EDE5D8] h-11">
                  <SelectValue placeholder="Pilih metode...">{form.metode_bayar || undefined}</SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-[#231e18] border-white/8">
                  {['Tunai', 'Transfer Bank', 'COD', 'Kredit', 'Lainnya'].map((m) => (
                    <SelectItem key={m} value={m} className="text-[#EDE5D8] focus:bg-[#2C1810]">{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="border-t border-white/8 pt-3">
            <Button variant="ghost" onClick={() => setShowForm(false)} className="flex-1 text-[#A8967E] border border-white/8">Batal</Button>
            <Button onClick={handleSubmit} disabled={loading} className="flex-1 bg-[#D4722A] text-white">
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editSupplier ? 'Simpan' : 'Tambah'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
