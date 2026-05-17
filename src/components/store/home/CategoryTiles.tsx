'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

import { cn } from '@/lib/utils'

export function CategoryTiles() {
  const categories = [
    {
      name: 'Clothes',
      slug: 'clothes',
      image: '/images/clothes_category.jpg',
      gridClass: 'col-span-12 md:col-span-6 md:row-span-2',
      textClass: 'text-6xl md:text-8xl',
      showSubtitle: true,
      overlayClass: 'bg-black/10 group-hover:bg-black/20',
      contentClass: 'top-12 left-12 items-start justify-start',
      mobileBg: 'bg-neutral-900',
    },
    {
      name: 'Shoes',
      slug: 'shoes',
      image: '/images/shoes.avif',
      gridClass: 'col-span-12 md:col-span-6 md:row-span-1',
      textClass: 'text-4xl italic',
      overlayClass: 'bg-black/20 group-hover:bg-black/30',
      contentClass: 'bottom-8 right-8 items-end justify-end text-right',
      mobileBg: 'bg-slate-800',
    },
    {
      name: 'Apparel',
      slug: 'apparel',
      image: '/images/apparel.webp',
      gridClass: 'col-span-6 md:col-span-3 md:row-span-1',
      textClass: 'text-2xl',
      overlayClass: 'bg-black/20 group-hover:bg-black/30',
      contentClass: 'bottom-6 left-6 items-start justify-end',
      mobileBg: 'bg-neutral-500',
    },
    {
      name: 'Accessories',
      slug: 'accessories',
      image: '/images/accessories.webp',
      gridClass: 'col-span-6 md:col-span-3 md:row-span-1',
      textClass: 'text-2xl',
      overlayClass: 'bg-black/20 group-hover:bg-black/30',
      contentClass: 'bottom-6 left-6 items-start justify-end',
      mobileBg: 'bg-[#C5A059]',
    },
  ]

  return (
    /* overflow-hidden prevents any image from causing horizontal scroll */
    <section className="py-16 md:py-20 px-4 md:px-6 max-w-7xl mx-auto overflow-hidden">

      {/* ── Mobile Layout (one per row, clean rectangular cards) ── */}
      <div className="flex flex-col gap-3 md:hidden">
        {categories.map((cat) => (
          <Link
            key={cat.slug}
            href={`/categories/${cat.slug}`}
            className={cn(
              'group relative h-28 flex items-center justify-between px-6 sm:px-8',
              'overflow-hidden transition-all duration-500 active:scale-[0.98]',
              'border border-border bg-white hover:border-black',
            )}
          >
            <div className="relative z-10">
              <h3 className="font-display text-2xl text-black font-medium transition-all duration-300 group-hover:translate-x-2">
                {cat.name}
              </h3>
              <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-400 mt-1 transition-all duration-300 group-hover:translate-x-2">
                Shop Collection
              </p>
            </div>

            <div className="relative z-10 transition-all duration-500 group-hover:-translate-x-2">
              <ArrowRight className="text-black size-5 stroke-[1.5] transition-transform duration-300 group-hover:rotate-[-45deg]" />
            </div>

            {/* Subtle background image */}
            <div className="absolute right-0 top-0 h-full w-1/2 opacity-10 group-hover:opacity-20 transition-opacity duration-500 grayscale">
              <Image
                src={cat.image}
                alt=""
                fill
                unoptimized
                className="object-cover"
              />
            </div>
          </Link>
        ))}
      </div>

      {/* ── Desktop Layout (original grid) ── */}
      {/* h-[580px] on md prevents overflow on iPads, h-[630px] on lg for full desktop */}
      <div className="hidden md:grid grid-cols-12 gap-6 md:h-[580px] lg:h-[630px]">
        {categories.map((cat) => (
          <Link
            key={cat.slug}
            href={`/categories/${cat.slug}`}
            className={cn(
              'group relative overflow-hidden bg-neutral-100 border border-border rounded-none',
              cat.gridClass,
            )}
          >
            <Image
              src={cat.image}
              alt={cat.name}
              fill
              unoptimized
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover transition-transform duration-[1200ms] ease-in-out group-hover:scale-110"
              priority={cat.name === 'Clothes'}
            />
            {/* Overlay */}
            <div
              className={cn(
                'absolute inset-0 transition-all duration-500',
                cat.overlayClass,
              )}
            />

            {/* Content */}
            <div className={cn('absolute inset-0 flex flex-col p-6 md:p-12', cat.contentClass)}>
              <h3
                className={cn(
                  'font-display text-white font-medium drop-shadow-2xl transition-transform duration-700',
                  cat.textClass,
                )}
              >
                {cat.name}
              </h3>
              {cat.showSubtitle && (
                <p className="text-white/80 text-[10px] uppercase tracking-[0.3em] mt-4 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0">
                  Shop Collection &rarr;
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
