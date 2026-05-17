'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { SimpleImageUploader } from '../products/SimpleImageUploader'
import { X, CircleCheck, Plus, LoaderCircle, ChevronDown, Search, GripVertical, ArrowUp, ArrowDown } from 'lucide-react'
import { toast } from 'sonner'

// ─── Types ────────────────────────────────────────────────────────────────────
interface FilterOptions {
  seasons: string[]
  occasions: string[]
  genders: string[]
}

interface DynamicSelectProps {
  label: string
  value: string
  onChange: (v: string) => void
  options: string[]
  onAddOption: (v: string) => Promise<void>
  placeholder?: string
}

// ─── DynamicSelect ─────────────────────────────────────────────────────────
function DynamicSelect({ label, value, onChange, options, onAddOption, placeholder }: DynamicSelectProps) {
  const [open, setOpen] = useState(false)
  const [adding, setAdding] = useState(false)
  const [newValue, setNewValue] = useState('')
  const [saving, setSaving] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setAdding(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleAdd = async () => {
    const trimmed = newValue.trim()
    if (!trimmed) return
    setSaving(true)
    try {
      await onAddOption(trimmed)
      onChange(trimmed)
      setNewValue('')
      setAdding(false)
      setOpen(false)
    } catch {
      toast.error('Failed to add option')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="relative" ref={ref}>
      <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400 mb-1.5">
        {label}
      </label>
      <button
        type="button"
        onClick={() => { setOpen(!open); setAdding(false) }}
        className="w-full flex items-center justify-between border border-neutral-200 px-3 py-2.5 bg-white text-sm hover:border-neutral-400 transition-colors focus:outline-none focus:border-black"
      >
        <span className={value ? 'text-neutral-900' : 'text-neutral-400'}>
          {value || placeholder || `Select ${label}`}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-neutral-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-neutral-200 shadow-xl max-h-60 overflow-y-auto">
          {options.map(opt => (
            <button
              key={opt}
              type="button"
              onClick={() => { onChange(opt); setOpen(false) }}
              className={`w-full text-left px-3 py-2.5 text-sm hover:bg-neutral-50 transition-colors flex items-center justify-between ${
                value === opt ? 'bg-neutral-50 font-semibold' : ''
              }`}
            >
              {opt}
              {value === opt && <CircleCheck className="w-3.5 h-3.5 text-black" />}
            </button>
          ))}

          <div className="border-t border-neutral-100 mt-1">
            {!adding ? (
              <button
                type="button"
                onClick={() => setAdding(true)}
                className="w-full text-left px-3 py-2.5 text-[10px] uppercase tracking-widest font-bold text-neutral-400 hover:text-black hover:bg-neutral-50 transition-colors flex items-center gap-2"
              >
                <Plus className="w-3 h-3" />
                Add new {label.toLowerCase()}
              </button>
            ) : (
              <div className="p-2 flex gap-2">
                <input
                  autoFocus
                  type="text"
                  value={newValue}
                  onChange={e => setNewValue(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAdd() } if (e.key === 'Escape') setAdding(false) }}
                  placeholder={`New ${label.toLowerCase()}...`}
                  className="flex-1 border border-neutral-200 px-2 py-1.5 text-xs focus:outline-none focus:border-black min-w-0"
                />
                <button
                  type="button"
                  onClick={handleAdd}
                  disabled={saving || !newValue.trim()}
                  className="px-3 bg-black text-white text-xs font-bold uppercase tracking-widest hover:bg-neutral-800 disabled:opacity-40 transition-colors flex items-center gap-1"
                >
                  {saving ? <LoaderCircle className="w-3 h-3 animate-spin" /> : 'Add'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── OutfitBuilder ─────────────────────────────────────────────────────────
export function OutfitBuilder({ initialData }: { initialData?: any }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    seasons: ['All Season', 'Summer', 'Winter'],
    occasions: ['Casual', 'Formal', 'Festive'],
    genders: ['Men', 'Women', 'Unisex'],
  })
  const [filtersLoading, setFiltersLoading] = useState(true)

  const [title, setTitle] = useState(initialData?.title || '')
  const [description, setDescription] = useState(initialData?.description || '')
  const [imageUrl, setImageUrl] = useState(initialData?.imageUrl || '')
  const [season, setSeason] = useState(initialData?.season || '')
  const [occasion, setOccasion] = useState(initialData?.occasion || '')
  const [gender, setGender] = useState(initialData?.gender || '')
  const [isPublished, setIsPublished] = useState(initialData?.isPublished ?? false)

  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searchLoading, setSearchLoading] = useState(false)

  const initialProducts = initialData?.items?.map((item: any) => item.product) || []
  const [selectedProducts, setSelectedProducts] = useState<any[]>(initialProducts)

  // Load dynamic filter options
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/admin/lookbook-filters')
        const data = await res.json()
        if (data.success && data.data) {
          setFilterOptions(data.data)
          // Set defaults if not editing
          if (!initialData) {
            if (!season && data.data.seasons?.[0]) setSeason(data.data.seasons[0])
            if (!occasion && data.data.occasions?.[0]) setOccasion(data.data.occasions[0])
            if (!gender && data.data.genders?.[0]) setGender(data.data.genders[0])
          }
        }
      } catch {}
      finally { setFiltersLoading(false) }
    }
    load()
  }, [])

  // Product search
  useEffect(() => {
    if (!search || search.length < 2) { setSearchResults([]); return }
    setSearchLoading(true)
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/products?search=${encodeURIComponent(search)}&limit=8`)
        const data = await res.json()
        if (data.success) setSearchResults(data.data.products)
      } catch {}
      finally { setSearchLoading(false) }
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const handleSelectProduct = (product: any) => {
    if (selectedProducts.find(p => p.id === product.id)) {
      setSelectedProducts(prev => prev.filter(p => p.id !== product.id))
      return
    }
    if (selectedProducts.length >= 5) {
      toast.error('Maximum 5 products per outfit.')
      return
    }
    setSelectedProducts(prev => [...prev, product])
  }

  const moveProduct = (index: number, dir: 'up' | 'down') => {
    const next = [...selectedProducts]
    const swap = dir === 'up' ? index - 1 : index + 1
    if (swap < 0 || swap >= next.length) return;
    [next[index], next[swap]] = [next[swap], next[index]]
    setSelectedProducts(next)
  }

  const addFilterOption = async (field: 'seasons' | 'occasions' | 'genders', value: string) => {
    const updated = { ...filterOptions, [field]: [...filterOptions[field], value] }
    const res = await fetch('/api/admin/lookbook-filters', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    })
    const data = await res.json()
    if (!data.success) throw new Error('Save failed')
    setFilterOptions(updated)
    toast.success(`Added "${value}" to ${field}`)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (selectedProducts.length < 2) {
      setError('You must select at least 2 products.')
      setLoading(false)
      return
    }

    try {
      const payload = {
        title,
        description,
        imageUrl,
        season,
        occasion,
        gender,
        isPublished,
        productIds: selectedProducts.map(p => p.id),
      }

      const url = initialData ? `/api/admin/outfits/${initialData.id}` : '/api/admin/outfits'
      const method = initialData ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to save')

      toast.success(initialData ? 'Outfit updated!' : 'Outfit created!')
      router.push('/d8f2a1/admin/outfits')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-6">

      {/* ── Left: Details ───────────────────────────────────────── */}
      <div className="space-y-5 bg-white border border-neutral-100 rounded-xl p-6 shadow-[0_1px_8px_rgba(0,0,0,0.03)]">
        <div className="border-b border-neutral-100 pb-4">
          <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-neutral-700">Outfit Details</h2>
          <p className="text-[10px] text-neutral-400 mt-0.5">Title, description, tags, and hero image</p>
        </div>

        {/* Title */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400 mb-1.5">
            Title <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Summer Casual Look"
            className="w-full border border-neutral-200 px-3 py-2.5 text-sm focus:outline-none focus:border-black transition-colors"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400 mb-1.5">
            Description
          </label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Describe the vibe, styling tips, occasion..."
            className="w-full border border-neutral-200 px-3 py-2.5 text-sm focus:outline-none focus:border-black transition-colors min-h-[90px] resize-none"
          />
        </div>

        {/* Dropdowns */}
        {filtersLoading ? (
          <div className="flex gap-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex-1 h-16 bg-neutral-50 border border-neutral-100 rounded animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <DynamicSelect
              label="Season"
              value={season}
              onChange={setSeason}
              options={filterOptions.seasons}
              onAddOption={v => addFilterOption('seasons', v)}
            />
            <DynamicSelect
              label="Occasion"
              value={occasion}
              onChange={setOccasion}
              options={filterOptions.occasions}
              onAddOption={v => addFilterOption('occasions', v)}
            />
            <DynamicSelect
              label="Gender"
              value={gender}
              onChange={setGender}
              options={filterOptions.genders}
              onAddOption={v => addFilterOption('genders', v)}
            />
          </div>
        )}

        {/* Hero Image */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400 mb-1.5">
            Hero Image
          </label>
          <SimpleImageUploader imageUrl={imageUrl} onUploadSuccess={setImageUrl} />
        </div>

        {/* Publish toggle */}
        <div className="flex items-center justify-between border border-neutral-100 px-4 py-3 bg-neutral-50/50 rounded-lg">
          <div>
            <p className="text-xs font-semibold text-neutral-700">Publish this outfit</p>
            <p className="text-[10px] text-neutral-400">Make it visible on the lookbook</p>
          </div>
          <button
            type="button"
            onClick={() => setIsPublished(!isPublished)}
            className={`relative inline-flex h-5 w-9 rounded-full transition-colors focus:outline-none ${
              isPublished ? 'bg-black' : 'bg-neutral-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform mt-0.5 ${
                isPublished ? 'translate-x-4.5' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-600 rounded-lg">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black text-white py-3.5 text-[10px] font-bold uppercase tracking-[0.3em] hover:bg-neutral-800 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loading ? (
            <><LoaderCircle className="w-3.5 h-3.5 animate-spin" /> Saving...</>
          ) : (
            initialData ? 'Update Outfit' : 'Create Outfit'
          )}
        </button>
      </div>

      {/* ── Right: Products ──────────────────────────────────────── */}
      <div className="space-y-5 bg-white border border-neutral-100 rounded-xl p-6 shadow-[0_1px_8px_rgba(0,0,0,0.03)]">
        <div className="border-b border-neutral-100 pb-4">
          <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-neutral-700">Select Products</h2>
          <p className="text-[10px] text-neutral-400 mt-0.5">Choose 2–5 products to include in this look</p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
          <input
            type="text"
            placeholder="Search products by name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full border border-neutral-200 pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-black transition-colors"
          />
          {searchLoading && (
            <LoaderCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400 animate-spin" />
          )}
        </div>

        {/* Search results */}
        {searchResults.length > 0 && (
          <div className="border border-neutral-100 rounded-lg overflow-hidden max-h-[260px] overflow-y-auto">
            {searchResults.map(product => {
              const isSelected = !!selectedProducts.find(p => p.id === product.id)
              return (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => handleSelectProduct(product)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors border-b border-neutral-50 last:border-0 ${
                    isSelected ? 'bg-emerald-50' : 'hover:bg-neutral-50'
                  }`}
                >
                  <div className="relative w-9 h-11 bg-neutral-100 flex-shrink-0 overflow-hidden rounded">
                    {product.images?.[0]?.url && (
                      <Image src={product.images[0].url} alt="" fill className="object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-neutral-900 truncate">{product.name}</p>
                    <p className="text-[10px] text-neutral-400 tabular-nums">PKR {Number(product.basePrice).toLocaleString()}</p>
                  </div>
                  {isSelected ? (
                    <CircleCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  ) : (
                    <Plus className="w-4 h-4 text-neutral-300 flex-shrink-0" />
                  )}
                </button>
              )
            })}
          </div>
        )}

        {/* Selected products */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">
              Selected
            </p>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              selectedProducts.length >= 2 ? 'bg-emerald-100 text-emerald-700' : 'bg-neutral-100 text-neutral-400'
            }`}>
              {selectedProducts.length} / 5
            </span>
          </div>

          {selectedProducts.length === 0 ? (
            <div className="border-2 border-dashed border-neutral-100 rounded-lg py-10 text-center">
              <p className="text-xs text-neutral-300 uppercase tracking-widest">No products selected</p>
              <p className="text-[10px] text-neutral-200 mt-1">Search above to add products</p>
            </div>
          ) : (
            <div className="space-y-2">
              {selectedProducts.map((product, index) => (
                <div
                  key={product.id}
                  className="flex items-center gap-3 border border-neutral-100 p-2.5 bg-white rounded-lg hover:border-neutral-200 transition-colors"
                >
                  {/* Reorder */}
                  <div className="flex flex-col gap-0.5 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => moveProduct(index, 'up')}
                      disabled={index === 0}
                      className="p-0.5 text-neutral-300 hover:text-black disabled:opacity-20 transition-colors"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveProduct(index, 'down')}
                      disabled={index === selectedProducts.length - 1}
                      className="p-0.5 text-neutral-300 hover:text-black disabled:opacity-20 transition-colors"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Rank */}
                  <span className="text-[9px] font-bold text-neutral-300 w-3 flex-shrink-0 tabular-nums">
                    {index + 1}
                  </span>

                  {/* Image */}
                  <div className="relative w-10 h-12 bg-neutral-100 flex-shrink-0 overflow-hidden rounded">
                    {(product.images?.[0]?.url || product.imageUrl) && (
                      <Image
                        src={product.images?.[0]?.url || product.imageUrl}
                        alt=""
                        fill
                        className="object-cover"
                      />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-neutral-900 truncate">{product.name}</p>
                    <p className="text-[10px] text-neutral-400 tabular-nums">
                      PKR {Number(product.basePrice).toLocaleString()}
                    </p>
                  </div>

                  {/* Remove */}
                  <button
                    type="button"
                    onClick={() => handleSelectProduct(product)}
                    className="p-1.5 text-neutral-300 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors flex-shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Hint */}
        {selectedProducts.length < 2 && selectedProducts.length > 0 && (
          <p className="text-[10px] text-amber-500 bg-amber-50 border border-amber-100 px-3 py-2 rounded-lg">
            ⚠ Add at least {2 - selectedProducts.length} more product{2 - selectedProducts.length > 1 ? 's' : ''} to save
          </p>
        )}
      </div>
    </form>
  )
}
