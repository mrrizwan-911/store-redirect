'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface SortOption {
  label: string
  value: string
}

const SORT_OPTIONS: SortOption[] = [
  { label: 'Newest First', value: 'createdAt_desc' },
  { label: 'Price: Low to High', value: 'basePrice_asc' },
  { label: 'Price: High to Low', value: 'basePrice_desc' },
  { label: 'Name: A to Z', value: 'name_asc' },
]

interface SortDropdownProps {
  value: string
  onChange: (value: string) => void
  isDarkBg?: boolean
}

export function SortDropdown({ value, onChange, isDarkBg = false }: SortDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const selectedOption = SORT_OPTIONS.find(opt => opt.value === value) || SORT_OPTIONS[0]

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    setIsOpen(true)
  }

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false)
      timeoutRef.current = null
    }, 200)
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  return (
    <div
      ref={dropdownRef}
      className="relative z-40"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        className={cn(
          "flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-bold border-b pb-1 focus:outline-none transition-colors",
          isDarkBg
            ? "text-white border-white/40 hover:text-white/80 hover:border-white/60"
            : "text-black border-black hover:text-neutral-500"
        )}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
      >
        Sort By: {selectedOption.label}
        <ChevronDown className={cn("h-3 w-3 transition-transform duration-300", isOpen && "rotate-180")} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full right-0 mt-2 w-52 bg-white border border-black shadow-2xl overflow-hidden"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <div className="py-1" role="listbox">
              {SORT_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  role="option"
                  aria-selected={option.value === value}
                  className={cn(
                    "w-full px-5 py-3 text-[10px] uppercase tracking-widest transition-colors text-left flex items-center justify-between outline-none",
                    option.value === value
                      ? "bg-neutral-50 font-bold text-black"
                      : "text-neutral-500 hover:bg-neutral-50 hover:text-black bg-white"
                  )}
                  onClick={() => {
                    onChange(option.value)
                    setIsOpen(false)
                  }}
                >
                  <span className="text-inherit">{option.label}</span>
                  {option.value === value && <Check className="w-3 h-3 stroke-[3] text-black" />}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
