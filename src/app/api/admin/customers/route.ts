import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/utils/adminAuth'
import { getCustomers } from '@/lib/services/admin/customer'
import { logger } from '@/lib/utils/logger'

export async function GET(req: NextRequest) {
  const authResult = await requireAdmin(req)
  if (authResult instanceof NextResponse) return authResult

  const searchParams = req.nextUrl.searchParams
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const search = searchParams.get('search') || undefined
  const country = searchParams.get('country') || undefined

  try {
    const data = await getCustomers({ page, limit, search, country })
    return NextResponse.json({ success: true, data })
  } catch (error) {
    logger.error('Customers API error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch customers' }, { status: 500 })
  }
}
