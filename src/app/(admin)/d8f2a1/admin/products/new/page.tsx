import { db } from '@/lib/db/client'
import { ProductForm } from '@/components/admin/products/ProductForm'

export const dynamic = 'force-dynamic'

export default async function NewProductPage() {
  let categories: { id: string; name: string }[] = []

  try {
    categories = await db.category.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    })
  } catch (err) {
    console.warn('[NewProductPage] DB unavailable:', err)
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-sans">
      <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Add New Product</h1>
      </div>
      <ProductForm categories={categories} />
    </div>
  )
}
