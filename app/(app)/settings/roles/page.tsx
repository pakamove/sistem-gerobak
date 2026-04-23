import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import RolesClient from './RolesClient'

export default async function RolesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('m_users').select('role').eq('id', user.id).single()
  if (!profile || profile.role !== 'owner') redirect('/settings')

  return <RolesClient />
}
