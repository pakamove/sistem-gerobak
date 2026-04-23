import { createAdminClient } from '@/lib/supabase/server'
import { getAuthProfile, unauthorized, forbidden, serverError, ok, badRequest } from '@/lib/supabase/auth-helpers'

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const profile = await getAuthProfile()
  if (!profile) return unauthorized()
  if (!['owner'].includes(profile.role)) return forbidden()

  const { id } = await context.params
  try {
    const body = await request.json()
    const { display_name, ui_type, color, deskripsi } = body

    const admin = createAdminClient()
    const updates: Record<string, unknown> = {}
    if (display_name) updates.display_name = display_name.trim()
    if (ui_type) {
      if (!['executor', 'planner'].includes(ui_type)) return badRequest('ui_type tidak valid')
      updates.ui_type = ui_type
    }
    if (color !== undefined) updates.color = color
    if (deskripsi !== undefined) updates.deskripsi = deskripsi?.trim() || null

    const { data, error } = await admin
      .from('m_roles')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return ok({ role: data }, 'Role diperbarui')
  } catch (err) {
    console.error('PATCH /api/roles/[id] error:', err)
    return serverError()
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const profile = await getAuthProfile()
  if (!profile) return unauthorized()
  if (!['owner'].includes(profile.role)) return forbidden()

  const { id } = await context.params
  try {
    const admin = createAdminClient()

    // Cek system role tidak boleh dihapus
    const { data: role } = await admin.from('m_roles').select('is_system').eq('id', id).single()
    if (role?.is_system) return badRequest('Role sistem tidak bisa dihapus')

    // Cek ada user yang pakai role ini
    const { count } = await admin.from('m_users').select('id', { count: 'exact', head: true }).eq('role', id)
    if ((count ?? 0) > 0) return badRequest(`Role ini masih dipakai oleh ${count} user`)

    const { error } = await admin.from('m_roles').delete().eq('id', id)
    if (error) throw error

    return ok({}, 'Role berhasil dihapus')
  } catch (err) {
    console.error('DELETE /api/roles/[id] error:', err)
    return serverError()
  }
}
