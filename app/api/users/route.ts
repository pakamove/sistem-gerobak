import { createAdminClient } from '@/lib/supabase/server'
import {
  getAuthProfile,
  unauthorized,
  forbidden,
  serverError,
  ok,
  badRequest,
} from '@/lib/supabase/auth-helpers'

const VALID_ROLES = ['owner', 'manager', 'purchaser', 'koki', 'crew_gerobak', 'delivery']

export async function GET() {
  const profile = await getAuthProfile()
  if (!profile) return unauthorized()
  if (!['owner', 'manager'].includes(profile.role)) return forbidden()

  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('m_users')
      .select('id, nama_lengkap, role, lokasi_tugas, no_hp, is_active, created_at')
      .order('nama_lengkap')

    if (error) throw error
    return ok({ users: data ?? [] })
  } catch (err) {
    console.error('GET /api/users error:', err)
    return serverError()
  }
}

export async function POST(request: Request) {
  const profile = await getAuthProfile()
  if (!profile) return unauthorized()
  if (!['owner', 'manager'].includes(profile.role)) return forbidden()

  try {
    const body = await request.json()
    const { nama_lengkap, email, password, role, lokasi_tugas, no_hp } = body

    if (!nama_lengkap?.trim()) return badRequest('Nama lengkap wajib diisi')
    if (!email?.trim()) return badRequest('Email wajib diisi')
    if (!password || password.length < 6) return badRequest('Password minimal 6 karakter')
    if (!role || !VALID_ROLES.includes(role)) return badRequest('Role tidak valid')

    const admin = createAdminClient()

    // Buat user di Supabase Auth
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password,
      email_confirm: true,
    })

    if (authError) {
      if (authError.message.includes('already registered')) {
        return badRequest('Email sudah terdaftar')
      }
      throw authError
    }

    const userId = authData.user.id

    // Buat profil di m_users
    const { data: user, error: profileError } = await admin
      .from('m_users')
      .insert({
        id: userId,
        nama_lengkap: nama_lengkap.trim(),
        role,
        lokasi_tugas: lokasi_tugas || null,
        no_hp: no_hp?.trim() || null,
        is_active: true,
      })
      .select()
      .single()

    if (profileError) {
      // Rollback: hapus auth user jika gagal buat profil
      await admin.auth.admin.deleteUser(userId)
      throw profileError
    }

    return ok({ user }, 'User berhasil dibuat')
  } catch (err) {
    console.error('POST /api/users error:', err)
    return serverError()
  }
}
