import { createClient } from '@/lib/supabase/server'
import {
  getAuthProfile,
  unauthorized,
  forbidden,
  serverError,
  ok,
  created,
  badRequest,
} from '@/lib/supabase/auth-helpers'
import { generateNomorPO } from '@/lib/utils/format'

export async function GET(request: Request) {
  const profile = await getAuthProfile()
  if (!profile) return unauthorized()

  if (!['owner', 'manager', 'purchaser'].includes(profile.role)) return forbidden()

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')

  try {
    const supabase = await createClient()

    let query = supabase
      .from('t_purchase_order')
      .select(`
        *,
        bahan:m_bahan_baku(id, nama_bahan, satuan),
        supplier:m_supplier(id, nama_supplier)
      `)
      .order('created_at', { ascending: false })

    if (status) query = query.eq('status', status)

    const { data, error } = await query
    if (error) throw error

    return ok({ purchase_orders: data })
  } catch (err) {
    console.error('GET /api/purchasing/po error:', err)
    return serverError()
  }
}

export async function POST(request: Request) {
  const profile = await getAuthProfile()
  if (!profile) return unauthorized()

  if (!['owner', 'manager', 'purchaser'].includes(profile.role)) return forbidden()

  try {
    const body = await request.json()
    const {
      tanggal_po,
      tanggal_butuh,
      bahan_id,
      supplier_id,
      qty_order,
      satuan,
      harga_estimasi,
      catatan = '',
    } = body

    if (!bahan_id) return badRequest('bahan_id wajib diisi')
    if (!tanggal_butuh) return badRequest('tanggal_butuh wajib diisi')
    if (!qty_order || qty_order <= 0) return badRequest('qty_order harus > 0')
    if (!satuan) return badRequest('satuan wajib diisi')

    const tglPO = tanggal_po || new Date().toISOString().slice(0, 10)
    if (tanggal_butuh < tglPO) return badRequest('tanggal_butuh harus >= tanggal_po')

    const supabase = await createClient()

    const { count } = await supabase
      .from('t_purchase_order')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', tglPO + 'T00:00:00')

    const nomorPO = generateNomorPO(new Date(tglPO), (count || 0) + 1)
    const totalEstimasi = harga_estimasi ? harga_estimasi * qty_order : null

    const { data, error } = await supabase
      .from('t_purchase_order')
      .insert({
        nomor_po: nomorPO,
        tanggal_po: tglPO,
        tanggal_butuh,
        bahan_id,
        supplier_id: supplier_id || null,
        qty_order,
        satuan,
        harga_estimasi: harga_estimasi || null,
        total_estimasi: totalEstimasi,
        status: 'draft',
        dibuat_oleh: profile.id,
        catatan,
      })
      .select(`*, bahan:m_bahan_baku(id, nama_bahan, satuan), supplier:m_supplier(id, nama_supplier)`)
      .single()

    if (error) throw error

    return created({ purchase_order: data }, 'Purchase Order berhasil dibuat')
  } catch (err) {
    console.error('POST /api/purchasing/po error:', err)
    return serverError()
  }
}
