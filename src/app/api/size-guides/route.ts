import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { logger } from '@/lib/utils/logger'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const categoryId = searchParams.get('categoryId')
    const title = searchParams.get('title')

    if (!categoryId && !title) {
      return NextResponse.json(
        { success: false, error: 'Category ID or Title is required' },
        { status: 400 }
      )
    }

    const sizeGuide = await db.sizeGuide.findFirst({
      where: {
        OR: [
          ...(categoryId ? [{ categoryId }] : []),
          ...(title ? [{ title: { contains: title, mode: 'insensitive' as const } }] : []),
        ],
      },
      select: {
        id: true,
        title: true,
        content: true,
        updatedAt: true,
      }
    })

    if (!sizeGuide) {
      return NextResponse.json(
        { success: false, error: 'Size guide not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: sizeGuide,
    })
  } catch (error) {
    logger.error('Failed to fetch public size guide', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch size guide' },
      { status: 500 }
    )
  }
}
