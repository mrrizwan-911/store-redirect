'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Heart, Plus, Star } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { addItem, openCart } from '@/store/slices/cartSlice'
import { toggleWishlist } from '@/store/slices/wishlistSlice'
import { cn } from '@/lib/utils'
import { useState } from 'react'

interface ProductCardProps {
  id: string
  name: string
  slug: string
  imageUrl: string
  secondaryImageUrl?: string
  price: number
  salePrice?: number
  category: string
  avgRating?: number
  reviewCount?: number
  isBadgeNew?: boolean
  isBadgeSale?: boolean
  isLowStock?: boolean
  stockCount?: number
}

export function ProductCard({
  id,
  name,
  slug,
  imageUrl,
  secondaryImageUrl,
  price,
  salePrice,
  category,
  avgRating,
  reviewCount,
  isBadgeNew,
  isBadgeSale,
  isLowStock,
  stockCount,
}: ProductCardProps) {
  const dispatch = useAppDispatch()
  const wishlist = useAppSelector(state => state.wishlist.productIds)
  const isInWishlist = wishlist.includes(id)
  const [isHovered, setIsHovered] = useState(false)

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    dispatch(addItem({
      productId: id,
      name,
      price: salePrice || price,
      quantity: 1,
      imageUrl,
    }))
    dispatch(openCart())
  }

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault()
    dispatch(toggleWishlist(id))
  }

  return (
    <div
      className="group relative bg-white rounded-none border border-[#E5E5E5] transition-colors duration-300 hover:border-black/25"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container */}
      <div className="relative aspect-[4/5] overflow-hidden bg-[#FAFAFA]">
        <Link href={`/products/${slug}`} className="block h-full w-full relative">
          <Image
            src={(isHovered && secondaryImageUrl) ? secondaryImageUrl : imageUrl}
            alt={name}
            fill
            unoptimized
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          />
        </Link>

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 pointer-events-none">
          {isBadgeNew && (
            <span className="bg-black text-white text-[9px] font-bold uppercase tracking-widest px-2 py-1">
              New
            </span>
          )}
          {isBadgeSale && (
            <span className="bg-[#E05252] text-white text-[9px] font-bold uppercase tracking-widest px-2 py-1">
              Sale
            </span>
          )}
        </div>

        {/* Minimal Actions (hover/focus) */}
        <div className="absolute top-3 right-3 flex flex-col items-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button
            onClick={handleWishlist}
            className={cn(
              "h-8 px-2.5 inline-flex items-center gap-2 bg-white/95 text-neutral-700 border border-[#E5E5E5] uppercase tracking-[0.18em] text-[9px] font-bold hover:border-black/30 hover:text-black transition-colors",
              isInWishlist && "border-black text-black"
            )}
            aria-label={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
          >
            <Heart className={cn("w-3.5 h-3.5", isInWishlist && "fill-current")} />
            <span className="hidden sm:inline">Save</span>
          </button>
          <button
            onClick={handleAddToCart}
            className="h-8 px-2.5 inline-flex items-center gap-2 bg-white/95 text-neutral-700 border border-[#E5E5E5] uppercase tracking-[0.18em] text-[9px] font-bold hover:border-black/30 hover:text-black transition-colors"
            aria-label="Add to cart"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Add</span>
          </button>
        </div>

        {/* Quick Add Button */}
        <button
          onClick={handleAddToCart}
          className="absolute bottom-0 left-0 right-0 bg-white text-black py-3.5 text-[10px] font-bold uppercase tracking-[0.18em] transition-transform duration-500 translate-y-full group-hover:translate-y-0 border-t border-[#E5E5E5] hover:bg-black hover:text-white z-20"
        >
          Quick Add — PKR {(salePrice || price).toLocaleString()}
        </button>
      </div>

      {/* Product Details */}
      <div className="pt-4 pb-4 px-4 flex flex-col gap-1.5">
        <div className="flex justify-between items-center">
          <span className="text-[10px] uppercase tracking-[0.2em] text-neutral-400 font-medium">
            {category}
          </span>
          {avgRating && (
            <div className="flex items-center gap-1">
              <Star className="w-2.5 h-2.5 fill-neutral-400 text-neutral-400" />
              <span className="text-[10px] font-bold text-black">{avgRating}</span>
            </div>
          )}
        </div>

        <Link href={`/products/${slug}`} className="block">
          <h3 className="font-display text-lg md:text-xl font-medium tracking-tight group-hover:text-neutral-600 transition-colors">
            {name}
          </h3>
        </Link>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {salePrice ? (
              <>
                <span className="text-sm font-bold text-black font-sans">PKR {salePrice.toLocaleString()}</span>
                <span className="text-xs text-neutral-400 line-through font-sans">PKR {price.toLocaleString()}</span>
              </>
            ) : (
              <span className="text-sm font-bold text-black font-sans">PKR {price.toLocaleString()}</span>
            )}
          </div>

          {/* Low Stock Indicator */}
          {isLowStock && (
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-pulse" />
              <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">
                Only {stockCount} left
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
