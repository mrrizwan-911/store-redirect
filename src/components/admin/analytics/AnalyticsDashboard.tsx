'use client'

import { useState, useCallback, useEffect } from 'react'
import { AnalyticsHeader } from './AnalyticsHeader'
import { DateRangeSelector } from './DateRangeSelector'
import { TabNavigation } from './TabNavigation'
import { OverviewTab } from './tabs/OverviewTab'
import { RevenueTab } from './tabs/RevenueTab'
import { OrdersTab } from './tabs/OrdersTab'
import { ProductsTab } from './tabs/ProductsTab'
import { CustomersTab } from './tabs/CustomersTab'
import { MarketingTab } from './tabs/MarketingTab'

export type Region = 'all' | 'pk' | 'uk'
export type Tab = 'overview' | 'revenue' | 'orders' | 'products' | 'customers' | 'marketing'
export type Granularity = 'day' | 'week' | 'month'

export interface DateRange {
  start: Date
  end: Date
  label: string
}

function getPresetRange(preset: string): DateRange {
  const now = new Date()
  const end = new Date(now)
  end.setHours(23, 59, 59, 999)

  switch (preset) {
    case 'today': {
      const start = new Date(now)
      start.setHours(0, 0, 0, 0)
      return { start, end, label: 'Today' }
    }
    case '7d': {
      const start = new Date(now)
      start.setDate(start.getDate() - 6)
      start.setHours(0, 0, 0, 0)
      return { start, end, label: 'Last 7 Days' }
    }
    case '30d': {
      const start = new Date(now)
      start.setDate(start.getDate() - 29)
      start.setHours(0, 0, 0, 0)
      return { start, end, label: 'Last 30 Days' }
    }
    case '90d': {
      const start = new Date(now)
      start.setDate(start.getDate() - 89)
      start.setHours(0, 0, 0, 0)
      return { start, end, label: 'Last 90 Days' }
    }
    case 'year': {
      const start = new Date(now.getFullYear(), 0, 1)
      return { start, end, label: 'This Year' }
    }
    default: {
      const start = new Date(now)
      start.setDate(start.getDate() - 29)
      start.setHours(0, 0, 0, 0)
      return { start, end, label: 'Last 30 Days' }
    }
  }
}

function getCompareRange(range: DateRange): { compareStart: Date; compareEnd: Date } {
  const duration = range.end.getTime() - range.start.getTime()
  const compareEnd = new Date(range.start.getTime() - 1)
  const compareStart = new Date(compareEnd.getTime() - duration)
  return { compareStart, compareEnd }
}

export function buildParams(
  range: DateRange,
  region: Region,
  compareEnabled: boolean
): URLSearchParams {
  const { compareStart, compareEnd } = getCompareRange(range)
  const params = new URLSearchParams({
    start: range.start.toISOString(),
    end: range.end.toISOString(),
    compareStart: compareStart.toISOString(),
    compareEnd: compareEnd.toISOString(),
    region,
  })
  return params
}

export function AnalyticsDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [region, setRegion] = useState<Region>('all')
  const [dateRange, setDateRange] = useState<DateRange>(getPresetRange('30d'))
  const [compareEnabled, setCompareEnabled] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [autoRefresh, setAutoRefresh] = useState(false)

  // Read tab from URL on mount
  useEffect(() => {
    const url = new URL(window.location.href)
    const tab = url.searchParams.get('tab') as Tab
    if (tab) setActiveTab(tab)
  }, [])

  // Sync tab to URL
  const handleTabChange = useCallback((tab: Tab) => {
    setActiveTab(tab)
    const url = new URL(window.location.href)
    url.searchParams.set('tab', tab)
    window.history.replaceState({}, '', url.toString())
  }, [])

  // Auto-refresh every 5 minutes
  useEffect(() => {
    if (!autoRefresh) return
    const interval = setInterval(() => {
      setLastUpdated(new Date())
    }, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [autoRefresh])

  const handlePresetChange = useCallback((preset: string) => {
    setDateRange(getPresetRange(preset))
    setLastUpdated(new Date())
  }, [])

  const handleCustomRange = useCallback((start: Date, end: Date) => {
    setDateRange({ start, end, label: 'Custom' })
    setLastUpdated(new Date())
  }, [])

  const handleRegionChange = useCallback((r: Region) => {
    setRegion(r)
    setLastUpdated(new Date())
  }, [])

  const params = buildParams(dateRange, region, compareEnabled)
  const { compareStart, compareEnd } = getCompareRange(dateRange)

  const sharedProps = {
    dateRange,
    region,
    compareEnabled,
    compareStart,
    compareEnd,
    lastUpdated,
    params,
  }

  return (
    <div className="analytics-root min-h-screen bg-[#F7F5F0]">
      <style>{`
        :root {
          --an-bg: #F7F5F0;
          --an-surface: #FFFFFF;
          --an-surface-2: #F2EFE9;
          --an-border: #E4DFD6;
          --an-border-strong: #C8BFB0;
          --an-ink: #1A1714;
          --an-ink-2: #6B6358;
          --an-ink-3: #A09890;
          --chart-pk: #1A6B3C;
          --chart-uk: #1A3A6B;
          --chart-global: #6B1A1A;
          --chart-pos: #1A6B3C;
          --chart-neg: #B91C1C;
          --chart-warn: #B45309;
          --status-pending: #B45309;
          --status-confirmed: #1A6B3C;
          --status-processing: #1A3A6B;
          --status-shipped: #5B21B6;
          --status-delivered: #1A1714;
          --status-cancelled: #B91C1C;
          --status-refunded: #6B1A1A;
        }
        .an-card {
          background: var(--an-surface);
          border: 1px solid var(--an-border);
          border-radius: 2px;
          padding: 24px;
        }
        .an-section-label {
          font-family: var(--font-display, 'Playfair Display', serif);
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.25em;
          color: var(--an-ink-3);
          border-bottom: 1px solid var(--an-border);
          padding-bottom: 12px;
          margin-bottom: 20px;
        }
        .an-number {
          font-family: 'DM Mono', monospace;
          font-variant-numeric: tabular-nums;
        }
        .an-mono {
          font-family: 'DM Mono', monospace;
        }
        .an-title {
          font-family: var(--font-display, 'Playfair Display', serif);
        }
        @media (max-width: 768px) {
          .an-card { padding: 16px; }
          .an-kpi-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 480px) {
          .an-kpi-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4">
        <AnalyticsHeader
          region={region}
          onRegionChange={handleRegionChange}
          lastUpdated={lastUpdated}
          autoRefresh={autoRefresh}
          onAutoRefreshToggle={() => setAutoRefresh(v => !v)}
          dateRange={dateRange}
          activeTab={activeTab}
        />

        <DateRangeSelector
          onPresetChange={handlePresetChange}
          onCustomRange={handleCustomRange}
          compareEnabled={compareEnabled}
          onCompareToggle={() => setCompareEnabled(v => !v)}
        />

        <TabNavigation activeTab={activeTab} onTabChange={handleTabChange} />

        <div className="min-h-[400px]">
          {activeTab === 'overview' && <OverviewTab {...sharedProps} />}
          {activeTab === 'revenue' && <RevenueTab {...sharedProps} />}
          {activeTab === 'orders' && <OrdersTab {...sharedProps} />}
          {activeTab === 'products' && <ProductsTab {...sharedProps} />}
          {activeTab === 'customers' && <CustomersTab {...sharedProps} />}
          {activeTab === 'marketing' && <MarketingTab {...sharedProps} />}
        </div>
      </div>
    </div>
  )
}
