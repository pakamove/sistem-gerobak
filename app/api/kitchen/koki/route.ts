import { createClient } from '@/lib/supabase/server'
import { getAuthProfile, unauthorized, ok, serverError } from '@/lib/supabase/auth-helpers'

export async function GET() {
  const profile = await getAuthProfile()
  if (!profile) return unauthorized()

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('m_users')
    .select('id, nama_lengkap')
    .eq('role', 'koki')
    .eq('is_active', true)
    .order('nama_lengkap')

  if (error) return serverError()
  return ok({ koki: data })
}
