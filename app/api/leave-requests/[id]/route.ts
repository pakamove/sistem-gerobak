import { createAdminClient } from '@/lib/supabase/server'
import { getAuthProfile, unauthorized, forbidden, serverError, ok, badRequest } from '@/lib/supabase/auth-helpers'

// PATCH: approve atau reject
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
    const { action, catatan_approval } = body

    if (!action || !['approved', 'rejected'].includes(action)) {
      return badRequest('action harus "approved" atau "rejected"')
    }

    const admin = createAdminClient()

    // Ambil request dulu untuk validasi approval hierarchy
    const { data: leaveReq } = await admin
      .from('t_leave_requests')
      .select(`*, user:m_users!user_id(id, role)`)
      .eq('id', id)
      .single()

    if (!leaveReq) return badRequest('Request tidak ditemukan')
    if (leaveReq.status !== 'pending') return badRequest('Request sudah diproses')

    // Manager tidak bisa approve request dari owner
    const requesterRole = leaveReq.user?.role
    if (profile.role === 'manager' && requesterRole === 'owner') {
      return forbidden()
    }

    const { data, error } = await admin
      .from('t_leave_requests')
      .update({
        status: action,
        approved_by: profile.id,
        approved_at: new Date().toISOString(),
        catatan_approval: catatan_approval?.trim() || null,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    const msg = action === 'approved' ? 'Permintaan disetujui' : 'Permintaan ditolak'
    return ok({ request: data }, msg)
  } catch (err) {
    console.error('PATCH /api/leave-requests/[id] error:', err)
    return serverError()
  }
}
