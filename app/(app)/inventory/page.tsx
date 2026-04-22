import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import InventoryClient from './InventoryClient'

export default async function InventoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('m_users')
    .select('id, role, nama_lengkap')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  const canAdd = ['owner', 'manager', 'purchaser'].includes(profile.role)

  return <InventoryClient role={profile.role} canAdd={canAdd} />
}
