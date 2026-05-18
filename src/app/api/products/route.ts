import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { z } from 'zod'
import { logger } from '@/lib/utils/logger'

// ── Validation schema ──────────────────────────────────────────────────────

const productFilterSchema = z
  .object({
    page: z
      .string()
      .optional()
      .transform((v) => (v ? Number(v) : undefined))
      .pipe(z.number().int().positive().optional()),
    limit: z
      .string()
      .optional()
      .transform((v) => (v ? Number(v) : undefined))
      .pipe(z.number().int().positive().optional()),
    /** Parent category slug */
    category: z.string().optional(),
    /** Sub-category slug (child of category) */
    subCategory: z.string().optional(),
    minPrice: z
      .string()
      .optional()
      .transform((v) => (v ? Number(v) : undefined))
      .pipe(z.number().min(0).optional()),
    maxPrice: z
      .string()
      .optional()
      .transform((v) => (v ? Number(v) : undefined))
      .pipe(z.number().min(0).optional()),
    rating: z
      .string()
      .optional()
      .transform((v) => (v ? Number(v) : undefined))
      .pipe(z.number().min(1).max(5).optional()),
    sort: z.string().optional(),
    search: z.string().optional(),
    q: z.string().optional(),
    featured: z
      .string()
      .optional()
      .transform((v) =>
        v === 'true' ? true : v === 'false' ? false : undefined
      )
      .pipe(z.boolean().optional()),
  })
  .refine(
    (data) => {
      if (data.minPrice !== undefined && data.maxPrice !== undefined) {
        return data.maxPrice >= data.minPrice
      }
      return true
    },
    { message: 'maxPrice must be >= minPrice', path: ['maxPrice'] }
  )

// ── Handler ────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  logger.request('GET /api/products', {
    params: Object.fromEntries(searchParams.entries()),
  })

  const parsedParams = productFilterSchema.safeParse(
    Object.fromEntries(searchParams.entries())
  )

  if (!parsedParams.success) {
    return NextResponse.json(
      { success: false, error: 'Invalid query parameters' },
      { status: 400 }
    )
  }

  const {
    page = 1,
    limit = 24,
    category,
    subCategory,
    minPrice = 0,
    maxPrice = 999999,
    rating,
    sort = 'createdAt_desc',
    search,
    q,
    featured,
  } = parsedParams.data

  const searchTerm = q || search

  let [sortField, sortDir] = sort.split('_') as [string, 'asc' | 'desc']
  if (sortField === 'price') sortField = 'basePrice'
  if (sortField === 'date') sortField = 'createdAt'

  // Build where clause
  // Priority: subCategory > category > none
  const categoryFilter = subCategory
    ? { category: { slug: subCategory } }
    : category
    ? {
        OR: [
          { category: { slug: category } },
          { category: { parent: { slug: category } } },
        ],
      }
    : {}

  const where: any = {
    isActive: true,
    ...(featured && { isFeatured: true }),
    ...categoryFilter,
    basePrice: { gte: minPrice, lte: maxPrice },
    variants: { some: { stock: { gt: 0 } } },
    ...(searchTerm && {
      OR: [
        { name: { contains: searchTerm, mode: 'insensitive' as const } },
        {
          description: {
            contains: searchTerm,
            mode: 'insensitive' as const,
          },
        },
      ],
    }),
  }

  if (rating) {
    where.reviews = { some: { rating: { gte: rating } } }
  }

  try {
    const [products, total] = await Promise.all([
      db.product.findMany({
        where,
        include: {
          images: { where: { isPrimary: true }, take: 1 },
          category: { select: { name: true, slug: true } },
          variants: { select: { id: true, title: true, optionValues: true, stock: true } },
          reviews: { select: { rating: true } },
        },
        orderBy: { [sortField]: sortDir },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.product.count({ where }),
    ])

    const enrichedProducts = products.map((p) => {
      const avgRating =
        p.reviews.length > 0
          ? p.reviews.reduce((sum, r) => sum + r.rating, 0) / p.reviews.length
          : null
      return {
        ...p,
        avgRating,
        reviewCount: p.reviews.length,
        reviews: undefined,
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        products: enrichedProducts,
        total,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    })
  } catch (error) {
    logger.error('[GET /api/products]', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
