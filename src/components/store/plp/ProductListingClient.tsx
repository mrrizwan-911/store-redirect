'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import Link from 'next/link'
import { HorizontalProductFilters } from './HorizontalProductFilters'
import { ProductGrid } from './ProductGrid'
import { SortDropdown } from './SortDropdown'
import { motion, AnimatePresence } from 'framer-motion'
import { SlidersHorizontal, X, Search, Camera, Loader2, Clock, History, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import Image from 'next/image'

interface ProductListingClientProps {
  initialProducts: any[]
  initialTotal: number
  categories: { name: string; slug: string }[]
  title: string
  subtitle?: string
  featuredProducts?: any[]
  baseCategorySlug?: string
}

export function ProductListingClient({
  initialProducts,
  initialTotal,
  categories,
  title,
  subtitle,
  featuredProducts = [],
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
  const [searchInput, setSearchInput] = useState(searchParams.get('q') || searchParams.get('search') || '')
  const [isVisualSearchLoading, setIsVisualSearchLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<{ products: any[], categories: any[] }>({ products: [], categories: [] })
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false)
  const [intentFeedback, setIntentFeedback] = useState<string | null>(null)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [isHeaderScrolled, setIsHeaderScrolled] = useState(false)
  const searchContainerRef = useRef<HTMLDivElement>(null)

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
    if (!searchInput) return
    addToHistory(searchInput)
    const params = new URLSearchParams(searchParams.toString())
    params.set('q', searchInput)
    router.push(`${pathname}?${params.toString()}`)
    setShowSuggestions(false)
  }

  const handleFileUpload = async (file: File) => {
    setIsVisualSearchLoading(true)

    // Convert to base64
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = async () => {
      const base64 = (reader.result as string).split(',')[1]
      try {
        const response = await fetch('/api/ai/visual-search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64 })
        })
        const result = await response.json()
        if (result.success) {
          // Update search input to reflect visual search
          const detectedStyle = result.data.analysis.detected || 'Visual Match'
          setSearchInput(`Style: ${detectedStyle}`)

          // Update URL to trigger the actual search with keywords
          const params = new URLSearchParams(searchParams.toString())
          params.set('q', detectedStyle)
          router.push(`${pathname}?${params.toString()}`)

          // Note: The second useEffect will handle fetching the products
          // because searchParams changed.
        }
      } catch (err) {
        console.error('Visual search failed:', err)
      } finally {
        setIsVisualSearchLoading(false)
      }
    }
  }

  const flattenedSuggestions = [
    ...(searchInput.length < 2 ? recentSearches.map(s => ({ type: 'history', name: s, slug: s })) : []),
    ...suggestions.categories.map(c => ({ ...c, type: 'category' })),
    ...suggestions.products.map(p => ({ ...p, type: 'product' }))
  ]

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || flattenedSuggestions.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => (prev < flattenedSuggestions.length - 1 ? prev + 1 : prev))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1))
    } else if (e.key === 'Enter') {
      if (selectedIndex >= 0) {
        e.preventDefault()
        const item = flattenedSuggestions[selectedIndex]
        if (item.type === 'category') {
          router.push(`/categories/${item.slug}`)
        } else if (item.type === 'product') {
          router.push(`/products/${item.slug}`)
        } else if (item.type === 'history') {
          setSearchInput(item.name)
          const params = new URLSearchParams(searchParams.toString())
          params.set('q', item.name)
          router.push(`${pathname}?${params.toString()}`)
        }
        setShowSuggestions(false)
      } else {
        // Standard form submit handled by handleSearchSubmit
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
  }

  const itemsPerPage = 24
  const totalPages = Math.ceil(total / itemsPerPage)
  const currentPage = Number(searchParams.get('page')) || 1

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    if (page === 1) {
      params.delete('page')
    } else {
      params.set('page', page.toString())
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: true })
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
    const handleScroll = () => {
      setIsHeaderScrolled(window.scrollY > 200)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    setMounted(true)
    // Load recent searches
    const saved = localStorage.getItem('recentSearches')
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved))
      } catch (e) {
        console.error('Failed to parse search history')
      }
    }

    // Handle autofocus if requested via URL
    if (searchParams.get('focus') === 'true') {
      setTimeout(() => {
        const input = document.getElementById('page-search-input');
        input?.focus();
        // Smooth scroll to top to bring search bar into center if scrolled
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 300)
    }
  }, [searchParams])

  const addToHistory = (term: string) => {
    if (!term || term.length < 2) return
    setRecentSearches(prev => {
      const filtered = prev.filter(s => s.toLowerCase() !== term.toLowerCase())
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
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    // Only fetch reactively on search page
    if (!isSearchPage || !mounted) return

    // Check if searchInput is different from what's in the URL to prevent loops
    const currentUrlQuery = searchParams.get('q') || searchParams.get('search') || ''
    if (searchInput === currentUrlQuery && searchInput.length > 0) return

    if (searchInput.length >= 2) {
      setShowSuggestions(true)
      setIsSuggestionsLoading(true)
      const delayDebounceFn = setTimeout(async () => {
        // Fetch Suggestions (categories + top products)
        try {
          const sugRes = await fetch(`/api/search?q=${encodeURIComponent(searchInput)}`)
          const sugResult = await sugRes.json()
          if (sugResult.success) {
            setSuggestions(sugResult.data)
            setIntentFeedback(sugResult.data.intentFeedback || null)
          }
        } catch (err) {
          console.error('Suggestions fetch failed:', err)
        } finally {
          setIsSuggestionsLoading(false)
        }

        // Update URL to trigger the main grid fetch
        const params = new URLSearchParams(searchParams.toString())
        params.set('q', searchInput)
        addToHistory(searchInput)
        router.push(`${pathname}?${params.toString()}`, { scroll: false })
      }, 500)

      return () => clearTimeout(delayDebounceFn)
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
  }, [searchInput, isSearchPage, mounted, pathname, router])

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true)
      try {
        const params = new URLSearchParams(searchParams.toString())

        // If no category filter is explicitly set in query params,
        // and we are on a category-specific page, use the base category slug
        if (!params.has('category') && baseCategorySlug) {
          params.set('category', baseCategorySlug)
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

    // Only fetch if params changed AFTER initial mount to prevent redundant fetch
    if (mounted) {
      fetchProducts()
    }
  }, [searchParams, mounted])

  return (
    <div className="min-h-screen bg-white text-black">
      {/* ── Sticky Compact Search Bar ── */}
      <AnimatePresence>
        {isSearchPage && isHeaderScrolled && (
          <motion.div
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            exit={{ y: -100 }}
            className="fixed top-[60px] left-0 right-0 z-[60] bg-white border-b border-neutral-200 py-3 shadow-lg"
          >
            <div className="max-w-7xl mx-auto px-6 md:px-8 flex items-center justify-between gap-8">
              <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-lg group">
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
              <div className="flex items-center gap-6">
                 <span className="text-[10px] uppercase tracking-widest font-black text-neutral-400">
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

      {/* ── Header ── */}
      {isSearchPage ? (
        <div className="bg-white border-b border-neutral-100 pt-20 pb-16 md:pt-32 md:pb-24">
          <div className="max-w-4xl mx-auto px-6 md:px-8 flex flex-col items-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="w-full flex flex-col items-center"
              ref={searchContainerRef}
            >
              <h1 className="font-display text-4xl md:text-6xl mb-12 tracking-tighter text-black font-bold">
                CALNZA<span className="text-neutral-200"> SEARCH</span>
              </h1>

              <form onSubmit={handleSearchSubmit} className="relative group w-full max-w-3xl mx-auto">
                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within:text-black transition-colors pointer-events-none">
                  {isLoading || isVisualSearchLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
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
                  className="w-full h-16 pl-14 pr-24 bg-white border-2 border-neutral-200 rounded-full text-xl focus-visible:ring-0 focus-visible:border-black transition-all shadow-md hover:shadow-lg group-focus-within:shadow-lg group-focus-within:border-black/20 placeholder:text-neutral-900 placeholder:font-black"
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
                      onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                    />
                  </label>
                </div>

                {/* Suggestions Dropdown */}
                <AnimatePresence>
                  {showSuggestions && flattenedSuggestions.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full left-0 right-0 mt-4 bg-white border border-neutral-200 shadow-2xl rounded-[24px] overflow-hidden z-[100]"
                    >
                      <div className="p-6 space-y-8">
                        {/* Recent Searches Section */}
                        {searchInput.length < 2 && recentSearches.length > 0 && (
                          <div>
                            <div className="flex items-center justify-between mb-4 px-2">
                              <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-400 font-black">Recent Searches</p>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  clearHistory();
                                }}
                                className="text-[9px] uppercase tracking-widest text-neutral-400 hover:text-black font-bold"
                              >
                                Clear History
                              </button>
                            </div>
                            <div className="flex flex-col gap-1">
                              {recentSearches.map((term, idx) => {
                                const isSelected = selectedIndex === idx;
                                return (
                                  <button
                                    key={idx}
                                    onClick={() => {
                                      setSearchInput(term);
                                      const params = new URLSearchParams(searchParams.toString());
                                      params.set('q', term);
                                      router.push(`${pathname}?${params.toString()}`);
                                      setShowSuggestions(false);
                                    }}
                                    onMouseEnter={() => setSelectedIndex(idx)}
                                    className={cn(
                                      "flex items-center gap-3 w-full p-2 transition-colors rounded-lg text-left group",
                                      isSelected ? "bg-neutral-100" : "hover:bg-neutral-50"
                                    )}
                                  >
                                    <History className={cn("w-3.5 h-3.5 transition-colors", isSelected ? "text-black" : "text-neutral-300 group-hover:text-black")} />
                                    <span className={cn("text-sm font-medium transition-colors", isSelected ? "text-black" : "text-black/70")}>{term}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Categories Section */}
                        {/* Suggestions Loading State */}
                        {isSuggestionsLoading && (
                          <div className="space-y-6">
                            <div>
                              <Skeleton className="h-3 w-32 bg-neutral-100 mb-4 rounded-none ml-2" />
                              <div className="flex gap-2 px-2">
                                <Skeleton className="h-8 w-20 bg-neutral-50 rounded-full" />
                                <Skeleton className="h-8 w-24 bg-neutral-50 rounded-full" />
                                <Skeleton className="h-8 w-16 bg-neutral-50 rounded-full" />
                              </div>
                            </div>
                            <div>
                              <Skeleton className="h-3 w-24 bg-neutral-100 mb-4 rounded-none ml-2" />
                              <div className="space-y-2">
                                {[1, 2, 3].map(i => (
                                  <div key={i} className="flex items-center gap-4 p-2">
                                    <Skeleton className="h-12 w-12 bg-neutral-50 rounded-lg" />
                                    <div className="flex-1 space-y-2">
                                      <Skeleton className="h-3 w-1/2 bg-neutral-50" />
                                      <Skeleton className="h-2 w-1/4 bg-neutral-50" />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {!isSuggestionsLoading && suggestions.categories.length > 0 && (
                          <div>
                            <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-400 font-black mb-4 px-2">Matching Categories</p>
                            <div className="flex flex-wrap gap-2">
                              {suggestions.categories.map((cat: any, idx: number) => {
                                const globalIdx = (searchInput.length < 2 ? recentSearches.length : 0) + idx;
                                const isSelected = selectedIndex === globalIdx;
                                return (
                                  <Link
                                    key={cat.slug}
                                    href={`/categories/${cat.slug}`}
                                    className={cn(
                                      "px-4 py-2 transition-all rounded-full text-xs font-bold uppercase tracking-widest border",
                                      isSelected ? "bg-black text-white border-black" : "bg-neutral-50 text-black border-transparent hover:border-black"
                                    )}
                                    onMouseEnter={() => setSelectedIndex(globalIdx)}
                                    onClick={() => setShowSuggestions(false)}
                                  >
                                    {cat.name}
                                  </Link>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Top Results Section */}
                        {suggestions.products.length > 0 && (
                          <div>
                            <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-400 font-black mb-4 px-2">Top Results</p>
                            <div className="grid grid-cols-1 gap-1">
                              {suggestions.products.map((product: any, idx: number) => {
                                const globalIdx = (searchInput.length < 2 ? recentSearches.length : 0) + suggestions.categories.length + idx;
                                const isSelected = selectedIndex === globalIdx;
                                return (
                                  <Link
                                    key={product.id}
                                    href={`/products/${product.slug}`}
                                    className={cn(
                                      "flex items-center gap-4 p-2 transition-colors rounded-xl group",
                                      isSelected ? "bg-neutral-100" : "hover:bg-neutral-50"
                                    )}
                                    onMouseEnter={() => setSelectedIndex(globalIdx)}
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
                                      <p className={cn("text-sm font-bold truncate transition-colors", isSelected ? "text-black" : "text-black group-hover:text-neutral-600")}>{product.name}</p>
                                      <p className="text-[10px] uppercase tracking-widest text-neutral-400">{product.category.name}</p>
                                    </div>
                                    <ArrowRight className={cn("w-4 h-4 transition-all", isSelected ? "text-black translate-x-1" : "text-neutral-300 opacity-0 group-hover:opacity-100 group-hover:translate-x-1")} />
                                  </Link>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        <div className="pt-4 border-t border-neutral-100 text-center">
                          <button
                            onClick={handleSearchSubmit}
                            className="text-[11px] font-black uppercase tracking-[0.2em] text-black hover:underline"
                          >
                            View All Search Results &rarr;
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
                    Showing <span className="text-black font-bold">{total}</span> {total === 1 ? 'match' : 'matches'} for &quot;<span className="italic text-black">{searchParams.get('q') || searchParams.get('search')}</span>&quot;
                  </p>
                ) : searchInput ? (
                  <p className="text-sm text-neutral-500 font-medium">
                    No results found for &quot;{searchInput}&quot;. Try a different query.
                  </p>
                ) : (
                    <div className="space-y-10">
                      <div>
                        <p className="uppercase tracking-[0.2em] text-[10px] font-black text-neutral-400 mb-6">Popular Categories</p>
                        <div className="flex flex-wrap justify-center gap-3">
                          {categories.slice(0, 5).map(cat => (
                            <button
                              key={cat.slug}
                              onClick={() => {
                                setSearchInput(cat.name)
                                addToHistory(cat.name)
                                const params = new URLSearchParams(searchParams.toString())
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
                        <p className="uppercase tracking-[0.2em] text-[10px] font-black text-neutral-400 mb-6">Trending Searches</p>
                        <div className="flex flex-wrap justify-center gap-2">
                          {['New Arrivals', 'Best Sellers', 'Summer 2026', 'Eid Collection', 'Flash Sale'].map(term => (
                            <button
                              key={term}
                              onClick={() => {
                                setSearchInput(term)
                                addToHistory(term)
                                const params = new URLSearchParams(searchParams.toString())
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
        <div className="bg-white text-black border-b border-neutral-100">
          <div className="max-w-7xl mx-auto px-6 md:px-8 py-12 md:py-16">
            <div className="flex flex-col items-center text-center">
              {/* Breadcrumb */}
              <p className="text-[9px] uppercase tracking-[0.3em] text-neutral-400 mb-6 font-bold flex items-center gap-2">
                <Link href="/" className="hover:text-black transition-colors">Home</Link>
                <span>/</span>
                <span className="text-neutral-300">Shop</span>
                <span>/</span>
                <span className="text-black">{title}</span>
              </p>

              {/* Title */}
              <h1 className="font-display text-4xl md:text-6xl tracking-tight mb-4">
                {title}
              </h1>

              {/* Subtitle */}
              {subtitle && (
                <p className="text-neutral-500 text-sm max-w-xl mx-auto leading-relaxed">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
        </div>
      )}


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
          {!isLoading && products.length === 0 && (
            <div className="mb-20">
              <div className="flex flex-col items-center justify-center py-24 text-center bg-neutral-50 border border-neutral-100 mb-20 rounded-[20px] px-6">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-6">
                  <Search className="w-8 h-8 text-neutral-300" />
                </div>
                <h3 className="font-display text-3xl italic text-black mb-4">No matches found</h3>
                <p className="text-neutral-500 text-sm max-w-sm mx-auto mb-10">
                  We couldn&apos;t find any results for &quot;<span className="font-bold text-black">{searchParams.get('q') || searchParams.get('search')}</span>&quot;.
                  Check your spelling or try more general keywords.
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  <button
                    onClick={() => {
                      setSearchInput('')
                      updateUrl({ category: undefined, minPrice: 0, maxPrice: 50000, sizes: [], colors: [], minRating: null, search: undefined })
                    }}
                    className="bg-black text-white px-8 py-4 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-neutral-800 transition-colors rounded-full"
                  >
                    Clear All Filters
                  </button>
                </div>

                <div className="mt-16 w-full max-w-lg">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-400 font-bold mb-6">Try searching for:</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {['Linen Shirts', 'Leather Boots', 'Formal Suits', 'Summer Dresses', 'Accessories'].map((term) => (
                      <button
                        key={term}
                        onClick={() => {
                          setSearchInput(term)
                          const params = new URLSearchParams(searchParams.toString())
                          params.set('q', term)
                          router.push(`${pathname}?${params.toString()}`)
                        }}
                        className="px-5 py-2.5 bg-white border border-neutral-200 text-[11px] font-bold uppercase tracking-widest hover:border-black transition-all rounded-full"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {featuredProducts.length > 0 && (
                <div className="space-y-12">
                  <div className="flex items-center gap-4">
                    <h2 className="text-xl font-display italic tracking-tight">You Might Also Like</h2>
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
            <div className="space-y-16">
              <ProductGrid
                products={products}
                isLoading={isLoading}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
              />

              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 pt-12 border-t border-neutral-100">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => handlePageChange(currentPage - 1)}
                    className="p-3 text-black disabled:text-neutral-200 transition-colors"
                  >
                    <ArrowRight className="w-5 h-5 rotate-180" />
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }).map((_, i) => {
                      const pageNum = i + 1;
                      const isCurrent = pageNum === currentPage;
                      // Simple logic to show only few pages if many exist
                      if (totalPages > 5 && Math.abs(pageNum - currentPage) > 2 && pageNum !== 1 && pageNum !== totalPages) {
                        if (Math.abs(pageNum - currentPage) === 3) return <span key={i} className="px-2 text-neutral-300">...</span>;
                        return null;
                      }
                      return (
                        <button
                          key={i}
                          onClick={() => handlePageChange(pageNum)}
                          className={cn(
                            "w-10 h-10 flex items-center justify-center text-xs font-bold transition-all rounded-none",
                            isCurrent ? "bg-black text-white" : "text-neutral-400 hover:text-black hover:bg-neutral-50"
                          )}
                        >
                          {pageNum.toString().padStart(2, '0')}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => handlePageChange(currentPage + 1)}
                    className="p-3 text-black disabled:text-neutral-200 transition-colors"
                  >
                    <ArrowRight className="w-5 h-5" />
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
