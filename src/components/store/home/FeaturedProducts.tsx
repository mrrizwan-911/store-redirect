import { ProductCard } from '../shared/ProductCard'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

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

interface FeaturedProductsProps {
  products: ProductCardData[]
}

export function FeaturedProducts({ products }: FeaturedProductsProps) {
  if (products.length === 0) return null

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-8">
          <div className="space-y-4 max-w-2xl">
            <span className="text-[10px] uppercase tracking-[0.4em] text-neutral-400 font-bold block ml-1">
              Curated Selection
            </span>
            <h2 className="font-display text-5xl md:text-6xl lg:text-7xl font-medium text-black uppercase tracking-tight leading-[0.9]">
              Featured <br className="hidden md:block" /> This Week
            </h2>
          </div>
          <Link
            href="/products"
            className="group flex items-center gap-3 text-[11px] uppercase tracking-[0.3em] font-bold text-black border-b border-black pb-2 transition-all hover:opacity-70 w-fit ml-1"
          >
            Shop All Products
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16">
          {products.map((product) => (
            <ProductCard key={product.id} {...product} />
          ))}
        </div>
      </div>
    </section>
  )
}
