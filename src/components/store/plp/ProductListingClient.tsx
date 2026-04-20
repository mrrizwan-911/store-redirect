'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { HorizontalProductFilters } from './HorizontalProductFilters'
import { ProductGrid } from './ProductGrid'
import { SortDropdown } from './SortDropdown'
import { motion } from 'framer-motion'
import { SlidersHorizontal, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProductListingClientProps {
  initialProducts: any[]
  initialTotal: number
  categories: { name: string; slug: string }[]
  title: string
  subtitle?: string
}

export function ProductListingClient({
  initialProducts,
  initialTotal,
  categories,
  title,
  subtitle,
}: ProductListingClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [products, setProducts] = useState(initialProducts)
  const [total, setTotal] = useState(initialTotal)
  const [isLoading, setIsLoading] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [filtersOpen, setFiltersOpen] = useState(false)

  const currentFilters = {
    category: searchParams.get('category') || undefined,
    minPrice: Number(searchParams.get('minPrice')) || 0,
    maxPrice: Number(searchParams.get('maxPrice')) || 20000,
    sizes: searchParams.get('size')?.split(',').filter(Boolean) || [],
    colors: searchParams.get('color')?.split(',').filter(Boolean) || [],
    minRating: searchParams.get('rating') ? Number(searchParams.get('rating')) : null,
  }

  const currentSort = searchParams.get('sort') || 'createdAt_desc'

  const hasActiveFilters =
    currentFilters.category ||
    currentFilters.minPrice > 0 ||
    currentFilters.maxPrice < 20000 ||
    currentFilters.sizes.length > 0 ||
    currentFilters.colors.length > 0 ||
    currentFilters.minRating !== null

  const activeFilterCount = [
    currentFilters.category ? 1 : 0,
    currentFilters.minPrice > 0 || currentFilters.maxPrice < 20000 ? 1 : 0,
    currentFilters.sizes.length > 0 ? 1 : 0,
    currentFilters.colors.length > 0 ? 1 : 0,
    currentFilters.minRating !== null ? 1 : 0,
  ].reduce((a, b) => a + b, 0)

  const updateUrl = useCallback(
    (newFilters: any, newSort?: string) => {
      const params = new URLSearchParams(searchParams.toString())

      if (newFilters.category) params.set('category', newFilters.category)
      else params.delete('category')

      if (newFilters.minPrice > 0) params.set('minPrice', newFilters.minPrice.toString())
      else params.delete('minPrice')

      if (newFilters.maxPrice < 20000) params.set('maxPrice', newFilters.maxPrice.toString())
      else params.delete('maxPrice')

      if (newFilters.sizes.length > 0) params.set('size', newFilters.sizes.join(','))
      else params.delete('size')

      if (newFilters.colors.length > 0) params.set('color', newFilters.colors.join(','))
      else params.delete('color')

      if (newFilters.minRating) params.set('rating', newFilters.minRating.toString())
      else params.delete('minRating')

      if (newSort) params.set('sort', newSort)

      params.delete('page')

      router.push(`?${params.toString()}`, { scroll: false })
    },
    [router, searchParams]
  )

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/products?${searchParams.toString()}`)
        const result = await response.json()
        if (result.success) {
          setProducts(result.data.products)
          if (result.data.total !== undefined) setTotal(result.data.total)
        }
      } catch (error) {
        console.error('Failed to fetch products:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (searchParams.toString() !== '') {
      fetchProducts()
    }
  }, [searchParams])

  return (
    <div className="min-h-screen bg-white text-black">
      {/* ── Header ── */}
      <div className="bg-black text-white">
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          {/* Breadcrumb */}
          <p className="text-[10px] uppercase tracking-[0.25em] text-white/40 pt-6 pb-0">
            Home <span className="mx-2 text-white/20">/</span> Shop <span className="mx-2 text-white/20">/</span> {title}
          </p>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 py-8">
            {/* Left: Big editorial title */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.19, 1, 0.22, 1] }}
            >
              <h1 className="text-5xl md:text-7xl font-display italic leading-none tracking-tight text-white">
                {title}
              </h1>
            </motion.div>

            {/* Right: count + sort */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="flex items-center gap-6 pb-1"
            >
              <span className="text-[10px] uppercase tracking-[0.25em] text-white/50">
                {total} {total === 1 ? 'Product' : 'Products'}
              </span>
              {/* Sort in header, invert colours for dark bg */}
              <div className="[&_button]:!text-white [&_button]:!border-white/40 [&_li]:!text-neutral-800">
                <SortDropdown
                  value={currentSort}
                  onChange={(val) => updateUrl(currentFilters, val)}
                />
              </div>
            </motion.div>
          </div>
        </div>
      </div>


      {/* ── Filters Toolbar ── */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-neutral-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          <div className="flex items-center gap-3 py-3">
            {/* Filter Toggle */}
            <button
              id="filter-toggle-btn"
              onClick={() => setFiltersOpen(prev => !prev)}
              className={cn(
                'inline-flex items-center gap-2 px-5 py-2 text-[10px] uppercase tracking-[0.2em] font-bold border transition-all duration-300',
                filtersOpen
                  ? 'bg-black text-white border-black'
                  : 'bg-white text-black border-black hover:bg-black hover:text-white'
              )}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Filters
              {activeFilterCount > 0 && (
                <span className={cn(
                  'inline-flex items-center justify-center w-4 h-4 text-[9px] font-bold rounded-full',
                  filtersOpen ? 'bg-white text-black' : 'bg-black text-white'
                )}>
                  {activeFilterCount}
                </span>
              )}
              {filtersOpen && <X className="w-3 h-3 ml-0.5" />}
            </button>

            {/* Vertical separator */}
            <div className="w-px h-5 bg-neutral-200" />

            {/* Active chips when bar is closed */}
            {!filtersOpen && hasActiveFilters && (
              <div className="flex flex-wrap items-center gap-2 overflow-x-auto">
                {currentFilters.category && (
                  <Chip
                    label={categories.find(c => c.slug === currentFilters.category)?.name ?? currentFilters.category!}
                    onRemove={() => updateUrl({ ...currentFilters, category: undefined })}
                  />
                )}
                {currentFilters.sizes.map(s => (
                  <Chip key={s} label={s} onRemove={() => updateUrl({ ...currentFilters, sizes: currentFilters.sizes.filter(x => x !== s) })} />
                ))}
                {currentFilters.colors.map(c => (
                  <Chip key={c} label={c} onRemove={() => updateUrl({ ...currentFilters, colors: currentFilters.colors.filter(x => x !== c) })} />
                ))}
                {currentFilters.minRating !== null && (
                  <Chip label={`${currentFilters.minRating}★ & above`} onRemove={() => updateUrl({ ...currentFilters, minRating: null })} />
                )}
                <button
                  onClick={() => updateUrl({ minPrice: 0, maxPrice: 20000, sizes: [], colors: [], minRating: null })}
                  className="text-[9px] uppercase tracking-[0.2em] text-neutral-400 hover:text-black underline underline-offset-2 transition-colors ml-1 shrink-0"
                >
                  Clear All
                </button>
              </div>
            )}
          </div>

          {/* Sliding Filter Bar */}
          <HorizontalProductFilters
            isOpen={filtersOpen}
            currentFilters={currentFilters}
            onFilterChange={(f) => updateUrl(f)}
            categories={categories}
          />
        </div>
      </div>

      {/* ── Product Grid ── */}
      <div className="max-w-7xl mx-auto px-6 md:px-8 py-10">
        <ProductGrid
          products={products}
          isLoading={isLoading}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />
      </div>
    </div>
  )
}

/** Small active-filter chip */
function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-black text-white text-[9px] uppercase tracking-wider shrink-0">
      {label}
      <button onClick={onRemove} className="hover:opacity-60 transition-opacity">
        <X className="w-2.5 h-2.5" />
      </button>
    </span>
  )
}
