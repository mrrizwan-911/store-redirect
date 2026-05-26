import { db } from '@/lib/db/client'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { FlashSaleActions } from '@/components/admin/promotions/FlashSaleActions'
import { CountryFilterToggle } from '@/components/admin/orders/CountryFilterToggle'

export const dynamic = 'force-dynamic'

interface SearchParams {
  country?: string
}

export default async function AdminFlashSalesPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>
}) {
  const params = (await searchParams) || {}
  const country = params.country || ''

  const whereClause: any = {}
  if (country === 'PK') {
    whereClause.country = { in: ['PK', 'ALL'] }
  } else if (country === 'UK') {
    whereClause.country = { in: ['UK', 'ALL'] }
  }

  let sales: any[] = []

  try {
    sales = await db.flashSale.findMany({
      where: whereClause,
      orderBy: { startTime: 'desc' },
    })
  } catch (err) {
    console.warn('[AdminFlashSalesPage] DB unavailable:', err)
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-sans">
      <div className="flex justify-between items-center border-b border-neutral-100 pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Flash Sales</h1>
        <Link
          href="/d8f2a1/admin/flash-sales/new"
          className="flex items-center gap-2 bg-neutral-900 text-white px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-neutral-800 transition-all shadow-sm"
        >
          <Plus className="h-3.5 w-3.5" />
          Create Sale
        </Link>
      </div>

      <CountryFilterToggle currentCountry={country} resourceName="Flash Sales" />

      <div className="bg-white border border-neutral-100 rounded-xl overflow-hidden shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50/50 border-b border-neutral-100">
              <tr>
                <th className="p-4 text-[10px] uppercase tracking-widest font-bold text-neutral-400">Name</th>
                <th className="p-4 text-[10px] uppercase tracking-widest font-bold text-neutral-400">Discount</th>
                <th className="p-4 text-[10px] uppercase tracking-widest font-bold text-neutral-400">Scope</th>
                <th className="p-4 text-[10px] uppercase tracking-widest font-bold text-neutral-400">Start Time</th>
                <th className="p-4 text-[10px] uppercase tracking-widest font-bold text-neutral-400">End Time</th>
                <th className="p-4 text-[10px] uppercase tracking-widest font-bold text-neutral-400">Region</th>
                <th className="p-4 text-[10px] uppercase tracking-widest font-bold text-neutral-400 text-center">Status</th>
                <th className="p-4 text-[10px] uppercase tracking-widest font-bold text-neutral-400 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((sale) => (
                <tr key={sale.id} className={`border-b border-neutral-50 last:border-0 hover:bg-neutral-50/50 transition-colors ${sale.isActive ? 'border-l-4 border-l-emerald-500' : ''}`}>
                  <td className="p-4 font-semibold text-neutral-900">{sale.name}</td>
                  <td className="p-4 text-neutral-900 font-bold">
                    {sale.discountType === 'PERCENTAGE' ? `${sale.discountPct}%` : `PKR ${Number(sale.discountFlat).toLocaleString()}`}
                  </td>
                  <td className="p-4 text-neutral-500">
                    <span className="bg-neutral-100 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest">
                      {sale.scope === 'ALL' ? 'Site-wide' : sale.scope === 'SINGLE' ? '1 Product' : `${sale.productIds.length} Products`}
                    </span>
                  </td>
                  <td className="p-4 text-neutral-500">{new Date(sale.startTime).toLocaleString()}</td>
                  <td className="p-4 text-neutral-500">{new Date(sale.endTime).toLocaleString()}</td>
                  <td className="p-4 font-bold text-neutral-800 text-[10px] uppercase tracking-widest">
                    {sale.country === 'PK' ? '🇵🇰 Pakistan' : sale.country === 'UK' ? '🇬🇧 UK' : '🌐 All'}
                  </td>
                  <td className="p-4 text-center">
                    {(() => {
                      const now = new Date()
                      const start = new Date(sale.startTime)
                      const end = new Date(sale.endTime)
                      const isActiveNow = now >= start && now <= end
                      const isExpired = now > end

                      if (isActiveNow) {
                        return <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full border border-emerald-100 shadow-sm">Active</span>
                      } else if (isExpired) {
                        return <span className="bg-neutral-100 text-neutral-400 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full border border-neutral-200">Expired</span>
                      } else {
                        return <span className="bg-amber-50 text-amber-700 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full border border-amber-100 shadow-sm">Upcoming</span>
                      }
                    })()}
                  </td>
                  <td className="p-4">
                    <FlashSaleActions saleId={sale.id} saleName={sale.name} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {sales.length === 0 && (
            <div className="p-12 text-center text-neutral-400 italic">No flash sales found.</div>
          )}
        </div>
      </div>
    </div>
  )
}
