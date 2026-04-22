import { createClient } from '@/lib/supabase/server'
import {
  getAuthProfile,
  unauthorized,
  forbidden,
  serverError,
  ok,
} from '@/lib/supabase/auth-helpers'

export async function GET() {
  const profile = await getAuthProfile()
  if (!profile) return unauthorized()

  if (!['owner', 'manager'].includes(profile.role)) return forbidden()

  try {
    const supabase = await createClient()

    const { data: menus } = await supabase
      .from('m_menu')
      .select('id, nama_menu, harga_jual, kategori')
      .eq('is_active', true)

    const { data: reseps } = await supabase
      .from('m_resep')
      .select(`
        menu_id,
        qty_per_porsi,
        bahan:m_bahan_baku(id, harga_terakhir)
      `)

    const resepMap = new Map<string, number>()
    for (const r of reseps || []) {
      const bahanHarga = (r.bahan as unknown as { harga_terakhir: number } | null)?.harga_terakhir || 0
      const hpp = r.qty_per_porsi * bahanHarga / 1000 // harga per gram/ml
      resepMap.set(r.menu_id, (resepMap.get(r.menu_id) || 0) + hpp)
    }

    const items = (menus || []).map((menu) => {
      const hpp = Math.round(resepMap.get(menu.id) || 0)
      const marginPercent = menu.harga_jual > 0
        ? Math.round(((menu.harga_jual - hpp) / menu.harga_jual) * 100)
        : 0
      return {
        menu_id: menu.id,
        nama_menu: menu.nama_menu,
        kategori: menu.kategori,
        harga_jual: menu.harga_jual,
        hpp,
        margin_percent: marginPercent,
      }
    })

    return ok({ items })
  } catch (err) {
    console.error('GET /api/dashboard/hpp error:', err)
    return serverError()
  }
}
