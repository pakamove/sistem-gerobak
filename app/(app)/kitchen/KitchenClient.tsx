'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, ChefHat, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import TopHeader from '@/components/layout/TopHeader'
import EmptyState from '@/components/shared/EmptyState'
import { ListSkeleton } from '@/components/shared/LoadingSkeleton'
import ProductionCard from '@/components/kitchen/ProductionCard'
import CreateProductionModal from '@/components/kitchen/CreateProductionModal'
import UpdateProductionModal from '@/components/kitchen/UpdateProductionModal'
import { getTodayDate, formatDate } from '@/lib/utils/format'
import type { Produksi } from '@/lib/types'

interface KitchenClientProps {
  role: string
  userId: string
}

type ActiveTab = 'semua' | 'saya'

async function fetchProductions(date: string, assignedToMe: boolean): Promise<Produksi[]> {
  const params = new URLSearchParams({ date })
  if (assignedToMe) params.set('assigned_to', 'me')
  const res = await fetch(`/api/kitchen/production?${params.toString()}`)
  if (!res.ok) throw new Error('Gagal memuat data produksi')
  const json = await res.json()
  return json.data?.productions ?? []
}

function DateSelector({
  selectedDate,
  onChange,
}: {
  selectedDate: string
  onChange: (date: string) => void
}) {
  const today = getTodayDate()

  function shift(days: number) {
    const d = new Date(selectedDate)
    d.setDate(d.getDate() + days)
    onChange(d.toISOString().slice(0, 10))
  }

  const isToday = selectedDate === today

  return (
    <div className="flex items-center justify-between px-4 py-2 border-b border-white/8">
      <button
        onClick={() => shift(-1)}
        className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 text-[#A8967E] hover:bg-white/10 transition-colors text-base font-bold"
        aria-label="Hari sebelumnya"
      >
        ‹
      </button>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange(today)}
          className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
            isToday
              ? 'bg-[#D4722A] text-white'
              : 'bg-white/5 text-[#A8967E] hover:bg-white/10'
          }`}
        >
          Hari Ini
        </button>
        <span className="text-sm text-[#EDE5D8] font-medium">
          {formatDate(selectedDate)}
        </span>
      </div>

      <button
        onClick={() => shift(1)}
        className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 text-[#A8967E] hover:bg-white/10 transition-colors text-base font-bold"
        aria-label="Hari berikutnya"
      >
        ›
      </button>
    </div>
  )
}

function TabBar({
  active,
  onChange,
}: {
  active: ActiveTab
  onChange: (tab: ActiveTab) => void
}) {
  return (
    <div className="flex px-4 py-2 gap-2 border-b border-white/8">
      {(['semua', 'saya'] as ActiveTab[]).map((tab) => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
            active === tab
              ? 'bg-[#D4722A] text-white'
              : 'bg-white/5 text-[#A8967E] hover:bg-white/10'
          }`}
        >
          {tab === 'semua' ? 'Semua' : 'Tugas Saya'}
        </button>
      ))}
    </div>
  )
}

export default function KitchenClient({ role, userId }: KitchenClientProps) {
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDate())
  const [activeTab, setActiveTab] = useState<ActiveTab>('semua')
  const [showCreate, setShowCreate] = useState(false)
  const [selectedProduction, setSelectedProduction] = useState<Produksi | null>(null)

  const queryClient = useQueryClient()

  const assignedToMe = activeTab === 'saya'

  const {
    data: productions,
    isLoading,
    isError,
    refetch,
  } = useQuery<Produksi[]>({
    queryKey: ['productions', selectedDate, activeTab],
    queryFn: () => fetchProductions(selectedDate, assignedToMe),
    staleTime: 30 * 1000,
  })

  function handleUpdateStatus(id: string) {
    const prod = (productions ?? []).find((p) => p.id === id) ?? null
    setSelectedProduction(prod)
  }

  function handleRefresh() {
    queryClient.invalidateQueries({ queryKey: ['productions'] })
  }

  function handleMutationSuccess() {
    queryClient.invalidateQueries({ queryKey: ['productions'] })
  }

  const isManagerOrOwner = role === 'manager' || role === 'owner'
  const isKoki = role === 'koki'

  return (
    <div className="min-h-screen bg-[#1C1712] flex flex-col">
      <TopHeader
        title="Dapur"
        subtitle="Central Kitchen"
        rightAction={
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleRefresh}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-[#A8967E] hover:text-[#EDE5D8] hover:bg-white/5 transition-colors"
              aria-label="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            {isManagerOrOwner && (
              <Button
                size="sm"
                onClick={() => setShowCreate(true)}
                className="h-8 px-3 bg-[#D4722A] hover:bg-[#D4722A]/90 text-white font-semibold text-xs"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Buat
              </Button>
            )}
          </div>
        }
      />

      {/* Date selector */}
      <DateSelector selectedDate={selectedDate} onChange={setSelectedDate} />

      {/* Tab bar — only for koki */}
      {isKoki && <TabBar active={activeTab} onChange={setActiveTab} />}

      {/* Content */}
      <div className="flex-1 px-4 py-3 space-y-3">
        {isLoading ? (
          <ListSkeleton count={4} />
        ) : isError ? (
          <EmptyState
            icon={RefreshCw}
            title="Gagal memuat data"
            description="Terjadi kesalahan saat memuat data produksi."
            action={
              <Button
                size="sm"
                onClick={() => refetch()}
                className="bg-[#D4722A] hover:bg-[#D4722A]/90 text-white"
              >
                Coba Lagi
              </Button>
            }
          />
        ) : !productions || productions.length === 0 ? (
          <EmptyState
            icon={ChefHat}
            title="Belum ada produksi"
            description={
              activeTab === 'saya'
                ? 'Belum ada tugas produksi yang ditugaskan kepada Anda hari ini.'
                : 'Belum ada rencana produksi untuk tanggal ini.'
            }
            action={
              isManagerOrOwner ? (
                <Button
                  size="sm"
                  onClick={() => setShowCreate(true)}
                  className="bg-[#D4722A] hover:bg-[#D4722A]/90 text-white font-semibold"
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  Buat Produksi
                </Button>
              ) : undefined
            }
          />
        ) : (
          productions.map((prod) => (
            <ProductionCard
              key={prod.id}
              production={prod}
              onUpdateStatus={handleUpdateStatus}
              role={role}
            />
          ))
        )}
      </div>

      {/* Modals */}
      <CreateProductionModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSuccess={handleMutationSuccess}
      />

      <UpdateProductionModal
        open={selectedProduction !== null}
        production={selectedProduction}
        role={role}
        onClose={() => setSelectedProduction(null)}
        onSuccess={handleMutationSuccess}
      />
    </div>
  )
}
