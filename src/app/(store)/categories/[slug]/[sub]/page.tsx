import { db } from '@/lib/db/client'
import { ProductListingClient } from '@/components/store/plp/ProductListingClient'
import { notFound } from 'next/navigation'

interface SubcategoryPageProps {
  params: Promise<{ slug: string; sub: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function SubcategoryPage({ params, searchParams }: SubcategoryPageProps) {
  const { slug, sub } = await params
  const resolvedSearchParams = await searchParams

  // Verify subcategory exists and belongs to the parent category
  const subcategory = await db.category.findFirst({
    where: {
      slug: sub,
      isActive: true,
      parent: {
        slug: slug,
        isActive: true
      }
    },
    select: {
      name: true,
      description: true,
      parent: {
        select: {
          name: true
        }
      }
    },
  })

  if (!subcategory) {
    notFound()
  }

  // Parse search params
  const minPrice = Number(resolvedSearchParams.minPrice) || 0
  const maxPrice = Number(resolvedSearchParams.maxPrice) || 20000
  const size = (resolvedSearchParams.size as string) || undefined
  const color = (resolvedSearchParams.color as string) || undefined
  const sort = (resolvedSearchParams.sort as string) || 'createdAt_desc'
  const rating = Number(resolvedSearchParams.rating) || undefined
  let [sortField, sortDir] = sort.split('_') as [string, 'asc' | 'desc']

  // Map generic sort fields to database columns
  if (sortField === 'price') sortField = 'basePrice'
  if (sortField === 'date') sortField = 'createdAt'

  // Construct Prisma where clause
  const where: any = {
    isActive: true,
    category: {
      slug: sub,
      parent: { slug: slug }
    },
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

  // Filter by rating if provided
  if (rating) {
    where.reviews = {
      some: {
        rating: { gte: rating }
      }
    }
  }

  // Fetch data
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
      where: { isActive: true, parentId: null },
      select: { name: true, slug: true },
      orderBy: { sortOrder: 'asc' },
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
    <ProductListingClient
      initialProducts={enrichedProducts}
      initialTotal={total}
      categories={categories}
      title={subcategory.name}
      subtitle={subcategory.description || `Refined collection in ${subcategory.parent?.name} / ${subcategory.name}.`}
    />
  )
}
