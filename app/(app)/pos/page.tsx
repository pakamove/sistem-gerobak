import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import POSClient from './POSClient'

export default async function POSPage() {
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
    <POSClient
      profile={{
        id: profile.id as string,
        nama_lengkap: profile.nama_lengkap as string,
        role: profile.role as string,
        lokasi_tugas: profile.lokasi_tugas as string | null,
      }}
    />
  )
}
