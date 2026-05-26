import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db/client'
import { logger } from '@/lib/utils/logger'
import { requireAdmin } from '@/lib/utils/adminAuth'
import { sanitizeRichText } from '@/lib/utils/sanitize'

const createSchema = z.object({
  title: z.string().min(1).max(100),
  content: z.string().default('').transform((value) => sanitizeRichText(value)),
  categoryId: z.string().optional().nullable(),
})

export async function GET(req: NextRequest) {
  const authResponse = await requireAdmin(req)
  if (authResponse instanceof NextResponse) return authResponse

  try {
    const sizeGuides = await db.sizeGuide.findMany({
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    })

    return NextResponse.json({
      success: true,
      data: sizeGuides,
    })
  } catch (error) {
    logger.error('Failed to fetch admin size guides', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch size guides' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  const authResponse = await requireAdmin(req)
  if (authResponse instanceof NextResponse) return authResponse

  try {
    const body = await req.json()
    const validated = createSchema.parse(body)

    if (validated.categoryId) {
      // 1. Verify category exists
      const category = await db.category.findUnique({
        where: { id: validated.categoryId },
      })

      if (!category) {
        return NextResponse.json(
          { success: false, error: 'Category not found' },
          { status: 400 }
        )
      }

      // 2. Check if category already has a size guide
      const existingGuide = await db.sizeGuide.findUnique({
        where: { categoryId: validated.categoryId },
      })

      if (existingGuide) {
        return NextResponse.json(
          {
            success: false,
            error: 'This category already has a size guide. Edit the existing one.',
          },
          { status: 400 }
        )
      }
    }

    const sizeGuide = await db.sizeGuide.create({
      data: {
        title: validated.title,
        content: validated.content,
        categoryId: validated.categoryId || null,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    })

    logger.info('Size guide created', { sizeGuideId: sizeGuide.id })

    return NextResponse.json(
      {
        success: true,
        data: sizeGuide,
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.issues[0].message },
        { status: 400 }
      )
    }
    logger.error('Failed to create size guide', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create size guide' },
      { status: 500 }
    )
  }
}
