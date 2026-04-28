import { db } from '@/lib/db/client'
import { ProductForm } from '@/components/admin/products/ProductForm'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function EditProductPage(context: { params: Promise<{ id: string }> }) {
  const [product, categories] = await Promise.all([
    db.product.findUnique({
      where: { id: (await context.params).id },
      include: {
        variants: true,
        images: { orderBy: { sortOrder: 'asc' } },
      },
    }),
    db.category.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    }),
  ])

  if (!product) {
    notFound()
  }

  // Map to fit the form's expected input
  const initialData = {
    ...product,
    basePrice: Number(product.basePrice),
    salePrice: product.salePrice ? Number(product.salePrice) : null,
    variants: product.variants.map((v) => ({
      title: v.title,
      optionValues: v.optionValues,
      stock: v.stock,
      sku: v.sku,
      price: v.price ? Number(v.price) : null,
    })),
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-sans">
      <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Edit Product</h1>
      </div>
      <ProductForm initialData={initialData as any} categories={categories} />
    </div>
  )
}
