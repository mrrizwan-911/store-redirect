import { db } from '@/lib/db/client'
import { ProductListingClient } from '@/components/store/plp/ProductListingClient'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { enrichProductsWithFlashSales } from '@/lib/services/payment/priceValidator'

export const dynamic = 'force-dynamic'

interface CategoryPageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function CategoryPage({
  params,
  searchParams,
}: CategoryPageProps) {
  const { slug } = await params
  const resolvedSearchParams = await searchParams

  // Verify the parent category exists
  const activeCategory = await db.category.findUnique({
    where: { slug, isActive: true },
    select: { id: true, name: true, description: true },
  })

  if (!activeCategory) {
    notFound()
  }

  // Parse search params
  const subCategory = (resolvedSearchParams.subCategory as string) || undefined
  const minPrice = Number(resolvedSearchParams.minPrice) || 0
  const maxPrice = Number(resolvedSearchParams.maxPrice) || 20000
  const rating = Number(resolvedSearchParams.rating) || undefined
  const sort = (resolvedSearchParams.sort as string) || 'createdAt_desc'
  let [sortField, sortDir] = sort.split('_') as [string, 'asc' | 'desc']

  if (sortField === 'price') sortField = 'basePrice'
  if (sortField === 'date') sortField = 'createdAt'

  // Build where clause
  // If subCategory selected → filter by exact sub-category under this parent
  // Else → filter all products in this parent category (direct + children)
  const where: any = {
    isActive: true,
    ...(subCategory
      ? {
          category: {
            slug: subCategory,
            parent: { slug: slug },
          },
        }
      : {
          OR: [
            { category: { slug: slug } },
            { category: { parent: { slug: slug } } },
          ],
        }),
    basePrice: { gte: minPrice, lte: maxPrice },
    variants: { some: { stock: { gt: 0 } } },
  }

  if (rating) {
    where.reviews = { some: { rating: { gte: rating } } }
  }

  // Fetch data
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
    // Note: sub-categories are fetched client-side via /api/categories/children
    // No need to pass them here anymore
  ])

  // Process
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
          parentCategories={[]} // no free-form parent selection on category page
          title={activeCategory.name}
          subtitle={
            activeCategory.description ||
            `Refined collection in ${activeCategory.name}.`
          }
          lockedParentSlug={slug}
          lockedParentName={activeCategory.name}
        />
      </Suspense>
    </div>
  )
}
