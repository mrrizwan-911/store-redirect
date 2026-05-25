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
    getAbandonedCartStats(region)
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
          value={`${region === 'uk' ? '£' : 'PKR'} ${(kpi as any).todayRevenue?.toLocaleString() || 0}`}
        />
        <KpiCard
          label="This Month"
          value={`${region === 'uk' ? '£' : 'PKR'} ${(kpi as any).monthRevenue?.toLocaleString() || 0}`}
        />
        <KpiCard
          label="YTD Revenue"
          value={`${region === 'uk' ? '£' : 'PKR'} ${(kpi as any).ytdRevenue?.toLocaleString() || 0}`}
        />
        <KpiCard
          label="Active Orders"
          value={kpi.activeOrders || 0}
        />
      </div>

      {/* Revenue Chart */}
      <div className="border border-neutral-200 p-4">
        <h2 className="text-lg font-semibold mb-4">Revenue Trend (Last 30 Days)</h2>
        <RevenueChart 
          currency={region === 'uk' ? '£' : 'PKR'}
          data={(revenueData || []).map((d: any) => ({
            date: d.date,
            revenue: region === 'uk' ? (d.uk || 0) : region === 'pk' ? (d.pk || 0) : (d.total || 0)
          }))} 
        />
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

      {/* Forecast & Abandoned Cart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ForecastAlerts />
        
        {/* Abandoned Cart Widget */}
        <div className="bg-white p-6 rounded-xl border border-neutral-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-[10px] uppercase tracking-widest font-bold text-neutral-400">Abandoned Carts (Last Hour)</h3>
            <span className="text-xl font-bold text-neutral-900">{abandonedData?.count || 0}</span>
          </div>
          <div className="mb-6">
            <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Potential Lost Revenue</p>
            <p className="text-2xl font-playfair font-bold text-rose-600">{region === 'uk' ? '£' : 'PKR'} {abandonedData?.potentialRevenue?.toLocaleString() || 0}</p>
          </div>
          <div>
            <p className="text-xs text-neutral-500 uppercase tracking-wider mb-3">Top Abandoned Items</p>
            {abandonedData?.topAbandoned && abandonedData.topAbandoned.length > 0 ? (
              <div className="space-y-2">
                {abandonedData.topAbandoned.map((item: any, i: number) => (
                  <div key={i} className="flex justify-between items-center text-sm border-b border-neutral-50 pb-2">
                    <span className="truncate max-w-[200px] text-neutral-700">{item.name}</span>
                    <span className="font-mono bg-neutral-100 px-2 py-0.5 rounded text-neutral-600 text-xs">{item.count} in carts</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-neutral-400 italic">No items abandoned recently</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}