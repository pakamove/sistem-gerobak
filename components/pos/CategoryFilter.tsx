'use client'

const CATEGORY_EMOJI: Record<string, string> = {
  semua: '🍽️',
  nasi: '🍚',
  lauk: '🍗',
  sayur: '🥬',
  kriuk: '🍟',
  minuman: '🥤',
  paket: '🎁',
  lainnya: '✨',
}

interface CategoryFilterProps {
  categories: string[]
  selectedCategory: string
  onChange: (cat: string) => void
}

export default function CategoryFilter({
  categories,
  selectedCategory,
  onChange,
}: CategoryFilterProps) {
  const allCategories = ['semua', ...categories]

  return (
    <div className="overflow-x-auto scrollbar-none flex gap-2 px-4 py-3">
      {allCategories.map((cat) => {
        const isActive = selectedCategory === cat
        const emoji = CATEGORY_EMOJI[cat] ?? '✨'
        return (
          <button
            key={cat}
            onClick={() => onChange(cat)}
            className={`
              flex-shrink-0 min-h-[36px] text-sm px-3 rounded-full font-medium
              transition-colors capitalize
              ${isActive
                ? 'bg-[#D4722A] text-white'
                : 'bg-[#2C1810] text-[#A8967E]'
              }
            `}
          >
            {emoji} {cat}
          </button>
        )
      })}
    </div>
  )
}
