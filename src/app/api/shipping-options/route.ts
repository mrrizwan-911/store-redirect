import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { SITE_COUNTRY } from '@/lib/constants/site'

export async function GET(req: NextRequest) {
  try {
    const requestedCountry = req.nextUrl.searchParams.get('country') || SITE_COUNTRY
    const country = requestedCountry === 'UK' ? 'UK' : requestedCountry === 'GLOBAL' ? 'GLOBAL' : 'PK'

    const options = await db.shippingOption.findMany({
      where: {
        isActive: true,
        countries: { has: country },
      },
      orderBy: { sortOrder: 'asc' },
    })

    return NextResponse.json({ success: true, data: options })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch shipping options' },
      { status: 500 }
    )
  }
}
