import { db } from '@/lib/db/client'
import { FlashSaleForm } from '@/components/admin/promotions/FlashSaleForm'

export const dynamic = 'force-dynamic'

export default async function NewFlashSalePage() {
  const products = await db.product.findMany({
    where: { isActive: true },
    select: { id: true, name: true, basePrice: true },
    orderBy: { name: 'asc' },
  })

  // Map to match the props expected by FlashSaleForm
  const formattedProducts = products.map((p) => ({
    id: p.id,
    name: p.name,
    price: Number(p.basePrice),
  }))

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-sans">
      <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Create Flash Sale</h1>
      </div>
      <FlashSaleForm products={formattedProducts} />
    </div>
  )
}
