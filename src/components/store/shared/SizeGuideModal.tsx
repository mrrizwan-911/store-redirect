'use client'

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Ruler, Info, Loader2 } from 'lucide-react'

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

const CLOTHING_SIZES = [
  { size: 'XS', chest: '32-34', waist: '26-28', hip: '34-36' },
  { size: 'S', chest: '35-37', waist: '29-31', hip: '37-39' },
  { size: 'M', chest: '38-40', waist: '32-34', hip: '40-42' },
  { size: 'L', chest: '41-43', waist: '35-37', hip: '43-45' },
  { size: 'XL', chest: '44-46', waist: '38-40', hip: '46-48' },
  { size: 'XXL', chest: '47-49', waist: '41-43', hip: '49-51' },
]

const SHOE_SIZES = [
  { uk: '6', eu: '40', us: '7', cm: '25.4' },
  { uk: '7', eu: '41', us: '8', cm: '26.2' },
  { uk: '8', eu: '42', us: '9', cm: '27.1' },
  { uk: '9', eu: '43', us: '10', cm: '27.9' },
  { uk: '10', eu: '44', us: '11', cm: '28.8' },
  { uk: '11', eu: '45', us: '12', cm: '29.6' },
]

export function SizeGuideModal({ categoryId, categorySlug, categoryName = 'clothes', trigger }: SizeGuideModalProps) {
  const [dbGuide, setDbGuide] = useState<DBSizeGuide | null>(null)
  const [loading, setLoading] = useState(false)
  const defaultTab = categoryName.toLowerCase().includes('shoe') ? 'shoes' : 'clothes'

  useEffect(() => {
    const fetchGuide = async () => {
      if (!categoryId && !categoryName) return
      setLoading(true)
      try {
        const query = categoryId ? `categoryId=${categoryId}` : `title=${encodeURIComponent(categoryName)}`
        const res = await fetch(`/api/size-guides?${query}`)
        const data = await res.json()
        if (data.success) {
          setDbGuide(data.data)
        }
      } catch (error) {
        console.error('Failed to fetch size guide:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchGuide()
  }, [categoryId, categoryName])

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <button className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-neutral-400 hover:text-black transition-colors underline underline-offset-4 decoration-neutral-200">
            <Ruler className="w-3 h-3" />
            Size Guide
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl bg-white border-none rounded-none p-0 overflow-hidden shadow-2xl">
        <DialogHeader className="p-8 pb-4 bg-neutral-50 border-b border-neutral-100">
          <DialogTitle className="font-display text-3xl tracking-tight uppercase flex items-center gap-3">
            {dbGuide?.title || 'Size Guide'}
            {loading && <Loader2 className="w-4 h-4 animate-spin text-neutral-300" />}
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
            <Tabs defaultValue={defaultTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-neutral-100 p-1 rounded-none h-12 mb-8">
              <TabsTrigger
                value="clothes"
                className="rounded-none text-[10px] uppercase tracking-widest font-black data-[state=active]:bg-white data-[state=active]:shadow-none data-[state=active]:text-black"
              >
                Apparel & Tops
              </TabsTrigger>
              <TabsTrigger
                value="shoes"
                className="rounded-none text-[10px] uppercase tracking-widest font-black data-[state=active]:bg-white data-[state=active]:shadow-none data-[state=active]:text-black"
              >
                Footwear
              </TabsTrigger>
            </TabsList>

            <TabsContent value="clothes" className="animate-in fade-in slide-in-from-bottom-2 duration-500 mt-0">
              <div className="border border-neutral-100 rounded-none overflow-hidden">
                <Table>
                  <TableHeader className="bg-neutral-50">
                    <TableRow className="hover:bg-transparent border-neutral-100">
                      <TableHead className="text-[10px] uppercase font-bold text-black py-4">Size</TableHead>
                      <TableHead className="text-[10px] uppercase font-bold text-black py-4 text-center">Chest (in)</TableHead>
                      <TableHead className="text-[10px] uppercase font-bold text-black py-4 text-center">Waist (in)</TableHead>
                      <TableHead className="text-[10px] uppercase font-bold text-black py-4 text-center">Hip (in)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {CLOTHING_SIZES.map((row) => (
                      <TableRow key={row.size} className="hover:bg-neutral-50/50 border-neutral-100 transition-colors">
                        <TableCell className="font-bold text-xs py-4">{row.size}</TableCell>
                        <TableCell className="text-center text-xs text-neutral-600 py-4">{row.chest}</TableCell>
                        <TableCell className="text-center text-xs text-neutral-600 py-4">{row.waist}</TableCell>
                        <TableCell className="text-center text-xs text-neutral-600 py-4">{row.hip}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="mt-8 flex items-start gap-4 p-4 bg-neutral-50 border border-neutral-100">
                <Info className="w-4 h-4 text-neutral-400 mt-0.5 shrink-0" />
                <div className="space-y-2">
                  <p className="text-[10px] uppercase tracking-widest font-bold text-black">How to measure</p>
                  <p className="text-xs text-neutral-500 leading-relaxed">
                    For the most accurate results, measure yourself in your undergarments. Keep the tape firm, but not tight.
                    If you&apos;re between sizes, we recommend ordering the larger size for a more comfortable fit.
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="shoes" className="animate-in fade-in slide-in-from-bottom-2 duration-500 mt-0">
              <div className="border border-neutral-100 rounded-none overflow-hidden">
                <Table>
                  <TableHeader className="bg-neutral-50">
                    <TableRow className="hover:bg-transparent border-neutral-100">
                      <TableHead className="text-[10px] uppercase font-bold text-black py-4">UK / PAK</TableHead>
                      <TableHead className="text-[10px] uppercase font-bold text-black py-4 text-center">EU</TableHead>
                      <TableHead className="text-[10px] uppercase font-bold text-black py-4 text-center">US</TableHead>
                      <TableHead className="text-[10px] uppercase font-bold text-black py-4 text-center">Length (cm)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {SHOE_SIZES.map((row) => (
                      <TableRow key={row.uk} className="hover:bg-neutral-50/50 border-neutral-100 transition-colors">
                        <TableCell className="font-bold text-xs py-4">{row.uk}</TableCell>
                        <TableCell className="text-center text-xs text-neutral-600 py-4">{row.eu}</TableCell>
                        <TableCell className="text-center text-xs text-neutral-600 py-4">{row.us}</TableCell>
                        <TableCell className="text-center text-xs text-neutral-600 py-4">{row.cm}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="mt-8 flex items-start gap-4 p-4 bg-neutral-50 border border-neutral-100">
                <Info className="w-4 h-4 text-neutral-400 mt-0.5 shrink-0" />
                <div className="space-y-2">
                  <p className="text-[10px] uppercase tracking-widest font-bold text-black">Footwear fit</p>
                  <p className="text-xs text-neutral-500 leading-relaxed">
                    Stand on a level floor with your heels against a straight edge or wall. Measure your foot length by placing a ruler flat on the floor alongside the inside of your foot from your heel to your toes.
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
          )}
        </div>

        <div className="p-8 pt-0 flex justify-end">
           <p className="text-[9px] uppercase tracking-[0.3em] text-neutral-300 font-bold">
             STORE LUXURY E-COMMERCE © 2026
           </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
