'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Loader2, UtensilsCrossed } from 'lucide-react'

const roleRedirects: Record<string, string> = {
  owner: '/dashboard',
  manager: '/dashboard',
  purchaser: '/purchasing',
  koki: '/kitchen',
  crew_gerobak: '/pos',
  delivery: '/pos',
}

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      toast.error('Email dan password wajib diisi')
      return
    }

    setLoading(true)
    const supabase = createClient()

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      toast.error('Login gagal: ' + error.message)
      setLoading(false)
      return
    }

    if (data.user) {
      const { data: profile } = await supabase
        .from('m_users')
        .select('role')
        .eq('id', data.user.id)
        .single()

      if (!profile) {
        toast.error('Profil pengguna tidak ditemukan')
        setLoading(false)
        return
      }

      const redirect = roleRedirects[profile.role] || '/pos'
      toast.success('Login berhasil! Mengarahkan...')
      router.push(redirect)
      router.refresh()
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#1C1712] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 bg-[#D4722A] rounded-2xl flex items-center justify-center">
            <UtensilsCrossed className="w-8 h-8 text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-[#EDE5D8]">Sistem Gerobak</h1>
            <p className="text-sm text-[#A8967E] mt-1">Sistem Operasional F&B</p>
          </div>
        </div>

        {/* Form */}
        <div className="bg-[#231e18] rounded-2xl p-6 space-y-5 border border-white/8">
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[#EDE5D8] text-sm font-medium">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="bg-[#2C1810] border-white/10 text-[#EDE5D8] placeholder:text-[#5C5040] h-12"
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-[#EDE5D8] text-sm font-medium">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="bg-[#2C1810] border-white/10 text-[#EDE5D8] placeholder:text-[#5C5040] h-12"
                autoComplete="current-password"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-[#D4722A] hover:bg-[#c0601e] text-white font-semibold text-base"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Masuk...
                </>
              ) : (
                'Masuk'
              )}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-[#5C5040]">
          v{process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0'}
        </p>
      </div>
    </div>
  )
}
