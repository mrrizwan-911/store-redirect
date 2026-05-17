'use client'

import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { formatCurrency } from '@/lib/utils/currency'
import type { DateRange, Region } from '../AnalyticsDashboard'

const METHOD_LABELS: Record<string, string> = {
  COD: 'Cash on Delivery',
  EASYPAISA: 'EasyPaisa',
  CARD: 'Card',
  BANK_TRANSFER: 'Bank Transfer',
  // JAZZCASH intentionally omitted
}

interface Props {
  dateRange: DateRange
  region: Region
  lastUpdated: Date
}

export function PaymentMethodBar({ dateRange, region, lastUpdated }: Props) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    setLoading(true)
    setError(false)

    const params = new URLSearchParams({
      start: dateRange.start.toISOString(),
      end: dateRange.end.toISOString(),
      region,
    })

    fetch(`/api/admin/analytics/financial-summary?${params}`)
      .then(r => r.json())
      .then(res => {
        if (res.success) {
          // Filter out JAZZCASH
          const filtered = (res.data.byPaymentMethod || []).filter(
            (m: any) => m.method !== 'JAZZCASH'
          )
          setData(filtered)
        } else setError(true)
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [dateRange, region, lastUpdated])

  if (loading) {
    return (
      <div className="an-card h-full">
        <div className="an-section-label">Payment Method Breakdown</div>
        <div className="w-full h-40 bg-gradient-to-r from-[var(--an-surface-2)] to-[var(--an-border)] animate-pulse rounded-[1px]" />
      </div>
    )
  }

  if (error || !data.length) {
    return (
      <div className="an-card h-full">
        <div className="an-section-label">Payment Method Breakdown</div>
        <div className="flex flex-col items-center justify-center h-32">
          <div className="w-full h-px bg-[var(--an-border)]" />
          <p className="text-[11px] text-[var(--an-ink-3)] italic mt-3">No payment data</p>
        </div>
      </div>
    )
  }

  const total = data.reduce((s: number, d: any) => s + d.revenue, 0)
  const chartRegion = region === 'uk' ? 'uk' : 'pk'

  return (
    <div className="an-card h-full">
      <div className="an-section-label">Payment Method Breakdown</div>

      <div className="space-y-3">
        {data.map((item: any, idx: number) => {
          const pct = total > 0 ? Math.round((item.revenue / total) * 100) : 0
          return (
            <div key={item.method}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] text-[var(--an-ink-2)]">
                  {METHOD_LABELS[item.method] || item.method}
                </span>
                <span className="an-mono text-[11px] text-[var(--an-ink)]">
                  {formatCurrency(item.revenue, chartRegion)} · {pct}%
                </span>
              </div>
              <div className="w-full h-5 bg-[var(--an-surface-2)] rounded-[1px] overflow-hidden">
                <div
                  className="h-full bg-[var(--an-ink)] rounded-[1px] transition-all"
                  style={{ width: `${pct}%`, opacity: 1 - idx * 0.12 }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
