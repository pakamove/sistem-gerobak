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
import { getTodayDate } from '@/lib/utils/format'

export async function GET(request: Request) {
  const profile = await getAuthProfile()
  if (!profile) return unauthorized()

  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date') || getTodayDate()
  const assignedToMe = searchParams.get('assigned_to') === 'me'

  try {
    const supabase = await createClient()

    let query = supabase
      .from('t_produksi')
      .select(`
        *,
        menu:m_menu(id, nama_menu, kategori),
        koki:m_users(id, nama_lengkap)
      `)
      .eq('tanggal', date)
      .order('created_at', { ascending: true })

    if (assignedToMe && profile.role === 'koki') {
      query = query.eq('koki_id', profile.id)
    }

    const { data, error } = await query
    if (error) throw error

    return ok({ productions: data })
  } catch (err) {
    console.error('GET /api/kitchen/production error:', err)
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
      tanggal,
      menu_id,
      target_porsi,
      alokasi_g1 = 0,
      alokasi_g2 = 0,
      alokasi_g3 = 0,
      koki_id,
      catatan = '',
      tipe = 'regular',
    } = body

    if (!menu_id) return badRequest('menu_id wajib diisi')
    if (!target_porsi || target_porsi <= 0) return badRequest('target_porsi harus > 0')

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('t_produksi')
      .insert({
        tanggal: tanggal || getTodayDate(),
        menu_id,
        tipe,
        target_porsi,
        alokasi_g1,
        alokasi_g2,
        alokasi_g3,
        koki_id: koki_id || null,
        catatan,
        status: 'belum',
      })
      .select(`*, menu:m_menu(id, nama_menu), koki:m_users(id, nama_lengkap)`)
      .single()

    if (error) throw error

    return created({ production: data }, 'Rencana produksi berhasil dibuat')
  } catch (err) {
    console.error('POST /api/kitchen/production error:', err)
    return serverError()
  }
}
