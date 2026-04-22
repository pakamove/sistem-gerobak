import { createClient } from '@/lib/supabase/server'
import {
  getAuthProfile,
  unauthorized,
  serverError,
  ok,
  badRequest,
  notFound,
  conflict,
} from '@/lib/supabase/auth-helpers'

export async function POST(request: Request) {
  const profile = await getAuthProfile()
  if (!profile) return unauthorized()

  try {
    const body = await request.json()
    const {
      shift_id,
      cash_akhir,
      total_qris = 0,
      stok_penutupan = [],
      catatan = '',
    } = body

    if (!shift_id) return badRequest('shift_id wajib diisi')
    if (cash_akhir === undefined || cash_akhir === null) return badRequest('cash_akhir wajib diisi')
    if (cash_akhir < 0) return badRequest('cash_akhir tidak boleh negatif')
    if (total_qris < 0) return badRequest('total_qris tidak boleh negatif')

    const supabase = await createClient()

    const { data: shift, error: shiftFetchErr } = await supabase
      .from('t_shift')
      .select('*')
      .eq('id', shift_id)
      .single()

    if (shiftFetchErr || !shift) return notFound('Shift tidak ditemukan')
    if (shift.waktu_tutup) return conflict('Shift sudah ditutup sebelumnya')

    // Hitung total transaksi sistem
    const { data: transactions } = await supabase
      .from('t_transaksi')
      .select('total')
      .eq('shift_id', shift_id)
      .eq('status', 'selesai')

    const totalTransaksiSistem = (transactions || []).reduce((sum, t) => sum + t.total, 0)
    const selisih = (cash_akhir - shift.cash_awal) + total_qris - totalTransaksiSistem
    const statusRekon = selisih === 0 ? 'ok' : 'ada_selisih'

    // Update shift
    const { error: updateErr } = await supabase
      .from('t_shift')
      .update({
        waktu_tutup: new Date().toISOString(),
        cash_akhir,
        total_qris,
        total_transaksi_sistem: totalTransaksiSistem,
        selisih,
        status_rekon: statusRekon,
        catatan,
      })
      .eq('id', shift_id)

    if (updateErr) throw updateErr

    // Update stok penutupan
    for (const stok of stok_penutupan) {
      if (!stok.menu_id) continue
      await supabase
        .from('t_stok_gerobak')
        .update({
          qty_sisa: stok.qty_sisa ?? 0,
          qty_waste: stok.qty_waste ?? 0,
        })
        .eq('shift_id', shift_id)
        .eq('menu_id', stok.menu_id)
    }

    return ok({
      shift: {
        id: shift_id,
        total_transaksi_sistem: totalTransaksiSistem,
        selisih,
        status_rekon: statusRekon,
      },
    }, 'Shift berhasil ditutup')
  } catch (err) {
    console.error('POST /api/pos/shift/close error:', err)
    return serverError()
  }
}
