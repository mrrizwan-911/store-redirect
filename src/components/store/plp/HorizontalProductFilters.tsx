'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { ChevronDown, X, Check, SlidersHorizontal, Star } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

interface FilterState {
  category?: string
  subCategory?: string
  minPrice: number
  maxPrice: number
  minRating: number | null
}

interface CategoryItem {
  id: string
  name: string
  slug: string
}

interface HorizontalProductFiltersProps {
  onFilterChange: (filters: FilterState) => void
  currentFilters: FilterState
  /** Parent categories list (always passed) */
  parentCategories: CategoryItem[]
  /**
   * The parent category that is "locked" because we arrived via a category
   * slug page. When set, the category pill is shown as pre-selected and
   * the user can still pick sub-categories.
   */
  lockedParentCategory?: CategoryItem
  /**
   * The sub-category that is "locked" because we arrived via a sub-category
   * slug page.
   */
  lockedSubCategory?: CategoryItem
}

const RATINGS = [4, 3, 2]

// ─── Utility hook ─────────────────────────────────────────────────────────────

function useClickOutside(
  ref: React.RefObject<HTMLElement | null>,
  cb: () => void
) {
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) cb()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [ref, cb])
}

// ─── Main component ───────────────────────────────────────────────────────────

export function HorizontalProductFilters({
  onFilterChange,
  currentFilters,
  parentCategories,
  lockedParentCategory,
  lockedSubCategory,
}: HorizontalProductFiltersProps) {
  type OpenPanel = 'category' | 'subCategory' | 'price' | 'rating' | null
  const [openPanel, setOpenPanel] = useState<OpenPanel>(null)
  const [subCategories, setSubCategories] = useState<CategoryItem[]>([])
  const [subCatsLoading, setSubCatsLoading] = useState(false)

  // Local price state (only committed on "Apply")
  const [localMin, setLocalMin] = useState(currentFilters.minPrice)
  const [localMax, setLocalMax] = useState(currentFilters.maxPrice)

  // Mobile drawer
  const [mobileOpen, setMobileOpen] = useState(false)

  const barRef = useRef<HTMLDivElement>(null)
  const closePanel = useCallback(() => setOpenPanel(null), [])
  useClickOutside(barRef, closePanel)

  // Sync local price when external filters change
  useEffect(() => {
    setLocalMin(currentFilters.minPrice)
    setLocalMax(currentFilters.maxPrice)
  }, [currentFilters.minPrice, currentFilters.maxPrice])

  // ── Fetch sub-categories whenever the parent category changes ──────────────
  const activeParentSlug = lockedParentCategory?.slug ?? currentFilters.category

  useEffect(() => {
    if (!activeParentSlug) {
      setSubCategories([])
      return
    }
    setSubCatsLoading(true)
    fetch(`/api/categories/children?parentSlug=${activeParentSlug}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setSubCategories(data.data ?? [])
      })
      .catch(() => setSubCategories([]))
      .finally(() => setSubCatsLoading(false))
  }, [activeParentSlug])

  // ── Handlers ───────────────────────────────────────────────────────────────

  const toggle = (panel: OpenPanel) =>
    setOpenPanel((prev) => (prev === panel ? null : panel))

  const handleParentCategoryChange = (slug: string) => {
    // Changing parent clears sub-category
    const newCat = currentFilters.category === slug ? undefined : slug
    onFilterChange({ ...currentFilters, category: newCat, subCategory: undefined })
    setOpenPanel(null)
  }

  const handleSubCategoryChange = (slug: string) => {
    const newSub = currentFilters.subCategory === slug ? undefined : slug
    onFilterChange({ ...currentFilters, subCategory: newSub })
    setOpenPanel(null)
  }

  const applyPrice = () => {
    onFilterChange({ ...currentFilters, minPrice: localMin, maxPrice: localMax })
    setOpenPanel(null)
  }

  const handleRating = (r: number | null) => {
    onFilterChange({ ...currentFilters, minRating: r })
    setOpenPanel(null)
  }

  const clearAll = () => {
    onFilterChange({
      category: lockedParentCategory?.slug,
      subCategory: lockedSubCategory ? undefined : undefined,
      minPrice: 0,
      maxPrice: 50000,
      minRating: null,
    })
    setOpenPanel(null)
  }

  // ── Derived values ─────────────────────────────────────────────────────────

  const selectedParent =
    lockedParentCategory ??
    parentCategories.find((c) => c.slug === currentFilters.category)

  const selectedSub =
    lockedSubCategory?.slug === currentFilters.subCategory
      ? lockedSubCategory
      : subCategories.find((c) => c.slug === currentFilters.subCategory)

  const isPriceActive =
    currentFilters.minPrice > 0 || currentFilters.maxPrice < 50000
  const isRatingActive = currentFilters.minRating !== null

  const hasActiveFilters =
    (!lockedParentCategory && !!currentFilters.category) ||
    !!currentFilters.subCategory ||
    isPriceActive ||
    isRatingActive

  const activeCount = [
    !lockedParentCategory && !!currentFilters.category,
    !!currentFilters.subCategory,
    isPriceActive,
    isRatingActive,
  ].filter(Boolean).length

  // ── Render helpers ─────────────────────────────────────────────────────────

  const FilterPill = ({
    label,
    active,
    locked,
    panelKey,
    badge,
  }: {
    label: string
    active: boolean
    locked?: boolean
    panelKey: OpenPanel
    badge?: string
  }) => (
    <button
      onClick={() => !locked && toggle(panelKey)}
      className={cn(
        'group relative flex items-center gap-2 px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.18em] transition-all duration-200 select-none whitespace-nowrap',
        // shape: pill style
        'rounded-full border',
        locked
          ? 'cursor-default border-black bg-black text-white'
          : active
          ? 'border-black bg-black text-white shadow-[0_2px_12px_rgba(0,0,0,0.18)]'
          : 'border-border bg-card text-neutral-600 hover:border-neutral-400 hover:text-black'
      )}
    >
      {badge && (
        <span
          className={cn(
            'flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-black',
            active ? 'bg-card text-black' : 'bg-black text-white'
          )}
        >
          {badge}
        </span>
      )}
      <span>{label}</span>
      {!locked && (
        <ChevronDown
          className={cn(
            'h-3 w-3 transition-transform duration-200',
            openPanel === panelKey && 'rotate-180',
            active ? 'opacity-80' : 'opacity-50'
          )}
        />
      )}
    </button>
  )

  // Shared dropdown wrapper
  const DropdownPanel = ({
    panelKey,
    children,
    className,
  }: {
    panelKey: OpenPanel
    children: React.ReactNode
    className?: string
  }) => (
    <AnimatePresence>
      {openPanel === panelKey && (
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.98 }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          className={cn(
            'absolute top-full left-0 z-[70] mt-2 overflow-hidden rounded-2xl border border-border bg-card shadow-[0_8px_40px_rgba(0,0,0,0.14)]',
            className
          )}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )

  // ── Chip for active filters ────────────────────────────────────────────────

  const ActiveChip = ({
    label,
    onRemove,
  }: {
    label: string
    onRemove: () => void
  }) => (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-black">
      {label}
      <button
        onClick={onRemove}
        className="ml-0.5 rounded-full p-0.5 hover:bg-border transition-colors"
      >
        <X className="h-2.5 w-2.5" />
      </button>
    </span>
  )

  // ── DESKTOP FILTER BAR ─────────────────────────────────────────────────────

  const DesktopBar = () => (
    <div ref={barRef} className="hidden md:block">
      {/* Pills row */}
      <div className="flex flex-wrap items-center gap-2">

        {/* ── Category pill ── */}
        {(parentCategories.length > 0 || lockedParentCategory) && (
          <div className="relative">
            <FilterPill
              panelKey="category"
              label={selectedParent ? selectedParent.name : 'Category'}
              active={!!selectedParent}
              locked={!!lockedParentCategory}
            />
            {!lockedParentCategory && (
              <DropdownPanel panelKey="category" className="min-w-[200px] max-w-[260px]">
                <div className="p-1.5 max-h-[280px] overflow-y-auto scrollbar-hide">
                  {parentCategories.map((cat) => (
                    <button
                      key={cat.slug}
                      onClick={() => handleParentCategoryChange(cat.slug)}
                      className={cn(
                        'flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3 text-[11px] font-bold uppercase tracking-widest transition-colors',
                        currentFilters.category === cat.slug
                          ? 'bg-black text-white'
                          : 'text-neutral-600 hover:bg-surface hover:text-black'
                      )}
                    >
                      {cat.name}
                      {currentFilters.category === cat.slug && (
                        <Check className="h-3 w-3 shrink-0 stroke-[3]" />
                      )}
                    </button>
                  ))}
                </div>
              </DropdownPanel>
            )}
          </div>
        )}

        {/* ── Sub-category pill ── */}
        {activeParentSlug && (
          <div className="relative">
            <FilterPill
              panelKey="subCategory"
              label={selectedSub ? selectedSub.name : 'Sub-category'}
              active={!!selectedSub}
            />
            <DropdownPanel panelKey="subCategory" className="min-w-[200px] max-w-[260px]">
              {subCatsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
                </div>
              ) : subCategories.length === 0 ? (
                <div className="px-6 py-5 text-[10px] uppercase tracking-widest text-neutral-400">
                  No sub-categories
                </div>
              ) : (
                <div className="p-1.5 max-h-[280px] overflow-y-auto scrollbar-hide">
                  {subCategories.map((sub) => (
                    <button
                      key={sub.slug}
                      onClick={() => handleSubCategoryChange(sub.slug)}
                      className={cn(
                        'flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3 text-[11px] font-bold uppercase tracking-widest transition-colors',
                        currentFilters.subCategory === sub.slug
                          ? 'bg-black text-white'
                          : 'text-neutral-600 hover:bg-surface hover:text-black'
                      )}
                    >
                      {sub.name}
                      {currentFilters.subCategory === sub.slug && (
                        <Check className="h-3 w-3 shrink-0 stroke-[3]" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </DropdownPanel>
          </div>
        )}

        {/* ── Divider ── */}
        {(parentCategories.length > 0 || lockedParentCategory) && (
          <div className="mx-1 h-5 w-px bg-border" />
        )}

        {/* ── Price pill ── */}
        <div className="relative">
          <FilterPill
            panelKey="price"
            label={
              isPriceActive
                ? `PKR ${currentFilters.minPrice.toLocaleString()} – ${currentFilters.maxPrice.toLocaleString()}`
                : 'Price'
            }
            active={isPriceActive}
          />
          <DropdownPanel panelKey="price" className="min-w-[300px] p-6">
            <p className="mb-5 text-[9px] font-black uppercase tracking-[0.25em] text-neutral-400">
              Price Range
            </p>
            <div className="mb-6 grid grid-cols-2 gap-3">
              {[
                { label: 'Min', value: localMin, set: setLocalMin },
                { label: 'Max', value: localMax, set: setLocalMax },
              ].map(({ label, value, set }) => (
                <div key={label}>
                  <label className="mb-1.5 block text-[9px] font-bold uppercase tracking-widest text-neutral-400">
                    {label} (PKR)
                  </label>
                  <input
                    type="number"
                    value={value}
                    onChange={(e) => set(Number(e.target.value))}
                    className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm font-mono font-bold text-black outline-none transition-colors focus:border-black"
                  />
                </div>
              ))}
            </div>
            <Slider
              value={[localMin, localMax]}
              max={50000}
              step={100}
              onValueChange={(v) => {
                if (Array.isArray(v)) { setLocalMin(v[0]); setLocalMax(v[1]) }
              }}
              className="mb-6"
            />
            <button
              onClick={applyPrice}
              className="w-full rounded-xl bg-black py-3 text-[10px] font-black uppercase tracking-[0.2em] text-white transition-all hover:bg-neutral-900 active:scale-95"
            >
              Apply
            </button>
          </DropdownPanel>
        </div>

        {/* ── Rating pill ── */}
        <div className="relative">
          <FilterPill
            panelKey="rating"
            label={
              isRatingActive ? `${currentFilters.minRating}★ & up` : 'Rating'
            }
            active={isRatingActive}
          />
          <DropdownPanel panelKey="rating" className="min-w-[190px]">
            <div className="p-1.5">
              <button
                onClick={() => handleRating(null)}
                className={cn(
                  'flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3 text-[11px] font-bold uppercase tracking-widest transition-colors',
                  currentFilters.minRating === null
                    ? 'bg-black text-white'
                    : 'text-neutral-600 hover:bg-surface hover:text-black'
                )}
              >
                All ratings
                {currentFilters.minRating === null && (
                  <Check className="h-3 w-3 stroke-[3]" />
                )}
              </button>
              {RATINGS.map((r) => (
                <button
                  key={r}
                  onClick={() => handleRating(r)}
                  className={cn(
                    'flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3 transition-colors',
                    currentFilters.minRating === r
                      ? 'bg-black text-white'
                      : 'text-neutral-600 hover:bg-surface hover:text-black'
                  )}
                >
                  <span className="flex items-center gap-1.5">
                    {Array.from({ length: r }).map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          'h-3 w-3 fill-current',
                          currentFilters.minRating === r
                            ? 'text-white'
                            : 'text-amber-400'
                        )}
                      />
                    ))}
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                      & up
                    </span>
                  </span>
                  {currentFilters.minRating === r && (
                    <Check className="h-3 w-3 shrink-0 stroke-[3]" />
                  )}
                </button>
              ))}
            </div>
          </DropdownPanel>
        </div>

        {/* ── Clear all ── */}
        {hasActiveFilters && (
          <>
            <div className="mx-1 h-5 w-px bg-border" />
            <button
              onClick={clearAll}
              className="flex items-center gap-1.5 rounded-full px-3 py-2 text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-500 transition-colors hover:text-black"
            >
              <X className="h-3 w-3" />
              Clear
            </button>
          </>
        )}
      </div>

      {/* Active filter chips */}
      {hasActiveFilters && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {!lockedParentCategory && selectedParent && (
            <ActiveChip
              label={selectedParent.name}
              onRemove={() =>
                onFilterChange({
                  ...currentFilters,
                  category: undefined,
                  subCategory: undefined,
                })
              }
            />
          )}
          {selectedSub && !lockedSubCategory && (
            <ActiveChip
              label={selectedSub.name}
              onRemove={() =>
                onFilterChange({ ...currentFilters, subCategory: undefined })
              }
            />
          )}
          {isPriceActive && (
            <ActiveChip
              label={`PKR ${currentFilters.minPrice.toLocaleString()} – ${currentFilters.maxPrice.toLocaleString()}`}
              onRemove={() =>
                onFilterChange({ ...currentFilters, minPrice: 0, maxPrice: 50000 })
              }
            />
          )}
          {isRatingActive && (
            <ActiveChip
              label={`${currentFilters.minRating}★ & up`}
              onRemove={() => onFilterChange({ ...currentFilters, minRating: null })}
            />
          )}
        </div>
      )}
    </div>
  )

  // ── MOBILE FILTER SHEET ────────────────────────────────────────────────────

  const MobileSheet = () => (
    <div className="md:hidden">
      {/* Trigger bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setMobileOpen(true)}
          className="flex items-center gap-2.5 rounded-full border border-border bg-card px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.18em] text-black shadow-sm transition-all active:scale-95"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filters
          {activeCount > 0 && (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-black text-[8px] font-black text-white">
              {activeCount}
            </span>
          )}
        </button>

        {/* Active filter chips scroll */}
        {hasActiveFilters && (
          <div className="flex-1 overflow-x-auto scrollbar-hide ml-2">
            <div className="flex gap-2 pr-2">
              {!lockedParentCategory && selectedParent && (
                <ActiveChip
                  label={selectedParent.name}
                  onRemove={() =>
                    onFilterChange({
                      ...currentFilters,
                      category: undefined,
                      subCategory: undefined,
                    })
                  }
                />
              )}
              {selectedSub && !lockedSubCategory && (
                <ActiveChip
                  label={selectedSub.name}
                  onRemove={() =>
                    onFilterChange({ ...currentFilters, subCategory: undefined })
                  }
                />
              )}
              {isPriceActive && (
                <ActiveChip
                  label={`PKR ${currentFilters.minPrice.toLocaleString()}–${currentFilters.maxPrice.toLocaleString()}`}
                  onRemove={() =>
                    onFilterChange({
                      ...currentFilters,
                      minPrice: 0,
                      maxPrice: 50000,
                    })
                  }
                />
              )}
              {isRatingActive && (
                <ActiveChip
                  label={`${currentFilters.minRating}★+`}
                  onRemove={() =>
                    onFilterChange({ ...currentFilters, minRating: null })
                  }
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Backdrop */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-[90] max-h-[85dvh] overflow-y-auto rounded-t-3xl bg-card shadow-2xl"
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="h-1 w-10 rounded-full bg-border" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-6 pb-4 pt-2">
                <h2 className="text-sm font-black uppercase tracking-[0.2em]">
                  Filters
                </h2>
                <div className="flex items-center gap-3">
                  {hasActiveFilters && (
                    <button
                      onClick={clearAll}
                      className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 underline underline-offset-2"
                    >
                      Clear all
                    </button>
                  )}
                  <button
                    onClick={() => setMobileOpen(false)}
                    className="rounded-full p-2 hover:bg-surface transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="px-6 pb-8 space-y-8">

                {/* Category section */}
                {!lockedParentCategory && parentCategories.length > 0 && (
                  <MobileSection title="Category">
                    <div className="flex flex-wrap gap-2">
                      {parentCategories.map((cat) => (
                        <button
                          key={cat.slug}
                          onClick={() => handleParentCategoryChange(cat.slug)}
                          className={cn(
                            'rounded-full border px-4 py-2 text-[10px] font-bold uppercase tracking-wider transition-all',
                            currentFilters.category === cat.slug
                              ? 'border-black bg-black text-white'
                              : 'border-border bg-card text-neutral-600 hover:border-neutral-400'
                          )}
                        >
                          {cat.name}
                        </button>
                      ))}
                    </div>
                  </MobileSection>
                )}

                {/* Sub-category section */}
                {activeParentSlug && (
                  <MobileSection title="Sub-category">
                    {subCatsLoading ? (
                      <div className="flex items-center gap-2 text-[10px] text-neutral-400 uppercase tracking-wider">
                        <div className="h-3 w-3 animate-spin rounded-full border border-black border-t-transparent" />
                        Loading…
                      </div>
                    ) : subCategories.length === 0 ? (
                      <p className="text-[10px] uppercase tracking-wider text-neutral-400">
                        No sub-categories available
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {subCategories.map((sub) => (
                          <button
                            key={sub.slug}
                            onClick={() => handleSubCategoryChange(sub.slug)}
                            className={cn(
                              'rounded-full border px-4 py-2 text-[10px] font-bold uppercase tracking-wider transition-all',
                              currentFilters.subCategory === sub.slug
                                ? 'border-black bg-black text-white'
                                : 'border-border bg-card text-neutral-600 hover:border-neutral-400'
                            )}
                          >
                            {sub.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </MobileSection>
                )}

                {/* Price section */}
                <MobileSection title="Price Range">
                  <div className="grid grid-cols-2 gap-3 mb-5">
                    {[
                      { label: 'Min', value: localMin, set: setLocalMin },
                      { label: 'Max', value: localMax, set: setLocalMax },
                    ].map(({ label, value, set }) => (
                      <div key={label}>
                        <label className="mb-1.5 block text-[9px] font-bold uppercase tracking-widest text-neutral-400">
                          {label} (PKR)
                        </label>
                        <input
                          type="number"
                          value={value}
                          onChange={(e) => set(Number(e.target.value))}
                          className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm font-mono font-bold text-black outline-none focus:border-black"
                        />
                      </div>
                    ))}
                  </div>
                  <Slider
                    value={[localMin, localMax]}
                    max={50000}
                    step={100}
                    onValueChange={(v) => {
                      if (Array.isArray(v)) { setLocalMin(v[0]); setLocalMax(v[1]) }
                    }}
                    className="mb-2"
                  />
                  <div className="flex justify-between text-[9px] font-mono text-neutral-400 mt-3">
                    <span>PKR {localMin.toLocaleString()}</span>
                    <span>PKR {localMax.toLocaleString()}</span>
                  </div>
                </MobileSection>

                {/* Rating section */}
                <MobileSection title="Rating">
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleRating(null)}
                      className={cn(
                        'rounded-full border px-4 py-2 text-[10px] font-bold uppercase tracking-wider transition-all',
                        currentFilters.minRating === null
                          ? 'border-black bg-black text-white'
                          : 'border-border text-neutral-600'
                      )}
                    >
                      All
                    </button>
                    {RATINGS.map((r) => (
                      <button
                        key={r}
                        onClick={() => handleRating(r)}
                        className={cn(
                          'flex items-center gap-1.5 rounded-full border px-4 py-2 text-[10px] font-bold uppercase tracking-wider transition-all',
                          currentFilters.minRating === r
                            ? 'border-black bg-black text-white'
                            : 'border-border text-neutral-600'
                        )}
                      >
                        {r}
                        <Star
                          className={cn(
                            'h-3 w-3 fill-current',
                            currentFilters.minRating === r
                              ? 'text-white'
                              : 'text-amber-400'
                          )}
                        />
                        +
                      </button>
                    ))}
                  </div>
                </MobileSection>

                {/* Apply button */}
                <button
                  onClick={() => {
                    applyPrice()
                    setMobileOpen(false)
                  }}
                  className="w-full rounded-2xl bg-black py-4 text-[11px] font-black uppercase tracking-[0.2em] text-white transition-all active:scale-95"
                >
                  Apply Filters
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )

  return (
    <>
      <DesktopBar />
      <MobileSheet />
    </>
  )
}

// ── Small helper ───────────────────────────────────────────────────────────────

function MobileSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div>
      <p className="mb-3 text-[9px] font-black uppercase tracking-[0.25em] text-neutral-400">
        {title}
      </p>
      {children}
    </div>
  )
}
