'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import type { DateRange, Region } from '../AnalyticsDashboard'

interface Props {
  dateRange: DateRange
  region: Region
  lastUpdated: Date
}

export function LowStockPanel({ dateRange, region, lastUpdated }: Props) {
  const [items, setItems] = useState<{ productId: string; name: string; stock: number }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({
      start: dateRange.start.toISOString(),
      end: dateRange.end.toISOString(),
      region,
    })
    fetch(`/api/admin/analytics/product-analytics?${params}`)
      .then(r => r.json())
      .then(res => { if (res.success) setItems(res.data.lowStock || []) })
      .finally(() => setLoading(false))
  }, [dateRange, region, lastUpdated])

  if (loading) {
    return (
      <div className="an-card">
        <div className="an-section-label">Low Stock Alert</div>
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-6 bg-[var(--an-surface-2)] animate-pulse rounded-[1px]" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={`an-card ${items.length > 0 ? 'border-l-[3px] border-l-[var(--chart-warn)]' : ''}`}>
      <div className="flex items-center gap-2 mb-4">
        {items.length > 0 && <AlertTriangle className="w-4 h-4 text-[var(--chart-warn)]" />}
        <div className="an-section-label !border-0 !pb-0 !mb-0">
          Low Stock Alert
        </div>
        {items.length > 0 && (
          <span className="ml-auto bg-[var(--chart-warn)] text-white text-[10px] px-2 py-0.5 rounded-full an-mono">
            {items.length}
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-20">
          <div className="w-full h-px bg-[var(--an-border)]" />
          <p className="text-[11px] text-[var(--an-ink-3)] mt-3">✓ All products are well-stocked</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map(item => (
            <div
              key={item.productId}
              className="flex items-center justify-between py-2 border-b border-[var(--an-border)] last:border-0"
            >
              <a
                href={`/d8f2a1/admin/products?id=${item.productId}`}
                className="text-[12px] text-[var(--an-ink-2)] hover:text-[var(--an-ink)] hover:underline transition-colors truncate max-w-[180px]"
              >
                {item.name}
              </a>
              <span
                className={`an-mono text-[12px] font-medium shrink-0 ml-2 ${
                  item.stock === 0
                    ? 'text-[var(--chart-neg)]'
                    : item.stock < 5
                    ? 'text-[var(--chart-neg)]'
                    : 'text-[var(--chart-warn)]'
                }`}
              >
                {item.stock === 0 ? 'Out of stock' : `${item.stock} left`}
              </span>
            </div>
          ))}
          <a
            href="/d8f2a1/admin/inventory"
            className="block text-center text-[11px] text-[var(--an-ink-3)] hover:text-[var(--an-ink)] mt-2 transition-colors"
          >
            View all inventory →
          </a>
        </div>
      )}
    </div>
  )
}
