import { createClient } from './server'
import { UserRole } from '@/lib/types'

export async function getAuthUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  return user
}

export async function getAuthProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('m_users')
    .select('id, nama_lengkap, role, lokasi_tugas')
    .eq('id', user.id)
    .single()

  return profile
}

export function hasRole(role: UserRole, allowed: UserRole[]): boolean {
  return allowed.includes(role)
}

export function unauthorized() {
  return Response.json(
    { success: false, message: 'Unauthorized' },
    { status: 401 }
  )
}

export function forbidden() {
  return Response.json(
    { success: false, message: 'Forbidden' },
    { status: 403 }
  )
}

export function badRequest(message: string) {
  return Response.json(
    { success: false, message },
    { status: 400 }
  )
}

export function notFound(message = 'Not found') {
  return Response.json(
    { success: false, message },
    { status: 404 }
  )
}

export function conflict(message: string) {
  return Response.json(
    { success: false, message },
    { status: 409 }
  )
}

export function serverError(message = 'Internal server error') {
  return Response.json(
    { success: false, message },
    { status: 500 }
  )
}

export function ok(data: object, message = 'Success') {
  return Response.json({ success: true, message, data }, { status: 200 })
}

export function created(data: object, message = 'Created') {
  return Response.json({ success: true, message, data }, { status: 201 })
}
