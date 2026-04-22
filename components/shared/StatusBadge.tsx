import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

interface StatusBadgeProps {
  status: string
  className?: string
}

const statusConfig: Record<string, { label: string; className: string }> = {
  // Shift status
  pending: { label: 'Pending', className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  ok: { label: 'OK', className: 'bg-green-500/20 text-green-400 border-green-500/30' },
  ada_selisih: { label: 'Ada Selisih', className: 'bg-red-500/20 text-red-400 border-red-500/30' },
  // Produksi status
  belum: { label: 'Belum', className: 'bg-slate-500/20 text-slate-400 border-slate-500/30' },
  proses: { label: 'Proses', className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  selesai: { label: 'Selesai', className: 'bg-green-500/20 text-green-400 border-green-500/30' },
  qc_ok: { label: 'QC OK', className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  terkirim: { label: 'Terkirim', className: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  // PO status
  draft: { label: 'Draft', className: 'bg-slate-500/20 text-slate-400 border-slate-500/30' },
  approved: { label: 'Approved', className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  sudah_beli: { label: 'Sudah Beli', className: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  sudah_terima: { label: 'Diterima', className: 'bg-green-500/20 text-green-400 border-green-500/30' },
  // Transaksi status
  batal: { label: 'Batal', className: 'bg-red-500/20 text-red-400 border-red-500/30' },
  // Stock status
  critical: { label: 'Kritis', className: 'bg-red-500/20 text-red-400 border-red-500/30' },
  warning: { label: 'Hampir Habis', className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
}

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || { label: status, className: 'bg-slate-500/20 text-slate-400 border-slate-500/30' }
  return (
    <Badge variant="outline" className={cn('text-xs font-medium', config.className, className)}>
      {config.label}
    </Badge>
  )
}
