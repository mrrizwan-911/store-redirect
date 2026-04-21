'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { HorizontalProductFilters } from './HorizontalProductFilters'
import { ProductGrid } from './ProductGrid'
import { SortDropdown } from './SortDropdown'
import { motion } from 'framer-motion'
import { SlidersHorizontal, X, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'

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
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [products, setProducts] = useState(initialProducts)
  const [total, setTotal] = useState(initialTotal)
  const [isLoading, setIsLoading] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [mounted, setMounted] = useState(false)
  const [searchInput, setSearchInput] = useState(searchParams.get('q') || searchParams.get('search') || '')

  const isSearchPage = pathname === '/search'

  const currentFilters = {
    category: searchParams.get('category') || undefined,
    minPrice: Number(searchParams.get('minPrice')) || 0,
    maxPrice: Number(searchParams.get('maxPrice')) || 50000,
    sizes: searchParams.get('size')?.split(',').filter(Boolean) || [],
    colors: searchParams.get('color')?.split(',').filter(Boolean) || [],
    minRating: searchParams.get('rating') ? Number(searchParams.get('rating')) : null,
  }

  const currentSort = searchParams.get('sort') || 'createdAt_desc'

  const hasActiveFilters =
    currentFilters.category ||
    currentFilters.minPrice > 0 ||
    currentFilters.maxPrice < 50000 ||
    currentFilters.sizes.length > 0 ||
    currentFilters.colors.length > 0 ||
    currentFilters.minRating !== null

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams(searchParams.toString())
    if (searchInput) {
      params.set('q', searchInput)
    } else {
      params.delete('q')
      params.delete('search')
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  const updateUrl = useCallback(
    (newFilters: any, newSort?: string) => {
      const params = new URLSearchParams(searchParams.toString())

      if (newFilters.category) params.set('category', newFilters.category)
      else params.delete('category')

      if (newFilters.minPrice > 0) params.set('minPrice', newFilters.minPrice.toString())
      else params.delete('minPrice')

      if (newFilters.maxPrice < 50000) params.set('maxPrice', newFilters.maxPrice.toString())
      else params.delete('maxPrice')

      if (newFilters.sizes.length > 0) params.set('size', newFilters.sizes.join(','))
      else params.delete('size')

      if (newFilters.colors.length > 0) params.set('color', newFilters.colors.join(','))
      else params.delete('color')

      if (newFilters.minRating !== null && newFilters.minRating !== undefined) {
        params.set('rating', newFilters.minRating.toString())
      } else {
        params.delete('rating')
      }

      if (newSort) params.set('sort', newSort)

      params.delete('page')

      router.push(`?${params.toString()}`, { scroll: false })
    },
    [router, searchParams]
  )

  useEffect(() => {
    setMounted(true)
  }, [])

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

    // Only fetch if params changed AFTER initial mount to prevent redundant fetch
    if (mounted) {
      fetchProducts()
    }
  }, [searchParams, mounted])

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
            {/* Left: Big editorial title or Search Input */}
            <div className="flex-1 max-w-2xl">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.19, 1, 0.22, 1] }}
              >
                {isSearchPage ? (
                  <form onSubmit={handleSearchSubmit} className="relative">
                    <h1 className="sr-only">{title}</h1>
                    <Input
                      type="text"
                      placeholder="Search our collection..."
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      className="bg-transparent border-0 border-b border-white/20 rounded-none text-3xl md:text-5xl font-display italic placeholder:text-white/20 focus-visible:ring-0 focus-visible:border-white h-auto py-2 px-0"
                    />
                    <button type="submit" className="absolute right-0 bottom-4">
                      <Search className="w-6 h-6 text-white/40 hover:text-white transition-colors" />
                    </button>
                  </form>
                ) : (
                  <h1 className="text-4xl sm:text-5xl md:text-7xl font-display italic leading-none tracking-tight text-white">
                    {title}
                  </h1>
                )}
              </motion.div>
            </div>

            {/* Right: count + sort */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="flex items-center gap-6 pb-1"
            >
              <span className="text-[10px] uppercase tracking-[0.25em] text-white/50 font-bold">
                {total} {total === 1 ? 'Product' : 'Products'}
              </span>
              {/* Sort in header */}
              <div>
                <SortDropdown
                  value={currentSort}
                  onChange={(val) => updateUrl(currentFilters, val)}
                  isDarkBg={true}
                />
              </div>
            </motion.div>
          </div>
        </div>
      </div>


      <div className="max-w-7xl mx-auto px-6 md:px-8">
        {/* ── Filters Body (Always Visible, Non-Sticky) ── */}
        <div className="pt-10 pb-6 relative z-30">
          <div className="flex items-center gap-3 mb-8">
            <h2 className="text-[12px] uppercase tracking-[0.3em] font-black text-black">Refine By</h2>
            <div className="flex-1 h-[2px] bg-neutral-200" />
            {hasActiveFilters && (
              <button
                onClick={() => updateUrl({ category: undefined, minPrice: 0, maxPrice: 50000, sizes: [], colors: [], minRating: null })}
                className="text-[10px] uppercase tracking-[0.2em] text-black font-black border-b-2 border-black hover:text-neutral-600 transition-colors shrink-0"
              >
                Clear All
              </button>
            )}
          </div>

          <HorizontalProductFilters
            currentFilters={currentFilters}
            onFilterChange={(f) => updateUrl(f)}
            categories={categories}
          />
        </div>

        {/* ── Product Grid ── */}
        <div className="py-10 relative z-10">
          <ProductGrid
            products={products}
            isLoading={isLoading}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />
        </div>
      </div>
    </div>
  )
}
