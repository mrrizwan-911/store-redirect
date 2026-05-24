'use client'

import { useState, useEffect, useMemo, Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Plus, Edit, Trash2, CircleCheck, CircleX, LoaderCircle, LayoutGrid, Eye, EyeOff } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { CountryFilterToggle } from '@/components/admin/orders/CountryFilterToggle'

function OutfitsContent() {
  const [outfits, setOutfits] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'all' | 'published' | 'draft'>('all')
  const [deleting, setDeleting] = useState<string | null>(null)

  const searchParams = useSearchParams()
  const country = searchParams.get('country') || ''

  useEffect(() => {
    fetchOutfits()
  }, [country])

  const fetchOutfits = async () => {
    try {
      const res = await fetch(`/api/admin/outfits?country=${country}`)
      const json = await res.json()
      if (json.success) setOutfits(json.data)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this outfit? This cannot be undone.')) return
    setDeleting(id)
    try {
      const res = await fetch(`/api/admin/outfits/${id}`, { method: 'DELETE' })
      if (res.ok) setOutfits(prev => prev.filter(o => o.id !== id))
    } catch (error) {
      console.error(error)
    } finally {
      setDeleting(null)
    }
  }

  const publishedCount = outfits.filter(o => o.isPublished).length
  const draftCount = outfits.filter(o => !o.isPublished).length

  const filtered = useMemo(() => {
    if (tab === 'published') return outfits.filter(o => o.isPublished)
    if (tab === 'draft') return outfits.filter(o => !o.isPublished)
    return outfits
  }, [outfits, tab])

  const tabs = [
    { key: 'all', label: 'All', count: outfits.length },
    { key: 'published', label: 'Published', count: publishedCount },
    { key: 'draft', label: 'Draft', count: draftCount },
  ]

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Lookbook</h1>
          <p className="text-xs text-neutral-400 mt-1 uppercase tracking-widest">
            Curated outfit collections
          </p>
        </div>
        <Link
          href="/d8f2a1/admin/outfits/new"
          className="inline-flex items-center gap-2 bg-neutral-900 text-white px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest hover:bg-neutral-800 transition-all shadow-sm rounded-none self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          Create New Look
        </Link>
      </div>

      <CountryFilterToggle currentCountry={country} resourceName="Outfits" />

      {/* Stats */}
      {!loading && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Looks', value: outfits.length, icon: <LayoutGrid className="w-4 h-4" /> },
            { label: 'Published', value: publishedCount, icon: <Eye className="w-4 h-4 text-emerald-500" /> },
            { label: 'Drafts', value: draftCount, icon: <EyeOff className="w-4 h-4 text-neutral-400" /> },
          ].map(stat => (
            <div key={stat.label} className="bg-white border border-neutral-100 p-4 rounded-xl flex items-center gap-3 shadow-[0_1px_6px_rgba(0,0,0,0.03)]">
              <div className="w-8 h-8 bg-neutral-50 rounded-lg flex items-center justify-center flex-shrink-0 text-neutral-400">
                {stat.icon}
              </div>
              <div>
                <p className="text-lg font-bold text-neutral-900 leading-none">{stat.value}</p>
                <p className="text-[9px] uppercase tracking-widest text-neutral-400 mt-0.5">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      {!loading && (
        <div className="flex gap-0 border-b border-neutral-100">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as any)}
              className={`px-4 py-3 text-[10px] font-bold uppercase tracking-[0.2em] border-b-2 transition-all ${
                tab === t.key
                  ? 'border-black text-black'
                  : 'border-transparent text-neutral-400 hover:text-neutral-600'
              }`}
            >
              {t.label}
              <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[8px] font-bold ${
                tab === t.key ? 'bg-black text-white' : 'bg-neutral-100 text-neutral-400'
              }`}>
                {t.count}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <LoaderCircle className="w-6 h-6 animate-spin text-neutral-300" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-14 h-14 bg-neutral-50 rounded-full flex items-center justify-center mb-4">
            <LayoutGrid className="w-6 h-6 text-neutral-300" />
          </div>
          <p className="text-sm text-neutral-400 uppercase tracking-widest">No outfits found</p>
          {tab !== 'all' && (
            <button onClick={() => setTab('all')} className="mt-3 text-xs text-neutral-400 underline underline-offset-2">
              Clear filter
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map(outfit => (
            <div
              key={outfit.id}
              className="bg-white border border-neutral-100 rounded-xl overflow-hidden flex flex-col group hover:border-neutral-200 hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)] transition-all duration-300"
            >
              {/* Image */}
              <div className="relative aspect-[3/4] bg-neutral-50">
                {outfit.imageUrl ? (
                  <Image
                    src={outfit.imageUrl}
                    alt={outfit.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-neutral-200 gap-2">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-[9px] uppercase tracking-widest">No Image</span>
                  </div>
                )}

                {/* Status badge */}
                <div className="absolute top-3 right-3">
                  {outfit.isPublished ? (
                    <span className="bg-emerald-500 text-white text-[8px] font-bold uppercase tracking-wider px-2 py-1 rounded-full flex items-center gap-1 shadow-sm">
                      <CircleCheck className="w-2.5 h-2.5" /> Live
                    </span>
                  ) : (
                    <span className="bg-neutral-500 text-white text-[8px] font-bold uppercase tracking-wider px-2 py-1 rounded-full flex items-center gap-1 shadow-sm">
                      <CircleX className="w-2.5 h-2.5" /> Draft
                    </span>
                  )}
                </div>

                {/* Item count badge */}
                <div className="absolute bottom-3 left-3">
                  <span className="bg-black/70 backdrop-blur-sm text-white text-[8px] font-bold uppercase tracking-wider px-2 py-1 rounded-full">
                    {outfit.items.length} items
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="p-4 flex-1 flex flex-col">
                <h3 className="text-sm font-semibold tracking-tight text-neutral-900 truncate leading-snug">
                  {outfit.title}
                </h3>

                {/* Tags row */}
                <div className="flex flex-wrap gap-1 mt-2">
                  {outfit.gender && (
                    <span className="text-[8px] uppercase tracking-widest bg-neutral-50 text-neutral-400 px-1.5 py-0.5 rounded font-bold">
                      {outfit.gender}
                    </span>
                  )}
                  {outfit.season && (
                    <span className="text-[8px] uppercase tracking-widest bg-neutral-50 text-neutral-400 px-1.5 py-0.5 rounded font-bold">
                      {outfit.season}
                    </span>
                  )}
                  {outfit.occasion && (
                    <span className="text-[8px] uppercase tracking-widest bg-neutral-50 text-neutral-400 px-1.5 py-0.5 rounded font-bold">
                      {outfit.occasion}
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="mt-4 pt-3 border-t border-neutral-50 flex gap-2 mt-auto">
                  <Link
                    href={`/d8f2a1/admin/outfits/${outfit.id}/edit`}
                    className="flex-1 text-center border border-neutral-200 py-2 text-[9px] font-bold uppercase tracking-widest rounded-lg hover:bg-neutral-50 hover:border-neutral-300 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Edit className="w-3 h-3" />
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(outfit.id)}
                    disabled={deleting === outfit.id}
                    className="px-3 border border-neutral-200 text-rose-400 hover:bg-rose-50 hover:border-rose-200 rounded-lg transition-colors disabled:opacity-50"
                    title="Delete outfit"
                  >
                    {deleting === outfit.id ? (
                      <LoaderCircle className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function AdminOutfitsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <LoaderCircle className="w-6 h-6 animate-spin text-neutral-300" />
      </div>
    }>
      <OutfitsContent />
    </Suspense>
  )
}
