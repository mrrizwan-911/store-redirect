import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/utils/adminAuth'
import { getCustomerById } from '@/lib/services/admin/customer'
import { logger } from '@/lib/utils/logger'

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const authResult = await requireAdmin(req)
  if (authResult instanceof NextResponse) return authResult

  try {
    const id = (await context.params).id
    const data = await getCustomerById(id)

    if (!data) {
      return NextResponse.json({ success: false, error: 'Customer not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    logger.error('Customer Detail API error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch customer details' }, { status: 500 })
  }
}
