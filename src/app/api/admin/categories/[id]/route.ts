import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db/client'
import { logger } from '@/lib/utils/logger'
import { requireAdmin } from '@/lib/utils/adminAuth'

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional().nullable(),
  sortOrder: z.number().optional(),
  isActive: z.boolean().optional(),
  parentId: z.string().optional().nullable()
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResponse = await requireAdmin(req)
  if (authResponse instanceof NextResponse) return authResponse

  try {
    const { id } = await params
    const body = await req.json()
    const validated = updateSchema.parse(body)

    const category = await db.category.findUnique({
      where: { id }
    })

    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      )
    }

    // Protection check
    if (category.isProtected && validated.name && validated.name !== category.name) {
      return NextResponse.json(
        { success: false, error: 'Cannot rename a protected category' },
        { status: 403 }
      )
    }

    let slug = category.slug
    if (validated.name && validated.name !== category.name && !category.isProtected) {
      // Slug generation
      let baseSlug = validated.name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')

      slug = baseSlug
      let counter = 2

      while (true) {
        const existing = await db.category.findFirst({
          where: {
            slug,
            NOT: { id }
          }
        })
        if (!existing) break
        slug = `${baseSlug}-${counter}`
        counter++
      }
    }

    const updated = await db.category.update({
      where: { id },
      data: {
        ...validated,
        slug
      }
    })

    logger.info('Category updated', { categoryId: id, slug })

    return NextResponse.json({
      success: true,
      data: updated
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.issues[0].message },
        { status: 400 }
      )
    }
    logger.error('Failed to update category', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update category' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResponse = await requireAdmin(req)
  if (authResponse instanceof NextResponse) return authResponse

  try {
    const { id } = await params

    const category = await db.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            products: true,
            children: true
          }
        }
      }
    })

    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      )
    }

    // Protection check
    if (category.isProtected) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete a protected category' },
        { status: 403 }
      )
    }

    // Children check
    if (category._count.children > 0) {
      return NextResponse.json(
        { success: false, error: 'Delete subcategories first' },
        { status: 400 }
      )
    }

    // Products check
    if (category._count.products > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Reassign or delete the ${category._count.products} products in this category first`
        },
        { status: 400 }
      )
    }

    await db.category.delete({
      where: { id }
    })

    logger.info('Category deleted', { categoryId: id })

    return NextResponse.json({
      success: true,
      message: 'Category deleted successfully'
    })
  } catch (error) {
    logger.error('Failed to delete category', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete category' },
      { status: 500 }
    )
  }
}
