import { createAdminClient } from '@/lib/supabase/server'
import { getAuthProfile, unauthorized, forbidden, serverError, ok, badRequest } from '@/lib/supabase/auth-helpers'

export async function GET() {
  const profile = await getAuthProfile()
  if (!profile) return unauthorized()
  if (!['owner', 'manager'].includes(profile.role)) return forbidden()

  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('m_aset')
      .select('*')
      .order('nama_aset')

    if (error) throw error
    return ok({ assets: data ?? [] })
  } catch (err) {
    console.error('GET /api/assets error:', err)
    return serverError()
  }
}

export async function POST(request: Request) {
  const profile = await getAuthProfile()
  if (!profile) return unauthorized()
  if (!['owner', 'manager'].includes(profile.role)) return forbidden()

  try {
    const body = await request.json()
    const {
      nama_aset, kategori, merk_model, kode_aset,
      tanggal_beli, harga_beli, lokasi, penanggung_jawab,
      umur_manfaat_tahun, metode_penyusutan, nilai_residu, catatan,
    } = body

    if (!nama_aset?.trim()) return badRequest('Nama aset wajib diisi')
    if (!harga_beli || parseInt(harga_beli) <= 0) return badRequest('Harga beli wajib diisi')

    const hargaNum = parseInt(harga_beli)
    const umurNum = umur_manfaat_tahun ? parseInt(umur_manfaat_tahun) : 5
    const nilaiResiduNum = nilai_residu ? parseInt(nilai_residu) : 0

    // Hitung penyusutan per tahun (Garis Lurus)
    const penyusutanPerTahun = umurNum > 0 ? Math.round((hargaNum - nilaiResiduNum) / umurNum) : 0

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('m_aset')
      .insert({
        nama_aset: nama_aset.trim(),
        kategori: kategori || null,
        merk_model: merk_model?.trim() || null,
        kode_aset: kode_aset?.trim() || null,
        tanggal_beli: tanggal_beli || null,
        harga_beli: hargaNum,
        nilai_buku: hargaNum,
        lokasi: lokasi?.trim() || null,
        penanggung_jawab: penanggung_jawab?.trim() || null,
        umur_manfaat_tahun: umurNum,
        metode_penyusutan: metode_penyusutan || 'Garis Lurus',
        nilai_residu: nilaiResiduNum,
        penyusutan_per_tahun: penyusutanPerTahun,
        status: 'aktif',
        catatan: catatan?.trim() || null,
        dibuat_oleh: profile.id,
      })
      .select()
      .single()

    if (error) throw error
    return ok({ asset: data }, 'Aset berhasil ditambahkan')
  } catch (err) {
    console.error('POST /api/assets error:', err)
    return serverError()
  }
}
