'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import TopHeader from '@/components/layout/TopHeader'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { LogOut, User, MapPin, Phone, Shield, Loader2 } from 'lucide-react'

const roleLabel: Record<string, string> = {
  owner: 'Owner',
  manager: 'Manager Ops',
  purchaser: 'Purchaser',
  koki: 'Koki',
  crew_gerobak: 'Crew Gerobak',
  delivery: 'Delivery',
}

const lokasiLabel: Record<string, string> = {
  central_kitchen: 'Central Kitchen',
  gerobak_1: 'Gerobak 1',
  gerobak_2: 'Gerobak 2',
  gerobak_3: 'Gerobak 3',
  mobile: 'Mobile',
}

interface Props {
  profile: {
    id: string
    nama_lengkap: string
    role: string
    lokasi_tugas: string | null
    no_hp: string | null
    email: string
  }
}

export default function SettingsClient({ profile }: Props) {
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)

  const handleLogout = async () => {
    setLoggingOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    toast.success('Berhasil logout')
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="min-h-full">
      <TopHeader title="Profil" subtitle="Informasi Akun" />

      <div className="px-4 pt-6 space-y-4">
        {/* Profile Card */}
        <div className="bg-[#231e18] rounded-2xl p-5 border border-white/8 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-[#D4722A]/20 rounded-2xl flex items-center justify-center">
              <span className="text-2xl font-bold text-[#D4722A]">
                {profile.nama_lengkap.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h2 className="font-bold text-[#EDE5D8] text-lg leading-tight">{profile.nama_lengkap}</h2>
              <p className="text-sm text-[#A8967E]">{profile.email}</p>
            </div>
          </div>

          <div className="space-y-3 pt-2 border-t border-white/8">
            <div className="flex items-center gap-3">
              <Shield className="w-4 h-4 text-[#A8967E] flex-shrink-0" />
              <div>
                <p className="text-xs text-[#5C5040]">Role</p>
                <p className="text-sm font-medium text-[#EDE5D8]">{roleLabel[profile.role] || profile.role}</p>
              </div>
            </div>
            {profile.lokasi_tugas && (
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-[#A8967E] flex-shrink-0" />
                <div>
                  <p className="text-xs text-[#5C5040]">Lokasi Tugas</p>
                  <p className="text-sm font-medium text-[#EDE5D8]">{lokasiLabel[profile.lokasi_tugas] || profile.lokasi_tugas}</p>
                </div>
              </div>
            )}
            {profile.no_hp && (
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-[#A8967E] flex-shrink-0" />
                <div>
                  <p className="text-xs text-[#5C5040]">No. HP</p>
                  <p className="text-sm font-medium text-[#EDE5D8]">{profile.no_hp}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* App Info */}
        <div className="bg-[#231e18] rounded-xl p-4 border border-white/8">
          <p className="text-xs text-[#5C5040] text-center">
            {process.env.NEXT_PUBLIC_APP_NAME} v{process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0'}
          </p>
        </div>

        {/* Logout */}
        <Button
          onClick={handleLogout}
          disabled={loggingOut}
          variant="destructive"
          className="w-full h-12 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30"
        >
          {loggingOut ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Logout...</>
          ) : (
            <><LogOut className="w-4 h-4 mr-2" />Logout</>
          )}
        </Button>
      </div>
    </div>
  )
}
