import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db/client'
import { logger } from '@/lib/utils/logger'
import { requireAdmin } from '@/lib/utils/adminAuth'
import { sanitizeRichText } from '@/lib/utils/sanitize'

const updateSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  content: z.string().transform((value) => sanitizeRichText(value)).optional(),
  categoryId: z.string().nullable().optional(),
})

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const authResponse = await requireAdmin(req)
  if (authResponse instanceof NextResponse) return authResponse

  try {
    const { id } = await params
    const sizeGuide = await db.sizeGuide.findUnique({
      where: { id },
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
    logger.error('Failed to fetch size guide detail', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch size guide' },
      { status: 500 }
    )
  }
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const authResponse = await requireAdmin(req)
  if (authResponse instanceof NextResponse) return authResponse

  try {
    const { id } = await params
    const body = await req.json()
    const validated = updateSchema.parse(body)

    // 1. Verify guide exists
    const existing = await db.sizeGuide.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Size guide not found' },
        { status: 404 }
      )
    }

    // 2. If categoryId is being changed, check uniqueness
    if (validated.categoryId !== undefined && validated.categoryId !== existing.categoryId) {
      if (validated.categoryId !== null) {
        const categoryGuide = await db.sizeGuide.findUnique({
          where: { categoryId: validated.categoryId },
        })

        if (categoryGuide && categoryGuide.id !== id) {
          return NextResponse.json(
            {
              success: false,
              error: 'This category already has a size guide. Edit the existing one.',
            },
            { status: 400 }
          )
        }

        // Verify category exists
        const categoryExists = await db.category.findUnique({
          where: { id: validated.categoryId },
        })

        if (!categoryExists) {
          return NextResponse.json(
            { success: false, error: 'Category not found' },
            { status: 400 }
          )
        }
      }
    }

    const sizeGuide = await db.sizeGuide.update({
      where: { id },
      data: {
        ...(validated.title !== undefined && { title: validated.title }),
        ...(validated.content !== undefined && { content: validated.content }),
        ...(validated.categoryId !== undefined && { categoryId: validated.categoryId }),
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

    logger.info('Size guide updated', { sizeGuideId: id })

    return NextResponse.json({
      success: true,
      data: sizeGuide,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.issues[0].message },
        { status: 400 }
      )
    }
    logger.error('Failed to update size guide', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update size guide' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const authResponse = await requireAdmin(req)
  if (authResponse instanceof NextResponse) return authResponse

  try {
    const { id } = await params
    await db.sizeGuide.delete({
      where: { id },
    })

    logger.info('Size guide deleted', { sizeGuideId: id })

    return NextResponse.json({
      success: true,
    })
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ success: false, error: 'Size guide not found' }, { status: 404 })
    }
    logger.error('Failed to delete size guide', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete size guide' },
      { status: 500 }
    )
  }
}
