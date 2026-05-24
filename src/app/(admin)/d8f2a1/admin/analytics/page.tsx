import { validateAdmin } from '@/lib/auth/serverAuth'
import { getKpiSummary, getRevenueSeries, getOrdersAnalytics, getProductAnalytics, getAbandonedCartStats } from '@/lib/services/admin/analytics'
import { KpiCard } from '@/components/admin/dashboard/KpiCard'
import { RevenueChart } from '@/components/admin/dashboard/RevenueChart'
import { OrderStatusChart } from '@/components/admin/dashboard/OrderStatusChart'
import { PaymentMethodChart } from '@/components/admin/dashboard/PaymentMethodChart'
import { ForecastAlerts } from '@/components/admin/dashboard/ForecastAlerts'
import { CountryFilterToggle } from '@/components/admin/orders/CountryFilterToggle'

interface PageProps {
  searchParams: Promise<{
    country?: string
  }>
}

export default async function AnalyticsPage({ searchParams }: PageProps) {
  // 1. Validate Admin Session (Redirects to login if invalid)
  await validateAdmin()

  const params = await searchParams
  const country = params.country || ''
  const region = country ? country.toLowerCase() : null

  // Default to last 30 days
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 30)

  // Compare previous period
  const compareEnd = new Date(startDate)
  const compareStart = new Date(startDate)
  compareStart.setDate(compareStart.getDate() - 30)

  // 2. Fetch data directly from services (No internal HTTP calls)
  const [kpiData, revenueData, ordersData, productData, abandonedData] = await Promise.all([
    getKpiSummary({ startDate, endDate, compareStart, compareEnd, region }),
    getRevenueSeries({ startDate, endDate, granularity: 'day', region }),
    getOrdersAnalytics({ startDate, endDate, region }),
    getProductAnalytics({ startDate, endDate, region }),
    getAbandonedCartStats()
  ])

  // Extract KPI values
  const kpi = kpiData || { revenue: { current: 0 }, orders: { current: 0 }, activeOrders: 0 }
  const ordersByStatus = ordersData?.byStatus || []
  const topProducts = productData?.topProducts?.slice(0, 5) || []

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-sans">
      <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Analytics Overview</h1>
      </div>

      <CountryFilterToggle currentCountry={country} resourceName="Analytics" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Today's Revenue"
          value={`PKR ${kpi.revenue?.current?.toLocaleString() || 0}`}
        />
        <KpiCard
          label="This Month"
          value={`PKR ${kpi.revenue?.current?.toLocaleString() || 0}`}
        />
        <KpiCard
          label="YTD Revenue"
          value={`PKR ${kpi.revenue?.current?.toLocaleString() || 0}`}
        />
        <KpiCard
          label="Active Orders"
          value={kpi.activeOrders || 0}
        />
      </div>

      {/* Revenue Chart */}
      <div className="border border-neutral-200 p-4">
        <h2 className="text-lg font-semibold mb-4">Revenue Trend (Last 30 Days)</h2>
        <RevenueChart data={(revenueData || []).map((d: any) => ({ date: d.date, revenue: d.total || 0 }))} />
      </div>

      {/* Order Status & Payment Methods */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border border-neutral-200 p-4">
          <h2 className="text-lg font-semibold mb-4">Orders by Status</h2>
          <OrderStatusChart data={ordersByStatus} />
        </div>
        <div className="border border-neutral-200 p-4">
          <h2 className="text-lg font-semibold mb-4">Top Products</h2>
          {topProducts.length > 0 ? (
            <div className="space-y-2">
              {topProducts.map((p: any, i: number) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="truncate max-w-[200px]">{p.name}</span>
                  <span className="font-mono">{p.totalUnits} sold</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-neutral-500 text-sm">No product data available</p>
          )}
        </div>
      </div>

      {/* Abandoned Cart */}
      <ForecastAlerts />
    </div>
  )
}