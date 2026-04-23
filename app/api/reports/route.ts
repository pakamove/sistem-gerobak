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

    // ──────────────────────────────────────────────
    // LAPORAN PENJUALAN
    // ──────────────────────────────────────────────
    if (type === 'sales') {
      const [txRes, itemRes] = await Promise.all([
        admin
          .from('t_transaksi')
          .select('id, waktu, total, metode_bayar, status')
          .eq('status', 'selesai')
          .gte('waktu', `${from}T00:00:00`)
          .lte('waktu', `${to}T23:59:59`)
          .order('waktu'),
        admin
          .from('t_penjualan')
          .select('menu_id, nama_menu, harga_satuan, qty, subtotal, status')
          .eq('status', 'terjual')
          .gte('created_at', `${from}T00:00:00`)
          .lte('created_at', `${to}T23:59:59`),
      ])

      const txList = txRes.data ?? []
      const itemList = itemRes.data ?? []

      const totalRevenue = txList.reduce((s, t) => s + t.total, 0)
      const totalTunai = txList.filter(t => t.metode_bayar === 'tunai').reduce((s, t) => s + t.total, 0)
      const totalQris = txList.filter(t => t.metode_bayar === 'qris').reduce((s, t) => s + t.total, 0)

      // Per hari
      const byDay: Record<string, { date: string; total: number; count: number; tunai: number; qris: number }> = {}
      txList.forEach((t) => {
        const date = t.waktu.slice(0, 10)
        if (!byDay[date]) byDay[date] = { date, total: 0, count: 0, tunai: 0, qris: 0 }
        byDay[date].total += t.total
        byDay[date].count++
        if (t.metode_bayar === 'tunai') byDay[date].tunai += t.total
        else byDay[date].qris += t.total
      })

      // Item terlaris
      const byMenu: Record<string, { menu_id: string; nama: string; qty: number; revenue: number }> = {}
      itemList.forEach((i) => {
        if (!byMenu[i.menu_id]) byMenu[i.menu_id] = { menu_id: i.menu_id, nama: i.nama_menu, qty: 0, revenue: 0 }
        byMenu[i.menu_id].qty += i.qty
        byMenu[i.menu_id].revenue += i.subtotal
      })
      const topItems = Object.values(byMenu).sort((a, b) => b.qty - a.qty).slice(0, 10)

      return ok({
        summary: {
          total_revenue: totalRevenue,
          total_transactions: txList.length,
          total_tunai: totalTunai,
          total_qris: totalQris,
        },
        by_day: Object.values(byDay).sort((a, b) => a.date.localeCompare(b.date)),
        top_items: topItems,
      })
    }

    // ──────────────────────────────────────────────
    // LAPORAN INVENTORY
    // ──────────────────────────────────────────────
    if (type === 'inventory') {
      const [incomingRes, stockRes] = await Promise.all([
        admin
          .from('t_inventory_masuk')
          .select('*, bahan:m_bahan_baku(nama_bahan, satuan, stok_sekarang, stok_minimum), supplier:m_supplier(nama_supplier)')
          .gte('tanggal_masuk', from)
          .lte('tanggal_masuk', to)
          .order('tanggal_masuk', { ascending: false }),
        admin
          .from('m_bahan_baku')
          .select('id, nama_bahan, satuan, stok_sekarang, stok_minimum, harga_terakhir')
          .eq('is_active', true)
          .order('nama_bahan'),
      ])

      const items = incomingRes.data ?? []
      const stocks = stockRes.data ?? []
      const totalNilai = items.reduce((s, i) => s + (i.qty_masuk * (i.harga_beli ?? 0)), 0)

      const lowStock = stocks.filter(s => (s.stok_sekarang ?? 0) <= (s.stok_minimum ?? 0))

      return ok({
        summary: {
          total_penerimaan: items.length,
          total_nilai: totalNilai,
          total_low_stock: lowStock.length,
        },
        items,
        low_stock: lowStock,
      })
    }

    // ──────────────────────────────────────────────
    // LAPORAN PEMBELIAN
    // ──────────────────────────────────────────────
    if (type === 'purchasing') {
      const { data: pos } = await admin
        .from('t_purchase_order')
        .select('*, bahan:m_bahan_baku(nama_bahan, satuan), supplier:m_supplier(nama_supplier)')
        .gte('tanggal_po', from)
        .lte('tanggal_po', to)
        .order('tanggal_po', { ascending: false })

      const poList = pos ?? []
      const totalEstimasi = poList.reduce((s, p) => s + (p.total_estimasi ?? 0), 0)
      const totalRealisasi = poList.reduce((s, p) => s + (p.total_realisasi ?? 0), 0)

      // Per supplier
      const bySupplier: Record<string, { nama: string; total_po: number; total_nilai: number }> = {}
      poList.forEach((p) => {
        const key = p.supplier_id ?? 'unknown'
        const nama = p.supplier?.nama_supplier ?? 'Tidak diketahui'
        if (!bySupplier[key]) bySupplier[key] = { nama, total_po: 0, total_nilai: 0 }
        bySupplier[key].total_po++
        bySupplier[key].total_nilai += p.total_realisasi ?? p.total_estimasi ?? 0
      })

      return ok({
        summary: {
          total_po: poList.length,
          total_estimasi: totalEstimasi,
          total_realisasi: totalRealisasi,
        },
        items: poList,
        by_supplier: Object.values(bySupplier).sort((a, b) => b.total_nilai - a.total_nilai),
      })
    }

    // ──────────────────────────────────────────────
    // LAPORAN SDM (Labor)
    // ──────────────────────────────────────────────
    if (type === 'labor') {
      const [year, month] = from.split('-').map(Number)
      const bulanDate = `${year}-${String(month).padStart(2, '0')}-01`

      const [absensiRes, usersRes, laborCostRes, leaveRes] = await Promise.all([
        admin
          .from('t_absensi')
          .select('id, karyawan_id, tanggal, jam_masuk, jam_pulang, status, is_vpn, karyawan:m_users!karyawan_id(id, nama_lengkap, role, gaji_pokok)')
          .gte('tanggal', from)
          .lte('tanggal', to)
          .order('tanggal', { ascending: false }),
        admin
          .from('m_users')
          .select('id, nama_lengkap, role, gaji_pokok, is_active')
          .neq('role', 'owner')
          .eq('is_active', true),
        admin
          .from('t_labor_cost')
          .select('*')
          .eq('bulan', bulanDate),
        admin
          .from('t_leave_requests')
          .select('id, user_id, type, tanggal_mulai, tanggal_selesai, status')
          .in('status', ['approved'])
          .gte('tanggal_mulai', from)
          .lte('tanggal_selesai', to),
      ])

      const absensiList = absensiRes.data ?? []
      const userList = usersRes.data ?? []
      const savedCosts = laborCostRes.data ?? []
      const leaveList = leaveRes.data ?? []

      // Group absensi per user
      const byUser: Record<string, {
        user_id: string; nama: string; role: string; gaji_pokok: number
        hari_hadir: number; total_menit: number; vpn_count: number
      }> = {}

      absensiList.forEach((a) => {
        if (!byUser[a.karyawan_id]) {
          const u = (a.karyawan as unknown) as { id: string; nama_lengkap: string; role: string; gaji_pokok: number } | null
          byUser[a.karyawan_id] = {
            user_id: a.karyawan_id,
            nama: u?.nama_lengkap ?? 'Unknown',
            role: u?.role ?? '',
            gaji_pokok: u?.gaji_pokok ?? 0,
            hari_hadir: 0,
            total_menit: 0,
            vpn_count: 0,
          }
        }
        if (a.status === 'hadir') {
          byUser[a.karyawan_id].hari_hadir++
          if (a.jam_masuk && a.jam_pulang) {
            const menit = Math.round(
              (new Date(a.jam_pulang).getTime() - new Date(a.jam_masuk).getTime()) / 60000
            )
            byUser[a.karyawan_id].total_menit += menit
          }
          if (a.is_vpn) byUser[a.karyawan_id].vpn_count++
        }
      })

      const totalHadir = Object.values(byUser).reduce((s, u) => s + u.hari_hadir, 0)
      const totalJam = Object.values(byUser).reduce((s, u) => s + Math.round(u.total_menit / 60), 0)
      const totalSavedCost = savedCosts.reduce((s, c) => s + c.nilai_cost, 0)

      return ok({
        summary: {
          total_karyawan: userList.length,
          total_hadir: totalHadir,
          total_jam_kerja: totalJam,
          total_saved_cost: totalSavedCost,
        },
        by_user: Object.values(byUser),
        saved_costs: savedCosts,
        leave_summary: leaveList,
        all_users: userList,
      })
    }

    return badRequest('Tipe laporan tidak valid')
  } catch (err) {
    console.error('GET /api/reports error:', err)
    return serverError()
  }
}
