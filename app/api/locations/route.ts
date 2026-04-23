import { createAdminClient } from '@/lib/supabase/server'
import { getAuthProfile, unauthorized, forbidden, serverError, ok, badRequest } from '@/lib/supabase/auth-helpers'

export async function GET() {
  const profile = await getAuthProfile()
  if (!profile) return unauthorized()

  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('m_lokasi')
      .select('*')
      .order('nama')

    if (error) throw error
    return ok({ locations: data ?? [] })
  } catch (err) {
    console.error('GET /api/locations error:', err)
    return serverError()
  }
}

export async function POST(request: Request) {
  const profile = await getAuthProfile()
  if (!profile) return unauthorized()
  if (!['owner', 'manager'].includes(profile.role)) return forbidden()

  try {
    const body = await request.json()
    const { id, nama, deskripsi } = body

    if (!id?.trim()) return badRequest('ID lokasi wajib diisi')
    if (!nama?.trim()) return badRequest('Nama lokasi wajib diisi')

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('m_lokasi')
      .insert({
        id: id.trim().toLowerCase().replace(/\s+/g, '_'),
        nama: nama.trim(),
        deskripsi: deskripsi?.trim() || null,
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') return badRequest('ID lokasi sudah digunakan')
      throw error
    }

    return ok({ location: data }, 'Lokasi berhasil ditambahkan')
  } catch (err) {
    console.error('POST /api/locations error:', err)
    return serverError()
  }
}

export async function PATCH(request: Request) {
  const profile = await getAuthProfile()
  if (!profile) return unauthorized()
  if (!['owner', 'manager'].includes(profile.role)) return forbidden()

  try {
    const body = await request.json()
    const { id, nama, deskripsi, is_active } = body

    if (!id) return badRequest('ID lokasi wajib diisi')

    const admin = createAdminClient()
    const updates: Record<string, unknown> = {}
    if (nama !== undefined) updates.nama = nama.trim()
    if (deskripsi !== undefined) updates.deskripsi = deskripsi?.trim() || null
    if (is_active !== undefined) updates.is_active = is_active

    const { data, error } = await admin
      .from('m_lokasi')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return ok({ location: data }, 'Lokasi diperbarui')
  } catch (err) {
    console.error('PATCH /api/locations error:', err)
    return serverError()
  }
}
