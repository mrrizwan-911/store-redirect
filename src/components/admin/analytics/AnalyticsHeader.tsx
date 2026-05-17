'use client'

import { useState } from 'react'
import { RefreshCw, Download, ChevronDown } from 'lucide-react'
import type { Region, Tab, DateRange } from './AnalyticsDashboard'

const REGIONS: { value: Region; label: string }[] = [
  { value: 'all', label: '🌐 All' },
  { value: 'pk', label: '🇵🇰 Pakistan' },
  { value: 'uk', label: '🇬🇧 UK' },
]

interface Props {
  region: Region
  onRegionChange: (r: Region) => void
  lastUpdated: Date
  autoRefresh: boolean
  onAutoRefreshToggle: () => void
  dateRange: DateRange
  activeTab: Tab
}

function timeAgo(date: Date): string {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`
  return `${Math.floor(diff / 3600)}h ago`
}

export function AnalyticsHeader({
  region, onRegionChange, lastUpdated, autoRefresh, onAutoRefreshToggle, dateRange, activeTab
}: Props) {
  const [exportOpen, setExportOpen] = useState(false)

  function handleExport(format: 'csv') {
    setExportOpen(false)
    const params = new URLSearchParams({
      tab: activeTab,
      start: dateRange.start.toISOString(),
      end: dateRange.end.toISOString(),
      region,
      format,
    })
    window.location.href = `/api/admin/analytics/export?${params.toString()}`
  }

  return (
    <div className="an-card !p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {/* Left: title + last updated */}
      <div className="min-w-0">
        <h1 className="an-title text-xl sm:text-2xl text-[var(--an-ink)] leading-none">
          Analytics
        </h1>
        <p className="text-[10px] text-[var(--an-ink-3)] mt-1 an-mono">
          Updated {timeAgo(lastUpdated)} · calnza.pk
        </p>
      </div>

      {/* Center: region pills */}
      <div className="flex items-center gap-1 flex-wrap">
        {REGIONS.map(r => (
          <button
            key={r.value}
            onClick={() => onRegionChange(r.value)}
            className={`
              px-3 py-1.5 text-[11px] font-medium rounded-[2px] border transition-all
              ${region === r.value
                ? 'bg-[var(--an-ink)] text-white border-[var(--an-ink)]'
                : 'bg-transparent text-[var(--an-ink-2)] border-[var(--an-border-strong)] hover:border-[var(--an-ink)]'
              }
            `}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Right: export + refresh */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Auto-refresh toggle */}
        <button
          onClick={onAutoRefreshToggle}
          className={`
            flex items-center gap-1.5 px-3 py-1.5 text-[11px] rounded-[2px] border transition-all
            ${autoRefresh
              ? 'border-[var(--chart-pos)] text-[var(--chart-pos)] bg-green-50'
              : 'border-[var(--an-border-strong)] text-[var(--an-ink-2)] hover:border-[var(--an-ink)]'
            }
          `}
          title="Toggle auto-refresh (every 5 min)"
        >
          <RefreshCw className={`w-3 h-3 ${autoRefresh ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Live</span>
          {autoRefresh && (
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--chart-pos)] animate-pulse" />
          )}
        </button>

        {/* Export dropdown */}
        <div className="relative">
          <button
            onClick={() => setExportOpen(v => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] rounded-[2px] border border-[var(--an-border-strong)] text-[var(--an-ink-2)] hover:border-[var(--an-ink)] transition-all"
          >
            <Download className="w-3 h-3" />
            <span className="hidden sm:inline">Export</span>
            <ChevronDown className="w-3 h-3" />
          </button>

          {exportOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setExportOpen(false)}
              />
              <div className="absolute right-0 top-full mt-1 w-36 bg-white border border-[var(--an-border)] rounded-[2px] shadow-lg z-20 overflow-hidden">
                <button
                  onClick={() => handleExport('csv')}
                  className="w-full text-left px-4 py-2.5 text-[12px] text-[var(--an-ink-2)] hover:bg-[var(--an-surface-2)] transition-colors"
                >
                  Export CSV
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
