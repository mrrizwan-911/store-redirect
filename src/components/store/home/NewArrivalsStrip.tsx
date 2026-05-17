'use client'

import { useRef } from 'react'
import { ProductCard } from '../shared/ProductCard'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface ProductCardData {
  id: string
  name: string
  slug: string
  imageUrl: string
  secondaryImageUrl?: string
  price: number
  salePrice?: number
  category: string
  sku: string
  description?: string
  avgRating?: number
  reviewCount?: number
  isBadgeNew?: boolean
  isBadgeSale?: boolean
  isLowStock?: boolean
  stockCount?: number
}

interface NewArrivalsStripProps {
  products: ProductCardData[]
}

export function NewArrivalsStrip({ products }: NewArrivalsStripProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  if (products.length === 0) return null

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -400 : 400,
        behavior: 'smooth',
      })
    }
  }

  return (
    /* overflow-hidden on the outer section clips any stray scroll overflow.
       The inner scroll container handles its own overflow-x independently. */
    <section className="py-16 sm:py-24 overflow-hidden bg-background">
      <div className="max-w-7xl mx-auto px-4 md:px-6 mb-12 sm:mb-16 flex items-end justify-between">
        <div className="space-y-3 sm:space-y-4">
          <span className="text-[10px] uppercase tracking-[0.5em] text-neutral-400 font-bold block ml-1">
            Just In
          </span>
          <h2 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-medium text-black uppercase tracking-tight leading-[0.9]">
            New <br className="hidden md:block" /> Arrivals
          </h2>
        </div>

        <div className="flex gap-3 sm:gap-4 mb-2">
          <button
            onClick={() => scroll('left')}
            className="w-10 h-10 sm:w-12 sm:h-12 border border-neutral-100 flex items-center justify-center bg-white text-neutral-800 hover:bg-black hover:text-white transition-all duration-500 rounded-none shadow-sm"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 stroke-[1.25]" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="w-10 h-10 sm:w-12 sm:h-12 border border-neutral-100 flex items-center justify-center bg-white text-neutral-800 hover:bg-black hover:text-white transition-all duration-500 rounded-none shadow-sm"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 stroke-[1.25]" />
          </button>
        </div>
      </div>

      {/* Horizontal scroll container
          Removed the `after:content-[''] after:w-px` trick — it causes 1px
          horizontal overflow on some mobile browsers. The pb-12 scroll snap
          and smooth scroll are preserved. */}
      <div
        ref={scrollContainerRef}
        className="flex gap-4 sm:gap-6 md:gap-8 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-10 sm:pb-12 scroll-smooth px-4 md:px-6 lg:px-[max(1.5rem,calc((100vw-80rem)/2))] scroll-px-4 md:scroll-px-6 lg:scroll-px-[max(1.5rem,calc((100vw-80rem)/2))]"
      >
        {products.map((product) => (
          /* min-w-0 on the wrapper prevents flex children from causing overflow */
          <div
            key={product.id}
            className="w-[82vw] sm:w-[280px] md:w-[320px] lg:w-[285px] snap-center sm:snap-start shrink-0 min-w-0"
          >
            <ProductCard {...product} />
          </div>
        ))}
        {/* Spacer at the end so last card doesn't touch viewport edge */}
        <div className="w-4 shrink-0" aria-hidden="true" />
      </div>
    </section>
  )
}
