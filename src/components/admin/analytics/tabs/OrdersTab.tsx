'use client'

import { useEffect, useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { OrdersByRegionChart } from '../charts/OrdersByRegionChart'
import { OrderStatusDonut } from '../charts/OrderStatusDonut'
import type { DateRange, Region } from '../AnalyticsDashboard'
import { formatCurrency } from '@/lib/utils/currency'

interface Props {
  dateRange: DateRange
  region: Region
  compareEnabled: boolean
  compareStart: Date
  compareEnd: Date
  lastUpdated: Date
  params: URLSearchParams
}

function OrdersOverTimeChart({
  dateRange, region, lastUpdated
}: { dateRange: DateRange; region: Region; lastUpdated: Date }) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({
      start: dateRange.start.toISOString(),
      end: dateRange.end.toISOString(),
      region,
    })
    fetch(`/api/admin/analytics/orders-analytics?${params}`)
      .then(r => r.json())
      .then(res => { if (res.success) setData(res.data) })
      .finally(() => setLoading(false))
  }, [dateRange, region, lastUpdated])

  if (loading) {
    return (
      <div className="an-card">
        <div className="an-section-label">Orders Over Time</div>
        <div className="w-full h-48 bg-[var(--an-surface-2)] animate-pulse rounded-[1px]" />
      </div>
    )
  }

  const cancelRate = data?.cancelRate ?? 0
  const refundRate = data?.refundRate ?? 0

  return (
    <div className="an-card">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="an-section-label !border-0 !pb-0 !mb-0">Orders Over Time</div>
        <div className="flex items-center gap-4">
          <div className="text-center">
            <p className={`an-number text-lg font-semibold leading-none ${cancelRate > 10 ? 'text-[var(--chart-neg)]' : 'text-[var(--chart-warn)]'}`}>
              {cancelRate}%
            </p>
            <p className="text-[10px] text-[var(--an-ink-3)] mt-0.5">Cancel Rate</p>
          </div>
          <div className="text-center">
            <p className={`an-number text-lg font-semibold leading-none ${refundRate > 5 ? 'text-[var(--chart-neg)]' : 'text-[var(--an-ink-2)]'}`}>
              {refundRate}%
            </p>
            <p className="text-[10px] text-[var(--an-ink-3)] mt-0.5">Refund Rate</p>
          </div>
        </div>
      </div>

      {data?.ordersOverTime?.length > 0 ? (
        <div className="w-full h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.ordersOverTime} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--an-border)" />
              <XAxis
                dataKey="date"
                tickFormatter={v => {
                  const d = new Date(v)
                  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
                }}
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--an-ink-3)', fontSize: 10, fontFamily: 'DM Mono, monospace' }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--an-ink-3)', fontSize: 10, fontFamily: 'DM Mono, monospace' }}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  background: 'white',
                  border: '1px solid var(--an-ink)',
                  borderRadius: 0,
                  fontSize: '11px',
                  fontFamily: 'DM Mono, monospace',
                  padding: '6px 10px',
                }}
              />
              <Area
                type="monotone"
                dataKey="count"
                name="Orders"
                stroke="var(--an-ink)"
                fill="var(--an-ink)"
                fillOpacity={0.07}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 3, fill: 'var(--an-ink)', strokeWidth: 0 }}
                animationDuration={700}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-32">
          <div className="w-full h-px bg-[var(--an-border)]" />
          <p className="text-[11px] text-[var(--an-ink-3)] italic mt-3">No orders in this period</p>
        </div>
      )}
    </div>
  )
}

export function OrdersTab(props: Props) {
  const { dateRange, region, lastUpdated } = props

  return (
    <div className="space-y-4">
      <OrdersOverTimeChart dateRange={dateRange} region={region} lastUpdated={lastUpdated} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <OrdersByRegionChart dateRange={dateRange} lastUpdated={lastUpdated} />
        <OrderStatusDonut dateRange={dateRange} region={region} lastUpdated={lastUpdated} />
      </div>
    </div>
  )
}
