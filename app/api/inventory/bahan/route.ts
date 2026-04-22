import { createAdminClient } from '@/lib/supabase/server'
import { getAuthProfile, unauthorized, forbidden, serverError, ok, badRequest } from '@/lib/supabase/auth-helpers'

export async function GET() {
  const profile = await getAuthProfile()
  if (!profile) return unauthorized()
  if (!['owner', 'manager', 'purchaser'].includes(profile.role)) return forbidden()

  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('m_bahan_baku')
      .select('*')
      .order('nama_bahan')

    if (error) throw error
    return ok({ bahan: data ?? [] })
  } catch (err) {
    console.error('GET /api/inventory/bahan error:', err)
    return serverError()
  }
}

export async function POST(request: Request) {
  const profile = await getAuthProfile()
  if (!profile) return unauthorized()
  if (!['owner', 'manager'].includes(profile.role)) return forbidden()

  try {
    const body = await request.json()
    const {
      nama_bahan, kategori, satuan, stok_minimum,
      harga_terakhir, lokasi_simpan, masa_simpan_hari,
      cara_simpan, supplier_utama_id, catatan,
    } = body

    if (!nama_bahan?.trim()) return badRequest('Nama bahan wajib diisi')
    if (!satuan?.trim()) return badRequest('Satuan wajib diisi')

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('m_bahan_baku')
      .insert({
        nama_bahan: nama_bahan.trim(),
        kategori: kategori || null,
        satuan: satuan.trim(),
        stok_sekarang: 0,
        stok_minimum: stok_minimum ? parseFloat(stok_minimum) : 0,
        harga_terakhir: harga_terakhir ? parseInt(harga_terakhir) : 0,
        lokasi_simpan: lokasi_simpan?.trim() || null,
        masa_simpan_hari: masa_simpan_hari ? parseInt(masa_simpan_hari) : null,
        cara_simpan: cara_simpan?.trim() || null,
        supplier_utama_id: supplier_utama_id || null,
        catatan: catatan?.trim() || null,
        is_active: true,
      })
      .select()
      .single()

    if (error) throw error
    return ok({ bahan: data }, 'Bahan baku berhasil ditambahkan')
  } catch (err) {
    console.error('POST /api/inventory/bahan error:', err)
    return serverError()
  }
}
