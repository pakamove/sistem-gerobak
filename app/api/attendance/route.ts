import { createAdminClient } from '@/lib/supabase/server'
import { getAuthProfile, unauthorized, forbidden, serverError, ok, badRequest } from '@/lib/supabase/auth-helpers'
import { headers } from 'next/headers'

// GET: riwayat absensi
export async function GET(request: Request) {
  const profile = await getAuthProfile()
  if (!profile) return unauthorized()

  const { searchParams } = new URL(request.url)
  const targetUserId = searchParams.get('user_id')   // spesifik user (manager/owner only)
  const bulan = searchParams.get('bulan')             // format: 2026-04
  const today = searchParams.get('today')             // '1' = hari ini saja
  const isManagerOrOwner = ['owner', 'manager'].includes(profile.role)

  if (targetUserId && !isManagerOrOwner) return forbidden()

  try {
    const admin = createAdminClient()
    let query = admin
      .from('t_absensi')
      .select(`*, karyawan:m_users!karyawan_id(id, nama_lengkap, role, lokasi_tugas)`)
      .order('tanggal', { ascending: false })

    if (today === '1') {
      const todayDate = new Date().toISOString().split('T')[0]
      query = query.eq('tanggal', todayDate)
      if (!isManagerOrOwner) query = query.eq('karyawan_id', profile.id)
    } else if (targetUserId) {
      query = query.eq('karyawan_id', targetUserId)
    } else if (!isManagerOrOwner) {
      query = query.eq('karyawan_id', profile.id)
    }

    if (bulan) {
      const [year, month] = bulan.split('-').map(Number)
      const from = `${year}-${String(month).padStart(2, '0')}-01`
      const to = new Date(year, month, 0).toISOString().split('T')[0]
      query = query.gte('tanggal', from).lte('tanggal', to)
    }

    const { data, error } = await query
    if (error) throw error
    return ok({ records: data ?? [] })
  } catch (err) {
    console.error('GET /api/attendance error:', err)
    return serverError()
  }
}

// POST: clock in / clock out
export async function POST(request: Request) {
  const profile = await getAuthProfile()
  if (!profile) return unauthorized()
  if (profile.role === 'owner') return forbidden()

  try {
    const body = await request.json()
    const { action, latitude, longitude } = body

    if (!action || !['in', 'out'].includes(action)) {
      return badRequest('action harus "in" atau "out"')
    }

    const today = new Date().toISOString().split('T')[0]
    const now = new Date().toISOString()

    // Ambil IP real dari header
    const headersList = await headers()
    const forwarded = headersList.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0].trim() : (headersList.get('x-real-ip') ?? 'unknown')

    // Deteksi VPN via ip-api.com (gratis, server-side)
    let isVpn = false
    try {
      const isLocal = ip === 'unknown' || ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.')
      if (!isLocal) {
        const res = await fetch(`http://ip-api.com/json/${ip}?fields=proxy,hosting`, {
          signal: AbortSignal.timeout(3000),
        })
        if (res.ok) {
          const d = await res.json()
          isVpn = d.proxy === true || d.hosting === true
        }
      }
    } catch {
      // VPN check gagal — tetap lanjut, tidak block user
    }

    const admin = createAdminClient()

    if (action === 'in') {
      const { data: existing } = await admin
        .from('t_absensi')
        .select('id, jam_masuk')
        .eq('karyawan_id', profile.id)
        .eq('tanggal', today)
        .single()

      if (existing?.jam_masuk) return badRequest('Sudah clock in hari ini')

      if (existing) {
        await admin.from('t_absensi').update({
          jam_masuk: now,
          latitude_in: latitude ?? null,
          longitude_in: longitude ?? null,
          ip_address: ip,
          is_vpn: isVpn,
          status: 'hadir',
        }).eq('id', existing.id)
      } else {
        const { error } = await admin.from('t_absensi').insert({
          karyawan_id: profile.id,
          tanggal: today,
          lokasi_kerja: profile.lokasi_tugas ?? null,
          jam_masuk: now,
          latitude_in: latitude ?? null,
          longitude_in: longitude ?? null,
          ip_address: ip,
          is_vpn: isVpn,
          status: 'hadir',
        })
        if (error) throw error
      }

      const msg = isVpn
        ? 'Clock in berhasil (⚠️ VPN terdeteksi, dicatat untuk audit)'
        : 'Clock in berhasil'
      return ok({ is_vpn: isVpn, jam_masuk: now }, msg)
    }

    // action === 'out'
    const { data: absensi } = await admin
      .from('t_absensi')
      .select('id, jam_masuk, jam_pulang')
      .eq('karyawan_id', profile.id)
      .eq('tanggal', today)
      .single()

    if (!absensi?.jam_masuk) return badRequest('Belum clock in hari ini')
    if (absensi.jam_pulang) return badRequest('Sudah clock out hari ini')

    const { error } = await admin.from('t_absensi').update({
      jam_pulang: now,
      latitude_out: latitude ?? null,
      longitude_out: longitude ?? null,
    }).eq('id', absensi.id)

    if (error) throw error

    const durMenit = Math.round((Date.now() - new Date(absensi.jam_masuk).getTime()) / 60000)
    const durStr = `${Math.floor(durMenit / 60)}j ${durMenit % 60}m`
    return ok({ jam_pulang: now }, `Clock out berhasil · Durasi: ${durStr}`)
  } catch (err) {
    console.error('POST /api/attendance error:', err)
    return serverError()
  }
}
