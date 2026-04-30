import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/utils/adminAuth'
import { getOrdersByStatus } from '@/lib/services/admin/analytics'

export async function GET(req: NextRequest) {
  const authResult = await requireAdmin(req)
  if (authResult instanceof NextResponse) return authResult

  try {
    const data = await getOrdersByStatus()
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Orders by status API error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch order status stats' }, { status: 500 })
  }
}
