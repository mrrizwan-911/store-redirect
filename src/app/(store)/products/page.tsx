import { db } from '@/lib/db/client'
import { ProductListingClient } from '@/components/store/plp/ProductListingClient'
import { Suspense } from 'react'
import { enrichProductsWithFlashSales } from '@/lib/services/payment/priceValidator'

export const dynamic = 'force-dynamic'

interface ProductsPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const resolvedSearchParams = await searchParams

  // Parse search params
  const category = (resolvedSearchParams.category as string) || undefined
  const minPrice = Number(resolvedSearchParams.minPrice) || 0
  const maxPrice = Number(resolvedSearchParams.maxPrice) || 20000
  const size = (resolvedSearchParams.size as string) || undefined
  const color = (resolvedSearchParams.color as string) || undefined
  const sort = (resolvedSearchParams.sort as string) || 'createdAt_desc'
  const [sortField, sortDir] = sort.split('_') as [string, 'asc' | 'desc']

  // Construct Prisma where clause
  const where = {
    isActive: true,
    ...(category && {
      OR: [
        { category: { slug: category } },
        { category: { parent: { slug: category } } }
      ]
    }),
    basePrice: { gte: minPrice, lte: maxPrice },
    ...(size || color
      ? {
          variants: {
            some: {
              ...(size && { size: { in: size.split(',') } }),
              ...(color && { color: { in: color.split(',') } }),
              stock: { gt: 0 },
            },
          },
        }
      : {}),
  }

  // Fetch data in parallel
  const [products, total, categories] = await Promise.all([
    db.product.findMany({
      where,
      include: {
        images: { where: { isPrimary: true }, take: 1 },
        category: { select: { name: true, slug: true } },
        variants: { select: { title: true, optionValues: true, stock: true } },
        reviews: { select: { rating: true } },
      },
      orderBy: { [sortField]: sortDir },
      take: 24,
    }),
    db.product.count({ where }),
    db.category.findMany({
      where: { isActive: true },
      select: { name: true, slug: true },
      orderBy: { sortOrder: 'asc' },
    }),
  ])

  // Process ratings and flash sales
  const enrichedProducts = await enrichProductsWithFlashSales(products.map((p) => {
    const avgRating =
      p.reviews.length > 0 ? p.reviews.reduce((sum, r) => sum + r.rating, 0) / p.reviews.length : null
    return {
      ...p,
      avgRating,
      reviewCount: p.reviews.length,
      reviews: undefined,
      basePrice: Number(p.basePrice),
      salePrice: p.salePrice ? Number(p.salePrice) : null,
    }
  }))

  // Ensure flash sale price is prioritized for the UI components
  const finalProducts = enrichedProducts.map(p => ({
    ...p,
    salePrice: p.flashSalePrice ?? p.salePrice
  }))

  return (
    <Suspense fallback={<div className="h-96 flex items-center justify-center">Loading products...</div>}>
      <ProductListingClient
        initialProducts={finalProducts}
        initialTotal={total}
        categories={categories}
        title="All Products"
        subtitle="Refined essentials for the modern wardrobe."
      />
    </Suspense>
  )
}
