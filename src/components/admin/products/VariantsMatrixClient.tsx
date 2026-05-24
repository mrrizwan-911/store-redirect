'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Variant {
  id: string
  title: string
  sku: string
  stock: number
  price: number | null
  pricePK: number | null
  priceUK: number | null
}

interface VariantsMatrixClientProps {
  productId: string
  variants: Variant[]
}

export function VariantsMatrixClient({ productId, variants: initialVariants }: VariantsMatrixClientProps) {
  const router = useRouter()
  const [variants, setVariants] = useState<Variant[]>(initialVariants)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleUpdate = (index: number, field: keyof Variant, value: any) => {
    const newVariants = [...variants]
    newVariants[index] = { ...newVariants[index], [field]: value }
    setVariants(newVariants)
  }

  const handleSave = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/products/${productId}/variants/bulk`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variants }),
      })
      const result = await res.json()
      if (!res.ok || !result.success) throw new Error(result.error || 'Failed to save variants')

      router.push('/d8f2a1/admin/inventory')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {error && <div className="p-4 bg-[#EF4444] text-white text-sm">{error}</div>}

      <div className="bg-white border border-[#E5E5E5] overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#FAFAFA] border-b border-[#E5E5E5] text-xs uppercase tracking-wider text-[#737373]">
              <th className="p-4 font-bold">Variant Title</th>
              <th className="p-4 font-bold">SKU</th>
              <th className="p-4 font-bold">Stock</th>
              <th className="p-4 font-bold">Price Override</th>
              <th className="p-4 font-bold">PK Price Override (<span className="text-lg">₨</span>)</th>
              <th className="p-4 font-bold">UK Price Override (<span className="text-lg">£</span>)</th>
            </tr>
          </thead>
          <tbody>
            {variants.map((v, idx) => (
              <tr key={v.id} className="border-b border-[#E5E5E5] last:border-0 hover:bg-[#FAFAFA]/50 transition-colors">
                <td className="p-4 text-sm font-medium text-[#000000]">{v.title}</td>
                <td className="p-4">
                  <input
                    type="text"
                    value={v.sku}
                    onChange={(e) => handleUpdate(idx, 'sku', e.target.value)}
                    className="w-full border border-[#E5E5E5] p-2 text-sm focus:ring-1 focus:ring-black outline-none bg-white"
                  />
                </td>
                <td className="p-4">
                  <input
                    type="number"
                    value={v.stock}
                    onChange={(e) => handleUpdate(idx, 'stock', parseInt(e.target.value) || 0)}
                    className="w-full border border-[#E5E5E5] p-2 text-sm focus:ring-1 focus:ring-black outline-none bg-white"
                  />
                </td>
                <td className="p-4">
                  <input
                    type="number"
                    value={v.price === null ? '' : v.price}
                    onChange={(e) => handleUpdate(idx, 'price', e.target.value === '' ? null : parseFloat(e.target.value))}
                    className="w-full border border-[#E5E5E5] p-2 text-sm focus:ring-1 focus:ring-black outline-none bg-white"
                    placeholder="Base Price"
                  />
                </td>
                <td className="p-4">
                  <input
                    type="number"
                    value={v.pricePK === null ? '' : v.pricePK}
                    onChange={(e) => handleUpdate(idx, 'pricePK', e.target.value === '' ? null : parseFloat(e.target.value))}
                    className="w-full border border-[#E5E5E5] p-2 text-sm focus:ring-1 focus:ring-black outline-none bg-white"
                    placeholder="PK Price"
                  />
                </td>
                <td className="p-4">
                  <input
                    type="number"
                    value={v.priceUK === null ? '' : v.priceUK}
                    onChange={(e) => handleUpdate(idx, 'priceUK', e.target.value === '' ? null : parseFloat(e.target.value))}
                    className="w-full border border-[#E5E5E5] p-2 text-sm focus:ring-1 focus:ring-black outline-none bg-white"
                    placeholder="UK Price"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={loading || variants.length === 0}
          className="px-8 py-3 bg-[#000000] text-white font-semibold uppercase tracking-wide text-sm hover:bg-[#262626] transition-colors disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save All Variants'}
        </button>
      </div>
    </div>
  )
}
