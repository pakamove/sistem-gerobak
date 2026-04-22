import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SuppliersClient from './SuppliersClient'

export default async function SuppliersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('m_users').select('role').eq('id', user.id).single()
  if (!profile || !['owner', 'manager', 'purchaser'].includes(profile.role)) redirect('/settings')

  return <SuppliersClient />
}
