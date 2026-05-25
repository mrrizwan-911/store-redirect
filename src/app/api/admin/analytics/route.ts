import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/utils/adminAuth'
import { logger } from '@/lib/utils/logger'
import {
  getKpiSummary,
  getRevenueSeries,
  getOrdersAnalytics,
  getProductAnalytics,
  getCustomerAnalytics,
  getCategoryPerformance,
  getAbandonedCartStats,
} from '@/lib/services/admin/analytics'

/**
 * GET /api/admin/analytics
 *
 * Main analytics endpoint. Returns comprehensive dashboard data by calling
 * individual analytics services in parallel and aggregating results.
 *
 * Query Parameters:
 *   - startDate: YYYY-MM-DD (default: 30 days ago)
 *   - endDate: YYYY-MM-DD (default: today)
 *   - period: '7days' | '30days' | '90days' | 'all-time' (default: '30days')
 *   - region: country code (optional, e.g., 'PK', 'UK')
 *
 * Response:
 *   {
 *     success: true,
 *     data: {
 *       kpis: { ... },
 *       revenue: { series: [ ... ], total: 0 },
 *       orders: { byStatus: { ... }, total: 0 },
 *       products: { top: [ ... ], lowStock: [ ... ] },
 *       customers: { new: 0, total: 0, byTier: { ... } },
 *       categories: [ ... ],
 *       abandonedCarts: { count: 0, totalValue: 0, recoveryRate: 0 }
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
    const region = searchParams.get('region')

    logger.request('GET /api/admin/analytics', { startDateParam, endDateParam, period, region })

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

    // Calculate comparison period
    const periodLength = endDate.getTime() - startDate.getTime()
    const compareStart = new Date(startDate.getTime() - periodLength)
    const compareEnd = new Date(startDate.getTime() - 1)

    // Fetch all analytics data in parallel
    const [kpis, revenueSeries, orderStatus, products, customers, categories, abandonedCarts] = await Promise.all([
      getKpiSummary({ startDate, endDate, compareStart, compareEnd, region: region || undefined }),
      getRevenueSeries({ startDate, endDate, granularity: 'day', region: region || undefined }),
      getOrdersAnalytics({ startDate, endDate, region: region || undefined }),
      getProductAnalytics({ startDate, endDate }),
      getCustomerAnalytics({ startDate, endDate }),
      getCategoryPerformance({ startDate, endDate, region: region || undefined }),
      getAbandonedCartStats(region || undefined),
    ])

    return NextResponse.json({
      success: true,
      data: {
        kpis,
        revenue: revenueSeries,
        orders: orderStatus,
        products,
        customers,
        categories,
        abandonedCarts,
      },
    })
  } catch (error) {
    logger.error('Failed to fetch analytics data:', error)
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
  }
}
