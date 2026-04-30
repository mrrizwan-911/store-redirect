'use client'

import { useAppSelector, useAppDispatch } from '@/store/hooks'
import { removeFromCompare, clearCompare } from '@/store/slices/compareSlice'
import { X, Scale, ArrowRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { usePathname } from 'next/navigation'

export function ComparisonBar() {
  const dispatch = useAppDispatch()
  const pathname = usePathname()
  const { items } = useAppSelector((state) => state.compare)

  // Don't show on the actual comparison page or if empty
  if (items.length === 0 || pathname === '/compare') return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 animate-in slide-in-from-bottom duration-500">
      <div className="bg-black text-white border-t border-neutral-800 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-6 overflow-x-auto scrollbar-hide py-1">
              <div className="flex flex-col shrink-0">
                <div className="flex items-center gap-2 mb-1">
                  <Scale className="w-3.5 h-3.5 text-[#E8D5B0]" />
                  <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-neutral-400">Compare</span>
                </div>
                <p className="text-[11px] font-bold tracking-tight">{items.length} / 3 Items</p>
              </div>

              <div className="h-10 w-px bg-neutral-800 shrink-0 hidden sm:block" />

              <div className="flex items-center gap-3">
                {items.map((item) => (
                  <div key={item.id} className="relative group shrink-0">
                    <div className="w-12 h-14 bg-neutral-900 border border-neutral-800 relative overflow-hidden">
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                    <button
                      onClick={() => dispatch(removeFromCompare(item.id))}
                      className="absolute -top-1.5 -right-1.5 bg-white text-black rounded-none p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ))}

                {Array(3 - items.length).fill(0).map((_, i) => (
                   <div key={`empty-${i}`} className="w-12 h-14 border border-dashed border-neutral-800 flex items-center justify-center shrink-0">
                      <span className="text-[8px] text-neutral-600 font-bold uppercase tracking-tighter">Empty</span>
                   </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => dispatch(clearCompare())}
                className="hidden md:block text-[9px] uppercase tracking-widest font-bold text-neutral-500 hover:text-white transition-colors"
              >
                Clear
              </button>
              <Link href="/compare">
                <Button className="h-12 px-6 bg-[#E8D5B0] text-black hover:bg-white uppercase tracking-[0.18em] text-[10px] font-bold flex items-center gap-2">
                  Compare Now
                  <ArrowRight className="w-3 h-3" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}