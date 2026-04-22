import { createClient, createAdminClient } from '@/lib/supabase/server'
import {
  getAuthProfile,
  unauthorized,
  serverError,
  ok,
  created,
  badRequest,
} from '@/lib/supabase/auth-helpers'
import { getTodayDate, generateStrukNomor, getGerobakNumber } from '@/lib/utils/format'

export async function GET(request: Request) {
  const profile = await getAuthProfile()
  if (!profile) return unauthorized()

  const { searchParams } = new URL(request.url)
  const shiftId = searchParams.get('shift_id')
  const date = searchParams.get('date') || getTodayDate()
  const gerobakId = searchParams.get('gerobak_id')

  try {
    const supabase = await createClient()

    let query = supabase
      .from('t_transaksi')
      .select(`
        id, nomor_struk, waktu, metode_bayar, total, status,
        penjualan:t_penjualan(nama_menu, qty, subtotal)
      `)
      .gte('waktu', `${date}T00:00:00`)
      .lte('waktu', `${date}T23:59:59`)
      .order('waktu', { ascending: false })

    if (shiftId) query = query.eq('shift_id', shiftId)
    if (gerobakId) query = query.eq('gerobak_id', gerobakId)
    if (profile.role === 'crew_gerobak') {
      query = query.eq('crew_id', profile.id)
    }

    const { data, error } = await query
    if (error) throw error

    return ok({ transactions: data })
  } catch (err) {
    console.error('GET /api/pos/transactions error:', err)
    return serverError()
  }
}

export async function POST(request: Request) {
  const profile = await getAuthProfile()
  if (!profile) return unauthorized()

  try {
    const body = await request.json()
    const { shift_id, metode_bayar, cart_items, payment } = body

    if (!shift_id) return badRequest('shift_id wajib diisi')
    if (!metode_bayar || !['tunai', 'qris'].includes(metode_bayar)) {
      return badRequest('metode_bayar tidak valid')
    }
    if (!cart_items || cart_items.length === 0) return badRequest('Cart tidak boleh kosong')

    const supabase = await createClient()
    const adminSupabase = createAdminClient()

    // Validate shift — pakai admin client agar tidak terblokir RLS
    const { data: shift, error: shiftErr } = await adminSupabase
      .from('t_shift')
      .select('*, gerobak:m_gerobak(id, nama)')
      .eq('id', shift_id)
      .is('waktu_tutup', null)
      .single()

    if (shiftErr || !shift) return badRequest('Shift tidak aktif atau tidak ditemukan')

    // Fetch menu prices server-side
    const menuIds = cart_items.map((i: { menu_id: string }) => i.menu_id)
    const { data: menus, error: menuErr } = await supabase
      .from('m_menu')
      .select('id, nama_menu, harga_jual')
      .in('id', menuIds)
      .eq('is_active', true)

    if (menuErr || !menus || menus.length !== menuIds.length) {
      return badRequest('Beberapa menu tidak valid atau tidak aktif')
    }

    const menuMap = new Map(menus.map((m) => [m.id, m]))

    // Calculate totals server-side
    let total = 0
    const penjualanRows: {
      shift_id: string
      menu_id: string
      nama_menu: string
      harga_satuan: number
      qty: number
      subtotal: number
      status: string
    }[] = []

    for (const item of cart_items) {
      const menu = menuMap.get(item.menu_id)
      if (!menu) return badRequest(`Menu tidak valid: ${item.menu_id}`)
      const qty = Math.max(1, Math.floor(item.qty))
      const subtotal = menu.harga_jual * qty
      total += subtotal
      penjualanRows.push({
        shift_id,
        menu_id: item.menu_id,
        nama_menu: menu.nama_menu,
        harga_satuan: menu.harga_jual,
        qty,
        subtotal,
        status: 'terjual',
      })
    }

    // Validate payment
    if (metode_bayar === 'tunai') {
      const uangDiterima = payment?.uang_diterima || 0
      if (uangDiterima < total) {
        return badRequest(`Uang diterima (${uangDiterima}) kurang dari total (${total})`)
      }
    } else if (metode_bayar === 'qris') {
      if (!payment?.confirmed) return badRequest('Pembayaran QRIS belum dikonfirmasi')
    }

    // Generate nomor struk
    const gerobakNo = getGerobakNumber(shift.gerobak?.nama || 'Gerobak 1')
    const { count } = await supabase
      .from('t_transaksi')
      .select('*', { count: 'exact', head: true })
      .eq('gerobak_id', shift.gerobak_id)
      .gte('waktu', new Date().toISOString().slice(0, 10) + 'T00:00:00')

    const nomorStruk = generateStrukNomor(gerobakNo, new Date(), (count || 0) + 1)

    // Insert transaksi
    const { data: transaksi, error: trxErr } = await supabase
      .from('t_transaksi')
      .insert({
        shift_id,
        gerobak_id: shift.gerobak_id,
        nomor_struk: nomorStruk,
        metode_bayar,
        total,
        status: 'selesai',
        crew_id: profile.id,
      })
      .select()
      .single()

    if (trxErr) throw trxErr

    // Insert penjualan
    const penjualanWithTrx = penjualanRows.map((p) => ({
      ...p,
      transaksi_id: transaksi.id,
    }))

    const { error: penjualanErr } = await supabase
      .from('t_penjualan')
      .insert(penjualanWithTrx)

    if (penjualanErr) throw penjualanErr

    // Update qty_terjual in t_stok_gerobak (best-effort)
    for (const item of penjualanRows) {
      try {
        await supabase.rpc('increment_stok_terjual', {
          p_shift_id: shift_id,
          p_menu_id: item.menu_id,
          p_qty: item.qty,
        })
      } catch {
        // RPC might not exist, skip
      }
    }

    const kembalian = metode_bayar === 'tunai' ? (payment?.uang_diterima || 0) - total : 0

    return created({
      transaction: {
        id: transaksi.id,
        nomor_struk: nomorStruk,
        metode_bayar,
        total,
        kembalian,
      },
    }, 'Transaksi berhasil disimpan')
  } catch (err) {
    console.error('POST /api/pos/transactions error:', err)
    return serverError()
  }
}
