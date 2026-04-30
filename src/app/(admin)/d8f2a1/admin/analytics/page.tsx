import { validateAdmin } from '@/lib/auth/serverAuth'
import { getRevenueStats, getOrdersByStatus, getTopProducts, getAbandonedCartStats } from '@/lib/services/admin/analytics'
import { KpiCard } from '@/components/admin/dashboard/KpiCard'
import { RevenueChart } from '@/components/admin/dashboard/RevenueChart'
import { OrderStatusChart } from '@/components/admin/dashboard/OrderStatusChart'
import { PaymentMethodChart } from '@/components/admin/dashboard/PaymentMethodChart'

export default async function AnalyticsPage() {
  // 1. Validate Admin Session (Redirects to login if invalid)
  await validateAdmin()

  // 2. Fetch data directly from services (No internal HTTP calls)
  const [revenueData, statusData, topProductsData, abandonedData] = await Promise.all([
    getRevenueStats(),
    getOrdersByStatus(),
    getTopProducts(),
    getAbandonedCartStats()
  ])

  // Process data for charts
  // The daily revenue chart needs last 30 days data.
  // For now we use an empty series as the service doesn't provide time-series yet.
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
          <h3 className="text-[10px] uppercase tracking-widest font-bold mb-6 text-neutral-400">Abandoned Carts (60m+)</h3>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-100">
              <p className="text-[10px] uppercase font-bold text-neutral-400 mb-1">Total Carts</p>
              <p className="text-xl font-bold text-neutral-900">{abandonedData?.count || 0}</p>
            </div>
            <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-100">
              <p className="text-[10px] uppercase font-bold text-neutral-400 mb-1">Lost Revenue</p>
              <p className="text-xl font-bold text-rose-600">PKR {abandonedData?.potentialRevenue?.toLocaleString() || 0}</p>
            </div>
          </div>
          <h4 className="text-[10px] uppercase font-bold text-neutral-400 mb-3">Top Abandoned Items</h4>
          <ul className="space-y-2">
            {(!abandonedData?.topAbandoned || abandonedData.topAbandoned.length === 0) ? (
              <li className="text-xs text-neutral-400 italic py-2">No abandoned items tracked.</li>
            ) : (
              abandonedData.topAbandoned.map((item: any, idx: number) => (
                <li key={idx} className="flex items-center justify-between text-xs py-2 border-b border-neutral-50 last:border-0">
                  <span className="font-medium text-neutral-700 truncate mr-4">{item.name}</span>
                  <span className="text-neutral-400 shrink-0">{item.count} times</span>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
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
