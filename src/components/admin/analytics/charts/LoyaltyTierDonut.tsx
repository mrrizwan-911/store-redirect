'use client'

import { useEffect, useState } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import type { DateRange } from '../AnalyticsDashboard'

const TIER_COLORS: Record<string, string> = {
  BRONZE:   '#92400E',
  SILVER:   '#6B7280',
  GOLD:     '#B45309',
  PLATINUM: '#1A3A6B',
}

const TIER_LABELS: Record<string, string> = {
  BRONZE:   'Bronze',
  SILVER:   'Silver',
  GOLD:     'Gold',
  PLATINUM: 'Platinum',
}

interface Props {
  dateRange: DateRange
  lastUpdated: Date
}

export function LoyaltyTierDonut({ dateRange, lastUpdated }: Props) {
  const [tiers, setTiers] = useState<{ tier: string; count: number }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({
      start: dateRange.start.toISOString(),
      end: dateRange.end.toISOString(),
    })
    fetch(`/api/admin/analytics/customer-analytics?${params}`)
      .then(r => r.json())
      .then(res => { if (res.success) setTiers(res.data.byTier || []) })
      .finally(() => setLoading(false))
  }, [dateRange, lastUpdated])

  const total = tiers.reduce((s, t) => s + t.count, 0)

  if (loading) {
    return (
      <div className="an-card h-full">
        <div className="an-section-label">Loyalty Tiers</div>
        <div className="flex justify-center">
          <div className="w-28 h-28 rounded-full bg-[var(--an-surface-2)] animate-pulse" />
        </div>
      </div>
    )
  }

  if (!tiers.length) {
    return (
      <div className="an-card h-full">
        <div className="an-section-label">Loyalty Tiers</div>
        <div className="flex flex-col items-center justify-center h-24">
          <div className="w-full h-px bg-[var(--an-border)]" />
          <p className="text-[11px] text-[var(--an-ink-3)] italic mt-3">No loyalty data</p>
        </div>
      </div>
    )
  }

  return (
    <div className="an-card h-full">
      <div className="an-section-label">Loyalty Tiers</div>

      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="w-32 h-32 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={tiers}
                cx="50%"
                cy="50%"
                innerRadius={44}
                outerRadius={60}
                paddingAngle={3}
                dataKey="count"
                nameKey="tier"
                animationDuration={700}
              >
                {tiers.map(t => (
                  <Cell
                    key={t.tier}
                    fill={TIER_COLORS[t.tier] || '#1A1714'}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: 'white',
                  border: '1px solid var(--an-ink)',
                  borderRadius: 0,
                  fontFamily: 'DM Mono, monospace',
                  fontSize: '11px',
                  padding: '6px 10px',
                }}
                formatter={(value, name) => {
                  const val = typeof value === 'number' ? value : 0;
                  const nameStr = typeof name === 'string' ? name : '';
                  return [
                    `${val} (${total > 0 ? Math.round((val / total) * 100) : 0}%)`,
                    TIER_LABELS[nameStr] || nameStr,
                  ];
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex-1 w-full space-y-2">
          {tiers.map(t => (
            <div key={t.tier} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: TIER_COLORS[t.tier] || '#1A1714' }}
                />
                <span className="text-[11px] text-[var(--an-ink-2)]">
                  {TIER_LABELS[t.tier] || t.tier}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="an-mono text-[11px] text-[var(--an-ink)]">{t.count}</span>
                <span className="an-mono text-[10px] text-[var(--an-ink-3)]">
                  {total > 0 ? `${Math.round((t.count / total) * 100)}%` : '0%'}
                </span>
              </div>
            </div>
          ))}
          <div className="pt-1 border-t border-[var(--an-border)] flex items-center justify-between">
            <span className="text-[10px] text-[var(--an-ink-3)] uppercase tracking-wide">Total</span>
            <span className="an-mono text-[12px] font-semibold text-[var(--an-ink)]">{total.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
