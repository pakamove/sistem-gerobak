import { createClient } from '@/lib/supabase/server'
import { getAuthProfile, unauthorized, ok, badRequest, serverError } from '@/lib/supabase/auth-helpers'

export async function GET(request: Request) {
  const profile = await getAuthProfile()
  if (!profile) return unauthorized()

  const { searchParams } = new URL(request.url)
  const shiftId = searchParams.get('shift_id')
  if (!shiftId) return badRequest('shift_id wajib diisi')

  try {
    const supabase = await createClient()

    const { data: transactions } = await supabase
      .from('t_transaksi')
      .select('total, metode_bayar, waktu')
      .eq('shift_id', shiftId)
      .eq('status', 'selesai')
      .order('waktu', { ascending: false })

    const allTx = transactions || []
    const total_transaksi = allTx.reduce((sum, t) => sum + t.total, 0)
    const total_qris = allTx.filter((t) => t.metode_bayar === 'qris').reduce((sum, t) => sum + t.total, 0)
    const total_tunai = allTx.filter((t) => t.metode_bayar === 'tunai').reduce((sum, t) => sum + t.total, 0)
    const jumlah_transaksi = allTx.length

    return ok({ total_transaksi, total_qris, total_tunai, jumlah_transaksi }, 'Shift summary berhasil diambil')
  } catch (err) {
    console.error('GET /api/pos/shift/summary error:', err)
    return serverError()
  }
}
