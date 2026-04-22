import { createAdminClient } from '@/lib/supabase/server'
import { getAuthProfile, unauthorized, forbidden, serverError, ok, badRequest } from '@/lib/supabase/auth-helpers'

export async function GET() {
  const profile = await getAuthProfile()
  if (!profile) return unauthorized()
  if (!['owner', 'manager'].includes(profile.role)) return forbidden()

  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('m_menu')
      .select('*, resep:m_resep(*, bahan:m_bahan_baku(id, nama_bahan, satuan, harga_terakhir))')
      .order('urutan')

    if (error) throw error
    return ok({ menus: data ?? [] })
  } catch (err) {
    console.error('GET /api/menus error:', err)
    return serverError()
  }
}

export async function POST(request: Request) {
  const profile = await getAuthProfile()
  if (!profile) return unauthorized()
  if (!['owner', 'manager'].includes(profile.role)) return forbidden()

  try {
    const body = await request.json()
    const { nama_menu, kategori, harga_jual, deskripsi, urutan } = body

    if (!nama_menu?.trim()) return badRequest('Nama menu wajib diisi')
    if (!kategori) return badRequest('Kategori wajib dipilih')
    if (!harga_jual || harga_jual <= 0) return badRequest('Harga jual harus lebih dari 0')

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('m_menu')
      .insert({
        nama_menu: nama_menu.trim(),
        kategori,
        harga_jual: parseInt(harga_jual),
        deskripsi: deskripsi?.trim() || null,
        urutan: urutan ? parseInt(urutan) : 99,
        is_active: true,
        hpp_current: 0,
      })
      .select()
      .single()

    if (error) throw error
    return ok({ menu: data }, 'Menu berhasil ditambahkan')
  } catch (err) {
    console.error('POST /api/menus error:', err)
    return serverError()
  }
}
