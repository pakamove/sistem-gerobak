'use client'

import { useState, useCallback, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import TopHeader from '@/components/layout/TopHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import {
  Loader2, MapPin, LogIn, LogOut, Clock, CheckCircle2, AlertCircle,
  FileText, Calendar, ChevronLeft, Upload, ExternalLink, ShieldAlert,
} from 'lucide-react'
import type { AbsensiRecord, LeaveRequest, LeaveType } from '@/lib/types'

interface Profile {
  id: string
  nama_lengkap: string
  role: string
  lokasi_tugas: string | null
}

interface Props { profile: Profile }

type Tab = 'today' | 'history' | 'leave'

const TYPE_LABEL: Record<LeaveType, string> = {
  cuti: 'Cuti',
  sakit: 'Izin Sakit',
  izin_lain: 'Izin Lainnya',
}

const STATUS_STYLE = {
  pending: 'bg-yellow-900/30 text-yellow-400 border-yellow-500/30',
  approved: 'bg-green-900/30 text-green-400 border-green-500/30',
  rejected: 'bg-red-900/20 text-red-400 border-red-500/20',
}

const STATUS_LABEL = { pending: 'Menunggu', approved: 'Disetujui', rejected: 'Ditolak' }

function formatDate(s: string | null | undefined) {
  if (!s) return '—'
  return new Date(s).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatTime(s: string | null | undefined) {
  if (!s) return '—'
  return new Date(s).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
}

function getDurationStr(masuk: string, pulang: string) {
  const menit = Math.round((new Date(pulang).getTime() - new Date(masuk).getTime()) / 60000)
  return `${Math.floor(menit / 60)}j ${menit % 60}m`
}

async function getGps(): Promise<{ latitude: number; longitude: number } | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null)
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ latitude: p.coords.latitude, longitude: p.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 10000 }
    )
  })
}

