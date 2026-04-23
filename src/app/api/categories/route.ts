import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { logger } from '@/lib/utils/logger'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const rootOnly = searchParams.get('rootOnly') === 'true'
    const parentId = searchParams.get('parentId')

    logger.info('Fetching categories', { rootOnly, parentId })

    const where: any = { isActive: true }

    if (rootOnly) {
      where.parentId = null
    } else if (parentId) {
      where.parentId = parentId
    } else {
      // Default: all active root categories with children nested
      where.parentId = null
    }

    const categories = await db.category.findMany({
      where,
      include: {
        children: {
          where: { isActive: true },
          orderBy: [
            { sortOrder: 'asc' },
            { name: 'asc' }
          ],
          select: {
            id: true,
            name: true,
            slug: true,
            sortOrder: true
          }
        }
      },
      orderBy: [
        { sortOrder: 'asc' },
        { name: 'asc' }
      ]
    })

    return NextResponse.json({
      success: true,
      data: categories
    })
  } catch (error) {
    logger.error('Failed to fetch categories', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}
