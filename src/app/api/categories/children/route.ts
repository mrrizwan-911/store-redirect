import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'

/**
 * GET /api/categories/children?parentSlug=<slug>
 *
 * Returns the active children of the category identified by `parentSlug`.
 * Used by the filter component to load sub-categories on demand.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const parentSlug = searchParams.get('parentSlug')

  if (!parentSlug) {
    return NextResponse.json(
      { success: false, error: 'parentSlug is required' },
      { status: 400 }
    )
  }

  try {
    const parent = await db.category.findUnique({
      where: { slug: parentSlug, isActive: true },
      select: { id: true },
    })

    if (!parent) {
      return NextResponse.json(
        { success: false, error: 'Parent category not found' },
        { status: 404 }
      )
    }

    const children = await db.category.findMany({
      where: { parentId: parent.id, isActive: true },
      select: { id: true, name: true, slug: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    })

    return NextResponse.json({ success: true, data: children })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
