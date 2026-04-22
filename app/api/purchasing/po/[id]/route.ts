import { createClient } from '@/lib/supabase/server'
import {
  getAuthProfile,
  unauthorized,
  forbidden,
  serverError,
  ok,
  badRequest,
  notFound,
} from '@/lib/supabase/auth-helpers'

const validStatuses = ['draft', 'approved', 'sudah_beli', 'sudah_terima']

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
    const { status, harga_realisasi, total_realisasi, catatan } = body

    if (status && !validStatuses.includes(status)) {
      return badRequest('Status tidak valid')
    }

    const supabase = await createClient()

    const { data: existing } = await supabase
      .from('t_purchase_order')
      .select('id, status, dibuat_oleh')
      .eq('id', id)
      .single()

    if (!existing) return notFound('Purchase Order tidak ditemukan')

    // Purchaser tidak bisa self-approve
    if (status === 'approved' && profile.role === 'purchaser' && existing.dibuat_oleh === profile.id) {
      return Response.json({ success: false, message: 'Purchaser tidak bisa approve PO miliknya sendiri' }, { status: 403 })
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (status) updateData.status = status
    if (status === 'approved') updateData.diapprove_oleh = profile.id
    if (harga_realisasi !== undefined) updateData.harga_realisasi = harga_realisasi
    if (total_realisasi !== undefined) updateData.total_realisasi = total_realisasi
    if (catatan !== undefined) updateData.catatan = catatan

    const { data, error } = await supabase
      .from('t_purchase_order')
      .update(updateData)
      .eq('id', id)
      .select(`*, bahan:m_bahan_baku(id, nama_bahan), supplier:m_supplier(id, nama_supplier)`)
      .single()

    if (error) throw error

    return ok({ purchase_order: data }, 'Purchase Order berhasil diperbarui')
  } catch (err) {
    console.error('PATCH /api/purchasing/po/[id] error:', err)
    return serverError()
  }
}
