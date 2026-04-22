import { createClient, createAdminClient } from '@/lib/supabase/server'
import {
  getAuthProfile,
  unauthorized,
  forbidden,
  serverError,
  ok,
  badRequest,
  notFound,
} from '@/lib/supabase/auth-helpers'
import { getTodayDate } from '@/lib/utils/format'

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
    const adminSupabase = createAdminClient()

    const { data: existing } = await adminSupabase
      .from('t_purchase_order')
      .select('id, status, dibuat_oleh, bahan_id, qty_order, harga_estimasi, supplier_id')
      .eq('id', id)
      .single()

    if (!existing) return notFound('Purchase Order tidak ditemukan')

    // Jangan proses ulang jika sudah sudah_terima
    if (existing.status === 'sudah_terima' && status === 'sudah_terima') {
      return badRequest('PO ini sudah berstatus sudah_terima')
    }

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

    // Auto-update stok saat status berubah ke sudah_terima
    if (status === 'sudah_terima' && existing.status !== 'sudah_terima') {
      const qtyMasuk = existing.qty_order
      const hargaBeli = harga_realisasi ?? existing.harga_estimasi ?? 0

      // Catat di t_inventory_masuk
      await adminSupabase.from('t_inventory_masuk').insert({
        bahan_id: existing.bahan_id,
        tanggal_masuk: getTodayDate(),
        qty_masuk: qtyMasuk,
        harga_beli: hargaBeli,
        supplier_id: existing.supplier_id ?? null,
        diterima_oleh: profile.id,
        catatan: `Auto dari PO #${id.slice(0, 8)}`,
      })

      // Update stok_sekarang dan harga_terakhir di m_bahan_baku
      const { data: bahan } = await adminSupabase
        .from('m_bahan_baku')
        .select('stok_sekarang')
        .eq('id', existing.bahan_id)
        .single()

      await adminSupabase
        .from('m_bahan_baku')
        .update({
          stok_sekarang: (bahan?.stok_sekarang ?? 0) + qtyMasuk,
          harga_terakhir: hargaBeli > 0 ? hargaBeli : undefined,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.bahan_id)
    }

    return ok({ purchase_order: data }, 'Purchase Order berhasil diperbarui')
  } catch (err) {
    console.error('PATCH /api/purchasing/po/[id] error:', err)
    return serverError()
  }
}
