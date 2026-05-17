import Link from 'next/link'
import { validateAdmin } from '@/lib/auth/serverAuth'
import { getOrders } from '@/lib/services/admin/order'
import { CountryFilterToggle } from '@/components/admin/orders/CountryFilterToggle'

interface SearchParams {
  page?: string
  country?: string
}

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  await validateAdmin()

  const params = await searchParams
  const page = parseInt(params.page || '1', 10)
  const country = params.country || ''   // '' = show all, 'PK' = Pakistan, 'UK' = United Kingdom

  const data = await getOrders({ page, country: country || undefined })
  const orders = data?.orders || []
  const { totalPages } = data.pagination

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':    return 'bg-neutral-200 text-neutral-800'
      case 'CONFIRMED':  return 'bg-neutral-800 text-white'
      case 'PROCESSING': return 'bg-neutral-600 text-white'
      case 'SHIPPED':    return 'bg-neutral-900 text-white'
      case 'DELIVERED':  return 'bg-black text-white'
      case 'CANCELLED':  return 'bg-red-100 text-red-800'
      case 'REFUNDED':   return 'bg-yellow-100 text-yellow-800'
      default:           return 'bg-neutral-100 text-neutral-800'
    }
  }

  const getPaymentColor = (status?: string) => {
    switch (status) {
      case 'COMPLETED': return 'text-emerald-600'
      case 'FAILED':    return 'text-red-500'
      case 'REFUNDED':  return 'text-amber-500'
      default:          return 'text-neutral-400'
    }
  }

  const getCountryFlag = (c: string) => {
    switch (c) {
      case 'PK': return '🇵🇰'
      case 'UK': return '🇬🇧'
      default:   return '🌍'
    }
  }

  const getCurrencySymbol = (c: string) => {
    switch (c) {
      case 'UK': return '£'
      case 'GLOBAL': return '$'
      default: return 'PKR'
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Orders</h1>
        <span className="text-xs text-neutral-400">
          {data.pagination.total} total
          {country ? ` · ${country === 'PK' ? 'Pakistan' : 'United Kingdom'}` : ''}
        </span>
      </div>

      {/* ── Full-width Country Toggle ──────────────────────────────────── */}
      {/* Client component handles URL state */}
      <CountryFilterToggle currentCountry={country} />

      {/* Orders Table */}
      <div className="bg-white border border-neutral-100 rounded-xl overflow-hidden shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[600px]">
            <thead className="bg-neutral-50/50 border-b border-neutral-100">
              <tr>
                <th className="p-4 text-[10px] uppercase tracking-widest font-bold text-neutral-400">Order #</th>
                <th className="p-4 text-[10px] uppercase tracking-widest font-bold text-neutral-400">Date</th>
                <th className="p-4 text-[10px] uppercase tracking-widest font-bold text-neutral-400">Customer</th>
                <th className="p-4 text-[10px] uppercase tracking-widest font-bold text-neutral-400">Country</th>
                <th className="p-4 text-[10px] uppercase tracking-widest font-bold text-neutral-400">Payment</th>
                <th className="p-4 text-[10px] uppercase tracking-widest font-bold text-neutral-400 text-center">Items</th>
                <th className="p-4 text-[10px] uppercase tracking-widest font-bold text-neutral-400 text-right">Total</th>
                <th className="p-4 text-[10px] uppercase tracking-widest font-bold text-neutral-400 text-center">Status</th>
                <th className="p-4 text-[10px] uppercase tracking-widest font-bold text-neutral-400 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-neutral-400 italic">
                    {country
                      ? `No orders from ${country === 'PK' ? '🇵🇰 Pakistan' : '🇬🇧 United Kingdom'} yet.`
                      : 'No orders found.'}
                  </td>
                </tr>
              ) : (
                orders.map((order: any) => (
                  <tr
                    key={order.id}
                    className="border-b border-neutral-50 last:border-0 hover:bg-neutral-50/50 transition-colors"
                  >
                    <td className="p-4 font-semibold text-neutral-900 whitespace-nowrap">
                      {order.orderNumber}
                    </td>
                    <td className="p-4 text-neutral-500 whitespace-nowrap">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-neutral-800 truncate max-w-[140px]">
                        {order.user?.name || 'Guest'}
                      </div>
                      <div className="text-[10px] text-neutral-400 truncate max-w-[140px]">
                        {order.user?.email || ''}
                      </div>
                    </td>

                    {/* Country badge */}
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold">
                        {getCountryFlag(order.country)}
                        <span className="text-neutral-500">{order.country || 'PK'}</span>
                      </span>
                    </td>

                    {/* Payment method + status */}
                    <td className="p-4">
                      <div className="text-[10px] font-bold text-neutral-700 uppercase tracking-wide">
                        {order.payment?.method?.replace('_', ' ') || '—'}
                      </div>
                      <div className={`text-[10px] font-bold ${getPaymentColor(order.payment?.status)}`}>
                        {order.payment?.status || '—'}
                      </div>
                    </td>

                    <td className="p-4 text-center text-neutral-600">{order.itemCount}</td>
                    <td className="p-4 text-right font-medium text-neutral-900 whitespace-nowrap">
                      {getCurrencySymbol(order.country)} {Number(order.total).toLocaleString()}
                    </td>
                    <td className="p-4 text-center whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full ${getStatusColor(order.status)}`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <Link
                        href={`/d8f2a1/admin/orders/${order.id}`}
                        className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 hover:text-neutral-900 transition-colors border border-neutral-200 px-3 py-1 rounded-md hover:bg-neutral-50"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-neutral-100 flex items-center justify-between">
            <span className="text-[10px] text-neutral-400 uppercase tracking-widest">
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              {page > 1 && (
                <Link
                  href={`?page=${page - 1}${country ? `&country=${country}` : ''}`}
                  className="text-[10px] font-bold uppercase tracking-widest border border-neutral-200 px-3 py-1.5 rounded hover:bg-neutral-50 text-neutral-500"
                >
                  ← Prev
                </Link>
              )}
              {page < totalPages && (
                <Link
                  href={`?page=${page + 1}${country ? `&country=${country}` : ''}`}
                  className="text-[10px] font-bold uppercase tracking-widest border border-neutral-200 px-3 py-1.5 rounded hover:bg-neutral-50 text-neutral-500"
                >
                  Next →
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
