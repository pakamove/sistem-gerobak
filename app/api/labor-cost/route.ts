import { createAdminClient } from '@/lib/supabase/server'
import { getAuthProfile, unauthorized, forbidden, serverError, ok, badRequest } from '@/lib/supabase/auth-helpers'

// GET: list labor cost per bulan
export async function GET(request: Request) {
  const profile = await getAuthProfile()
  if (!profile) return unauthorized()
  if (!['owner', 'manager'].includes(profile.role)) return forbidden()

  const { searchParams } = new URL(request.url)
  const bulan = searchParams.get('bulan') // format: 2026-04

  try {
    const admin = createAdminClient()
    let query = admin
      .from('t_labor_cost')
      .select(`*, user:m_users!user_id(id, nama_lengkap, role, gaji_pokok)`)
      .order('bulan', { ascending: false })

    if (bulan) {
      const [year, month] = bulan.split('-').map(Number)
      const bulanDate = `${year}-${String(month).padStart(2, '0')}-01`
      query = query.eq('bulan', bulanDate)
    }

    const { data, error } = await query
    if (error) throw error
    return ok({ records: data ?? [] })
  } catch (err) {
    console.error('GET /api/labor-cost error:', err)
    return serverError()
  }
}

// POST: simpan/update kalkulasi cost karyawan bulan ini
export async function POST(request: Request) {
  const profile = await getAuthProfile()
  if (!profile) return unauthorized()
  if (!['owner', 'manager'].includes(profile.role)) return forbidden()

  try {
    const body = await request.json()
    const { user_id, bulan, metode, hari_kerja, hari_hadir, gaji_pokok, nilai_cost } = body

    if (!user_id || !bulan || !metode) return badRequest('user_id, bulan, dan metode wajib diisi')
    if (!['prorata', 'total_gaji'].includes(metode)) return badRequest('metode tidak valid')
    if (typeof hari_kerja !== 'number' || typeof hari_hadir !== 'number') {
      return badRequest('hari_kerja dan hari_hadir harus berupa angka')
    }

    // Pastikan bulan selalu tanggal 1
    const [year, month] = bulan.split('-').map(Number)
    const bulanDate = `${year}-${String(month).padStart(2, '0')}-01`

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('t_labor_cost')
      .upsert({
        user_id,
        bulan: bulanDate,
        metode,
        hari_kerja,
        hari_hadir,
        gaji_pokok,
        nilai_cost,
        dibuat_oleh: profile.id,
      }, { onConflict: 'user_id,bulan' })
      .select()
      .single()

    if (error) throw error
    return ok({ record: data }, 'Labor cost berhasil disimpan')
  } catch (err) {
    console.error('POST /api/labor-cost error:', err)
    return serverError()
  }
}
