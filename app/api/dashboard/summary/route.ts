import { createClient } from '@/lib/supabase/server'
import {
  getAuthProfile,
  unauthorized,
  forbidden,
  serverError,
  ok,
} from '@/lib/supabase/auth-helpers'
import { getTodayDate } from '@/lib/utils/format'

export async function GET(request: Request) {
  const profile = await getAuthProfile()
  if (!profile) return unauthorized()

  if (!['owner', 'manager'].includes(profile.role)) return forbidden()

  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date') || getTodayDate()

  try {
    const supabase = await createClient()

    // Fetch all data in parallel
    const [
      { data: transaksiData },
      { data: shiftsData },
      { data: gerobakData },
      { data: produksiData },
      { data: bahanData },
    ] = await Promise.all([
      supabase
        .from('t_transaksi')
        .select('id, total, gerobak_id, status')
        .gte('waktu', `${date}T00:00:00`)
        .lte('waktu', `${date}T23:59:59`)
        .eq('status', 'selesai'),
      supabase
        .from('t_shift')
        .select('id, gerobak_id, waktu_tutup, status_rekon, selisih')
        .eq('tanggal', date),
      supabase.from('m_gerobak').select('id, nama').eq('is_active', true),
      supabase
        .from('t_produksi')
        .select('id, target_porsi, realisasi_porsi, status, menu:m_menu(nama_menu)')
        .eq('tanggal', date),
      supabase
        .from('m_bahan_baku')
        .select('id, nama_bahan, stok_sekarang, stok_minimum')
        .eq('is_active', true),
    ])

    const transactions = transaksiData || []
    const shifts = shiftsData || []
    const gerobaks = gerobakData || []
    const productions = produksiData || []
    const bahans = bahanData || []

    const totalRevenue = transactions.reduce((sum, t) => sum + t.total, 0)
    const totalTransactions = transactions.length
    const activeShifts = shifts.filter((s) => !s.waktu_tutup).length
    const closedShifts = shifts.filter((s) => !!s.waktu_tutup).length
    const selisihCount = shifts.filter((s) => s.status_rekon === 'ada_selisih').length

    const perGerobak = gerobaks.map((g) => {
      const gerobakTrx = transactions.filter((t) => t.gerobak_id === g.id)
      const gerobakShift = shifts.find((s) => s.gerobak_id === g.id)
      return {
        gerobak_id: g.id,
        nama: g.nama,
        revenue: gerobakTrx.reduce((sum, t) => sum + t.total, 0),
        transactions: gerobakTrx.length,
        status_rekon: gerobakShift?.status_rekon || null,
      }
    })

    const productionToday = productions.map((p) => ({
      menu: (p.menu as unknown as { nama_menu: string } | null)?.nama_menu || 'Unknown',
      target_porsi: p.target_porsi,
      realisasi_porsi: p.realisasi_porsi,
      status: p.status,
    }))

    const criticalItems = bahans
      .filter((b) => b.stok_sekarang <= b.stok_minimum)
      .map((b) => ({
        nama_bahan: b.nama_bahan,
        stok_sekarang: Number(b.stok_sekarang),
        stok_minimum: Number(b.stok_minimum),
      }))

    return ok({
      summary: {
        total_revenue: totalRevenue,
        total_transactions: totalTransactions,
        active_shifts: activeShifts,
        closed_shifts: closedShifts,
        selisih_count: selisihCount,
      },
      per_gerobak: perGerobak,
      production_today: productionToday,
      critical_items: criticalItems,
    })
  } catch (err) {
    console.error('GET /api/dashboard/summary error:', err)
    return serverError()
  }
}
