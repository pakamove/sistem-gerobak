'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  ShoppingCart,
  ChefHat,
  Package,
  ShoppingBag,
  LayoutDashboard,
  Settings,
  ClipboardCheck,
  BarChart3,
} from 'lucide-react'
import { UserRole } from '@/lib/types'
import { cn } from '@/lib/utils'

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  roles: UserRole[]
}

const navItems: NavItem[] = [
  { label: 'POS', href: '/pos', icon: ShoppingCart, roles: ['owner', 'manager', 'crew_gerobak', 'delivery'] },
  { label: 'Dapur', href: '/kitchen', icon: ChefHat, roles: ['owner', 'manager', 'koki'] },
  { label: 'Stok', href: '/inventory', icon: Package, roles: ['owner', 'manager', 'purchaser', 'koki'] },
  { label: 'Beli', href: '/purchasing', icon: ShoppingBag, roles: ['owner', 'manager', 'purchaser'] },
  { label: 'Absensi', href: '/attendance', icon: ClipboardCheck, roles: ['owner', 'manager', 'purchaser', 'koki', 'delivery'] },
  { label: 'Laporan', href: '/reports', icon: BarChart3, roles: ['owner', 'manager'] },
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['owner', 'manager'] },
  { label: 'Profil', href: '/settings', icon: Settings, roles: ['owner', 'manager', 'purchaser', 'koki', 'crew_gerobak', 'delivery'] },
]

interface BottomNavProps {
  role: UserRole
}

export default function BottomNav({ role }: BottomNavProps) {
  const pathname = usePathname()
  const visible = navItems.filter((item) => item.roles.includes(role))

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#1C1712] border-t border-white/8 z-50 safe-area-bottom">
      <div className="flex items-center justify-around px-2 h-16">
        {visible.map((item) => {
          const active = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-colors min-w-[48px]',
                active
                  ? 'text-[#D4722A]'
                  : 'text-[#5C5040] hover:text-[#A8967E]'
              )}
            >
              <item.icon
                className={cn('w-5 h-5', active && 'text-[#D4722A]')}
                strokeWidth={active ? 2.5 : 1.8}
              />
              <span className={cn('text-[10px] font-medium leading-none', active && 'text-[#D4722A]')}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
