'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { productSchema, ProductInput } from '@/lib/validations/admin'
import { useRouter } from 'next/navigation'
import { ImageUploader } from './ImageUploader'
import { generateCombinations, generateVariantSKU } from '@/lib/utils/variants'

interface ProductFormProps {
  initialData?: ProductInput & { id: string; images?: any[] }
  categories: { id: string; name: string }[]
}

// Word count helper
function wordCount(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0
}

// Character count badge
function DescriptionStats({ text }: { text: string }) {
  const words = wordCount(text)
  const chars = text.length
  const color = words < 50 ? 'text-red-500' : words < 100 ? 'text-amber-500' : 'text-green-600'
  return (
    <span className={`text-xs ${color}`}>
      {words} words · {chars} chars
      {words < 50 && ' (too short — aim for 150+)'}
      {words >= 50 && words < 100 && ' (good — aim for 150+)'}
      {words >= 100 && ' ✓'}
    </span>
  )
}

export function ProductForm({ initialData, categories: _categories }: ProductFormProps) {
  const router = useRouter()
  const isEditing = !!initialData
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isAutoFilling, setIsAutoFilling] = useState(false)
  const [autoFillSuccess, setAutoFillSuccess] = useState(false)
  const [images, setImages] = useState<any[]>(initialData?.images || [])
  const [tagInput, setTagInput] = useState('')
  const [descriptionText, setDescriptionText] = useState(initialData?.description || '')

  // Two-step category state
  const [rootCategories, setRootCategories] = useState<{ id: string; name: string }[]>([])
  const [subcategories, setSubcategories] = useState<{ id: string; name: string }[]>([])
  const [selectedRootId, setSelectedRootId] = useState<string>('')
  const [isInitialLoad, setIsInitialLoad] = useState(true)

  const { register, control, handleSubmit, setValue, getValues, watch, formState: { errors } } = useForm<any>({
    resolver: zodResolver(productSchema) as any,
    defaultValues: initialData || {
      name: '',
      slug: '',
      description: '',
      shortDescription: '',
      categoryId: '',
      basePrice: 0,
      salePrice: null,
      pricePK: 0,
      priceUK: 0,
      salePricePK: null,
      salePriceUK: null,
      sku: '',
      baseStock: 0,
      isActive: true,
      isFeatured: false,
      tags: [],
      variantOptions: [],
      variants: [],
      regions: ['PK', 'UK'],
    },
  })

  const formCategoryId = watch('categoryId')
  const productName = watch('name')
  const currentVariants = watch('variants') || []
  const watchedTags = watch('tags') || []
  const watchedDescription = watch('description') || ''

  // Keep local description text in sync with form
  useEffect(() => {
    setDescriptionText(watchedDescription)
  }, [watchedDescription])

  // Dynamic Options State
  const [hasVariants, setHasVariants] = useState<boolean>(
    initialData ? (initialData.variantOptions?.length || 0) > 0 : false
  )
  const [localOptions, setLocalOptions] = useState<{name: string, values: string[]}[]>(
    initialData?.variantOptions || []
  )
  const [deselectedTitles, setDeselectedTitles] = useState<Set<string>>(new Set())

  const allCombos = useMemo(() => generateCombinations(localOptions), [localOptions])

  const localOptionsJson = JSON.stringify(localOptions)

  useEffect(() => {
    if (!hasVariants) {
      setValue('variantOptions', [])
      setValue('variants', [])
      return
    }

    setValue('variantOptions', localOptions)

    const combos = generateCombinations(localOptions)
    const existingVariants = getValues('variants') || []
    const nextVariants: any[] = []

    for (const combo of combos) {
      const title = Object.values(combo).join(' / ')
      if (deselectedTitles.has(title)) continue

      const existing = existingVariants.find((cv: any) => cv.title === title)
      if (existing) {
        nextVariants.push(existing)
      } else {
        nextVariants.push({
          title,
          optionValues: combo,
          sku: generateVariantSKU(productName || '', combo),
          stock: 0,
          price: null,
          pricePK: null,
          priceUK: null
        })
      }
    }

    setValue('variants', nextVariants)
  }, [localOptionsJson, productName, hasVariants, deselectedTitles, setValue])

  const addOption = () => {
    setLocalOptions([...localOptions, { name: '', values: [] }])
  }

  const removeOption = (index: number) => {
    setLocalOptions(localOptions.filter((_, i) => i !== index))
  }

  const updateOptionName = (index: number, name: string) => {
    const newOpts = [...localOptions]
    newOpts[index].name = name
    setLocalOptions(newOpts)
  }

  const addOptionValue = (index: number, value: string) => {
    const val = value.trim()
    if (!val) return
    const newOpts = [...localOptions]
    if (!newOpts[index].values.includes(val)) {
      newOpts[index].values.push(val)
      setLocalOptions(newOpts)
    }
  }

  const removeOptionValue = (optIndex: number, valIndex: number) => {
    const newOpts = [...localOptions]
    newOpts[optIndex].values.splice(valIndex, 1)
    setLocalOptions(newOpts)
  }

  // ─── Tag helpers ───
  const addTag = (raw: string) => {
    const val = raw.trim().toLowerCase().replace(/,/g, '')
    if (!val) return
    const existing: string[] = getValues('tags') || []
    if (!existing.includes(val)) {
      setValue('tags', [...existing, val])
    }
    setTagInput('')
  }

  const removeTag = (tag: string) => {
    const existing: string[] = getValues('tags') || []
    setValue('tags', existing.filter(t => t !== tag))
  }

  // ─── AI Auto-Fill from image ───
  const handleAutoFill = async () => {
    if (!images || images.length === 0) {
      setError('Please upload at least one image first to use Auto-Fill.')
      return
    }

    setIsAutoFilling(true)
    setAutoFillSuccess(false)
    setError(null)

    try {
      const currentData = getValues()
      const res = await fetch('/api/admin/ai/auto-fill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images: [images.find(img => img.isPrimary) || images[0]], currentData }),
      })

      const result = await res.json()

      if (!res.ok || !result.success) {
        throw new Error(result.error || 'Failed to auto-fill data')
      }

      const data = result.data

      // Fill empty or existing fields with the AI's generated content
      // Always overwrite with richer AI content (user can undo by editing manually)
      if (data.name) {
        if (!currentData.name) setValue('name', data.name)
      }
      if (data.shortDescription) setValue('shortDescription', data.shortDescription)
      if (data.description) {
        setValue('description', data.description)
        setDescriptionText(data.description)
      }

      // Merge tags
      if (data.tags && Array.isArray(data.tags)) {
        const existingTags: string[] = currentData.tags || []
        const mergedTags = Array.from(new Set([...existingTags, ...data.tags]))
        setValue('tags', mergedTags)
      }

      // Try to match the suggested category
      if (data.suggestedCategory) {
        const lowerSuggestion = data.suggestedCategory.toLowerCase()
        const matchedRoot = rootCategories.find(c => c.name.toLowerCase().includes(lowerSuggestion) || lowerSuggestion.includes(c.name.toLowerCase()))
        if (matchedRoot) {
          setSelectedRootId(matchedRoot.id)
        } else {
          const matchedSub = subcategories.find(c => c.name.toLowerCase().includes(lowerSuggestion) || lowerSuggestion.includes(c.name.toLowerCase()))
          if (matchedSub) {
            setValue('categoryId', matchedSub.id)
          }
        }
      }

      setAutoFillSuccess(true)
      setTimeout(() => setAutoFillSuccess(false), 4000)

    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsAutoFilling(false)
    }
  }

  // ─── AI Generate Description ───
  const handleGenerateDescription = async () => {
    const currentName = watch('name')
    const categoryId = watch('categoryId')
    const currentShortDesc = watch('shortDescription')

    // Find category name
    let categoryName = ''
    if (categoryId) {
      const root = rootCategories.find(c => c.id === categoryId)
      if (root) categoryName = root.name
      else {
        const sub = subcategories.find(c => c.id === categoryId)
        if (sub) categoryName = sub.name
      }
    }

    const currentTags = watch('tags') || []

    if (!currentName) {
      setError('Please enter a product name first')
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      const res = await fetch('/api/admin/ai/generate-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: currentName,
          category: categoryName,
          tags: currentTags,
          shortDescription: currentShortDesc,
        })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to generate description')
      }

      // Stream the response
      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let generatedText = ''

      setValue('description', '')
      setDescriptionText('')

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value)
          generatedText += chunk
          setValue('description', generatedText)
          setDescriptionText(generatedText)
        }
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsGenerating(false)
    }
  }

  // 1. Fetch roots on mount
  useEffect(() => {
    fetch('/api/categories?rootOnly=true')
      .then(r => r.json())
      .then(d => setRootCategories(d.data ?? []))
  }, [])

  // 2. Fetch subcategories when root changes
  useEffect(() => {
    if (!selectedRootId) {
      setSubcategories([])
      return
    }

    fetch(`/api/categories?parentId=${selectedRootId}`)
      .then(r => r.json())
      .then(d => {
        const subs = d.data ?? []
        setSubcategories(subs)

        if (!isInitialLoad) {
          setValue('categoryId', selectedRootId)
        }
      })
  }, [selectedRootId, setValue, isInitialLoad])

  // 3. Handle edit mode initialization
  useEffect(() => {
    if (isEditing && initialData?.categoryId && isInitialLoad) {
      const initCategory = async () => {
        try {
          const res = await fetch('/api/admin/categories')
          const data = await res.json()
          if (data.success) {
            const allCats: any[] = data.data
            let currentCat: any = null
            let parentCat: any = null

            for (const root of allCats) {
              if (root.id === initialData.categoryId) {
                currentCat = root
                break
              }
              const sub = root.children?.find((s: any) => s.id === initialData.categoryId)
              if (sub) {
                currentCat = sub
                parentCat = root
                break
              }
            }

            if (parentCat) {
              setSelectedRootId(parentCat.id)
            } else if (currentCat) {
              setSelectedRootId(currentCat.id)
            }
          }
        } catch (err) {
          console.error('Failed to initialize categories', err)
        } finally {
          setIsInitialLoad(false)
        }
      }
      initCategory()
    } else {
      setIsInitialLoad(false)
    }
  }, [isEditing, initialData?.categoryId, isInitialLoad])

  const onSubmit = async (data: any) => {
    setLoading(true)
    setError(null)

    try {
      const url = isEditing ? `/api/admin/products/${initialData.id}` : '/api/admin/products'
      const method = isEditing ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, images }),
      })

      const result = await res.json()

      if (!res.ok || !result.success) {
        throw new Error(result.error || 'Failed to save product')
      }

      if (hasVariants && !isEditing) {
        // Only go to variants-matrix on NEW product creation
        router.push(`/d8f2a1/admin/products/${result.data.id}/variants-matrix`)
      } else {
        router.push('/d8f2a1/admin/products')
      }

    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col xl:flex-row gap-6">
      {/* ─── Images sidebar — shown at top on mobile, right on desktop ─── */}
      <div className="w-full xl:w-80 xl:order-last space-y-4 shrink-0">
        <div className="bg-[#FAFAFA] border border-[#E5E5E5] p-4 sm:p-6 space-y-4">
          <h2 className="font-playfair text-xl text-[#000000]">Images</h2>
          <p className="text-xs text-neutral-500">Upload images first to unlock ✨ AI Auto-Fill</p>
          <ImageUploader
            productId={initialData?.id}
            images={images}
            onUploadSuccess={(img) => setImages((prev) => [...prev, img])}
            onRemoveImage={(id) => setImages(images.filter((img) => img.id !== id))}
            onSetPrimary={(id) => setImages(images.map((img) => ({ ...img, isPrimary: img.id === id || img.url === id })))}
          />
        </div>

        {/* AI Quick Actions panel — sticky on desktop */}
        <div className="bg-amber-50 border border-amber-200 p-4 space-y-3">
          <h3 className="text-sm font-semibold text-amber-900">✨ AI Tools</h3>
          <p className="text-xs text-amber-700">
            <strong>Auto-Fill from Image</strong> — analyzes your product photo and fills in name, descriptions, and tags all at once.
          </p>
          <button
            type="button"
            onClick={handleAutoFill}
            disabled={isAutoFilling || images.length === 0}
            className="w-full text-xs px-4 py-2.5 bg-amber-500 text-white font-semibold tracking-wide hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAutoFilling ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Analyzing Image...
              </span>
            ) : '✨ Auto-Fill from Image'}
          </button>
          {images.length === 0 && (
            <p className="text-xs text-amber-600">← Upload an image above first</p>
          )}
          {autoFillSuccess && (
            <p className="text-xs text-green-700 font-medium">✓ Fields filled! Review and adjust as needed.</p>
          )}
        </div>
      </div>

      {/* ─── Main form ─── */}
      <form onSubmit={handleSubmit(onSubmit)} className="flex-1 min-w-0 space-y-6">
        {error && (
          <div className="p-3 sm:p-4 bg-[#EF4444] text-white text-sm rounded-none">
            {error}
            <button type="button" onClick={() => setError(null)} className="ml-2 underline text-xs">Dismiss</button>
          </div>
        )}

        {/* ─── Basic Info ─── */}
        <div className="bg-[#FAFAFA] border border-[#E5E5E5] p-4 sm:p-6 space-y-4">
          <h2 className="font-playfair text-xl text-[#000000]">Basic Info</h2>

          {/* Name */}
          <div>
            <label className="block text-sm text-[#000000] mb-1">
              Product Name <span className="text-red-500">*</span>
            </label>
            <input
              {...register('name')}
              placeholder="e.g., Classic Oxford Button-Down Shirt"
              className="w-full border border-[#E5E5E5] p-2 focus:ring-1 focus:ring-black outline-none text-sm"
            />
            {errors.name?.message && <p className="text-sm text-[#EF4444] mt-1">{errors.name.message as string}</p>}
          </div>

          {/* Slug */}
          <div>
            <label className="block text-sm text-[#000000] mb-1">Slug <span className="text-xs text-neutral-400">(auto-generated if empty)</span></label>
            <input
              {...register('slug')}
              placeholder="e.g., classic-oxford-button-down-shirt"
              className="w-full border border-[#E5E5E5] p-2 focus:ring-1 focus:ring-black outline-none text-sm"
            />
          </div>

          {/* Short Description */}
          <div>
            <label className="block text-sm text-[#000000] mb-1">
              Short Description <span className="text-xs text-neutral-400">(one-liner shown in cards)</span>
            </label>
            <input
              {...register('shortDescription')}
              placeholder="e.g., A timeless everyday essential crafted for effortless style"
              className="w-full border border-[#E5E5E5] p-2 focus:ring-1 focus:ring-black outline-none text-sm"
            />
          </div>

          {/* Full Description */}
          <div>
            <div className="flex flex-wrap justify-between items-center gap-2 mb-1">
              <label className="block text-sm text-[#000000]">
                Full Description <span className="text-xs text-neutral-400">(aim for 150+ words)</span>
              </label>
              <button
                type="button"
                onClick={handleGenerateDescription}
                disabled={isGenerating || !watch('name')}
                className="text-xs px-3 py-1.5 bg-black text-white font-medium hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {isGenerating ? (
                  <span className="flex items-center gap-1.5">
                    <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Writing...
                  </span>
                ) : '✨ Generate with AI'}
              </button>
            </div>
            <textarea
              {...register('description')}
              rows={8}
              placeholder="Describe your product in detail — style, fabric, fit, occasions, and why customers will love it. The more detail, the better it converts."
              className="w-full border border-[#E5E5E5] p-2 focus:ring-1 focus:ring-black outline-none text-sm resize-y"
              onChange={(e) => {
                setDescriptionText(e.target.value)
                setValue('description', e.target.value)
              }}
            />
            <div className="flex justify-between items-center mt-1">
              <DescriptionStats text={descriptionText} />
              {!watch('name') && (
                <span className="text-xs text-neutral-400">Enter a product name to enable AI generation</span>
              )}
            </div>
            {errors.description?.message && <p className="text-sm text-[#EF4444] mt-1">{errors.description.message as string}</p>}
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm text-[#000000] mb-1">
              Tags <span className="text-xs text-neutral-400">(press Enter or comma to add)</span>
            </label>
            <div className="border border-[#E5E5E5] p-2 min-h-[42px] flex flex-wrap gap-1.5 cursor-text"
              onClick={() => document.getElementById('tag-input')?.focus()}
            >
              {watchedTags.map((tag: string) => (
                <span key={tag} className="bg-[#E5E5E5] text-[#000000] px-2 py-0.5 text-xs flex items-center gap-1">
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="text-[#737373] hover:text-red-500 leading-none ml-0.5 text-base"
                  >
                    &times;
                  </button>
                </span>
              ))}
              <input
                id="tag-input"
                type="text"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault()
                    addTag(tagInput)
                  } else if (e.key === 'Backspace' && !tagInput && watchedTags.length > 0) {
                    removeTag(watchedTags[watchedTags.length - 1])
                  }
                }}
                onBlur={() => { if (tagInput.trim()) addTag(tagInput) }}
                placeholder={watchedTags.length === 0 ? 'e.g., cotton, casual, summer, men...' : ''}
                className="flex-1 min-w-[120px] outline-none text-sm bg-transparent"
              />
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              {watchedTags.length} tags · Good tags improve search & SEO
            </p>
          </div>
        </div>

        {/* ─── Pricing & Inventory ─── */}
        <div className="bg-[#FAFAFA] border border-[#E5E5E5] p-4 sm:p-6 space-y-4">
          <h2 className="font-playfair text-xl text-[#000000]">Pricing {!hasVariants && '& Inventory'}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-4 border-b border-[#E5E5E5]">
            {/* Pakistan Store Pricing */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-[#000000] border-b border-black pb-1">PAKISTAN STOREFRONT (₨ PKR)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[#737373] mb-1 uppercase tracking-widest font-semibold">Base Price ₨ <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="₨ 0.00"
                    {...register('pricePK', { valueAsNumber: true })}
                    className="w-full border border-[#E5E5E5] p-2 focus:ring-1 focus:ring-black outline-none text-sm"
                  />
                  {errors.pricePK?.message && <p className="text-xs text-[#EF4444] mt-1">{errors.pricePK.message as string}</p>}
                </div>
                <div>
                  <label className="block text-xs text-[#737373] mb-1 uppercase tracking-widest font-semibold">Sale Price ₨</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Optional"
                    {...register('salePricePK', { setValueAs: v => v === '' || isNaN(parseFloat(v)) ? null : parseFloat(v) })}
                    className="w-full border border-[#E5E5E5] p-2 focus:ring-1 focus:ring-black outline-none text-sm"
                  />
                  {errors.salePricePK?.message && <p className="text-xs text-[#EF4444] mt-1">{errors.salePricePK.message as string}</p>}
                </div>
              </div>
            </div>

            {/* UK & Global Store Pricing */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-[#000000] border-b border-black pb-1">UK & GLOBAL STOREFRONTS (£ GBP / $ USD)</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[#737373] mb-1 uppercase tracking-widest font-semibold">Base Price £ <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="£ 0.00"
                    {...register('priceUK', { valueAsNumber: true })}
                    className="w-full border border-[#E5E5E5] p-2 focus:ring-1 focus:ring-black outline-none text-sm"
                  />
                  {errors.priceUK?.message && <p className="text-xs text-[#EF4444] mt-1">{errors.priceUK.message as string}</p>}
                </div>
                <div>
                  <label className="block text-xs text-[#737373] mb-1 uppercase tracking-widest font-semibold">Sale Price £</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Optional"
                    {...register('salePriceUK', { setValueAs: v => v === '' || isNaN(parseFloat(v)) ? null : parseFloat(v) })}
                    className="w-full border border-[#E5E5E5] p-2 focus:ring-1 focus:ring-black outline-none text-sm"
                  />
                  {errors.salePriceUK?.message && <p className="text-xs text-[#EF4444] mt-1">{errors.salePriceUK.message as string}</p>}
                </div>
              </div>
            </div>
          </div>

          {!hasVariants && (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 pt-2">
              <div>
                <label className="block text-xs text-[#737373] mb-1 uppercase tracking-widest font-bold">Base Stock</label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  {...register('baseStock', { valueAsNumber: true })}
                  className="w-full border border-[#E5E5E5] p-2 focus:ring-1 focus:ring-black outline-none text-sm"
                />
                {errors.baseStock?.message && <p className="text-xs text-[#EF4444] mt-1">{errors.baseStock.message as string}</p>}
              </div>
              <div>
                <label className="block text-xs text-[#737373] mb-1 uppercase tracking-widest font-bold">Base SKU</label>
                <input
                  {...register('sku')}
                  placeholder="e.g., SHIRT-001"
                  className="w-full border border-[#E5E5E5] p-2 focus:ring-1 focus:ring-black outline-none text-sm"
                />
                {errors.sku?.message && <p className="text-xs text-[#EF4444] mt-1">{errors.sku.message as string}</p>}
              </div>
            </div>
          )}

          {hasVariants && (
            <p className="text-xs text-neutral-500 italic">Variant SKU and stock are set in the Options section below.</p>
          )}
        </div>

        {/* ─── Category ─── */}
        <div className="bg-[#FAFAFA] border border-[#E5E5E5] p-4 sm:p-6 space-y-4">
          <h2 className="font-playfair text-xl text-[#000000]">Category</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-[#737373] mb-1 uppercase tracking-widest font-bold">Root Category</label>
              <select
                value={selectedRootId}
                onChange={(e) => setSelectedRootId(e.target.value)}
                className="w-full border border-[#E5E5E5] p-2 focus:ring-1 focus:ring-black outline-none bg-white text-sm"
              >
                <option value="">Select Root Category</option>
                {rootCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            {subcategories.length > 0 && (
              <div>
                <label className="block text-xs text-[#737373] mb-1 uppercase tracking-widest font-bold">Subcategory (optional)</label>
                <select
                  value={formCategoryId === selectedRootId ? '' : formCategoryId}
                  onChange={(e) => {
                    const val = e.target.value
                    setValue('categoryId', val || selectedRootId)
                  }}
                  className="w-full border border-[#E5E5E5] p-2 focus:ring-1 focus:ring-black outline-none bg-white text-sm"
                >
                  <option value="">None (Use Root Category)</option>
                  {subcategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            )}
          </div>
          {errors.categoryId?.message && <p className="text-sm text-[#EF4444] mt-1">{errors.categoryId.message as string}</p>}
        </div>

        {/* ─── Product Options / Variants ─── */}
        <div className="bg-[#FAFAFA] border border-[#E5E5E5] p-4 sm:p-6 space-y-4">
          <div className="flex flex-wrap justify-between items-center gap-3">
            <h2 className="font-playfair text-xl text-[#000000]">Product Options</h2>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={hasVariants}
                onChange={(e) => setHasVariants(e.target.checked)}
                className="accent-black w-4 h-4"
              />
              <span className="text-[#000000] text-sm">This product has variants</span>
            </label>
          </div>

          {hasVariants && (
            <div className="space-y-4 pt-4 border-t border-[#E5E5E5]">
              {localOptions.map((opt, i) => (
                <div key={i} className="border border-[#E5E5E5] p-4 bg-white space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <label className="block text-xs text-[#737373] mb-1">Option Name</label>
                      <input
                        value={opt.name}
                        onChange={(e) => updateOptionName(i, e.target.value)}
                        placeholder="e.g., Size, Color, Material"
                        className="w-full border border-[#E5E5E5] p-2 text-sm focus:ring-1 focus:ring-black outline-none"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeOption(i)}
                      className="text-[#EF4444] text-xs hover:underline mt-5 whitespace-nowrap"
                    >
                      Remove
                    </button>
                  </div>
                  <div>
                    <label className="block text-xs text-[#737373] mb-1">Values (Enter or comma to add)</label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {opt.values.map((v, vIdx) => (
                        <span key={vIdx} className="bg-[#E5E5E5] text-[#000000] px-2 py-1 text-xs flex items-center gap-1">
                          {v}
                          <button
                            type="button"
                            onClick={() => removeOptionValue(i, vIdx)}
                            className="text-[#737373] hover:text-red-500 leading-none ml-1 text-base"
                          >
                            &times;
                          </button>
                        </span>
                      ))}
                    </div>
                    <input
                      type="text"
                      placeholder="Add a value..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ',') {
                          e.preventDefault()
                          addOptionValue(i, e.currentTarget.value)
                          e.currentTarget.value = ''
                        }
                      }}
                      className="w-full border border-[#E5E5E5] p-2 text-sm focus:ring-1 focus:ring-black outline-none"
                    />
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={addOption}
                className="text-sm px-4 py-2 bg-white border border-[#E5E5E5] text-black hover:bg-gray-50 transition-colors"
              >
                + Add Another Option
              </button>
            </div>
          )}
        </div>

        {/* ─── Variant Preview ─── */}
        {hasVariants && localOptions.some((o) => o.values.length > 0) && (
          <div className="bg-[#FAFAFA] border border-[#E5E5E5] p-4 sm:p-6 space-y-4">
            <div>
              <h2 className="font-playfair text-xl text-[#000000]">Variant Preview</h2>
              <p className="text-xs text-[#737373] mt-1">Deselect combinations you don't want to generate.</p>
            </div>
            <div className="space-y-2">
              {allCombos.map((combo) => {
                const title = Object.values(combo).join(' / ')
                const isSelected = !deselectedTitles.has(title)
                const variantIndex = currentVariants.findIndex((v: any) => v.title === title)

                return (
                  <div
                    key={title}
                    className={`border border-[#E5E5E5] p-3 sm:p-4 bg-white transition-opacity ${
                      !isSelected ? 'opacity-50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          const newSet = new Set(deselectedTitles)
                          if (e.target.checked) newSet.delete(title)
                          else newSet.add(title)
                          setDeselectedTitles(newSet)
                        }}
                        className="accent-black w-4 h-4 shrink-0"
                      />
                      <span className="font-medium text-sm text-[#000000]">{title}</span>
                    </div>

                    {isSelected && variantIndex !== -1 && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 ml-7">
                        <div>
                          <label className="block text-xs text-[#737373] mb-1">SKU</label>
                          <input
                            {...register(`variants.${variantIndex}.sku`)}
                            className="w-full border border-[#E5E5E5] p-2 text-xs focus:ring-1 focus:ring-black outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-[#737373] mb-1">Stock</label>
                          <input
                            type="number"
                            min="0"
                            {...register(`variants.${variantIndex}.stock`, { valueAsNumber: true })}
                            className="w-full border border-[#E5E5E5] p-2 text-xs focus:ring-1 focus:ring-black outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-[#737373] mb-1">PK Price Override (₨)</label>
                          <input
                            type="number"
                            step="0.01"
                            {...register(`variants.${variantIndex}.pricePK`, {
                              setValueAs: (v) => (v === '' || isNaN(parseFloat(v)) ? null : parseFloat(v)),
                            })}
                            className="w-full border border-[#E5E5E5] p-2 text-xs focus:ring-1 focus:ring-black outline-none"
                            placeholder="Optional"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-[#737373] mb-1">UK Price Override (£)</label>
                          <input
                            type="number"
                            step="0.01"
                            {...register(`variants.${variantIndex}.priceUK`, {
                              setValueAs: (v) => (v === '' || isNaN(parseFloat(v)) ? null : parseFloat(v)),
                            })}
                            className="w-full border border-[#E5E5E5] p-2 text-xs focus:ring-1 focus:ring-black outline-none"
                            placeholder="Optional"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            {errors.variants?.message && (
              <p className="text-sm text-[#EF4444] mt-1">{errors.variants.message as string}</p>
            )}
          </div>
        )}

        {/* ─── Regions ─── */}
        <div className="bg-[#FAFAFA] border border-[#E5E5E5] p-4 sm:p-6">
          <h2 className="font-playfair text-xl text-[#000000] mb-4">Regions</h2>
          <p className="text-xs text-neutral-500 mb-3">Select which storefronts this product will appear on.</p>
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={watch('regions')?.includes('PK')}
                onChange={(e) => {
                  const current = watch('regions') || []
                  if (e.target.checked) {
                    if (!current.includes('PK')) setValue('regions', [...current, 'PK'])
                  } else {
                    setValue('regions', current.filter((r: string) => r !== 'PK'))
                  }
                }}
                className="accent-black w-4 h-4"
              />
              <div>
                <span className="text-[#000000] text-sm font-medium">Pakistan (PK)</span>
                <p className="text-xs text-neutral-400">Visible on Pakistani storefront</p>
              </div>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={watch('regions')?.includes('UK')}
                onChange={(e) => {
                  const current = watch('regions') || []
                  if (e.target.checked) {
                    if (!current.includes('UK')) setValue('regions', [...current, 'UK'])
                  } else {
                    setValue('regions', current.filter((r: string) => r !== 'UK'))
                  }
                }}
                className="accent-black w-4 h-4"
              />
              <div>
                <span className="text-[#000000] text-sm font-medium">UK & Global (UK)</span>
                <p className="text-xs text-neutral-400">Visible on UK &amp; Global storefront</p>
              </div>
            </label>
          </div>
          {errors.regions?.message && <p className="text-sm text-[#EF4444] mt-2">{errors.regions.message as string}</p>}
        </div>

        {/* ─── Status ─── */}
        <div className="bg-[#FAFAFA] border border-[#E5E5E5] p-4 sm:p-6">
          <h2 className="font-playfair text-xl text-[#000000] mb-4">Visibility</h2>
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input type="checkbox" {...register('isActive')} className="accent-black w-4 h-4" />
              <div>
                <span className="text-[#000000] text-sm font-medium">Active</span>
                <p className="text-xs text-neutral-400">Visible on storefront</p>
              </div>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input type="checkbox" {...register('isFeatured')} className="accent-black w-4 h-4" />
              <div>
                <span className="text-[#000000] text-sm font-medium">Featured</span>
                <p className="text-xs text-neutral-400">Show in featured sections</p>
              </div>
            </label>
          </div>
        </div>

        {/* ─── Submit ─── */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#000000] text-white py-3.5 font-medium uppercase tracking-wide hover:bg-[#262626] transition-colors disabled:opacity-50 text-sm"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Saving...
            </span>
          ) : isEditing ? 'Update Product' : 'Save Product & Continue to Options'}
        </button>
      </form>
    </div>
  )
}
