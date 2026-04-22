'use client'

import { useState, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import TopHeader from '@/components/layout/TopHeader'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Loader2, MapPin, LogIn, LogOut, Clock, CheckCircle2, AlertCircle } from 'lucide-react'
import { formatDate, formatTime, getTodayDate } from '@/lib/utils/format'

interface Profile {
  id: string
  nama_lengkap: string
  role: string
  lokasi_tugas: string | null
}

interface AbsensiRecord {
  id: string
  user_id: string
  tanggal: string
  clock_in: string
  clock_out: string | null
  latitude_in: number | null
  longitude_in: number | null
  durasi_menit: number | null
  status: string
  catatan: string | null
  user?: { id: string; nama_lengkap: string; role: string }
}

interface Props { profile: Profile }

async function getLocation(): Promise<{ latitude: number; longitude: number } | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) { resolve(null); return }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      () => resolve(null),
      { timeout: 10_000 }
    )
  })
}

export default function AttendanceClient({ profile }: Props) {
  const queryClient = useQueryClient()
  const [loading, setLoading] = useState(false)
  const [locationLoading, setLocationLoading] = useState(false)

  const today = getTodayDate()

  const { data: todayAbsensi, isLoading } = useQuery<AbsensiRecord | null>({
    queryKey: ['attendance-today', profile.id, today],
    queryFn: async () => {
      const res = await fetch(`/api/attendance?date=${today}&user_id=${profile.id}`)
      const json = await res.json()
      const list: AbsensiRecord[] = json.data?.absensi ?? []
      return list.find((a) => a.user_id === profile.id) ?? null
    },
    refetchInterval: 60_000,
  })

  const { data: historyList } = useQuery<AbsensiRecord[]>({
    queryKey: ['attendance-history', profile.id],
    queryFn: async () => {
      const res = await fetch(`/api/attendance?user_id=${profile.id}`)
      const json = await res.json()
      return json.data?.absensi ?? []
    },
  })

  const handleAction = useCallback(async (action: 'clock_in' | 'clock_out') => {
    setLoading(true)
    setLocationLoading(true)
    try {
      const location = await getLocation()
      setLocationLoading(false)

      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...location }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.message)

      toast.success(json.message)
      queryClient.invalidateQueries({ queryKey: ['attendance-today'] })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal mencatat absensi')
    } finally {
      setLoading(false)
      setLocationLoading(false)
    }
  }, [queryClient])

  const isClockedIn = !!todayAbsensi?.clock_in
  const isClockedOut = !!todayAbsensi?.clock_out
  const durasiFmt = todayAbsensi?.durasi_menit
    ? `${Math.floor(todayAbsensi.durasi_menit / 60)}j ${todayAbsensi.durasi_menit % 60}m`
    : null

  return (
    <div className="min-h-full pb-8">
      <TopHeader title="Absensi" subtitle={formatDate(today)} />

      <div className="px-4 pt-5 space-y-4">
        {/* Status Card */}
        <div className="bg-[#231e18] rounded-2xl border border-white/8 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-[#EDE5D8]">{profile.nama_lengkap}</p>
              <p className="text-xs text-[#A8967E] capitalize">{profile.role.replace('_', ' ')}</p>
            </div>
            {isLoading ? (
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

          {/* Time info */}
          {todayAbsensi && (
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#1C1712] rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <LogIn className="w-3 h-3 text-green-400" />
                  <p className="text-[10px] text-[#A8967E]">Masuk</p>
                </div>
                <p className="text-sm font-bold text-[#EDE5D8]">{formatTime(todayAbsensi.clock_in)}</p>
                {todayAbsensi.latitude_in && (
                  <p className="text-[10px] text-[#5C5040] mt-0.5 flex items-center gap-1">
                    <MapPin className="w-2.5 h-2.5" />
                    Lokasi terekam
                  </p>
                )}
              </div>
              <div className="bg-[#1C1712] rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <LogOut className="w-3 h-3 text-red-400" />
                  <p className="text-[10px] text-[#A8967E]">Keluar</p>
                </div>
                {todayAbsensi.clock_out ? (
                  <>
                    <p className="text-sm font-bold text-[#EDE5D8]">{formatTime(todayAbsensi.clock_out)}</p>
                    {durasiFmt && (
                      <p className="text-[10px] text-[#D4722A] mt-0.5 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />{durasiFmt}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-[#5C5040]">—</p>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {!isLoading && (
            <div className="space-y-2">
              {!isClockedIn && (
                <Button
                  onClick={() => handleAction('clock_in')}
                  disabled={loading}
                  className="w-full h-12 bg-green-700 hover:bg-green-600 text-white font-semibold"
                >
                  {loading && locationLoading ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Mengambil lokasi...</>
                  ) : loading ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Mencatat...</>
                  ) : (
                    <><LogIn className="w-4 h-4 mr-2" />Clock In</>
                  )}
                </Button>
              )}
              {isClockedIn && !isClockedOut && (
                <Button
                  onClick={() => handleAction('clock_out')}
                  disabled={loading}
                  variant="destructive"
                  className="w-full h-12 bg-red-700 hover:bg-red-600 text-white font-semibold"
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Mencatat...</>
                  ) : (
                    <><LogOut className="w-4 h-4 mr-2" />Clock Out</>
                  )}
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="bg-[#1C1712] rounded-xl px-4 py-3 flex items-start gap-2">
          <MapPin className="w-4 h-4 text-[#D4722A] mt-0.5 flex-shrink-0" />
          <p className="text-xs text-[#A8967E]">
            Lokasi GPS akan direkam otomatis saat clock in/out. Pastikan akses lokasi diizinkan di browser.
          </p>
        </div>

        {/* History */}
        {(historyList?.length ?? 0) > 0 && (
          <div className="bg-[#231e18] rounded-2xl border border-white/8 overflow-hidden">
            <div className="px-4 py-3 border-b border-white/8">
              <p className="text-sm font-semibold text-[#EDE5D8]">Riwayat Absensi</p>
            </div>
            <div className="divide-y divide-white/8">
              {historyList!.slice(0, 7).map((a) => (
                <div key={a.id} className="px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-[#EDE5D8]">{formatDate(a.tanggal)}</p>
                    <p className="text-[10px] text-[#A8967E]">
                      {formatTime(a.clock_in)} — {a.clock_out ? formatTime(a.clock_out) : 'Belum clock out'}
                    </p>
                  </div>
                  {a.durasi_menit && (
                    <span className="text-xs text-[#D4722A] font-medium">
                      {Math.floor(a.durasi_menit / 60)}j {a.durasi_menit % 60}m
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
