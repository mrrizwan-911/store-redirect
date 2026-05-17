import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { parseSearchIntent } from '@/lib/services/ai/intent-parser'
import { logger } from '@/lib/utils/logger'
import { getUserSession } from '@/lib/auth/session'
import { cookies } from 'next/headers'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const query = searchParams.get('q') || ''

    if (!query || query.length < 2) {
      return NextResponse.json({ success: true, data: { products: [], categories: [] } })
    }

    logger.request('GET /api/search', { query })

    // ── Resolve visitor identity (Option A: track both logged-in and guests) ──
    let userId: string | null = null
    let sessionId: string | null = null
    try {
      const session = await getUserSession()
      const cookieStore = await cookies()
      userId = session?.userId ?? null
      sessionId = cookieStore.get('anon_session')?.value ?? null
    } catch {
      /* auth errors must never break search */
    }

    // Tokenise for tag matching — ignore very short words
    const tokens = query
      .toLowerCase()
      .split(/\s+/)
      .filter((t) => t.length > 2)

    // ── 1. Basic keyword search (always runs) ─────────────────────────────────
    const basicSearchPromise = db.product.findMany({
      where: {
        isActive: true,
        OR: [
          { name:        { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          ...(tokens.length > 0 ? [{ tags: { hasSome: tokens } }] : []),
          { category: { name: { contains: query, mode: 'insensitive' } } },
        ],
      },
      include: {
        images:  { where: { isPrimary: true }, take: 1 },
        category: { select: { name: true, slug: true } },
        reviews:  { select: { rating: true } },      // needed for avgRating
      },
      orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
      take: 12,
    })

    const categorySearchPromise = db.category.findMany({
      where: { name: { contains: query, mode: 'insensitive' }, isActive: true },
      select: { id: true, name: true, slug: true, parentId: true },
      take: 4,
    })

    // ── 2. AI intent search (longer queries only) ─────────────────────────────
    let aiFilters: any = null
    if (query.length > 8) {
      try {
        aiFilters = await parseSearchIntent(query)
        logger.info('AI Intent Parsed', { query, aiFilters })
      } catch (err) {
        logger.error('AI Intent Parsing Failed', err)
      }
    }

    let aiProducts: any[] = []
    if (aiFilters && Object.keys(aiFilters).length > 0) {
      const aiWhere: any = { isActive: true }

      if (aiFilters.category) {
        aiWhere.category = { name: { contains: aiFilters.category, mode: 'insensitive' } }
      } else if (aiFilters.subCategory) {
        aiWhere.category = { name: { contains: aiFilters.subCategory, mode: 'insensitive' } }
      }
      if (aiFilters.minPrice !== undefined || aiFilters.maxPrice !== undefined) {
        aiWhere.basePrice = {
          ...(aiFilters.minPrice  !== undefined && { gte: aiFilters.minPrice }),
          ...(aiFilters.maxPrice  !== undefined && { lte: aiFilters.maxPrice }),
        }
      }
      if (aiFilters.isFeatured  !== undefined) aiWhere.isFeatured = aiFilters.isFeatured
      if (aiFilters.isNewArrival) {
        aiWhere.createdAt = { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      }

      aiProducts = await db.product.findMany({
        where: aiWhere,
        include: {
          images:   { where: { isPrimary: true }, take: 1 },
          category: { select: { name: true, slug: true } },
          reviews:  { select: { rating: true } },
        },
        orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
        take: 12,
      })
    }

    const [basicProducts, matchedCategories] = await Promise.all([
      basicSearchPromise,
      categorySearchPromise,
    ])

    // ── 3. Merge, deduplicate, enrich with ratings ────────────────────────────
    const uniqueMap = new Map(
      [...basicProducts, ...aiProducts].map((p) => [p.id, p])
    )

    const uniqueProducts = Array.from(uniqueMap.values())
      .slice(0, 20)
      .map((p) => {
        const reviews = (p as any).reviews ?? []
        return {
          ...p,
          basePrice:   Number(p.basePrice),
          salePrice:   p.salePrice ? Number(p.salePrice) : null,
          avgRating:   reviews.length > 0
            ? reviews.reduce((s: number, r: any) => s + r.rating, 0) / reviews.length
            : 0,
          reviewCount: reviews.length,
          reviews:     undefined,          // strip from JSON response
        }
      })

    const searchMode   = aiFilters && Object.keys(aiFilters).length > 0 ? 'ai_intent' : 'keyword'
    const intentFeedback = searchMode === 'ai_intent'
      ? `Showing results for: ${Object.values(aiFilters).filter((v) => typeof v === 'string').join(', ')}`
      : null

    // ── 4. Analytics — fire-and-forget, never blocks the response ─────────────
    if (userId || sessionId) {
      db.userSearchHistory
        .create({
          data: { userId, sessionId, query, mode: searchMode, resultCount: uniqueProducts.length },
        })
        .catch(() => { /* silently ignore */ })
    }

    return NextResponse.json({
      success: true,
      data: {
        products:      uniqueProducts,
        categories:    matchedCategories,
        aiParsed:      searchMode === 'ai_intent',
        intentFeedback,
      },
    })
  } catch (error) {
    logger.error('[SEARCH_ERROR]', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process search' },
      { status: 500 }
    )
  }
}
