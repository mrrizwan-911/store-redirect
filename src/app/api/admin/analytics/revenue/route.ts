import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/utils/adminAuth'
import { getRevenueStats } from '@/lib/services/admin/analytics'

export async function GET(req: NextRequest) {
  const authResult = await requireAdmin(req)
  if (authResult instanceof NextResponse) return authResult

  try {
    const data = await getRevenueStats()
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Revenue analytics API error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch revenue stats' }, { status: 500 })
  }
}
