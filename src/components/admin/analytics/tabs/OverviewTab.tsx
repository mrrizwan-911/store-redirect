'use client'

import { KpiRow } from '../kpi/KpiRow'
import { RevenueSeriesChart } from '../charts/RevenueSeriesChart'
import { OrdersByRegionChart } from '../charts/OrdersByRegionChart'
import { OrderStatusDonut } from '../charts/OrderStatusDonut'
import { CategoryPerformanceBar } from '../charts/CategoryPerformanceBar'
import { LowStockPanel } from '../panels/LowStockPanel'
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

export function OverviewTab(props: Props) {
  const { dateRange, region, compareEnabled, compareStart, compareEnd, lastUpdated } = props

  return (
    <div className="space-y-4">
      {/* KPI Strip */}
      <KpiRow
        dateRange={dateRange}
        region={region}
        compareEnabled={compareEnabled}
        compareStart={compareStart}
        compareEnd={compareEnd}
        lastUpdated={lastUpdated}
      />

      {/* Revenue chart (full width) */}
      <RevenueSeriesChart dateRange={dateRange} region={region} lastUpdated={lastUpdated} />

      {/* Orders by region + Order status side-by-side on desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <OrdersByRegionChart dateRange={dateRange} lastUpdated={lastUpdated} />
        <OrderStatusDonut   dateRange={dateRange} region={region} lastUpdated={lastUpdated} />
      </div>

      {/* Category performance + Low stock */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <CategoryPerformanceBar dateRange={dateRange} region={region} lastUpdated={lastUpdated} />
        </div>
        <div>
          <LowStockPanel dateRange={dateRange} region={region} lastUpdated={lastUpdated} />
        </div>
      </div>
    </div>
  )
}
