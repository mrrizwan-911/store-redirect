'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import Link from 'next/link'
import { HorizontalProductFilters } from './HorizontalProductFilters'
import { ProductGrid } from './ProductGrid'
import { SortDropdown } from './SortDropdown'
import { motion, AnimatePresence } from 'framer-motion'
import {
  SlidersHorizontal,
  X,
  Search,
  Camera,
  LoaderCircle,
  Clock,
  History,
  ArrowRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import Image from 'next/image'

// ─── Types ────────────────────────────────────────────────────────────────────

interface CategoryItem {
  id: string
  name: string
  slug: string
}

interface FilterState {
  category?: string
  subCategory?: string
  minPrice: number
  maxPrice: number
  minRating: number | null
}

interface ProductListingClientProps {
  initialProducts: any[]
  initialTotal: number
  /** For PLP: all parent categories. For category page: will be fetched. */
  parentCategories?: CategoryItem[]
  /** Deprecated – kept for backward compat; use parentCategories */
  categories?: { name: string; slug: string }[]
  title: string
  subtitle?: string
  featuredProducts?: any[]
  /**
   * When arriving from /categories/[slug]:
   * The slug of the parent category already selected.
   */
  lockedParentSlug?: string
  lockedParentName?: string
  /**
   * When arriving from /categories/[slug]/[sub]:
   * The slug of the sub-category already selected.
   */
  lockedSubSlug?: string
  lockedSubName?: string
  /**
   * Legacy prop – some callers pass baseCategorySlug.
   * We map it to lockedParentSlug if lockedParentSlug is not set.
   */
  baseCategorySlug?: string
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ProductListingClient({
  initialProducts,
  initialTotal,
  parentCategories: parentCategoriesProp,
  categories: legacyCategories,
  title,
  subtitle,
  featuredProducts = [],
  lockedParentSlug,
  lockedParentName,
  lockedSubSlug,
  lockedSubName,
  baseCategorySlug,
}: ProductListingClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [products, setProducts] = useState(initialProducts)
  const [total, setTotal] = useState(initialTotal)
  const [isLoading, setIsLoading] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [mounted, setMounted] = useState(false)

  // Search state
  const [searchInput, setSearchInput] = useState(
    searchParams.get('q') || searchParams.get('search') || ''
  )
  const [isVisualSearchLoading, setIsVisualSearchLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<{
    products: any[]
    categories: any[]
  }>({ products: [], categories: [] })
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false)
  const [intentFeedback, setIntentFeedback] = useState<string | null>(null)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [isHeaderScrolled, setIsHeaderScrolled] = useState(false)

  // Parent categories for filter (fetched if not passed)
  const [parentCategories, setParentCategories] = useState<CategoryItem[]>(
    parentCategoriesProp ??
      (legacyCategories?.map((c) => ({ id: c.slug, name: c.name, slug: c.slug })) ?? [])
  )

  const searchContainerRef = useRef<HTMLDivElement>(null)
  const isSearchPage = pathname === '/search'

  // ── Resolve locked items from props ───────────────────────────────────────
  const effectiveLockedParentSlug = lockedParentSlug ?? baseCategorySlug
  const lockedParentCategory =
    effectiveLockedParentSlug && lockedParentName
      ? { id: effectiveLockedParentSlug, name: lockedParentName, slug: effectiveLockedParentSlug }
      : effectiveLockedParentSlug
      ? { id: effectiveLockedParentSlug, name: effectiveLockedParentSlug, slug: effectiveLockedParentSlug }
      : undefined

  const lockedSubCategory =
    lockedSubSlug && lockedSubName
      ? { id: lockedSubSlug, name: lockedSubName, slug: lockedSubSlug }
      : undefined

  // ── Current filter state from URL ─────────────────────────────────────────
  const currentFilters: FilterState = {
    category:
      effectiveLockedParentSlug ??
      (searchParams.get('category') || undefined),
    subCategory:
      lockedSubSlug ??
      (searchParams.get('subCategory') || undefined),
    minPrice: Number(searchParams.get('minPrice')) || 0,
    maxPrice: Number(searchParams.get('maxPrice')) || 50000,
    minRating: searchParams.get('rating')
      ? Number(searchParams.get('rating'))
      : null,
  }

  const currentSort = searchParams.get('sort') || 'createdAt_desc'

  const hasActiveFilters =
    (!effectiveLockedParentSlug && !!currentFilters.category) ||
    (!lockedSubSlug && !!currentFilters.subCategory) ||
    currentFilters.minPrice > 0 ||
    currentFilters.maxPrice < 50000 ||
    currentFilters.minRating !== null

  // ── URL updater ────────────────────────────────────────────────────────────
  const updateUrl = useCallback(
    (newFilters: FilterState, newSort?: string) => {
      const params = new URLSearchParams(searchParams.toString())

      // category: only write to URL if not locked by page
      if (!effectiveLockedParentSlug) {
        if (newFilters.category) params.set('category', newFilters.category)
        else params.delete('category')
      }

      // subCategory
      if (!lockedSubSlug) {
        if (newFilters.subCategory)
          params.set('subCategory', newFilters.subCategory)
        else params.delete('subCategory')
      }

      if (newFilters.minPrice > 0)
        params.set('minPrice', newFilters.minPrice.toString())
      else params.delete('minPrice')

      if (newFilters.maxPrice < 50000)
        params.set('maxPrice', newFilters.maxPrice.toString())
      else params.delete('maxPrice')

      if (newFilters.minRating !== null && newFilters.minRating !== undefined)
        params.set('rating', newFilters.minRating.toString())
      else params.delete('rating')

      if (newSort) params.set('sort', newSort)

      params.delete('page')
      router.push(`?${params.toString()}`, { scroll: false })
    },
    [router, searchParams, effectiveLockedParentSlug, lockedSubSlug]
  )

  // ── Fetch parent categories on PLP (no locked parent) ─────────────────────
  useEffect(() => {
    if (parentCategoriesProp || legacyCategories) return // already have them
    if (effectiveLockedParentSlug) return // category page, don't need all parents
    fetch('/api/categories?rootOnly=true')
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setParentCategories(
            (data.data as any[]).map((c) => ({
              id: c.id,
              name: c.name,
              slug: c.slug,
            }))
          )
        }
      })
      .catch(() => {})
  }, [parentCategoriesProp, legacyCategories, effectiveLockedParentSlug])

  // ── Lifecycle / scroll ─────────────────────────────────────────────────────
  useEffect(() => {
    const handleScroll = () => setIsHeaderScrolled(window.scrollY > 200)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem('recentSearches')
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved))
      } catch {}
    }
    if (searchParams.get('focus') === 'true') {
      setTimeout(() => {
        const input = document.getElementById('page-search-input')
        input?.focus()
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }, 300)
    }
  }, [searchParams])

  const addToHistory = (term: string) => {
    if (!term || term.length < 2) return
    setRecentSearches((prev) => {
      const filtered = prev.filter(
        (s) => s.toLowerCase() !== term.toLowerCase()
      )
      const updated = [term, ...filtered].slice(0, 5)
      localStorage.setItem('recentSearches', JSON.stringify(updated))
      return updated
    })
  }

  const clearHistory = () => {
    localStorage.removeItem('recentSearches')
    setRecentSearches([])
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // ── Fetch products on searchParams change ─────────────────────────────────
  useEffect(() => {
    if (!mounted) return
    const fetchProducts = async () => {
      setIsLoading(true)
      try {
        const params = new URLSearchParams(searchParams.toString())

        // Pass the locked parent slug if not in the URL already
        if (!params.has('category') && effectiveLockedParentSlug) {
          params.set('category', effectiveLockedParentSlug)
        }
        // Sub-category: if locked, pass it as category (direct sub filter)
        if (lockedSubSlug && !params.has('subCategory')) {
          params.set('subCategory', lockedSubSlug)
        }

        const response = await fetch(`/api/products?${params.toString()}`)
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
    fetchProducts()
  }, [searchParams, mounted, effectiveLockedParentSlug, lockedSubSlug])

  // ── Search-page reactive suggestions ──────────────────────────────────────
  useEffect(() => {
    if (!isSearchPage || !mounted) return
    const currentUrlQuery = searchParams.get('q') || searchParams.get('search') || ''
    if (searchInput === currentUrlQuery && searchInput.length > 0) return

    if (searchInput.length >= 2) {
      setShowSuggestions(true)
      setIsSuggestionsLoading(true)
      const timer = setTimeout(async () => {
        try {
          const sugRes = await fetch(
            `/api/search?q=${encodeURIComponent(searchInput)}`
          )
          const sugResult = await sugRes.json()
          if (sugResult.success) {
            setSuggestions(sugResult.data)
            setIntentFeedback(sugResult.data.intentFeedback || null)
          }
        } catch {}
        finally { setIsSuggestionsLoading(false) }

        const params = new URLSearchParams(searchParams.toString())
        params.set('q', searchInput)
        addToHistory(searchInput)
        router.push(`${pathname}?${params.toString()}`, { scroll: false })
      }, 500)
      return () => clearTimeout(timer)
    } else {
      setShowSuggestions(false)
      setIsSuggestionsLoading(false)
      if (searchInput.length === 0 && currentUrlQuery !== '') {
        const params = new URLSearchParams(searchParams.toString())
        params.delete('q')
        params.delete('search')
        router.push(`${pathname}?${params.toString()}`, { scroll: false })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput, isSearchPage, mounted])

  // ── Pagination ─────────────────────────────────────────────────────────────
  const itemsPerPage = 24
  const totalPages = Math.ceil(total / itemsPerPage)
  const currentPage = Number(searchParams.get('page')) || 1

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    if (page === 1) params.delete('page')
    else params.set('page', page.toString())
    router.push(`${pathname}?${params.toString()}`, { scroll: true })
  }

  // ── Search handlers ────────────────────────────────────────────────────────
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchInput) return
    addToHistory(searchInput)
    const params = new URLSearchParams(searchParams.toString())
    params.set('q', searchInput)
    router.push(`${pathname}?${params.toString()}`)
    setShowSuggestions(false)
  }

  const handleFileUpload = async (file: File) => {
    setIsVisualSearchLoading(true)
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = async () => {
      const base64 = (reader.result as string).split(',')[1]
      try {
        const response = await fetch('/api/ai/visual-search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64 }),
        })
        const result = await response.json()
        if (result.success) {
          const detectedStyle = result.data.analysis.detected || 'Visual Match'
          setSearchInput(`Style: ${detectedStyle}`)
          const params = new URLSearchParams(searchParams.toString())
          params.set('q', detectedStyle)
          router.push(`${pathname}?${params.toString()}`)
        }
      } catch {}
      finally { setIsVisualSearchLoading(false) }
    }
  }

  const flattenedSuggestions = [
    ...(searchInput.length < 2
      ? recentSearches.map((s) => ({ type: 'history', name: s, slug: s }))
      : []),
    ...suggestions.categories.map((c) => ({ ...c, type: 'category' })),
    ...suggestions.products.map((p) => ({ ...p, type: 'product' })),
  ]

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || flattenedSuggestions.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) =>
        prev < flattenedSuggestions.length - 1 ? prev + 1 : prev
      )
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1))
    } else if (e.key === 'Enter') {
      if (selectedIndex >= 0) {
        e.preventDefault()
        const item = flattenedSuggestions[selectedIndex]
        if (item.type === 'category') router.push(`/categories/${item.slug}`)
        else if (item.type === 'product') router.push(`/products/${item.slug}`)
        else if (item.type === 'history') {
          setSearchInput(item.name)
          const params = new URLSearchParams(searchParams.toString())
          params.set('q', item.name)
          router.push(`${pathname}?${params.toString()}`)
        }
        setShowSuggestions(false)
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-white text-black">
      {/* ── Sticky compact search bar (search page only) ── */}
      <AnimatePresence>
        {isSearchPage && isHeaderScrolled && (
          <motion.div
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            exit={{ y: -100 }}
            className="fixed top-[60px] left-0 right-0 z-[60] bg-white border-b border-neutral-200 py-3 shadow-lg"
          >
            <div className="max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-between gap-4 md:gap-8">
              <form
                onSubmit={handleSearchSubmit}
                className="relative flex-1 max-w-lg group"
              >
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 group-focus-within:text-black transition-colors" />
                <Input
                  type="text"
                  placeholder="Search..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onFocus={() => setShowSuggestions(true)}
                  className="w-full h-10 pl-10 pr-10 bg-neutral-50 border-transparent rounded-full text-sm focus-visible:ring-0 focus-visible:border-black/10 transition-all placeholder:text-neutral-400"
                />
              </form>
              <div className="flex items-center gap-4 md:gap-6 shrink-0">
                <span className="hidden sm:block text-[10px] uppercase tracking-widest font-black text-neutral-400">
                  {total} {total === 1 ? 'Match' : 'Matches'}
                </span>
                <SortDropdown
                  value={currentSort}
                  onChange={(val) => updateUrl(currentFilters, val)}
                  isDarkBg={false}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Page header ── */}
      {isSearchPage ? (
        <div className="bg-white border-b border-neutral-100 pt-20 pb-16 md:pt-32 md:pb-24">
          <div className="max-w-4xl mx-auto px-4 md:px-8 flex flex-col items-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="w-full flex flex-col items-center"
              ref={searchContainerRef}
            >
              <h1 className="font-display text-4xl md:text-6xl mb-12 tracking-tighter text-black font-bold text-center">
                CALNZA<span className="text-neutral-200"> SEARCH</span>
              </h1>

              <form
                onSubmit={handleSearchSubmit}
                className="relative group w-full max-w-3xl mx-auto"
              >
                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within:text-black transition-colors pointer-events-none">
                  {isLoading || isVisualSearchLoading ? (
                    <LoaderCircle className="w-5 h-5 animate-spin" />
                  ) : (
                    <Search className="w-5 h-5" />
                  )}
                </div>
                <Input
                  id="page-search-input"
                  type="text"
                  placeholder="Search for clothes, shoes, or accessories..."
                  value={searchInput}
                  onFocus={() => setShowSuggestions(true)}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full h-16 pl-14 pr-24 bg-white border-2 border-neutral-200 rounded-full text-xl focus-visible:ring-0 focus-visible:border-black transition-all shadow-md hover:shadow-lg placeholder:text-neutral-900 placeholder:font-black"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  {searchInput && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchInput('')
                        setShowSuggestions(false)
                      }}
                      className="p-2 text-neutral-400 hover:text-black transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                  <label className="p-3 text-neutral-400 hover:text-black transition-colors cursor-pointer border-l border-neutral-200 ml-2">
                    <Camera className="w-6 h-6" />
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) =>
                        e.target.files?.[0] &&
                        handleFileUpload(e.target.files[0])
                      }
                    />
                  </label>
                </div>

                {/* Suggestions dropdown */}
                <AnimatePresence>
                  {showSuggestions && flattenedSuggestions.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full left-0 right-0 mt-4 bg-white border border-neutral-200 shadow-2xl rounded-[24px] overflow-hidden z-[100]"
                    >
                      <div className="p-6 space-y-8">
                        {/* Recent Searches */}
                        {searchInput.length < 2 && recentSearches.length > 0 && (
                          <div>
                            <div className="flex items-center justify-between mb-4 px-2">
                              <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-400 font-black">
                                Recent
                              </p>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  clearHistory()
                                }}
                                className="text-[9px] uppercase tracking-widest text-neutral-400 hover:text-black font-bold"
                              >
                                Clear
                              </button>
                            </div>
                            <div className="flex flex-col gap-1">
                              {recentSearches.map((term, idx) => {
                                const isSelected = selectedIndex === idx
                                return (
                                  <button
                                    key={idx}
                                    onClick={() => {
                                      setSearchInput(term)
                                      const params = new URLSearchParams(
                                        searchParams.toString()
                                      )
                                      params.set('q', term)
                                      router.push(
                                        `${pathname}?${params.toString()}`
                                      )
                                      setShowSuggestions(false)
                                    }}
                                    onMouseEnter={() => setSelectedIndex(idx)}
                                    className={cn(
                                      'flex items-center gap-3 w-full p-2 transition-colors rounded-lg text-left group',
                                      isSelected
                                        ? 'bg-neutral-100'
                                        : 'hover:bg-neutral-50'
                                    )}
                                  >
                                    <History
                                      className={cn(
                                        'w-3.5 h-3.5 transition-colors',
                                        isSelected
                                          ? 'text-black'
                                          : 'text-neutral-300 group-hover:text-black'
                                      )}
                                    />
                                    <span
                                      className={cn(
                                        'text-sm font-medium transition-colors',
                                        isSelected
                                          ? 'text-black'
                                          : 'text-black/70'
                                      )}
                                    >
                                      {term}
                                    </span>
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        )}

                        {/* Loading skeleton */}
                        {isSuggestionsLoading && (
                          <div className="space-y-6">
                            <div>
                              <Skeleton className="h-3 w-32 bg-neutral-100 mb-4 rounded-none ml-2" />
                              <div className="flex gap-2 px-2">
                                <Skeleton className="h-8 w-20 bg-neutral-50 rounded-full" />
                                <Skeleton className="h-8 w-24 bg-neutral-50 rounded-full" />
                              </div>
                            </div>
                          </div>
                        )}

                        {!isSuggestionsLoading &&
                          suggestions.categories.length > 0 && (
                            <div>
                              <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-400 font-black mb-4 px-2">
                                Categories
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {suggestions.categories.map(
                                  (cat: any, idx: number) => {
                                    const globalIdx =
                                      (searchInput.length < 2
                                        ? recentSearches.length
                                        : 0) + idx
                                    const isSelected =
                                      selectedIndex === globalIdx
                                    return (
                                      <Link
                                        key={cat.slug}
                                        href={`/categories/${cat.slug}`}
                                        className={cn(
                                          'px-4 py-2 transition-all rounded-full text-xs font-bold uppercase tracking-widest border',
                                          isSelected
                                            ? 'bg-black text-white border-black'
                                            : 'bg-neutral-50 text-black border-transparent hover:border-black'
                                        )}
                                        onMouseEnter={() =>
                                          setSelectedIndex(globalIdx)
                                        }
                                        onClick={() =>
                                          setShowSuggestions(false)
                                        }
                                      >
                                        {cat.name}
                                      </Link>
                                    )
                                  }
                                )}
                              </div>
                            </div>
                          )}

                        {suggestions.products.length > 0 && (
                          <div>
                            <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-400 font-black mb-4 px-2">
                              Top Results
                            </p>
                            <div className="grid grid-cols-1 gap-1">
                              {suggestions.products.map(
                                (product: any, idx: number) => {
                                  const globalIdx =
                                    (searchInput.length < 2
                                      ? recentSearches.length
                                      : 0) +
                                    suggestions.categories.length +
                                    idx
                                  const isSelected = selectedIndex === globalIdx
                                  return (
                                    <Link
                                      key={product.id}
                                      href={`/products/${product.slug}`}
                                      className={cn(
                                        'flex items-center gap-4 p-2 transition-colors rounded-xl group',
                                        isSelected
                                          ? 'bg-neutral-100'
                                          : 'hover:bg-neutral-50'
                                      )}
                                      onMouseEnter={() =>
                                        setSelectedIndex(globalIdx)
                                      }
                                      onClick={() => setShowSuggestions(false)}
                                    >
                                      <div className="relative w-12 h-12 bg-neutral-100 rounded-lg overflow-hidden shrink-0 border border-neutral-100">
                                        <Image
                                          src={product.images[0]?.url || ''}
                                          alt={product.name}
                                          fill
                                          className="object-cover"
                                        />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p
                                          className={cn(
                                            'text-sm font-bold truncate transition-colors',
                                            isSelected
                                              ? 'text-black'
                                              : 'text-black group-hover:text-neutral-600'
                                          )}
                                        >
                                          {product.name}
                                        </p>
                                        <p className="text-[10px] uppercase tracking-widest text-neutral-400">
                                          {product.category.name}
                                        </p>
                                      </div>
                                      <ArrowRight
                                        className={cn(
                                          'w-4 h-4 transition-all',
                                          isSelected
                                            ? 'text-black translate-x-1'
                                            : 'text-neutral-300 opacity-0 group-hover:opacity-100 group-hover:translate-x-1'
                                        )}
                                      />
                                    </Link>
                                  )
                                }
                              )}
                            </div>
                          </div>
                        )}

                        <div className="pt-4 border-t border-neutral-100 text-center">
                          <button
                            onClick={handleSearchSubmit}
                            className="text-[11px] font-black uppercase tracking-[0.2em] text-black hover:underline"
                          >
                            View All Results &rarr;
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </form>

              <div className="mt-8 text-center w-full max-w-2xl">
                {intentFeedback && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mb-4 inline-flex items-center gap-2 px-4 py-2 bg-black text-white text-[10px] font-bold uppercase tracking-widest rounded-full"
                  >
                    <span className="opacity-60">AI Intent:</span>
                    {intentFeedback}
                  </motion.div>
                )}
                {total > 0 ? (
                  <p className="text-sm text-neutral-500 font-medium">
                    Showing{' '}
                    <span className="text-black font-bold">{total}</span>{' '}
                    {total === 1 ? 'match' : 'matches'} for &quot;
                    <span className="italic text-black">
                      {searchParams.get('q') || searchParams.get('search')}
                    </span>
                    &quot;
                  </p>
                ) : searchInput ? (
                  <p className="text-sm text-neutral-500">
                    No results for &quot;{searchInput}&quot;
                  </p>
                ) : (
                  <div className="space-y-10">
                    <div>
                      <p className="uppercase tracking-[0.2em] text-[10px] font-black text-neutral-400 mb-6">
                        Popular Categories
                      </p>
                      <div className="flex flex-wrap justify-center gap-3">
                        {parentCategories.slice(0, 5).map((cat) => (
                          <button
                            key={cat.slug}
                            onClick={() => {
                              setSearchInput(cat.name)
                              addToHistory(cat.name)
                              const params = new URLSearchParams(
                                searchParams.toString()
                              )
                              params.set('q', cat.name)
                              params.set('category', cat.slug)
                              router.push(`${pathname}?${params.toString()}`)
                            }}
                            className="px-6 py-2.5 bg-white border border-neutral-200 text-[11px] font-bold uppercase tracking-widest hover:border-black hover:bg-black hover:text-white transition-all rounded-full"
                          >
                            {cat.name}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="uppercase tracking-[0.2em] text-[10px] font-black text-neutral-400 mb-6">
                        Trending
                      </p>
                      <div className="flex flex-wrap justify-center gap-2">
                        {[
                          'New Arrivals',
                          'Best Sellers',
                          'Summer 2026',
                          'Eid Collection',
                          'Flash Sale',
                        ].map((term) => (
                          <button
                            key={term}
                            onClick={() => {
                              setSearchInput(term)
                              addToHistory(term)
                              const params = new URLSearchParams(
                                searchParams.toString()
                              )
                              params.set('q', term)
                              router.push(`${pathname}?${params.toString()}`)
                            }}
                            className="px-4 py-2 text-xs font-medium text-neutral-600 hover:text-black hover:underline underline-offset-4"
                          >
                            #{term.replace(/\s+/g, '')}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      ) : (
        /* ── Non-search page header ── */
        <div className="bg-white text-black border-b border-neutral-100">
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 md:py-16">
            <div className="flex flex-col items-center text-center">
              <p className="text-[9px] uppercase tracking-[0.3em] text-neutral-400 mb-6 font-bold flex items-center gap-2 flex-wrap justify-center">
                <Link href="/" className="hover:text-black transition-colors">
                  Home
                </Link>
                <span>/</span>
                <span className="text-neutral-300">Shop</span>
                <span>/</span>
                <span className="text-black">{title}</span>
              </p>
              <h1 className="font-display text-3xl md:text-6xl tracking-tight mb-4">
                {title}
              </h1>
              {subtitle && (
                <p className="text-neutral-500 text-sm max-w-xl mx-auto leading-relaxed">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Main content ── */}
      <div className="max-w-7xl mx-auto px-4 md:px-8">

        {/* ── Filter + Sort bar ── */}
        <div className="pt-6 pb-4 md:pt-10 md:pb-6 relative z-30">
          {/* Top row: label + sort */}
          <div className="flex items-center justify-between mb-4 md:mb-6 gap-3">
            <p className="text-[10px] uppercase tracking-[0.25em] font-black text-neutral-400 shrink-0 hidden md:block">
              Refine
            </p>
            <div className="flex-1 hidden md:block" />
            <div className="flex items-center gap-3 ml-auto">
              <span className="text-[10px] uppercase tracking-widest text-neutral-400 hidden sm:block">
                {total} {total === 1 ? 'item' : 'items'}
              </span>
              <SortDropdown
                value={currentSort}
                onChange={(val) => updateUrl(currentFilters, val)}
                isDarkBg={false}
              />
            </div>
          </div>

          {/* Filters */}
          <HorizontalProductFilters
            currentFilters={currentFilters}
            onFilterChange={(f) => updateUrl(f)}
            parentCategories={parentCategories}
            lockedParentCategory={lockedParentCategory}
            lockedSubCategory={lockedSubCategory}
          />
        </div>

        {/* ── Product Grid ── */}
        <div className="py-6 md:py-10 relative z-10">
          {!isLoading && products.length === 0 && (
            <div className="mb-20">
              <div className="flex flex-col items-center justify-center py-16 md:py-24 text-center bg-neutral-50 border border-neutral-100 rounded-2xl px-6">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-6">
                  <Search className="w-6 h-6 md:w-8 md:h-8 text-neutral-300" />
                </div>
                <h3 className="font-display text-2xl md:text-3xl italic text-black mb-4">
                  No matches found
                </h3>
                <p className="text-neutral-500 text-sm max-w-sm mx-auto mb-8">
                  Try adjusting your filters or explore other categories.
                </p>
                <button
                  onClick={() =>
                    updateUrl({
                      category: effectiveLockedParentSlug,
                      subCategory: undefined,
                      minPrice: 0,
                      maxPrice: 50000,
                      minRating: null,
                    })
                  }
                  className="bg-black text-white px-8 py-4 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-neutral-800 transition-colors rounded-full"
                >
                  Clear Filters
                </button>
              </div>

              {featuredProducts.length > 0 && (
                <div className="mt-16 space-y-12">
                  <div className="flex items-center gap-4">
                    <h2 className="text-xl font-display italic tracking-tight">
                      You Might Also Like
                    </h2>
                    <div className="flex-1 h-px bg-neutral-100" />
                  </div>
                  <ProductGrid
                    products={featuredProducts}
                    isLoading={false}
                    viewMode="grid"
                    onViewModeChange={setViewMode}
                  />
                </div>
              )}
            </div>
          )}

          {(products.length > 0 || isLoading) && (
            <div className="space-y-12 md:space-y-16">
              <ProductGrid
                products={products}
                isLoading={isLoading}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
              />

              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-1 md:gap-2 pt-8 md:pt-12 border-t border-neutral-100">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => handlePageChange(currentPage - 1)}
                    className="p-2 md:p-3 text-black disabled:text-neutral-200 transition-colors"
                  >
                    <ArrowRight className="w-4 h-4 md:w-5 md:h-5 rotate-180" />
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }).map((_, i) => {
                      const pageNum = i + 1
                      const isCurrent = pageNum === currentPage
                      if (
                        totalPages > 5 &&
                        Math.abs(pageNum - currentPage) > 2 &&
                        pageNum !== 1 &&
                        pageNum !== totalPages
                      ) {
                        if (Math.abs(pageNum - currentPage) === 3)
                          return (
                            <span
                              key={i}
                              className="px-1 md:px-2 text-neutral-300"
                            >
                              ...
                            </span>
                          )
                        return null
                      }
                      return (
                        <button
                          key={i}
                          onClick={() => handlePageChange(pageNum)}
                          className={cn(
                            'w-8 h-8 md:w-10 md:h-10 flex items-center justify-center text-xs font-bold transition-all rounded-none',
                            isCurrent
                              ? 'bg-black text-white'
                              : 'text-neutral-400 hover:text-black hover:bg-neutral-50'
                          )}
                        >
                          {pageNum.toString().padStart(2, '0')}
                        </button>
                      )
                    })}
                  </div>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => handlePageChange(currentPage + 1)}
                    className="p-2 md:p-3 text-black disabled:text-neutral-200 transition-colors"
                  >
                    <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
