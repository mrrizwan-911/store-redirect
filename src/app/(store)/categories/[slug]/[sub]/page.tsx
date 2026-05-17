import { db } from '@/lib/db/client'
import { ProductListingClient } from '@/components/store/plp/ProductListingClient'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { enrichProductsWithFlashSales } from '@/lib/services/payment/priceValidator'

export const dynamic = 'force-dynamic'

interface SubcategoryPageProps {
  params: Promise<{ slug: string; sub: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function SubcategoryPage({
  params,
  searchParams,
}: SubcategoryPageProps) {
  const { slug, sub } = await params
  const resolvedSearchParams = await searchParams

  // Verify subcategory exists and belongs to the parent category
  const subcategory = await db.category.findFirst({
    where: {
      slug: sub,
      isActive: true,
      parent: { slug: slug, isActive: true },
    },
    select: {
      id: true,
      parentId: true,
      name: true,
      description: true,
      parent: { select: { name: true, slug: true } },
    },
  })

  if (!subcategory) {
    notFound()
  }

  // Parse search params
  const minPrice = Number(resolvedSearchParams.minPrice) || 0
  const maxPrice = Number(resolvedSearchParams.maxPrice) || 20000
  const rating = Number(resolvedSearchParams.rating) || undefined
  const sort = (resolvedSearchParams.sort as string) || 'createdAt_desc'
  let [sortField, sortDir] = sort.split('_') as [string, 'asc' | 'desc']

  if (sortField === 'price') sortField = 'basePrice'
  if (sortField === 'date') sortField = 'createdAt'

  // Products strictly in this sub-category
  const where: any = {
    isActive: true,
    category: {
      slug: sub,
      parent: { slug: slug },
    },
    basePrice: { gte: minPrice, lte: maxPrice },
    variants: { some: { stock: { gt: 0 } } },
  }

  if (rating) {
    where.reviews = { some: { rating: { gte: rating } } }
  }

  const [products, total] = await Promise.all([
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
  ])

  const enrichedProducts = await enrichProductsWithFlashSales(
    products.map((p) => {
      const avgRating =
        p.reviews.length > 0
          ? p.reviews.reduce((sum, r) => sum + r.rating, 0) / p.reviews.length
          : null
      return {
        ...p,
        avgRating,
        reviewCount: p.reviews.length,
        reviews: undefined,
        basePrice: Number(p.basePrice),
        salePrice: p.salePrice ? Number(p.salePrice) : null,
      }
    })
  )

  const finalProducts = enrichedProducts.map((p) => ({
    ...p,
    salePrice: p.flashSalePrice ?? p.salePrice,
  }))

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
      <Suspense
        fallback={
          <div className="h-96 flex items-center justify-center">
            Loading collection...
          </div>
        }
      >
        <ProductListingClient
          initialProducts={finalProducts}
          initialTotal={total}
          parentCategories={[]} // locked, no free parent selection
          title={subcategory.name}
          subtitle={
            subcategory.description ||
            `${subcategory.parent?.name} / ${subcategory.name}`
          }
          lockedParentSlug={slug}
          lockedParentName={subcategory.parent?.name}
          lockedSubSlug={sub}
          lockedSubName={subcategory.name}
        />
      </Suspense>
    </div>
  )
}
