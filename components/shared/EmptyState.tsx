import { cn } from '@/lib/utils'
import { InboxIcon } from 'lucide-react'

interface EmptyStateProps {
  title?: string
  description?: string
  icon?: React.ElementType
  action?: React.ReactNode
  className?: string
}

export default function EmptyState({
  title = 'Belum ada data',
  description,
  icon: Icon = InboxIcon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-6 text-center', className)}>
      <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-[#5C5040]" />
      </div>
      <h3 className="text-base font-semibold text-[#A8967E]">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-[#5C5040] max-w-xs">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
