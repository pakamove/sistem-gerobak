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
import { formatRupiah, getTodayDate } from '@/lib/utils/format'
import { toast } from 'sonner'
import { Loader2, Plus, ChevronLeft, Pencil, Wrench } from 'lucide-react'

const kategoriOptions = ['Peralatan Dapur', 'Kendaraan', 'Elektronik', 'Furnitur', 'Bangunan', 'Mesin', 'IT / Komputer', 'Lainnya']

interface Asset {
  id: string
  nama_aset: string
  kategori: string | null
  merk_model: string | null
  kode_aset: string | null
  tanggal_beli: string | null
  harga_beli: number
  nilai_buku: number
  lokasi: string | null
  penanggung_jawab: string | null
  umur_manfaat_tahun: number
  metode_penyusutan: string
  nilai_residu: number
  penyusutan_per_tahun: number
  status: string
  catatan: string | null
}

const emptyForm = {
  nama_aset: '', kategori: '', merk_model: '', kode_aset: '',
  tanggal_beli: getTodayDate(), harga_beli: 0,
  lokasi: '', penanggung_jawab: '',
  umur_manfaat_tahun: '5', metode_penyusutan: 'Garis Lurus',
  nilai_residu: 0, catatan: '',
}

export default function AssetsClient() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editAsset, setEditAsset] = useState<Asset | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(false)

  const { data: assets, isLoading } = useQuery<Asset[]>({
    queryKey: ['assets'],
    queryFn: async () => {
      const res = await fetch('/api/assets')
      const json = await res.json()
      return json.data?.assets ?? []
    },
  })

  const totalNilaiBuku = (assets ?? []).reduce((sum, a) => sum + (a.nilai_buku ?? 0), 0)
  const penyusutanTahunan = (assets ?? []).reduce((sum, a) => sum + (a.penyusutan_per_tahun ?? 0), 0)

  function openCreate() {
    setEditAsset(null)
    setForm(emptyForm)
    setShowForm(true)
  }

  function openEdit(a: Asset) {
    setEditAsset(a)
    setForm({
      nama_aset: a.nama_aset,
      kategori: a.kategori ?? '',
      merk_model: a.merk_model ?? '',
      kode_aset: a.kode_aset ?? '',
      tanggal_beli: a.tanggal_beli ?? getTodayDate(),
      harga_beli: a.harga_beli,
      lokasi: a.lokasi ?? '',
      penanggung_jawab: a.penanggung_jawab ?? '',
      umur_manfaat_tahun: String(a.umur_manfaat_tahun),
      metode_penyusutan: a.metode_penyusutan,
      nilai_residu: a.nilai_residu,
      catatan: a.catatan ?? '',
    })
    setShowForm(true)
  }

  async function handleSubmit() {
    if (!form.nama_aset.trim() || !form.harga_beli) {
      toast.error('Nama aset dan harga beli wajib diisi')
      return
    }
    setLoading(true)
    try {
      const url = editAsset ? `/api/assets/${editAsset.id}` : '/api/assets'
      const method = editAsset ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.message)
      toast.success(editAsset ? 'Aset diperbarui' : 'Aset ditambahkan')
      setShowForm(false)
      queryClient.invalidateQueries({ queryKey: ['assets'] })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menyimpan aset')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-full pb-8">
      <TopHeader
        title="Kelola Aset"
        subtitle={`${assets?.length ?? 0} aset terdaftar`}
        leftAction={<button onClick={() => router.back()} className="text-[#A8967E] p-1"><ChevronLeft className="w-5 h-5" /></button>}
        rightAction={
          <button onClick={openCreate} className="w-8 h-8 bg-[#D4722A] rounded-xl flex items-center justify-center">
            <Plus className="w-4 h-4 text-white" />
          </button>
        }
      />

      {/* Summary */}
      {(assets?.length ?? 0) > 0 && (
        <div className="mx-4 mt-4 bg-[#231e18] rounded-2xl border border-white/8 p-4 grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-[#A8967E]">Total Nilai Buku</p>
            <p className="text-sm font-bold text-[#EDE5D8]">{formatRupiah(totalNilaiBuku)}</p>
          </div>
          <div>
            <p className="text-xs text-[#A8967E]">Penyusutan/Tahun</p>
            <p className="text-sm font-bold text-[#D4722A]">{formatRupiah(penyusutanTahunan)}</p>
          </div>
        </div>
      )}

      <div className="px-4 pt-3 space-y-3">
        {isLoading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 bg-white/5 rounded-2xl animate-pulse" />)}</div>
        ) : (assets?.length ?? 0) === 0 ? (
          <div className="text-center py-12">
            <Wrench className="w-10 h-10 text-[#5C5040] mx-auto mb-3" />
            <p className="text-sm text-[#5C5040]">Belum ada aset terdaftar</p>
          </div>
        ) : (
          assets!.map((a) => (
            <div key={a.id} className="bg-[#231e18] rounded-2xl border border-white/8 p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#EDE5D8] truncate">{a.nama_aset}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {a.kategori && <p className="text-xs text-[#D4722A]">{a.kategori}</p>}
                    {a.kode_aset && <p className="text-xs text-[#5C5040]">#{a.kode_aset}</p>}
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
                    <div>
                      <p className="text-[10px] text-[#5C5040]">Harga Beli</p>
                      <p className="text-xs font-semibold text-[#EDE5D8]">{formatRupiah(a.harga_beli)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[#5C5040]">Nilai Buku</p>
                      <p className="text-xs font-semibold text-[#EDE5D8]">{formatRupiah(a.nilai_buku)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[#5C5040]">Penyusutan/Tahun</p>
                      <p className="text-xs text-amber-400">{formatRupiah(a.penyusutan_per_tahun)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[#5C5040]">Umur Manfaat</p>
                      <p className="text-xs text-[#A8967E]">{a.umur_manfaat_tahun} tahun</p>
                    </div>
                  </div>
                  {a.lokasi && <p className="text-xs text-[#5C5040] mt-1">📍 {a.lokasi}</p>}
                </div>
                <button onClick={() => openEdit(a)} className="w-8 h-8 bg-[#2C1810] rounded-lg flex items-center justify-center flex-shrink-0">
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
            <DialogTitle className="text-[#EDE5D8]">{editAsset ? 'Edit Aset' : 'Tambah Aset'}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-3 py-1">
            {[
              { label: 'Nama Aset *', key: 'nama_aset', placeholder: 'Contoh: Kompor Gas 2 Tungku' },
              { label: 'Kode Aset', key: 'kode_aset', placeholder: 'Contoh: DAPUR-001' },
              { label: 'Merk / Model', key: 'merk_model', placeholder: 'Contoh: Rinnai RI-522E' },
              { label: 'Lokasi', key: 'lokasi', placeholder: 'Contoh: Central Kitchen' },
              { label: 'Penanggung Jawab', key: 'penanggung_jawab', placeholder: 'Nama PJ' },
            ].map((f) => (
              <div key={f.key} className="space-y-1">
                <Label className="text-xs text-[#A8967E]">{f.label}</Label>
                <Input value={form[f.key as keyof typeof emptyForm] as string}
                  onChange={(e) => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  placeholder={f.placeholder} className="bg-[#1C1712] border-white/8 text-[#EDE5D8] h-11" />
              </div>
            ))}
            <div className="space-y-1">
              <Label className="text-xs text-[#A8967E]">Kategori</Label>
              <Select value={form.kategori} onValueChange={(v) => setForm(p => ({ ...p, kategori: v ?? '' }))}>
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
              <Label className="text-xs text-[#A8967E]">Tanggal Beli</Label>
              <Input type="date" value={form.tanggal_beli}
                onChange={(e) => setForm(p => ({ ...p, tanggal_beli: e.target.value }))}
                className="bg-[#1C1712] border-white/8 text-[#EDE5D8] h-11 [color-scheme:dark]" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-[#A8967E]">Harga Beli *</Label>
              <MoneyInput value={form.harga_beli} onChange={(v) => setForm(p => ({ ...p, harga_beli: v }))} placeholder="Harga pembelian" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-[#A8967E]">Nilai Residu</Label>
              <MoneyInput value={form.nilai_residu} onChange={(v) => setForm(p => ({ ...p, nilai_residu: v }))} placeholder="Nilai akhir aset" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-[#A8967E]">Umur Manfaat (tahun)</Label>
              <Input type="number" value={form.umur_manfaat_tahun}
                onChange={(e) => setForm(p => ({ ...p, umur_manfaat_tahun: e.target.value }))}
                placeholder="5" className="bg-[#1C1712] border-white/8 text-[#EDE5D8] h-11" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-[#A8967E]">Catatan</Label>
              <Input value={form.catatan} onChange={(e) => setForm(p => ({ ...p, catatan: e.target.value }))}
                placeholder="Catatan tambahan..." className="bg-[#1C1712] border-white/8 text-[#EDE5D8] h-11" />
            </div>
          </div>
          <DialogFooter className="border-t border-white/8 pt-3">
            <Button variant="ghost" onClick={() => setShowForm(false)} className="flex-1 text-[#A8967E] border border-white/8">Batal</Button>
            <Button onClick={handleSubmit} disabled={loading} className="flex-1 bg-[#D4722A] text-white">
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editAsset ? 'Simpan' : 'Tambah'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
