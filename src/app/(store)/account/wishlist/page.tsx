'use client'

import React, { useEffect, useState } from 'react'
import { Heart, ShoppingBag, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ProductCard } from '@/components/store/shared/ProductCard'
import Link from 'next/link'

interface WishlistItem {
  id: string
  productId: string
  product: {
    id: string
    name: string
    slug: string
    basePrice: string
    salePrice: string | null
    category: {
      name: string
    }
    images: Array<{ url: string }>
  }
}

export default function DashboardWishlistPage() {
  const [items, setItems] = useState<WishlistItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchWishlist()
  }, [])

  async function fetchWishlist() {
    try {
      const res = await fetch('/api/account/wishlist')
      const result = await res.json()
      if (result.success) {
        setItems(result.data)
      }
    } catch (error) {
      toast.error('Failed to load wishlist')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-700 text-black">
      <div className="space-y-2">
        <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-500 font-bold">Saved Items</p>
        <h1 className="font-display text-4xl md:text-5xl tracking-tight text-black">Your Wishlist</h1>
      </div>

      {items.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <ProductCard
              key={item.id}
              id={item.product.id}
              name={item.product.name}
              slug={item.product.slug}
              imageUrl={item.product.images[0]?.url || '/placeholder.png'}
              price={Number(item.product.basePrice)}
              salePrice={item.product.salePrice ? Number(item.product.salePrice) : undefined}
              category={item.product.category?.name || 'Category'}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {items.length === 0 && (
        <div className="py-32 text-center border-2 border-dashed border-neutral-200 rounded-[12px] bg-neutral-50/30">
          <Heart className="w-12 h-12 text-neutral-300 mx-auto mb-6 stroke-[1.5]" />
          <h2 className="font-display text-2xl mb-2 text-black">Your wishlist is empty</h2>
          <p className="text-neutral-500 text-sm font-medium max-w-xs mx-auto mb-8">
            Explore our latest collections and save your favorite pieces here.
          </p>
          <Link
            href="/products"
            className="rounded-[12px] bg-black text-white h-12 px-10 uppercase tracking-widest text-[10px] font-bold shadow-lg flex items-center justify-center mx-auto w-fit transition-all hover:bg-neutral-900"
          >
            Explore Products
          </Link>
        </div>
      )}
    </div>
  )
}
