import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ApprovalsClient from './ApprovalsClient'

export default async function ApprovalsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('m_users').select('role').eq('id', user.id).single()
  if (!profile || !['owner', 'manager'].includes(profile.role)) redirect('/attendance')

  return <ApprovalsClient role={profile.role} />
}
