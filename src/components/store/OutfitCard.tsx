"use client"

import Link from 'next/link'
import Image from 'next/image'
import { formatPrice } from '@/lib/constants/site'

interface OutfitCardProps {
  outfit: {
    id: string
    title: string
    imageUrl?: string | null
    season?: string | null
    occasion?: string | null
    gender?: string | null
    itemCount: number
    totalPrice: number
  }
  featured?: boolean
}

export function OutfitCard({ outfit, featured = false }: OutfitCardProps) {
  return (
    <Link
      href={`/lookbook/${outfit.id}`}
      className={`group block relative bg-white overflow-hidden outfit-card ${featured ? 'sm:col-span-2 lg:col-span-1 lg:row-span-2' : ''}`}
    >
      {/* Image container */}
      <div
        className={`relative w-full overflow-hidden bg-neutral-100 ${
          featured ? 'aspect-[3/4] sm:aspect-[16/9] lg:aspect-[3/4]' : 'aspect-[3/4]'
        }`}
      >
        {outfit.imageUrl ? (
          <Image
            src={outfit.imageUrl}
            alt={outfit.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-10 h-10 text-neutral-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Hover CTA */}
        <div className="absolute inset-0 flex items-end justify-center pb-8 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-2 group-hover:translate-y-0">
          <span className="bg-white text-black px-8 py-3 text-[10px] font-bold uppercase tracking-[0.3em] shadow-xl">
            View Look
          </span>
        </div>

        {/* Tags on image (top-left) */}
        {(outfit.season || outfit.occasion) && (
          <div className="absolute top-3 left-3 flex gap-1.5">
            {outfit.season && (
              <span className="bg-white/90 backdrop-blur-sm text-neutral-700 text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-sm">
                {outfit.season}
              </span>
            )}
            {outfit.occasion && (
              <span className="bg-white/90 backdrop-blur-sm text-neutral-700 text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-sm">
                {outfit.occasion}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Card footer */}
      <div className="px-1 pt-4 pb-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-playfair text-base font-bold text-neutral-900 truncate leading-tight">
              {outfit.title}
            </h3>
            <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-400 mt-1">
              {outfit.itemCount} {outfit.itemCount === 1 ? 'piece' : 'pieces'}
              {outfit.gender ? ` · ${outfit.gender}` : ''}
            </p>
          </div>
          <div className="flex-shrink-0 text-right">
            <p className="text-sm font-semibold text-neutral-900 tabular-nums">
              {formatPrice(outfit.totalPrice)}
            </p>
            <p className="text-[9px] uppercase tracking-widest text-neutral-300 mt-0.5">
              Complete look
            </p>
          </div>
        </div>

        {/* Bottom border line — animates on hover */}
        <div className="mt-4 h-px bg-neutral-100 relative overflow-hidden">
          <div className="absolute inset-y-0 left-0 w-0 bg-black group-hover:w-full transition-all duration-500 ease-out" />
        </div>
      </div>

      <style jsx>{`
        .outfit-card {
          transition: box-shadow 0.3s ease;
        }
        .outfit-card:hover {
          box-shadow: 0 8px 40px -8px rgba(0, 0, 0, 0.15);
        }
      `}</style>
    </Link>
  )
}
