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
import { Loader2, Plus, UserCheck, UserX, ChevronLeft, Pencil } from 'lucide-react'
import type { User, AppRole, AppLocation } from '@/lib/types'

const emptyForm = {
  nama_lengkap: '',
  email: '',
  password: '',
  role: '',
  lokasi_tugas: '',
  no_hp: '',
}

interface Props { role: string }

export default function UsersClient({ role }: Props) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [editUser, setEditUser] = useState<User | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [editForm, setEditForm] = useState({ nama_lengkap: '', role: '', lokasi_tugas: '', no_hp: '', password: '' })
  const [loading, setLoading] = useState(false)

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await fetch('/api/users')
      const json = await res.json()
      return json.data?.users ?? []
    },
  })

  const { data: roles } = useQuery<AppRole[]>({
    queryKey: ['roles'],
    queryFn: async () => {
      const res = await fetch('/api/roles')
      const json = await res.json()
      return json.data?.roles ?? []
    },
    staleTime: 60_000,
  })

  const { data: locations } = useQuery<AppLocation[]>({
    queryKey: ['locations'],
    queryFn: async () => {
      const res = await fetch('/api/locations')
      const json = await res.json()
      return (json.data?.locations ?? []).filter((l: AppLocation) => l.is_active)
    },
    staleTime: 60_000,
  })

  const getRoleLabel = (id: string) => roles?.find(r => r.id === id)?.display_name ?? id
  const getLokasiLabel = (id: string) => locations?.find(l => l.id === id)?.nama ?? id

  function setField(key: keyof typeof emptyForm, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleCreate() {
    if (!form.nama_lengkap.trim() || !form.email.trim() || !form.password || !form.role) {
      toast.error('Nama, email, password, dan role wajib diisi')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.message)
      toast.success('User berhasil dibuat')
      setShowCreate(false)
      setForm(emptyForm)
      queryClient.invalidateQueries({ queryKey: ['users'] })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal membuat user')
    } finally {
      setLoading(false)
    }
  }

  function openEdit(user: User) {
    setEditUser(user)
    setEditForm({
      nama_lengkap: user.nama_lengkap,
      role: user.role,
      lokasi_tugas: user.lokasi_tugas ?? '',
      no_hp: user.no_hp ?? '',
      password: '',
    })
  }

  async function handleEdit() {
    if (!editUser) return
    setLoading(true)
    try {
      const res = await fetch(`/api/users/${editUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.message)
      toast.success('User berhasil diperbarui')
      setEditUser(null)
      queryClient.invalidateQueries({ queryKey: ['users'] })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal update user')
    } finally {
      setLoading(false)
    }
  }

  async function handleToggleActive(user: User) {
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !user.is_active }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.message)
      toast.success(user.is_active ? 'User dinonaktifkan' : 'User diaktifkan')
      queryClient.invalidateQueries({ queryKey: ['users'] })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal update user')
    }
  }

  return (
    <div className="min-h-full pb-8">
      <TopHeader
        title="Kelola Pengguna"
        subtitle={`${users?.length ?? 0} user terdaftar`}
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
            {[1,2,3].map(i => <div key={i} className="h-16 bg-white/5 rounded-2xl animate-pulse" />)}
          </div>
        ) : !users || users.length === 0 ? (
          <div className="text-center py-12 text-[#5C5040]">Belum ada user</div>
        ) : (
          users.map((u) => (
            <div key={u.id} className="bg-[#231e18] rounded-2xl border border-white/8 p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-[#D4722A]/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-base font-bold text-[#D4722A]">{u.nama_lengkap.charAt(0)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#EDE5D8] truncate">{u.nama_lengkap}</p>
                <p className="text-xs text-[#A8967E]">{getRoleLabel(u.role)}</p>
                {!u.is_active && <span className="text-[10px] text-red-400">Nonaktif</span>}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEdit(u)}
                  className="w-8 h-8 bg-[#2C1810] rounded-lg flex items-center justify-center"
                >
                  <Pencil className="w-3.5 h-3.5 text-[#A8967E]" />
                </button>
                <button
                  onClick={() => handleToggleActive(u)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    u.is_active ? 'bg-red-900/20' : 'bg-green-900/20'
                  }`}
                >
                  {u.is_active
                    ? <UserX className="w-3.5 h-3.5 text-red-400" />
                    : <UserCheck className="w-3.5 h-3.5 text-green-400" />
                  }
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Modal */}
      <Dialog open={showCreate} onOpenChange={(o) => !o && setShowCreate(false)}>
        <DialogContent className="bg-[#231e18] border-white/8 text-[#EDE5D8] max-h-[90vh] flex flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-[#EDE5D8]">Buat User Baru</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-3 py-1">
            {[
              { label: 'Nama Lengkap *', key: 'nama_lengkap', placeholder: 'Nama lengkap' },
              { label: 'Email *', key: 'email', placeholder: 'email@contoh.com', type: 'email' },
              { label: 'Password *', key: 'password', placeholder: 'Min. 6 karakter', type: 'password' },
              { label: 'No. HP', key: 'no_hp', placeholder: '08xx-xxxx-xxxx' },
            ].map((field) => (
              <div key={field.key} className="space-y-1">
                <Label className="text-xs text-[#A8967E]">{field.label}</Label>
                <Input
                  type={field.type || 'text'}
                  placeholder={field.placeholder}
                  value={form[field.key as keyof typeof emptyForm]}
                  onChange={(e) => setField(field.key as keyof typeof emptyForm, e.target.value)}
                  className="bg-[#1C1712] border-white/8 text-[#EDE5D8] h-11"
                />
              </div>
            ))}
            <div className="space-y-1">
              <Label className="text-xs text-[#A8967E]">Role *</Label>
              <Select value={form.role} onValueChange={(v) => setField('role', v ?? '')}>
                <SelectTrigger className="bg-[#1C1712] border-white/8 text-[#EDE5D8] h-11">
                  <SelectValue placeholder="Pilih role...">
                    {form.role ? getRoleLabel(form.role) : undefined}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-[#231e18] border-white/8">
                  {(roles ?? []).map((r) => (
                    <SelectItem key={r.id} value={r.id} className="text-[#EDE5D8] focus:bg-[#2C1810]">{r.display_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-[#A8967E]">Lokasi Tugas</Label>
              <Select value={form.lokasi_tugas} onValueChange={(v) => setField('lokasi_tugas', v ?? '')}>
                <SelectTrigger className="bg-[#1C1712] border-white/8 text-[#EDE5D8] h-11">
                  <SelectValue placeholder="Pilih lokasi...">
                    {form.lokasi_tugas ? getLokasiLabel(form.lokasi_tugas) : undefined}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-[#231e18] border-white/8">
                  {(locations ?? []).map((l) => (
                    <SelectItem key={l.id} value={l.id} className="text-[#EDE5D8] focus:bg-[#2C1810]">{l.nama}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="border-t border-white/8 pt-3">
            <Button variant="ghost" onClick={() => setShowCreate(false)} className="flex-1 text-[#A8967E] border border-white/8">Batal</Button>
            <Button onClick={handleCreate} disabled={loading} className="flex-1 bg-[#D4722A] text-white">
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Buat User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={!!editUser} onOpenChange={(o) => !o && setEditUser(null)}>
        <DialogContent className="bg-[#231e18] border-white/8 text-[#EDE5D8] max-h-[90vh] flex flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-[#EDE5D8]">Edit User</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-3 py-1">
            <div className="space-y-1">
              <Label className="text-xs text-[#A8967E]">Nama Lengkap</Label>
              <Input value={editForm.nama_lengkap} onChange={(e) => setEditForm(p => ({ ...p, nama_lengkap: e.target.value }))}
                className="bg-[#1C1712] border-white/8 text-[#EDE5D8] h-11" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-[#A8967E]">Role</Label>
              <Select value={editForm.role} onValueChange={(v) => setEditForm(p => ({ ...p, role: v ?? '' }))}>
                <SelectTrigger className="bg-[#1C1712] border-white/8 text-[#EDE5D8] h-11">
                  <SelectValue placeholder="Pilih role...">{editForm.role ? getRoleLabel(editForm.role) : undefined}</SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-[#231e18] border-white/8">
                  {(roles ?? []).map((r) => (
                    <SelectItem key={r.id} value={r.id} className="text-[#EDE5D8] focus:bg-[#2C1810]">{r.display_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-[#A8967E]">Lokasi Tugas</Label>
              <Select value={editForm.lokasi_tugas} onValueChange={(v) => setEditForm(p => ({ ...p, lokasi_tugas: v ?? '' }))}>
                <SelectTrigger className="bg-[#1C1712] border-white/8 text-[#EDE5D8] h-11">
                  <SelectValue placeholder="Pilih lokasi...">{editForm.lokasi_tugas ? getLokasiLabel(editForm.lokasi_tugas) : undefined}</SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-[#231e18] border-white/8">
                  {(locations ?? []).map((l) => (
                    <SelectItem key={l.id} value={l.id} className="text-[#EDE5D8] focus:bg-[#2C1810]">{l.nama}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-[#A8967E]">No. HP</Label>
              <Input value={editForm.no_hp} onChange={(e) => setEditForm(p => ({ ...p, no_hp: e.target.value }))}
                className="bg-[#1C1712] border-white/8 text-[#EDE5D8] h-11" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-[#A8967E]">Password Baru (kosongkan jika tidak diubah)</Label>
              <Input type="password" value={editForm.password} onChange={(e) => setEditForm(p => ({ ...p, password: e.target.value }))}
                placeholder="Min. 6 karakter" className="bg-[#1C1712] border-white/8 text-[#EDE5D8] h-11" />
            </div>
          </div>
          <DialogFooter className="border-t border-white/8 pt-3">
            <Button variant="ghost" onClick={() => setEditUser(null)} className="flex-1 text-[#A8967E] border border-white/8">Batal</Button>
            <Button onClick={handleEdit} disabled={loading} className="flex-1 bg-[#D4722A] text-white">
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
