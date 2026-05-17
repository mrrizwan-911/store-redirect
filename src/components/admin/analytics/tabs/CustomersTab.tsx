'use client'

import { CustomerGrowthArea } from '../charts/CustomerGrowthArea'
import { LoyaltyTierDonut } from '../charts/LoyaltyTierDonut'
import { GeographyTable } from '../tables/GeographyTable'
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

export function CustomersTab(props: Props) {
  const { dateRange, region, lastUpdated } = props

  return (
    <div className="space-y-4">
      {/* Customer overview + loyalty tier side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CustomerGrowthArea dateRange={dateRange} lastUpdated={lastUpdated} />
        <LoyaltyTierDonut dateRange={dateRange} lastUpdated={lastUpdated} />
      </div>

      {/* Geography table full width */}
      <GeographyTable dateRange={dateRange} lastUpdated={lastUpdated} />
    </div>
  )
}
