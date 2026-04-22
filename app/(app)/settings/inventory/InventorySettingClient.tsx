'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import TopHeader from '@/components/layout/TopHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import MoneyInput from '@/components/shared/MoneyInput'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Loader2, Plus, ChevronLeft, Pencil, Search, Package } from 'lucide-react'
import type { BahanBaku } from '@/lib/types'

const kategoriOptions = [
  'Protein', 'Sayuran', 'Bumbu & Rempah', 'Minyak & Lemak',
  'Karbohidrat', 'Packaging', 'Kebersihan', 'Utility',
  'Alat Habis Pakai', 'Lainnya',
]

const satuanOptions = ['gram', 'kilogram', 'liter', 'mililiter', 'pcs', 'pack', 'botol', 'ikat', 'dus', 'tray', 'karung']

const caraSimpanOptions = ['Suhu ruang', 'Kulkas', 'Freezer', 'Rak kering', 'Wadah tertutup', 'Di botol', 'Di plastik']

const emptyForm = {
  nama_bahan: '', kategori: '', satuan: '', stok_minimum: '',
  harga_terakhir: 0, lokasi_simpan: '', masa_simpan_hari: '', cara_simpan: '',
}

interface Props { role: string }

export default function InventorySettingClient({ role }: Props) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editBahan, setEditBahan] = useState<BahanBaku | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)

  const canEdit = ['owner', 'manager'].includes(role)

  const { data: bahanList, isLoading } = useQuery<BahanBaku[]>({
    queryKey: ['bahan-setting'],
    queryFn: async () => {
      const res = await fetch('/api/inventory/bahan')
      const json = await res.json()
      return json.data?.bahan ?? []
    },
  })

  const filtered = (bahanList ?? []).filter((b) =>
    b.nama_bahan.toLowerCase().includes(search.toLowerCase())
  )

  function setField(key: keyof typeof emptyForm, value: string | number) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function openCreate() {
    setEditBahan(null)
    setForm(emptyForm)
    setShowForm(true)
  }

  function openEdit(b: BahanBaku) {
    setEditBahan(b)
    setForm({
      nama_bahan: b.nama_bahan,
      kategori: b.kategori ?? '',
      satuan: b.satuan,
      stok_minimum: String(b.stok_minimum),
      harga_terakhir: b.harga_terakhir,
      lokasi_simpan: b.lokasi_simpan ?? '',
      masa_simpan_hari: b.masa_simpan_hari != null ? String(b.masa_simpan_hari) : '',
      cara_simpan: b.cara_simpan ?? '',
    })
    setShowForm(true)
  }

  async function handleSubmit() {
    if (!form.nama_bahan.trim() || !form.satuan) {
      toast.error('Nama bahan dan satuan wajib diisi')
      return
    }
    setLoading(true)
    try {
      const url = editBahan ? `/api/inventory/bahan/${editBahan.id}` : '/api/inventory/bahan'
      const method = editBahan ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.message)
      toast.success(editBahan ? 'Bahan diperbarui' : 'Bahan ditambahkan')
      setShowForm(false)
      queryClient.invalidateQueries({ queryKey: ['bahan-setting'] })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menyimpan bahan')
    } finally {
      setLoading(false)
    }
  }

  async function handleToggleActive(b: BahanBaku) {
    try {
      const res = await fetch(`/api/inventory/bahan/${b.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !b.is_active }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.message)
      toast.success(b.is_active ? 'Bahan dinonaktifkan' : 'Bahan diaktifkan')
      queryClient.invalidateQueries({ queryKey: ['bahan-setting'] })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal update bahan')
    }
  }

  return (
    <div className="min-h-full pb-8">
      <TopHeader
        title="Kelola Bahan Baku"
        subtitle={`${bahanList?.length ?? 0} bahan terdaftar`}
        leftAction={<button onClick={() => router.back()} className="text-[#A8967E] p-1"><ChevronLeft className="w-5 h-5" /></button>}
        rightAction={
          canEdit ? (
            <button onClick={openCreate} className="w-8 h-8 bg-[#D4722A] rounded-xl flex items-center justify-center">
              <Plus className="w-4 h-4 text-white" />
            </button>
          ) : undefined
        }
      />

      {/* Search */}
      <div className="px-4 pt-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5C5040]" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari bahan baku..."
            className="pl-9 bg-[#231e18] border-white/8 text-[#EDE5D8] h-11"
          />
        </div>
      </div>

      <div className="px-4 pt-3 space-y-2">
        {isLoading ? (
          <div className="space-y-2">{[1,2,3,4].map(i => <div key={i} className="h-16 bg-white/5 rounded-2xl animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-10 h-10 text-[#5C5040] mx-auto mb-3" />
            <p className="text-sm text-[#5C5040]">Tidak ada bahan baku</p>
          </div>
        ) : (
          filtered.map((b) => (
            <div key={b.id} className={`bg-[#231e18] rounded-2xl border p-4 flex items-center gap-3 ${b.is_active ? 'border-white/8' : 'border-white/4 opacity-60'}`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-[#EDE5D8] truncate">{b.nama_bahan}</p>
                  {!b.is_active && <span className="text-[10px] text-red-400 shrink-0">Nonaktif</span>}
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  <p className="text-xs text-[#A8967E]">{b.satuan}</p>
                  {b.kategori && <p className="text-xs text-[#5C5040]">{b.kategori}</p>}
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <p className="text-xs text-[#EDE5D8]">Stok: <span className="font-semibold">{Number(b.stok_sekarang).toLocaleString('id-ID')} {b.satuan}</span></p>
                  <p className="text-xs text-[#5C5040]">Min: {b.stok_minimum} {b.satuan}</p>
                </div>
              </div>
              {canEdit && (
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button onClick={() => openEdit(b)} className="w-8 h-8 bg-[#2C1810] rounded-lg flex items-center justify-center">
                    <Pencil className="w-3.5 h-3.5 text-[#A8967E]" />
                  </button>
                  <button
                    onClick={() => handleToggleActive(b)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${b.is_active ? 'bg-red-900/20 text-red-400' : 'bg-green-900/20 text-green-400'}`}
                  >
                    {b.is_active ? '✕' : '✓'}
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Form Modal */}
      <Dialog open={showForm} onOpenChange={(o) => !o && setShowForm(false)}>
        <DialogContent className="bg-[#231e18] border-white/8 text-[#EDE5D8] max-h-[90vh] flex flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-[#EDE5D8]">{editBahan ? 'Edit Bahan Baku' : 'Tambah Bahan Baku'}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-3 py-1">
            <div className="space-y-1">
              <Label className="text-xs text-[#A8967E]">Nama Bahan *</Label>
              <Input value={form.nama_bahan} onChange={(e) => setField('nama_bahan', e.target.value)}
                placeholder="Contoh: Ayam Fillet" className="bg-[#1C1712] border-white/8 text-[#EDE5D8] h-11" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-[#A8967E]">Satuan *</Label>
                <Select value={form.satuan} onValueChange={(v) => setField('satuan', v ?? '')}>
                  <SelectTrigger className="bg-[#1C1712] border-white/8 text-[#EDE5D8] h-11">
                    <SelectValue placeholder="Pilih...">{form.satuan || undefined}</SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-[#231e18] border-white/8">
                    {satuanOptions.map((s) => (
                      <SelectItem key={s} value={s} className="text-[#EDE5D8] focus:bg-[#2C1810]">{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-[#A8967E]">Stok Minimum</Label>
                <Input type="number" value={form.stok_minimum} onChange={(e) => setField('stok_minimum', e.target.value)}
                  placeholder="0" className="bg-[#1C1712] border-white/8 text-[#EDE5D8] h-11" />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-[#A8967E]">Kategori</Label>
              <Select value={form.kategori} onValueChange={(v) => setField('kategori', v ?? '')}>
                <SelectTrigger className="bg-[#1C1712] border-white/8 text-[#EDE5D8] h-11">
                  <SelectValue placeholder="Pilih kategori...">{form.kategori || undefined}</SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-[#231e18] border-white/8">
                  {kategoriOptions.map((k) => (
                    <SelectItem key={k} value={k} className="text-[#EDE5D8] focus:bg-[#2C1810]">{k}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-[#A8967E]">Harga Terakhir (Rp)</Label>
              <MoneyInput value={form.harga_terakhir} onChange={(v) => setField('harga_terakhir', v)} placeholder="Harga per satuan" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-[#A8967E]">Masa Simpan (hari)</Label>
                <Input type="number" value={form.masa_simpan_hari} onChange={(e) => setField('masa_simpan_hari', e.target.value)}
                  placeholder="Contoh: 7" className="bg-[#1C1712] border-white/8 text-[#EDE5D8] h-11" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-[#A8967E]">Lokasi Simpan</Label>
                <Input value={form.lokasi_simpan} onChange={(e) => setField('lokasi_simpan', e.target.value)}
                  placeholder="Rak A" className="bg-[#1C1712] border-white/8 text-[#EDE5D8] h-11" />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-[#A8967E]">Cara Simpan</Label>
              <Select value={form.cara_simpan} onValueChange={(v) => setField('cara_simpan', v ?? '')}>
                <SelectTrigger className="bg-[#1C1712] border-white/8 text-[#EDE5D8] h-11">
                  <SelectValue placeholder="Pilih cara simpan...">{form.cara_simpan || undefined}</SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-[#231e18] border-white/8">
                  {caraSimpanOptions.map((c) => (
                    <SelectItem key={c} value={c} className="text-[#EDE5D8] focus:bg-[#2C1810]">{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="border-t border-white/8 pt-3">
            <Button variant="ghost" onClick={() => setShowForm(false)} className="flex-1 text-[#A8967E] border border-white/8">Batal</Button>
            <Button onClick={handleSubmit} disabled={loading} className="flex-1 bg-[#D4722A] text-white">
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editBahan ? 'Simpan' : 'Tambah'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
