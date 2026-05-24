import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { logger } from '@/lib/utils/logger'

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    let country = url.searchParams.get('country')?.toLowerCase()

    if (!country) {
      const host = req.headers.get('host') || ''
      if (host.includes('.co.uk') || host.includes('uk.')) {
        country = 'uk'
      } else if (process.env.NEXT_PUBLIC_SITE_COUNTRY) {
        country = process.env.NEXT_PUBLIC_SITE_COUNTRY.toLowerCase()
      } else {
        country = 'pk'
      }
    }

    let settings = await db.siteSettings.findUnique({
      where: { id: country }
    })

    if (!settings) {
      // Fallback to global
      settings = await db.siteSettings.findUnique({
        where: { id: 'global' }
      })
    }

    if (!settings) {
      // Fallback to any first row
      settings = await db.siteSettings.findFirst()
    }

    if (!settings) {
      return NextResponse.json(
        { success: false, error: 'Site settings not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: settings })
  } catch (error) {
    logger.error('Failed to fetch site settings', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
