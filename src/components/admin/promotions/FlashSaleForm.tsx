'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { flashSaleSchema } from '@/lib/validations/admin'
import { useRouter } from 'next/navigation'
import { Check, ChevronRight, Search, Package, Layers, Globe } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Product {
  id: string
  name: string
  price: number
}

interface CategorizedProducts {
  categoryName: string
  products: Product[]
}

interface FlashSaleFormProps {
  initialData?: any
  categorizedProducts: CategorizedProducts[]
}

export function FlashSaleForm({ initialData, categorizedProducts }: FlashSaleFormProps) {
  const router = useRouter()
  const [step, setStep] = useState(initialData ? 3 : 1)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const { register, handleSubmit, watch, setValue, getValues, formState: { errors } } = useForm({
    resolver: zodResolver(flashSaleSchema),
    defaultValues: initialData ? {
      ...initialData,
      startTime: initialData.startTime ? new Date(initialData.startTime).toISOString().slice(0, 16) : '',
      endTime: initialData.endTime ? new Date(initialData.endTime).toISOString().slice(0, 16) : '',
    } : {
      name: '',
      scope: 'SINGLE',
      discountType: 'PERCENTAGE',
      discountPct: 10,
      discountFlat: null,
      startTime: '',
      endTime: '',
      productIds: [],
      country: 'ALL',
    },
  })

  const selectedScope = watch('scope')
  const selectedProductIds = watch('productIds') || []
  const discountType = watch('discountType')

  const onSubmit = async (data: any) => {
    setLoading(true)
    setError(null)

    try {
      const url = initialData ? `/api/admin/flash-sales/${initialData.id}` : '/api/admin/flash-sales'
      const method = initialData ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await res.json()

      if (!res.ok || !result.success) {
        throw new Error(result.error || 'Failed to save flash sale')
      }

      router.push('/d8f2a1/admin/flash-sales')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
      setStep(3) // Ensure user sees the error on the final step
    } finally {
      setLoading(false)
    }
  }

  const toggleProduct = (id: string) => {
    if (selectedScope === 'SINGLE') {
      setValue('productIds', [id])
    } else {
      const current = [...selectedProductIds]
      const index = current.indexOf(id)
      if (index > -1) {
        current.splice(index, 1)
      } else {
        current.push(id)
      }
      setValue('productIds', current)
    }
  }

  const nextStep = (overrideScope?: string) => {
    const currentScope = overrideScope || getValues('scope')
    if (step === 1) {
      if (currentScope === 'ALL') {
        setValue('productIds', [])
        setStep(3)
      } else {
        setStep(2)
      }
    } else if (step === 2) {
      if (selectedProductIds.length === 0) {
        setError('Please select at least one product')
        return
      }
      setError(null)
      setStep(3)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Bar */}
      <div className="flex items-center justify-between mb-12 relative">
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-neutral-100 -translate-y-1/2 z-0" />
        <div
          className="absolute top-1/2 left-0 h-0.5 bg-black -translate-y-1/2 z-0 transition-all duration-500"
          style={{ width: `${((step - 1) / 2) * 100}%` }}
        />
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={cn(
              "relative z-10 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300",
              step >= s ? "bg-black text-white scale-110" : "bg-white text-neutral-400 border-2 border-neutral-100"
            )}
          >
            {step > s ? <Check className="w-5 h-5" /> : s}
            <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] uppercase tracking-widest font-bold text-neutral-400">
              {s === 1 ? 'Scope' : s === 2 ? 'Selection' : 'Config'}
            </span>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit, (errors) => console.log('Flash Sale Validation Errors:', errors))} className="space-y-8">
        {error && <div className="p-4 bg-red-50 text-red-600 text-xs font-bold uppercase tracking-widest border border-red-100 rounded-lg">{error}</div>}

        {/* Global Validation Error Summary */}
        {Object.keys(errors).length > 0 && (
          <div className="p-4 bg-orange-50 text-orange-600 text-xs font-bold uppercase tracking-widest border border-orange-100 rounded-lg">
            <p className="font-black mb-2">Please correct the following issues:</p>
            <ul className="list-disc list-inside space-y-1">
              {Object.entries(errors).map(([key, err]: [string, any]) => (
                <li key={key}>{err?.message || `${key} is required or invalid`}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Step 1: Scope Selection */}
        {step === 1 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <button
              type="button"
              onClick={() => { setValue('scope', 'SINGLE'); nextStep('SINGLE'); }}
              className={cn(
                "p-8 border-2 text-left transition-all group rounded-2xl",
                selectedScope === 'SINGLE' ? "border-black bg-neutral-50" : "border-neutral-100 hover:border-neutral-200"
              )}
            >
              <Package className="w-8 h-8 mb-4 text-neutral-400 group-hover:text-black transition-colors" />
              <h3 className="font-bold text-lg mb-2">Single Product</h3>
              <p className="text-neutral-500 text-sm">Apply discount to one specific item.</p>
            </button>
            <button
              type="button"
              onClick={() => { setValue('scope', 'MULTIPLE'); nextStep('MULTIPLE'); }}
              className={cn(
                "p-8 border-2 text-left transition-all group rounded-2xl",
                selectedScope === 'MULTIPLE' ? "border-black bg-neutral-50" : "border-neutral-100 hover:border-neutral-200"
              )}
            >
              <Layers className="w-8 h-8 mb-4 text-neutral-400 group-hover:text-black transition-colors" />
              <h3 className="font-bold text-lg mb-2">Multiple Products</h3>
              <p className="text-neutral-500 text-sm">Select a group of items for the sale.</p>
            </button>
            <button
              type="button"
              onClick={() => { setValue('scope', 'ALL'); nextStep('ALL'); }}
              className={cn(
                "p-8 border-2 text-left transition-all group rounded-2xl",
                selectedScope === 'ALL' ? "border-black bg-neutral-50" : "border-neutral-100 hover:border-neutral-200"
              )}
            >
              <Globe className="w-8 h-8 mb-4 text-neutral-400 group-hover:text-black transition-colors" />
              <h3 className="font-bold text-lg mb-2">All Products</h3>
              <p className="text-neutral-500 text-sm">Site-wide flash sale across every item.</p>
            </button>
          </div>
        )}

        {/* Step 2: Product Selection */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                placeholder="Search products..."
                className="w-full pl-12 pr-4 py-4 bg-neutral-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-black outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="space-y-8 max-h-[500px] overflow-y-auto pr-4 custom-scrollbar">
              {categorizedProducts.map((cat) => {
                const filteredProducts = cat.products.filter(p =>
                  p.name.toLowerCase().includes(searchTerm.toLowerCase())
                )
                if (filteredProducts.length === 0) return null

                return (
                  <div key={cat.categoryName} className="space-y-4">
                    <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold text-neutral-400 border-b border-neutral-100 pb-2">
                      {cat.categoryName}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {filteredProducts.map((product) => (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() => toggleProduct(product.id)}
                          className={cn(
                            "flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left",
                            selectedProductIds.includes(product.id)
                              ? "border-black bg-neutral-50"
                              : "border-neutral-100 hover:border-neutral-200"
                          )}
                        >
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold">{product.name}</span>
                            <span className="text-xs text-neutral-400">PKR {product.price.toLocaleString()}</span>
                          </div>
                          {selectedProductIds.includes(product.id) && (
                            <div className="bg-black text-white rounded-full p-1">
                              <Check className="w-3 h-3" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="flex justify-between items-center pt-6 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-sm font-bold uppercase tracking-widest text-neutral-400 hover:text-black transition-colors"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => nextStep()}
                className="bg-black text-white px-8 py-3 rounded-xl text-sm font-bold uppercase tracking-widest hover:bg-neutral-800 transition-all flex items-center gap-2"
              >
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Config */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-neutral-400 mb-2">Sale Name</label>
                  <input
                    {...register('name')}
                    placeholder="e.g. Weekend Flash"
                    className="w-full p-4 bg-neutral-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-black outline-none"
                  />
                  {errors.name && <p className="text-xs text-red-500 mt-2">{errors.name.message as string}</p>}
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-neutral-400 mb-2">Target Region</label>
                  <select
                    {...register('country')}
                    className="w-full p-4 bg-neutral-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-black outline-none appearance-none"
                  >
                    <option value="ALL">All Regions (Pakistan & UK)</option>
                    <option value="PK">🇵🇰 Pakistan Only</option>
                    <option value="UK">🇬🇧 United Kingdom Only</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-bold text-neutral-400 mb-2">Discount Type</label>
                    <select
                      {...register('discountType')}
                      className="w-full p-4 bg-neutral-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-black outline-none appearance-none"
                    >
                      <option value="PERCENTAGE">Percentage (%)</option>
                      <option value="FLAT">Flat Amount (PKR)</option>
                    </select>
                    {errors.discountType && <p className="text-[10px] text-red-500 mt-2 font-bold uppercase tracking-tight">{errors.discountType.message as string}</p>}
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-bold text-neutral-400 mb-2">
                      {discountType === 'PERCENTAGE' ? 'Discount %' : 'Flat Discount'}
                    </label>
                    <input
                      type="number"
                      {...register(discountType === 'PERCENTAGE' ? 'discountPct' : 'discountFlat', { valueAsNumber: true })}
                      className="w-full p-4 bg-neutral-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-black outline-none"
                    />
                    {discountType === 'PERCENTAGE' && errors.discountPct && (
                      <p className="text-[10px] text-red-500 mt-2 font-bold uppercase tracking-tight">{errors.discountPct.message as string}</p>
                    )}
                    {discountType === 'FLAT' && errors.discountFlat && (
                      <p className="text-[10px] text-red-500 mt-2 font-bold uppercase tracking-tight">{errors.discountFlat.message as string}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-neutral-400 mb-2">Start Time</label>
                  <input
                    type="datetime-local"
                    {...register('startTime')}
                    className="w-full p-4 bg-neutral-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-black outline-none"
                  />
                  {errors.startTime && <p className="text-xs text-red-500 mt-2">{errors.startTime.message as string}</p>}
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-neutral-400 mb-2">End Time</label>
                  <input
                    type="datetime-local"
                    {...register('endTime')}
                    className="w-full p-4 bg-neutral-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-black outline-none"
                  />
                  {errors.endTime && <p className="text-xs text-red-500 mt-2">{errors.endTime.message as string}</p>}
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-6 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => setStep(selectedScope === 'ALL' ? 1 : 2)}
                className="text-sm font-bold uppercase tracking-widest text-neutral-400 hover:text-black transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-black text-white px-12 py-4 rounded-2xl text-sm font-bold uppercase tracking-widest hover:bg-neutral-800 transition-all disabled:opacity-50"
              >
                {loading ? (initialData ? 'Saving...' : 'Creating...') : (initialData ? 'Update Flash Sale' : 'Launch Flash Sale')}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  )
}
