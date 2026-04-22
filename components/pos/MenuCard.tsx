'use client'

import { Menu } from '@/lib/types'
import { formatRupiah } from '@/lib/utils/format'

interface MenuCardProps {
  menu: Menu
  onTap: (menu: Menu) => void
}

export default function MenuCard({ menu, onTap }: MenuCardProps) {
  const firstLetter = menu.nama_menu.charAt(0).toUpperCase()

  return (
    <button
      onClick={() => onTap(menu)}
      className="w-full bg-[#231e18] border border-white/8 rounded-xl p-3 cursor-pointer active:scale-95 transition-transform text-left"
    >
      <div className="w-full aspect-square rounded-lg bg-[#2C1810] flex items-center justify-center mb-2 overflow-hidden">
        {menu.image_url ? (
          <img
            src={menu.image_url}
            alt={menu.nama_menu}
            className="w-full h-full object-cover rounded-lg"
          />
        ) : (
          <span className="text-2xl font-bold text-[#D4722A]">{firstLetter}</span>
        )}
      </div>
      <p className="font-medium text-sm text-[#EDE5D8] line-clamp-2 leading-tight mb-1">
        {menu.nama_menu}
      </p>
      <p className="text-[#D4722A] font-bold text-base">
        {formatRupiah(menu.harga_jual)}
      </p>
    </button>
  )
}
