'use client'

import { useState } from 'react'
import { Info } from 'lucide-react'

export interface KpiCardProps {
  label: string
  value: string | number
  subValue?: string
  trend?: { pct: number; label: string }
  tooltip?: string
  loading?: boolean
}

export function KpiCard({ label, value, subValue, trend, tooltip, loading }: KpiCardProps) {
  const [showTip, setShowTip] = useState(false)
  const trendPositive = (trend?.pct ?? 0) >= 0

  if (loading) {
    return (
      <div className="an-card border-l-[3px] border-l-[var(--an-border-strong)] h-[112px] animate-pulse">
        <div className="h-2.5 bg-[var(--an-surface-2)] rounded w-24 mb-3" />
        <div className="h-8 bg-[var(--an-surface-2)] rounded w-32 mb-2" />
        <div className="h-2 bg-[var(--an-surface-2)] rounded w-20" />
      </div>
    )
  }

  return (
    <div className="an-card border-l-[3px] border-l-[var(--an-ink)] h-auto min-h-[112px] flex flex-col justify-between gap-1">
      {/* Label row */}
      <div className="flex items-center justify-between gap-1">
        <span className="an-section-label !border-0 !pb-0 !mb-0 !text-[10px] leading-none">
          {label}
        </span>
        {tooltip && (
          <div className="relative">
            <button
              onMouseEnter={() => setShowTip(true)}
              onMouseLeave={() => setShowTip(false)}
              className="text-[var(--an-ink-3)] hover:text-[var(--an-ink-2)] transition-colors"
            >
              <Info className="w-3 h-3" />
            </button>
            {showTip && (
              <div className="absolute right-0 top-5 w-52 bg-white border border-[var(--an-ink)] text-[11px] text-[var(--an-ink-2)] p-2.5 z-50 shadow-sm leading-relaxed rounded-[2px]">
                {tooltip}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main value */}
      <p className="an-number text-2xl sm:text-[28px] font-semibold text-[var(--an-ink)] leading-none">
        {value}
      </p>

      {/* Sub value */}
      {subValue && (
        <p className="text-[11px] text-[var(--an-ink-3)] an-mono">{subValue}</p>
      )}

      {/* Trend */}
      {trend && (
        <div className="space-y-1 mt-auto">
          <p className={`text-[11px] font-medium an-mono ${trendPositive ? 'text-[var(--chart-pos)]' : 'text-[var(--chart-neg)]'}`}>
            {trendPositive ? '▲' : '▼'} {Math.abs(trend.pct)}% {trend.label}
          </p>
          {/* Sparkline progress bar */}
          <div className="w-full h-1 bg-[var(--an-surface-2)] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${trendPositive ? 'bg-[var(--chart-pos)]' : 'bg-[var(--chart-neg)]'}`}
              style={{ width: `${Math.min(Math.abs(trend.pct), 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
