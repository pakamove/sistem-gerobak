'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  ShoppingCart, ChefHat, Package, ShoppingBag,
  LayoutDashboard, Settings, ClipboardCheck, BarChart3, Clock,
  LogOut, ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import type { AppModule } from '@/lib/types'

const ICON_MAP: Record<string, React.ElementType> = {
  ShoppingCart, ChefHat, Package, ShoppingBag,
  LayoutDashboard, Settings, ClipboardCheck, BarChart3, Clock,
}

const CATEGORY_LABEL: Record<string, string> = {
  operational: 'Operasional',
  management: 'Manajemen',
  settings: 'Pengaturan',
}

interface SideNavProps {
  modules: AppModule[]
  role: string
  roleName: string
  userName: string
}

export default function SideNav({ modules, roleName, userName }: SideNavProps) {
  const pathname = usePathname()
  const router = useRouter()

  const categories = ['operational', 'management', 'settings'] as const
  const grouped = categories.reduce((acc, cat) => {
    const items = modules.filter((m) => m.kategori === cat)
    if (items.length) acc[cat] = items
    return acc
  }, {} as Record<string, AppModule[]>)

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="w-56 flex-shrink-0 bg-[#231e18] border-r border-white/8 flex flex-col h-full">
      {/* Brand */}
      <div className="px-4 pt-5 pb-4 border-b border-white/8">
        <p className="text-[#D4722A] font-bold text-sm tracking-wide">Sistem Gerobak</p>
        <p className="text-sm text-[#EDE5D8] font-medium mt-3 truncate">{userName}</p>
        <span className="inline-block text-[10px] text-[#A8967E] bg-white/5 px-2 py-0.5 rounded-full mt-1 capitalize">
          {roleName}
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
        {categories.map((cat) => {
          const items = grouped[cat]
          if (!items) return null
          return (
            <div key={cat}>
              <p className="text-[10px] text-[#5C5040] font-bold uppercase tracking-widest px-2 mb-1">
                {CATEGORY_LABEL[cat]}
              </p>
              {items.map((item) => {
                const Icon = ICON_MAP[item.icon_name]
                const active = pathname === item.href || pathname.startsWith(item.href + '/')
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors mb-0.5 group',
                      active
                        ? 'bg-[#D4722A]/15 text-[#D4722A]'
                        : 'text-[#A8967E] hover:bg-white/5 hover:text-[#EDE5D8]'
                    )}
                  >
                    {Icon && (
                      <Icon
                        className={cn('w-4 h-4 flex-shrink-0', active && 'text-[#D4722A]')}
                        strokeWidth={active ? 2.5 : 1.8}
                      />
                    )}
                    <span className="flex-1">{item.label}</span>
                    {active && <ChevronRight className="w-3 h-3 opacity-60" />}
                  </Link>
                )
              })}
            </div>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="border-t border-white/8 p-2">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-[#5C5040] hover:bg-white/5 hover:text-[#A8967E] transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Keluar</span>
        </button>
      </div>
    </aside>
  )
}
