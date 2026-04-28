import { cookies } from 'next/headers'
import { KpiCard } from '@/components/admin/dashboard/KpiCard'
import { RevenueChart } from '@/components/admin/dashboard/RevenueChart'
import { OrderStatusChart } from '@/components/admin/dashboard/OrderStatusChart'
import { PaymentMethodChart } from '@/components/admin/dashboard/PaymentMethodChart'

async function fetchAnalyticsData(endpoint: string) {
  const cookieStore = await cookies()
  const token = cookieStore.get('refresh_token')?.value

  // Use a relative or absolute URL based on environment. In server components, absolute is required.
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  const res = await fetch(`${baseUrl}/api/admin/analytics/${endpoint}`, {
    headers: {
      ...(token ? { Cookie: `refresh_token=${token}` } : {}),
    },
    cache: 'no-store'
  })

  if (!res.ok) {
    return null
  }

  const json = await res.json()
  return json.data
}

export default async function AnalyticsPage() {
  const [revenueData, statusData, topProductsData] = await Promise.all([
    fetchAnalyticsData('revenue'),
    fetchAnalyticsData('orders-by-status'),
    fetchAnalyticsData('top-products')
  ])

  // Process data for charts
  // The daily revenue chart needs last 30 days data. The API returned aggregate.
  // Wait, the API for `revenue` didn't return a 30-day time series, it just returned today/month/ytd/activeOrders.
  // Let's create an empty time series for the RevenueChart as it wasn't specified in the API yet.
  const emptyRevenueSeries: { date: string; revenue: number }[] = []

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-sans">
      <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Analytics Overview</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Today's Revenue"
          value={`PKR ${revenueData?.today?.revenue?.toLocaleString() || 0}`}
        />
        <KpiCard
          label="This Month"
          value={`PKR ${revenueData?.thisMonth?.revenue?.toLocaleString() || 0}`}
        />
        <KpiCard
          label="YTD Revenue"
          value={`PKR ${revenueData?.ytd?.revenue?.toLocaleString() || 0}`}
        />
        <KpiCard
          label="Active Orders"
          value={revenueData?.activeOrders || 0}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-neutral-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
          <h2 className="text-[10px] uppercase tracking-widest font-bold mb-6 text-neutral-400">Revenue (30 Days)</h2>
          <RevenueChart data={emptyRevenueSeries} />
        </div>
        <div className="bg-white p-6 rounded-xl border border-neutral-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
          <OrderStatusChart data={statusData || []} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-neutral-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
          <PaymentMethodChart data={revenueData?.byPaymentMethod || []} />
        </div>
        <div className="bg-white p-6 rounded-xl border border-neutral-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
          <h3 className="text-[10px] uppercase tracking-widest font-bold mb-6 text-neutral-400">Top Selling Products</h3>
          <div className="w-full h-80 overflow-y-auto border border-neutral-100 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 border-b border-neutral-100 sticky top-0">
                <tr>
                  <th className="p-3 font-bold uppercase text-[10px] tracking-wider text-neutral-500">Product</th>
                  <th className="p-3 font-bold uppercase text-[10px] tracking-wider text-neutral-500 text-center">Sold</th>
                  <th className="p-3 font-bold uppercase text-[10px] tracking-wider text-neutral-500 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {(!topProductsData || topProductsData.length === 0) ? (
                  <tr>
                    <td colSpan={3} className="p-4 text-center text-neutral-400 italic">No product data available.</td>
                  </tr>
                ) : (
                  topProductsData.map((prod: any, idx: number) => (
                    <tr key={idx} className="border-b border-neutral-50 last:border-0 hover:bg-neutral-50/50 transition-colors">
                      <td className="p-3">
                        <div className="font-semibold text-neutral-800">{prod.name}</div>
                        <div className="text-[10px] text-neutral-400">{prod.category}</div>
                      </td>
                      <td className="p-3 text-center text-neutral-600">{prod.unitsSold}</td>
                      <td className="p-3 text-right font-medium text-neutral-900">PKR {prod.revenue?.toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
