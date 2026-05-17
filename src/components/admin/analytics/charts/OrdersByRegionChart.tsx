'use client'

import { useEffect, useState } from 'react'
import { formatCurrency } from '@/lib/utils/currency'
import type { DateRange } from '../AnalyticsDashboard'
import { useRouter } from 'next/navigation'

const REGION_COLORS: Record<string, string> = {
  pk: 'var(--chart-pk)',
  uk: 'var(--chart-uk)',
  global: 'var(--chart-global)',
}

const REGION_FLAGS: Record<string, string> = {
  pk: '🇵🇰 Pakistan',
  uk: '🇬🇧 United Kingdom',
  global: '🌐 Global',
}

interface Props {
  dateRange: DateRange
  lastUpdated: Date
}

export function OrdersByRegionChart({ dateRange, lastUpdated }: Props) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setLoading(true)
    setError(false)

    const params = new URLSearchParams({
      start: dateRange.start.toISOString(),
      end: dateRange.end.toISOString(),
    })

    fetch(`/api/admin/analytics/orders-by-region?${params}`)
      .then(r => r.json())
      .then(res => {
        if (res.success) setData(res.data)
        else setError(true)
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [dateRange, lastUpdated])

  if (loading) {
    return (
      <div className="an-card h-full">
        <div className="an-section-label">Orders by Region</div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-8 bg-gradient-to-r from-[var(--an-surface-2)] to-[var(--an-border)] animate-pulse rounded-[1px]" style={{ width: `${90 - i * 20}%` }} />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="an-card bg-[#FFF8F0] border-l-[3px] border-l-[var(--chart-warn)]">
        <p className="text-[12px] text-[var(--chart-warn)]">Could not load Orders by Region</p>
      </div>
    )
  }

  const maxCount = Math.max(...data.map(d => d.count), 1)
  const fastestGrowing = data.find(d => d.region === 'uk')
  const highestAov = [...data].sort((a, b) => b.avgOrderValue - a.avgOrderValue)[0]
  const mostOrders = [...data].sort((a, b) => b.count - a.count)[0]

  return (
    <div className="an-card h-full">
      <div className="an-section-label">Orders by Region</div>

      {data.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-32">
          <div className="w-full h-px bg-[var(--an-border)]" />
          <p className="text-[11px] text-[var(--an-ink-3)] italic mt-3">No orders in this period</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.map((row) => (
            <button
              key={row.region}
              onClick={() => router.push(`/d8f2a1/admin/orders?region=${row.region}`)}
              className="w-full text-left group"
              title={`View ${row.region.toUpperCase()} orders`}
            >
              <div className="flex items-center gap-3 mb-1">
                <span className="text-[12px] text-[var(--an-ink-2)] w-28 shrink-0 group-hover:text-[var(--an-ink)] transition-colors">
                  {REGION_FLAGS[row.region] || row.region.toUpperCase()}
                </span>
                <div className="flex-1 h-6 bg-[var(--an-surface-2)] rounded-[1px] overflow-hidden">
                  <div
                    className="h-full rounded-[1px] transition-all"
                    style={{
                      width: `${(row.count / maxCount) * 100}%`,
                      backgroundColor: REGION_COLORS[row.region] || 'var(--an-ink)',
                    }}
                  />
                </div>
                <span className="an-mono text-[12px] text-[var(--an-ink)] w-8 text-right shrink-0">
                  {row.count}
                </span>
              </div>
              <div className="pl-[calc(7rem+12px)] text-[10px] text-[var(--an-ink-3)] an-mono">
                {formatCurrency(row.revenue, row.region === 'uk' ? 'uk' : 'pk')} ·
                AOV {formatCurrency(row.avgOrderValue, row.region === 'uk' ? 'uk' : 'pk')}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Callout pills */}
      {data.length > 0 && (
        <div className="mt-4 pt-4 border-t border-[var(--an-border)] grid grid-cols-1 sm:grid-cols-3 gap-2">
          {mostOrders && (
            <div className="text-[10px] text-[var(--an-ink-3)]">
              <span className="text-[var(--an-ink-2)] font-medium">Most Orders</span><br />
              {REGION_FLAGS[mostOrders.region] || mostOrders.region} ({mostOrders.count})
            </div>
          )}
          {highestAov && (
            <div className="text-[10px] text-[var(--an-ink-3)]">
              <span className="text-[var(--an-ink-2)] font-medium">Highest AOV</span><br />
              {REGION_FLAGS[highestAov.region] || highestAov.region} · {formatCurrency(highestAov.avgOrderValue, highestAov.region === 'uk' ? 'uk' : 'pk')}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
