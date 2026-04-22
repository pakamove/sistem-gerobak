import { createAdminClient } from '@/lib/supabase/server'
import { getAuthProfile, unauthorized, forbidden, serverError, ok, badRequest } from '@/lib/supabase/auth-helpers'

// GET resep untuk menu tertentu
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const profile = await getAuthProfile()
  if (!profile) return unauthorized()
  if (!['owner', 'manager'].includes(profile.role)) return forbidden()

  const { id } = await context.params
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('m_resep')
      .select('*, bahan:m_bahan_baku(id, nama_bahan, satuan, harga_terakhir)')
      .eq('menu_id', id)
      .order('tahap')

    if (error) throw error
    return ok({ resep: data ?? [] })
  } catch (err) {
    console.error('GET /api/menus/[id]/recipe error:', err)
    return serverError()
  }
}

// POST: replace full resep (upsert)
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const profile = await getAuthProfile()
  if (!profile) return unauthorized()
  if (!['owner', 'manager'].includes(profile.role)) return forbidden()

  const { id: menuId } = await context.params
  try {
    const body = await request.json()
    const { items } = body // [{bahan_id, qty_per_porsi, satuan, tahap, catatan}]

    if (!Array.isArray(items)) return badRequest('items harus berupa array')

    const admin = createAdminClient()

    // Hapus resep lama
    await admin.from('m_resep').delete().eq('menu_id', menuId)

    let totalHpp = 0

    if (items.length > 0) {
      const insertData = items.map((item) => ({
        menu_id: menuId,
        bahan_id: item.bahan_id,
        qty_per_porsi: parseFloat(item.qty_per_porsi) || 0,
        satuan: item.satuan || '',
        tahap: item.tahap || null,
        catatan: item.catatan || null,
      }))

      const { error } = await admin.from('m_resep').insert(insertData)
      if (error) throw error

      // Hitung HPP otomatis
      const { data: bahanList } = await admin
        .from('m_bahan_baku')
        .select('id, harga_terakhir')
        .in('id', items.map((i) => i.bahan_id))

      const hargaMap = new Map((bahanList ?? []).map((b) => [b.id, b.harga_terakhir]))
      totalHpp = items.reduce((sum, item) => {
        const harga = hargaMap.get(item.bahan_id) ?? 0
        return sum + (parseFloat(item.qty_per_porsi) || 0) * harga
      }, 0)
    }

    // Update hpp_current di m_menu
    await admin.from('m_menu').update({ hpp_current: Math.round(totalHpp), updated_at: new Date().toISOString() }).eq('id', menuId)

    return ok({ hpp_current: Math.round(totalHpp) }, 'Resep berhasil disimpan')
  } catch (err) {
    console.error('POST /api/menus/[id]/recipe error:', err)
    return serverError()
  }
}
