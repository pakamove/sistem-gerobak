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
import { Loader2, Plus, ChevronLeft, Pencil, Trash2, Shield, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AppRole, AppModule } from '@/lib/types'

const ALL_MODULES = [
  { key: 'pos', label: 'POS', desc: 'Kasir & transaksi' },
  { key: 'kitchen', label: 'Dapur', desc: 'Manajemen produksi' },
  { key: 'inventory', label: 'Stok', desc: 'Inventaris bahan' },
  { key: 'purchasing', label: 'Pembelian', desc: 'Purchase order' },
  { key: 'attendance', label: 'Absensi', desc: 'Clock in/out' },
  { key: 'dashboard', label: 'Dashboard', desc: 'Ringkasan analitik' },
  { key: 'reports', label: 'Laporan', desc: 'Laporan bisnis' },
  { key: 'settings', label: 'Pengaturan', desc: 'Konfigurasi sistem' },
]

interface RoleWithModules extends AppRole {
  modules: string[]
}

const emptyForm = { id: '', display_name: '', ui_type: 'executor' as 'executor' | 'planner', color: '#6B7280', deskripsi: '' }

export default function RolesClient() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [editRole, setEditRole] = useState<RoleWithModules | null>(null)
  const [moduleRole, setModuleRole] = useState<RoleWithModules | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [selectedModules, setSelectedModules] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const { data: roles, isLoading } = useQuery<RoleWithModules[]>({
    queryKey: ['roles'],
    queryFn: async () => {
      const res = await fetch('/api/roles')
      const json = await res.json()
      return json.data?.roles ?? []
    },
  })

  function openEdit(r: RoleWithModules) {
    setEditRole(r)
    setForm({ id: r.id, display_name: r.display_name, ui_type: r.ui_type, color: r.color ?? '#6B7280', deskripsi: r.deskripsi ?? '' })
  }

  function openModules(r: RoleWithModules) {
    setModuleRole(r)
    setSelectedModules(r.modules ?? [])
  }

  function toggleModule(key: string) {
    setSelectedModules((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    )
  }

  async function handleCreate() {
    if (!form.id.trim() || !form.display_name.trim()) { toast.error('ID dan nama role wajib diisi'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.message)
      toast.success('Role berhasil dibuat')
      setShowCreate(false)
      setForm(emptyForm)
      queryClient.invalidateQueries({ queryKey: ['roles'] })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal membuat role')
    } finally {
      setLoading(false)
    }
  }

  async function handleUpdate() {
    if (!editRole) return
    setLoading(true)
    try {
      const res = await fetch(`/api/roles/${editRole.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ display_name: form.display_name, ui_type: form.ui_type, color: form.color, deskripsi: form.deskripsi }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.message)
      toast.success('Role diperbarui')
      setEditRole(null)
      queryClient.invalidateQueries({ queryKey: ['roles'] })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal update role')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(r: RoleWithModules) {
    if (!confirm(`Hapus role "${r.display_name}"?`)) return
    try {
      const res = await fetch(`/api/roles/${r.id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!json.success) throw new Error(json.message)
      toast.success('Role dihapus')
      queryClient.invalidateQueries({ queryKey: ['roles'] })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal hapus role')
    }
  }

  async function handleSaveModules() {
    if (!moduleRole) return
    setLoading(true)
    try {
      const res = await fetch(`/api/roles/${moduleRole.id}/modules`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ module_keys: selectedModules }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.message)
      toast.success('Akses modul disimpan')
      setModuleRole(null)
      queryClient.invalidateQueries({ queryKey: ['roles'] })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal simpan modul')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-full pb-8">
      <TopHeader
        title="Kelola Role"
        subtitle={`${roles?.length ?? 0} role terdaftar`}
        leftAction={<button onClick={() => router.back()} className="text-[#A8967E] p-1"><ChevronLeft className="w-5 h-5" /></button>}
        rightAction={
          <button onClick={() => { setShowCreate(true); setForm(emptyForm) }} className="w-8 h-8 bg-[#D4722A] rounded-xl flex items-center justify-center">
            <Plus className="w-4 h-4 text-white" />
          </button>
        }
      />

      <div className="px-4 pt-4 space-y-3">
        {isLoading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 bg-white/5 rounded-2xl animate-pulse" />)}</div>
        ) : (roles ?? []).map((r) => (
          <div key={r.id} className="bg-[#231e18] rounded-2xl border border-white/8 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: (r.color ?? '#6B7280') + '30', border: `1px solid ${(r.color ?? '#6B7280')}50` }}>
                  {r.is_system ? <ShieldCheck className="w-4 h-4" style={{ color: r.color ?? '#6B7280' }} /> : <Shield className="w-4 h-4" style={{ color: r.color ?? '#6B7280' }} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-[#EDE5D8]">{r.display_name}</p>
                    {r.is_system && <span className="text-[10px] text-[#5C5040] bg-white/5 px-1.5 py-0.5 rounded">Sistem</span>}
                  </div>
                  <p className="text-[10px] text-[#A8967E] mt-0.5">ID: {r.id} · UI: {r.ui_type}</p>
                  {r.deskripsi && <p className="text-xs text-[#5C5040] mt-0.5">{r.deskripsi}</p>}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {(r.modules ?? []).map((mk) => (
                      <span key={mk} className="text-[10px] bg-[#D4722A]/15 text-[#D4722A] px-1.5 py-0.5 rounded">
                        {ALL_MODULES.find(m => m.key === mk)?.label ?? mk}
                      </span>
                    ))}
                    {(r.modules ?? []).length === 0 && <span className="text-[10px] text-[#5C5040]">Belum ada akses modul</span>}
                  </div>
                </div>
              </div>
              <div className="flex gap-1.5">
                <button onClick={() => openModules(r)} className="w-8 h-8 bg-[#2C1810] rounded-lg flex items-center justify-center" title="Atur Modul">
                  <Shield className="w-3.5 h-3.5 text-[#D4722A]" />
                </button>
                <button onClick={() => openEdit(r)} className="w-8 h-8 bg-[#2C1810] rounded-lg flex items-center justify-center">
                  <Pencil className="w-3.5 h-3.5 text-[#A8967E]" />
                </button>
                {!r.is_system && (
                  <button onClick={() => handleDelete(r)} className="w-8 h-8 bg-red-900/20 rounded-lg flex items-center justify-center">
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Modal */}
      <Dialog open={showCreate} onOpenChange={(o) => !o && setShowCreate(false)}>
        <DialogContent className="bg-[#231e18] border-white/8 text-[#EDE5D8]">
          <DialogHeader><DialogTitle className="text-[#EDE5D8]">Buat Role Baru</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs text-[#A8967E]">ID Role * (huruf kecil, tanpa spasi)</Label>
              <Input value={form.id} onChange={(e) => setForm(p => ({ ...p, id: e.target.value.toLowerCase().replace(/\s+/g, '_') }))}
                placeholder="contoh: supervisor" className="bg-[#1C1712] border-white/8 text-[#EDE5D8] h-11" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-[#A8967E]">Nama Tampilan *</Label>
              <Input value={form.display_name} onChange={(e) => setForm(p => ({ ...p, display_name: e.target.value }))}
                placeholder="contoh: Supervisor" className="bg-[#1C1712] border-white/8 text-[#EDE5D8] h-11" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-[#A8967E]">Tipe Tampilan</Label>
              <div className="grid grid-cols-2 gap-2">
                {(['executor', 'planner'] as const).map((t) => (
                  <button key={t} onClick={() => setForm(p => ({ ...p, ui_type: t }))}
                    className={cn('py-2.5 rounded-xl text-sm font-semibold border transition-colors', form.ui_type === t ? 'bg-[#D4722A] border-[#D4722A] text-white' : 'bg-[#1C1712] border-white/8 text-[#A8967E]')}>
                    {t === 'executor' ? '📱 Executor (Mobile)' : '🖥 Planner (Web)'}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-[#5C5040]">Executor: nav bawah · Planner: sidebar web</p>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-[#A8967E]">Deskripsi</Label>
              <Input value={form.deskripsi} onChange={(e) => setForm(p => ({ ...p, deskripsi: e.target.value }))}
                placeholder="Deskripsi singkat role" className="bg-[#1C1712] border-white/8 text-[#EDE5D8] h-11" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setShowCreate(false)} className="text-[#A8967E]">Batal</Button>
            <Button onClick={handleCreate} disabled={loading} className="bg-[#D4722A] text-white">
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Buat Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={!!editRole} onOpenChange={(o) => !o && setEditRole(null)}>
        <DialogContent className="bg-[#231e18] border-white/8 text-[#EDE5D8]">
          <DialogHeader><DialogTitle className="text-[#EDE5D8]">Edit Role: {editRole?.id}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs text-[#A8967E]">Nama Tampilan</Label>
              <Input value={form.display_name} onChange={(e) => setForm(p => ({ ...p, display_name: e.target.value }))}
                className="bg-[#1C1712] border-white/8 text-[#EDE5D8] h-11" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-[#A8967E]">Tipe Tampilan</Label>
              <div className="grid grid-cols-2 gap-2">
                {(['executor', 'planner'] as const).map((t) => (
                  <button key={t} onClick={() => setForm(p => ({ ...p, ui_type: t }))}
                    className={cn('py-2.5 rounded-xl text-sm font-semibold border transition-colors', form.ui_type === t ? 'bg-[#D4722A] border-[#D4722A] text-white' : 'bg-[#1C1712] border-white/8 text-[#A8967E]')}>
                    {t === 'executor' ? '📱 Mobile' : '🖥 Web'}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-[#A8967E]">Deskripsi</Label>
              <Input value={form.deskripsi} onChange={(e) => setForm(p => ({ ...p, deskripsi: e.target.value }))}
                className="bg-[#1C1712] border-white/8 text-[#EDE5D8] h-11" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setEditRole(null)} className="text-[#A8967E]">Batal</Button>
            <Button onClick={handleUpdate} disabled={loading} className="bg-[#D4722A] text-white">
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Module Assignment Modal */}
      <Dialog open={!!moduleRole} onOpenChange={(o) => !o && setModuleRole(null)}>
        <DialogContent className="bg-[#231e18] border-white/8 text-[#EDE5D8]">
          <DialogHeader>
            <DialogTitle className="text-[#EDE5D8]">Akses Modul — {moduleRole?.display_name}</DialogTitle>
            <p className="text-xs text-[#A8967E]">Centang modul yang bisa diakses role ini</p>
          </DialogHeader>
          <div className="space-y-2">
            {ALL_MODULES.map((m) => {
              const active = selectedModules.includes(m.key)
              return (
                <button key={m.key} onClick={() => toggleModule(m.key)}
                  className={cn('w-full flex items-center justify-between p-3 rounded-xl border transition-colors text-left', active ? 'bg-[#D4722A]/15 border-[#D4722A]/30' : 'bg-[#1C1712] border-white/8 hover:border-white/20')}>
                  <div>
                    <p className={cn('text-sm font-semibold', active ? 'text-[#D4722A]' : 'text-[#EDE5D8]')}>{m.label}</p>
                    <p className="text-[10px] text-[#5C5040]">{m.desc}</p>
                  </div>
                  <div className={cn('w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0', active ? 'bg-[#D4722A] border-[#D4722A]' : 'border-white/20')}>
                    {active && <span className="text-white text-xs font-bold">✓</span>}
                  </div>
                </button>
              )
            })}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setModuleRole(null)} className="text-[#A8967E]">Batal</Button>
            <Button onClick={handleSaveModules} disabled={loading} className="bg-[#D4722A] text-white">
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Simpan Akses
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
