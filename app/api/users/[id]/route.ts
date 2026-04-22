import { createAdminClient } from '@/lib/supabase/server'
import {
  getAuthProfile,
  unauthorized,
  forbidden,
  serverError,
  ok,
  badRequest,
  notFound,
} from '@/lib/supabase/auth-helpers'

const VALID_ROLES = ['owner', 'manager', 'purchaser', 'koki', 'crew_gerobak', 'delivery']

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const profile = await getAuthProfile()
  if (!profile) return unauthorized()
  if (!['owner', 'manager'].includes(profile.role)) return forbidden()

  const { id } = await context.params

  try {
    const body = await request.json()
    const { nama_lengkap, role, lokasi_tugas, no_hp, is_active, password } = body

    const admin = createAdminClient()

    const { data: existing } = await admin
      .from('m_users')
      .select('id, role')
      .eq('id', id)
      .single()

    if (!existing) return notFound('User tidak ditemukan')

    // Manager tidak bisa edit owner
    if (profile.role === 'manager' && existing.role === 'owner') return forbidden()

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (nama_lengkap?.trim()) updateData.nama_lengkap = nama_lengkap.trim()
    if (role && VALID_ROLES.includes(role)) updateData.role = role
    if (lokasi_tugas !== undefined) updateData.lokasi_tugas = lokasi_tugas || null
    if (no_hp !== undefined) updateData.no_hp = no_hp?.trim() || null
    if (is_active !== undefined) updateData.is_active = is_active

    const { data: user, error } = await admin
      .from('m_users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // Update password jika disediakan
    if (password && password.length >= 6) {
      await admin.auth.admin.updateUserById(id, { password })
    }

    return ok({ user }, 'User berhasil diperbarui')
  } catch (err) {
    console.error('PATCH /api/users/[id] error:', err)
    return serverError()
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const profile = await getAuthProfile()
  if (!profile) return unauthorized()
  if (profile.role !== 'owner') return forbidden()

  const { id } = await context.params

  if (id === profile.id) return badRequest('Tidak bisa menghapus akun sendiri')

  try {
    const admin = createAdminClient()

    // Soft-delete: set is_active = false
    const { error } = await admin
      .from('m_users')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) throw error

    // Disable auth user
    await admin.auth.admin.updateUserById(id, { ban_duration: '876600h' })

    return ok({}, 'User berhasil dinonaktifkan')
  } catch (err) {
    console.error('DELETE /api/users/[id] error:', err)
    return serverError()
  }
}
