import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { parseSearchIntent } from '@/lib/services/ai/intent-parser';
import { logger } from '@/lib/utils/logger';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';

    if (!query || query.length < 2) {
      return NextResponse.json({ success: true, data: { products: [], categories: [] } });
    }

    logger.request('GET /api/search', { query });

    // 1. Basic Keyword Search (Concurrent)
    const basicSearchPromise = db.product.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { tags: { has: query } },
        ],
        isActive: true,
      },
      include: {
        images: { where: { isPrimary: true }, take: 1 },
        category: { select: { name: true, slug: true } },
      },
      take: 6,
    });

    const categorySearchPromise = db.category.findMany({
      where: {
        name: { contains: query, mode: 'insensitive' },
        isActive: true,
      },
      select: { name: true, slug: true, parentId: true },
      take: 4,
    });

    // 2. Conditional AI Intent Search
    let aiFilters = null;
    if (query.length > 10) {
      try {
        aiFilters = await parseSearchIntent(query);
        logger.info('AI Intent Parsed', { query, aiFilters });
      } catch (err) {
        logger.error('AI Intent Parsing Failed', err);
      }
    }

    let aiProducts: any[] = [];
    if (aiFilters && Object.keys(aiFilters).length > 0) {
      const aiWhere: any = {
        isActive: true,
        ...(aiFilters.category && { category: { name: { contains: aiFilters.category, mode: 'insensitive' } } }),
        ...(aiFilters.subCategory && { category: { name: { contains: aiFilters.subCategory, mode: 'insensitive' } } }),
        ...(aiFilters.minPrice !== undefined && { basePrice: { gte: aiFilters.minPrice } }),
        ...(aiFilters.maxPrice !== undefined && { basePrice: { lte: aiFilters.maxPrice } }),
        ...(aiFilters.isFeatured !== undefined && { isFeatured: aiFilters.isFeatured }),
        // Colors/Sizes handling would require variant sub-queries
      };

      aiProducts = await db.product.findMany({
        where: aiWhere,
        include: {
          images: { where: { isPrimary: true }, take: 1 },
          category: { select: { name: true, slug: true } },
        },
        take: 6,
      });
    }

    const [basicProducts, matchedCategories] = await Promise.all([
      basicSearchPromise,
      categorySearchPromise,
    ]);

    // Merge and Deduplicate Results
    const allProducts = [...basicProducts, ...aiProducts];
    const uniqueProducts = Array.from(new Map(allProducts.map(p => [p.id, p])).values()).slice(0, 8);

    return NextResponse.json({
      success: true,
      data: {
        products: uniqueProducts,
        categories: matchedCategories,
        aiParsed: !!aiFilters,
        intentFeedback: aiFilters ? `Showing results for: ${Object.values(aiFilters).filter(v => typeof v === 'string').join(', ')}` : null,
      },
    });
  } catch (error) {
    logger.error('[SEARCH_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Failed to process search' }, { status: 500 });
  }
}
