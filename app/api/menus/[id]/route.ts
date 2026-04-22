import { createAdminClient } from '@/lib/supabase/server'
import { getAuthProfile, unauthorized, forbidden, serverError, ok, notFound } from '@/lib/supabase/auth-helpers'

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
    const admin = createAdminClient()

    const { data: existing } = await admin.from('m_menu').select('id').eq('id', id).single()
    if (!existing) return notFound('Menu tidak ditemukan')

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }
    const fields = ['nama_menu', 'kategori', 'deskripsi', 'is_active', 'urutan']
    fields.forEach((f) => { if (body[f] !== undefined) updateData[f] = body[f] })
    if (body.harga_jual !== undefined) updateData.harga_jual = parseInt(body.harga_jual)

    const { data, error } = await admin.from('m_menu').update(updateData).eq('id', id).select().single()
    if (error) throw error
    return ok({ menu: data }, 'Menu berhasil diperbarui')
  } catch (err) {
    console.error('PATCH /api/menus/[id] error:', err)
    return serverError()
  }
}
