import { NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { logger } from '@/lib/utils/logger'

export async function GET() {
  try {
    const settings = await db.siteSettings.findUnique({
      where: { id: 'global' }
    })

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
