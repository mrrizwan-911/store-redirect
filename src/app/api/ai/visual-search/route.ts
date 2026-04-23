import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { analyzeImage } from '@/lib/services/ai/visual-search';
import { logger } from '@/lib/utils/logger';

export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json();

    if (!image) {
      return NextResponse.json({ success: false, error: 'No image provided' }, { status: 400 });
    }

    logger.request('POST /api/ai/visual-search', { image: image.slice(0, 50) + '...' });

    // 1. Analyze image via AI
    const analysis = await analyzeImage(image);
    logger.info('Visual Search Analysis', analysis);

    // 2. Perform database search based on analysis
    const where: any = {
      isActive: true,
      OR: [
        // Match by category
        ...(analysis.category ? [{ category: { name: { contains: analysis.category, mode: 'insensitive' } } }] : []),
        // Match by subcategory
        ...(analysis.subCategory ? [{ category: { name: { contains: analysis.subCategory, mode: 'insensitive' } } }] : []),
        // Fuzzy match by description keywords
        ...(analysis.description ? [
          { name: { contains: analysis.description, mode: 'insensitive' } },
          { description: { contains: analysis.description, mode: 'insensitive' } }
        ] : []),
      ],
    };

    const products = await db.product.findMany({
      where,
      include: {
        images: { where: { isPrimary: true }, take: 1 },
        category: { select: { name: true, slug: true } },
      },
      take: 12,
    });

    return NextResponse.json({
      success: true,
      data: {
        products,
        analysis: {
          category: analysis.category,
          subCategory: analysis.subCategory,
          colors: analysis.colors,
          detected: analysis.description,
        },
      },
    });
  } catch (error) {
    logger.error('[VISUAL_SEARCH_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Failed to process visual search' }, { status: 500 });
  }
}
