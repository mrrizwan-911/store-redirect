'use client'

import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { formatCurrency, chartCurrencyFormatter } from '@/lib/utils/currency'
import type { DateRange, Region } from '../AnalyticsDashboard'

interface Props {
  dateRange: DateRange
  region: Region
  lastUpdated: Date
}

export function FinancialSummaryPanel({ dateRange, region, lastUpdated }: Props) {
  const [data, setData] = useState<any>(null)
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
        if (res.success) setData(res.data)
        else setError(true)
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [dateRange, region, lastUpdated])

  const chartRegion = region === 'uk' ? 'uk' : 'pk'

  if (loading) {
    return (
      <div className="an-card">
        <div className="an-section-label">Financial Summary</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-16 bg-[var(--an-surface-2)] animate-pulse rounded-[1px]" />
          ))}
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="an-card bg-[#FFF8F0] border-l-[3px] border-l-[var(--chart-warn)]">
        <p className="text-[12px] text-[var(--chart-warn)]">Could not load financial summary</p>
      </div>
    )
  }

  const summaryKpis = [
    { label: 'Gross Revenue', value: formatCurrency(data.grossRevenue, chartRegion), color: 'var(--chart-pos)' },
    { label: 'Total Discounts', value: `−${formatCurrency(data.totalDiscounts, chartRegion)}`, color: 'var(--chart-warn)' },
    { label: 'Total Refunds', value: `−${formatCurrency(data.totalRefunds, chartRegion)}`, color: 'var(--chart-neg)' },
    { label: 'Net Revenue', value: formatCurrency(data.netRevenue, chartRegion), color: 'var(--an-ink)', bold: true },
  ]

  return (
    <div className="an-card">
      <div className="an-section-label">Financial Summary</div>

      {/* P&L pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {summaryKpis.map(k => (
          <div key={k.label} className="p-3 bg-[var(--an-surface-2)] rounded-[1px]">
            <p className="text-[10px] text-[var(--an-ink-3)] uppercase tracking-wide mb-1">{k.label}</p>
            <p
              className={`an-number text-base sm:text-lg leading-none ${k.bold ? 'font-semibold' : 'font-medium'}`}
              style={{ color: k.color }}
            >
              {k.value}
            </p>
          </div>
        ))}
      </div>

      {/* Monthly P&L bar chart */}
      {data.monthlyPL?.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-widest text-[var(--an-ink-3)] mb-3">Monthly P&L</p>
          <div className="w-full h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.monthlyPL} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--an-border)" />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'var(--an-ink-3)', fontSize: 10, fontFamily: 'DM Mono, monospace' }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'var(--an-ink-3)', fontSize: 10, fontFamily: 'DM Mono, monospace' }}
                  tickFormatter={v => chartCurrencyFormatter(v, chartRegion)}
                  width={55}
                />
                <Tooltip
                  contentStyle={{
                    background: 'white',
                    border: '1px solid var(--an-ink)',
                    borderRadius: 0,
                    fontSize: '11px',
                    fontFamily: 'DM Mono, monospace',
                    padding: '8px 12px',
                  }}
                  formatter={(value, name) => {
                    const nameStr = typeof name === 'string' ? name : '';
                    return [
                      formatCurrency(Number(value), chartRegion),
                      nameStr.charAt(0).toUpperCase() + nameStr.slice(1),
                    ];
                  }}
                />
                <Legend
                  iconType="square"
                  iconSize={8}
                  wrapperStyle={{ fontSize: '11px', fontFamily: 'DM Mono, monospace', color: 'var(--an-ink-2)' }}
                />
                <Bar dataKey="gross" name="Gross" fill="var(--chart-pos)" radius={[1, 1, 0, 0]} maxBarSize={28} fillOpacity={0.85} />
                <Bar dataKey="discounts" name="Discounts" fill="var(--chart-warn)" radius={[1, 1, 0, 0]} maxBarSize={28} fillOpacity={0.85} />
                <Bar dataKey="refunds" name="Refunds" fill="var(--chart-neg)" radius={[1, 1, 0, 0]} maxBarSize={28} fillOpacity={0.85} />
                <Bar dataKey="net" name="Net" fill="var(--an-ink)" radius={[1, 1, 0, 0]} maxBarSize={28} fillOpacity={0.9} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  )
}
