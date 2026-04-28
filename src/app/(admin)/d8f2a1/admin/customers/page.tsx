import { cookies } from 'next/headers'
import Link from 'next/link'

async function fetchCustomers(page = 1) {
  const cookieStore = await cookies()
  const token = cookieStore.get('refresh_token')?.value
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  const res = await fetch(`${baseUrl}/api/admin/customers?page=${page}`, {
    headers: {
      ...(token ? { Cookie: `refresh_token=${token}` } : {}),
    },
    cache: 'no-store'
  })

  if (!res.ok) return null
  const json = await res.json()
  return json.data
}

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const params = await searchParams;
  const page = parseInt(params.page || '1', 10)
  const data = await fetchCustomers(page)
  const customers = data?.customers || []

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-sans">
      <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Customers</h1>
      </div>

      <div className="bg-white border border-neutral-100 rounded-xl overflow-hidden shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50/50 border-b border-neutral-100">
              <tr>
                <th className="p-4 text-[10px] uppercase tracking-widest font-bold text-neutral-400">Name</th>
                <th className="p-4 text-[10px] uppercase tracking-widest font-bold text-neutral-400">Email</th>
                <th className="p-4 text-[10px] uppercase tracking-widest font-bold text-neutral-400 text-center">Orders</th>
                <th className="p-4 text-[10px] uppercase tracking-widest font-bold text-neutral-400 text-right">LTV (Total Spent)</th>
                <th className="p-4 text-[10px] uppercase tracking-widest font-bold text-neutral-400 text-center">Tier</th>
                <th className="p-4 text-[10px] uppercase tracking-widest font-bold text-neutral-400 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-neutral-400 italic">
                    No customers found.
                  </td>
                </tr>
              ) : (
                customers.map((customer: any) => (
                  <tr key={customer.id} className="border-b border-neutral-50 last:border-0 hover:bg-neutral-50/50 transition-colors">
                    <td className="p-4 font-semibold text-neutral-900">{customer.name}</td>
                    <td className="p-4 text-neutral-500">{customer.email}</td>
                    <td className="p-4 text-center text-neutral-600">{customer.orderCount}</td>
                    <td className="p-4 text-right font-medium text-neutral-900">PKR {customer.ltv.toLocaleString()}</td>
                    <td className="p-4 text-center">
                      <span className="px-2 py-0.5 bg-neutral-900 text-white text-[10px] font-bold uppercase tracking-wider rounded-full border border-neutral-900">
                        {customer.tier}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <Link
                        href={`/d8f2a1/admin/customers/${customer.id}`}
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
