import { unstable_cache } from 'next/cache'
import { db } from '@/lib/db/client'
import { HeroBanner } from '@/components/store/home/HeroBanner'
import { CategoryTiles } from '@/components/store/home/CategoryTiles'
import { FeaturedProducts } from '@/components/store/home/FeaturedProducts'
import { NewArrivalsStrip } from '@/components/store/home/NewArrivalsStrip'
import { LookbookTeaser } from '@/components/store/home/LookbookTeaser'
import { NewsletterSection } from '@/components/store/home/NewsletterSection'
import { RecentlyViewed } from '@/components/store/shared/RecentlyViewed'
import { enrichProductsWithFlashSales } from '@/lib/services/payment/priceValidator'
import { SITE_COUNTRY } from '@/lib/constants/site'

// ISR: revalidate homepage every 60 seconds — cached at CDN edge
export const revalidate = 60

async function fetchProducts(where: object, orderBy: object, take: number) {
  return db.product.findMany({
    where: { isActive: true, ...where },
    include: {
      images: { orderBy: { sortOrder: 'asc' }, take: 2 },
      category: { select: { name: true } },
      variants: { select: { stock: true } },
      reviews: { select: { rating: true } },
    },
    orderBy,
    take,
  })
}

export default async function Homepage() {
  let featuredRaw: Awaited<ReturnType<typeof fetchProducts>> = []
  let newArrivalsRaw: Awaited<ReturnType<typeof fetchProducts>> = []

  try {
    ;[featuredRaw, newArrivalsRaw] = await Promise.all([
      fetchProducts({ isFeatured: true }, { createdAt: 'desc' }, 8),
      fetchProducts({}, { createdAt: 'desc' }, 8),
    ])
  } catch (err) {
    console.warn('[Homepage] DB unavailable, rendering with empty products:', err)
  }

  // Determine which price field to use based on site country
  const isUK = SITE_COUNTRY === 'UK'

  function mapProduct(p: Awaited<ReturnType<typeof fetchProducts>>[number]) {
    const totalStock = p.variants.reduce((sum, v) => sum + v.stock, 0)
    const avgRating = p.reviews.length
      ? p.reviews.reduce((sum, r) => sum + r.rating, 0) / p.reviews.length
      : undefined
    const primaryImage = p.images.find((i) => i.isPrimary) || p.images[0]
    const secondaryImage = p.images.find((i) => !i.isPrimary && i !== primaryImage)
    // Created within last 14 days = "New" badge
    const isNew = (Date.now() - new Date(p.createdAt).getTime()) < 14 * 24 * 60 * 60 * 1000

    const currentPrice = isUK ? Number(p.priceUK || 0) : Number(p.pricePK || 0)
    const currentSalePrice = isUK
      ? (p.salePriceUK ? Number(p.salePriceUK) : undefined)
      : (p.salePricePK ? Number(p.salePricePK) : undefined)

    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      imageUrl: primaryImage?.url ?? '/placeholder.png',
      secondaryImageUrl: secondaryImage?.url,
      basePrice: currentPrice,
      price: currentPrice,
      salePrice: currentSalePrice,
      category: p.category.name,
      sku: p.sku,
      description: p.description,
      avgRating: avgRating ? Math.round(avgRating * 10) / 10 : undefined,
      reviewCount: p.reviews.length,
      isBadgeNew: isNew,
      isBadgeSale: !!currentSalePrice,
      isLowStock: totalStock > 0 && totalStock <= 5,
      stockCount: totalStock,
    }
  }

  const featured = await enrichProductsWithFlashSales(featuredRaw.map(mapProduct))
  const newArrivals = await enrichProductsWithFlashSales(newArrivalsRaw.map(mapProduct))

  return (
    <main>
      <HeroBanner />
      <CategoryTiles />
      <FeaturedProducts products={featured} />
      <NewArrivalsStrip products={newArrivals} />
      <LookbookTeaser />
      <RecentlyViewed />
      <NewsletterSection />
    </main>
  )
}
