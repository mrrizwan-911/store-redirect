'use client'
// CustomerGrowthArea.tsx
import { useEffect, useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import type { DateRange } from '../AnalyticsDashboard'

interface Props {
  dateRange: DateRange
  lastUpdated: Date
}

export function CustomerGrowthArea({ dateRange, lastUpdated }: Props) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({
      start: dateRange.start.toISOString(),
      end: dateRange.end.toISOString(),
    })
    fetch(`/api/admin/analytics/customer-analytics?${params}`)
      .then(r => r.json())
      .then(res => { if (res.success) setData(res.data) })
      .finally(() => setLoading(false))
  }, [dateRange, lastUpdated])

  if (loading) {
    return (
      <div className="an-card">
        <div className="an-section-label">Customer Growth</div>
        <div className="w-full h-40 bg-[var(--an-surface-2)] animate-pulse rounded-[1px]" />
      </div>
    )
  }

  return (
    <div className="an-card">
      <div className="an-section-label">Customer Overview</div>

      {/* KPI pills */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
        {[
          { label: 'Total', value: data?.total ?? 0 },
          { label: 'New This Period', value: data?.newCount ?? 0 },
          { label: 'Churn Risk (90d)', value: data?.churnRisk ?? 0 },
        ].map(k => (
          <div key={k.label} className="text-center p-2 bg-[var(--an-surface-2)] rounded-[1px]">
            <div className="an-number text-xl text-[var(--an-ink)]">{k.value.toLocaleString()}</div>
            <div className="text-[10px] text-[var(--an-ink-3)] mt-0.5">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Loyalty points monthly */}
      {data?.loyaltyPointsMonthly?.length > 0 && (
        <div className="w-full h-36">
          <p className="text-[10px] text-[var(--an-ink-3)] mb-2 uppercase tracking-widest an-section-label !border-0 !pb-0 !mb-2">Points Issued vs Redeemed</p>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.loyaltyPointsMonthly} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--an-border)" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'var(--an-ink-3)', fontSize: 10 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--an-ink-3)', fontSize: 10 }} />
              <Tooltip
                contentStyle={{ background: 'white', border: '1px solid var(--an-ink)', borderRadius: 0, fontSize: '11px', fontFamily: 'DM Mono, monospace' }}
              />
              <Area type="monotone" dataKey="issued" stroke="var(--chart-pk)" fill="var(--chart-pk)" fillOpacity={0.1} strokeWidth={2} dot={false} name="Issued" />
              <Area type="monotone" dataKey="redeemed" stroke="var(--chart-warn)" fill="var(--chart-warn)" fillOpacity={0.1} strokeWidth={2} dot={false} name="Redeemed" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
