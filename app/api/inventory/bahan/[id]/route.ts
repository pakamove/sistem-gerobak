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

    const { data: existing } = await admin.from('m_bahan_baku').select('id').eq('id', id).single()
    if (!existing) return notFound('Bahan baku tidak ditemukan')

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }
    const strFields = ['nama_bahan', 'kategori', 'satuan', 'lokasi_simpan', 'cara_simpan', 'catatan']
    strFields.forEach((f) => { if (body[f] !== undefined) updateData[f] = body[f] || null })
    if (body.stok_minimum !== undefined) updateData.stok_minimum = parseFloat(body.stok_minimum) || 0
    if (body.harga_terakhir !== undefined) updateData.harga_terakhir = parseInt(body.harga_terakhir) || 0
    if (body.masa_simpan_hari !== undefined) updateData.masa_simpan_hari = body.masa_simpan_hari ? parseInt(body.masa_simpan_hari) : null
    if (body.is_active !== undefined) updateData.is_active = body.is_active
    if (body.supplier_utama_id !== undefined) updateData.supplier_utama_id = body.supplier_utama_id || null

    const { data, error } = await admin.from('m_bahan_baku').update(updateData).eq('id', id).select().single()
    if (error) throw error
    return ok({ bahan: data }, 'Bahan baku berhasil diperbarui')
  } catch (err) {
    console.error('PATCH /api/inventory/bahan/[id] error:', err)
    return serverError()
  }
}
