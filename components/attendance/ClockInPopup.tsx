'use client'

import { useState, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Loader2, LogIn, MapPin, X } from 'lucide-react'

interface Props {
  userName: string
}

async function getGps(): Promise<{ latitude: number; longitude: number } | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null)
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ latitude: p.coords.latitude, longitude: p.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 8000 }
    )
  })
}

export default function ClockInPopup({ userName }: Props) {
  const qc = useQueryClient()
  const [open, setOpen] = useState(true)
  const [loading, setLoading] = useState(false)

  // Unmount seluruh Dialog saat closed — mencegah backdrop base-ui
  // tetap ada di DOM dan block klik elemen di bawahnya
  if (!open) return null

  const handleClockIn = useCallback(async () => {
    setLoading(true)
    try {
      const gps = await getGps()
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'in', ...gps }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.message)
      toast.success(json.message)
      qc.invalidateQueries({ queryKey: ['att-today'] })
      setOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal clock in')
    } finally {
      setLoading(false)
    }
  }, [qc])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className="bg-[#231e18] border-white/8 text-[#EDE5D8] max-w-sm"
      >
        <DialogHeader>
          <DialogTitle className="text-[#EDE5D8] flex items-center gap-2">
            <MapPin className="w-5 h-5 text-[#D4722A]" />
            Selamat Datang!
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-1">
          <p className="text-sm text-[#A8967E]">
            Halo <span className="font-semibold text-[#EDE5D8]">{userName}</span>, kamu belum absen hari ini.
          </p>
          <div className="bg-[#1C1712] rounded-xl p-3 flex items-start gap-2">
            <MapPin className="w-4 h-4 text-[#D4722A] mt-0.5 flex-shrink-0" />
            <p className="text-xs text-[#A8967E]">
              Lokasi GPS akan direkam otomatis. Pastikan izin lokasi diaktifkan.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={() => setOpen(false)}
              className="flex-1 text-[#5C5040] border border-white/8"
            >
              <X className="w-4 h-4 mr-1" />Nanti
            </Button>
            <Button
              onClick={handleClockIn}
              disabled={loading}
              className="flex-1 bg-green-700 hover:bg-green-600 text-white font-semibold"
            >
              {loading
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <><LogIn className="w-4 h-4 mr-1" />Clock In Sekarang</>
              }
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
