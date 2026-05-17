'use client'

import { RevenueSeriesChart } from '../charts/RevenueSeriesChart'
import { FinancialSummaryPanel } from '../panels/FinancialSummaryPanel'
import { PaymentMethodBar } from '../charts/PaymentMethodBar'
import { CategoryPerformanceBar } from '../charts/CategoryPerformanceBar'
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

export function RevenueTab(props: Props) {
  const { dateRange, region, lastUpdated } = props

  return (
    <div className="space-y-4">
      <RevenueSeriesChart dateRange={dateRange} region={region} lastUpdated={lastUpdated} />

      <FinancialSummaryPanel dateRange={dateRange} region={region} lastUpdated={lastUpdated} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <PaymentMethodBar dateRange={dateRange} region={region} lastUpdated={lastUpdated} />
        <CategoryPerformanceBar dateRange={dateRange} region={region} lastUpdated={lastUpdated} />
      </div>
    </div>
  )
}
