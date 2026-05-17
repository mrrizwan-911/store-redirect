'use client'

import { useEffect, useState } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import type { DateRange, Region } from '../AnalyticsDashboard'

const STATUS_COLORS: Record<string, string> = {
  PENDING: '#B45309',
  CONFIRMED: '#1A6B3C',
  PROCESSING: '#1A3A6B',
  SHIPPED: '#5B21B6',
  DELIVERED: '#1A1714',
  CANCELLED: '#B91C1C',
  REFUNDED: '#6B1A1A',
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  PROCESSING: 'Processing',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  REFUNDED: 'Refunded',
}

interface Props {
  dateRange: DateRange
  region: Region
  lastUpdated: Date
}

export function OrderStatusDonut({ dateRange, region, lastUpdated }: Props) {
  const [data, setData] = useState<{ status: string; count: number }[]>([])
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

    fetch(`/api/admin/analytics/orders-analytics?${params}`)
      .then(r => r.json())
      .then(res => {
        if (res.success) setData(res.data.byStatus || [])
        else setError(true)
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [dateRange, region, lastUpdated])

  const total = data.reduce((s, d) => s + d.count, 0)

  if (loading) {
    return (
      <div className="an-card h-full">
        <div className="an-section-label">Order Status</div>
        <div className="flex justify-center">
          <div className="w-32 h-32 rounded-full bg-gradient-to-r from-[var(--an-surface-2)] to-[var(--an-border)] animate-pulse" />
        </div>
      </div>
    )
  }

  if (error || !data.length) {
    return (
      <div className="an-card h-full">
        <div className="an-section-label">Order Status</div>
        <div className="flex flex-col items-center justify-center h-32">
          <div className="w-full h-px bg-[var(--an-border)]" />
          <p className="text-[11px] text-[var(--an-ink-3)] italic mt-3">No order data</p>
        </div>
      </div>
    )
  }

  return (
    <div className="an-card h-full">
      <div className="an-section-label">Order Status</div>

      <div className="flex flex-col sm:flex-row gap-4 items-center">
        {/* Donut */}
        <div className="w-36 h-36 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={46}
                outerRadius={66}
                paddingAngle={2}
                dataKey="count"
                nameKey="status"
                animationDuration={800}
              >
                {data.map((entry) => (
                  <Cell
                    key={entry.status}
                    fill={STATUS_COLORS[entry.status] || '#1A1714'}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: 'white',
                  border: '1px solid var(--an-ink)',
                  borderRadius: '0px',
                  fontFamily: 'DM Mono, monospace',
                  fontSize: '11px',
                  padding: '6px 10px',
                }}
                formatter={(value, name) => {
                  const val = typeof value === 'number' ? value : 0;
                  const nameStr = typeof name === 'string' ? name : '';
                  return [
                    `${val} (${total > 0 ? Math.round((val / total) * 100) : 0}%)`,
                    STATUS_LABELS[nameStr] || nameStr,
                  ];
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-1.5 w-full">
          {data.map(d => (
            <div key={d.status} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: STATUS_COLORS[d.status] || '#1A1714' }}
                />
                <span className="text-[11px] text-[var(--an-ink-2)] truncate">
                  {STATUS_LABELS[d.status] || d.status}
                </span>
              </div>
              <span className="an-mono text-[11px] text-[var(--an-ink)] shrink-0">
                {d.count}
              </span>
            </div>
          ))}
          <div className="pt-1 border-t border-[var(--an-border)] flex items-center justify-between">
            <span className="text-[10px] text-[var(--an-ink-3)] uppercase tracking-wide">Total</span>
            <span className="an-mono text-[12px] font-semibold text-[var(--an-ink)]">{total}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
