import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
}

function Skeleton({ className }: SkeletonProps) {
  return (
    <div className={cn('animate-pulse rounded-lg bg-white/5', className)} />
  )
}

export function CardSkeleton() {
  return (
    <div className="bg-[#231e18] rounded-xl p-4 space-y-3 border border-white/8">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-8 w-1/2" />
      <Skeleton className="h-3 w-full" />
    </div>
  )
}

export function ListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3 px-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-[#231e18] rounded-xl p-4 flex gap-3 border border-white/8">
          <Skeleton className="w-12 h-12 rounded-lg flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function GridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 px-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-[#231e18] rounded-xl p-4 border border-white/8 space-y-2">
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-5 w-1/2" />
        </div>
      ))}
    </div>
  )
}

export function SummarySkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 px-4">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="bg-[#231e18] rounded-xl p-4 border border-white/8 space-y-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-7 w-24" />
        </div>
      ))}
    </div>
  )
}

export default Skeleton
