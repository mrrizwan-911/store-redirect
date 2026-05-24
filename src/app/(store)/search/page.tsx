import { db } from '@/lib/db/client'
import { SearchPageClient } from '@/components/store/search/SearchPageClient'
import { Suspense } from 'react'
import { SITE_COUNTRY } from '@/lib/constants/site'

export const dynamic = 'force-dynamic'

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q: query = '' } = await searchParams

  const featured = await db.product.findMany({
    where: { isActive: true, isFeatured: true },
    include: {
      images: { where: { isPrimary: true }, take: 1 },
      category: { select: { name: true, slug: true } },
      variants: { select: { title: true, optionValues: true,  stock: true } },
      reviews: { select: { rating: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 8,
  })

  const enriched = featured.map((p) => ({
    ...p,
    basePrice: SITE_COUNTRY === 'UK' ? Number(p.priceUK || 0) : Number(p.pricePK || 0),
    price: SITE_COUNTRY === 'UK' ? Number(p.priceUK || 0) : Number(p.pricePK || 0),
    salePrice: SITE_COUNTRY === 'UK'
      ? (p.salePriceUK ? Number(p.salePriceUK) : null)
      : (p.salePricePK ? Number(p.salePricePK) : null),
    variants: p.variants.map((v) => ({
      ...v,
      title: v.title,
      optionValues: v.optionValues,
    })),
    avgRating: p.reviews.length
      ? p.reviews.reduce((sum, r) => sum + r.rating, 0) / p.reviews.length
      : 0,
    reviewCount: p.reviews.length,
  }))

  return (
    <Suspense fallback={<div className="h-96 flex items-center justify-center">Loading search...</div>}>
      <SearchPageClient initialQuery={query} initialFeatured={enriched} />
    </Suspense>
  )
}
