import { db } from '@/lib/db/client'
import { ProductListingClient } from '@/components/store/plp/ProductListingClient'
import { headers } from 'next/headers'
import { appendFile } from 'node:fs/promises'

interface SearchPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const resolvedSearchParams = await searchParams
  const query = (resolvedSearchParams.q as string) || (resolvedSearchParams.search as string) || ''

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
        location: 'src/app/(store)/search/page.tsx:16',
        message: 'search-page-server-render',
        data: {
          route: '/search',
          query,
          userAgent: userAgent.slice(0, 140),
          secChUa: secChUa.slice(0, 140),
        },
        timestamp: Date.now(),
      })}\n`
    )
    // #endregion
  } catch {}

  // Parse filters
  const category = (resolvedSearchParams.category as string) || undefined
  const minPrice = Number(resolvedSearchParams.minPrice) || 0
  const maxPrice = Number(resolvedSearchParams.maxPrice) || 50000
  const size = (resolvedSearchParams.size as string) || undefined
  const color = (resolvedSearchParams.color as string) || undefined
  const sort = (resolvedSearchParams.sort as string) || 'createdAt_desc'
  const [sortField, sortDir] = sort.split('_') as [string, 'asc' | 'desc']

  // Map generic sort fields to database columns
  let dbSortField = sortField
  if (sortField === 'price') dbSortField = 'basePrice'
  if (sortField === 'date') dbSortField = 'createdAt'

  const where: any = {
    isActive: true,
    basePrice: { gte: minPrice, lte: maxPrice },
    ...(query && {
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { tags: { has: query } },
      ],
    }),
    ...(category && { category: { slug: category } }),
    ...(size || color
      ? {
          variants: {
            some: {
              ...(size && { size: { in: size.split(',') } }),
              ...(color && { color: { in: color.split(',') } }),
              stock: { gt: 0 }
            }
          }
        }
      : {}),
  }

  // Fetch data
  const [products, total, categories, featuredProducts] = await Promise.all([
    db.product.findMany({
      where,
      include: {
        images: { where: { isPrimary: true }, take: 1 },
        category: { select: { name: true, slug: true } },
        variants: { select: { size: true, color: true, stock: true } },
        reviews: { select: { rating: true } },
      },
      orderBy: { [dbSortField]: sortDir },
      take: 24,
    }),
    db.product.count({ where }),
    db.category.findMany({
      where: { isActive: true, parentId: null },
      select: { name: true, slug: true },
      orderBy: { sortOrder: 'asc' },
    }),
    // Curated suggestions if no products found
    db.product.findMany({
      where: { isActive: true, isFeatured: true },
      include: {
        images: { where: { isPrimary: true }, take: 1 },
        category: { select: { name: true, slug: true } },
        variants: { select: { size: true, color: true, stock: true } },
        reviews: { select: { rating: true } },
      },
      take: 8,
    })
  ])

  // Process products
  const enrich = (list: any[]) => list.map((p) => {
    const avgRating =
      p.reviews.length > 0 ? p.reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / p.reviews.length : null
    return {
      ...p,
      avgRating,
      reviewCount: p.reviews.length,
      reviews: undefined,
      basePrice: Number(p.basePrice),
      salePrice: p.salePrice ? Number(p.salePrice) : null,
    }
  })

  const enrichedProducts = enrich(products)
  const enrichedFeatured = enrich(featuredProducts)

  return (
    <ProductListingClient
      initialProducts={enrichedProducts}
      initialTotal={total}
      categories={categories}
      title={query ? `Search: ${query}` : 'Search'}
      subtitle={query ? `Found ${total} results for "${query}"` : 'Explore our collection'}
      featuredProducts={enrichedFeatured}
    />
  )
}
