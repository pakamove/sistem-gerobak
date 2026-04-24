import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const roleRedirects: Record<string, string> = {
  owner: '/dashboard',
  manager: '/dashboard',
  purchaser: '/purchasing',
  koki: '/kitchen',
  crew_gerobak: '/pos',
  delivery: '/pos',
}

const roleAllowedPaths: Record<string, string[]> = {
  owner: ['/dashboard', '/pos', '/kitchen', '/inventory', '/purchasing', '/attendance', '/reports', '/settings'],
  manager: ['/dashboard', '/pos', '/kitchen', '/inventory', '/purchasing', '/attendance', '/reports', '/settings'],
  purchaser: ['/purchasing', '/inventory', '/attendance', '/settings'],
  koki: ['/kitchen', '/inventory', '/attendance', '/settings'],
  crew_gerobak: ['/pos', '/attendance', '/settings'],
  delivery: ['/pos', '/attendance', '/settings'],
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname

  if (pathname === '/login') {
    if (user) {
      const { data: profile } = await supabase
        .from('m_users')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile) {
        const redirectPath = roleRedirects[profile.role] || '/pos'
        return NextResponse.redirect(new URL(redirectPath, request.url))
      }
    }
    return supabaseResponse
  }

  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const { data: profile } = await supabase
    .from('m_users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const allowedPaths = roleAllowedPaths[profile.role] || []
  const isAllowed = allowedPaths.some((p) => pathname.startsWith(p))

  if (!isAllowed) {
    const redirectPath = roleRedirects[profile.role] || '/pos'
    return NextResponse.redirect(new URL(redirectPath, request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/|icons/).*)'],
}
