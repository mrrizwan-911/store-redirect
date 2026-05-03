'use client'

import React, { useEffect, useState } from 'react'
import { Heart } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { ProductCard } from '@/components/store/shared/ProductCard'
import { useAppSelector } from '@/store/hooks'
import { ProductSummary } from '@/components/store/plp/ProductGrid'

export default function PublicWishlistPage() {
  const productIds = useAppSelector((state) => state.wishlist.productIds)
  const [items, setItems] = useState<ProductSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchWishlistProducts() {
      if (!productIds || productIds.length === 0) {
        setItems([])
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      try {
        const res = await fetch('/api/products/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: productIds }),
        })
        const result = await res.json()

        if (result.success) {
          // Wrap the plain images string array into the expected { url: string } format
          const formattedItems = result.data.map((item: any) => ({
             ...item,
             images: [{ url: item.imageUrl }, ...(item.secondaryImageUrl ? [{ url: item.secondaryImageUrl }] : [])],
             category: { name: item.category, slug: item.category.toLowerCase() } // Mock slug if needed
          }))
          setItems(formattedItems)
        } else {
          toast.error('Failed to load wishlist items')
        }
      } catch (error) {
        toast.error('An error occurred while loading wishlist')
      } finally {
        setIsLoading(false)
      }
    }

    fetchWishlistProducts()
  }, [productIds])

  return (
    <div className="bg-white text-black min-h-screen pb-24">
      {/* Header */}
      <div className="border-b border-neutral-100 pt-20 pb-16 md:pt-32 md:pb-24">
        <div className="max-w-7xl mx-auto px-6 md:px-8 text-center">
          <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-400 font-bold mb-4">Saved Items</p>
          <h1 className="font-display text-4xl md:text-6xl tracking-tight text-black font-bold">
            Your Wishlist
          </h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-8 pt-16">
        {isLoading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
          </div>
        ) : items.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-6 gap-y-12">
            {items.map((item) => (
              <ProductCard
                key={item.id}
                id={item.id}
                name={item.name}
                slug={item.slug}
                imageUrl={item.images[0]?.url || '/placeholder.png'}
                secondaryImageUrl={item.images[1]?.url}
                price={Number(item.basePrice)}
                salePrice={item.salePrice ? Number(item.salePrice) : undefined}
                category={item.category?.name || 'Category'}
                sku={item.sku}
                description={item.description}
                avgRating={item.avgRating || undefined}
                reviewCount={item.reviewCount}
                isLowStock={item.isLowStock}
                stockCount={item.stockCount}
              />
            ))}
          </div>
        ) : (
          <div className="py-32 text-center border border-neutral-200 rounded-[var(--radius)] bg-neutral-50/50 max-w-3xl mx-auto">
            <Heart className="w-12 h-12 text-neutral-300 mx-auto mb-6 stroke-[1.5]" />
            <h2 className="font-display text-2xl md:text-3xl mb-3 text-black">Your wishlist is empty</h2>
            <p className="text-neutral-500 text-sm font-medium max-w-xs mx-auto mb-10 leading-relaxed">
              Explore our latest collections and save your favorite pieces here.
            </p>
            <Link
              href="/products"
              className="rounded-full border-2 border-black bg-black text-white h-14 px-10 uppercase tracking-widest text-[11px] font-bold shadow-sm flex items-center justify-center mx-auto w-fit transition-all duration-300 hover:bg-white hover:text-black"
            >
              Explore Products
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
