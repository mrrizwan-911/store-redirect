import Link from 'next/link'
import { notFound } from 'next/navigation'
import { validateAdmin } from '@/lib/auth/serverAuth'
import { getCustomerById } from '@/lib/services/admin/customer'

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  // 1. Validate Admin
  await validateAdmin()

  // 2. Fetch data directly
  const { id } = await params;
  const customer = await getCustomerById(id)

  if (!customer) {
    notFound()
  }

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
      <div className="flex items-center gap-4 border-b border-neutral-100 pb-4">
        <Link href="/d8f2a1/admin/customers" className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 hover:text-neutral-900 transition-colors border border-neutral-200 px-3 py-1 rounded-md hover:bg-neutral-50">
          &larr; Back
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
          Customer Profile
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6">
          <div className="bg-white border border-neutral-100 rounded-xl p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
            <div className="w-12 h-12 bg-neutral-900 text-white flex items-center justify-center text-xl font-bold mb-4 rounded-full">
              {customer.name?.charAt(0).toUpperCase()}
            </div>
            <h2 className="text-lg font-bold tracking-tight text-neutral-900">{customer.name}</h2>
            <p className="text-sm text-neutral-500">{customer.email}</p>
            {customer.phone && <p className="text-xs text-neutral-400 mt-1">{customer.phone}</p>}

            <div className="mt-6 pt-6 border-t border-neutral-50 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-neutral-400 uppercase font-bold tracking-widest">Lifetime Value</span>
                <span className="text-sm font-bold text-neutral-900">PKR {customer.ltv?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-neutral-400 uppercase font-bold tracking-widest">Total Orders</span>
                <span className="text-sm font-bold text-neutral-900">{customer.orders?.length || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-neutral-400 uppercase font-bold tracking-widest">Member Since</span>
                <span className="text-xs text-neutral-600">{new Date(customer.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-neutral-100 rounded-xl p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-4">Loyalty Status</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] text-neutral-400 uppercase font-bold tracking-tighter">Tier</p>
                <p className="text-xs font-bold uppercase text-neutral-900">{customer.loyalty?.tier || 'Bronze'}</p>
              </div>
              <div className="text-right">
                <p className="text-[9px] text-neutral-400 uppercase font-bold tracking-tighter">Points Balance</p>
                <p className="text-xs font-bold text-neutral-900">{customer.loyalty?.points || 0}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white border border-neutral-100 rounded-xl overflow-hidden shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
            <div className="p-4 border-b border-neutral-50 bg-neutral-50/50">
              <h2 className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Order History</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50/30 border-b border-neutral-50">
                  <tr>
                    <th className="p-4 font-bold uppercase text-[10px] tracking-widest text-neutral-400">Order #</th>
                    <th className="p-4 font-bold uppercase text-[10px] tracking-widest text-neutral-400">Date</th>
                    <th className="p-4 font-bold uppercase text-[10px] tracking-widest text-neutral-400 text-center">Items</th>
                    <th className="p-4 font-bold uppercase text-[10px] tracking-widest text-neutral-400 text-right">Total</th>
                    <th className="p-4 font-bold uppercase text-[10px] tracking-widest text-neutral-400 text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {!customer.orders || customer.orders.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-12 text-center text-neutral-400 italic">
                        No orders placed yet.
                      </td>
                    </tr>
                  ) : (
                    customer.orders.map((order: any) => (
                      <tr key={order.id} className="border-b border-neutral-50 last:border-0 hover:bg-neutral-50/50 transition-colors">
                        <td className="p-4 font-semibold">
                          <Link href={`/d8f2a1/admin/orders/${order.id}`} className="text-neutral-900 hover:underline">
                            {order.orderNumber}
                          </Link>
                        </td>
                        <td className="p-4 text-neutral-500">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-4 text-center text-neutral-600">{order.itemsCount || order._count?.items || 0}</td>
                        <td className="p-4 text-right font-medium text-neutral-900">PKR {Number(order.total).toLocaleString()}</td>
                        <td className="p-4 text-center">
                          <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full border ${getStatusColor(order.status).includes('black') ? 'border-neutral-900' : 'border-neutral-100'} ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
