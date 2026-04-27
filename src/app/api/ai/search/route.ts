import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { parseSearchIntent, SearchFilters } from '@/lib/services/ai/intent-parser'
import { analyzeImage } from '@/lib/services/ai/visual-search'
import { logger } from '@/lib/utils/logger'

export async function POST(req: NextRequest) {
  try {
    const { query, image } = await req.json()

    if (!query && !image) {
      return NextResponse.json(
        { success: false, error: 'Either query or image is required' },
        { status: 400 }
      )
    }

    logger.info('POST /api/ai/search', { hasQuery: !!query, hasImage: !!image })

    let mode: 'keyword' | 'ai_intent' | 'visual' | 'multimodal' = 'keyword'
    let filters: SearchFilters = {}
    let intentFeedback: string | undefined
    let visualAnalysis: any | undefined
    let searchQuery = query || ''

    // 1. Mode Detection & AI Analysis
    if (image && query) {
      mode = 'multimodal'
      const analysis = await analyzeImage(image)
      const parsedIntent = await parseSearchIntent(query)

      visualAnalysis = {
        category: analysis.category,
        colors: analysis.colors,
        description: analysis.description,
      }

      filters = {
        ...parsedIntent,
        category: analysis.category || parsedIntent.category,
        subCategory: analysis.subCategory || parsedIntent.subCategory,
        colors: Array.from(new Set([...(analysis.colors || []), ...(parsedIntent.colors || [])])),
      }

      if (analysis.description) searchQuery = `${query} ${analysis.description}`
    } else if (image) {
      mode = 'visual'
      const analysis = await analyzeImage(image)
      visualAnalysis = {
        category: analysis.category,
        colors: analysis.colors,
        description: analysis.description,
      }
      filters = analysis
      if (analysis.description) searchQuery = analysis.description
    } else if (query.length > 10) {
      mode = 'ai_intent'
      filters = await parseSearchIntent(query)
      intentFeedback = `Searching for: ${Object.entries(filters)
        .filter(([_, v]) => v !== undefined)
        .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
        .join(', ')}`
    } else {
      mode = 'keyword'
    }

    logger.request('Search Mode', { mode, query: searchQuery })

    // 2. Build Where Clause
    const where: any = {
      isActive: true,
      OR: [
        { name: { contains: searchQuery, mode: 'insensitive' } },
        { description: { contains: searchQuery, mode: 'insensitive' } },
        { tags: { has: searchQuery } },
      ],
    }

    if (filters.category) {
      where.category = { name: { contains: filters.category, mode: 'insensitive' } }
    }

    if (filters.subCategory) {
      where.OR.push({ category: { name: { contains: filters.subCategory, mode: 'insensitive' } } })
    }

    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      where.basePrice = {
        ...(filters.minPrice !== undefined && { gte: filters.minPrice }),
        ...(filters.maxPrice !== undefined && { lte: filters.maxPrice }),
      }
    }

    if (filters.isFeatured !== undefined) where.isFeatured = filters.isFeatured

    // Add variants filters if present
    if ((filters.colors && filters.colors.length > 0) || (filters.sizes && filters.sizes.length > 0)) {
      where.variants = {
        some: {
          ...(filters.colors && filters.colors.length > 0 && { color: { in: filters.colors, mode: 'insensitive' as any } }),
          ...(filters.sizes && filters.sizes.length > 0 && { size: { in: filters.sizes, mode: 'insensitive' as any } }),
          stock: { gt: 0 }
        }
      }
    }

    // 3. Execute Search
    const [products, total] = await Promise.all([
      db.product.findMany({
        where,
        include: {
          images: { where: { isPrimary: true }, take: 1 },
          category: { select: { name: true, slug: true } },
          variants: { select: { title: true, optionValues: true,  stock: true } },
          reviews: { select: { rating: true } },
        },
        take: 24,
        orderBy: { createdAt: 'desc' },
      }),
      db.product.count({ where }),
    ])

    // 4. Enrich & Return
    const enriched = products.map((p) => {
      const avgRating = p.reviews.length > 0
        ? p.reviews.reduce((sum, r) => sum + r.rating, 0) / p.reviews.length
        : null

      return {
        ...p,
        basePrice: Number(p.basePrice),
        salePrice: p.salePrice ? Number(p.salePrice) : null,
        avgRating,
        reviewCount: p.reviews.length,
        reviews: undefined,
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        products: enriched,
        total,
        mode,
        intentFeedback,
        visualAnalysis,
      },
    })
  } catch (error) {
    logger.error('[UNIFIED_SEARCH_ERROR]', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process unified search' },
      { status: 500 }
    )
  }
}
