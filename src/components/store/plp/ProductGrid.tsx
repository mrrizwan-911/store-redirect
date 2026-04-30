'use client'

import { ProductCard } from '../shared/ProductCard'
import Link from 'next/link'
import Image from 'next/image'
import { LayoutGrid, List } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'

export interface ProductSummary {
  id: string
  name: string
  slug: string
  basePrice: number
  salePrice?: number | null
  category: { name: string; slug: string }
  images: { url: string }[]
  sku: string
  description: string
  avgRating: number | null
  reviewCount: number
  isLowStock?: boolean
  stockCount?: number
}

interface ProductGridProps {
  products: ProductSummary[]
  isLoading: boolean
  viewMode: 'grid' | 'list'
  onViewModeChange: (mode: 'grid' | 'list') => void
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.19, 1, 0.22, 1] } },
}

export function ProductGrid({
  products,
  isLoading,
  viewMode,
  onViewModeChange
}: ProductGridProps) {
  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center border-b border-neutral-100 pb-6">
          <Skeleton className="h-4 w-32 bg-neutral-100 rounded-none" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-10 bg-neutral-100 rounded-none" />
            <Skeleton className="h-10 w-10 bg-neutral-100 rounded-none" />
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="aspect-[4/5] w-full bg-neutral-50 rounded-none" />
              <Skeleton className="h-4 w-3/4 bg-neutral-50 rounded-none" />
              <Skeleton className="h-4 w-1/2 bg-neutral-50 rounded-none" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <h3 className="font-display text-2xl italic text-neutral-400 mb-4">No products found</h3>
        <p className="text-neutral-400 text-sm max-w-xs mx-auto">
          Try adjusting your filters or search criteria to find what you&apos;re looking for.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Grid Controls */}
      <div className="flex justify-between items-center border-b border-[#E5E5E5] pb-4">
        <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-neutral-400">
          Showing {products.length} {products.length === 1 ? 'Product' : 'Products'}
        </p>
        <div className="flex items-center gap-1 border border-[#E5E5E5] p-1 bg-white">
          <button
            onClick={() => onViewModeChange('grid')}
            className={cn(
              "w-8 h-8 flex items-center justify-center transition-colors",
              viewMode === 'grid'
                ? "bg-black text-white"
                : "text-neutral-500 hover:text-black"
            )}
            aria-label="Grid View"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onViewModeChange('list')}
            className={cn(
              "w-8 h-8 flex items-center justify-center transition-colors",
              viewMode === 'list'
                ? "bg-black text-white"
                : "text-neutral-500 hover:text-black"
            )}
            aria-label="List View"
          >
            <List className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Grid/List View */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className={cn(
          viewMode === 'grid'
            ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-6 gap-y-16"
            : "flex flex-col gap-8"
        )}
      >
        {products.map((product) => (
          <motion.div key={product.id} variants={itemVariants}>
            {viewMode === 'grid' ? (
              <ProductCard
                id={product.id}
                name={product.name}
                slug={product.slug}
                price={product.basePrice}
                salePrice={product.salePrice ?? undefined}
                category={product.category.name}
                imageUrl={product.images[0]?.url || '/placeholder.png'}
                sku={product.sku}
                description={product.description}
                avgRating={product.avgRating ?? undefined}
                reviewCount={product.reviewCount}
                isLowStock={product.isLowStock}
                stockCount={product.stockCount}
              />
            ) : (
              <div className="flex flex-col md:flex-row gap-8 p-6 bg-white border border-[#E5E5E5] hover:border-black/25 transition-colors group">
                <Link
                  href={`/products/${product.slug}`}
                  className="w-full md:w-56 lg:w-64 aspect-[4/5] relative overflow-hidden flex-shrink-0 bg-[#FAFAFA]"
                >
                  <Image
                    src={product.images[0]?.url || '/placeholder.png'}
                    alt={product.name}
                    fill
                    unoptimized
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                  />
                </Link>

                <div className="flex flex-col justify-center gap-3 flex-1 py-2">
                  <span className="text-[10px] uppercase tracking-[0.3em] text-neutral-400 font-bold">
                    {product.category.name}
                  </span>
                  <Link href={`/products/${product.slug}`} className="block">
                    <h3 className="font-display text-3xl md:text-4xl text-black group-hover:text-neutral-700 transition-colors">
                      {product.name}
                    </h3>
                  </Link>

                  <div className="flex items-baseline gap-3 pt-1">
                    {product.salePrice ? (
                      <>
                        <span className="text-sm font-bold text-black font-sans">
                          PKR {product.salePrice.toLocaleString()}
                        </span>
                        <span className="text-xs text-neutral-400 line-through font-sans">
                          PKR {product.basePrice.toLocaleString()}
                        </span>
                      </>
                    ) : (
                      <span className="text-sm font-bold text-black font-sans">
                        PKR {product.basePrice.toLocaleString()}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 pt-4 mt-auto">
                    <Link
                      href={`/products/${product.slug}`}
                      className="h-10 px-6 inline-flex items-center justify-center border border-black text-black hover:bg-neutral-50 transition-colors uppercase tracking-[0.2em] text-[10px] font-bold"
                    >
                      View
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}
