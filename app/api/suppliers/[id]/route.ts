import { createAdminClient } from '@/lib/supabase/server'
import { getAuthProfile, unauthorized, forbidden, serverError, ok, notFound } from '@/lib/supabase/auth-helpers'

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const profile = await getAuthProfile()
  if (!profile) return unauthorized()
  if (!['owner', 'manager', 'purchaser'].includes(profile.role)) return forbidden()

  const { id } = await context.params
  try {
    const body = await request.json()
    const admin = createAdminClient()

    const { data: existing } = await admin.from('m_supplier').select('id').eq('id', id).single()
    if (!existing) return notFound('Supplier tidak ditemukan')

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }
    const fields = ['nama_supplier', 'alamat', 'email', 'pic', 'kategori_supply', 'metode_bayar', 'termin_pembayaran', 'catatan', 'is_active']
    fields.forEach((f) => { if (body[f] !== undefined) updateData[f] = body[f] })
    if (body.no_hp !== undefined) updateData.kontak = body.no_hp
    if (body.lead_time_hari !== undefined) updateData.lead_time_hari = body.lead_time_hari ? parseInt(body.lead_time_hari) : null
    if (body.min_order !== undefined) updateData.min_order = body.min_order

    const { data, error } = await admin.from('m_supplier').update(updateData).eq('id', id).select().single()
    if (error) throw error
    return ok({ supplier: data }, 'Supplier berhasil diperbarui')
  } catch (err) {
    console.error('PATCH /api/suppliers/[id] error:', err)
    return serverError()
  }
}
