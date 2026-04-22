'use client'

import { useQuery } from '@tanstack/react-query'
import { Shift } from '@/lib/types'

export function useActiveShift() {
  return useQuery<Shift | null>({
    queryKey: ['activeShift'],
    queryFn: async () => {
      const res = await fetch('/api/pos/shift')
      if (!res.ok) return null
      const json = await res.json()
      return json.data?.shift || null
    },
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  })
}

export function useAllShifts(date?: string) {
  return useQuery<Shift[]>({
    queryKey: ['shifts', date],
    queryFn: async () => {
      const params = date ? `?date=${date}` : ''
      const res = await fetch(`/api/pos/shift${params}`)
      if (!res.ok) return []
      const json = await res.json()
      return json.data?.shifts || []
    },
    staleTime: 30 * 1000,
  })
}
