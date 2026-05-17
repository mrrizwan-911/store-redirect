'use client'

import { useEffect, useState } from 'react'
import { formatCurrency } from '@/lib/utils/currency'
import type { DateRange, Region } from '../AnalyticsDashboard'
import { ChevronRight, ChevronLeft } from 'lucide-react'

interface CategoryRow {
  categoryId: string
  name: string
  parentId: string | null
  revenue: number
  units: number
  aov: number
  sharePct: number
}

interface Props {
  dateRange: DateRange
  region: Region
  lastUpdated: Date
}

export function CategoryPerformanceBar({ dateRange, region, lastUpdated }: Props) {
  const [data, setData] = useState<CategoryRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [metric, setMetric] = useState<'revenue' | 'units'>('revenue')
  const [drillId, setDrillId] = useState<string | null>(null)
  const [drillName, setDrillName] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(false)

    const params = new URLSearchParams({
      start: dateRange.start.toISOString(),
      end: dateRange.end.toISOString(),
      region,
    })
    if (drillId) params.set('parentId', drillId)

    fetch(`/api/admin/analytics/category-performance?${params}`)
      .then(r => r.json())
      .then(res => {
        if (res.success) setData(res.data)
        else setError(true)
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [dateRange, region, lastUpdated, drillId])

  const maxVal = Math.max(...data.map(d => metric === 'revenue' ? d.revenue : d.units), 1)
  const chartRegion = region === 'uk' ? 'uk' : 'pk'

  if (loading) {
    return (
      <div className="an-card">
        <div className="an-section-label">Category Performance</div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-7 bg-gradient-to-r from-[var(--an-surface-2)] to-[var(--an-border)] animate-pulse rounded-[1px]" style={{ width: `${85 - i * 10}%` }} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="an-card">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          {drillId && (
            <button
              onClick={() => { setDrillId(null); setDrillName(null) }}
              className="text-[var(--an-ink-3)] hover:text-[var(--an-ink)] transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
          <div>
            <div className="an-section-label !border-0 !pb-0 !mb-0">Category Performance</div>
            {drillName && (
              <p className="text-[10px] text-[var(--an-ink-3)] mt-0.5">
                All Categories › {drillName}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center border border-[var(--an-border)] rounded-[2px] overflow-hidden self-start">
          {(['revenue', 'units'] as const).map(m => (
            <button
              key={m}
              onClick={() => setMetric(m)}
              className={`px-3 py-1 text-[10px] capitalize transition-colors ${
                metric === m
                  ? 'bg-[var(--an-ink)] text-white'
                  : 'text-[var(--an-ink-3)] hover:bg-[var(--an-surface-2)]'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <p className="text-[12px] text-[var(--chart-warn)]">Could not load category data</p>
      ) : data.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-24">
          <div className="w-full h-px bg-[var(--an-border)]" />
          <p className="text-[11px] text-[var(--an-ink-3)] italic mt-3">No data for this period</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {data.slice(0, 8).map(cat => {
            const val = metric === 'revenue' ? cat.revenue : cat.units
            const barWidth = (val / maxVal) * 100
            return (
              <button
                key={cat.categoryId}
                onClick={() => { setDrillId(cat.categoryId); setDrillName(cat.name) }}
                className="w-full text-left group"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] text-[var(--an-ink-2)] w-32 truncate group-hover:text-[var(--an-ink)] transition-colors shrink-0">
                    {cat.name}
                  </span>
                  <div className="flex-1 h-5 bg-[var(--an-surface-2)] rounded-[1px] overflow-hidden">
                    <div
                      className="h-full bg-[var(--an-ink)] opacity-80 rounded-[1px] group-hover:opacity-100 transition-all"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                  <span className="an-mono text-[11px] text-[var(--an-ink)] shrink-0 w-20 text-right">
                    {metric === 'revenue'
                      ? formatCurrency(cat.revenue, chartRegion)
                      : `${cat.units} units`}
                  </span>
                  <ChevronRight className="w-3 h-3 text-[var(--an-ink-3)] group-hover:text-[var(--an-ink)] transition-colors shrink-0" />
                </div>
                <div className="pl-[8.5rem] text-[10px] text-[var(--an-ink-3)] an-mono">
                  {cat.sharePct}% of total
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
