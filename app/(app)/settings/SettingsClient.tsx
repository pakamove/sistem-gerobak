'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import TopHeader from '@/components/layout/TopHeader'
import { Button } from '@/components/ui/button'
import CloseShiftModal from '@/components/pos/CloseShiftModal'
import RecentTransactions from '@/components/pos/RecentTransactions'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { formatRupiah } from '@/lib/utils/format'
import {
  LogOut, User, MapPin, Phone, Shield, Loader2,
  Users, Package, ShoppingBag, Truck, ChefHat, Wrench,
  BarChart2, Clock, Store, AlertCircle,
} from 'lucide-react'
import type { Shift } from '@/lib/types'

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

async function fetchActiveShift(): Promise<Shift | null> {
  const res = await fetch('/api/pos/shift')
  if (res.status === 404) return null
  if (!res.ok) return null
  const json = await res.json()
  return json.data?.shift ?? null
}

const OWNER_MANAGER_ROLES = ['owner', 'manager']
const POS_ROLES = ['owner', 'crew_gerobak', 'delivery']

const settingsMenus = [
  {
    label: 'Kelola Pengguna',
    desc: 'Tambah & atur user, role, dan akses',
    href: '/settings/users',
    icon: Users,
    roles: ['owner', 'manager'],
  },
  {
    label: 'Kelola Menu & Resep',
    desc: 'Tambah menu, resep, dan HPP',
    href: '/settings/menus',
    icon: ChefHat,
    roles: ['owner', 'manager'],
  },
  {
    label: 'Kelola Bahan Baku',
    desc: 'Tambah & atur bahan baku inventaris',
    href: '/settings/inventory',
    icon: Package,
    roles: ['owner', 'manager', 'purchaser'],
  },
  {
    label: 'Kelola Supplier',
    desc: 'Data supplier dan kontak',
    href: '/settings/suppliers',
    icon: Truck,
    roles: ['owner', 'manager', 'purchaser'],
  },
  {
    label: 'Kelola Aset',
    desc: 'Aset & penyusutan',
    href: '/settings/assets',
    icon: Wrench,
    roles: ['owner', 'manager'],
  },
  {
    label: 'Laporan',
    desc: 'Penjualan, pengeluaran, dan labor cost',
    href: '/reports',
    icon: BarChart2,
    roles: ['owner', 'manager'],
  },
]

export default function SettingsClient({ profile }: Props) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [loggingOut, setLoggingOut] = useState(false)
  const [showCloseShift, setShowCloseShift] = useState(false)

  const { data: activeShift } = useQuery<Shift | null>({
    queryKey: ['shift'],
    queryFn: fetchActiveShift,
    staleTime: 0,
    enabled: POS_ROLES.includes(profile.role),
  })

  const handleLogout = async () => {
    setLoggingOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    toast.success('Berhasil logout')
    router.push('/login')
    router.refresh()
  }

  const handleCloseShiftSuccess = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['shift'] })
    queryClient.invalidateQueries({ queryKey: ['pos-transactions'] })
  }, [queryClient])

  const visibleSettings = settingsMenus.filter((m) => m.roles.includes(profile.role))

  return (
    <div className="min-h-full pb-8">
      <TopHeader title="Profil" subtitle="Pengaturan Akun" />

      <div className="px-4 pt-5 space-y-4">
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

        {/* Shift Summary — untuk POS roles */}
        {POS_ROLES.includes(profile.role) && (
          <div className="bg-[#231e18] rounded-2xl border border-white/8 overflow-hidden">
            <div className="px-4 py-3 border-b border-white/8 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Store className="w-4 h-4 text-[#D4722A]" />
                <p className="text-sm font-semibold text-[#EDE5D8]">Status Shift</p>
              </div>
              {activeShift ? (
                <div className="flex items-center gap-1.5 bg-green-900/30 border border-green-500/30 rounded-full px-2.5 py-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-[10px] font-semibold text-green-400">Aktif</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 bg-red-900/20 border border-red-500/20 rounded-full px-2.5 py-1">
                  <AlertCircle className="w-3 h-3 text-red-400" />
                  <span className="text-[10px] font-semibold text-red-400">Tidak Ada Shift</span>
                </div>
              )}
            </div>

            {activeShift ? (
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#1C1712] rounded-xl p-3">
                    <p className="text-xs text-[#A8967E]">Dibuka</p>
                    <p className="text-sm font-semibold text-[#EDE5D8]">
                      {activeShift.waktu_buka
                        ? new Date(activeShift.waktu_buka).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                        : '—'}
                    </p>
                  </div>
                  <div className="bg-[#1C1712] rounded-xl p-3">
                    <p className="text-xs text-[#A8967E]">Cash Awal</p>
                    <p className="text-sm font-semibold text-[#EDE5D8]">{formatRupiah(activeShift.cash_awal)}</p>
                  </div>
                </div>
                <Button
                  onClick={() => setShowCloseShift(true)}
                  variant="destructive"
                  className="w-full bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-500/30"
                >
                  Tutup Shift
                </Button>
              </div>
            ) : (
              <div className="p-4">
                <p className="text-xs text-[#5C5040] text-center">Buka shift dari halaman POS</p>
              </div>
            )}

            {/* Recent Transactions */}
            {activeShift && (
              <div className="border-t border-white/8">
                <div className="px-4 pt-3 pb-1 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#A8967E]" />
                  <p className="text-sm font-semibold text-[#EDE5D8]">Transaksi Terbaru</p>
                </div>
                <RecentTransactions shiftId={activeShift.id} />
              </div>
            )}
          </div>
        )}

        {/* Settings Menu — untuk owner/manager/purchaser */}
        {visibleSettings.length > 0 && (
          <div className="bg-[#231e18] rounded-2xl border border-white/8 overflow-hidden">
            <div className="px-4 py-3 border-b border-white/8">
              <p className="text-sm font-semibold text-[#EDE5D8]">Pengaturan</p>
            </div>
            <div className="divide-y divide-white/8">
              {visibleSettings.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 px-4 py-3.5 active:bg-white/5 transition-colors"
                >
                  <div className="w-9 h-9 bg-[#2C1810] rounded-xl flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-4 h-4 text-[#D4722A]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#EDE5D8]">{item.label}</p>
                    <p className="text-xs text-[#5C5040] truncate">{item.desc}</p>
                  </div>
                  <span className="text-[#5C5040] text-lg">›</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Attendance link */}
        <Link
          href="/attendance"
          className="flex items-center gap-3 bg-[#231e18] rounded-2xl border border-white/8 px-4 py-3.5 active:bg-white/5 transition-colors"
        >
          <div className="w-9 h-9 bg-[#2C1810] rounded-xl flex items-center justify-center flex-shrink-0">
            <User className="w-4 h-4 text-[#D4722A]" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-[#EDE5D8]">Absensi</p>
            <p className="text-xs text-[#5C5040]">Clock in & clock out harian</p>
          </div>
          <span className="text-[#5C5040] text-lg">›</span>
        </Link>

        {/* App Info */}
        <div className="bg-[#231e18] rounded-xl p-4 border border-white/8">
          <p className="text-xs text-[#5C5040] text-center">
            Sistem Gerobak · v2.0.0
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

      {/* Close Shift Modal */}
      {activeShift && showCloseShift && (
        <CloseShiftModal
          open={showCloseShift}
          shift={activeShift}
          onClose={() => setShowCloseShift(false)}
          onSuccess={handleCloseShiftSuccess}
        />
      )}
    </div>
  )
}
