import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'
import BottomNav from '@/components/layout/BottomNav'
import SideNav from '@/components/layout/SideNav'
import ClockInPopup from '@/components/attendance/ClockInPopup'
import type { AppModule } from '@/lib/types'

// Fallback static modules per role (sebelum DB di-setup)
function getLegacyModules(role: string): AppModule[] {
  const all: AppModule[] = [
    { key: 'pos', label: 'POS', href: '/pos', icon_name: 'ShoppingCart', kategori: 'operational', urutan: 1 },
    { key: 'kitchen', label: 'Dapur', href: '/kitchen', icon_name: 'ChefHat', kategori: 'operational', urutan: 2 },
    { key: 'inventory', label: 'Stok', href: '/inventory', icon_name: 'Package', kategori: 'operational', urutan: 3 },
    { key: 'purchasing', label: 'Pembelian', href: '/purchasing', icon_name: 'ShoppingBag', kategori: 'operational', urutan: 4 },
    { key: 'attendance', label: 'Absensi', href: '/attendance', icon_name: 'ClipboardCheck', kategori: 'operational', urutan: 5 },
    { key: 'dashboard', label: 'Dashboard', href: '/dashboard', icon_name: 'LayoutDashboard', kategori: 'management', urutan: 6 },
    { key: 'reports', label: 'Laporan', href: '/reports', icon_name: 'BarChart3', kategori: 'management', urutan: 7 },
    { key: 'settings', label: 'Pengaturan', href: '/settings', icon_name: 'Settings', kategori: 'settings', urutan: 8 },
  ]
  const map: Record<string, string[]> = {
    owner:        ['pos', 'kitchen', 'inventory', 'purchasing', 'attendance', 'dashboard', 'reports', 'settings'],
    manager:      ['pos', 'kitchen', 'inventory', 'purchasing', 'attendance', 'dashboard', 'reports', 'settings'],
    purchaser:    ['inventory', 'purchasing', 'attendance', 'settings'],
    koki:         ['kitchen', 'inventory', 'attendance', 'settings'],
    crew_gerobak: ['pos', 'attendance', 'settings'],
    delivery:     ['pos', 'attendance', 'settings'],
  }
  const allowed = map[role] ?? ['settings']
  return all.filter((m) => allowed.includes(m.key))
}

const PLANNER_ROLES = ['owner', 'manager', 'purchaser']

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('m_users')
    .select('id, role, nama_lengkap')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  // Cek absensi hari ini untuk popup clock-in
  const today = new Date().toISOString().split('T')[0]
  let needsClockIn = false
  if (profile.role !== 'owner') {
    try {
      const { data: todayAbs } = await admin
        .from('t_absensi')
        .select('id, jam_masuk')
        .eq('karyawan_id', profile.id)
        .eq('tanggal', today)
        .single()
      needsClockIn = !todayAbs?.jam_masuk
    } catch {
      needsClockIn = true
    }
  }

  let uiType: 'executor' | 'planner' = PLANNER_ROLES.includes(profile.role) ? 'planner' : 'executor'
  let modules: AppModule[] = getLegacyModules(profile.role)
  let roleDisplayName: string = profile.role

  try {
    const [roleRes, moduleKeysRes] = await Promise.all([
      admin.from('m_roles').select('ui_type, display_name').eq('id', profile.role).single(),
      admin.from('m_role_modules').select('module_key').eq('role_id', profile.role),
    ])

    if (roleRes.data) {
      uiType = roleRes.data.ui_type as 'executor' | 'planner'
      roleDisplayName = roleRes.data.display_name
    }

    if (moduleKeysRes.data && moduleKeysRes.data.length > 0) {
      const keys = moduleKeysRes.data.map((m) => m.module_key)
      const { data: mods } = await admin
        .from('m_modules')
        .select('*')
        .in('key', keys)
        .order('urutan')
      if (mods && mods.length > 0) modules = mods as AppModule[]
    }
  } catch {
    // m_roles/m_modules belum dibuat, gunakan legacy fallback
  }

  if (uiType === 'planner') {
    return (
      <div className="flex h-screen bg-[#1C1712] overflow-hidden">
        <SideNav
          modules={modules}
          role={profile.role}
          roleName={roleDisplayName}
          userName={profile.nama_lengkap}
        />
        <main className="flex-1 overflow-y-auto min-w-0">
          {children}
        </main>
        {needsClockIn && <ClockInPopup userName={profile.nama_lengkap} />}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#1C1712] flex flex-col">
      <main className="flex-1 pb-20">{children}</main>
      <BottomNav modules={modules} role={profile.role} />
      {needsClockIn && <ClockInPopup userName={profile.nama_lengkap} />}
    </div>
  )
}
