import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { requireAdmin } from '@/lib/utils/adminAuth'

const DEFAULT_FILTERS = {
  seasons: ['All Season', 'Summer', 'Winter'],
  occasions: ['Casual', 'Formal', 'Festive'],
  genders: ['Men', 'Women', 'Unisex'],
}

export async function GET(req: NextRequest) {
  const authResult = await requireAdmin(req)
  if (authResult instanceof NextResponse) return authResult

  try {
    const settings = await db.siteSettings.findUnique({ where: { id: 'global' } })

    if (settings && (settings as any).lookbookFilters) {
      const filters = (settings as any).lookbookFilters
      return NextResponse.json({
        success: true,
        data: {
          seasons: Array.isArray(filters.seasons) ? filters.seasons : DEFAULT_FILTERS.seasons,
          occasions: Array.isArray(filters.occasions) ? filters.occasions : DEFAULT_FILTERS.occasions,
          genders: Array.isArray(filters.genders) ? filters.genders : DEFAULT_FILTERS.genders,
        },
      })
    }

    return NextResponse.json({ success: true, data: DEFAULT_FILTERS })
  } catch (error) {
    console.error('Failed to fetch lookbook filters:', error)
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const authResult = await requireAdmin(req)
  if (authResult instanceof NextResponse) return authResult

  try {
    const body = await req.json()

    // Validate structure
    if (
      !Array.isArray(body.seasons) ||
      !Array.isArray(body.occasions) ||
      !Array.isArray(body.genders)
    ) {
      return NextResponse.json(
        { success: false, error: 'Invalid filter structure. Expected { seasons, occasions, genders } arrays.' },
        { status: 400 }
      )
    }

    // Sanitize: trim and remove empty strings, deduplicate
    const sanitize = (arr: any[]) =>
      [...new Set(arr.map((v: any) => String(v).trim()).filter(Boolean))]

    const lookbookFilters = {
      seasons: sanitize(body.seasons),
      occasions: sanitize(body.occasions),
      genders: sanitize(body.genders),
    }

    // Upsert into SiteSettings (lookbookFilters field)
    await db.siteSettings.upsert({
      where: { id: 'global' },
      create: {
        id: 'global',
        lookbookFilters,
      } as any,
      update: {
        lookbookFilters,
      } as any,
    })

    return NextResponse.json({ success: true, data: lookbookFilters })
  } catch (error) {
    console.error('Failed to update lookbook filters:', error)
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
  }
}
