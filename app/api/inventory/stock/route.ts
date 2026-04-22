import { createClient } from '@/lib/supabase/server'
import {
  getAuthProfile,
  unauthorized,
  serverError,
  ok,
} from '@/lib/supabase/auth-helpers'

export async function GET(request: Request) {
  const profile = await getAuthProfile()
  if (!profile) return unauthorized()

  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search')
  const filter = searchParams.get('filter') // all | critical | warning

  try {
    const supabase = await createClient()

    let query = supabase
      .from('m_bahan_baku')
      .select('id, nama_bahan, kategori, satuan, stok_sekarang, stok_minimum, harga_terakhir, lokasi_simpan')
      .eq('is_active', true)
      .order('nama_bahan', { ascending: true })

    if (search) {
      query = query.ilike('nama_bahan', `%${search}%`)
    }

    const { data, error } = await query
    if (error) throw error

    const items = (data || []).map((item) => {
      let status_stok: 'ok' | 'warning' | 'critical' = 'ok'
      if (item.stok_sekarang <= 0) {
        status_stok = 'critical'
      } else if (item.stok_sekarang <= item.stok_minimum) {
        status_stok = 'critical'
      } else if (item.stok_sekarang <= item.stok_minimum * 1.5) {
        status_stok = 'warning'
      }
      return { ...item, status_stok }
    })

    const filtered =
      filter === 'critical'
        ? items.filter((i) => i.status_stok === 'critical')
        : filter === 'warning'
        ? items.filter((i) => i.status_stok !== 'ok')
        : items

    return ok({ items: filtered })
  } catch (err) {
    console.error('GET /api/inventory/stock error:', err)
    return serverError()
  }
}
