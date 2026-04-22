import { createClient } from '@/lib/supabase/server'
import {
  getAuthProfile,
  unauthorized,
  forbidden,
  serverError,
  created,
  badRequest,
} from '@/lib/supabase/auth-helpers'
import { getTodayDate } from '@/lib/utils/format'

export async function POST(request: Request) {
  const profile = await getAuthProfile()
  if (!profile) return unauthorized()

  if (!['owner', 'manager', 'purchaser'].includes(profile.role)) return forbidden()

  try {
    const body = await request.json()
    const {
      bahan_id,
      tanggal_masuk,
      qty_masuk,
      harga_beli,
      supplier_id,
      expired_date,
      catatan = '',
    } = body

    if (!bahan_id) return badRequest('bahan_id wajib diisi')
    if (!qty_masuk || qty_masuk <= 0) return badRequest('qty_masuk harus > 0')
    if (harga_beli === undefined || harga_beli < 0) return badRequest('harga_beli tidak valid')

    const supabase = await createClient()

    // Insert log
    const { data, error: insertErr } = await supabase
      .from('t_inventory_masuk')
      .insert({
        bahan_id,
        tanggal_masuk: tanggal_masuk || getTodayDate(),
        qty_masuk,
        harga_beli,
        supplier_id: supplier_id || null,
        expired_date: expired_date || null,
        diterima_oleh: profile.id,
        catatan,
      })
      .select()
      .single()

    if (insertErr) throw insertErr

    // Update harga_terakhir dan stok_sekarang
    const { data: bahan } = await supabase
      .from('m_bahan_baku')
      .select('stok_sekarang')
      .eq('id', bahan_id)
      .single()

    await supabase
      .from('m_bahan_baku')
      .update({
        harga_terakhir: harga_beli,
        stok_sekarang: (bahan?.stok_sekarang || 0) + qty_masuk,
        updated_at: new Date().toISOString(),
      })
      .eq('id', bahan_id)

    return created({ inventory_in: data }, 'Bahan masuk berhasil dicatat')
  } catch (err) {
    console.error('POST /api/inventory/incoming error:', err)
    return serverError()
  }
}
