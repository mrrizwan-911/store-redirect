'use client'

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Ruler, Info, LoaderCircle } from 'lucide-react'

interface SizeGuideModalProps {
  categoryId?: string
  categorySlug?: string
  categoryName?: string
  trigger?: React.ReactNode
}

interface DBSizeGuide {
  id: string
  title: string
  content: string
}

export function SizeGuideModal({ categoryId, categorySlug, categoryName = 'clothes', trigger }: SizeGuideModalProps) {
  const [dbGuide, setDbGuide] = useState<DBSizeGuide | null>(null)
  const [loading, setLoading] = useState(true)
  const [guideFound, setGuideFound] = useState(false)

  useEffect(() => {
    const fetchGuide = async () => {
      if (!categoryId && !categoryName) {
        setLoading(false)
        return
      }
      setLoading(true)
      try {
        const query = categoryId ? `categoryId=${categoryId}` : `title=${encodeURIComponent(categoryName)}`
        const res = await fetch(`/api/size-guides?${query}`)

        if (res.status === 404) {
          setDbGuide(null)
          setGuideFound(false)
          return
        }

        if (!res.ok) throw new Error('Failed to load size guide')

        const data = await res.json()
        if (data.success && data.data) {
          setDbGuide(data.data)
          setGuideFound(true)
        } else {
          setDbGuide(null)
          setGuideFound(false)
        }
      } catch (error) {
        console.error('Failed to fetch size guide:', error)
        setGuideFound(false)
      } finally {
        setLoading(false)
      }
    }

    fetchGuide()
  }, [categoryId, categoryName])

  if (loading || !guideFound) return null

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <div role="button" tabIndex={0} className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-neutral-400 hover:text-black transition-colors underline underline-offset-4 decoration-neutral-200 cursor-pointer">
            <Ruler className="w-3 h-3" />
            Size Guide
          </div>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl bg-white border-none rounded-none p-0 overflow-hidden shadow-2xl">
        <DialogHeader className="p-8 pb-4 bg-neutral-50 border-b border-neutral-100">
          <DialogTitle className="font-display text-3xl tracking-tight uppercase flex items-center gap-3">
            {dbGuide?.title || 'Size Guide'}
            {loading && <LoaderCircle className="w-4 h-4 animate-spin text-neutral-300" />}
          </DialogTitle>
          <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-400 font-bold mt-1">
            Find your perfect fit with our detailed measurement chart
          </p>
        </DialogHeader>

        <div className="p-8 max-h-[70vh] overflow-y-auto">
          {dbGuide ? (
            <div className="prose prose-neutral max-w-none">
              <div className="whitespace-pre-wrap text-sm leading-relaxed text-neutral-600 font-sans">
                {dbGuide.content}
              </div>
              <div className="mt-8 pt-8 border-t border-neutral-100 flex items-start gap-4 p-4 bg-neutral-50 border border-neutral-100">
                <Info className="w-4 h-4 text-neutral-400 mt-0.5 shrink-0" />
                <div className="space-y-2">
                  <p className="text-[10px] uppercase tracking-widest font-bold text-black">Note</p>
                  <p className="text-xs text-neutral-500 leading-relaxed">
                    Measurements are provided as a general guide. Actual fit may vary slightly depending on the style and fabric.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center animate-in fade-in duration-500">
              <div className="w-16 h-16 bg-neutral-50 flex items-center justify-center mb-4">
                <Ruler className="w-6 h-6 text-neutral-300" />
              </div>
              <p className="text-sm text-neutral-600 max-w-[240px] leading-relaxed font-sans">
                No size guide available for this category yet. Contact us for sizing assistance.
              </p>
            </div>
          )}
        </div>

        <div className="p-8 pt-0 flex justify-end">
           <p className="text-[9px] uppercase tracking-[0.3em] text-neutral-300 font-bold">
             CALNZA LUXURY E-COMMERCE © 2026
           </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
