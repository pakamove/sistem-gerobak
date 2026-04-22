import { createClient } from '@/lib/supabase/server'
import {
  getAuthProfile,
  unauthorized,
  serverError,
  ok,
  created,
  badRequest,
  conflict,
} from '@/lib/supabase/auth-helpers'
import { getTodayDate } from '@/lib/utils/format'

export async function GET(request: Request) {
  const profile = await getAuthProfile()
  if (!profile) return unauthorized()

  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date') || getTodayDate()
  const gerobakId = searchParams.get('gerobak_id')

  try {
    const supabase = await createClient()

    let query = supabase
      .from('t_shift')
      .select(`
        *,
        gerobak:m_gerobak(id, nama, lokasi),
        crew:m_users(id, nama_lengkap)
      `)
      .eq('tanggal', date)

    if (gerobakId) {
      query = query.eq('gerobak_id', gerobakId)
    } else if (profile.role === 'crew_gerobak') {
      // Auto-find gerobak from user profile
      const { data: gerobakData } = await supabase
        .from('m_gerobak')
        .select('id')
        .ilike('nama', `%${profile.lokasi_tugas?.replace('gerobak_', 'Gerobak ') || ''}%`)
        .single()

      if (gerobakData) {
        query = query.eq('gerobak_id', gerobakData.id)
      } else {
        query = query.eq('crew_id', profile.id)
      }
    }

    const { data, error } = await query
    if (error) throw error

    return ok({ shifts: data, shift: data?.[0] || null })
  } catch (err) {
    console.error('GET /api/pos/shift error:', err)
    return serverError()
  }
}

export async function POST(request: Request) {
  const profile = await getAuthProfile()
  if (!profile) return unauthorized()

  try {
    const body = await request.json()
    const { cash_awal = 0, stok_awal = [], gerobak_id } = body

    if (cash_awal < 0) return badRequest('Cash awal tidak boleh negatif')

    const supabase = await createClient()

    // Resolve gerobak_id
    let resolvedGerobakId = gerobak_id
    if (!resolvedGerobakId) {
      const lokasiMap: Record<string, string> = {
        gerobak_1: 'Gerobak 1',
        gerobak_2: 'Gerobak 2',
        gerobak_3: 'Gerobak 3',
      }
      const namaGerobak = lokasiMap[profile.lokasi_tugas || '']
      if (!namaGerobak) return badRequest('Gerobak tidak ditemukan untuk akun ini')

      const { data: gerobakData } = await supabase
        .from('m_gerobak')
        .select('id')
        .eq('nama', namaGerobak)
        .single()

      if (!gerobakData) return badRequest('Gerobak tidak ditemukan')
      resolvedGerobakId = gerobakData.id
    }

    const today = getTodayDate()

    // Check existing shift
    const { data: existing } = await supabase
      .from('t_shift')
      .select('id')
      .eq('gerobak_id', resolvedGerobakId)
      .eq('tanggal', today)
      .single()

    if (existing) return conflict('Shift untuk gerobak ini hari ini sudah ada')

    // Create shift
    const { data: shift, error: shiftError } = await supabase
      .from('t_shift')
      .insert({
        gerobak_id: resolvedGerobakId,
        crew_id: profile.id,
        tanggal: today,
        waktu_buka: new Date().toISOString(),
        cash_awal,
      })
      .select()
      .single()

    if (shiftError) throw shiftError

    // Insert initial stock
    if (stok_awal.length > 0) {
      const stokRows = stok_awal
        .filter((s: { menu_id: string; qty_terima: number }) => s.menu_id && s.qty_terima >= 0)
        .map((s: { menu_id: string; qty_terima: number }) => ({
          shift_id: shift.id,
          menu_id: s.menu_id,
          qty_terima: s.qty_terima,
        }))

      if (stokRows.length > 0) {
        const { error: stokError } = await supabase.from('t_stok_gerobak').insert(stokRows)
        if (stokError) console.error('Stok insert error:', stokError)
      }
    }

    return created({ shift })
  } catch (err) {
    console.error('POST /api/pos/shift error:', err)
    return serverError()
  }
}
