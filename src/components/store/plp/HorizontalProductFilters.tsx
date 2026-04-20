'use client'

import { useRef, useState, useEffect } from 'react'
import { ChevronDown, X, Check, SlidersHorizontal } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils'

interface FilterState {
  category?: string
  minPrice: number
  maxPrice: number
  sizes: string[]
  colors: string[]
  minRating: number | null
}

interface HorizontalProductFiltersProps {
  onFilterChange: (filters: FilterState) => void
  currentFilters: FilterState
  categories?: { name: string; slug: string }[]
  isOpen: boolean
}

const COLORS = [
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Black', hex: '#000000' },
  { name: 'Navy', hex: '#001f54' },
  { name: 'Beige', hex: '#f5f0e8' },
  { name: 'Red', hex: '#CC0000' },
  { name: 'Green', hex: '#228B22' },
]

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '28', '30', '32', '34', '36', 'UK 6', 'UK 7', 'UK 8', 'UK 9', 'UK 10']

const RATINGS = [4, 3, 2]

type OpenDropdown = 'category' | 'price' | 'size' | 'color' | 'rating' | null

function useClickOutside(ref: React.RefObject<HTMLElement | null>, onClickOutside: () => void) {
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClickOutside()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [ref, onClickOutside])
}

export function HorizontalProductFilters({
  onFilterChange,
  currentFilters,
  categories = [],
  isOpen,
}: HorizontalProductFiltersProps) {
  const [openDropdown, setOpenDropdown] = useState<OpenDropdown>(null)
  const barRef = useRef<HTMLDivElement>(null)

  useClickOutside(barRef, () => setOpenDropdown(null))

  const toggleDropdown = (key: OpenDropdown) => {
    setOpenDropdown(prev => (prev === key ? null : key))
  }

  const handleSizeToggle = (size: string) => {
    const sizes = currentFilters.sizes.includes(size)
      ? currentFilters.sizes.filter(s => s !== size)
      : [...currentFilters.sizes, size]
    onFilterChange({ ...currentFilters, sizes })
  }

  const handleColorToggle = (color: string) => {
    const colors = currentFilters.colors.includes(color)
      ? currentFilters.colors.filter(c => c !== color)
      : [...currentFilters.colors, color]
    onFilterChange({ ...currentFilters, colors })
  }

  const handleCategoryChange = (slug: string) => {
    onFilterChange({
      ...currentFilters,
      category: currentFilters.category === slug ? undefined : slug,
    })
  }

  const handlePriceChange = (values: number | readonly number[]) => {
    if (Array.isArray(values)) {
      onFilterChange({ ...currentFilters, minPrice: values[0], maxPrice: values[1] })
    }
  }

  const handleRatingChange = (rating: number | null) => {
    onFilterChange({ ...currentFilters, minRating: rating })
  }

  const clearAll = () => {
    onFilterChange({ minPrice: 0, maxPrice: 20000, sizes: [], colors: [], minRating: null })
    setOpenDropdown(null)
  }

  const hasActiveFilters =
    currentFilters.category ||
    currentFilters.minPrice > 0 ||
    currentFilters.maxPrice < 20000 ||
    currentFilters.sizes.length > 0 ||
    currentFilters.colors.length > 0 ||
    currentFilters.minRating !== null

  const selectedCategory = categories.find(c => c.slug === currentFilters.category)

  const filterBtnClass = (active: boolean) =>
    cn(
      'relative flex items-center gap-2 px-4 py-2.5 text-[10px] uppercase tracking-[0.18em] font-bold border transition-all duration-200 whitespace-nowrap',
      active
        ? 'bg-black text-white border-black'
        : 'bg-white text-black border-black/20 hover:border-black'
    )

  const dropdownClass =
    'absolute top-full left-0 mt-2 bg-white border border-black/10 shadow-2xl z-50 min-w-[220px]'

  return (
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.19, 1, 0.22, 1] }}
          className="overflow-hidden border-b border-neutral-100"
        >
          <div ref={barRef} className="py-4">
            {/* Filter Pills Row */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Category */}
              {categories.length > 0 && (
                <div className="relative">
                  <button
                    onClick={() => toggleDropdown('category')}
                    className={filterBtnClass(openDropdown === 'category' || !!currentFilters.category)}
                  >
                    <SlidersHorizontal className="w-3 h-3 opacity-70" />
                    {selectedCategory ? selectedCategory.name : 'Category'}
                    <ChevronDown
                      className={cn(
                        'w-3 h-3 transition-transform duration-200',
                        openDropdown === 'category' && 'rotate-180'
                      )}
                    />
                  </button>
                  <AnimatePresence>
                    {openDropdown === 'category' && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{ duration: 0.2 }}
                        className={dropdownClass}
                      >
                        <div className="py-2">
                          {categories.map(cat => (
                            <button
                              key={cat.slug}
                              onClick={() => handleCategoryChange(cat.slug)}
                              className={cn(
                                'w-full flex items-center justify-between px-5 py-3 text-[10px] uppercase tracking-widest transition-colors',
                                currentFilters.category === cat.slug
                                  ? 'bg-black text-white'
                                  : 'text-neutral-600 hover:bg-neutral-50 hover:text-black'
                              )}
                            >
                              {cat.name}
                              {currentFilters.category === cat.slug && <Check className="w-3 h-3" />}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Price Range */}
              <div className="relative">
                <button
                  onClick={() => toggleDropdown('price')}
                  className={filterBtnClass(
                    openDropdown === 'price' || currentFilters.minPrice > 0 || currentFilters.maxPrice < 20000
                  )}
                >
                  Price
                  {(currentFilters.minPrice > 0 || currentFilters.maxPrice < 20000) && (
                    <span className="text-[9px] opacity-75">
                      {currentFilters.minPrice > 0 ? `PKR ${currentFilters.minPrice.toLocaleString()}` : 'PKR 0'}
                      {' – '}
                      {`PKR ${currentFilters.maxPrice.toLocaleString()}`}
                    </span>
                  )}
                  <ChevronDown
                    className={cn(
                      'w-3 h-3 transition-transform duration-200',
                      openDropdown === 'price' && 'rotate-180'
                    )}
                  />
                </button>
                <AnimatePresence>
                  {openDropdown === 'price' && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={{ duration: 0.2 }}
                      className={cn(dropdownClass, 'min-w-[280px] p-6')}
                    >
                      <p className="text-[9px] uppercase tracking-[0.2em] font-bold text-neutral-400 mb-5">
                        Price Range
                      </p>
                      <Slider
                        value={[currentFilters.minPrice, currentFilters.maxPrice]}
                        max={20000}
                        step={100}
                        onValueChange={handlePriceChange}
                        className="mb-5"
                      />
                      <div className="flex justify-between text-[10px] font-mono tracking-tight text-neutral-500">
                        <span>PKR {currentFilters.minPrice.toLocaleString()}</span>
                        <span>PKR {currentFilters.maxPrice.toLocaleString()}</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Size */}
              <div className="relative">
                <button
                  onClick={() => toggleDropdown('size')}
                  className={filterBtnClass(
                    openDropdown === 'size' || currentFilters.sizes.length > 0
                  )}
                >
                  {currentFilters.sizes.length > 0
                    ? `Size (${currentFilters.sizes.length})`
                    : 'Size'}
                  <ChevronDown
                    className={cn(
                      'w-3 h-3 transition-transform duration-200',
                      openDropdown === 'size' && 'rotate-180'
                    )}
                  />
                </button>
                <AnimatePresence>
                  {openDropdown === 'size' && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={{ duration: 0.2 }}
                      className={cn(dropdownClass, 'min-w-[260px] p-5')}
                    >
                      <p className="text-[9px] uppercase tracking-[0.2em] font-bold text-neutral-400 mb-4">
                        Select Sizes
                      </p>
                      <div className="grid grid-cols-4 gap-1.5">
                        {SIZES.map(size => (
                          <button
                            key={size}
                            onClick={() => handleSizeToggle(size)}
                            className={cn(
                              'flex h-9 items-center justify-center border text-[10px] transition-all',
                              currentFilters.sizes.includes(size)
                                ? 'bg-black text-white border-black'
                                : 'bg-white text-black border-neutral-200 hover:border-black'
                            )}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Color */}
              <div className="relative">
                <button
                  onClick={() => toggleDropdown('color')}
                  className={filterBtnClass(
                    openDropdown === 'color' || currentFilters.colors.length > 0
                  )}
                >
                  {currentFilters.colors.length > 0
                    ? `Color (${currentFilters.colors.length})`
                    : 'Color'}
                  <ChevronDown
                    className={cn(
                      'w-3 h-3 transition-transform duration-200',
                      openDropdown === 'color' && 'rotate-180'
                    )}
                  />
                </button>
                <AnimatePresence>
                  {openDropdown === 'color' && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={{ duration: 0.2 }}
                      className={cn(dropdownClass, 'p-5')}
                    >
                      <p className="text-[9px] uppercase tracking-[0.2em] font-bold text-neutral-400 mb-4">
                        Select Colors
                      </p>
                      <div className="flex flex-wrap gap-3">
                        {COLORS.map(color => (
                          <button
                            key={color.name}
                            onClick={() => handleColorToggle(color.name)}
                            title={color.name}
                            className={cn(
                              'flex h-8 w-8 items-center justify-center border-2 transition-all',
                              currentFilters.colors.includes(color.name)
                                ? 'ring-2 ring-black ring-offset-2 border-black'
                                : 'border-neutral-200 hover:border-black'
                            )}
                            style={{ backgroundColor: color.hex }}
                          >
                            {currentFilters.colors.includes(color.name) && (
                              <Check
                                className={cn(
                                  'w-4 h-4',
                                  color.name === 'White' || color.name === 'Beige'
                                    ? 'text-black'
                                    : 'text-white'
                                )}
                              />
                            )}
                            <span className="sr-only">{color.name}</span>
                          </button>
                        ))}
                      </div>
                      {/* Color labels */}
                      <div className="mt-3 flex flex-wrap gap-1">
                        {COLORS.map(color => (
                          <span
                            key={color.name}
                            className={cn(
                              'text-[9px] uppercase tracking-widest transition-colors cursor-pointer px-1 py-0.5',
                              currentFilters.colors.includes(color.name)
                                ? 'text-black font-bold'
                                : 'text-neutral-400 hover:text-black'
                            )}
                            onClick={() => handleColorToggle(color.name)}
                          >
                            {color.name}
                          </span>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Rating */}
              <div className="relative">
                <button
                  onClick={() => toggleDropdown('rating')}
                  className={filterBtnClass(
                    openDropdown === 'rating' || currentFilters.minRating !== null
                  )}
                >
                  {currentFilters.minRating ? `${currentFilters.minRating}★ & Above` : 'Rating'}
                  <ChevronDown
                    className={cn(
                      'w-3 h-3 transition-transform duration-200',
                      openDropdown === 'rating' && 'rotate-180'
                    )}
                  />
                </button>
                <AnimatePresence>
                  {openDropdown === 'rating' && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={{ duration: 0.2 }}
                      className={cn(dropdownClass, 'py-2')}
                    >
                      <button
                        onClick={() => handleRatingChange(null)}
                        className={cn(
                          'w-full flex items-center justify-between px-5 py-3 text-[10px] uppercase tracking-widest transition-colors',
                          currentFilters.minRating === null
                            ? 'bg-black text-white'
                            : 'text-neutral-600 hover:bg-neutral-50 hover:text-black'
                        )}
                      >
                        All Ratings
                        {currentFilters.minRating === null && <Check className="w-3 h-3" />}
                      </button>
                      {RATINGS.map(rating => (
                        <button
                          key={rating}
                          onClick={() => handleRatingChange(rating)}
                          className={cn(
                            'w-full flex items-center justify-between px-5 py-3 text-[10px] uppercase tracking-widest transition-colors',
                            currentFilters.minRating === rating
                              ? 'bg-black text-white'
                              : 'text-neutral-600 hover:bg-neutral-50 hover:text-black'
                          )}
                        >
                          {'★'.repeat(rating)} & Above
                          {currentFilters.minRating === rating && <Check className="w-3 h-3" />}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Divider + Clear All */}
              {hasActiveFilters && (
                <>
                  <div className="w-px h-6 bg-neutral-200 mx-1" />
                  <button
                    onClick={clearAll}
                    className="flex items-center gap-1.5 px-3 py-2 text-[10px] uppercase tracking-[0.18em] text-neutral-400 hover:text-black transition-colors"
                  >
                    <X className="w-3 h-3" />
                    Clear All
                  </button>
                </>
              )}
            </div>

            {/* Active filter chips */}
            {hasActiveFilters && (
              <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-[#E5E5E5]">
                <span className="text-[9px] uppercase tracking-[0.2em] text-neutral-400 mr-1">Active:</span>
                {selectedCategory && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-neutral-100 text-[9px] uppercase tracking-wider">
                    {selectedCategory.name}
                    <button onClick={() => onFilterChange({ ...currentFilters, category: undefined })}>
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                )}
                {(currentFilters.minPrice > 0 || currentFilters.maxPrice < 20000) && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-neutral-100 text-[9px] uppercase tracking-wider">
                    PKR {currentFilters.minPrice.toLocaleString()} – {currentFilters.maxPrice.toLocaleString()}
                    <button onClick={() => onFilterChange({ ...currentFilters, minPrice: 0, maxPrice: 20000 })}>
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                )}
                {currentFilters.sizes.map(s => (
                  <span key={s} className="inline-flex items-center gap-1.5 px-3 py-1 bg-neutral-100 text-[9px] uppercase tracking-wider">
                    {s}
                    <button onClick={() => handleSizeToggle(s)}>
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))}
                {currentFilters.colors.map(c => (
                  <span key={c} className="inline-flex items-center gap-1.5 px-3 py-1 bg-neutral-100 text-[9px] uppercase tracking-wider">
                    {c}
                    <button onClick={() => handleColorToggle(c)}>
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))}
                {currentFilters.minRating !== null && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-neutral-100 text-[9px] uppercase tracking-wider">
                    {currentFilters.minRating}★ & Above
                    <button onClick={() => handleRatingChange(null)}>
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
