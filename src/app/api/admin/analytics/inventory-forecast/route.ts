import { NextResponse } from 'next/server'
import { getInventoryForecast } from '@/lib/services/ai/demand-forecast'
import { logger } from '@/lib/utils/logger'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const forecast = await getInventoryForecast()
    return NextResponse.json({ success: true, data: forecast })
  } catch (error) {
    logger.error('Failed to fetch inventory forecast', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
