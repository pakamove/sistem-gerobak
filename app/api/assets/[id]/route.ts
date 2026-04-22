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

    const { data: existing } = await admin.from('m_aset').select('id, harga_beli').eq('id', id).single()
    if (!existing) return notFound('Aset tidak ditemukan')

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }
    const strFields = ['nama_aset', 'kategori', 'merk_model', 'kode_aset', 'tanggal_beli', 'lokasi', 'penanggung_jawab', 'metode_penyusutan', 'status', 'catatan']
    strFields.forEach((f) => { if (body[f] !== undefined) updateData[f] = body[f] || null })
    if (body.harga_beli !== undefined) {
      updateData.harga_beli = parseInt(body.harga_beli)
      updateData.nilai_buku = parseInt(body.harga_beli)
    }
    if (body.nilai_residu !== undefined) updateData.nilai_residu = parseInt(body.nilai_residu) || 0
    if (body.umur_manfaat_tahun !== undefined) updateData.umur_manfaat_tahun = parseInt(body.umur_manfaat_tahun) || 5

    const { data, error } = await admin.from('m_aset').update(updateData).eq('id', id).select().single()
    if (error) throw error
    return ok({ asset: data }, 'Aset berhasil diperbarui')
  } catch (err) {
    console.error('PATCH /api/assets/[id] error:', err)
    return serverError()
  }
}
