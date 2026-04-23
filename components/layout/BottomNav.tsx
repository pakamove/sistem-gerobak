'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  ShoppingCart, ChefHat, Package, ShoppingBag,
  LayoutDashboard, Settings, ClipboardCheck, BarChart3, Clock,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AppModule } from '@/lib/types'

const ICON_MAP: Record<string, React.ElementType> = {
  ShoppingCart, ChefHat, Package, ShoppingBag,
  LayoutDashboard, Settings, ClipboardCheck, BarChart3, Clock,
}

interface BottomNavProps {
  modules: AppModule[]
  role: string
}

export default function BottomNav({ modules }: BottomNavProps) {
  const pathname = usePathname()
  // Limit to 5 to avoid overflow on mobile
  const visible = modules.slice(0, 5)

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#1C1712] border-t border-white/8 z-50 safe-area-bottom">
      <div className="flex items-center justify-around px-2 h-16">
        {visible.map((item) => {
          const Icon = ICON_MAP[item.icon_name]
          const active = pathname.startsWith(item.href)
          return (
            <Link
              key={item.key}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-colors min-w-[48px]',
                active ? 'text-[#D4722A]' : 'text-[#5C5040] hover:text-[#A8967E]'
              )}
            >
              {Icon && (
                <Icon
                  className={cn('w-5 h-5', active && 'text-[#D4722A]')}
                  strokeWidth={active ? 2.5 : 1.8}
                />
              )}
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
