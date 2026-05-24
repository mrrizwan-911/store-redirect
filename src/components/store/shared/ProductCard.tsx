'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Heart, Plus, Star, Scale } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { addItem, openCart } from '@/store/slices/cartSlice'
import { addToCompare, removeFromCompare } from '@/store/slices/compareSlice'
import { useWishlist } from '@/hooks/useWishlist'
import { cn } from '@/lib/utils'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'

interface ProductCardProps {
  id: string
  name: string
  slug: string
  imageUrl: string
  secondaryImageUrl?: string
  price: number
  salePrice?: number
  flashSalePrice?: number
  flashSaleEndTime?: string
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

import { useFlashSaleTimer } from '@/hooks/useFlashSaleTimer'
import { formatPrice } from '@/lib/utils/currency'

export function ProductCard({
  id,
  name,
  slug,
  imageUrl,
  secondaryImageUrl,
  price,
  salePrice,
  flashSalePrice,
  flashSaleEndTime,
  category,
  sku,
  description,
  avgRating,
  reviewCount,
  isBadgeNew,
  isBadgeSale,
  isLowStock,
  stockCount,
}: ProductCardProps) {
  const router   = useRouter()
  const dispatch = useAppDispatch()
  const { items: compareItems } = useAppSelector((state) => state.compare)
  const isInCompare = compareItems.some((item) => item.id === id)

  const { isInWishlist, toggle: handleWishlistToggle } = useWishlist(id)
  const [mounted, setMounted]   = useState(false)
  const isWishlisted            = mounted && isInWishlist
  const [isHovered, setIsHovered] = useState(false)

  const { hours, minutes, seconds, isExpired } = useFlashSaleTimer(flashSaleEndTime)
  const hasActiveFlashSale = !!flashSalePrice && !!flashSaleEndTime && !isExpired

  const pad = (num: number) => num.toString().padStart(2, '0')

  useEffect(() => { setMounted(true) }, [])

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    router.push(`/products/${slug}`)
  }

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault()
    handleWishlistToggle()
  }

  const handleCompare = (e: React.MouseEvent) => {
    e.preventDefault()
    if (isInCompare) {
      dispatch(removeFromCompare(id))
      toast.success('Removed from comparison')
    } else {
      if (compareItems.length >= 3) {
        toast.error('You can only compare up to 3 items')
        return
      }
      dispatch(addToCompare({
        id, name, slug, price, salePrice, imageUrl, category, sku, description, avgRating, reviewCount,
      }))
      toast.success('Added to comparison')
    }
  }

  return (
    /* min-w-0 prevents this card from blowing out flex containers (e.g. carousel) */
    <div
      className="group relative bg-card rounded-[var(--radius)] border border-border transition-colors duration-300 hover:border-black/25 overflow-hidden min-w-0"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container */}
      <div className="relative aspect-[4/5] overflow-hidden bg-surface rounded-t-[var(--radius)]">
        <Link href={`/products/${slug}`} className="block h-full w-full relative">
          <Image
            src={(isHovered && secondaryImageUrl) ? secondaryImageUrl : (imageUrl || '/placeholder.png')}
            alt={name}
            fill
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
          {(isBadgeSale || hasActiveFlashSale) && (
            <span className="bg-[#E05252] text-white text-[9px] font-bold uppercase tracking-widest px-2 py-1">
              {hasActiveFlashSale ? 'Flash Sale' : 'Sale'}
            </span>
          )}
        </div>

        {/* Flash Sale Countdown Overlay */}
        {hasActiveFlashSale && (
          <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm text-white py-2 px-3 flex items-center justify-between z-10 transition-transform duration-500 group-hover:translate-y-full">
            <span className="text-[10px] uppercase tracking-widest font-bold text-[#E8D5B0]">Ends in</span>
            <div className="flex items-center gap-1.5 font-mono text-xs font-bold">
              <span>{pad(hours)}</span>
              <span className="opacity-50">:</span>
              <span>{pad(minutes)}</span>
              <span className="opacity-50">:</span>
              <span>{pad(seconds)}</span>
            </div>
          </div>
        )}

        {/* Minimal Actions (hover/focus) */}
        <div className="absolute top-3 right-3 flex flex-col items-end gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-300">
          <button
            onClick={handleWishlist}
            className={cn(
              'h-10 w-10 sm:h-8 sm:w-auto sm:px-2.5 inline-flex items-center justify-center sm:gap-2 bg-white/95 text-neutral-700 border border-border uppercase tracking-[0.18em] text-[9px] font-bold hover:border-black/30 hover:text-black transition-colors rounded-[var(--radius)] shadow-sm sm:shadow-none',
              isWishlisted && 'border-black text-black',
            )}
            aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <Heart className={cn('w-4 h-4 sm:w-3.5 sm:h-3.5', isWishlisted && 'fill-current')} />
            <span className="hidden sm:inline">Save</span>
          </button>

          <button
            onClick={handleCompare}
            className={cn(
              'h-10 w-10 sm:h-8 sm:w-auto sm:px-2.5 inline-flex items-center justify-center sm:gap-2 bg-white/95 text-neutral-700 border border-border uppercase tracking-[0.18em] text-[9px] font-bold hover:border-black/30 hover:text-black transition-colors rounded-[var(--radius)] shadow-sm sm:shadow-none',
              isInCompare && 'border-black text-black',
            )}
            aria-label={isInCompare ? 'Remove from comparison' : 'Add to comparison'}
          >
            <Scale className={cn('w-4 h-4 sm:w-3.5 sm:h-3.5', isInCompare && 'fill-current')} />
            <span className="hidden sm:inline">Compare</span>
          </button>

          <button
            onClick={handleAddToCart}
            className="h-10 w-10 sm:h-8 sm:w-auto sm:px-2.5 inline-flex items-center justify-center sm:gap-2 bg-white/95 text-neutral-700 border border-border uppercase tracking-[0.18em] text-[9px] font-bold hover:border-black/30 hover:text-black transition-colors rounded-[var(--radius)] shadow-sm sm:shadow-none"
            aria-label="View Details"
          >
            <Plus className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
            <span className="hidden sm:inline">View</span>
          </button>
        </div>

        {/* Quick Add Button */}
        <button
          onClick={handleAddToCart}
          className="absolute bottom-0 left-0 right-0 bg-white text-black py-3.5 text-[10px] font-bold uppercase tracking-[0.18em] transition-transform duration-500 translate-y-full group-hover:translate-y-0 border-t border-border hover:bg-black hover:text-white z-20"
        >
          View Details
        </button>
      </div>

      {/* Product Details */}
      <div className="pt-4 pb-4 px-4 flex flex-col gap-1.5">
        <div className="flex justify-between items-center">
          <span className="text-[10px] uppercase tracking-[0.2em] text-neutral-400 font-medium truncate mr-2">
            {category}
          </span>
          {avgRating && (
            <div className="flex items-center gap-1 shrink-0">
              <Star className="w-2.5 h-2.5 fill-neutral-400 text-neutral-400" />
              <span className="text-[10px] font-bold text-black">{avgRating}</span>
            </div>
          )}
        </div>

        <Link href={`/products/${slug}`} className="block min-w-0">
          <h3 className="font-display text-lg md:text-xl font-medium tracking-tight group-hover:text-neutral-600 transition-colors truncate">
            {name}
          </h3>
        </Link>

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {hasActiveFlashSale ? (
              <>
                <span className="text-sm font-bold text-black font-sans whitespace-nowrap">{formatPrice(flashSalePrice)}</span>
                <span className="text-xs text-neutral-400 line-through font-sans whitespace-nowrap">{formatPrice(price)}</span>
              </>
            ) : salePrice ? (
              <>
                <span className="text-sm font-bold text-black font-sans whitespace-nowrap">{formatPrice(salePrice)}</span>
                <span className="text-xs text-neutral-400 line-through font-sans whitespace-nowrap">{formatPrice(price)}</span>
              </>
            ) : (
              <span className="text-sm font-bold text-black font-sans whitespace-nowrap">{formatPrice(price)}</span>
            )}
          </div>

          {isLowStock && (
            <div className="flex items-center gap-1.5 shrink-0">
              <div className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-pulse" />
              <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider whitespace-nowrap">
                Only {stockCount} left
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
