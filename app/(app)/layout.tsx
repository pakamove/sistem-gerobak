import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import BottomNav from '@/components/layout/BottomNav'
import { UserRole } from '@/lib/types'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('m_users')
    .select('role, nama_lengkap, lokasi_tugas')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  return (
    <div className="min-h-screen bg-[#1C1712] flex flex-col">
      <main className="flex-1 pb-20">{children}</main>
      <BottomNav role={profile.role as UserRole} />
    </div>
  )
}