export default function AttendanceClient({ profile }: Props) {
  const qc = useQueryClient()
  const [tab, setTab] = useState<Tab>('today')
  const [loading, setLoading] = useState(false)
  const [showLeaveForm, setShowLeaveForm] = useState(false)
  const [leaveForm, setLeaveForm] = useState({ type: '' as LeaveType | '', tanggal_mulai: '', tanggal_selesai: '', alasan: '' })
  const [docFile, setDocFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const today = new Date().toISOString().split('T')[0]
  const isManagerOrOwner = ['owner', 'manager'].includes(profile.role)

  // Today's record
  const { data: todayRec, isLoading: loadingToday } = useQuery<AbsensiRecord | null>({
    queryKey: ['att-today', profile.id],
    queryFn: async () => {
      const res = await fetch(`/api/attendance?today=1`)
      const json = await res.json()
      const list: AbsensiRecord[] = json.data?.records ?? []
      return list.find(r => r.karyawan_id === profile.id) ?? null
    },
    refetchInterval: 60_000,
  })

  // History
  const { data: history } = useQuery<AbsensiRecord[]>({
    queryKey: ['att-history', profile.id],
    queryFn: async () => {
      const res = await fetch('/api/attendance')
      const json = await res.json()
      return json.data?.records ?? []
    },
    enabled: tab === 'history',
  })

  // Leave requests
  const { data: leaves } = useQuery<LeaveRequest[]>({
    queryKey: ['leave-requests', profile.id],
    queryFn: async () => {
      const res = await fetch('/api/leave-requests')
      const json = await res.json()
      return json.data?.requests ?? []
    },
    enabled: tab === 'leave',
  })

  const handleClockAction = useCallback(async (action: 'in' | 'out') => {
    setLoading(true)
    try {
      const gps = await getGps()
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...gps }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.message)
      toast.success(json.message)
      qc.invalidateQueries({ queryKey: ['att-today'] })
      qc.invalidateQueries({ queryKey: ['att-history'] })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal mencatat absensi')
    } finally {
      setLoading(false)
    }
  }, [qc])

  async function handleLeaveSubmit() {
    if (!leaveForm.type || !leaveForm.tanggal_mulai || !leaveForm.tanggal_selesai) {
      toast.error('Tipe, tanggal mulai, dan tanggal selesai wajib diisi')
      return
    }
    setUploading(true)
    let documentUrl: string | null = null
    try {
      // Upload dokumen dulu jika ada
      if (docFile) {
        const fd = new FormData()
        fd.append('file', docFile)
        const upRes = await fetch('/api/leave-requests/upload', { method: 'POST', body: fd })
        const upJson = await upRes.json()
        if (!upJson.success) throw new Error(upJson.message)
        documentUrl = upJson.data.url
      }
      setUploading(false)
      setLoading(true)

      const res = await fetch('/api/leave-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...leaveForm, document_url: documentUrl }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.message)
      toast.success('Permintaan berhasil dikirim')
      setShowLeaveForm(false)
      setLeaveForm({ type: '', tanggal_mulai: '', tanggal_selesai: '', alasan: '' })
      setDocFile(null)
      qc.invalidateQueries({ queryKey: ['leave-requests'] })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal mengirim permintaan')
    } finally {
      setUploading(false)
      setLoading(false)
    }
  }

  const isClockedIn = !!todayRec?.jam_masuk
  const isClockedOut = !!todayRec?.jam_pulang

  return (
    <div className="min-h-full pb-8">
      <TopHeader title="Absensi" subtitle={formatDate(today)} />

      {/* Tab Bar */}
      <div className="flex border-b border-white/8 px-4 gap-0 sticky top-0 bg-[#1C1712] z-10">
        {(['today', 'history', 'leave'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-3 text-xs font-semibold transition-colors border-b-2 ${
              tab === t
                ? 'text-[#D4722A] border-[#D4722A]'
                : 'text-[#5C5040] border-transparent'
            }`}
          >
            {t === 'today' ? 'Hari Ini' : t === 'history' ? 'Riwayat' : 'Cuti & Izin'}
          </button>
        ))}
      </div>

      {/* ── TAB: HARI INI ── */}
      {tab === 'today' && (
        <div className="px-4 pt-5 space-y-4">
          <div className="bg-[#231e18] rounded-2xl border border-white/8 p-5 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-[#EDE5D8]">{profile.nama_lengkap}</p>
                <p className="text-xs text-[#A8967E] capitalize">{profile.role.replace(/_/g, ' ')}</p>
              </div>
              {loadingToday ? (
                <Loader2 className="w-5 h-5 text-[#A8967E] animate-spin" />
              ) : isClockedOut ? (
                <div className="flex items-center gap-1.5 bg-green-900/30 border border-green-500/30 rounded-full px-3 py-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                  <span className="text-xs font-semibold text-green-400">Selesai</span>
                </div>
              ) : isClockedIn ? (
                <div className="flex items-center gap-1.5 bg-[#D4722A]/20 border border-[#D4722A]/30 rounded-full px-3 py-1">
                  <span className="w-2 h-2 rounded-full bg-[#D4722A] animate-pulse" />
                  <span className="text-xs font-semibold text-[#D4722A]">Aktif</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 bg-red-900/20 border border-red-500/20 rounded-full px-3 py-1">
                  <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                  <span className="text-xs font-semibold text-red-400">Belum Absen</span>
                </div>
              )}
            </div>

            {/* VPN Warning */}
            {todayRec?.is_vpn && (
              <div className="flex items-start gap-2 bg-yellow-900/20 border border-yellow-500/20 rounded-xl px-3 py-2">
                <ShieldAlert className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-yellow-400">VPN terdeteksi saat clock in. Dicatat untuk audit.</p>
              </div>
            )}

            {/* Time Cards */}
            {todayRec && (
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#1C1712] rounded-xl p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <LogIn className="w-3 h-3 text-green-400" />
                    <p className="text-[10px] text-[#A8967E]">Masuk</p>
                  </div>
                  <p className="text-sm font-bold text-[#EDE5D8]">{formatTime(todayRec.jam_masuk)}</p>
                  {todayRec.latitude_in && (
                    <p className="text-[10px] text-[#5C5040] mt-0.5 flex items-center gap-1">
                      <MapPin className="w-2.5 h-2.5" />GPS terekam
                    </p>
                  )}
                </div>
                <div className="bg-[#1C1712] rounded-xl p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <LogOut className="w-3 h-3 text-red-400" />
                    <p className="text-[10px] text-[#A8967E]">Keluar</p>
                  </div>
                  {todayRec.jam_pulang ? (
                    <>
                      <p className="text-sm font-bold text-[#EDE5D8]">{formatTime(todayRec.jam_pulang)}</p>
                      <p className="text-[10px] text-[#D4722A] mt-0.5 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {getDurationStr(todayRec.jam_masuk!, todayRec.jam_pulang)}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-[#5C5040]">—</p>
                  )}
                </div>
              </div>
            )}

            {/* Buttons */}
            {!loadingToday && (
              <div className="space-y-2">
                {!isClockedIn && (
                  <Button
                    onClick={() => handleClockAction('in')}
                    disabled={loading}
                    className="w-full h-12 bg-green-700 hover:bg-green-600 text-white font-semibold"
                  >
                    {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Mencatat...</> : <><LogIn className="w-4 h-4 mr-2" />Clock In</>}
                  </Button>
                )}
                {isClockedIn && !isClockedOut && (
                  <Button
                    onClick={() => handleClockAction('out')}
                    disabled={loading}
                    className="w-full h-12 bg-red-700 hover:bg-red-600 text-white font-semibold"
                  >
                    {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Mencatat...</> : <><LogOut className="w-4 h-4 mr-2" />Clock Out</>}
                  </Button>
                )}
              </div>
            )}
          </div>

          <div className="bg-[#1C1712] rounded-xl px-4 py-3 flex items-start gap-2">
            <MapPin className="w-4 h-4 text-[#D4722A] mt-0.5 flex-shrink-0" />
            <p className="text-xs text-[#A8967E]">Lokasi GPS direkam otomatis. Pastikan izin lokasi diaktifkan di browser.</p>
          </div>
        </div>
      )}

      {/* ── TAB: RIWAYAT ── */}
      {tab === 'history' && (
        <div className="px-4 pt-4 space-y-3">
          {!history ? (
            <div className="space-y-2">
              {[1,2,3].map(i => <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />)}
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12 text-[#5C5040]">Belum ada riwayat absensi</div>
          ) : (
            history.map((r) => (
              <div key={r.id} className="bg-[#231e18] rounded-2xl border border-white/8 px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#EDE5D8]">{formatDate(r.tanggal)}</p>
                  <p className="text-xs text-[#A8967E]">
                    {formatTime(r.jam_masuk)} — {r.jam_pulang ? formatTime(r.jam_pulang) : 'Belum clock out'}
                  </p>
                  {r.is_vpn && (
                    <span className="text-[10px] text-yellow-400 flex items-center gap-1 mt-0.5">
                      <ShieldAlert className="w-2.5 h-2.5" />VPN detected
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                    r.status === 'hadir' ? 'bg-green-900/30 text-green-400 border-green-500/20'
                    : r.status === 'izin' ? 'bg-blue-900/20 text-blue-400 border-blue-500/20'
                    : r.status === 'sakit' ? 'bg-orange-900/20 text-orange-400 border-orange-500/20'
                    : 'bg-red-900/20 text-red-400 border-red-500/20'
                  }`}>
                    {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                  </span>
                  {r.jam_masuk && r.jam_pulang && (
                    <p className="text-[10px] text-[#D4722A] mt-1">{getDurationStr(r.jam_masuk, r.jam_pulang)}</p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── TAB: CUTI & IZIN ── */}
      {tab === 'leave' && (
        <div className="px-4 pt-4 space-y-3">
          {!isManagerOrOwner && (
            <Button
              onClick={() => setShowLeaveForm(true)}
              className="w-full h-11 bg-[#D4722A] text-white"
            >
              <FileText className="w-4 h-4 mr-2" />Ajukan Cuti / Izin
            </Button>
          )}

          {!leaves ? (
            <div className="space-y-2">
              {[1,2].map(i => <div key={i} className="h-20 bg-white/5 rounded-xl animate-pulse" />)}
            </div>
          ) : leaves.length === 0 ? (
            <div className="text-center py-12 text-[#5C5040]">Belum ada pengajuan</div>
          ) : (
            leaves.map((req) => (
              <div key={req.id} className="bg-[#231e18] rounded-2xl border border-white/8 p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    {isManagerOrOwner && req.user && (
                      <p className="text-xs font-semibold text-[#D4722A] mb-0.5">{req.user.nama_lengkap}</p>
                    )}
                    <p className="text-sm font-semibold text-[#EDE5D8]">{TYPE_LABEL[req.type]}</p>
                    <div className="flex items-center gap-1.5 text-xs text-[#A8967E] mt-0.5">
                      <Calendar className="w-3 h-3" />
                      {formatDate(req.tanggal_mulai)}
                      {req.tanggal_selesai !== req.tanggal_mulai && ` — ${formatDate(req.tanggal_selesai)}`}
                    </div>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border whitespace-nowrap ${STATUS_STYLE[req.status]}`}>
                    {STATUS_LABEL[req.status]}
                  </span>
                </div>
                {req.alasan && <p className="text-xs text-[#A8967E]">{req.alasan}</p>}
                {req.catatan_approval && (
                  <p className="text-xs text-[#5C5040] italic">Catatan: {req.catatan_approval}</p>
                )}
                {req.document_url && (
                  <a
                    href={req.document_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-[#D4722A]"
                  >
                    <ExternalLink className="w-3 h-3" />Lihat Dokumen
                  </a>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Form Pengajuan */}
      <Dialog open={showLeaveForm} onOpenChange={(o) => !o && setShowLeaveForm(false)}>
        <DialogContent className="bg-[#231e18] border-white/8 text-[#EDE5D8] max-h-[90vh] flex flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-[#EDE5D8]">Ajukan Cuti / Izin</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-3 py-1">
            <div className="space-y-1">
              <Label className="text-xs text-[#A8967E]">Tipe *</Label>
              <Select
                value={leaveForm.type}
                onValueChange={(v) => setLeaveForm(p => ({ ...p, type: v as LeaveType }))}
              >
                <SelectTrigger className="bg-[#1C1712] border-white/8 text-[#EDE5D8] h-11">
                  <SelectValue placeholder="Pilih tipe...">
                    {leaveForm.type ? TYPE_LABEL[leaveForm.type] : undefined}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-[#231e18] border-white/8">
                  {(Object.entries(TYPE_LABEL) as [LeaveType, string][]).map(([val, lbl]) => (
                    <SelectItem key={val} value={val} className="text-[#EDE5D8] focus:bg-[#2C1810]">{lbl}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs text-[#A8967E]">Tanggal Mulai *</Label>
                <Input
                  type="date"
                  value={leaveForm.tanggal_mulai}
                  onChange={(e) => setLeaveForm(p => ({ ...p, tanggal_mulai: e.target.value }))}
                  className="bg-[#1C1712] border-white/8 text-[#EDE5D8] h-11"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-[#A8967E]">Tanggal Selesai *</Label>
                <Input
                  type="date"
                  value={leaveForm.tanggal_selesai}
                  onChange={(e) => setLeaveForm(p => ({ ...p, tanggal_selesai: e.target.value }))}
                  className="bg-[#1C1712] border-white/8 text-[#EDE5D8] h-11"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-[#A8967E]">Alasan</Label>
              <Input
                placeholder="Jelaskan alasan..."
                value={leaveForm.alasan}
                onChange={(e) => setLeaveForm(p => ({ ...p, alasan: e.target.value }))}
                className="bg-[#1C1712] border-white/8 text-[#EDE5D8] h-11"
              />
            </div>
            {/* Upload Dokumen */}
            <div className="space-y-1">
              <Label className="text-xs text-[#A8967E]">Dokumen Pendukung *</Label>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                className="hidden"
                onChange={(e) => setDocFile(e.target.files?.[0] ?? null)}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-full h-11 bg-[#1C1712] border border-white/8 border-dashed rounded-lg flex items-center justify-center gap-2 text-sm text-[#A8967E] hover:border-[#D4722A]/40 transition-colors"
              >
                <Upload className="w-4 h-4" />
                {docFile ? docFile.name : 'Upload dokumen (JPG/PNG/PDF, maks 10MB)'}
              </button>
            </div>
          </div>
          <DialogFooter className="border-t border-white/8 pt-3">
            <Button variant="ghost" onClick={() => setShowLeaveForm(false)} className="flex-1 text-[#A8967E] border border-white/8">Batal</Button>
            <Button onClick={handleLeaveSubmit} disabled={loading || uploading} className="flex-1 bg-[#D4722A] text-white">
              {(loading || uploading) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {uploading ? 'Upload...' : 'Kirim'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
