import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PurchasingClient from './PurchasingClient'

export default async function PurchasingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('m_users')
    .select('id, role')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  return <PurchasingClient role={profile.role} />
}
