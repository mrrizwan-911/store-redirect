import { cookies } from 'next/headers'
import Link from 'next/link'

async function fetchOrders(page = 1) {
  const cookieStore = await cookies()
  const token = cookieStore.get('refresh_token')?.value
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  const res = await fetch(`${baseUrl}/api/admin/orders?page=${page}`, {
    headers: {
      ...(token ? { Cookie: `refresh_token=${token}` } : {}),
    },
    cache: 'no-store'
  })

  if (!res.ok) return null
  const json = await res.json()
  return json.data
}

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const params = await searchParams;
  const page = parseInt(params.page || '1', 10)
  const data = await fetchOrders(page)
  const orders = data?.orders || []

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-neutral-200 text-neutral-800'
      case 'CONFIRMED': return 'bg-neutral-800 text-white'
      case 'PROCESSING': return 'bg-neutral-600 text-white'
      case 'SHIPPED': return 'bg-neutral-900 text-white'
      case 'DELIVERED': return 'bg-black text-white'
      case 'CANCELLED': return 'bg-red-100 text-red-800'
      case 'REFUNDED': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-neutral-100 text-neutral-800'
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-sans">
      <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Orders</h1>
      </div>

      <div className="bg-white border border-neutral-100 rounded-xl overflow-hidden shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50/50 border-b border-neutral-100">
              <tr>
                <th className="p-4 text-[10px] uppercase tracking-widest font-bold text-neutral-400">Order #</th>
                <th className="p-4 text-[10px] uppercase tracking-widest font-bold text-neutral-400">Date</th>
                <th className="p-4 text-[10px] uppercase tracking-widest font-bold text-neutral-400">Customer</th>
                <th className="p-4 text-[10px] uppercase tracking-widest font-bold text-neutral-400 text-center">Items</th>
                <th className="p-4 text-[10px] uppercase tracking-widest font-bold text-neutral-400 text-right">Total</th>
                <th className="p-4 text-[10px] uppercase tracking-widest font-bold text-neutral-400 text-center">Status</th>
                <th className="p-4 text-[10px] uppercase tracking-widest font-bold text-neutral-400 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-neutral-400 italic">
                    No orders found.
                  </td>
                </tr>
              ) : (
                orders.map((order: any) => (
                  <tr key={order.id} className="border-b border-neutral-50 last:border-0 hover:bg-neutral-50/50 transition-colors">
                    <td className="p-4 font-semibold text-neutral-900">{order.orderNumber}</td>
                    <td className="p-4 text-neutral-500">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-neutral-800">{order.user?.name || 'Guest'}</div>
                      <div className="text-[10px] text-neutral-400">{order.user?.email || ''}</div>
                    </td>
                    <td className="p-4 text-center text-neutral-600">{order.itemCount}</td>
                    <td className="p-4 text-right font-medium text-neutral-900">PKR {Number(order.total).toLocaleString()}</td>
                    <td className="p-4 text-center">
                      <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full border ${getStatusColor(order.status).includes('black') ? 'border-neutral-900' : 'border-neutral-100'} ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <Link
                        href={`/admin/orders/${order.id}`}
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
      </div>
    </div>
  )
}
