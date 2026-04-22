import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AssetsClient from './AssetsClient'

export default async function AssetsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('m_users').select('role').eq('id', user.id).single()
  if (!profile || !['owner', 'manager'].includes(profile.role)) redirect('/settings')

  return <AssetsClient />
}
