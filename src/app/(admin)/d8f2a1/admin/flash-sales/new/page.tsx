import { db } from '@/lib/db/client'
import { FlashSaleForm } from '@/components/admin/promotions/FlashSaleForm'

export const dynamic = 'force-dynamic'

export default async function NewFlashSalePage() {
  let categories: any[] = []

  try {
    categories = await db.category.findMany({
      where: { isActive: true },
      include: {
        products: {
          where: { isActive: true },
          select: { id: true, name: true, basePrice: true },
          orderBy: { name: 'asc' },
        }
      },
      orderBy: { name: 'asc' },
    })
  } catch (err) {
    console.warn('[NewFlashSalePage] DB unavailable:', err)
  }

  // Format categorized products for the form
  const categorizedProducts = categories
    .filter(cat => cat.products.length > 0)
    .map((cat) => ({
      categoryName: cat.name,
      products: cat.products.map((p: any) => ({
        id: p.id,
        name: p.name,
        price: Number(p.basePrice),
      }))
    }))

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-sans">
      <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Create Flash Sale</h1>
      </div>
      <FlashSaleForm categorizedProducts={categorizedProducts} />
    </div>
  )
}
