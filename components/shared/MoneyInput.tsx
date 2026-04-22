'use client'

import { useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

interface MoneyInputProps {
  value: number
  onChange: (value: number) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  prefix?: string
}

export default function MoneyInput({
  value,
  onChange,
  placeholder = '0',
  className,
  disabled,
  prefix = 'Rp',
}: MoneyInputProps) {
  const [display, setDisplay] = useState<string>(value > 0 ? value.toLocaleString('id-ID') : '')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setDisplay(value > 0 ? value.toLocaleString('id-ID') : '')
  }, [value])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/[^\d]/g, '')
    const num = parseInt(raw) || 0
    const formatted = num > 0 ? num.toLocaleString('id-ID') : ''
    setDisplay(formatted)
    onChange(num)
  }

  return (
    <div className="relative">
      {prefix && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A8967E] text-sm pointer-events-none">
          {prefix}
        </span>
      )}
      <input
        ref={inputRef}
        inputMode="numeric"
        value={display}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          'w-full bg-[#1C1712] border border-white/8 rounded-xl text-[#EDE5D8] placeholder:text-[#5C5040]',
          'focus:outline-none focus:border-[#D4722A] transition-colors h-11 text-base',
          prefix ? 'pl-9 pr-3' : 'px-3',
          disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
      />
    </div>
  )
}
