'use client'

import { useEffect, useState } from 'react'
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed'
import { ProductCard } from './ProductCard'

export function RecentlyViewed() {
  const { viewedIds } = useRecentlyViewed()
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (viewedIds.length === 0) return

    const fetchProducts = async () => {
      setLoading(true)
      try {
        const res = await fetch('/api/products/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: viewedIds }),
        })
        const data = await res.json()
        if (data.success) {
          setProducts(data.data)
        }
      } catch (err) {
        console.error('Failed to fetch recently viewed products', err)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [viewedIds])

  if (viewedIds.length === 0 || products.length === 0) return null

  return (
    <section className="py-24 bg-white border-t border-border">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <h3 className="text-3xl font-display uppercase tracking-tight mb-12">Recently Viewed</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {products.map((p) => (
            <ProductCard
              key={p.id}
              {...p}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
