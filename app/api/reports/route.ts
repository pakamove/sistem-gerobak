import { createAdminClient } from '@/lib/supabase/server'
import { getAuthProfile, unauthorized, forbidden, serverError, ok, badRequest } from '@/lib/supabase/auth-helpers'

export async function GET(request: Request) {
  const profile = await getAuthProfile()
  if (!profile) return unauthorized()
  if (!['owner', 'manager'].includes(profile.role)) return forbidden()

  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') || 'sales'
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  if (!from || !to) return badRequest('Parameter from dan to wajib diisi')

  try {
    const admin = createAdminClient()

    if (type === 'sales') {
      // Laporan penjualan per hari
      const { data: transactions } = await admin
        .from('t_transaksi')
        .select('id, waktu, total, metode_bayar, status')
        .eq('status', 'selesai')
        .gte('waktu', `${from}T00:00:00`)
        .lte('waktu', `${to}T23:59:59`)
        .order('waktu')

      const txList = transactions ?? []
      const totalRevenue = txList.reduce((s, t) => s + t.total, 0)
      const totalTunai = txList.filter((t) => t.metode_bayar === 'tunai').reduce((s, t) => s + t.total, 0)
      const totalQris = txList.filter((t) => t.metode_bayar === 'qris').reduce((s, t) => s + t.total, 0)

      // Kelompokkan per hari
      const byDay: Record<string, { date: string; total: number; count: number; tunai: number; qris: number }> = {}
      txList.forEach((t) => {
        const date = t.waktu.slice(0, 10)
        if (!byDay[date]) byDay[date] = { date, total: 0, count: 0, tunai: 0, qris: 0 }
        byDay[date].total += t.total
        byDay[date].count++
        if (t.metode_bayar === 'tunai') byDay[date].tunai += t.total
        else byDay[date].qris += t.total
      })

      return ok({
        summary: { total_revenue: totalRevenue, total_transactions: txList.length, total_tunai: totalTunai, total_qris: totalQris },
        by_day: Object.values(byDay).sort((a, b) => a.date.localeCompare(b.date)),
      })
    }

    if (type === 'inventory') {
      // Laporan penggunaan bahan baku (penerimaan)
      const { data: incoming } = await admin
        .from('t_inventory_masuk')
        .select('*, bahan:m_bahan_baku(nama_bahan, satuan), supplier:m_supplier(nama_supplier)')
        .gte('tanggal_masuk', from)
        .lte('tanggal_masuk', to)
        .order('tanggal_masuk', { ascending: false })

      const incomingList = incoming ?? []
      const totalNilai = incomingList.reduce((s, i) => s + (i.qty_masuk * (i.harga_beli ?? 0)), 0)

      return ok({
        summary: { total_penerimaan: incomingList.length, total_nilai: totalNilai },
        items: incomingList,
      })
    }

    if (type === 'purchasing') {
      // Laporan pembelian / PO
      const { data: pos } = await admin
        .from('t_purchase_order')
        .select('*, bahan:m_bahan_baku(nama_bahan, satuan), supplier:m_supplier(nama_supplier)')
        .gte('tanggal_po', from)
        .lte('tanggal_po', to)
        .order('tanggal_po', { ascending: false })

      const poList = pos ?? []
      const totalEstimasi = poList.reduce((s, p) => s + (p.total_estimasi ?? 0), 0)
      const totalRealisasi = poList.filter((p) => p.total_realisasi).reduce((s, p) => s + (p.total_realisasi ?? 0), 0)

      return ok({
        summary: { total_po: poList.length, total_estimasi: totalEstimasi, total_realisasi: totalRealisasi },
        items: poList,
      })
    }

    if (type === 'labor') {
      // Laporan kehadiran (labor)
      const { data: absensi } = await admin
        .from('t_absensi')
        .select('*, user:m_users(id, nama_lengkap, role)')
        .gte('tanggal', from)
        .lte('tanggal', to)
        .order('tanggal', { ascending: false })

      const list = absensi ?? []
      const totalHari = [...new Set(list.map((a) => a.user_id + '_' + a.tanggal))].length
      const totalMenit = list.reduce((s, a) => s + (a.durasi_menit ?? 0), 0)

      // Group by user
      const byUser: Record<string, { user_id: string; nama: string; role: string; hari_hadir: number; total_menit: number }> = {}
      list.forEach((a) => {
        if (!byUser[a.user_id]) {
          byUser[a.user_id] = {
            user_id: a.user_id,
            nama: a.user?.nama_lengkap ?? 'Unknown',
            role: a.user?.role ?? '',
            hari_hadir: 0,
            total_menit: 0,
          }
        }
        byUser[a.user_id].hari_hadir++
        byUser[a.user_id].total_menit += a.durasi_menit ?? 0
      })

      return ok({
        summary: { total_hadir: totalHari, total_jam_kerja: Math.round(totalMenit / 60) },
        by_user: Object.values(byUser),
        detail: list,
      })
    }

    return badRequest('Tipe laporan tidak valid')
  } catch (err) {
    console.error('GET /api/reports error:', err)
    return serverError()
  }
}
