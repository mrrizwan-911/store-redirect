'use client'

import { useEffect, useState } from 'react'
import {
  ComposedChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts'
import { chartCurrencyFormatter } from '@/lib/utils/currency'
import type { Region, DateRange } from '../AnalyticsDashboard'

interface Props {
  dateRange: DateRange
  region: Region
  lastUpdated: Date
}

const SERIES = [
  { key: 'pk', label: '🇵🇰 Pakistan', color: 'var(--chart-pk)' },
  { key: 'uk', label: '🇬🇧 UK', color: 'var(--chart-uk)' },
  { key: 'global', label: '🌐 Global', color: 'var(--chart-global)' },
]

function formatDate(dateStr: string, granularity: string): string {
  const d = new Date(dateStr)
  if (granularity === 'month') {
    return d.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' })
  }
  if (granularity === 'week') {
    return `W${getWeekNumber(d)}`
  }
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function getWeekNumber(d: Date): number {
  const jan1 = new Date(d.getFullYear(), 0, 1)
  return Math.ceil(((d.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7)
}

export function RevenueSeriesChart({ dateRange, region, lastUpdated }: Props) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [granularity, setGranularity] = useState<'day' | 'week' | 'month'>('day')
  const [hiddenSeries, setHiddenSeries] = useState<Set<string>>(new Set())

  useEffect(() => {
    setLoading(true)
    setError(false)

    const params = new URLSearchParams({
      start: dateRange.start.toISOString(),
      end: dateRange.end.toISOString(),
      granularity,
      region,
    })

    fetch(`/api/admin/analytics/revenue-series?${params}`)
      .then(r => r.json())
      .then(res => {
        if (res.success) setData(res.data)
        else setError(true)
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [dateRange, region, granularity, lastUpdated])

  const toggleSeries = (key: string) => {
    setHiddenSeries(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  if (loading) {
    return (
      <div className="an-card">
        <div className="an-section-label">Revenue Over Time</div>
        <div className="w-full h-64 bg-gradient-to-r from-[var(--an-surface-2)] via-[var(--an-border)] to-[var(--an-surface-2)] animate-pulse rounded-[2px]" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="an-card bg-[#FFF8F0] border-l-[3px] border-l-[var(--chart-warn)]">
        <p className="text-[12px] text-[var(--chart-warn)] font-medium">Could not load Revenue Over Time</p>
        <button onClick={() => setLoading(true)} className="text-[11px] underline text-[var(--an-ink-3)] mt-1">Try Again</button>
      </div>
    )
  }

  const isEmpty = !data || data.length === 0

  return (
    <div className="an-card">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="an-section-label !border-0 !pb-0 !mb-0">Revenue Over Time</div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Series toggles */}
          <div className="flex items-center gap-2 flex-wrap">
            {SERIES.map(s => (
              <button
                key={s.key}
                onClick={() => toggleSeries(s.key)}
                className={`flex items-center gap-1.5 text-[11px] transition-opacity ${hiddenSeries.has(s.key) ? 'opacity-30' : 'opacity-100'}`}
              >
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                {s.label}
              </button>
            ))}
          </div>

          {/* Granularity toggle */}
          <div className="flex items-center border border-[var(--an-border)] rounded-[2px] overflow-hidden">
            {(['day', 'week', 'month'] as const).map(g => (
              <button
                key={g}
                onClick={() => setGranularity(g)}
                className={`px-2.5 py-1 text-[10px] capitalize transition-colors ${
                  granularity === g
                    ? 'bg-[var(--an-ink)] text-white'
                    : 'text-[var(--an-ink-3)] hover:bg-[var(--an-surface-2)]'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center h-48 gap-2">
          <div className="w-full h-px bg-[var(--an-border)]" />
          <p className="text-[11px] text-[var(--an-ink-3)] italic">No revenue data for this period</p>
        </div>
      ) : (
        <div className="w-full h-64">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--an-border)" />
              <XAxis
                dataKey="date"
                tickFormatter={(v) => formatDate(v, granularity)}
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--an-ink-3)', fontSize: 11, fontFamily: 'DM Mono, monospace' }}
                dy={8}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--an-ink-3)', fontSize: 11, fontFamily: 'DM Mono, monospace' }}
                tickFormatter={(v) => chartCurrencyFormatter(v, region === 'all' ? 'pk' : region)}
                width={60}
              />
              <Tooltip
                contentStyle={{
                  background: 'white',
                  border: '1px solid var(--an-ink)',
                  borderRadius: '0px',
                  fontFamily: 'DM Mono, monospace',
                  fontSize: '11px',
                  padding: '8px 12px',
                }}
                labelFormatter={(v) => formatDate(v as string, granularity)}
                formatter={(value, name) => {
                  const nameStr = typeof name === 'string' ? name : '';
                  return [
                    `${chartCurrencyFormatter(Number(value), nameStr === 'uk' ? 'uk' : 'pk')}`,
                    nameStr === 'pk' ? '🇵🇰 Pakistan' : nameStr === 'uk' ? '🇬🇧 UK' : '🌐 Global',
                  ];
                }}
              />
              {SERIES.map(s => !hiddenSeries.has(s.key) && (
                <Area
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  stroke={s.color}
                  fill={s.color}
                  fillOpacity={0.08}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: s.color, strokeWidth: 0 }}
                  animationDuration={800}
                />
              ))}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
