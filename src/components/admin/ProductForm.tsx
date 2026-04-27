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

export function ProductForm({ initialData, categories: _categories }: ProductFormProps) {
  const router = useRouter()
  const isEditing = !!initialData
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isAutoFilling, setIsAutoFilling] = useState(false)
  const [images, setImages] = useState<any[]>(initialData?.images || [])

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
      sku: '',
      baseStock: 0,
      isActive: true,
      isFeatured: false,
      tags: [],
      variantOptions: [],
      variants: [],
    },
  })

  const formCategoryId = watch('categoryId')
  const productName = watch('name')
  const currentVariants = watch('variants') || []

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
          price: null
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
  
  const handleAutoFill = async () => {
    if (!images || images.length === 0) {
      setError('Please upload at least one image first to use Auto-Fill.')
      return
    }

    setIsAutoFilling(true)
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
      if (data.name && !currentData.name) setValue('name', data.name)
      if (data.shortDescription && !currentData.shortDescription) setValue('shortDescription', data.shortDescription)
      if (data.description && !currentData.description) setValue('description', data.description)
      
      // Merge tags
      if (data.tags && Array.isArray(data.tags)) {
        const existingTags = currentData.tags || []
        const mergedTags = Array.from(new Set([...existingTags, ...data.tags]))
        setValue('tags', mergedTags)
      }

      // Try to match the suggested category
      if (data.suggestedCategory) {
        const lowerSuggestion = data.suggestedCategory.toLowerCase()
        let matchedRoot = rootCategories.find(c => c.name.toLowerCase() === lowerSuggestion)
        if (matchedRoot) {
          setSelectedRootId(matchedRoot.id)
        } else {
          let matchedSub = subcategories.find(c => c.name.toLowerCase() === lowerSuggestion)
          if (matchedSub) {
            setValue('categoryId', matchedSub.id)
          }
        }
      }

    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsAutoFilling(false)
    }
  }

  const handleGenerateDescription = async () => {
    const currentName = watch('name')
    const categoryId = watch('categoryId')
    
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
          tags: currentTags
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

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value)
          generatedText += chunk
          setValue('description', generatedText)
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

        // On change (not initial load), reset subcategory if root changed
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

      if (hasVariants) {
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
    <div className="flex flex-col lg:flex-row gap-8">
      <form onSubmit={handleSubmit(onSubmit)} className="flex-1 space-y-8">
        {error && <div className="p-4 bg-[#EF4444] text-white text-sm">{error}</div>}

        {/* Basic Info */}
        <div className="bg-[#FAFAFA] border border-[#E5E5E5] p-6 space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-playfair text-xl text-[#000000] m-0">Basic Info</h2>
            <button
              type="button"
              onClick={handleAutoFill}
              disabled={isAutoFilling || images.length === 0}
              className="text-xs px-4 py-2 bg-[#E8D5B0] text-black font-semibold tracking-wide hover:bg-[#d6c39e] transition-colors disabled:opacity-50"
            >
              {isAutoFilling ? 'Analyzing Image...' : '✨ Auto-Fill from Image'}
            </button>
          </div>
          <div>
            <label className="block text-sm text-[#000000] mb-1">Name</label>
            <input {...register('name')} className="w-full border border-[#E5E5E5] p-2 focus:ring-1 focus:ring-black outline-none" />
            {errors.name?.message && <p className="text-sm text-[#EF4444] mt-1">{errors.name.message as string}</p>}
          </div>
          <div>
            <label className="block text-sm text-[#000000] mb-1">Slug (auto-generated if empty)</label>
            <input {...register('slug')} className="w-full border border-[#E5E5E5] p-2 focus:ring-1 focus:ring-black outline-none" />
          </div>
          <div>
            <label className="block text-sm text-[#000000] mb-1">Short Description</label>
            <input {...register('shortDescription')} className="w-full border border-[#E5E5E5] p-2 focus:ring-1 focus:ring-black outline-none" />
          </div>
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm text-[#000000]">Full Description</label>
              <button
                type="button"
                onClick={handleGenerateDescription}
                disabled={isGenerating || !watch('name')}
                className="text-xs px-3 py-1 bg-black text-white rounded-none disabled:opacity-50"
              >
                {isGenerating ? 'Generating...' : '✨ Generate with AI'}
              </button>
            </div>
            <textarea {...register('description')} rows={4} className="w-full border border-[#E5E5E5] p-2 focus:ring-1 focus:ring-black outline-none" />
            {errors.description?.message && <p className="text-sm text-[#EF4444] mt-1">{errors.description.message as string}</p>}
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-[#FAFAFA] border border-[#E5E5E5] p-6 space-y-4">
          <h2 className="font-playfair text-xl text-[#000000]">Pricing {!hasVariants && '& Inventory'}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm text-[#000000] mb-1">Base Price</label>
              <input type="number" {...register('basePrice', { valueAsNumber: true })} className="w-full border border-[#E5E5E5] p-2 focus:ring-1 focus:ring-black outline-none" />
              {errors.basePrice?.message && <p className="text-sm text-[#EF4444] mt-1">{errors.basePrice.message as string}</p>}
            </div>
            <div>
              <label className="block text-sm text-[#000000] mb-1">Sale Price</label>
              <input type="number" {...register('salePrice', { setValueAs: v => v === "" || isNaN(parseFloat(v)) ? null : parseFloat(v) })} className="w-full border border-[#E5E5E5] p-2 focus:ring-1 focus:ring-black outline-none" />
            </div>

            {!hasVariants && (
              <>
                <div>
                  <label className="block text-sm text-[#000000] mb-1">Base Stock</label>
                  <input type="number" {...register('baseStock', { valueAsNumber: true })} className="w-full border border-[#E5E5E5] p-2 focus:ring-1 focus:ring-black outline-none" />
                  {errors.baseStock?.message && <p className="text-sm text-[#EF4444] mt-1">{errors.baseStock.message as string}</p>}
                </div>
                <div>
                  <label className="block text-sm text-[#000000] mb-1">Base SKU</label>
                  <input {...register('sku')} className="w-full border border-[#E5E5E5] p-2 focus:ring-1 focus:ring-black outline-none" />
                  {errors.sku?.message && <p className="text-sm text-[#EF4444] mt-1">{errors.sku.message as string}</p>}
                </div>
              </>
            )}
          </div>

          {hasVariants && (
            <div className="mt-2">
              <p className="text-xs text-neutral-500 italic">Individual variant SKU and stock will be managed in the Options section below.</p>
            </div>
          )}
        </div>

        {/* Category */}
        <div className="bg-[#FAFAFA] border border-[#E5E5E5] p-6 space-y-4">
          <h2 className="font-playfair text-xl text-[#000000]">Category</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-[#737373] mb-1 uppercase tracking-widest font-bold">Root Category</label>
              <select
                value={selectedRootId}
                onChange={(e) => setSelectedRootId(e.target.value)}
                className="w-full border border-[#E5E5E5] p-2 focus:ring-1 focus:ring-black outline-none bg-white transition-all"
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
                  className="w-full border border-[#E5E5E5] p-2 focus:ring-1 focus:ring-black outline-none bg-white transition-all"
                >
                  <option value="">None (Use Root Category)</option>
                  {subcategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            )}
          </div>
          {errors.categoryId?.message && <p className="text-sm text-[#EF4444] mt-1">{errors.categoryId.message as string}</p>}
        </div>

        {/* Options Builder Toggle */}
        <div className="bg-[#FAFAFA] border border-[#E5E5E5] p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="font-playfair text-xl text-[#000000]">Product Options</h2>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={hasVariants}
                onChange={(e) => setHasVariants(e.target.checked)}
                className="accent-black w-4 h-4"
              />
              <span className="text-[#000000] text-sm">Yes, this product has variants</span>
            </label>
          </div>

          {hasVariants && (
            <div className="space-y-4 pt-4 border-t border-[#E5E5E5]">
              {localOptions.map((opt, i) => (
                <div key={i} className="flex gap-4 items-start border border-[#E5E5E5] p-4 bg-white relative group">
                  <div className="w-1/3">
                    <label className="block text-xs text-[#737373] mb-1">Option Name</label>
                    <input
                      value={opt.name}
                      onChange={(e) => updateOptionName(i, e.target.value)}
                      placeholder="e.g., Size, Color, Material"
                      className="w-full border border-[#E5E5E5] p-2 text-sm focus:ring-1 focus:ring-black outline-none"
                    />
                  </div>
                  <div className="w-2/3">
                    <label className="block text-xs text-[#737373] mb-1">Values (Press Enter or Comma to add)</label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {opt.values.map((v, vIdx) => (
                        <span key={vIdx} className="bg-[#E5E5E5] text-[#000000] px-2 py-1 text-sm flex items-center gap-1">
                          {v}
                          <button
                            type="button"
                            onClick={() => removeOptionValue(i, vIdx)}
                            className="text-[#737373] hover:text-black leading-none ml-1"
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
                  <button
                    type="button"
                    onClick={() => removeOption(i)}
                    className="absolute top-2 right-2 text-[#EF4444] text-xs hover:underline opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    Remove Option
                  </button>
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

        {/* Variant Preview List */}
        {hasVariants && localOptions.some((o) => o.values.length > 0) && (
          <div className="bg-[#FAFAFA] border border-[#E5E5E5] p-6 space-y-4">
            <h2 className="font-playfair text-xl text-[#000000]">Variant Preview</h2>
            <p className="text-xs text-[#737373]">
              Deselect combinations you don't want to generate.
            </p>
            <div className="space-y-2">
              {allCombos.map((combo) => {
                const title = Object.values(combo).join(' / ')
                const isSelected = !deselectedTitles.has(title)
                const variantIndex = currentVariants.findIndex((v: any) => v.title === title)

                return (
                  <div
                    key={title}
                    className={`flex flex-col md:flex-row gap-4 md:items-center border border-[#E5E5E5] p-4 bg-white transition-opacity ${
                      !isSelected ? 'opacity-50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3 md:w-1/3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          const newSet = new Set(deselectedTitles)
                          if (e.target.checked) newSet.delete(title)
                          else newSet.add(title)
                          setDeselectedTitles(newSet)
                        }}
                        className="accent-black w-4 h-4"
                      />
                      <span className="font-medium text-sm text-[#000000]">{title}</span>
                    </div>

                    {isSelected && variantIndex !== -1 && (
                      <div className="flex-1 grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-xs text-[#737373] mb-1">SKU</label>
                          <input
                            {...register(`variants.${variantIndex}.sku`)}
                            className="w-full border border-[#E5E5E5] p-2 text-sm focus:ring-1 focus:ring-black outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-[#737373] mb-1">Stock</label>
                          <input
                            type="number"
                            {...register(`variants.${variantIndex}.stock`, { valueAsNumber: true })}
                            className="w-full border border-[#E5E5E5] p-2 text-sm focus:ring-1 focus:ring-black outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-[#737373] mb-1">Price Override</label>
                          <input
                            type="number"
                            {...register(`variants.${variantIndex}.price`, {
                              setValueAs: (v) => (v === '' || isNaN(parseFloat(v)) ? null : parseFloat(v)),
                            })}
                            className="w-full border border-[#E5E5E5] p-2 text-sm focus:ring-1 focus:ring-black outline-none"
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

        {/* Status */}
        <div className="bg-[#FAFAFA] border border-[#E5E5E5] p-6 flex gap-8">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input type="checkbox" {...register('isActive')} className="accent-black w-4 h-4" />
            <span className="text-[#000000]">Active</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input type="checkbox" {...register('isFeatured')} className="accent-black w-4 h-4" />
            <span className="text-[#000000]">Featured</span>
          </label>
        </div>

        <button type="submit" disabled={loading} className="w-full bg-[#000000] text-white py-3 font-medium uppercase tracking-wide hover:bg-[#262626] transition-colors disabled:opacity-50">
          {loading ? 'Saving...' : 'Save Product & Continue to Options'}
        </button>
      </form>

      {/* Images Sidebar */}
      <div className="w-full lg:w-96 space-y-4">
        <div className="bg-[#FAFAFA] border border-[#E5E5E5] p-6 space-y-4">
          <h2 className="font-playfair text-xl text-[#000000]">Images</h2>
          <ImageUploader
            productId={initialData?.id}
            images={images}
            onUploadSuccess={(img) => setImages([...images, img])}
            onRemoveImage={(id) => setImages(images.filter((img) => img.id !== id))}
            onSetPrimary={(id) => setImages(images.map((img) => ({ ...img, isPrimary: img.id === id || img.url === id })))}
          />
        </div>
      </div>
    </div>
  )
}
