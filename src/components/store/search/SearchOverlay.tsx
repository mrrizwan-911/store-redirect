'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Search, Camera, Upload, LoaderCircle, ArrowRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ProductCard } from '../shared/ProductCard'
import { cn } from '@/lib/utils'

interface SearchOverlayProps {
  isOpen: boolean
  onClose: () => void
}

export function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<{ products: any[], categories: any[], intentFeedback?: string | null }>({
    products: [],
    categories: [],
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isVisualSearch, setIsVisualSearch] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'auto'
      setQuery('')
      setResults({ products: [], categories: [] })
    }
  }, [isOpen])

  // Instant Search Logic
  useEffect(() => {
    if (query.length < 2) {
      setResults({ products: [], categories: [] })
      return
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
        const result = await response.json()
        if (result.success) {
          setResults(result.data)
        }
      } catch (error) {
        console.error('Search failed:', error)
      } finally {
        setIsLoading(false)
      }
    }, 300)

    return () => clearTimeout(delayDebounceFn)
  }, [query])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!query) return
    router.push(`/search?q=${encodeURIComponent(query)}`)
    onClose()
  }

  const handleFileUpload = async (file: File) => {
    setIsLoading(true)
    setIsVisualSearch(true)

    // Convert to base64
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = async () => {
      const base64 = (reader.result as string).split(',')[1]
      try {
        const response = await fetch('/api/ai/visual-search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64 })
        })
        const result = await response.json()
        if (result.success) {
          setResults({ products: result.data.products, categories: [] })
          setQuery(`Style: ${result.data.analysis.detected || 'Visual Match'}`)
        }
      } catch (err) {
        console.error('Visual search failed:', err)
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0])
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-white flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-8 py-6 border-b border-neutral-100">
            <span className="font-display text-xl font-bold tracking-tighter uppercase">Search</span>
            <button
              onClick={onClose}
              className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-8 py-12">
            <div className="max-w-5xl mx-auto space-y-12">

              {/* Search Input Area */}
              <div className="relative group">
                <form onSubmit={handleSearchSubmit}>
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="Search for clothes, shoes, or inspiration..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full text-4xl md:text-6xl font-display italic bg-transparent border-none focus:ring-0 placeholder:text-neutral-100 py-4 pr-16"
                  />
                  <button
                    type="submit"
                    className="absolute right-0 top-1/2 -translate-y-1/2 text-neutral-300 group-hover:text-black transition-colors"
                  >
                    {isLoading ? <LoaderCircle className="w-10 h-10 animate-spin" /> : <Search className="w-10 h-10" />}
                  </button>
                </form>
                <div className="h-px w-full bg-neutral-200" />
              </div>

              {/* Visual Search Trigger & Drag Zone */}
              {!query && (
                <div
                  className={cn(
                    "border-2 border-dashed transition-all duration-500 py-16 flex flex-col items-center justify-center gap-4 rounded-none",
                    dragActive ? "border-black bg-neutral-50 scale-[1.01]" : "border-neutral-100 bg-white"
                  )}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <div className="w-16 h-16 bg-neutral-50 flex items-center justify-center rounded-none border border-neutral-100">
                    <Camera className="w-8 h-8 text-neutral-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold uppercase tracking-widest">Visual Search</p>
                    <p className="text-xs text-neutral-400 mt-1 uppercase tracking-widest">Drag an image or click to upload</p>
                  </div>
                  <label className="cursor-pointer bg-black text-white px-8 py-3 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-neutral-800 transition-colors mt-2">
                    Upload Photo
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                    />
                  </label>
                </div>
              )}

              {/* AI Intent Feedback */}
              {results.intentFeedback && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-[11px] uppercase tracking-[0.2em] text-neutral-400 font-bold border-l-2 border-black pl-4"
                >
                  {results.intentFeedback}
                </motion.p>
              )}

              {/* Results Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-x-8 gap-y-12">
                {/* Categories Column */}
                {results.categories.length > 0 && (
                  <div className="md:col-span-1 space-y-6">
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-400 border-b border-neutral-100 pb-2">Categories</h3>
                    <div className="flex flex-col gap-4">
                      {results.categories.map(cat => (
                        <Link
                          key={cat.id}
                          href={`/categories/${cat.slug}`}
                          onClick={onClose}
                          className="group flex items-center justify-between text-sm font-bold uppercase tracking-widest hover:translate-x-2 transition-transform"
                        >
                          {cat.name}
                          <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Products Grid */}
                <div className={cn(
                  "grid gap-x-6 gap-y-12",
                  results.categories.length > 0 ? "md:col-span-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "md:col-span-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
                )}>
                  {results.products.map(product => (
                    <div key={product.id} onClick={onClose}>
                      <ProductCard
                        id={product.id}
                        name={product.name}
                        slug={product.slug}
                        price={Number(product.basePrice)}
                        salePrice={product.salePrice ? Number(product.salePrice) : undefined}
                        category={product.category.name}
                        imageUrl={product.images[0]?.url || '/placeholder.png'}
                        sku={product.sku}
                        description={product.description}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Empty State */}
              {query.length >= 2 && !isLoading && results.products.length === 0 && (
                <div className="text-center py-20">
                  <p className="font-display text-2xl italic text-neutral-300">No matches found for &quot;{query}&quot;</p>
                  <button
                    onClick={() => setQuery('')}
                    className="mt-4 text-[10px] font-bold uppercase tracking-widest underline underline-offset-4"
                  >
                    Clear Search
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
