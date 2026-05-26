import { db } from '@/lib/db/client'
import { ProductListingClient } from '@/components/store/plp/ProductListingClient'
import { Suspense } from 'react'
import { enrichProductsWithFlashSales } from '@/lib/services/payment/priceValidator'
import { SITE_COUNTRY } from '@/lib/constants/site'

export const dynamic = 'force-dynamic'

interface ProductsPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const resolvedSearchParams = await searchParams

  // Parse search params
  const category = (resolvedSearchParams.category as string) || undefined
  const subCategory = (resolvedSearchParams.subCategory as string) || undefined
  const minPrice = Number(resolvedSearchParams.minPrice) || 0
  const maxPrice = Number(resolvedSearchParams.maxPrice) || 20000
  const sort = (resolvedSearchParams.sort as string) || 'createdAt_desc'
  let [sortField, sortDir] = sort.split('_') as [string, 'asc' | 'desc']

  // Price field based on region
  const priceField = SITE_COUNTRY === 'UK' ? 'priceUK' : 'pricePK'
  if (sortField === 'price') sortField = priceField
  if (sortField === 'date') sortField = 'createdAt'
  const allowedSortFields = new Set(['createdAt', 'name', 'pricePK', 'priceUK'])
  if (!allowedSortFields.has(sortField)) sortField = 'createdAt'
  if (sortDir !== 'asc') sortDir = 'desc'

  // Build where clause
  // If subCategory is set → filter by exact subcategory slug
  // Else if category is set → filter by parent OR its children
  const where: any = {
    isActive: true,
    ...(subCategory
      ? { category: { slug: subCategory } }
      : category
      ? {
          OR: [
            { category: { slug: category } },
            { category: { parent: { slug: category } } },
          ],
        }
      : {}),
    [priceField]: { gte: minPrice, lte: maxPrice },
    variants: { some: { stock: { gt: 0 } } },
  }

  // Fetch data in parallel
  let products: any[] = []
  let total = 0
  let parentCategories: { id: string; name: string; slug: string }[] = []

  try {
    ;[products, total, parentCategories] = await Promise.all([
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
      // Only root (parent) categories for the filter
      db.category.findMany({
        where: { isActive: true, parentId: null },
        select: { id: true, name: true, slug: true },
        orderBy: { sortOrder: 'asc' },
      }),
    ])
  } catch (err) {
    console.warn('[ProductsPage] DB unavailable, rendering with empty data:', err)
  }

  // Process ratings and flash sales
  const enrichedProducts = await enrichProductsWithFlashSales(
    products.map((p) => {
      const avgRating =
        p.reviews.length > 0
          ? p.reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / p.reviews.length
          : null
      // Pick price based on country
      const price = Number(SITE_COUNTRY === 'UK' ? p.priceUK : p.pricePK)
      const salePrice = SITE_COUNTRY === 'UK' ? p.salePriceUK : p.salePricePK
      return {
        ...p,
        avgRating,
        reviewCount: p.reviews.length,
        reviews: undefined,
        basePrice: price,
        salePrice: salePrice ? Number(salePrice) : null,
        pricePK: p.pricePK ? Number(p.pricePK) : null,
        priceUK: p.priceUK ? Number(p.priceUK) : null,
        salePricePK: p.salePricePK ? Number(p.salePricePK) : null,
        salePriceUK: p.salePriceUK ? Number(p.salePriceUK) : null,
      }
    }),
    SITE_COUNTRY
  )

  const finalProducts = enrichedProducts.map((p) => ({
    ...p,
    salePrice: p.flashSalePrice ?? p.salePrice,
  }))

  return (
    <Suspense
      fallback={
        <div className="h-96 flex items-center justify-center">
          Loading products...
        </div>
      }
    >
      <ProductListingClient
        initialProducts={finalProducts}
        initialTotal={total}
        parentCategories={parentCategories}
        title="All Products"
        subtitle="Refined essentials for the modern wardrobe."
      />
    </Suspense>
  )
}
