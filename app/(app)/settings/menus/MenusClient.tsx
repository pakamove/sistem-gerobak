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
import { Separator } from '@/components/ui/separator'
import { formatRupiah } from '@/lib/utils/format'
import { toast } from 'sonner'
import { Loader2, Plus, ChevronLeft, Pencil, BookOpen, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react'
import type { Menu, BahanBaku } from '@/lib/types'

const kategoriOptions = ['nasi', 'lauk', 'sayur', 'kriuk', 'minuman', 'paket', 'lainnya']

interface ResepItem {
  bahan_id: string
  qty_per_porsi: string
  satuan: string
  tahap: string
  catatan: string
}

interface MenuWithResep extends Menu {
  resep?: Array<{ id: string; bahan_id: string; qty_per_porsi: number; satuan: string; bahan?: BahanBaku }>
}

const emptyForm = { nama_menu: '', kategori: '', harga_jual: 0, deskripsi: '', urutan: '' }

export default function MenusClient() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editMenu, setEditMenu] = useState<Menu | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(false)
  const [resepMenuId, setResepMenuId] = useState<string | null>(null)
  const [resepItems, setResepItems] = useState<ResepItem[]>([])
  const [savingResep, setSavingResep] = useState(false)

  const { data: menus, isLoading } = useQuery<MenuWithResep[]>({
    queryKey: ['menus-admin'],
    queryFn: async () => {
      const res = await fetch('/api/menus')
      const json = await res.json()
      return json.data?.menus ?? []
    },
  })

  const { data: bahanList } = useQuery<BahanBaku[]>({
    queryKey: ['bahan-list-admin'],
    queryFn: async () => {
      const res = await fetch('/api/inventory/stock')
      const json = await res.json()
      return json.data?.items ?? []
    },
    enabled: !!resepMenuId,
  })

  function openCreate() {
    setEditMenu(null)
    setForm(emptyForm)
    setShowForm(true)
  }

  function openEdit(m: Menu) {
    setEditMenu(m)
    setForm({ nama_menu: m.nama_menu, kategori: m.kategori, harga_jual: m.harga_jual, deskripsi: m.deskripsi ?? '', urutan: String(m.urutan) })
    setShowForm(true)
  }

  function openResep(m: MenuWithResep) {
    setResepMenuId(m.id)
    setResepItems(
      (m.resep ?? []).map((r) => ({
        bahan_id: r.bahan_id,
        qty_per_porsi: String(r.qty_per_porsi),
        satuan: r.satuan,
        tahap: '',
        catatan: '',
      }))
    )
  }

  async function handleSubmit() {
    if (!form.nama_menu.trim() || !form.kategori || !form.harga_jual) {
      toast.error('Nama, kategori, dan harga wajib diisi')
      return
    }
    setLoading(true)
    try {
      const url = editMenu ? `/api/menus/${editMenu.id}` : '/api/menus'
      const method = editMenu ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.message)
      toast.success(editMenu ? 'Menu diperbarui' : 'Menu ditambahkan')
      setShowForm(false)
      queryClient.invalidateQueries({ queryKey: ['menus-admin'] })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menyimpan menu')
    } finally {
      setLoading(false)
    }
  }

  async function handleToggleActive(m: Menu) {
    try {
      const res = await fetch(`/api/menus/${m.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !m.is_active }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.message)
      toast.success(m.is_active ? 'Menu dinonaktifkan' : 'Menu diaktifkan')
      queryClient.invalidateQueries({ queryKey: ['menus-admin'] })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal update menu')
    }
  }

  async function handleSaveResep() {
    if (!resepMenuId) return
    setSavingResep(true)
    try {
      const res = await fetch(`/api/menus/${resepMenuId}/recipe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: resepItems.filter((r) => r.bahan_id && r.qty_per_porsi) }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.message)
      toast.success(`Resep disimpan · HPP: ${formatRupiah(json.data?.hpp_current ?? 0)}`)
      setResepMenuId(null)
      queryClient.invalidateQueries({ queryKey: ['menus-admin'] })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menyimpan resep')
    } finally {
      setSavingResep(false)
    }
  }

  function addResepItem() {
    setResepItems((prev) => [...prev, { bahan_id: '', qty_per_porsi: '', satuan: '', tahap: '', catatan: '' }])
  }

  function updateResepItem(idx: number, key: keyof ResepItem, value: string) {
    setResepItems((prev) => prev.map((item, i) => {
      if (i !== idx) return item
      const updated = { ...item, [key]: value }
      if (key === 'bahan_id') {
        const bahan = bahanList?.find((b) => b.id === value)
        if (bahan) updated.satuan = bahan.satuan
      }
      return updated
    }))
  }

  function removeResepItem(idx: number) {
    setResepItems((prev) => prev.filter((_, i) => i !== idx))
  }

  const resepMenu = menus?.find((m) => m.id === resepMenuId)

  return (
    <div className="min-h-full pb-8">
      <TopHeader
        title="Menu & Resep"
        subtitle={`${menus?.length ?? 0} menu`}
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
        ) : !menus || menus.length === 0 ? (
          <div className="text-center py-12 text-[#5C5040]">Belum ada menu</div>
        ) : (
          menus.map((m) => (
            <div key={m.id} className={`bg-[#231e18] rounded-2xl border p-4 ${m.is_active ? 'border-white/8' : 'border-white/4 opacity-60'}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-[#EDE5D8] truncate">{m.nama_menu}</p>
                    {!m.is_active && <span className="text-[10px] text-red-400 bg-red-900/20 px-1.5 py-0.5 rounded">Nonaktif</span>}
                  </div>
                  <p className="text-xs text-[#A8967E] capitalize">{m.kategori}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <p className="text-sm font-bold text-[#D4722A]">{formatRupiah(m.harga_jual)}</p>
                    {m.hpp_current > 0 && (
                      <p className="text-xs text-[#5C5040]">HPP: {formatRupiah(m.hpp_current)}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => openResep(m)} className="w-8 h-8 bg-[#2C1810] rounded-lg flex items-center justify-center" title="Edit Resep">
                    <BookOpen className="w-3.5 h-3.5 text-[#A8967E]" />
                  </button>
                  <button onClick={() => openEdit(m)} className="w-8 h-8 bg-[#2C1810] rounded-lg flex items-center justify-center">
                    <Pencil className="w-3.5 h-3.5 text-[#A8967E]" />
                  </button>
                  <button onClick={() => handleToggleActive(m)} className={`w-8 h-8 rounded-lg flex items-center justify-center ${m.is_active ? 'bg-green-900/20' : 'bg-red-900/20'}`}>
                    {m.is_active ? <ToggleRight className="w-3.5 h-3.5 text-green-400" /> : <ToggleLeft className="w-3.5 h-3.5 text-red-400" />}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Form Modal */}
      <Dialog open={showForm} onOpenChange={(o) => !o && setShowForm(false)}>
        <DialogContent className="bg-[#231e18] border-white/8 text-[#EDE5D8]">
          <DialogHeader>
            <DialogTitle className="text-[#EDE5D8]">{editMenu ? 'Edit Menu' : 'Tambah Menu'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs text-[#A8967E]">Nama Menu *</Label>
              <Input value={form.nama_menu} onChange={(e) => setForm(p => ({ ...p, nama_menu: e.target.value }))}
                placeholder="Contoh: Nasi Ayam Goreng" className="bg-[#1C1712] border-white/8 text-[#EDE5D8] h-11" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-[#A8967E]">Kategori *</Label>
              <Select value={form.kategori} onValueChange={(v) => setForm(p => ({ ...p, kategori: v ?? '' }))}>
                <SelectTrigger className="bg-[#1C1712] border-white/8 text-[#EDE5D8] h-11">
                  <SelectValue placeholder="Pilih kategori...">{form.kategori || undefined}</SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-[#231e18] border-white/8">
                  {kategoriOptions.map((k) => (
                    <SelectItem key={k} value={k} className="text-[#EDE5D8] capitalize focus:bg-[#2C1810]">{k}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-[#A8967E]">Harga Jual *</Label>
              <MoneyInput value={form.harga_jual} onChange={(v) => setForm(p => ({ ...p, harga_jual: v }))} placeholder="Harga jual" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-[#A8967E]">Urutan Tampil</Label>
              <Input type="number" value={form.urutan} onChange={(e) => setForm(p => ({ ...p, urutan: e.target.value }))}
                placeholder="1, 2, 3..." className="bg-[#1C1712] border-white/8 text-[#EDE5D8] h-11" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-[#A8967E]">Deskripsi</Label>
              <Input value={form.deskripsi} onChange={(e) => setForm(p => ({ ...p, deskripsi: e.target.value }))}
                placeholder="Deskripsi singkat..." className="bg-[#1C1712] border-white/8 text-[#EDE5D8] h-11" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setShowForm(false)} className="flex-1 text-[#A8967E] border border-white/8">Batal</Button>
            <Button onClick={handleSubmit} disabled={loading} className="flex-1 bg-[#D4722A] text-white">
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editMenu ? 'Simpan' : 'Tambah'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resep Modal */}
      <Dialog open={!!resepMenuId} onOpenChange={(o) => !o && setResepMenuId(null)}>
        <DialogContent className="bg-[#231e18] border-white/8 text-[#EDE5D8] max-h-[92vh] flex flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-[#EDE5D8]">Resep: {resepMenu?.nama_menu}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-3 py-1">
            {resepItems.map((item, idx) => (
              <div key={idx} className="bg-[#1C1712] rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-[#A8967E] font-medium">Bahan #{idx + 1}</p>
                  <button onClick={() => removeResepItem(idx)} className="w-6 h-6 text-red-400 flex items-center justify-center">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <Select value={item.bahan_id} onValueChange={(v) => updateResepItem(idx, 'bahan_id', v ?? '')}>
                  <SelectTrigger className="bg-[#231e18] border-white/8 text-[#EDE5D8] h-10">
                    <SelectValue placeholder="Pilih bahan...">{item.bahan_id ? (bahanList?.find(b => b.id === item.bahan_id)?.nama_bahan ?? item.bahan_id) : null}</SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-[#231e18] border-white/8">
                    {(bahanList ?? []).map((b) => (
                      <SelectItem key={b.id} value={b.id} className="text-[#EDE5D8] focus:bg-[#2C1810]">{b.nama_bahan} ({b.satuan})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-[10px] text-[#A8967E] mb-1">Qty per Porsi</p>
                    <Input type="number" value={item.qty_per_porsi} onChange={(e) => updateResepItem(idx, 'qty_per_porsi', e.target.value)}
                      placeholder="0" className="bg-[#231e18] border-white/8 text-[#EDE5D8] h-9 text-sm" />
                  </div>
                  <div>
                    <p className="text-[10px] text-[#A8967E] mb-1">Satuan</p>
                    <Input value={item.satuan} onChange={(e) => updateResepItem(idx, 'satuan', e.target.value)}
                      placeholder="gram" className="bg-[#231e18] border-white/8 text-[#EDE5D8] h-9 text-sm" />
                  </div>
                </div>
              </div>
            ))}
            <button onClick={addResepItem}
              className="w-full border border-dashed border-white/20 rounded-xl py-3 text-xs text-[#A8967E] flex items-center justify-center gap-2 active:bg-white/5">
              <Plus className="w-4 h-4" /> Tambah Bahan
            </button>
          </div>
          <DialogFooter className="border-t border-white/8 pt-3">
            <Button variant="ghost" onClick={() => setResepMenuId(null)} className="flex-1 text-[#A8967E] border border-white/8">Batal</Button>
            <Button onClick={handleSaveResep} disabled={savingResep} className="flex-1 bg-[#D4722A] text-white">
              {savingResep && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Simpan Resep
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
