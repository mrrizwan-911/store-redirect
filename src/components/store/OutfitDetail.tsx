'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useDispatch } from 'react-redux'
import { addItem, openCart } from '@/store/slices/cartSlice'
import { MessageCircle, Share2, Link as LinkIcon, ShoppingBag, Check, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface OutfitDetailProps {
  outfit: any
}

export function OutfitDetail({ outfit }: OutfitDetailProps) {
  const dispatch = useDispatch()
  const router = useRouter()
  const [addedAll, setAddedAll] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [addedItems, setAddedItems] = useState<Set<string>>(new Set())

  // Safe price extractor — prevents the PKR 0 bug
  // Prisma Decimal objects must be converted via Number() BEFORE being stored in Redux
  const getSafePrice = (product: any): number => {
    // By the time it reaches here from [id]/page.tsx, these are already JS numbers
    // but we do a double-safe conversion just in case
    const salePrice = product.salePrice != null ? Number(product.salePrice) : null
    const basePrice = Number(product.basePrice)
    const resolved = (salePrice && salePrice > 0) ? salePrice : basePrice
    // Extra safety: if still 0 or NaN, return basePrice
    return (resolved && resolved > 0 && !isNaN(resolved)) ? resolved : basePrice
  }

  const handleAddAllToCart = () => {
    outfit.items.forEach((item: any) => {
      const product = item.product
      const price = getSafePrice(product)
      dispatch(
        addItem({
          productId: product.id,
          variantId: undefined,
          variantTitle: undefined,
          name: product.name,
          price,
          quantity: 1,
          stock: 999,
          imageUrl: product.images?.[0]?.url ?? '',
        })
      )
    })
    setAddedAll(true)
    setTimeout(() => setAddedAll(false), 2500)
    dispatch(openCart())
  }

  const handleAddSingleToCart = (product: any) => {
    const price = getSafePrice(product)
    dispatch(
      addItem({
        productId: product.id,
        variantId: undefined,
        variantTitle: undefined,
        name: product.name,
        price,
        quantity: 1,
        stock: 999,
        imageUrl: product.images?.[0]?.url ?? '',
      })
    )
    setAddedItems(prev => new Set(prev).add(product.id))
    setTimeout(() => {
      setAddedItems(prev => {
        const next = new Set(prev)
        next.delete(product.id)
        return next
      })
    }, 2000)
    dispatch(openCart())
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href).catch(() => {})
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Back nav */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-neutral-400 hover:text-black transition-colors text-xs uppercase tracking-widest font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Lookbook
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-16">

          {/* Left: Hero Image */}
          <div className="w-full lg:w-[55%] flex-shrink-0">
            <div className="relative w-full aspect-[3/4] bg-neutral-100 overflow-hidden">
              {outfit.imageUrl ? (
                <Image
                  src={outfit.imageUrl}
                  alt={outfit.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 55vw"
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-neutral-300">
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-xs uppercase tracking-widest">No Image</span>
                </div>
              )}
            </div>
          </div>

          {/* Right: Details */}
          <div className="w-full lg:flex-1 flex flex-col">

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-5">
              {outfit.gender && (
                <span className="text-[9px] uppercase tracking-[0.25em] font-bold text-neutral-400 border border-neutral-200 px-3 py-1.5 rounded-full">
                  {outfit.gender}
                </span>
              )}
              {outfit.season && (
                <span className="text-[9px] uppercase tracking-[0.25em] font-bold text-neutral-400 border border-neutral-200 px-3 py-1.5 rounded-full">
                  {outfit.season}
                </span>
              )}
              {outfit.occasion && (
                <span className="text-[9px] uppercase tracking-[0.25em] font-bold text-neutral-400 border border-neutral-200 px-3 py-1.5 rounded-full">
                  {outfit.occasion}
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-4xl font-playfair font-bold text-neutral-900 leading-tight mb-4">
              {outfit.title}
            </h1>

            {/* Description */}
            {outfit.description && (
              <p className="text-neutral-500 text-sm leading-relaxed mb-6 border-b border-neutral-100 pb-6">
                {outfit.description}
              </p>
            )}

            {/* Items list */}
            <div className="mb-8">
              <p className="text-[9px] uppercase tracking-[0.3em] font-bold text-neutral-300 mb-4">
                {outfit.itemCount} {outfit.itemCount === 1 ? 'Item' : 'Items'} in this Look
              </p>

              <div className="space-y-3">
                {outfit.items.map((item: any) => {
                  const product = item.product
                  const price = getSafePrice(product)
                  const hasDiscount =
                    product.salePrice != null &&
                    Number(product.salePrice) > 0 &&
                    Number(product.salePrice) < Number(product.basePrice)

                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 p-3 border border-neutral-100 hover:border-neutral-300 transition-colors bg-white group/item"
                    >
                      {/* Product image */}
                      <Link
                        href={`/products/${product.slug}`}
                        className="relative w-16 h-20 flex-shrink-0 bg-neutral-50 overflow-hidden"
                      >
                        {product.images?.[0]?.url ? (
                          <Image
                            src={product.images[0].url}
                            alt={product.name}
                            fill
                            sizes="64px"
                            className="object-cover group-hover/item:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="absolute inset-0 bg-neutral-100" />
                        )}
                      </Link>

                      {/* Product info */}
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/products/${product.slug}`}
                          className="text-sm font-medium text-neutral-900 hover:underline underline-offset-2 line-clamp-2 leading-tight"
                        >
                          {product.name}
                        </Link>
                        <div className="flex items-center gap-2 mt-1">
                          {hasDiscount ? (
                            <>
                              <span className="text-xs text-neutral-400 line-through tabular-nums">
                                PKR {Number(product.basePrice).toLocaleString()}
                              </span>
                              <span className="text-xs font-semibold text-neutral-900 tabular-nums">
                                PKR {price.toLocaleString()}
                              </span>
                            </>
                          ) : (
                            <span className="text-xs text-neutral-600 tabular-nums">
                              PKR {price.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Add single item */}
                      <button
                        onClick={() => handleAddSingleToCart(product)}
                        className={`flex-shrink-0 p-2 rounded-full border transition-all duration-200 ${
                          addedItems.has(product.id)
                            ? 'bg-black border-black text-white'
                            : 'border-neutral-200 text-neutral-400 hover:border-black hover:text-black'
                        }`}
                        title="Add to cart"
                      >
                        {addedItems.has(product.id) ? (
                          <Check className="w-3.5 h-3.5" />
                        ) : (
                          <ShoppingBag className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Total & CTA */}
            <div className="mt-auto">
              <div className="flex items-end justify-between mb-5 pb-5 border-b border-neutral-100">
                <div>
                  <p className="text-[9px] uppercase tracking-[0.3em] text-neutral-400 font-bold mb-1">
                    Complete Look
                  </p>
                  <p className="text-2xl font-playfair font-bold text-neutral-900 tabular-nums">
                    PKR {outfit.totalPrice.toLocaleString()}
                  </p>
                </div>
                <p className="text-[10px] text-neutral-400">
                  {outfit.itemCount} items included
                </p>
              </div>

              <button
                onClick={handleAddAllToCart}
                className={`w-full py-4 font-bold text-[11px] uppercase tracking-[0.3em] transition-all duration-300 flex items-center justify-center gap-3 ${
                  addedAll
                    ? 'bg-neutral-900 text-white'
                    : 'bg-black text-white hover:bg-neutral-800 active:scale-[0.99]'
                }`}
              >
                {addedAll ? (
                  <>
                    <Check className="w-4 h-4" />
                    Added to Cart
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4" />
                    Add Full Look to Cart
                  </>
                )}
              </button>

              {/* Share */}
              <div className="flex items-center justify-center gap-6 mt-6 text-neutral-300">
                <span className="text-[9px] uppercase tracking-[0.3em] font-bold">Share</span>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(outfit.title + ' — ' + (typeof window !== 'undefined' ? window.location.href : ''))}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-black transition-colors"
                  title="Share on WhatsApp"
                >
                  <MessageCircle className="w-4 h-4" />
                </a>
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-black transition-colors"
                  title="Share on Facebook"
                >
                  <Share2 className="w-4 h-4" />
                </a>
                <button
                  onClick={handleCopyLink}
                  className="hover:text-black transition-colors"
                  title="Copy link"
                >
                  {copiedLink ? <Check className="w-4 h-4 text-black" /> : <LinkIcon className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
