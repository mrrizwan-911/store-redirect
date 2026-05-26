import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/utils/adminAuth'
import { getKpiSummary } from '@/lib/services/admin/analytics'
import { logger } from '@/lib/utils/logger'

function parseDate(value: string | null, fallback: Date) {
  if (!value) return fallback
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? fallback : parsed
}

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (auth instanceof NextResponse) return auth

  try {
    const params = req.nextUrl.searchParams
    const now = new Date()
    const defaultStart = new Date(now)
    defaultStart.setDate(defaultStart.getDate() - 30)
    const defaultCompareStart = new Date(defaultStart)
    defaultCompareStart.setDate(defaultCompareStart.getDate() - 30)

    const startDate = parseDate(params.get('startDate'), defaultStart)
    const endDate = parseDate(params.get('endDate'), now)
    const compareStart = parseDate(params.get('compareStart'), defaultCompareStart)
    const compareEnd = parseDate(params.get('compareEnd'), defaultStart)
    const region = params.get('region') || params.get('country') || 'all'

    const data = await getKpiSummary({ startDate, endDate, compareStart, compareEnd, region })
    return NextResponse.json({ success: true, data })
  } catch (error) {
    logger.error('Failed to fetch KPI summary', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch KPI summary' }, { status: 500 })
  }
}
