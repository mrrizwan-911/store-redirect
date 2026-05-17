'use client'

import { useEffect, useState } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Legend
} from 'recharts'
import { formatCurrency } from '@/lib/utils/currency'
import type { DateRange, Region } from '../AnalyticsDashboard'

interface Props {
  dateRange: DateRange
  region: Region
  compareEnabled: boolean
  compareStart: Date
  compareEnd: Date
  lastUpdated: Date
  params: URLSearchParams
}

function useMarketingData(dateRange: DateRange, lastUpdated: Date) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    setLoading(true)
    setError(false)
    const params = new URLSearchParams({
      start: dateRange.start.toISOString(),
      end:   dateRange.end.toISOString(),
    })
    fetch(`/api/admin/analytics/marketing-analytics?${params}`)
      .then(r => r.json())
      .then(res => { if (res.success) setData(res.data); else setError(true) })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [dateRange, lastUpdated])

  return { data, loading, error }
}

export function MarketingTab({ dateRange, region, lastUpdated }: Props) {
  const { data, loading, error } = useMarketingData(dateRange, lastUpdated)

  if (error) {
    return (
      <div className="an-card bg-[#FFF8F0] border-l-[3px] border-l-[var(--chart-warn)]">
        <p className="text-[12px] text-[var(--chart-warn)]">Could not load marketing data</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Subscriber KPIs */}
      <div className="an-card">
        <div className="an-section-label">Email Subscribers</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Active',   value: data?.subscribers  ?? 0 },
            { label: 'New This Period', value: data?.newCount     ?? 0 },
            { label: 'Unsubscribed',   value: data?.unsubscribed ?? 0 },
            { label: 'Sources',        value: data?.bySource?.length ?? 0 },
          ].map(k => (
            <div key={k.label} className="p-3 bg-[var(--an-surface-2)] rounded-[1px] text-center">
              {loading ? (
                <div className="h-6 bg-[var(--an-border)] animate-pulse rounded-[1px] mb-1" />
              ) : (
                <div className="an-number text-xl font-semibold text-[var(--an-ink)] leading-none">
                  {k.value.toLocaleString()}
                </div>
              )}
              <div className="text-[10px] text-[var(--an-ink-3)] mt-1">{k.label}</div>
            </div>
          ))}
        </div>

        {/* Subscriber by source */}
        {!loading && data?.bySource?.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-[10px] uppercase tracking-widest text-[var(--an-ink-3)] mb-2">By Source</p>
            {data.bySource.map((s: any) => {
              const total = data.bySource.reduce((acc: number, x: any) => acc + x.count, 0)
              const pct = total > 0 ? Math.round((s.count / total) * 100) : 0
              return (
                <div key={s.source} className="flex items-center gap-3">
                  <span className="text-[11px] text-[var(--an-ink-2)] w-24 truncate shrink-0">{s.source}</span>
                  <div className="flex-1 h-4 bg-[var(--an-surface-2)] rounded-[1px] overflow-hidden">
                    <div
                      className="h-full bg-[var(--an-ink)] rounded-[1px]"
                      style={{ width: `${pct}%`, opacity: 0.75 }}
                    />
                  </div>
                  <span className="an-mono text-[11px] text-[var(--an-ink)] w-16 text-right shrink-0">
                    {s.count.toLocaleString()} · {pct}%
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Subscriber growth */}
      {!loading && data?.growth?.length > 0 && (
        <div className="an-card">
          <div className="an-section-label">Subscriber Growth (Cumulative)</div>
          <div className="w-full h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.growth} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--an-border)" />
                <XAxis
                  dataKey="date"
                  tickFormatter={v => {
                    const d = new Date(v)
                    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
                  }}
                  axisLine={false} tickLine={false}
                  tick={{ fill: 'var(--an-ink-3)', fontSize: 10, fontFamily: 'DM Mono, monospace' }}
                />
                <YAxis
                  axisLine={false} tickLine={false}
                  tick={{ fill: 'var(--an-ink-3)', fontSize: 10, fontFamily: 'DM Mono, monospace' }}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    background: 'white', border: '1px solid var(--an-ink)',
                    borderRadius: 0, fontSize: '11px', fontFamily: 'DM Mono, monospace',
                  }}
                  formatter={(v: any) => [v.toLocaleString(), 'Subscribers']}
                />
                <Area
                  type="monotone" dataKey="cumulative" name="Subscribers"
                  stroke="var(--chart-pk)" fill="var(--chart-pk)" fillOpacity={0.08}
                  strokeWidth={2} dot={false}
                  activeDot={{ r: 3, fill: 'var(--chart-pk)', strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Email logs */}
      {!loading && data?.emailLogs?.length > 0 && (
        <div className="an-card">
          <div className="an-section-label">Email Campaign Performance</div>
          <div className="w-full overflow-x-auto -mx-4 sm:mx-0">
            <table className="min-w-[480px] w-full">
              <thead>
                <tr className="border-b border-[var(--an-border)]">
                  {['Type', 'Sent', 'Opened', 'Open Rate', 'Clicked', 'CTR'].map(h => (
                    <th key={h} className="text-left py-2 px-2 text-[10px] uppercase tracking-widest text-[var(--an-ink-3)]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.emailLogs.map((e: any) => {
                  const openRate = e.sent > 0 ? Math.round((e.opened / e.sent) * 100) : 0
                  const ctr      = e.sent > 0 ? Math.round((e.clicked / e.sent) * 100) : 0
                  return (
                    <tr key={e.type} className="border-b border-[var(--an-border)] hover:bg-[var(--an-surface-2)] transition-colors">
                      <td className="py-2.5 px-2 text-[12px] text-[var(--an-ink-2)] capitalize">{e.type.replace(/_/g, ' ').toLowerCase()}</td>
                      <td className="py-2.5 px-2 an-mono text-[12px] text-[var(--an-ink)]">{e.sent.toLocaleString()}</td>
                      <td className="py-2.5 px-2 an-mono text-[12px] text-[var(--an-ink)]">{e.opened.toLocaleString()}</td>
                      <td className="py-2.5 px-2 an-mono text-[12px]">
                        <span className={openRate >= 20 ? 'text-[var(--chart-pos)]' : openRate >= 10 ? 'text-[var(--chart-warn)]' : 'text-[var(--chart-neg)]'}>
                          {openRate}%
                        </span>
                      </td>
                      <td className="py-2.5 px-2 an-mono text-[12px] text-[var(--an-ink)]">{e.clicked.toLocaleString()}</td>
                      <td className="py-2.5 px-2 an-mono text-[12px]">
                        <span className={ctr >= 5 ? 'text-[var(--chart-pos)]' : ctr >= 2 ? 'text-[var(--chart-warn)]' : 'text-[var(--chart-neg)]'}>
                          {ctr}%
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Coupon performance */}
      <div className="an-card">
        <div className="an-section-label">Coupon Performance</div>
        {loading ? (
          <div className="space-y-2">
            {[1,2,3].map(i => <div key={i} className="h-8 bg-[var(--an-surface-2)] animate-pulse rounded-[1px]" />)}
          </div>
        ) : !data?.couponPerformance?.length ? (
          <div className="flex flex-col items-center justify-center h-20">
            <div className="w-full h-px bg-[var(--an-border)]" />
            <p className="text-[11px] text-[var(--an-ink-3)] italic mt-3">No coupon usage in this period</p>
          </div>
        ) : (
          <div className="w-full overflow-x-auto -mx-4 sm:mx-0">
            <table className="min-w-[520px] w-full">
              <thead>
                <tr className="border-b border-[var(--an-border)]">
                  {['Code', 'Discount', 'Uses', 'Revenue Impact', 'Discount Given'].map(h => (
                    <th key={h} className="text-left py-2 px-2 text-[10px] uppercase tracking-widest text-[var(--an-ink-3)]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.couponPerformance.map((c: any) => {
                  const chartRegion = region === 'uk' ? 'uk' : 'pk'
                  return (
                    <tr key={c.code} className="border-b border-[var(--an-border)] hover:bg-[var(--an-surface-2)] transition-colors">
                      <td className="py-2.5 px-2 an-mono text-[12px] text-[var(--an-ink)] font-medium">{c.code}</td>
                      <td className="py-2.5 px-2 an-mono text-[12px] text-[var(--chart-warn)]">
                        {c.discountPct ? `${c.discountPct}%` : formatCurrency(c.discountFlat, chartRegion)}
                      </td>
                      <td className="py-2.5 px-2 an-mono text-[12px] text-[var(--an-ink)]">{c.uses}</td>
                      <td className="py-2.5 px-2 an-mono text-[12px] text-[var(--chart-pos)]">
                        {formatCurrency(c.revenueImpact, chartRegion)}
                      </td>
                      <td className="py-2.5 px-2 an-mono text-[12px] text-[var(--chart-neg)]">
                        −{formatCurrency(c.discountGiven, chartRegion)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
