import { db } from '@/lib/db/client'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { ProductActions } from '@/components/admin/products/ProductActions'
import { CountryFilterToggle } from '@/components/admin/orders/CountryFilterToggle'

export const dynamic = 'force-dynamic'

interface SearchParams {
  country?: string
}

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>
}) {
  const params = (await searchParams) || {}
  const country = params.country || ''

  const whereClause: any = {}
  if (country === 'PK') {
    whereClause.pricePK = { gt: 0 }
  } else if (country === 'UK') {
    whereClause.priceUK = { gt: 0 }
  }

  let products: any[] = []
  let activeFlashSales: any[] = []

  try {
    ;[products, activeFlashSales] = await Promise.all([
      db.product.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        include: {
          category: true,
          variants: true,
        },
      }),
      db.flashSale.findMany({
        where: {
          startTime: { lte: new Date() },
          endTime: { gte: new Date() },
        },
        orderBy: { createdAt: 'desc' }
      })
    ])
  } catch (err) {
    console.warn('[AdminProductsPage] DB unavailable:', err)
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-sans">
      <div className="flex justify-between items-center border-b border-neutral-100 pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Products</h1>
        <Link
          href="/d8f2a1/admin/products/new"
          className="flex items-center gap-2 bg-neutral-900 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-neutral-800 transition-all shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Add Product
        </Link>
      </div>

      <CountryFilterToggle currentCountry={country} resourceName="Products" />

      <div className="bg-white border border-neutral-100 rounded-xl overflow-hidden shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50/50">
                <th className="p-4 text-[10px] uppercase tracking-widest font-bold text-neutral-400">Name</th>
                <th className="p-4 text-[10px] uppercase tracking-widest font-bold text-neutral-400">SKU</th>
                <th className="p-4 text-[10px] uppercase tracking-widest font-bold text-neutral-400">Category</th>
                <th className="p-4 text-[10px] uppercase tracking-widest font-bold text-neutral-400">Price</th>
                <th className="p-4 text-[10px] uppercase tracking-widest font-bold text-neutral-400">Flash Sale</th>
                <th className="p-4 text-[10px] uppercase tracking-widest font-bold text-neutral-400">Stock</th>
                <th className="p-4 text-[10px] uppercase tracking-widest font-bold text-neutral-400">Status</th>
                <th className="p-4 text-[10px] uppercase tracking-widest font-bold text-neutral-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const totalStock = product.variants.reduce((acc, v) => acc + v.stock, 0)
                const basePrice = Number(product.basePrice)

                // Find active flash sale for this product
                const activeSale = activeFlashSales.find(sale =>
                  sale.scope === 'ALL' || sale.productIds.includes(product.id)
                )

                let flashPrice = null
                if (activeSale) {
                  if (activeSale.discountType === 'PERCENTAGE') {
                    flashPrice = Math.round(basePrice * (1 - (activeSale.discountPct || 0) / 100) * 100) / 100
                  } else {
                    flashPrice = Math.max(0, Math.round((basePrice - Number(activeSale.discountFlat || 0)) * 100) / 100)
                  }
                }

                return (
                  <tr
                    key={product.id}
                    className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50/50 transition-colors"
                  >
                    <td className="p-4 font-semibold text-neutral-900 text-xs">{product.name}</td>
                    <td className="p-4 text-neutral-500 text-xs">{product.sku}</td>
                    <td className="p-4 text-neutral-500 text-xs">{product.category.name}</td>
                    <td className="p-4 text-xs space-y-1">
                      {(!country || country === 'PK') && (
                        <div className="flex flex-col">
                          <span className="font-semibold text-neutral-800">
                            🇵🇰 ₨ {product.salePricePK ? Number(product.salePricePK).toLocaleString() : Number(product.pricePK).toLocaleString()}
                          </span>
                          {product.salePricePK && (
                            <span className="text-[10px] text-neutral-400 line-through">
                              ₨ {Number(product.pricePK).toLocaleString()}
                            </span>
                          )}
                        </div>
                      )}
                      {(!country || country === 'UK') && (
                        <div className="flex flex-col">
                          <span className="font-semibold text-neutral-800">
                            🇬🇧 £ {product.salePriceUK ? Number(product.salePriceUK).toLocaleString() : Number(product.priceUK).toLocaleString()}
                          </span>
                          {product.salePriceUK && (
                            <span className="text-[10px] text-neutral-400 line-through">
                              £ {Number(product.priceUK).toLocaleString()}
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-xs">
                      {activeSale ? (
                        <div className="flex flex-col">
                          <span className="text-amber-600 font-bold uppercase text-[9px] tracking-tight">Ends in {Math.ceil((new Date(activeSale.endTime).getTime() - new Date().getTime()) / (1000 * 60 * 60))}h</span>
                          <span className="text-neutral-400 text-[9px]">{new Date(activeSale.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      ) : (
                        <span className="text-neutral-300 text-[10px]">—</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span
                        className={`text-xs font-medium ${
                          totalStock === 0
                            ? 'text-red-600'
                            : totalStock < 5
                            ? 'text-amber-600'
                            : 'text-emerald-600'
                        }`}
                      >
                        {totalStock}
                      </span>
                    </td>
                    <td className="p-4">
                      {product.isActive ? (
                        <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full border border-emerald-100">Active</span>
                      ) : (
                        <span className="bg-neutral-100 text-neutral-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full border border-neutral-200">Inactive</span>
                      )}
                    </td>
                    <td className="p-4">
                      <ProductActions productId={product.id} productName={product.name} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {products.length === 0 && (
            <div className="p-12 text-center text-neutral-400 italic text-sm">No products found.</div>
          )}
        </div>
      </div>
    </div>
  )
}