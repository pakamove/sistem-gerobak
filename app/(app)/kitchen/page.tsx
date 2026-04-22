import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import KitchenClient from './KitchenClient'

export default async function KitchenPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('m_users')
    .select('id, nama_lengkap, role, lokasi_tugas')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  return (
    <KitchenClient
      role={profile.role as string}
      userId={profile.id as string}
    />
  )
}
