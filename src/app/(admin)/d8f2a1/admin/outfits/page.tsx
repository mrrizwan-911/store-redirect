'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Plus, Edit, Trash, CheckCircle2, XCircle, Loader2 } from 'lucide-react'

export default function AdminOutfitsPage() {
  const [outfits, setOutfits] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOutfits()
  }, [])

  const fetchOutfits = async () => {
    try {
      const res = await fetch('/api/admin/outfits')
      const json = await res.json()
      if (json.success) {
        setOutfits(json.data)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this outfit?')) return
    try {
      const res = await fetch(`/api/admin/outfits/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setOutfits(outfits.filter(o => o.id !== id))
      }
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-sans">
      <div className="flex justify-between items-center border-b border-neutral-100 pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Outfits / Lookbook</h1>
        <Link
          href="/admin/outfits/new"
          className="bg-neutral-900 text-white px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-neutral-800 transition-all flex items-center gap-2 shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          Create New Look
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {outfits.map(outfit => (
            <div key={outfit.id} className="bg-white border border-neutral-100 rounded-xl overflow-hidden shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col group hover:border-neutral-200 transition-all">
              <div className="relative aspect-[4/5] bg-neutral-50">
                {outfit.imageUrl ? (
                  <Image
                    src={outfit.imageUrl}
                    alt={outfit.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-neutral-300 text-xs">
                    No Image
                  </div>
                )}
                <div className="absolute top-3 right-3">
                  {outfit.isPublished ? (
                    <span className="bg-emerald-500 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-full flex items-center gap-1 shadow-sm">
                      <CheckCircle2 className="w-2.5 h-2.5" /> Published
                    </span>
                  ) : (
                    <span className="bg-neutral-400 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-full flex items-center gap-1 shadow-sm">
                      <XCircle className="w-2.5 h-2.5" /> Draft
                    </span>
                  )}
                </div>
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <h3 className="text-sm font-semibold tracking-tight text-neutral-900 truncate">{outfit.title}</h3>
                <p className="text-[10px] uppercase font-bold tracking-widest text-neutral-400 mt-1">{outfit.items.length} items</p>
                <div className="mt-4 flex gap-2 pt-4 border-t border-neutral-50 mt-auto">
                  <Link
                    href={`/admin/outfits/${outfit.id}/edit`}
                    className="flex-1 text-center border border-neutral-200 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-md hover:bg-neutral-50 transition-colors"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(outfit.id)}
                    className="px-3 border border-neutral-200 text-rose-500 hover:bg-rose-50 hover:border-rose-100 rounded-md transition-colors"
                  >
                    <Trash className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {outfits.length === 0 && (
            <div className="col-span-full text-center py-12 text-[#737373]">
              No outfits created yet.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
