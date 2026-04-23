import { createAdminClient } from '@/lib/supabase/server'
import { getAuthProfile, unauthorized, forbidden, serverError, ok, badRequest } from '@/lib/supabase/auth-helpers'

export async function GET() {
  const profile = await getAuthProfile()
  if (!profile) return unauthorized()
  if (!['owner', 'manager'].includes(profile.role)) return forbidden()

  try {
    const admin = createAdminClient()
    const { data: roles, error } = await admin
      .from('m_roles')
      .select('*')
      .order('created_at')

    if (error) throw error

    // Sertakan modul per role
    const { data: roleModules } = await admin
      .from('m_role_modules')
      .select('role_id, module_key')

    const modulesByRole = (roleModules ?? []).reduce((acc, rm) => {
      if (!acc[rm.role_id]) acc[rm.role_id] = []
      acc[rm.role_id].push(rm.module_key)
      return acc
    }, {} as Record<string, string[]>)

    const result = (roles ?? []).map((r) => ({
      ...r,
      modules: modulesByRole[r.id] ?? [],
    }))

    return ok({ roles: result })
  } catch (err) {
    console.error('GET /api/roles error:', err)
    return serverError()
  }
}

export async function POST(request: Request) {
  const profile = await getAuthProfile()
  if (!profile) return unauthorized()
  if (!['owner'].includes(profile.role)) return forbidden()

  try {
    const body = await request.json()
    const { id, display_name, ui_type, color, deskripsi } = body

    if (!id?.trim()) return badRequest('ID role wajib diisi')
    if (!display_name?.trim()) return badRequest('Nama role wajib diisi')
    if (!['executor', 'planner'].includes(ui_type)) return badRequest('ui_type harus executor atau planner')

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('m_roles')
      .insert({
        id: id.trim().toLowerCase().replace(/\s+/g, '_'),
        display_name: display_name.trim(),
        ui_type,
        color: color || '#6B7280',
        deskripsi: deskripsi?.trim() || null,
        is_system: false,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') return badRequest('ID role sudah digunakan')
      throw error
    }

    return ok({ role: data }, 'Role berhasil dibuat')
  } catch (err) {
    console.error('POST /api/roles error:', err)
    return serverError()
  }
}
