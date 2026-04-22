'use client'

import { ChefHat, Clock, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import StatusBadge from '@/components/shared/StatusBadge'
import { formatDateTime } from '@/lib/utils/format'
import type { Produksi } from '@/lib/types'

interface ProductionCardProps {
  production: Produksi
  onUpdateStatus: (id: string) => void
  role: string
}

export default function ProductionCard({ production, onUpdateStatus, role }: ProductionCardProps) {
  const canUpdate =
    role === 'koki' || role === 'manager' || role === 'owner'

  const hasAlokasi =
    production.alokasi_g1 > 0 ||
    production.alokasi_g2 > 0 ||
    production.alokasi_g3 > 0

  const realisasiPercent =
    production.target_porsi > 0 && production.realisasi_porsi != null
      ? Math.round((production.realisasi_porsi / production.target_porsi) * 100)
      : null

  return (
    <div className="bg-[#231e18] rounded-xl p-4 border border-white/8 space-y-3">
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#EDE5D8] leading-tight truncate">
            {production.menu?.nama_menu ?? '—'}
          </p>
          {production.koki?.nama_lengkap && (
            <div className="flex items-center gap-1 mt-0.5">
              <ChefHat className="w-3 h-3 text-[#A8967E] flex-shrink-0" />
              <span className="text-xs text-[#A8967E] truncate">
                {production.koki.nama_lengkap}
              </span>
            </div>
          )}
        </div>
        <StatusBadge status={production.status} />
      </div>

      {/* Porsi info */}
      <div className="flex items-center gap-4">
        <div className="flex flex-col">
          <span className="text-xs text-[#A8967E]">Target</span>
          <span className="text-lg font-bold text-[#EDE5D8] leading-tight">
            {production.target_porsi}
            <span className="text-xs font-normal text-[#A8967E] ml-0.5">porsi</span>
          </span>
        </div>

        {production.realisasi_porsi != null && (
          <>
            <div className="h-8 w-px bg-white/8" />
            <div className="flex flex-col">
              <span className="text-xs text-[#A8967E]">Realisasi</span>
              <span className="text-lg font-bold text-[#D4722A] leading-tight">
                {production.realisasi_porsi}
                <span className="text-xs font-normal text-[#A8967E] ml-0.5">porsi</span>
              </span>
            </div>
            {realisasiPercent != null && (
              <>
                <div className="h-8 w-px bg-white/8" />
                <div className="flex flex-col">
                  <span className="text-xs text-[#A8967E]">Capaian</span>
                  <span
                    className={`text-lg font-bold leading-tight ${
                      realisasiPercent >= 100
                        ? 'text-emerald-400'
                        : realisasiPercent >= 80
                        ? 'text-yellow-400'
                        : 'text-red-400'
                    }`}
                  >
                    {realisasiPercent}
                    <span className="text-xs font-normal text-[#A8967E] ml-0.5">%</span>
                  </span>
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Alokasi Gerobak */}
      {hasAlokasi && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#A8967E]">Alokasi:</span>
          <div className="flex items-center gap-1.5">
            {production.alokasi_g1 > 0 && (
              <span className="text-xs bg-[#2C1810] text-[#D4722A] px-2 py-0.5 rounded-full">
                G1: {production.alokasi_g1}
              </span>
            )}
            {production.alokasi_g2 > 0 && (
              <span className="text-xs bg-[#2C1810] text-[#D4722A] px-2 py-0.5 rounded-full">
                G2: {production.alokasi_g2}
              </span>
            )}
            {production.alokasi_g3 > 0 && (
              <span className="text-xs bg-[#2C1810] text-[#D4722A] px-2 py-0.5 rounded-full">
                G3: {production.alokasi_g3}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Waktu selesai */}
      {production.waktu_selesai && (
        <div className="flex items-center gap-1.5 text-xs text-[#A8967E]">
          <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
          <span>Selesai: {formatDateTime(production.waktu_selesai)}</span>
        </div>
      )}

      {/* Catatan */}
      {production.catatan && (
        <p className="text-xs text-[#A8967E] italic leading-snug line-clamp-2">
          {production.catatan}
        </p>
      )}

      {/* Update button */}
      {canUpdate && production.status !== 'terkirim' && (
        <div className="pt-1 border-t border-white/8">
          <Button
            size="sm"
            onClick={() => onUpdateStatus(production.id)}
            className="w-full bg-[#2C1810] hover:bg-[#D4722A]/20 text-[#D4722A] border border-[#D4722A]/30 hover:border-[#D4722A]/60 font-medium h-8 text-xs"
          >
            <Clock className="w-3.5 h-3.5 mr-1.5" />
            Update Status
          </Button>
        </div>
      )}
    </div>
  )
}
