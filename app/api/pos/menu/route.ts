import { createClient } from '@/lib/supabase/server'
import { getAuthProfile, unauthorized, serverError, ok } from '@/lib/supabase/auth-helpers'

export async function GET(request: Request) {
  const profile = await getAuthProfile()
  if (!profile) return unauthorized()

  const { searchParams } = new URL(request.url)
  const kategori = searchParams.get('kategori')

  try {
    const supabase = await createClient()
    let query = supabase
      .from('m_menu')
      .select('id, nama_menu, kategori, harga_jual, hpp_current, image_url, urutan, is_active')
      .eq('is_active', true)
      .order('urutan', { ascending: true })
      .order('nama_menu', { ascending: true })

    if (kategori && kategori !== 'semua') {
      query = query.eq('kategori', kategori)
    }

    const { data, error } = await query
    if (error) {
      console.error('GET /api/pos/menu supabase error:', JSON.stringify(error))
      throw error
    }

    return ok({ menus: data ?? [] })
  } catch (err) {
    console.error('GET /api/pos/menu error:', err)
    return serverError()
  }
}
