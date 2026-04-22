import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

interface SummaryCardProps {
  label: string
  value: string | number
  helperText?: string
  icon?: LucideIcon
  iconColor?: string
  trend?: 'up' | 'down' | 'neutral'
  className?: string
}

export default function SummaryCard({
  label,
  value,
  helperText,
  icon: Icon,
  iconColor = 'text-[#D4722A]',
  className,
}: SummaryCardProps) {
  return (
    <div className={cn('bg-[#231e18] rounded-xl p-4 border border-white/8 space-y-2', className)}>
      <div className="flex items-center justify-between">
        <p className="text-xs text-[#A8967E] font-medium">{label}</p>
        {Icon && <Icon className={cn('w-4 h-4', iconColor)} />}
      </div>
      <p className="text-xl font-bold text-[#EDE5D8] leading-none">{value}</p>
      {helperText && <p className="text-xs text-[#5C5040]">{helperText}</p>}
    </div>
  )
}
