import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db/client'
import { logger } from '@/lib/utils/logger'
import { requireAdmin } from '@/lib/utils/adminAuth'

const createSchema = z.object({
  name: z.string().min(2),
  parentId: z.string().optional().nullable(),
  description: z.string().optional(),
  sortOrder: z.number().optional(),
  isActive: z.boolean().optional()
})

export async function GET(req: NextRequest) {
  const authResponse = await requireAdmin(req)
  if (authResponse instanceof NextResponse) return authResponse

  try {
    const categories = await db.category.findMany({
      include: {
        children: {
          orderBy: [
            { sortOrder: 'asc' },
            { name: 'asc' }
          ],
          include: {
            _count: {
              select: { products: true }
            }
          }
        },
        _count: {
          select: { products: true }
        }
      },
      where: {
        parentId: null
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
    logger.error('Failed to fetch admin categories', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch categories' },
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

    // Slug generation
    let baseSlug = validated.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

    let slug = baseSlug
    let counter = 2

    while (true) {
      const existing = await db.category.findUnique({
        where: { slug }
      })
      if (!existing) break
      slug = `${baseSlug}-${counter}`
      counter++
    }

    const category = await db.category.create({
      data: {
        name: validated.name,
        slug,
        parentId: validated.parentId || null,
        description: validated.description,
        sortOrder: validated.sortOrder || 0,
        isActive: validated.isActive ?? true
      }
    })

    logger.info('Category created', { categoryId: category.id, slug })

    return NextResponse.json({
      success: true,
      data: category
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.issues[0].message },
        { status: 400 }
      )
    }
    logger.error('Failed to create category', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create category' },
      { status: 500 }
    )
  }
}
