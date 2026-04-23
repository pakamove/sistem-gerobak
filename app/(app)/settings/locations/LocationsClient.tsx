'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import TopHeader from '@/components/layout/TopHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Loader2, Plus, MapPin, ChevronLeft, Pencil, ToggleLeft, ToggleRight, Crosshair } from 'lucide-react'
import type { AppLocation } from '@/lib/types'

const emptyForm = { id: '', nama: '', deskripsi: '' }
const emptyGpsForm = { nama: '', deskripsi: '', latitude: '', longitude: '', radius_meter: '100' }

export default function LocationsClient() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [editLoc, setEditLoc] = useState<AppLocation | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [editForm, setEditForm] = useState(emptyGpsForm)
  const [loading, setLoading] = useState(false)
  const [gpsLoading, setGpsLoading] = useState(false)

  const { data: locations, isLoading } = useQuery<AppLocation[]>({
    queryKey: ['locations'],
    queryFn: async () => {
      const res = await fetch('/api/locations')
      const json = await res.json()
      return json.data?.locations ?? []
    },
  })

  async function handleCreate() {
    if (!form.id.trim() || !form.nama.trim()) {
      toast.error('ID dan nama lokasi wajib diisi')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.message)
      toast.success('Lokasi berhasil ditambahkan')
      setShowCreate(false)
      setForm(emptyForm)
      queryClient.invalidateQueries({ queryKey: ['locations'] })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menambah lokasi')
    } finally {
      setLoading(false)
    }
  }

  function openEdit(loc: AppLocation) {
    setEditLoc(loc)
    setEditForm({
      nama: loc.nama,
      deskripsi: loc.deskripsi ?? '',
      latitude: loc.latitude != null ? String(loc.latitude) : '',
      longitude: loc.longitude != null ? String(loc.longitude) : '',
      radius_meter: loc.radius_meter != null ? String(loc.radius_meter) : '100',
    })
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      toast.error('Browser tidak mendukung geolocation')
      return
    }
    setGpsLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setEditForm(p => ({
          ...p,
          latitude: pos.coords.latitude.toFixed(6),
          longitude: pos.coords.longitude.toFixed(6),
        }))
        setGpsLoading(false)
        toast.success('Koordinat berhasil diambil')
      },
      () => {
        setGpsLoading(false)
        toast.error('Gagal mendapat lokasi — pastikan izin lokasi diberikan')
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  async function handleEdit() {
    if (!editLoc) return
    setLoading(true)
    try {
      const payload: Record<string, unknown> = {
        id: editLoc.id,
        nama: editForm.nama,
        deskripsi: editForm.deskripsi,
      }
      if (editForm.latitude) payload.latitude = parseFloat(editForm.latitude)
      if (editForm.longitude) payload.longitude = parseFloat(editForm.longitude)
      if (editForm.radius_meter) payload.radius_meter = parseInt(editForm.radius_meter)

      const res = await fetch('/api/locations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.message)
      toast.success('Lokasi diperbarui')
      setEditLoc(null)
      queryClient.invalidateQueries({ queryKey: ['locations'] })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal update lokasi')
    } finally {
      setLoading(false)
    }
  }

  async function handleToggleActive(loc: AppLocation) {
    try {
      const res = await fetch('/api/locations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: loc.id, is_active: !loc.is_active }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.message)
      toast.success(loc.is_active ? 'Lokasi dinonaktifkan' : 'Lokasi diaktifkan')
      queryClient.invalidateQueries({ queryKey: ['locations'] })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal update lokasi')
    }
  }

  return (
    <div className="min-h-full pb-8">
      <TopHeader
        title="Kelola Lokasi"
        subtitle={`${locations?.length ?? 0} lokasi terdaftar`}
        leftAction={
          <button onClick={() => router.back()} className="text-[#A8967E] p-1">
            <ChevronLeft className="w-5 h-5" />
          </button>
        }
        rightAction={
          <button
            onClick={() => { setShowCreate(true); setForm(emptyForm) }}
            className="w-8 h-8 bg-[#D4722A] rounded-xl flex items-center justify-center"
          >
            <Plus className="w-4 h-4 text-white" />
          </button>
        }
      />

      <div className="px-4 pt-4 space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-20 bg-white/5 rounded-2xl animate-pulse" />)}
          </div>
        ) : !locations || locations.length === 0 ? (
          <div className="text-center py-12 text-[#5C5040]">Belum ada lokasi</div>
        ) : (
          locations.map((loc) => (
            <div key={loc.id} className={`bg-[#231e18] rounded-2xl border p-4 flex items-start gap-3 ${loc.is_active ? 'border-white/8' : 'border-white/4 opacity-60'}`}>
              <div className="w-10 h-10 bg-[#D4722A]/20 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                <MapPin className="w-4 h-4 text-[#D4722A]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#EDE5D8]">{loc.nama}</p>
                <p className="text-xs text-[#5C5040] font-mono">{loc.id}</p>
                {loc.deskripsi && <p className="text-xs text-[#A8967E] mt-0.5">{loc.deskripsi}</p>}
                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                  {loc.latitude && loc.longitude ? (
                    <span className="text-[10px] bg-green-900/30 text-green-400 border border-green-500/20 rounded-full px-2 py-0.5">
                      GPS: {Number(loc.latitude).toFixed(4)}, {Number(loc.longitude).toFixed(4)}
                    </span>
                  ) : (
                    <span className="text-[10px] bg-yellow-900/20 text-yellow-500 border border-yellow-500/20 rounded-full px-2 py-0.5">
                      GPS belum diset
                    </span>
                  )}
                  <span className="text-[10px] text-[#5C5040]">
                    Radius: {loc.radius_meter ?? 100}m
                  </span>
                </div>
                {!loc.is_active && <span className="text-[10px] text-red-400">Nonaktif</span>}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => openEdit(loc)} className="w-8 h-8 bg-[#2C1810] rounded-lg flex items-center justify-center">
                  <Pencil className="w-3.5 h-3.5 text-[#A8967E]" />
                </button>
                <button
                  onClick={() => handleToggleActive(loc)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${loc.is_active ? 'bg-green-900/20' : 'bg-white/5'}`}
                >
                  {loc.is_active
                    ? <ToggleRight className="w-4 h-4 text-green-400" />
                    : <ToggleLeft className="w-4 h-4 text-[#5C5040]" />}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Modal */}
      <Dialog open={showCreate} onOpenChange={(o) => !o && setShowCreate(false)}>
        <DialogContent className="bg-[#231e18] border-white/8 text-[#EDE5D8]">
          <DialogHeader>
            <DialogTitle className="text-[#EDE5D8]">Tambah Lokasi</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <div className="space-y-1">
              <Label className="text-xs text-[#A8967E]">ID Lokasi *</Label>
              <Input
                placeholder="contoh: gerobak_4"
                value={form.id}
                onChange={(e) => setForm(p => ({ ...p, id: e.target.value }))}
                className="bg-[#1C1712] border-white/8 text-[#EDE5D8] h-11 font-mono"
              />
              <p className="text-[10px] text-[#5C5040]">Huruf kecil dan underscore. Tidak bisa diubah setelah dibuat.</p>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-[#A8967E]">Nama Lokasi *</Label>
              <Input
                placeholder="Nama tampilan lokasi"
                value={form.nama}
                onChange={(e) => setForm(p => ({ ...p, nama: e.target.value }))}
                className="bg-[#1C1712] border-white/8 text-[#EDE5D8] h-11"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-[#A8967E]">Deskripsi</Label>
              <Input
                placeholder="Opsional"
                value={form.deskripsi}
                onChange={(e) => setForm(p => ({ ...p, deskripsi: e.target.value }))}
                className="bg-[#1C1712] border-white/8 text-[#EDE5D8] h-11"
              />
            </div>
          </div>
          <DialogFooter className="border-t border-white/8 pt-3">
            <Button variant="ghost" onClick={() => setShowCreate(false)} className="flex-1 text-[#A8967E] border border-white/8">Batal</Button>
            <Button onClick={handleCreate} disabled={loading} className="flex-1 bg-[#D4722A] text-white">
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Tambah
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={!!editLoc} onOpenChange={(o) => !o && setEditLoc(null)}>
        <DialogContent className="bg-[#231e18] border-white/8 text-[#EDE5D8] max-h-[90vh] flex flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-[#EDE5D8]">Edit Lokasi</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-3 py-1">
            <div className="space-y-1">
              <Label className="text-xs text-[#A8967E]">ID Lokasi</Label>
              <Input value={editLoc?.id ?? ''} disabled className="bg-[#1C1712] border-white/8 text-[#5C5040] h-11 font-mono" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-[#A8967E]">Nama Lokasi *</Label>
              <Input value={editForm.nama} onChange={(e) => setEditForm(p => ({ ...p, nama: e.target.value }))} className="bg-[#1C1712] border-white/8 text-[#EDE5D8] h-11" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-[#A8967E]">Deskripsi</Label>
              <Input value={editForm.deskripsi} onChange={(e) => setEditForm(p => ({ ...p, deskripsi: e.target.value }))} className="bg-[#1C1712] border-white/8 text-[#EDE5D8] h-11" />
            </div>

            {/* GPS Section */}
            <div className="rounded-xl border border-white/8 p-3 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-[#EDE5D8]">Koordinat Absensi</p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={useMyLocation}
                  disabled={gpsLoading}
                  className="text-[10px] text-[#D4722A] h-7 px-2 border border-[#D4722A]/30"
                >
                  {gpsLoading
                    ? <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    : <Crosshair className="w-3 h-3 mr-1" />}
                  Gunakan Lokasi Saya
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs text-[#A8967E]">Latitude</Label>
                  <Input
                    placeholder="-6.200000"
                    value={editForm.latitude}
                    onChange={(e) => setEditForm(p => ({ ...p, latitude: e.target.value }))}
                    className="bg-[#1C1712] border-white/8 text-[#EDE5D8] h-10 text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-[#A8967E]">Longitude</Label>
                  <Input
                    placeholder="106.800000"
                    value={editForm.longitude}
                    onChange={(e) => setEditForm(p => ({ ...p, longitude: e.target.value }))}
                    className="bg-[#1C1712] border-white/8 text-[#EDE5D8] h-10 text-xs font-mono"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-[#A8967E]">Radius (meter)</Label>
                <Input
                  type="number"
                  min="10"
                  max="5000"
                  placeholder="100"
                  value={editForm.radius_meter}
                  onChange={(e) => setEditForm(p => ({ ...p, radius_meter: e.target.value }))}
                  className="bg-[#1C1712] border-white/8 text-[#EDE5D8] h-10"
                />
                <p className="text-[10px] text-[#5C5040]">Area absensi yang dianggap valid. Default 100m.</p>
              </div>
            </div>
          </div>
          <DialogFooter className="border-t border-white/8 pt-3">
            <Button variant="ghost" onClick={() => setEditLoc(null)} className="flex-1 text-[#A8967E] border border-white/8">Batal</Button>
            <Button onClick={handleEdit} disabled={loading} className="flex-1 bg-[#D4722A] text-white">
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
