'use client'

import { TopProductsTable } from '../tables/TopProductsTable'
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

export function ProductsTab(props: Props) {
  const { dateRange, region, lastUpdated } = props

  return (
    <div className="space-y-4">
      {/* Top products table (full width) */}
      <TopProductsTable dateRange={dateRange} region={region} lastUpdated={lastUpdated} />

      {/* Category + Low Stock */}
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
