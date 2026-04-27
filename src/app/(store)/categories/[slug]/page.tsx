import { db } from '@/lib/db/client'
import { ProductListingClient } from '@/components/store/plp/ProductListingClient'
import { notFound } from 'next/navigation'
import Link from 'next/link'

interface CategoryPageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { slug } = await params
  const resolvedSearchParams = await searchParams

  // Verify category exists
  const activeCategory = await db.category.findUnique({
    where: { slug, isActive: true },
    select: { id: true, name: true, description: true },
  })

  if (!activeCategory) {
    notFound()
  }

  // Parse search params
  const minPrice = Number(resolvedSearchParams.minPrice) || 0
  const maxPrice = Number(resolvedSearchParams.maxPrice) || 20000
  const filterParam = (resolvedSearchParams.filter as string) || undefined
  const sort = (resolvedSearchParams.sort as string) || 'createdAt_desc'
  const rating = Number(resolvedSearchParams.rating) || undefined
  let [sortField, sortDir] = sort.split('_') as [string, 'asc' | 'desc']

  // Map generic sort fields to database columns
  if (sortField === 'price') sortField = 'basePrice'
  if (sortField === 'date') sortField = 'createdAt'

  // Construct Prisma where clause
  const where: any = {
    isActive: true,
    OR: [
      { category: { slug: slug } },
      { category: { parent: { slug: slug } } }
    ],
    basePrice: { gte: minPrice, lte: maxPrice },
    ...(filterParam
      ? {
          variants: {
            some: {
              stock: { gt: 0 },
              optionValues: { path: [], string_contains: filterParam.split(',')[0] },
            },
          },
        }
      : {
          variants: { some: { stock: { gt: 0 } } },
        }),
  }

  // Filter by rating if provided
  if (rating) {
    where.reviews = {
      some: {
        rating: { gte: rating }
      }
    }
  }

  // Fetch data
  const [products, total, subcategories] = await Promise.all([
    db.product.findMany({
      where,
      include: {
        images: { where: { isPrimary: true }, take: 1 },
        category: { select: { name: true, slug: true } },
        variants: { select: { title: true, optionValues: true,  stock: true } },
        reviews: { select: { rating: true } },
      },
      orderBy: { [sortField]: sortDir },
      take: 24,
    }),
    db.product.count({ where }),
    db.category.findMany({
      where: { parentId: activeCategory.id, isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      select: { id: true, name: true, slug: true },
    }),
  ])

  // Process products
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
    <div className="max-w-7xl mx-auto px-6 md:px-8 py-8">
      <nav className="text-[10px] uppercase tracking-[0.2em] text-neutral-400 mb-8 flex items-center gap-2">
        <Link href="/" className="hover:text-black transition-colors">Home</Link>
        <span className="text-neutral-200">/</span>
        <span className="text-black font-bold">Shop</span>
        <span className="text-neutral-200">/</span>
        <span className="text-black font-bold">{activeCategory.name}</span>
      </nav>

      <ProductListingClient
        initialProducts={enrichedProducts}
        initialTotal={total}
        categories={subcategories}
        title={activeCategory.name}
        subtitle={activeCategory.description || `Refined collection in ${activeCategory.name}.`}
      />
    </div>
  )
}
