'use client'

import { useRef, useState, useEffect } from 'react'
import { ChevronDown, X, Check, SlidersHorizontal, Filter, Info } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

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
  isOpen?: boolean
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
}: HorizontalProductFiltersProps) {
  const [openDropdown, setOpenDropdown] = useState<OpenDropdown>(null)
  const barRef = useRef<HTMLDivElement>(null)

  // Local state for price to prevent excessive refreshes
  const [localMinPrice, setLocalMinPrice] = useState(currentFilters.minPrice)
  const [localMaxPrice, setLocalMaxPrice] = useState(currentFilters.maxPrice)

  // Sync local price when currentFilters change externally or dropdown opens
  useEffect(() => {
    setLocalMinPrice(currentFilters.minPrice)
    setLocalMaxPrice(currentFilters.maxPrice)
  }, [currentFilters.minPrice, currentFilters.maxPrice, openDropdown])

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
    setOpenDropdown(null)
  }

  const handlePriceSliderChange = (values: number | readonly number[]) => {
    if (Array.isArray(values)) {
      setLocalMinPrice(values[0])
      setLocalMaxPrice(values[1])
    }
  }

  const applyPriceFilter = () => {
    onFilterChange({ ...currentFilters, minPrice: localMinPrice, maxPrice: localMaxPrice })
    setOpenDropdown(null)
  }

  const handleRatingChange = (rating: number | null) => {
    onFilterChange({ ...currentFilters, minRating: rating })
    setOpenDropdown(null)
  }

  const clearAll = () => {
    onFilterChange({ minPrice: 0, maxPrice: 50000, sizes: [], colors: [], minRating: null })
    setOpenDropdown(null)
  }

  const hasActiveFilters =
    currentFilters.category ||
    currentFilters.minPrice > 0 ||
    currentFilters.maxPrice < 50000 ||
    currentFilters.sizes.length > 0 ||
    currentFilters.colors.length > 0 ||
    currentFilters.minRating !== null

  const selectedCategory = categories.find(c => c.slug === currentFilters.category)

  const filterBtnClass = (active: boolean) =>
    cn(
      'relative flex items-center gap-2 px-5 py-3 text-[10px] uppercase tracking-[0.2em] font-black border-2 transition-all duration-200 whitespace-nowrap',
      active
        ? 'bg-black text-white border-black shadow-lg scale-[1.02]'
        : 'bg-white text-black border-black/10 hover:border-black hover:bg-neutral-50'
    )

  const dropdownClass =
    'absolute top-full left-0 mt-3 bg-white border-2 border-black shadow-2xl z-[60] min-w-[240px] max-w-[calc(100vw-3rem)] rounded-sm'

  return (
    <div ref={barRef} className="py-2 overflow-visible">
      {/* Filter Pills Row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Category */}
        {categories.length > 0 && (
          <div className="relative">
            <button
              onClick={() => toggleDropdown('category')}
              className={filterBtnClass(openDropdown === 'category' || !!currentFilters.category)}
            >
              <Filter className="w-3.5 h-3.5 stroke-[3]" />
              {selectedCategory ? selectedCategory.name : 'Category'}
              <ChevronDown className={cn('w-3.5 h-3.5 transition-transform duration-200 stroke-[3.5]', openDropdown === 'category' && 'rotate-180')} />
            </button>
            <AnimatePresence>
              {openDropdown === 'category' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className={cn(dropdownClass, "z-[60] shadow-2xl overflow-hidden")}
                >
                  <div className="py-2 bg-white max-h-[280px] overflow-y-auto scrollbar-hide">
                    {categories.map(cat => (
                      <button
                        key={cat.slug}
                        onClick={() => handleCategoryChange(cat.slug)}
                        className={cn(
                          'w-full flex items-center justify-between px-6 py-4 text-[11px] uppercase tracking-widest transition-colors font-black text-left',
                          currentFilters.category === cat.slug
                            ? 'bg-black text-white'
                            : 'text-black hover:bg-neutral-50'
                        )}
                      >
                        {cat.name}
                        {currentFilters.category === cat.slug && <Check className="w-3.5 h-3.5 stroke-[4]" />}
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
            className={filterBtnClass(openDropdown === 'price' || currentFilters.minPrice > 0 || currentFilters.maxPrice < 50000)}
          >
            Price
            {(currentFilters.minPrice > 0 || currentFilters.maxPrice < 50000) && (
              <span className="text-[9px] font-bold text-black border-l border-black/20 pl-2 ml-1">
                PKR {currentFilters.minPrice.toLocaleString()} – {currentFilters.maxPrice.toLocaleString()}
              </span>
            )}
            <ChevronDown className={cn('w-3.5 h-3.5 transition-transform duration-200 stroke-[3]', openDropdown === 'price' && 'rotate-180')} />
          </button>
          <AnimatePresence>
            {openDropdown === 'price' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className={cn(dropdownClass, 'min-w-[320px] p-7 bg-white z-[60] shadow-2xl')}
              >
                <p className="text-[10px] uppercase tracking-[0.2em] font-black text-black mb-6">Price Range</p>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="space-y-2">
                    <label className="text-[9px] uppercase tracking-widest text-black font-black">Min (PKR)</label>
                    <input
                      type="number"
                      value={localMinPrice}
                      onChange={(e) => setLocalMinPrice(Number(e.target.value))}
                      className="w-full h-11 border-2 border-black/10 px-3 text-sm font-mono font-bold focus:border-black outline-none transition-colors rounded-sm bg-neutral-50 text-black"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] uppercase tracking-widest text-black font-black">Max (PKR)</label>
                    <input
                      type="number"
                      value={localMaxPrice}
                      onChange={(e) => setLocalMaxPrice(Number(e.target.value))}
                      className="w-full h-11 border-2 border-black/10 px-3 text-sm font-mono font-bold focus:border-black outline-none transition-colors rounded-sm bg-neutral-50 text-black"
                    />
                  </div>
                </div>

                <Slider
                  value={[localMinPrice, localMaxPrice]}
                  max={50000}
                  step={100}
                  onValueChange={handlePriceSliderChange}
                  className="mb-8 [&_[data-slot=slider-range]]:bg-black [&_[data-slot=slider-thumb]]:border-black [&_[data-slot=slider-thumb]]:h-5 [&_[data-slot=slider-thumb]]:w-5"
                />

                <Button
                  onClick={applyPriceFilter}
                  className="w-full h-12 bg-black text-white hover:bg-neutral-900 rounded-none text-[10px] uppercase tracking-widest font-black transition-all active:scale-95 shadow-xl"
                >
                  Apply Price
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Size */}
        <div className="relative">
          <button
            onClick={() => toggleDropdown('size')}
            className={filterBtnClass(openDropdown === 'size' || currentFilters.sizes.length > 0)}
          >
            {currentFilters.sizes.length > 0 ? `Size (${currentFilters.sizes.length})` : 'Size'}
            <ChevronDown className={cn('w-3.5 h-3.5 transition-transform duration-200 stroke-[3]', openDropdown === 'size' && 'rotate-180')} />
          </button>
          <AnimatePresence>
            {openDropdown === 'size' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className={cn(dropdownClass, 'min-w-[280px] p-6 bg-white z-[60] shadow-2xl')}
              >
                <p className="text-[10px] uppercase tracking-[0.2em] font-black text-black mb-6 text-center">Select Sizes</p>
                <div className="grid grid-cols-4 gap-2.5 max-h-[300px] overflow-y-auto pr-1 scrollbar-hide">
                  {SIZES.map(size => {
                    const active = currentFilters.sizes.includes(size);
                    return (
                      <button
                        key={size}
                        onClick={() => handleSizeToggle(size)}
                        className={cn(
                          'flex h-12 items-center justify-center border-2 text-[10px] transition-all font-black rounded-sm',
                          active
                            ? 'bg-black text-white border-black shadow-lg scale-105 z-10'
                            : 'bg-white text-black border-neutral-100 hover:border-black hover:bg-neutral-50'
                        )}
                      >
                        {size}
                      </button>
                    )
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Color */}
        <div className="relative">
          <button
            onClick={() => toggleDropdown('color')}
            className={filterBtnClass(openDropdown === 'color' || currentFilters.colors.length > 0)}
          >
            {currentFilters.colors.length > 0 ? `Color (${currentFilters.colors.length})` : 'Color'}
            <ChevronDown className={cn('w-3.5 h-3.5 transition-transform duration-200 stroke-[3.5]', openDropdown === 'color' && 'rotate-180')} />
          </button>
          <AnimatePresence>
            {openDropdown === 'color' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className={cn(dropdownClass, 'min-w-[260px] p-2 bg-white z-[60] shadow-2xl')}
              >
                <p className="text-[10px] uppercase tracking-[0.2em] font-black text-black px-5 py-4 border-b border-black/5 mb-2">Select Colors</p>
                <div className="max-h-[280px] overflow-y-auto scrollbar-hide py-1">
                  {COLORS.map(color => {
                    const active = currentFilters.colors.includes(color.name);
                    return (
                      <button
                        key={color.name}
                        onClick={() => handleColorToggle(color.name)}
                        className={cn(
                          'w-full flex items-center justify-between px-5 py-4 transition-all rounded-sm group',
                          active ? 'bg-black/5 border-l-4 border-black' : 'hover:bg-neutral-50 border-l-4 border-transparent'
                        )}
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={cn(
                              "w-6 h-6 rounded-full border border-black/10 shadow-sm transition-transform group-hover:scale-110",
                              active && "ring-2 ring-black ring-offset-2"
                            )}
                            style={{ backgroundColor: color.hex }}
                          />
                          <span className={cn(
                            "text-[11px] uppercase tracking-widest transition-colors font-black",
                            active ? "text-black" : "text-black/80"
                          )}>
                            {color.name}
                          </span>
                        </div>
                        {active && <Check className="w-4 h-4 stroke-[4] text-black" />}
                      </button>
                    )
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Rating */}
        <div className="relative">
          <button
            onClick={() => toggleDropdown('rating')}
            className={filterBtnClass(openDropdown === 'rating' || currentFilters.minRating !== null)}
          >
            {currentFilters.minRating ? `${currentFilters.minRating}★ & Above` : 'Rating'}
            <ChevronDown className={cn('w-3.5 h-3.5 transition-transform duration-200 stroke-[3.5]', openDropdown === 'rating' && 'rotate-180')} />
          </button>
          <AnimatePresence>
            {openDropdown === 'rating' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className={cn(dropdownClass, 'py-2 bg-white z-[60] shadow-2xl max-h-[280px] overflow-y-auto scrollbar-hide')}
              >
                <button
                  onClick={() => handleRatingChange(null)}
                  className={cn(
                    'w-full flex items-center justify-between px-6 py-4 text-[10px] uppercase tracking-widest transition-colors font-black',
                    currentFilters.minRating === null ? 'bg-black text-white' : 'text-black hover:bg-neutral-50'
                  )}
                >
                  All Ratings
                  {currentFilters.minRating === null && <Check className="w-4 h-4 stroke-[4]" />}
                </button>
                {RATINGS.map(rating => (
                  <button
                    key={rating}
                    onClick={() => handleRatingChange(rating)}
                    className={cn(
                      'w-full flex items-center justify-between px-6 py-4 text-[10px] uppercase tracking-widest transition-colors font-black',
                      currentFilters.minRating === rating ? 'bg-black text-white' : 'text-black hover:bg-neutral-50'
                    )}
                  >
                    <span className="flex items-center gap-1 text-xs">
                      {'★'.repeat(rating)} <span className="text-black/10">{'★'.repeat(5-rating)}</span>
                    </span>
                    & Above
                    {currentFilters.minRating === rating && <Check className="w-3.5 h-3.5 stroke-[4]" />}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Active filter chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 mt-6 pt-6 border-t-2 border-neutral-100">
          <span className="text-[10px] uppercase tracking-[0.2em] text-neutral-600 font-black mr-2">Active Filters:</span>
          {selectedCategory && (
            <Chip
              label={selectedCategory.name}
              onRemove={() => onFilterChange({ ...currentFilters, category: undefined })}
            />
          )}
          {(currentFilters.minPrice > 0 || currentFilters.maxPrice < 50000) && (
            <Chip
              label={`PKR ${currentFilters.minPrice.toLocaleString()} – ${currentFilters.maxPrice.toLocaleString()}`}
              onRemove={() => onFilterChange({ ...currentFilters, minPrice: 0, maxPrice: 50000 })}
            />
          )}
          {currentFilters.sizes.map(s => (
            <Chip key={s} label={s} onRemove={() => handleSizeToggle(s)} />
          ))}
          {currentFilters.colors.map(c => (
            <Chip key={c} label={c} onRemove={() => handleColorToggle(c)} />
          ))}
          {currentFilters.minRating !== null && (
            <Chip
              label={`${currentFilters.minRating}★ & Above`}
              onRemove={() => handleRatingChange(null)}
            />
          )}
        </div>
      )}
    </div>
  )
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white text-[9px] uppercase tracking-widest font-black shadow-md border border-black group transition-all hover:bg-neutral-900">
      {label}
      <button onClick={onRemove} className="hover:scale-125 transition-transform outline-none">
        <X className="w-3.5 h-3.5 stroke-[3]" />
      </button>
    </span>
  )
}
