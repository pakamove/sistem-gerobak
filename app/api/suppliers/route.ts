import { createAdminClient } from '@/lib/supabase/server'
import { getAuthProfile, unauthorized, forbidden, serverError, ok, badRequest } from '@/lib/supabase/auth-helpers'

export async function GET() {
  const profile = await getAuthProfile()
  if (!profile) return unauthorized()
  if (!['owner', 'manager', 'purchaser'].includes(profile.role)) return forbidden()

  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('m_supplier')
      .select('*')
      .order('nama_supplier')

    if (error) throw error
    return ok({ suppliers: data ?? [] })
  } catch (err) {
    console.error('GET /api/suppliers error:', err)
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
      nama_supplier, alamat, email, no_hp, pic,
      kategori_supply, metode_bayar, lead_time_hari,
      min_order, termin_pembayaran, catatan,
    } = body

    if (!nama_supplier?.trim()) return badRequest('Nama supplier wajib diisi')

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('m_supplier')
      .insert({
        nama_supplier: nama_supplier.trim(),
        alamat: alamat?.trim() || null,
        email: email?.trim() || null,
        kontak: no_hp?.trim() || null,
        pic: pic?.trim() || null,
        kategori_supply: kategori_supply || null,
        metode_bayar: metode_bayar || null,
        lead_time_hari: lead_time_hari ? parseInt(lead_time_hari) : null,
        min_order: min_order?.trim() || null,
        termin_pembayaran: termin_pembayaran?.trim() || null,
        catatan: catatan?.trim() || null,
        status: 'aktif',
        is_active: true,
      })
      .select()
      .single()

    if (error) throw error
    return ok({ supplier: data }, 'Supplier berhasil ditambahkan')
  } catch (err) {
    console.error('POST /api/suppliers error:', err)
    return serverError()
  }
}
