import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { requireAdmin } from '@/lib/utils/adminAuth'
import { logger } from '@/lib/utils/logger'
import { getKpiSummary, getOrdersAnalytics, getProductAnalytics } from '@/lib/services/admin/analytics'

/**
 * GET /api/admin/dashboard
 *
 * Main dashboard entry point. Returns aggregated KPI data for the analytics overview.
 * This endpoint serves as the primary data source for the admin dashboard header cards
 * and can pre-load initial dashboard state.
 *
 * Query Parameters:
 *   - startDate: YYYY-MM-DD (default: 30 days ago)
 *   - endDate: YYYY-MM-DD (default: today)
 *   - period: '7days' | '30days' | '90days' | 'all-time' (default: '30days')
 *
 * Response:
 *   {
 *     success: true,
 *     data: {
 *       kpis: { revenue, orders, customers, newCustomers, avgOrderValue },
 *       topProducts: [{ id, name, revenue, orders }, ...],
 *       orderStatus: { PENDING, CONFIRMED, SHIPPED, DELIVERED },
 *       paymentMethods: { JAZZCASH, EASYPAISE, COD, CARD, BANK_TRANSFER }
 *     }
 *   }
 */
export async function GET(req: NextRequest) {
  const authResult = await requireAdmin(req)
  if (authResult instanceof NextResponse) return authResult

  try {
    const { searchParams } = new URL(req.url)
    const startDateParam = searchParams.get('startDate')
    const endDateParam = searchParams.get('endDate')
    const period = searchParams.get('period') || '30days'

    logger.request('GET /api/admin/dashboard', { startDateParam, endDateParam, period })

    // Calculate date ranges
    const today = new Date()
    today.setHours(23, 59, 59, 999)

    let startDate = startDateParam ? new Date(startDateParam) : new Date()
    let endDate = endDateParam ? new Date(endDateParam) : today

    if (!startDateParam) {
      switch (period) {
        case '7days':
          startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case '30days':
        default:
          startDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
        case '90days':
          startDate = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000)
          break
        case 'all-time':
          startDate = new Date('2020-01-01')
          break
      }
    }

    // Calculate comparison period (same length, previous period)
    const periodLength = endDate.getTime() - startDate.getTime()
    const compareStart = new Date(startDate.getTime() - periodLength)
    const compareEnd = new Date(startDate.getTime() - 1)

    // Fetch dashboard data in parallel
    const [kpis, ordersByStatus, products] = await Promise.all([
      getKpiSummary({ startDate, endDate, compareStart, compareEnd }),
      getOrdersAnalytics({ startDate, endDate }),
      getProductAnalytics({ startDate, endDate }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        kpis,
        topProducts: products.topProducts.slice(0, 5),
        orderStatus: ordersByStatus.byStatus,
      },
    })
  } catch (error) {
    logger.error('Failed to fetch dashboard data:', error)
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
  }
}
