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
import { Loader2, ChevronLeft, Calendar, ExternalLink, CheckCircle2, XCircle, Clock } from 'lucide-react'
import type { LeaveRequest } from '@/lib/types'

interface Props { role: string }

const TYPE_LABEL = { cuti: 'Cuti', sakit: 'Izin Sakit', izin_lain: 'Izin Lainnya' }
const STATUS_STYLE = {
  pending: 'bg-yellow-900/30 text-yellow-400 border-yellow-500/30',
  approved: 'bg-green-900/30 text-green-400 border-green-500/30',
  rejected: 'bg-red-900/20 text-red-400 border-red-500/20',
}
const STATUS_LABEL = { pending: 'Menunggu', approved: 'Disetujui', rejected: 'Ditolak' }

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function ApprovalsClient({ role }: Props) {
  const router = useRouter()
  const qc = useQueryClient()
  const [filter, setFilter] = useState<'pending' | 'all'>('pending')
  const [selected, setSelected] = useState<LeaveRequest | null>(null)
  const [catatan, setCatatan] = useState('')
  const [loading, setLoading] = useState(false)

  const { data: requests, isLoading } = useQuery<LeaveRequest[]>({
    queryKey: ['approvals', filter],
    queryFn: async () => {
      const url = filter === 'pending'
        ? '/api/leave-requests?pending=1'
        : '/api/leave-requests'
      const res = await fetch(url)
      const json = await res.json()
      return json.data?.requests ?? []
    },
  })

  async function handleAction(action: 'approved' | 'rejected') {
    if (!selected) return
    setLoading(true)
    try {
      const res = await fetch(`/api/leave-requests/${selected.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, catatan_approval: catatan }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.message)
      toast.success(json.message)
      setSelected(null)
      setCatatan('')
      qc.invalidateQueries({ queryKey: ['approvals'] })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal memproses')
    } finally {
      setLoading(false)
    }
  }

  const pendingCount = requests?.filter(r => r.status === 'pending').length ?? 0

  return (
    <div className="min-h-full pb-8">
      <TopHeader
        title="Approval Cuti & Izin"
        subtitle={filter === 'pending' ? `${pendingCount} menunggu` : `${requests?.length ?? 0} total`}
        leftAction={
          <button onClick={() => router.back()} className="text-[#A8967E] p-1">
            <ChevronLeft className="w-5 h-5" />
          </button>
        }
      />

      {/* Filter Toggle */}
      <div className="px-4 pt-4">
        <div className="flex bg-[#1C1712] rounded-xl p-1 gap-1">
          {(['pending', 'all'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${
                filter === f ? 'bg-[#D4722A] text-white' : 'text-[#5C5040]'
              }`}
            >
              {f === 'pending' ? 'Menunggu' : 'Semua'}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pt-3 space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-24 bg-white/5 rounded-2xl animate-pulse" />)}
          </div>
        ) : !requests || requests.length === 0 ? (
          <div className="text-center py-12 text-[#5C5040]">
            {filter === 'pending' ? 'Tidak ada yang menunggu approval' : 'Belum ada request'}
          </div>
        ) : (
          requests.map((req) => (
            <div
              key={req.id}
              className="bg-[#231e18] rounded-2xl border border-white/8 p-4 space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#D4722A] truncate">{req.user?.nama_lengkap ?? '—'}</p>
                  <p className="text-sm font-medium text-[#EDE5D8]">{TYPE_LABEL[req.type]}</p>
                  <div className="flex items-center gap-1.5 text-xs text-[#A8967E] mt-0.5">
                    <Calendar className="w-3 h-3" />
                    {fmtDate(req.tanggal_mulai)}
                    {req.tanggal_selesai !== req.tanggal_mulai && ` — ${fmtDate(req.tanggal_selesai)}`}
                  </div>
                  {req.alasan && <p className="text-xs text-[#5C5040] mt-1">{req.alasan}</p>}
                  {req.catatan_approval && (
                    <p className="text-xs text-[#5C5040] italic mt-0.5">"{req.catatan_approval}"</p>
                  )}
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border whitespace-nowrap flex-shrink-0 ${STATUS_STYLE[req.status]}`}>
                  {STATUS_LABEL[req.status]}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {req.document_url && (
                  <a
                    href={req.document_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-[#D4722A] border border-[#D4722A]/30 rounded-lg px-3 py-1.5"
                  >
                    <ExternalLink className="w-3 h-3" />Dokumen
                  </a>
                )}
                {req.status === 'pending' && (
                  <button
                    onClick={() => { setSelected(req); setCatatan('') }}
                    className="ml-auto text-xs text-[#EDE5D8] border border-white/8 rounded-lg px-3 py-1.5 flex items-center gap-1"
                  >
                    <Clock className="w-3 h-3" />Proses
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Approval Modal */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="bg-[#231e18] border-white/8 text-[#EDE5D8]">
          <DialogHeader>
            <DialogTitle className="text-[#EDE5D8]">Proses Permintaan</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-3 py-1">
              <div className="bg-[#1C1712] rounded-xl p-3 space-y-1">
                <p className="text-sm font-semibold text-[#EDE5D8]">{selected.user?.nama_lengkap}</p>
                <p className="text-xs text-[#A8967E]">{TYPE_LABEL[selected.type]}</p>
                <p className="text-xs text-[#5C5040]">
                  {fmtDate(selected.tanggal_mulai)}
                  {selected.tanggal_selesai !== selected.tanggal_mulai && ` — ${fmtDate(selected.tanggal_selesai)}`}
                </p>
                {selected.alasan && <p className="text-xs text-[#A8967E] mt-1">{selected.alasan}</p>}
              </div>
              {selected.document_url && (
                <a
                  href={selected.document_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm text-[#D4722A]"
                >
                  <ExternalLink className="w-4 h-4" />Lihat Dokumen Pendukung
                </a>
              )}
              <div className="space-y-1">
                <Label className="text-xs text-[#A8967E]">Catatan (opsional)</Label>
                <Input
                  placeholder="Catatan untuk pemohon..."
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  className="bg-[#1C1712] border-white/8 text-[#EDE5D8] h-11"
                />
              </div>
            </div>
          )}
          <DialogFooter className="border-t border-white/8 pt-3 gap-2">
            <Button
              onClick={() => handleAction('rejected')}
              disabled={loading}
              variant="ghost"
              className="flex-1 text-red-400 border border-red-500/30 hover:bg-red-900/20"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><XCircle className="w-4 h-4 mr-1" />Tolak</>}
            </Button>
            <Button
              onClick={() => handleAction('approved')}
              disabled={loading}
              className="flex-1 bg-green-700 hover:bg-green-600 text-white"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle2 className="w-4 h-4 mr-1" />Setujui</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
