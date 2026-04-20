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
      image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&q=80&w=1200',
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
      mobileBg: 'bg-[#C5A059]', // Darker/Richer Gold for better contrast
    },
  ]

  return (
    <section className="py-20 px-4 md:px-6 max-w-7xl mx-auto">
      {/* Mobile Layout (One per row, rectangular/pill shape) */}
      <div className="flex flex-col gap-4 md:hidden">
        {categories.map((cat) => (
          <Link
            key={cat.slug}
            href={`/categories/${cat.slug}`}
            className={cn(
              "group relative h-24 flex items-center justify-between px-8 rounded-full overflow-hidden transition-all duration-500 active:scale-95 shadow-lg",
              "hover:brightness-110 hover:shadow-xl hover:-translate-y-1",
              cat.mobileBg
            )}
          >
            <h3 className="font-display text-2xl text-white font-medium relative z-10 transition-all duration-300 group-hover:scale-105 group-hover:translate-x-2">
              {cat.name}
            </h3>
            <div className="bg-white/20 p-2 rounded-full relative z-10 transition-all duration-500 group-hover:bg-white/40 group-hover:scale-110 group-hover:-translate-x-2">
              <ArrowRight className="text-white size-6 transition-transform duration-300 group-hover:rotate-[-45deg]" />
            </div>

            {/* Subtle gradient overlay for depth */}
            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent pointer-events-none group-hover:opacity-0 transition-opacity duration-500" />

            {/* Shine effect animation */}
            <div className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-[-25deg] -translate-x-[200%] group-hover:translate-x-[200%] transition-transform duration-1000 ease-in-out" />
          </Link>
        ))}
      </div>

      {/* Desktop Layout (Original Grid) */}
      <div className="hidden md:grid grid-cols-12 gap-6 h-[630px]">
        {categories.map((cat) => (
          <Link
            key={cat.slug}
            href={`/categories/${cat.slug}`}
            className={cn(
              "group relative overflow-hidden bg-neutral-100 border border-border rounded-none",
              cat.gridClass
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
                "absolute inset-0 transition-all duration-500",
                cat.overlayClass
              )}
            />

            {/* Content */}
            <div className={cn(
              "absolute inset-0 flex flex-col p-6 md:p-12",
              cat.contentClass
            )}>
              <h3
                className={cn(
                  "font-display text-white font-medium drop-shadow-2xl transition-transform duration-700",
                  cat.textClass
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
