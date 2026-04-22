import { cn } from '@/lib/utils'

interface TopHeaderProps {
  title: string
  subtitle?: string
  rightAction?: React.ReactNode
  className?: string
}

export default function TopHeader({ title, subtitle, rightAction, className }: TopHeaderProps) {
  return (
    <header
      className={cn(
        'sticky top-0 z-40 bg-[#1C1712]/95 backdrop-blur-sm border-b border-white/8 px-4',
        'safe-area-top',
        className
      )}
    >
      <div className="flex items-center justify-between h-14">
        <div>
          <h1 className="text-base font-semibold text-[#EDE5D8] leading-tight">{title}</h1>
          {subtitle && (
            <p className="text-xs text-[#A8967E] leading-tight">{subtitle}</p>
          )}
        </div>
        {rightAction && <div className="flex items-center gap-2">{rightAction}</div>}
      </div>
    </header>
  )
}
