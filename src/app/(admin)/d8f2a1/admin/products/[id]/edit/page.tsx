import { db } from '@/lib/db/client'
import { ProductForm } from '@/components/admin/products/ProductForm'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function EditProductPage(context: { params: Promise<{ id: string }> }) {
  let product: any = null
  let categories: { id: string; name: string }[] = []

  try {
    ;[product, categories] = await Promise.all([
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
  } catch (err) {
    console.warn('[EditProductPage] DB unavailable:', err)
  }

  if (!product) {
    notFound()
  }

  // Parse variant options properly
  const parsedOptions = typeof product.variantOptions === 'string'
    ? JSON.parse(product.variantOptions)
    : (product.variantOptions || [])

  // Map to fit the form's expected input
  const initialData = {
    ...product,
    variantOptions: parsedOptions,
    baseStock: product.variants.length === 1 && parsedOptions.length === 0 ? product.variants[0].stock : 0,
    basePrice: Number(product.basePrice),
    salePrice: product.salePrice ? Number(product.salePrice) : null,
    pricePK: Number(product.pricePK),
    priceUK: Number(product.priceUK),
    salePricePK: product.salePricePK ? Number(product.salePricePK) : null,
    salePriceUK: product.salePriceUK ? Number(product.salePriceUK) : null,
    variants: product.variants.map((v) => ({
      id: v.id,
      title: v.title,
      optionValues: v.optionValues,
      stock: v.stock,
      sku: v.sku,
      price: v.price ? Number(v.price) : null,
      pricePK: v.pricePK ? Number(v.pricePK) : null,
      priceUK: v.priceUK ? Number(v.priceUK) : null,
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
