import { db } from '@/lib/db/client'
import { ProductListingClient } from '@/components/store/plp/ProductListingClient'
import { headers } from 'next/headers'
import { appendFile } from 'node:fs/promises'

interface ProductsPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  try {
    const requestHeaders = await headers()
    const userAgent = requestHeaders.get('user-agent') ?? 'unknown'
    const secChUa = requestHeaders.get('sec-ch-ua') ?? 'missing'
    // #region agent log
    await appendFile(
      '/home/hasan/clothes-store/.cursor/debug-072827.log',
      `${JSON.stringify({
        sessionId: '072827',
        runId: 'initial-repro-2',
        hypothesisId: 'H6',
        location: 'src/app/(store)/products/page.tsx:16',
        message: 'products-page-server-render',
        data: {
          route: '/products',
          userAgent: userAgent.slice(0, 140),
          secChUa: secChUa.slice(0, 140),
        },
        timestamp: Date.now(),
      })}\n`
    )
    // #endregion
  } catch {}

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
    ...(category && { category: { slug: category } }),
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
        variants: { select: { size: true, color: true, stock: true } },
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

  // Process ratings
  const enrichedProducts = products.map((p) => {
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
  })

  return (
    <ProductListingClient
      initialProducts={enrichedProducts}
      initialTotal={total}
      categories={categories}
      title="All Products"
      subtitle="Refined essentials for the modern wardrobe."
    />
  )
}
