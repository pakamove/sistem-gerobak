import { createAdminClient } from '@/lib/supabase/server'
import { getAuthProfile, unauthorized, forbidden, serverError, ok, badRequest } from '@/lib/supabase/auth-helpers'

// POST: upload dokumen ke Supabase Storage, return public URL
export async function POST(request: Request) {
  const profile = await getAuthProfile()
  if (!profile) return unauthorized()
  if (profile.role === 'owner') return forbidden()

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) return badRequest('File wajib diupload')
    if (file.size > 10 * 1024 * 1024) return badRequest('Ukuran file maksimal 10MB')

    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
    if (!allowed.includes(file.type)) {
      return badRequest('Format file harus JPG, PNG, WebP, atau PDF')
    }

    const ext = file.name.split('.').pop() ?? 'jpg'
    const path = `${profile.id}/${Date.now()}.${ext}`

    const admin = createAdminClient()
    const { error } = await admin.storage
      .from('leave-documents')
      .upload(path, file, { contentType: file.type, upsert: false })

    if (error) throw error

    const { data: urlData } = admin.storage
      .from('leave-documents')
      .getPublicUrl(path)

    return ok({ url: urlData.publicUrl, path }, 'Dokumen berhasil diupload')
  } catch (err) {
    console.error('POST /api/leave-requests/upload error:', err)
    return serverError()
  }
}
