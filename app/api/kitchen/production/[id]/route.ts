import { createClient } from '@/lib/supabase/server'
import {
  getAuthProfile,
  unauthorized,
  serverError,
  ok,
  badRequest,
  notFound,
} from '@/lib/supabase/auth-helpers'

const validStatuses = ['belum', 'proses', 'selesai', 'qc_ok', 'terkirim']

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const profile = await getAuthProfile()
  if (!profile) return unauthorized()

  const { id } = await params

  try {
    const body = await request.json()
    const { status, realisasi_porsi, catatan } = body

    if (status && !validStatuses.includes(status)) {
      return badRequest('Status tidak valid')
    }
    if (realisasi_porsi !== undefined && realisasi_porsi < 0) {
      return badRequest('Realisasi porsi tidak boleh negatif')
    }

    const supabase = await createClient()

    const { data: existing } = await supabase
      .from('t_produksi')
      .select('id, koki_id, status')
      .eq('id', id)
      .single()

    if (!existing) return notFound('Data produksi tidak ditemukan')

    // Role check: koki hanya bisa update tugas yang ditugaskan
    if (profile.role === 'koki' && existing.koki_id !== profile.id) {
      return badRequest('Koki hanya bisa update tugas sendiri')
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (status) updateData.status = status
    if (status === 'selesai' || status === 'qc_ok') {
      updateData.waktu_selesai = new Date().toISOString()
    }
    if (realisasi_porsi !== undefined) updateData.realisasi_porsi = realisasi_porsi
    if (catatan !== undefined) updateData.catatan = catatan

    const { data, error } = await supabase
      .from('t_produksi')
      .update(updateData)
      .eq('id', id)
      .select(`*, menu:m_menu(id, nama_menu), koki:m_users(id, nama_lengkap)`)
      .single()

    if (error) throw error

    return ok({ production: data }, 'Produksi berhasil diperbarui')
  } catch (err) {
    console.error('PATCH /api/kitchen/production/[id] error:', err)
    return serverError()
  }
}
