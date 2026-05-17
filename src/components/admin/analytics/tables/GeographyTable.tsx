'use client'

import { useEffect, useState } from 'react'
import { formatCurrency } from '@/lib/utils/currency'
import type { DateRange } from '../AnalyticsDashboard'

interface Props {
  dateRange: DateRange
  lastUpdated: Date
}

export function GeographyTable({ dateRange, lastUpdated }: Props) {
  const [geoData, setGeoData] = useState<{ country: string; count: number; revenue: number }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({
      start: dateRange.start.toISOString(),
      end: dateRange.end.toISOString(),
    })
    fetch(`/api/admin/analytics/customer-analytics?${params}`)
      .then(r => r.json())
      .then(res => { if (res.success) setGeoData(res.data.geography || []) })
      .finally(() => setLoading(false))
  }, [dateRange, lastUpdated])

  const maxRevenue = Math.max(...geoData.map(g => g.revenue), 1)

  if (loading) {
    return (
      <div className="an-card">
        <div className="an-section-label">Customer Geography</div>
        <div className="space-y-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-6 bg-[var(--an-surface-2)] animate-pulse rounded-[1px]" style={{ width: `${90 - i * 15}%` }} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="an-card">
      <div className="an-section-label">Customer Geography</div>

      {!geoData.length ? (
        <div className="flex flex-col items-center justify-center h-24">
          <div className="w-full h-px bg-[var(--an-border)]" />
          <p className="text-[11px] text-[var(--an-ink-3)] italic mt-3">No geography data</p>
        </div>
      ) : (
        <div className="space-y-1">
          {/* Header */}
          <div className="grid grid-cols-12 gap-2 pb-2 border-b border-[var(--an-border)]">
            <span className="col-span-4 text-[10px] uppercase tracking-widest text-[var(--an-ink-3)]">Country</span>
            <span className="col-span-5 text-[10px] uppercase tracking-widest text-[var(--an-ink-3)]">Revenue</span>
            <span className="col-span-3 text-[10px] uppercase tracking-widest text-[var(--an-ink-3)] text-right">Orders</span>
          </div>

          {geoData.map((g, i) => {
            const barPct = (g.revenue / maxRevenue) * 100
            const isUK = g.country?.toLowerCase().includes('uk') || g.country?.toLowerCase().includes('united kingdom') || g.country?.toLowerCase() === 'gb'
            return (
              <div key={g.country} className="grid grid-cols-12 gap-2 py-1.5 items-center hover:bg-[var(--an-surface-2)] rounded-[1px] px-1 -mx-1 transition-colors">
                <div className="col-span-4 flex items-center gap-1.5 min-w-0">
                  <span className="text-[11px] font-medium text-[var(--an-ink-3)] an-mono shrink-0">
                    {(i + 1).toString().padStart(2, '0')}
                  </span>
                  <span className="text-[11px] text-[var(--an-ink-2)] truncate">{g.country}</span>
                </div>
                <div className="col-span-5 flex items-center gap-2">
                  <div className="flex-1 h-3.5 bg-[var(--an-surface-2)] rounded-[1px] overflow-hidden">
                    <div
                      className="h-full bg-[var(--an-ink)] rounded-[1px]"
                      style={{ width: `${barPct}%`, opacity: 0.7 }}
                    />
                  </div>
                  <span className="an-mono text-[10px] text-[var(--an-ink)] shrink-0 hidden sm:block">
                    {formatCurrency(g.revenue, isUK ? 'uk' : 'pk')}
                  </span>
                </div>
                <div className="col-span-3 text-right">
                  <span className="an-mono text-[11px] text-[var(--an-ink)]">{g.count}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
