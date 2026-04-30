'use client'

import { useAppSelector, useAppDispatch } from '@/store/hooks'
import { removeFromCompare, clearCompare } from '@/store/slices/compareSlice'
import { X, ArrowLeft, ShoppingBag } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

export default function ComparePage() {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { items } = useAppSelector((state) => state.compare)

  if (items.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
        <div className="w-20 h-20 bg-neutral-50 flex items-center justify-center rounded-none mb-8">
          <ShoppingBag className="w-8 h-8 text-neutral-300" strokeWidth={1} />
        </div>
        <h1 className="font-display text-4xl mb-4 tracking-tight">Your Comparison is Empty</h1>
        <p className="text-neutral-500 text-sm max-w-xs mb-10 leading-relaxed uppercase tracking-widest">
          Add up to 3 pieces to compare details and find your perfect fit.
        </p>
        <Link href="/products">
          <Button className="h-14 px-12 bg-black text-white hover:bg-neutral-900 uppercase tracking-[0.2em] text-[11px] font-bold">
            Explore Products
          </Button>
        </Link>
      </div>
    )
  }

  const features = [
    { key: 'price', label: 'Price' },
    { key: 'category', label: 'Category' },
    { key: 'sku', label: 'SKU' },
    { key: 'description', label: 'Description' },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-16 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
        <div>
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-neutral-400 hover:text-black transition-colors mb-4 group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span className="text-[10px] uppercase tracking-[0.2em] font-bold">Back</span>
          </button>
          <h1 className="font-display text-4xl md:text-6xl tracking-tighter">Compare Collection</h1>
        </div>
        <button
          onClick={() => dispatch(clearCompare())}
          className="text-[10px] uppercase tracking-[0.2em] font-bold text-neutral-400 hover:text-black transition-colors"
        >
          Clear All
        </button>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-hidden border-t border-neutral-100">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="w-1/4 py-10 pr-8 text-left align-bottom border-b border-neutral-100">
                <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-400 font-bold mb-2">Specs</p>
                <p className="text-sm font-medium">Detailed Overview</p>
              </th>
              {items.map((item) => (
                <th key={item.id} className="w-1/4 p-8 border-b border-neutral-100 align-top relative group">
                  <button
                    onClick={() => dispatch(removeFromCompare(item.id))}
                    className="absolute top-4 right-4 text-neutral-300 hover:text-black transition-colors p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="aspect-[4/5] relative mb-6 bg-neutral-50 overflow-hidden">
                    <Image src={item.imageUrl} alt={item.name} fill className="object-cover transition-transform duration-700 group-hover:scale-105" unoptimized />
                  </div>
                  <h3 className="font-display text-xl mb-2 leading-tight">{item.name}</h3>
                  <Link href={`/products/${item.slug}`}>
                    <Button variant="outline" className="w-full h-10 border-neutral-200 hover:border-black uppercase text-[9px] tracking-widest font-bold">
                      View Piece
                    </Button>
                  </Link>
                </th>
              ))}
              {items.length < 3 && Array(3 - items.length).fill(0).map((_, i) => (
                <th key={`empty-${i}`} className="w-1/4 p-8 border-b border-neutral-100 align-top">
                  <div className="aspect-[4/5] bg-neutral-50/50 border border-dashed border-neutral-200 flex flex-col items-center justify-center gap-4">
                     <PlusIcon className="w-6 h-6 text-neutral-300" />
                     <p className="text-[9px] uppercase tracking-widest text-neutral-400 font-bold">Slot Available</p>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {features.map((feature) => (
              <tr key={feature.key} className="group hover:bg-neutral-50/30 transition-colors">
                <td className="py-8 pr-8 border-b border-neutral-100">
                  <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-neutral-400">{feature.label}</span>
                </td>
                {items.map((item) => (
                  <td key={item.id} className="p-8 border-b border-neutral-100 text-sm leading-relaxed">
                    {feature.key === 'price' ? (
                      <span className="font-bold">PKR {item.price.toLocaleString()}</span>
                    ) : (
                      <span className="text-neutral-600">{(item as any)[feature.key] || '—'}</span>
                    )}
                  </td>
                ))}
                {items.length < 3 && Array(3 - items.length).fill(0).map((_, i) => (
                  <td key={`empty-td-${i}`} className="p-8 border-b border-neutral-100" />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Stacked View (No Horizontal Scroll) */}
      <div className="md:hidden space-y-12">
        {/* Mobile Header: Product Images */}
        <div className="grid grid-cols-3 gap-2 pb-6 border-b border-neutral-100">
          {items.map((item) => (
            <div key={item.id} className="relative text-center group">
              <button
                onClick={() => dispatch(removeFromCompare(item.id))}
                className="absolute -top-1 -right-1 bg-black text-white p-1 z-10"
              >
                <X className="w-3 h-3" />
              </button>
              <div className="aspect-[3/4] relative mb-2 bg-neutral-50">
                <Image src={item.imageUrl} alt={item.name} fill className="object-cover" unoptimized />
              </div>
              <p className="text-[9px] font-bold leading-tight line-clamp-1 uppercase tracking-tighter">{item.name}</p>
            </div>
          ))}
        </div>

        {/* Feature Comparison */}
        <div className="space-y-10">
          {features.map((feature) => (
            <div key={feature.key} className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-px flex-1 bg-neutral-100" />
                <h4 className="text-[10px] uppercase tracking-[0.3em] font-bold text-neutral-400 shrink-0">{feature.label}</h4>
                <div className="h-px flex-1 bg-neutral-100" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                {items.map((item) => (
                  <div key={item.id} className="text-center">
                    {feature.key === 'price' ? (
                      <p className="text-xs font-bold">PKR {item.price.toLocaleString()}</p>
                    ) : (
                      <p className="text-[11px] text-neutral-500 leading-normal">{(item as any)[feature.key] || '—'}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <Link href="/products" className="block pt-8">
           <Button variant="outline" className="w-full h-14 border-neutral-200 uppercase tracking-widest text-[10px] font-bold">
             Keep Shopping
           </Button>
        </Link>
      </div>
    </div>
  )
}

function PlusIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v12M5 12h12" />
    </svg>
  )
}
