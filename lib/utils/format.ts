export const formatRupiah = (amount: number): string =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount)

export const formatDate = (date: Date | string): string =>
  new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date))

export const formatDateShort = (date: Date | string): string =>
  new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date))

export const formatTime = (date: Date | string): string =>
  new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))

export const formatDateTime = (date: Date | string): string =>
  new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))

export const getTodayDate = (): string => {
  return new Date().toISOString().slice(0, 10)
}

export const generateStrukNomor = (
  gerobakNo: number,
  date: Date,
  seq: number
): string => {
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
  return `G${gerobakNo}-${dateStr}-${String(seq).padStart(3, '0')}`
}

export const generateNomorPO = (date: Date, seq: number): string => {
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
  return `PO-${dateStr}-${String(seq).padStart(3, '0')}`
}

export const getGerobakNumber = (nama: string): number => {
  const match = nama.match(/\d+/)
  return match ? parseInt(match[0]) : 1
}
