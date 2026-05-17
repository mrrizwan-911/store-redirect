'use client'

import { useEffect, useState } from 'react'
import { KpiCard } from './KpiCard'
import { formatCurrency } from '@/lib/utils/currency'
import type { Region, DateRange } from '../AnalyticsDashboard'

interface Props {
  dateRange: DateRange
  region: Region
  compareEnabled: boolean
  compareStart: Date
  compareEnd: Date
  lastUpdated: Date
}

export function KpiRow({ dateRange, region, compareEnabled, compareStart, compareEnd, lastUpdated }: Props) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    setLoading(true)
    setError(false)

    const params = new URLSearchParams({
      start: dateRange.start.toISOString(),
      end: dateRange.end.toISOString(),
      compareStart: compareStart.toISOString(),
      compareEnd: compareEnd.toISOString(),
      region,
    })

    fetch(`/api/admin/analytics/kpi-summary?${params}`)
      .then(r => r.json())
      .then(res => {
        if (res.success) setData(res.data)
        else setError(true)
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [dateRange, region, compareStart, compareEnd, lastUpdated])

  if (error) {
    return (
      <div className="an-card bg-[#FFF8F0] border-l-[3px] border-l-[var(--chart-warn)]">
        <p className="text-[12px] text-[var(--chart-warn)]">Could not load KPI data.</p>
      </div>
    )
  }

  const trendLabel = `vs prior ${dateRange.label.toLowerCase()}`

  const cards = [
    {
      label: 'Total Revenue',
      value: data ? formatCurrency(data.revenue.current, region === 'all' ? 'pk' : region) : '—',
      trend: data && compareEnabled ? { pct: data.revenue.changePct, label: trendLabel } : undefined,
      tooltip: 'Sum of all completed payments in the selected period and region',
    },
    {
      label: 'Total Orders',
      value: data ? data.orders.current.toLocaleString() : '—',
      trend: data && compareEnabled ? { pct: data.orders.changePct, label: trendLabel } : undefined,
      tooltip: 'All orders regardless of status, in the selected period',
    },
    {
      label: 'Avg Order Value',
      value: data ? formatCurrency(data.aov.current, region === 'all' ? 'pk' : region) : '—',
      trend: data && compareEnabled ? { pct: data.aov.changePct, label: trendLabel } : undefined,
      tooltip: 'Average order value = Total revenue ÷ Total completed orders',
    },
    {
      label: 'New Customers',
      value: data ? data.newCustomers.current.toLocaleString() : '—',
      trend: data && compareEnabled ? { pct: data.newCustomers.changePct, label: trendLabel } : undefined,
      tooltip: 'Users who created an account in the selected period',
    },
    {
      label: 'Repeat Rate',
      value: data ? `${data.repeatRate.current}%` : '—',
      trend: undefined,
      tooltip: '% of customers who placed more than one order ever',
    },
    {
      label: 'Cart Abandon Rate',
      value: data ? `${data.cartAbandonRate.current}%` : '—',
      trend: undefined,
      tooltip: 'Carts with items that were idle for more than 60 minutes',
    },
    {
      label: 'Active Orders',
      value: data ? data.activeOrders.toLocaleString() : '—',
      trend: undefined,
      tooltip: 'Orders currently in Pending, Confirmed, Processing, or Shipped status',
    },
  ]

  return (
    <div
      className="an-kpi-grid grid gap-3"
      style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}
    >
      {cards.map((card, i) => (
        <KpiCard
          key={i}
          label={card.label}
          value={loading ? '—' : card.value}
          trend={card.trend}
          tooltip={card.tooltip}
          loading={loading}
        />
      ))}
    </div>
  )
}
