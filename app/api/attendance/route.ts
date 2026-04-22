import { createAdminClient } from '@/lib/supabase/server'
import { getAuthProfile, unauthorized, serverError, ok, badRequest, conflict } from '@/lib/supabase/auth-helpers'
import { getTodayDate } from '@/lib/utils/format'

export async function GET(request: Request) {
  const profile = await getAuthProfile()
  if (!profile) return unauthorized()

  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date') || getTodayDate()
  const userId = searchParams.get('user_id') || profile.id

  // Hanya owner/manager bisa lihat absensi orang lain
  if (userId !== profile.id && !['owner', 'manager'].includes(profile.role)) {
    return unauthorized()
  }

  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('t_absensi')
      .select('*, user:m_users(id, nama_lengkap, role)')
      .eq('tanggal', date)
      .eq(userId === 'all' ? 'id' : 'user_id', userId === 'all' ? profile.id : userId) // fallback
      .order('clock_in', { ascending: false })

    // Jika minta semua (owner/manager)
    if (userId === 'all' && ['owner', 'manager'].includes(profile.role)) {
      const { data: allData, error: allErr } = await admin
        .from('t_absensi')
        .select('*, user:m_users(id, nama_lengkap, role)')
        .eq('tanggal', date)
        .order('clock_in', { ascending: false })

      if (allErr) throw allErr
      return ok({ absensi: allData ?? [] })
    }

    if (error) throw error
    return ok({ absensi: data ?? [] })
  } catch (err) {
    console.error('GET /api/attendance error:', err)
    return serverError()
  }
}

export async function POST(request: Request) {
  const profile = await getAuthProfile()
  if (!profile) return unauthorized()

  try {
    const body = await request.json()
    const { action, latitude, longitude, catatan } = body

    if (!['clock_in', 'clock_out'].includes(action)) return badRequest('Action tidak valid')

    const admin = createAdminClient()
    const today = getTodayDate()
    const now = new Date().toISOString()

    // Cek absensi hari ini
    const { data: existing } = await admin
      .from('t_absensi')
      .select('*')
      .eq('user_id', profile.id)
      .eq('tanggal', today)
      .single()

    if (action === 'clock_in') {
      if (existing) return conflict('Anda sudah clock in hari ini')

      const { data, error } = await admin
        .from('t_absensi')
        .insert({
          user_id: profile.id,
          tanggal: today,
          clock_in: now,
          latitude_in: latitude ?? null,
          longitude_in: longitude ?? null,
          status: 'hadir',
          catatan: catatan?.trim() || null,
        })
        .select()
        .single()

      if (error) throw error
      return ok({ absensi: data }, 'Clock in berhasil')
    }

    // Clock out
    if (!existing) return badRequest('Belum clock in hari ini')
    if (existing.clock_out) return conflict('Anda sudah clock out hari ini')

    const clockInTime = new Date(existing.clock_in)
    const clockOutTime = new Date(now)
    const durasi = Math.round((clockOutTime.getTime() - clockInTime.getTime()) / (1000 * 60)) // menit

    const { data, error } = await admin
      .from('t_absensi')
      .update({
        clock_out: now,
        latitude_out: latitude ?? null,
        longitude_out: longitude ?? null,
        durasi_menit: durasi,
        catatan_out: catatan?.trim() || null,
      })
      .eq('id', existing.id)
      .select()
      .single()

    if (error) throw error
    return ok({ absensi: data }, `Clock out berhasil · Durasi kerja: ${Math.floor(durasi / 60)}j ${durasi % 60}m`)
  } catch (err) {
    console.error('POST /api/attendance error:', err)
    return serverError()
  }
}
