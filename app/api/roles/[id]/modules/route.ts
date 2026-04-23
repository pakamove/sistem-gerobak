import { createAdminClient } from '@/lib/supabase/server'
import { getAuthProfile, unauthorized, forbidden, serverError, ok, badRequest } from '@/lib/supabase/auth-helpers'

// GET: modul yang diakses role ini
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const profile = await getAuthProfile()
  if (!profile) return unauthorized()
  if (!['owner', 'manager'].includes(profile.role)) return forbidden()

  const { id } = await context.params
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('m_role_modules')
      .select('module_key')
      .eq('role_id', id)

    if (error) throw error
    return ok({ module_keys: (data ?? []).map((r) => r.module_key) })
  } catch (err) {
    console.error('GET /api/roles/[id]/modules error:', err)
    return serverError()
  }
}

// PUT: replace full module list untuk role ini
export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const profile = await getAuthProfile()
  if (!profile) return unauthorized()
  if (!['owner'].includes(profile.role)) return forbidden()

  const { id } = await context.params
  try {
    const body = await request.json()
    const { module_keys } = body

    if (!Array.isArray(module_keys)) return badRequest('module_keys harus berupa array')

    const admin = createAdminClient()

    // Hapus semua modul lama
    await admin.from('m_role_modules').delete().eq('role_id', id)

    // Insert modul baru
    if (module_keys.length > 0) {
      const insertData = module_keys.map((key: string) => ({
        role_id: id,
        module_key: key,
      }))
      const { error } = await admin.from('m_role_modules').insert(insertData)
      if (error) throw error
    }

    return ok({ module_keys }, 'Akses modul berhasil diperbarui')
  } catch (err) {
    console.error('PUT /api/roles/[id]/modules error:', err)
    return serverError()
  }
}
