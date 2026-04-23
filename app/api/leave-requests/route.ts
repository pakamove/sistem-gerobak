import { createAdminClient } from '@/lib/supabase/server'
import { getAuthProfile, unauthorized, forbidden, serverError, ok, badRequest } from '@/lib/supabase/auth-helpers'

// GET: list leave requests
export async function GET(request: Request) {
  const profile = await getAuthProfile()
  if (!profile) return unauthorized()

  const { searchParams } = new URL(request.url)
  const pending = searchParams.get('pending') === '1'
  const isManagerOrOwner = ['owner', 'manager'].includes(profile.role)

  try {
    const admin = createAdminClient()
    let query = admin
      .from('t_leave_requests')
      .select(`*, user:m_users!user_id(id, nama_lengkap, role)`)
      .order('created_at', { ascending: false })

    if (pending && isManagerOrOwner) {
      // Approval queue: manager lihat semua pending kecuali milik owner
      // owner lihat semua pending
      query = query.eq('status', 'pending')
      if (profile.role === 'manager') {
        // Manager tidak approve request dari owner
        const { data: ownerIds } = await admin
          .from('m_users')
          .select('id')
          .eq('role', 'owner')
        const ids = (ownerIds ?? []).map((u) => u.id)
        if (ids.length > 0) query = query.not('user_id', 'in', `(${ids.join(',')})`)
      }
    } else if (!isManagerOrOwner) {
      query = query.eq('user_id', profile.id)
    }

    const { data, error } = await query
    if (error) throw error
    return ok({ requests: data ?? [] })
  } catch (err) {
    console.error('GET /api/leave-requests error:', err)
    return serverError()
  }
}

// POST: buat request baru
export async function POST(request: Request) {
  const profile = await getAuthProfile()
  if (!profile) return unauthorized()
  if (profile.role === 'owner') return forbidden()

  try {
    const body = await request.json()
    const { type, tanggal_mulai, tanggal_selesai, alasan, document_url } = body

    if (!type || !['cuti', 'sakit', 'izin_lain'].includes(type)) {
      return badRequest('Tipe tidak valid (cuti / sakit / izin_lain)')
    }
    if (!tanggal_mulai || !tanggal_selesai) {
      return badRequest('Tanggal mulai dan selesai wajib diisi')
    }
    if (tanggal_selesai < tanggal_mulai) {
      return badRequest('Tanggal selesai tidak boleh sebelum tanggal mulai')
    }

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('t_leave_requests')
      .insert({
        user_id: profile.id,
        type,
        tanggal_mulai,
        tanggal_selesai,
        alasan: alasan?.trim() || null,
        document_url: document_url || null,
        status: 'pending',
      })
      .select()
      .single()

    if (error) throw error
    return ok({ request: data }, 'Permintaan berhasil dikirim')
  } catch (err) {
    console.error('POST /api/leave-requests error:', err)
    return serverError()
  }
}
