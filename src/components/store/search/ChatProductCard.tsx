'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'

interface ChatProductCardProps {
  id: string
  slug: string
  name: string
  price: number
  imageUrl: string
}

/**
 * Compact inline product card — rendered inside AI chat bubbles.
 *
 * SearchPageClient parses [PRODUCT:id:slug:encodedName:price:encodedImageUrl]
 * tags out of the streaming AI response and replaces each one with this card.
 *
 * Design decisions:
 * - Horizontal layout: thumbnail left, text right — fits inside a bubble
 * - max-w-[280px] so it never overflows narrow chat bubbles on mobile
 * - Entire card is a Next.js <Link> — no visible URL, clean UX
 * - Arrow icon only appears on hover to keep it minimal
 * - No wishlist / compare / flash-sale — those belong on the full ProductCard
 */
export function ChatProductCard({ id, slug, name, price, imageUrl }: ChatProductCardProps) {
  return (
    <Link
      href={`/products/${slug}`}
      className="
        flex items-center gap-3 mt-3 mb-1 p-2.5 no-underline w-full
        bg-white border border-neutral-200 rounded-xl
        hover:border-neutral-400 hover:shadow-sm
        transition-all duration-200 group
        max-w-[280px]
      "
    >
      {/* Thumbnail */}
      <div className="relative w-12 h-14 flex-shrink-0 overflow-hidden rounded-lg bg-neutral-100 border border-neutral-100">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={name}
            fill
            sizes="48px"
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full bg-neutral-200" />
        )}
      </div>

      {/* Name + price */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-black leading-tight line-clamp-2 mb-0.5">
          {name}
        </p>
        <p className="text-xs font-bold text-black">
          PKR {price.toLocaleString()}
        </p>
      </div>

      {/* Arrow — visible on hover only */}
      <div
        className="
          flex-shrink-0 w-6 h-6 rounded-full bg-black text-white
          flex items-center justify-center
          opacity-0 group-hover:opacity-100 transition-opacity duration-200
        "
        aria-hidden="true"
      >
        <ArrowRight className="w-3 h-3" />
      </div>
    </Link>
  )
}
