import { db } from '@/lib/db/client'
import { HeroBanner } from '@/components/store/home/HeroBanner'
import { CategoryTiles } from '@/components/store/home/CategoryTiles'
import { FeaturedProducts } from '@/components/store/home/FeaturedProducts'
import { NewArrivalsStrip } from '@/components/store/home/NewArrivalsStrip'
import { LookbookTeaser } from '@/components/store/home/LookbookTeaser'
import { NewsletterSection } from '@/components/store/home/NewsletterSection'

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
  const [featuredRaw, newArrivalsRaw] = await Promise.all([
    fetchProducts({ isFeatured: true }, { createdAt: 'desc' }, 8),
    fetchProducts({}, { createdAt: 'desc' }, 8),
  ])

  function mapProduct(p: Awaited<ReturnType<typeof fetchProducts>>[number]) {
    const totalStock = p.variants.reduce((sum, v) => sum + v.stock, 0)
    const avgRating = p.reviews.length
      ? p.reviews.reduce((sum, r) => sum + r.rating, 0) / p.reviews.length
      : undefined
    const primaryImage = p.images.find((i) => i.isPrimary) || p.images[0]
    const secondaryImage = p.images.find((i) => !i.isPrimary && i !== primaryImage)
    // Created within last 14 days = "New" badge
    const isNew = (Date.now() - new Date(p.createdAt).getTime()) < 14 * 24 * 60 * 60 * 1000

    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      imageUrl: primaryImage?.url ?? '/placeholder-product.jpg',
      secondaryImageUrl: secondaryImage?.url,
      price: Number(p.basePrice),
      salePrice: p.salePrice ? Number(p.salePrice) : undefined,
      category: p.category.name,
      avgRating: avgRating ? Math.round(avgRating * 10) / 10 : undefined,
      reviewCount: p.reviews.length,
      isBadgeNew: isNew,
      isBadgeSale: !!p.salePrice,
      isLowStock: totalStock > 0 && totalStock <= 5,
      stockCount: totalStock,
    }
  }

  const featured = featuredRaw.map(mapProduct)
  const newArrivals = newArrivalsRaw.map(mapProduct)

  return (
    <main>
      <HeroBanner />
      <CategoryTiles />
      <FeaturedProducts products={featured} />
      <NewArrivalsStrip products={newArrivals} />
      <LookbookTeaser />
      <NewsletterSection />
    </main>
  )
}
