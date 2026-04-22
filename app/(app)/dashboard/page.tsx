import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('m_users')
    .select('id, role, nama_lengkap')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')
  if (!['owner', 'manager'].includes(profile.role)) redirect('/pos')

  return <DashboardClient namaUser={profile.nama_lengkap} />
}
