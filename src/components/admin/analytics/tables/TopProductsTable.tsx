'use client'

import { useEffect, useState } from 'react'
import { ArrowUpDown, AlertTriangle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/currency'
import type { DateRange, Region } from '../AnalyticsDashboard'

interface ProductRow {
  productId: string
  name: string
  category: string
  pkUnits: number
  ukUnits: number
  totalUnits: number
  revenue: number
  stock: number
}

type SortKey = 'totalUnits' | 'revenue' | 'stock' | 'pkUnits' | 'ukUnits'

interface Props {
  dateRange: DateRange
  region: Region
  lastUpdated: Date
}

export function TopProductsTable({ dateRange, region, lastUpdated }: Props) {
  const [products, setProducts] = useState<ProductRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [sortKey, setSortKey] = useState<SortKey>('totalUnits')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(0)
  const PER_PAGE = 10

  useEffect(() => {
    setLoading(true)
    setError(false)
    setPage(0)

    const params = new URLSearchParams({
      start: dateRange.start.toISOString(),
      end: dateRange.end.toISOString(),
      region,
    })

    fetch(`/api/admin/analytics/product-analytics?${params}`)
      .then(r => r.json())
      .then(res => {
        if (res.success) setProducts(res.data.topProducts || [])
        else setError(true)
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [dateRange, region, lastUpdated])

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  const sorted = [...products].sort((a, b) => {
    const mult = sortDir === 'asc' ? 1 : -1
    return (a[sortKey] - b[sortKey]) * mult
  })

  const paged = sorted.slice(page * PER_PAGE, (page + 1) * PER_PAGE)
  const totalPages = Math.ceil(sorted.length / PER_PAGE)
  const chartRegion = region === 'uk' ? 'uk' : 'pk'

  function SortBtn({ k, label }: { k: SortKey; label: string }) {
    return (
      <button
        onClick={() => toggleSort(k)}
        className={`flex items-center gap-0.5 transition-colors ${sortKey === k ? 'text-[var(--an-ink)]' : 'text-[var(--an-ink-3)] hover:text-[var(--an-ink-2)]'}`}
      >
        {label}
        <ArrowUpDown className="w-2.5 h-2.5" />
      </button>
    )
  }

  if (loading) {
    return (
      <div className="an-card">
        <div className="an-section-label">Top Products</div>
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-8 bg-[var(--an-surface-2)] animate-pulse rounded-[1px]" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="an-card bg-[#FFF8F0] border-l-[3px] border-l-[var(--chart-warn)]">
        <p className="text-[12px] text-[var(--chart-warn)]">Could not load product data</p>
      </div>
    )
  }

  return (
    <div className="an-card">
      <div className="an-section-label">Top Products by {sortKey === 'revenue' ? 'Revenue' : 'Units Sold'}</div>

      <div className="w-full overflow-x-auto -mx-4 sm:mx-0">
        <table className="min-w-[600px] w-full">
          <thead>
            <tr className="border-b border-[var(--an-border)]">
              <th className="text-left py-2 px-4 sm:px-0 text-[10px] uppercase tracking-widest text-[var(--an-ink-3)] w-6 an-mono">#</th>
              <th className="text-left py-2 px-2 text-[10px] uppercase tracking-widest text-[var(--an-ink-3)]">Product</th>
              <th className="text-left py-2 px-2 text-[10px] uppercase tracking-widest text-[var(--an-ink-3)]">Category</th>
              <th className="text-right py-2 px-2 text-[10px] uppercase tracking-widest text-[var(--an-ink-3)]">
                <SortBtn k="pkUnits" label="🇵🇰 PK" />
              </th>
              <th className="text-right py-2 px-2 text-[10px] uppercase tracking-widest text-[var(--an-ink-3)]">
                <SortBtn k="ukUnits" label="🇬🇧 UK" />
              </th>
              <th className="text-right py-2 px-2 text-[10px] uppercase tracking-widest text-[var(--an-ink-3)]">
                <SortBtn k="totalUnits" label="Total" />
              </th>
              <th className="text-right py-2 px-2 text-[10px] uppercase tracking-widest text-[var(--an-ink-3)]">
                <SortBtn k="revenue" label="Revenue" />
              </th>
              <th className="text-right py-2 px-2 text-[10px] uppercase tracking-widest text-[var(--an-ink-3)]">
                <SortBtn k="stock" label="Stock" />
              </th>
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-[11px] text-[var(--an-ink-3)] italic">
                  No products sold in this period
                </td>
              </tr>
            ) : (
              paged.map((p, i) => (
                <tr
                  key={p.productId}
                  className="border-b border-[var(--an-border)] hover:bg-[var(--an-surface-2)] transition-colors group"
                >
                  <td className="py-2.5 px-4 sm:px-0 an-mono text-[11px] text-[var(--an-ink-3)]">
                    {(page * PER_PAGE + i + 1).toString().padStart(2, '0')}
                  </td>
                  <td className="py-2.5 px-2">
                    <a
                      href={`/d8f2a1/admin/products?id=${p.productId}`}
                      className="text-[12px] text-[var(--an-ink)] hover:underline group-hover:text-[var(--an-ink-2)] transition-colors block truncate max-w-[160px]"
                    >
                      {p.name}
                    </a>
                  </td>
                  <td className="py-2.5 px-2 text-[11px] text-[var(--an-ink-3)]">
                    {p.category}
                  </td>
                  <td className="py-2.5 px-2 text-right an-mono text-[12px] text-[var(--chart-pk)]">
                    {p.pkUnits}
                  </td>
                  <td className="py-2.5 px-2 text-right an-mono text-[12px] text-[var(--chart-uk)]">
                    {p.ukUnits}
                  </td>
                  <td className="py-2.5 px-2 text-right an-mono text-[12px] text-[var(--an-ink)]">
                    {p.totalUnits}
                  </td>
                  <td className="py-2.5 px-2 text-right an-mono text-[12px] text-[var(--an-ink)]">
                    {formatCurrency(p.revenue, chartRegion)}
                  </td>
                  <td className="py-2.5 px-2 text-right">
                    <span
                      className={`an-mono text-[12px] flex items-center justify-end gap-1 ${
                        p.stock < 5
                          ? 'text-[var(--chart-neg)]'
                          : p.stock < 20
                          ? 'text-[var(--chart-warn)]'
                          : 'text-[var(--an-ink)]'
                      }`}
                    >
                      {p.stock < 10 && <AlertTriangle className="w-3 h-3" />}
                      {p.stock}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-[var(--an-border)]">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-3 py-1.5 text-[11px] border border-[var(--an-border)] rounded-[1px] text-[var(--an-ink-2)] hover:border-[var(--an-ink)] disabled:opacity-30 transition-all"
          >
            ← Prev
          </button>
          <span className="an-mono text-[11px] text-[var(--an-ink-3)]">
            Page {page + 1} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="px-3 py-1.5 text-[11px] border border-[var(--an-border)] rounded-[1px] text-[var(--an-ink-2)] hover:border-[var(--an-ink)] disabled:opacity-30 transition-all"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  )
}
